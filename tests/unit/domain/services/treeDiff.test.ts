/**
 * Unit tests for diffTrees — pure domain function that compares two directory
 * trees and returns relative paths of files present in source but missing in
 * destination.
 *
 * No runtime dependencies. All I/O goes through the injected IFileSystem mock.
 * Used by Update mode to deliver new standard files at file-level granularity.
 */

import { describe, expect, test } from "bun:test";
import type { IFileSystem } from "../../../../src/domain/ports/IFileSystem";
import { diffTrees } from "../../../../src/domain/services/treeDiff";

// ── Mock factory ───────────────────────────────────────────────────────────────

interface DiffTreesMock {
	fs: IFileSystem;
	// Track calls for verification of which methods were invoked
	destExistsCalls: string[];
	templateWalkCalls: string[];
	destWalkCalls: string[];
}

function createMockFs(): DiffTreesMock {
	const destExistsCalls: string[] = [];
	const templateWalkCalls: string[] = [];
	const destWalkCalls: string[] = [];

	const fs: IFileSystem = {
		destinationExists: async (relativePath: string) => {
			destExistsCalls.push(relativePath);
			return true; // default: destination exists
		},
		isWritable: async () => true,
		isEmpty: async () => true,
		writeVersionFile: async () => {},
		readVersionFile: async () => null,
		walkTemplateDirectory: async (relativePath: string) => {
			templateWalkCalls.push(relativePath);
			return []; // default: no template files
		},
		walkDestinationDirectory: async (relativePath: string) => {
			destWalkCalls.push(relativePath);
			return []; // default: no destination files
		},
	};

	return { fs, destExistsCalls, templateWalkCalls, destWalkCalls };
}

// ── Branch 1: Destination does not exist ───────────────────────────────────────

describe("diffTrees — destination does not exist", () => {
	test("returns all source files when destination does not exist", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async (_path: string) => {
			mock.destExistsCalls.push(_path);
			return false;
		};
		mock.fs.walkTemplateDirectory = async (_path: string) => {
			mock.templateWalkCalls.push(_path);
			return ["file1.md", "file2.md", "nested/deep.ts"];
		};

		// Act
		const result = await diffTrees(mock.fs, "docs", "docs");

		// Assert
		expect(result).toEqual(["file1.md", "file2.md", "nested/deep.ts"]);
		expect(mock.destExistsCalls).toEqual(["docs"]);
		expect(mock.templateWalkCalls).toEqual(["docs"]);
		expect(mock.destWalkCalls).toEqual([]); // never walked dest
	});

	test("returns empty array when source is empty and dest does not exist", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async (_path: string) => {
			mock.destExistsCalls.push(_path);
			return false;
		};
		mock.fs.walkTemplateDirectory = async (_path: string) => {
			mock.templateWalkCalls.push(_path);
			return [];
		};

		// Act
		const result = await diffTrees(mock.fs, "empty-dir", "empty-dir");

		// Assert
		expect(result).toEqual([]);
		expect(mock.templateWalkCalls).toEqual(["empty-dir"]);
		expect(mock.destWalkCalls).toEqual([]);
	});

	test("uses sourceDir for walking, destDir only for existence check", async () => {
		// Arrange — source and dest have different names
		const mock = createMockFs();
		mock.fs.destinationExists = async (_path: string) => {
			mock.destExistsCalls.push(_path);
			return false;
		};
		mock.fs.walkTemplateDirectory = async (_path: string) => {
			mock.templateWalkCalls.push(_path);
			return ["a.md"];
		};

		// Act
		const result = await diffTrees(mock.fs, "source-dir", "dest-dir");

		// Assert
		expect(result).toEqual(["a.md"]);
		expect(mock.destExistsCalls).toEqual(["dest-dir"]);
		expect(mock.templateWalkCalls).toEqual(["source-dir"]);
	});
});

// ── Branch 2: Destination exists — set difference ──────────────────────────────

describe("diffTrees — destination exists", () => {
	test("returns only files in source that are missing in dest", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => ["a.md", "b.md", "c.md"];
		mock.fs.walkDestinationDirectory = async (_path: string) => ["a.md", "c.md"];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(result).toEqual(["b.md"]);
	});

	test("returns empty array when all source files exist in dest", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => ["a.md", "b.md"];
		mock.fs.walkDestinationDirectory = async (_path: string) => ["a.md", "b.md"];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(result).toEqual([]);
	});

	test("returns all source files when dest exists but is empty", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => ["x.md", "y.md", "z.md"];
		mock.fs.walkDestinationDirectory = async (_path: string) => [];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(result).toEqual(["x.md", "y.md", "z.md"]);
	});

	test("result is always sorted lexicographically", async () => {
		// Arrange — source returns unsorted, dest is empty
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => ["c.md", "a.md", "b.md"];
		mock.fs.walkDestinationDirectory = async (_path: string) => [];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(result).toEqual(["a.md", "b.md", "c.md"]);
	});

	test("sorts correctly with numeric file names", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => [
			"10-config.md",
			"1-intro.md",
			"2-setup.md",
		];
		mock.fs.walkDestinationDirectory = async (_path: string) => [];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert — lexicographic sort: "1" < "10" < "2" in string sort
		expect(result).toEqual(["1-intro.md", "10-config.md", "2-setup.md"]);
	});
});

