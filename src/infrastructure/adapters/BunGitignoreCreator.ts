import * as fs from "node:fs";
import * as path from "node:path";
import type { IGitignoreCreator } from "../../application/ports/IGitignoreCreator";
import {
	type GitignoreError,
	gitignoreReadError,
	gitignoreTemplateNotFoundError,
	gitignoreWriteError,
} from "../../domain/types/GitignoreError";
import type { Result } from "../../domain/types/Result";
import { failure, success } from "../../domain/types/Result";
import { isErrnoException } from "./errorTypeGuards";
import { isPathWithin } from "./pathResolver";
import { VerboseLogger } from "./VerboseLogger";

const fsPromises = fs.promises;

/**
 * Bun-based gitignore generator adapter.
 *
 * npm hard-excludes `.gitignore` files from packages. To work around this,
 * the template file is named `gitignore` (no dot prefix) and this adapter
 * generates the actual `.gitignore` file post-installation.
 *
 * Idempotent: if `.gitignore` already exists (file or symlink), skip.
 * Safe: real directories at `.gitignore` path are skipped with a warning.
 * Path containment: validates that destPath stays within workspaceRoot for
 *   defense-in-depth, consistent with BunSymlinkCreator's pattern.
 */
export class BunGitignoreCreator implements IGitignoreCreator {
	private readonly workspaceRoot: string;

	private readonly templatePath: string;

	private readonly logger: VerboseLogger;

	/**
	 * @param workspaceRoot - Absolute path to the workspace root directory.
	 *                        destPath in createGitignore is validated against
	 *                        this root for path containment (defense-in-depth).
	 * @param templatePath - Absolute path to the template estandar directory
	 *                       containing the `gitignore` file.
	 * @param verbose - Verbose logger or legacy boolean flag (backward compat).
	 */
	constructor(workspaceRoot: string, templatePath: string, verbose?: VerboseLogger | boolean) {
		this.workspaceRoot = path.resolve(workspaceRoot);
		this.templatePath = templatePath;
		this.logger = verbose instanceof VerboseLogger ? verbose : new VerboseLogger(verbose ?? false);
	}

	/**
	 * Generate the .gitignore file in the destination directory.
	 *
	 * Reads `gitignore` (no dot) from the template directory and writes
	 * it to `destPath/.gitignore`. If the file already exists, skip.
	 * Path containment is validated against the injected workspaceRoot.
	 */
	async createGitignore(destPath: string): Promise<Result<void, GitignoreError>> {
		const resolvedDest = path.resolve(destPath);

		// Defense-in-depth: ensure resolved destination stays within workspace root.
		// This complements the CLI-level validateDestPath() guard, mirroring the
		// containment pattern in BunSymlinkCreator. The root itself is allowed
		// (gitignore may target the workspace root directly).
		if (resolvedDest !== this.workspaceRoot && !isPathWithin(this.workspaceRoot, resolvedDest)) {
			return failure(
				gitignoreWriteError(
					resolvedDest,
					`Destination path escapes workspace root: "${resolvedDest}" is outside "${this.workspaceRoot}"`,
				),
			);
		}

		// Resolve template file path
		const templateFile = path.join(this.templatePath, "gitignore");

		// Skip if .gitignore already exists in destination (idempotent)
		const destGitignore = path.join(resolvedDest, ".gitignore");
		try {
			const stat = await fsPromises.lstat(destGitignore);

			if (stat.isDirectory()) {
				// biome-ignore lint/suspicious/noConsole: diagnostic output for anomalous condition
				console.warn(`[warn] Skipping .gitignore creation: ${destGitignore} is a real directory.`);
			}

			// File, symlink, or directory already exists — idempotent, skip
			return success(undefined);
		} catch (error) {
			// ENOENT means the path does not exist — proceed to create it.
			// Any other error — including non-Errno shapes — propagates
			// (fail closed, matching the original guard).
			if (!isErrnoException(error) || error.code !== "ENOENT") {
				return failure(
					gitignoreWriteError(
						resolvedDest,
						`Failed to check .gitignore path: ${error instanceof Error ? error.message : String(error)}`,
					),
				);
			}
		}

		// Read template gitignore file
		let content: string;
		try {
			content = await Bun.file(templateFile).text();
		} catch (error) {
			// Check if the template dir itself is missing (better error message)
			try {
				await fsPromises.access(this.templatePath, fs.constants.F_OK);
			} catch {
				return failure(gitignoreTemplateNotFoundError(resolvedDest, this.templatePath));
			}

			const nodeErr = isErrnoException(error) ? error : undefined;
			const msg =
				nodeErr?.code === "ENOENT"
					? `Template gitignore file not found at: ${templateFile}`
					: `Failed to read template gitignore: ${nodeErr?.message ?? String(error)}`;
			return failure(gitignoreReadError(resolvedDest, msg));
		}

		// Write to destPath/.gitignore
		try {
			await Bun.write(destGitignore, content);
		} catch (error) {
			const nodeError = isErrnoException(error) ? error : undefined;
			return failure(
				gitignoreWriteError(
					resolvedDest,
					`Failed to write .gitignore: ${nodeError?.message ?? String(error)}`,
				),
			);
		}

		this.logger.log("gitignore", `Created .gitignore (${content.length} bytes) from template.`);

		return success(undefined);
	}
}
