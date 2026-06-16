/**
 * Unit tests for pathResolver — resolveWithinRoot().
 *
 * Covers the primary traversal guard (absolute / starts-with-..)
 * and documents the defense-in-depth boundary check (lines 23-26).
 *
 * Note: The second guard (resolved path outside root) is unreachable
 * in practice because Node's path.resolve() concatenates segments
 * without normalizing intermediate ".." sequences. It serves as a
 * safety net against future changes in path resolution behavior.
 */
import { describe, expect, test } from "bun:test";
import * as path from "node:path";
import { resolveWithinRoot } from "../../../src/infrastructure/adapters/pathResolver";

const ROOT = "/workspace/project";

describe("resolveWithinRoot", () => {
	// ---------------------------------------------------------------------------
	// Happy paths
	// ---------------------------------------------------------------------------

	test("resolves a simple relative path within root", () => {
		const result = resolveWithinRoot(ROOT, "src/index.ts", "destination");
		expect(result).toBe(path.resolve(ROOT, "src/index.ts"));
	});

	test("normalizes nested relative paths", () => {
		const result = resolveWithinRoot(ROOT, "src/../src/index.ts", "destination");
		expect(result).toBe(path.resolve(ROOT, "src/index.ts"));
	});

	test("resolves single-level file", () => {
		const result = resolveWithinRoot(ROOT, "file.txt", "destination");
		expect(result).toBe(path.resolve(ROOT, "file.txt"));
	});

	// ---------------------------------------------------------------------------
	// Primary traversal guard (line 16)
	// ---------------------------------------------------------------------------

	test("rejects absolute paths", () => {
		expect(() => resolveWithinRoot(ROOT, "/etc/passwd", "destination")).toThrow(
			"Path traversal detected",
		);
	});

	test("rejects paths starting with ..", () => {
		expect(() => resolveWithinRoot(ROOT, "../sibling/file.ts", "destination")).toThrow(
			"Path traversal detected",
		);
	});

	test("rejects paths that are only ..", () => {
		expect(() => resolveWithinRoot(ROOT, "..", "destination")).toThrow("Path traversal detected");
	});

	test("rejects mid-path traversal that normalizes to .. (defense-in-depth)", () => {
		// "src/../../outside.txt" normalizes to "../../outside.txt" which starts with ..
		// This is caught by the first guard's startsWith("..") check.
		expect(() => resolveWithinRoot(ROOT, "src/../../outside.txt", "destination")).toThrow(
			"Path traversal detected",
		);
	});

	test("rejects another mid-path traversal pattern", () => {
		expect(() => resolveWithinRoot(ROOT, "a/../../b.txt", "staging")).toThrow(
			"Path traversal detected",
		);
	});

	// ---------------------------------------------------------------------------
	// Defense-in-depth boundary check (lines 23-26)
	//
	// This guard is a safety net. With current path.resolve() behavior,
	// the resolved path always starts with rootWithSep, making this
	// guard unreachable. It protects against:
	//   - Future changes in Node/Bun path.resolve() normalization
	//   - Platform-specific path behavior differences
	// ---------------------------------------------------------------------------

	test("returns resolved path starting with root (guard prerequisite)", () => {
		// Verify the invariant that makes the second guard unreachable:
		// path.resolve(ROOT, normalized) always starts with ROOT + sep
		const result = resolveWithinRoot(ROOT, "src/file.ts", "destination");
		expect(result.startsWith(path.resolve(ROOT) + path.sep)).toBe(true);
	});

	// ---------------------------------------------------------------------------
	// Context parameter
	// ---------------------------------------------------------------------------

	test("includes context label in error message", () => {
		expect(() => resolveWithinRoot(ROOT, "/etc/passwd", "staging")).toThrow("staging");
	});
});