// ── Edge cases ─────────────────────────────────────────────────────────────────

describe("diffTrees — edge cases", () => {
	test("returns empty array when source directory is empty (dest exists)", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => [];
		mock.fs.walkDestinationDirectory = async (_path: string) => ["existing.md"];

		// Act
		const result = await diffTrees(mock.fs, "empty-src", "populated-dest");

		// Assert — nothing new to deliver
		expect(result).toEqual([]);
	});

	test("returns empty array when both source and dest are empty (dest exists)", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => [];
		mock.fs.walkDestinationDirectory = async (_path: string) => [];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(result).toEqual([]);
	});

	test("returns empty array when both source and dest are empty (dest does NOT exist)", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async (_path: string) => false;
		mock.fs.walkTemplateDirectory = async (_path: string) => [];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(result).toEqual([]);
	});

	test("handles destination with extra files not in source (ignores them)", async () => {
		// Arrange — dest has files that source doesn't; these should not appear
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => ["core.md"];
		mock.fs.walkDestinationDirectory = async (_path: string) => [
			"core.md",
			"user-customization.md",
			"legacy-file.md",
		];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert — only the missing source files matter; extras in dest are ignored
		expect(result).toEqual([]);
	});

	test("handles deeply nested paths in set difference", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => [
			"agents/quetzalcoatl.md",
			"agents/tlaloc.md",
			"agents/mictlantecuhtli.md",
			"skills/test/SKILL.md",
		];
		mock.fs.walkDestinationDirectory = async (_path: string) => [
			"agents/quetzalcoatl.md",
			"agents/tlaloc.md",
		];

		// Act
		const result = await diffTrees(mock.fs, "template", "dest");

		// Assert
		expect(result).toEqual(["agents/mictlantecuhtli.md", "skills/test/SKILL.md"]);
	});

	test("result is a readonly array (does not mutate input)", async () => {
		// Arrange
		const mock = createMockFs();
		const sourceFiles: readonly string[] = ["b.md", "a.md"];
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => sourceFiles;
		mock.fs.walkDestinationDirectory = async (_path: string) => [];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert — result is sorted, original is untouched
		expect(result).toEqual(["a.md", "b.md"]);
		expect(sourceFiles).toEqual(["b.md", "a.md"]); // unchanged
	});

	test("passes the correct arguments to each IFileSystem method", async () => {
		// Arrange — defaults already: destinationExists→true, walks return []
		const mock = createMockFs();

		// Act
		await diffTrees(mock.fs, "source-root", "dest-root");

		// Assert
		expect(mock.destExistsCalls).toEqual(["dest-root"]);
		expect(mock.templateWalkCalls).toEqual(["source-root"]);
		expect(mock.destWalkCalls).toEqual(["dest-root"]);
	});

	test("never calls walkDestinationDirectory when dest does not exist", async () => {
		// Arrange
		const mock = createMockFs();
		mock.fs.destinationExists = async (_path: string) => {
			mock.destExistsCalls.push(_path);
			return false;
		};
		mock.fs.walkTemplateDirectory = async (_path: string) => {
			mock.templateWalkCalls.push(_path);
			return ["a.md"];
		};

		// Act
		await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(mock.destWalkCalls).toEqual([]);
		expect(mock.templateWalkCalls.length).toBe(1);
	});
});

// ── Real-world scenarios ───────────────────────────────────────────────────────

describe("diffTrees — real-world update scenarios", () => {
	test("standard docs directory with new files since last install", async () => {
		// Arrange — template has grown since user's last install
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => [
			"ARCHITECTURE.md",
			"CODE_STYLE.md",
			"WORKFLOW.md",
			"PRD.md",
			"TRD.md",
		];
		mock.fs.walkDestinationDirectory = async (_path: string) => [
			"ARCHITECTURE.md",
			"CODE_STYLE.md",
		];

		// Act
		const result = await diffTrees(mock.fs, "docs", "docs");

		// Assert — only docs added since user's last install
		expect(result).toEqual(["PRD.md", "TRD.md", "WORKFLOW.md"]);
	});

	test("new agents directory that user does not have yet", async () => {
		// Arrange — template introduces a new directory
		const mock = createMockFs();
		mock.fs.destinationExists = async (_path: string) => false;
		mock.fs.walkTemplateDirectory = async (_path: string) => ["huitzilopochtli.md", "xolotl.md"];

		// Act
		const result = await diffTrees(mock.fs, "agents", "agents");

		// Assert — entire new directory delivered
		expect(result).toEqual(["huitzilopochtli.md", "xolotl.md"]);
	});

	test("directory already fully synchronized", async () => {
		// Arrange — user is up to date
		const mock = createMockFs();
		mock.fs.destinationExists = async () => true;
		mock.fs.walkTemplateDirectory = async (_path: string) => ["spec.md", "guide.md"];
		mock.fs.walkDestinationDirectory = async (_path: string) => ["spec.md", "guide.md"];

		// Act
		const result = await diffTrees(mock.fs, "dir", "dir");

		// Assert
		expect(result).toEqual([]);
	});
});
