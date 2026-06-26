/**
 * Dependency injection container for Códice.
 *
 * Wires adapters, domain services, and use cases
 * into a single Dependencies object.
 */

import type { IUserPrompt } from "../application/ports/IUserPrompt";
import { CleanInstallUseCase } from "../application/use-cases/CleanInstallUseCase";
import { ProjectInstallUseCase } from "../application/use-cases/ProjectInstallUseCase";
import { UpdateWorkspaceUseCase } from "../application/use-cases/UpdateWorkspaceUseCase";
import type { IFileSystem } from "../domain/ports/IFileSystem";
import { FileMergeEngine } from "../domain/services/FileMergeEngine";
import { VersionComparator } from "../domain/services/VersionComparator";
import { BunFileSystem } from "../infrastructure/adapters/BunFileSystem";
import { BunSymlinkCreator } from "../infrastructure/adapters/BunSymlinkCreator";
import { ClackPromptsAdapter } from "../infrastructure/adapters/ClackPromptsAdapter";
import { GitHubRestClient } from "../infrastructure/adapters/GitHubRestClient";
import { DEVIN_SYMLINKS, OPENCODE_SYMLINKS } from "../infrastructure/config/symlinks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Wired application dependencies.
 *
 * Uses port interfaces (IFileSystem, IUserPrompt) rather than concrete
 * adapter types, preserving Clean Architecture's Dependency Inversion
 * Principle — consumers depend on abstractions, not implementations.
 */
export interface Dependencies {
	readonly fileSystem: IFileSystem;
	readonly userPrompt: IUserPrompt;
	readonly cleanInstall: CleanInstallUseCase;
	readonly projectInstall: ProjectInstallUseCase;
	readonly updateWorkspace: UpdateWorkspaceUseCase;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Wire all application dependencies.
 * Creates adapters, domain services, and use cases.
 *
 * @param destinationPath - Target directory for installation (default: cwd).
 * @returns Wired Dependencies container.
 */
export function createDependencies(destinationPath?: string): Dependencies {
	const fileSystem = new BunFileSystem(undefined, destinationPath);
	const gitHubClient = new GitHubRestClient();
	const userPrompt = new ClackPromptsAdapter();
	const mergeEngine = new FileMergeEngine(fileSystem);
	const versionComparator = new VersionComparator();
	// Clean install copies everything including optional .devin/ → all 10 symlinks
	const destRoot = destinationPath ?? process.cwd();
	const symlinkCreator = new BunSymlinkCreator(destRoot);
	const allSymlinks = [...OPENCODE_SYMLINKS, ...DEVIN_SYMLINKS];

	const cleanInstall = new CleanInstallUseCase(
		fileSystem,
		mergeEngine,
		userPrompt,
		symlinkCreator,
		allSymlinks,
	);
	const projectInstall = new ProjectInstallUseCase(
		fileSystem,
		mergeEngine,
		userPrompt,
		symlinkCreator,
		OPENCODE_SYMLINKS,
		DEVIN_SYMLINKS,
	);
	const updateWorkspace = new UpdateWorkspaceUseCase(
		fileSystem,
		mergeEngine,
		userPrompt,
		gitHubClient,
		versionComparator,
	);

	return {
		fileSystem,
		userPrompt,
		cleanInstall,
		projectInstall,
		updateWorkspace,
	};
}
