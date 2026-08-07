import * as fs from "node:fs";
import * as path from "node:path";
import type { ISymlinkCreator, SymlinkSpec } from "../../application/ports/ISymlinkCreator";
import { isErrnoException } from "../../domain/types/errorTypeGuards";
import type { Result } from "../../domain/types/Result";
import { failure, success } from "../../domain/types/Result";
import { type SymlinkError, symlinkError } from "../../domain/types/SymlinkError";
import { isPathWithin } from "./pathResolver";
import { VerboseLogger } from "./VerboseLogger";

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
	private readonly logger: VerboseLogger;

	/**
	 * @param workspaceRoot - Absolute path to the workspace root directory.
	 *                        Symlinks are created relative to this path.
	 * @param verbose - Verbose logger or legacy boolean flag (backward compat).
	 */
	constructor(workspaceRoot: string, verbose?: VerboseLogger | boolean) {
		this.workspaceRoot = path.resolve(workspaceRoot);
		this.logger = verbose instanceof VerboseLogger ? verbose : new VerboseLogger(verbose ?? false);

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
	 * Safety checks: target exists, linkPath free (idempotent skip for existing
	 * symlinks/dirs), resolved paths stay within workspaceRoot.
	 */
	async createSymlink(target: string, linkPath: string): Promise<Result<void, SymlinkError>> {
		const resolvedLinkPath = path.resolve(this.workspaceRoot, linkPath);
		if (!isPathWithin(this.workspaceRoot, resolvedLinkPath)) {
			return this.escapeFailure(target, linkPath, resolvedLinkPath, "path");
		}

		// Resolve the target relative to the symlink's parent directory.
		// This matches how the OS resolves symlink targets: `../agents`
		// at `.opencode/agents` means "go up from .opencode/ to agents/".
		const linkParentDir = path.dirname(resolvedLinkPath);
		const resolvedTarget = path.resolve(linkParentDir, target);

		// Defense-in-depth: ensure the resolved target stays within the workspace root
		if (!isPathWithin(this.workspaceRoot, resolvedTarget)) {
			return this.escapeFailure(target, linkPath, resolvedTarget, "target");
		}

		// Skip if link path already exists (use lstat — do NOT follow symlinks,
		// so broken symlinks are correctly detected as existing).
		// Check this BEFORE checking target existence — if a symlink (even broken)
		// already exists at the link path, we skip regardless of target state.
		const linkState = await this.inspectLinkPath(resolvedLinkPath, target, linkPath);
		if (!linkState.ok) return linkState;
		if (linkState.value === "done") return success(undefined);

		return this.createLink(resolvedTarget, resolvedLinkPath, target, linkPath, linkParentDir);
	}

	/** Failure when a resolved link path or target escapes the workspace root. */
	private escapeFailure(
		target: string,
		linkPath: string,
		resolved: string,
		kind: "path" | "target",
	): Result<void, SymlinkError> {
		return failure(
			symlinkError(
				target,
				linkPath,
				`Symlink ${kind} escapes workspace root: ${resolved}`,
				"EPERM",
			),
		);
	}

	/**
	 * Inspect the link path: "proceed" when free to create, "done" on an
	 * idempotent skip (existing symlink/dir), failure for non-ENOENT errors.
	 */
	private async inspectLinkPath(
		resolvedLinkPath: string,
		target: string,
		linkPath: string,
	): Promise<Result<"proceed" | "done", SymlinkError>> {
		try {
			const stat = await fsPromises.lstat(resolvedLinkPath);

			if (stat.isSymbolicLink()) {
				// Idempotent: symlink already exists (working or broken) — skip
				return success("done");
			}

			if (stat.isDirectory()) {
				// Skip real directories — do not replace user content
				// biome-ignore lint/suspicious/noConsole: production warning for skipped symlink
				console.warn(
					`[warn] Skipping symlink creation: ${linkPath} is a real directory. ` +
						`Remove the directory and re-run to create the symlink.`,
				);
				return success("done");
			}
		} catch (error) {
			// Only proceed if the path does not exist (ENOENT).
			// Any other error — including non-Errno shapes — propagates
			// for diagnosis (fail closed, matching the original guard).
			if (!isErrnoException(error) || error.code !== "ENOENT") {
				return failure(
					symlinkError(
						target,
						linkPath,
						`Failed to check symlink path: ${error instanceof Error ? error.message : String(error)}`,
						isErrnoException(error) ? error.code : undefined,
					),
				);
			}
		}
		return success("proceed");
	}

	/**
	 * Verify the target exists, ensure the parent directory exists, and create
	 * the symlink. Windows requires an explicit "dir"/"file" type argument.
	 */
	private async createLink(
		resolvedTarget: string,
		resolvedLinkPath: string,
		target: string,
		linkPath: string,
		linkParentDir: string,
	): Promise<Result<void, SymlinkError>> {
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
			const symlinkType = targetStat.isDirectory() ? "dir" : "file";

			// Use relative target path for the symlink (portable across machines)
			await fsPromises.symlink(target, resolvedLinkPath, symlinkType);

			this.logger.log("symlink", `created ${resolvedLinkPath} → ${target}`);

			return success(undefined);
		} catch (error) {
			const nodeError = isErrnoException(error) ? error : undefined;
			return failure(
				symlinkError(
					target,
					linkPath,
					`Failed to create symlink: ${nodeError?.message ?? String(error)}`,
					nodeError?.code,
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
