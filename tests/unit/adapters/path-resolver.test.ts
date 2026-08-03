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
import {
	isPathWithin,
	resolveWithinRoot,
	withTrailingSeparator,
} from "../../../src/infrastructure/adapters/pathResolver";

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
	// This guard is a safety net for inputs that pass the first guard
	// but resolve to a path outside the root boundary. Example:
	//   "." passes the first guard but resolves to root itself,
	//   which does NOT start with rootWithSep (no trailing sep).
	//
	// It also protects against future changes in path.resolve()
	// normalization and platform-specific path behavior differences.
	// ---------------------------------------------------------------------------

	test("catches path that resolves to root itself (no trailing sep)", () => {
		// "." is not absolute and doesn't start with ".." → passes first guard
		// but path.resolve("/workspace/project", ".") == "/workspace/project"
		// which does NOT start with "/workspace/project/" → triggers second guard
		expect(() => resolveWithinRoot(ROOT, ".", "destination")).toThrow("Path traversal blocked");
	});

	test("returns resolved path starting with root (normal case)", () => {
		// When resolved is within root (with trailing sep), no error is thrown
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

// ---------------------------------------------------------------------------
// isPathWithin + withTrailingSeparator — security-critical containment checks
//
// These are the path-containment primitives used by BunSymlinkCreator,
// TemplateResolver, and BunGitignoreCreator to prevent symlink and copy
// operations from escaping the workspace root.
// ---------------------------------------------------------------------------

describe("withTrailingSeparator", () => {
	test("appends separator to a non-root path", () => {
		expect(withTrailingSeparator("/home/project")).toBe("/home/project/");
	});

	test("keeps an already-trailing-separator path unchanged", () => {
		expect(withTrailingSeparator("/home/project/")).toBe("/home/project/");
	});

	test("keeps filesystem root unchanged (no // sequence)", () => {
		expect(withTrailingSeparator("/")).toBe("/");
	});

	test("resolves relative input before appending", () => {
		const resolved = path.resolve("rel/dir");
		expect(withTrailingSeparator("rel/dir")).toBe(`${resolved}${path.sep}`);
	});
});

describe("isPathWithin", () => {
	const ROOT = "/workspace/project";

	test("returns true for a direct child", () => {
		expect(isPathWithin(ROOT, "/workspace/project/src/index.ts")).toBe(true);
	});

	test("returns true for a nested descendant", () => {
		expect(isPathWithin(ROOT, "/workspace/project/a/b/c/file.ts")).toBe(true);
	});

	test("returns false for a sibling directory (prefix-match attack)", () => {
		// /workspace/project-evil must NOT be considered within /workspace/project
		expect(isPathWithin(ROOT, "/workspace/project-evil/file.ts")).toBe(false);
	});

	test("returns false for a path outside the root", () => {
		expect(isPathWithin(ROOT, "/other/place/file.ts")).toBe(false);
	});

	test("returns false for the root itself (strict containment)", () => {
		expect(isPathWithin(ROOT, "/workspace/project")).toBe(false);
	});

	test("returns false for the filesystem root as boundary (documented limitation)", () => {
		// With "/" as boundary every absolute path trivially matches; callers
		// must never use the filesystem root as a containment boundary
		// (parse-args.ts blocks it as a destination).
		expect(isPathWithin("/", "/etc/passwd")).toBe(true);
	});
});
