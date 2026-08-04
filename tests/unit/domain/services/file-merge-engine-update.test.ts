/**
 * Unit tests for FileMergeEngine tree-level diffing in update mode.
 *
 * Tests the isUpdateMode parameter behavior:
 *   - Standard directories use tree-level diff (only new files staged)
 *   - Standard files keep existing destinationExists check
 *   - Mandatory files always staged
 *   - Non-update modes keep existing behavior
 */

import { describe, expect, test } from "bun:test";
import type { FileRule } from "../../../../src/domain/entities/FileRule";
import type { IFileSystem } from "../../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../../src/domain/ports/IStagingSystem";
import { FileMergeEngine } from "../../../../src/domain/services/FileMergeEngine";

// ---- Mock factories ----

interface CallRecord {
	method: string;
	args: unknown[];
}

function createMockFs(): {
	fs: IFileSystem & IStagingSystem;
	calls: CallRecord[];
} {
	const calls: CallRecord[] = [];

	const mockFs: IFileSystem & IStagingSystem = {
		destinationExists: async (path: string) => {
			calls.push({ method: "destinationExists", args: [path] });
			return true; // default: path exists
		},
		stageFile: async (relativePath: string, destPath?: string, excludeSubDirs?: Set<string>) => {
			calls.push({ method: "stageFile", args: [relativePath, destPath, excludeSubDirs] });
		},
		commitStaging: async () => {
			calls.push({ method: "commitStaging", args: [] });
		},
		cleanStaging: async () => {
			calls.push({ method: "cleanStaging", args: [] });
		},
		isWritable: async () => true,
		isEmpty: async () => true,
		writeVersionFile: async () => {},
		readVersionFile: async () => null,
		walkTemplateDirectory: async (_path: string) => {
			return [];
		},
		walkDestinationDirectory: async (_path: string) => {
			return [];
		},
	};

	return { fs: mockFs, calls };
}

// ---- Test helpers ----

function rule(
	path: string,
	category: "mandatory" | "standard" | "optional",
	isDirectory = false,
): FileRule {
	return { path, category, isDirectory, description: `Rule for ${path}` };
}

// ---- Update mode + standard directory with new files ----

describe("FileMergeEngine — Update mode + standard directory (tree-level diff)", () => {
	test("stages new files when dest dir exists but has fewer files than source", async () => {
		const { fs, calls } = createMockFs();
		// Source has "new-file.md"; dest has no files
		fs.destinationExists = async (path: string) => path === "docs";
		fs.walkTemplateDirectory = async (path: string) => {
			if (path === "docs") return ["new-file.md"];
			return [];
		};
		fs.walkDestinationDirectory = async (path: string) => {
			if (path === "docs") return []; // no files in dest
			return [];
		};
		const engine = new FileMergeEngine(fs);

		const rules = [rule("docs", "standard", true)];
		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		// Should stage the new file docs/new-file.md
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(1);
		expect(stageCalls[0]?.args[0]).toBe("docs/new-file.md");
	});

	test("stages nothing when all source files already exist in dest", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async (path: string) => path === "docs";
		fs.walkTemplateDirectory = async (path: string) => {
			if (path === "docs") return ["existing-file.md"];
			return [];
		};
		fs.walkDestinationDirectory = async (path: string) => {
			if (path === "docs") return ["existing-file.md"];
			return [];
		};
		const engine = new FileMergeEngine(fs);

		const rules = [rule("docs", "standard", true)];
		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		// Nothing should be staged — all files already in dest
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0);
	});

	test("stages ALL files when dest dir is missing entirely", async () => {
		const { fs, calls } = createMockFs();
		// Destination does NOT exist
		fs.destinationExists = async () => false;
		fs.walkTemplateDirectory = async (path: string) => {
			if (path === "docs") return ["file1.md", "file2.md"];
			return [];
		};
		const engine = new FileMergeEngine(fs);

		const rules = [rule("docs", "standard", true)];
		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		// Both files should be staged individually
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(2);
		expect(stageCalls[0]?.args[0]).toBe("docs/file1.md");
		expect(stageCalls[1]?.args[0]).toBe("docs/file2.md");
	});
});

// ---- Non-update modes keep existing behavior ----

