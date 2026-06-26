import * as fs from "node:fs";
import * as path from "node:path";
import type { ISymlinkCreator, SymlinkSpec } from "../../application/ports/ISymlinkCreator";
import type { Result } from "../../domain/types/Result";
import { failure, success } from "../../domain/types/Result";
import { type SymlinkError, symlinkError } from "../../domain/types/SymlinkError";

const fsPromises = fs.promises;

/**
 * BunFileSystem-based symlink creator.
 *
 * Creates symbolic links in the target workspace using async `fs.promises` APIs.
 * All paths are resolved relative to the workspace root for portability.
 *
 * Idempotent: existing symlinks are not overwritten (including broken symlinks).
 * Safe: real directories at the link path are skipped (not replaced).
 * Secure: paths are verified to stay within the workspace root.
 */
export class BunSymlinkCreator implements ISymlinkCreator {
	private readonly workspaceRoot: string;

	/**
	 * @param workspaceRoot - Absolute path to the workspace root directory.
	 *                        Symlinks are created relative to this path.
	 */
	constructor(workspaceRoot: string) {
		this.workspaceRoot = path.resolve(workspaceRoot);

		// Verify the workspace root exists — fail early with a clear message
		if (!fs.existsSync(this.workspaceRoot)) {
			throw new Error(
				`Workspace root does not exist: ${this.workspaceRoot}. ` +
					`Provide a valid destination path or create the directory first.`,
			);
		}
	}

	/**
	 * Create a single symbolic link.
	 *
	 * Safety checks:
	 * - Target must exist in the filesystem (absolute path resolved from workspace root).
	 * - If linkPath already exists as a symlink (working or broken), skip (idempotent).
	 * - If linkPath already exists as a real directory, skip with warning.
	 * - Resolved paths are verified to stay within workspaceRoot.
	 */
	async createSymlink(target: string, linkPath: string): Promise<Result<void, SymlinkError>> {
		const resolvedLinkPath = path.resolve(this.workspaceRoot, linkPath);

		// Defense-in-depth: ensure the link path stays within the workspace root
		if (!resolvedLinkPath.startsWith(this.workspaceRoot + path.sep)) {
			return failure(
				symlinkError(
					target,
					linkPath,
					`Symlink path escapes workspace root: ${resolvedLinkPath}`,
					"EPERM",
				),
			);
		}

		// Resolve the target relative to the symlink's parent directory.
		// This matches how the OS resolves symlink targets: `../agents`
		// at `.opencode/agents` means "go up from .opencode/ to agents/".
		const linkParentDir = path.dirname(resolvedLinkPath);
		const resolvedTarget = path.resolve(linkParentDir, target);

		// Defense-in-depth: ensure the resolved target stays within the workspace root
		if (!resolvedTarget.startsWith(this.workspaceRoot + path.sep)) {
			return failure(
				symlinkError(
					target,
					linkPath,
					`Symlink target escapes workspace root: ${resolvedTarget}`,
					"EPERM",
				),
			);
		}

		// Skip if link path already exists (use lstat — do NOT follow symlinks,
		// so broken symlinks are correctly detected as existing).
		// Check this BEFORE checking target existence — if a symlink (even broken)
		// already exists at the link path, we skip regardless of target state.
		try {
			const stat = await fsPromises.lstat(resolvedLinkPath);

			if (stat.isSymbolicLink()) {
				// Idempotent: symlink already exists (working or broken) — skip
				return success(undefined);
			}

			if (stat.isDirectory()) {
				// Skip real directories — do not replace user content
				// biome-ignore lint/suspicious/noConsole: production warning for skipped symlink
				console.warn(
					`[warn] Skipping symlink creation: ${linkPath} is a real directory. ` +
						`Remove the directory and re-run to create the symlink.`,
				);
				return success(undefined);
			}
		} catch (error) {
			// Only proceed if the path does not exist (ENOENT).
			// Other errors (e.g. EACCES) should propagate for diagnosis.
			const err = error as NodeJS.ErrnoException;
			if (err.code !== "ENOENT") {
				return failure(
					symlinkError(target, linkPath, `Failed to check symlink path: ${err.message}`, err.code),
				);
			}
		}

		// Verify the target exists before creating the symlink
		try {
			await fsPromises.access(resolvedTarget, fs.constants.F_OK);
		} catch {
			return failure(
				symlinkError(
					target,
					linkPath,
					`Symlink target does not exist: ${resolvedTarget}. ` +
						`Target resolved from symlink parent (${linkParentDir}): ${target}`,
					"ENOENT",
				),
			);
		}

		// Create parent directory if needed (linkParentDir is already computed above)
		try {
			await fsPromises.access(linkParentDir, fs.constants.F_OK);
		} catch {
			await fsPromises.mkdir(linkParentDir, { recursive: true });
		}

		try {
			// Determine the target type for Windows compatibility:
			// Windows requires `type: 'dir'` for directory symlinks.
			const targetStat = await fsPromises.stat(resolvedTarget);
			const symlinkType = targetStat.isDirectory() ? "dir" : ("file" as "dir" | "file");

			// Use relative target path for the symlink (portable across machines)
			await fsPromises.symlink(target, resolvedLinkPath, symlinkType);
			return success(undefined);
		} catch (error) {
			const nodeError = error as NodeJS.ErrnoException;
			return failure(
				symlinkError(
					target,
					linkPath,
					`Failed to create symlink: ${nodeError.message}`,
					nodeError.code,
				),
			);
		}
	}

	/**
	 * Create multiple symbolic links in batch.
	 *
	 * Each symlink is attempted independently. If one fails, the others
	 * still proceed. All errors are collected and returned.
	 */
	async createSymlinks(symlinks: readonly SymlinkSpec[]): Promise<Result<void, SymlinkError[]>> {
		const errors: SymlinkError[] = [];

		for (const spec of symlinks) {
			const result = await this.createSymlink(spec.target, spec.linkPath);
			if (!result.ok) {
				errors.push(result.error);
			}
		}

		if (errors.length > 0) {
			return failure(errors);
		}

		return success(undefined);
	}
}
