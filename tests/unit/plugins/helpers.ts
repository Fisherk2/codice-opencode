/**
 * Shared test utilities for the plugin unit test suite.
 *
 * The 4 filesystem-backed plugin tests each need an isolated temp directory
 * with unique-prefix naming (parallel-suite isolation). Extracted here so the
 * setup block is not copy-pasted across files — the per-test fixture building
 * (writing files) stays inline in each test as DAMP requires.
 */

import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Create an isolated temp directory for a test file.
 *
 * The unique prefix per file prevents parallel test files from colliding
 * when they run concurrently under bun test.
 *
 * @param prefix - Short identifier unique to the calling test file.
 * @returns Absolute path to the created directory.
 */
export async function createTestDir(prefix: string): Promise<string> {
	const dir = join(tmpdir(), `${prefix}-${Date.now()}`);
	await mkdir(dir, { recursive: true });
	return dir;
}

/**
 * Remove a test directory created by {@link createTestDir}.
 *
 * @param dir - Absolute path returned by createTestDir.
 */
export async function cleanupTestDir(dir: string): Promise<void> {
	await rm(dir, { recursive: true, force: true });
}
