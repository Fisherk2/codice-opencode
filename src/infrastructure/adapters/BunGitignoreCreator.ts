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

	private readonly verbose: boolean;

	/**
	 * @param workspaceRoot - Absolute path to the workspace root directory.
	 *                        destPath in createGitignore is validated against
	 *                        this root for path containment (defense-in-depth).
	 * @param templatePath - Absolute path to the template estandar directory
	 *                       containing the `gitignore` file.
	 * @param verbose - Enable verbose logging to stderr.
	 */
	constructor(workspaceRoot: string, templatePath: string, verbose?: boolean) {
		this.workspaceRoot = path.resolve(workspaceRoot);
		this.templatePath = templatePath;
		this.verbose = verbose ?? false;
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
		// containment pattern in BunSymlinkCreator.
		const rootWithSep = this.workspaceRoot.endsWith(path.sep)
			? this.workspaceRoot
			: `${this.workspaceRoot}${path.sep}`;
		if (resolvedDest !== this.workspaceRoot && !resolvedDest.startsWith(rootWithSep)) {
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
			const err = error as NodeJS.ErrnoException;
			if (err.code !== "ENOENT") {
				return failure(
					gitignoreWriteError(resolvedDest, `Failed to check .gitignore path: ${err.message}`),
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

			const nodeErr = error as NodeJS.ErrnoException;
			const msg =
				nodeErr.code === "ENOENT"
					? `Template gitignore file not found at: ${templateFile}`
					: `Failed to read template gitignore: ${nodeErr.message}`;
			return failure(gitignoreReadError(resolvedDest, msg));
		}

		// Write to destPath/.gitignore
		try {
			await Bun.write(destGitignore, content);
		} catch (error) {
			const nodeError = error as NodeJS.ErrnoException;
			return failure(
				gitignoreWriteError(resolvedDest, `Failed to write .gitignore: ${nodeError.message}`),
			);
		}

		if (this.verbose) {
			// biome-ignore lint/suspicious/noConsole: verbose diagnostic output
			console.warn(`[info] Created .gitignore (${content.length} bytes) from template.`);
		}

		return success(undefined);
	}
}
