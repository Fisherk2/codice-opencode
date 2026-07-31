/**
 * Shared post-installation steps for Clean Install and Project Install modes.
 *
 * Extracts duplicated orchestration of:
 * - .gitignore generation (graceful on failure)
 * - .opencode/ symlink creation (always)
 * - .codice-version file write
 *
 * Both modes share the exact same sequence; the only differences
 * are the success message and whether the symlink warning includes
 * a "Re-run the installer" hint (Clean Install sets retryHint=true).
 */

import type { IFileSystem } from "../domain/ports/IFileSystem";
import type { IStagingSystem } from "../domain/ports/IStagingSystem";
import type { Result } from "../domain/types/Result";
import { writeVersionFileSafe } from "./helpers";
import type { IGitignoreCreator } from "./ports/IGitignoreCreator";
import type { ISymlinkCreator, SymlinkSpec } from "./ports/ISymlinkCreator";
import type { IUserPrompt } from "./ports/IUserPrompt";

/**
 * Create a .gitignore file from the template, showing a warning on failure.
 *
 * Shared across use cases to avoid duplicating the gitignore guard pattern:
 *   createGitignore → if not ok → showWarning with actionable message
 *
 * @param gitignoreCreator - Adapter for .gitignore generation.
 * @param prompt - Adapter for user-facing warnings.
 * @param destinationPath - Target directory passed to the gitignore creator adapter.
 */
export async function createGitignoreSafe(
	gitignoreCreator: IGitignoreCreator,
	prompt: IUserPrompt,
	destinationPath: string,
): Promise<void> {
	const gitignoreResult = await gitignoreCreator.createGitignore(destinationPath);
	if (!gitignoreResult.ok) {
		prompt.showWarning(
			`Could not generate .gitignore: ${gitignoreResult.error.message}. ` +
				"The workspace was installed successfully. " +
				"Create a .gitignore file manually or re-run the installer. " +
				"Run with --verbose for details.",
		);
	}
}

/**
 * Create symlinks and display a warning on failure.
 *
 * Shared across use cases to avoid duplicating the symlink guard pattern:
 *   createSymlinks → if not ok → showWarning with label
 *
 * @param symlinkCreator - Adapter for symlink generation.
 * @param prompt - Adapter for user-facing warnings.
 * @param symlinks - Array of symlink specs to create.
 * @param label - Directory label for the warning message (e.g. "opencode", "devin").
 * @param retryHint - If true, appends "Re-run the installer to retry symlink creation."
 */
export async function createSymlinksWithWarning(
	symlinkCreator: ISymlinkCreator,
	prompt: IUserPrompt,
	symlinks: readonly SymlinkSpec[],
	label: string,
	retryHint?: boolean,
): Promise<void> {
	const result = await symlinkCreator.createSymlinks(symlinks);
	if (!result.ok) {
		const message =
			`Some .${label}/ symlinks could not be created (${result.error.length} failures). ` +
			"The workspace was installed successfully." +
			(retryHint ? " Re-run the installer to retry symlink creation." : "") +
			" Run with --verbose for details.";
		prompt.showWarning(message);
	}
}

/**
 * Options for {@link runPostInstallSteps}.
 */
export interface PostInstallOptions {
	readonly fileSystem: IFileSystem & IStagingSystem;
	readonly gitignoreCreator: IGitignoreCreator;
	readonly symlinkCreator: ISymlinkCreator;
	readonly userPrompt: IUserPrompt;
	readonly opencodeSymlinks: readonly SymlinkSpec[];
	readonly destinationPath: string;
	readonly selectedOptionals: readonly string[];
	readonly version?: string;
	readonly operationLabel: string;
	readonly successMessage: string;
	/** If true, appends retry hint to opencode symlink warning. Only Clean Install sets this. */
	readonly retryHint?: boolean;
}

/**
 * Shared post-installation steps for Clean Install and Project Install modes.
 *
 * Both modes follow the same sequence after a successful merge:
 * 1. Generate .gitignore from template (graceful on failure).
 * 2. Create .opencode/{agents,commands,skills} symlinks (always).
 * 3. Write .codice-version file with version + optional selections.
 *
 * Each step emits a logProgressEvent AFTER the operation completes, so the
 * log reflects actual results — not predicted intent.
 *
 * @returns Result indicating success (version written) or failure (version write error).
 */
export async function runPostInstallSteps(
	options: PostInstallOptions,
): Promise<Result<void, Error>> {
	const {
		fileSystem,
		gitignoreCreator,
		symlinkCreator,
		userPrompt,
		opencodeSymlinks,
		destinationPath,
		selectedOptionals,
		version,
		operationLabel,
		successMessage,
		retryHint,
	} = options;

	// Step 1: Generate .gitignore from template (graceful on failure)
	await createGitignoreSafe(gitignoreCreator, userPrompt, destinationPath);
	userPrompt.logProgressEvent("gitignore: Generated .gitignore");

	// Step 2: Create .opencode/ symlinks always
	await createSymlinksWithWarning(
		symlinkCreator,
		userPrompt,
		opencodeSymlinks,
		"opencode",
		retryHint,
	);
	for (const spec of opencodeSymlinks) {
		userPrompt.logProgressEvent(`symlink: Created ${spec.linkPath}`);
	}

	// Step 3: Write version file with optionalSelections recorded
	const versionResult = await writeVersionFileSafe(
		fileSystem,
		{
			installedVersion: version ?? "0.0.0",
			installedAt: new Date().toISOString(),
			optionalSelections: selectedOptionals,
		},
		operationLabel,
	);

	if (versionResult.ok) {
		userPrompt.showSuccess(successMessage);
	}

	return versionResult;
}