describe("FileMergeEngine — Project mode + standard directory exists", () => {
	test("skips standard directory when dest exists (isUpdateMode=false, unchanged)", async () => {
		const { fs, calls } = createMockFs();
		// Default: destinationExists returns true
		const engine = new FileMergeEngine(fs);

		const rules = [rule("docs", "standard", true)];
		const result = await engine.execute(rules, { updateMode: false });

		expect(result.ok).toBe(true);
		// Should NOT stage anything — existing behavior for standard dirs
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0);
	});
});

describe("FileMergeEngine — Clean mode + standard directory exists", () => {
	test("stages ALL files in clean mode even when dest exists (isUpdateMode=false, unchanged)", async () => {
		const { fs, calls } = createMockFs();
		// In clean install, all rules become mandatory
		const engine = new FileMergeEngine(fs);

		const rules = [rule("docs", "mandatory", true)];
		const result = await engine.execute(rules, { updateMode: false });

		expect(result.ok).toBe(true);
		// Mandatory: always staged regardless of destination state
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(1);
		expect(stageCalls[0]?.args[0]).toBe("docs");
	});
});

describe("FileMergeEngine — Update mode + mandatory category", () => {
	test("stages mandatory files even in update mode (unchanged)", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const rules = [rule("opencode.json", "mandatory")];
		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		// Mandatory: always staged in any mode
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(1);
		expect(stageCalls[0]?.args[0]).toBe("opencode.json");
	});

	test("stages mandatory directories in update mode (unchanged)", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const rules = [rule("agents", "mandatory", true)];
		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		// Mandatory directories are NOT subject to tree-level diff
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(1);
		expect(stageCalls[0]?.args[0]).toBe("agents");
	});
});

// ---- Standard file (not directory) in update mode ----

describe("FileMergeEngine — Update mode + standard file (not directory)", () => {
	test("skips standard file when dest exists (unchanged behavior)", async () => {
		const { fs, calls } = createMockFs();
		// Default: destinationExists returns true
		const engine = new FileMergeEngine(fs);

		const rules = [rule("README.md", "standard")]; // not a directory
		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		// Standard files still use destinationExists check in update mode
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0);
	});

	test("stages standard file when dest does NOT exist (unchanged behavior)", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules = [rule("README.md", "standard")];
		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(1);
		expect(stageCalls[0]?.args[0]).toBe("README.md");
	});
});

// ---- Progress events in update mode ----

describe("FileMergeEngine — Progress events in update mode", () => {
	test("emits stage_skip when standard directory has no new files", async () => {
		const { fs, calls: _calls } = createMockFs();
		// All files already exist in dest
		fs.destinationExists = async (path: string) => path === "docs";
		fs.walkTemplateDirectory = async (path: string) => {
			if (path === "docs") return ["existing.md"];
			return [];
		};
		fs.walkDestinationDirectory = async (path: string) => {
			if (path === "docs") return ["existing.md"];
			return [];
		};
		const engine = new FileMergeEngine(fs);

		const rules = [rule("docs", "standard", true)];
		const events: unknown[] = [];
		const result = await engine.execute(rules, {
			onProgress: (e) => {
				events.push(e);
			},
			updateMode: true,
		});

		expect(result.ok).toBe(true);
		const skips = events.filter((e: unknown) => (e as { type: string }).type === "stage_skip");
		expect(skips.length).toBe(1);
	});

	test("progress total reflects expanded file count, not directory count", async () => {
		const { fs } = createMockFs();
		fs.destinationExists = async () => false;
		fs.walkTemplateDirectory = async (path: string) => {
			if (path === "docs") return ["file1.md", "file2.md"];
			return [];
		};
		const engine = new FileMergeEngine(fs);

		const rules = [rule("opencode.json", "mandatory"), rule("docs", "standard", true)];

		const events: unknown[] = [];
		await engine.execute(rules, {
			onProgress: (e) => {
				events.push(e);
			},
			updateMode: true,
		});

		const starts = events.filter((e: unknown) => (e as { type: string }).type === "stage_start");
		// mandatory + 2 expanded files = 3 total
		expect(starts.length).toBe(3);
		for (const event of starts) {
			const e = event as { total: number };
			expect(e.total).toBe(3);
		}
	});
});
