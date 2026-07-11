/**
 * Shared helpers for npm packaging integration tests.
 *
 * Provides:
 * - packTarball(): Creates a tarball via bun pm pack and returns its path.
 * - listTarballContents(): Lists files inside a tarball.
 * - extractTarball(): Extracts a tarball to a temporary directory.
 *
 * Tests can be skipped by setting SKIP_NETWORK_TESTS=1.
 */

import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Check if packaging tests should be skipped.
 * Set SKIP_NETWORK_TESTS=1 to skip tests that require npm pack.
 */
export function skipPackagingTests(): boolean {
	return process.env.SKIP_NETWORK_TESTS === "1";
}

// ---------------------------------------------------------------------------
// Pack
// ---------------------------------------------------------------------------

/**
 * Run `bun pm pack` in the project root to create a tarball.
 *
 * Also cleans up the side-effect tarball that `bun pm pack` writes
 * to CWD regardless of `--destination` (known Bun behavior).
 *
 * @returns Absolute path to the generated tarball (in a temp dir).
 * @throws If packing fails.
 */
export async function packTarball(): Promise<string> {
	const projectRoot = path.resolve(import.meta.dir, "../../..");
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-pack-"));

	// Run bun pm pack in the project root, output to temp dir
	// --quiet makes the output only the tarball filename
	const proc = Bun.spawnSync(
		["bun", "pm", "pack", "--destination", tmpDir, "--quiet"],
		{
			cwd: projectRoot,
		},
	);

	if (proc.exitCode !== 0) {
		await fs.rm(tmpDir, { recursive: true, force: true });
		throw new Error(
			`bun pm pack failed (exit ${proc.exitCode}): ${proc.stderr.toString()}`,
		);
	}

	// Find the tarball file in the temp directory
	const entries = await fs.readdir(tmpDir);
	const tarball = entries.find((e) => e.endsWith(".tgz"));
	if (!tarball) {
		await fs.rm(tmpDir, { recursive: true, force: true });
		throw new Error("No tarball (.tgz) found after bun pm pack");
	}

	// Clean up side-effect tarball that bun pm pack writes to CWD
	// despite --destination flag (known Bun limitation)
	const cwdFiles = await fs.readdir(projectRoot);
	const sideEffect = cwdFiles.find((f) => f.endsWith(".tgz"));
	if (sideEffect) {
		await fs.unlink(path.join(projectRoot, sideEffect));
	}

	return path.join(tmpDir, tarball);
}

// ---------------------------------------------------------------------------
// Tarball inspection
// ---------------------------------------------------------------------------

/**
 * List all files inside a tarball (uses tar tf).
 *
 * @param tarballPath - Absolute path to the .tgz file.
 * @returns Array of file paths (as listed by tar).
 */
export async function listTarballContents(tarballPath: string): Promise<string[]> {
	const proc = Bun.spawnSync(["tar", "tzf", tarballPath]);

	if (proc.exitCode !== 0) {
		throw new Error(
			`tar tzf failed (exit ${proc.exitCode}): ${proc.stderr.toString()}`,
		);
	}

	const stdout = proc.stdout.toString();
	return stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Extract a tarball to a temporary directory.
 *
 * @param tarballPath - Absolute path to the .tgz file.
 * @returns Path to the extraction root (contains package/ directory).
 */
export async function extractTarball(tarballPath: string): Promise<string> {
	const extractDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-extract-"));

	const proc = Bun.spawnSync(["tar", "xzf", tarballPath, "-C", extractDir]);

	if (proc.exitCode !== 0) {
		await fs.rm(extractDir, { recursive: true, force: true });
		throw new Error(
			`tar extract failed (exit ${proc.exitCode}): ${proc.stderr.toString()}`,
		);
	}

	return path.join(extractDir, "package");
}

/**
 * Clean up a temporary directory created by packaging tests.
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
	await fs.rm(dirPath, { recursive: true, force: true });
}
