/**
 * Unit tests for FileMergeEngine merge orchestration.
 *
 * Uses a mock IFileSystem to verify that the correct strategy
 * is applied per rule category:
 *   - mandatory: always stages
 *   - standard: stages only if destination does NOT exist
 *   - optional: stages only if user selected AND destination does NOT exist
 */

import { describe, expect, test } from "bun:test";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";

// ---- Mock IFileSystem ----

interface CallRecord {
	method: string;
	args: unknown[];
}

function createMockFs(): {
	fs: IFileSystem;
	calls: CallRecord[];
} {
	const calls: CallRecord[] = [];

	const mockFs: IFileSystem = {
		readTemplateFile: async () => "",
		destinationExists: async (path: string) => {
			calls.push({ method: "destinationExists", args: [path] });
			return true; // default: file already exists
		},
		getStagingPath: (path: string) => {
			calls.push({ method: "getStagingPath", args: [path] });
			return `staging/${path}`;
		},
		stageFile: async (relativePath: string, excludeSubDirs?: Set<string>) => {
			calls.push({ method: "stageFile", args: [relativePath, excludeSubDirs] });
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

// ---- Obligatorio (Mandatory) ----

describe("FileMergeEngine — Mandatory rules", () => {
	test("always stages mandatory files regardless of destination", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const rules = [rule("opencode.json", "mandatory")];
		const result = await engine.execute(rules);

		expect(result.ok).toBe(true);
		expect(calls.filter((c) => c.method === "stageFile").length).toBe(1);
		expect(calls.filter((c) => c.method === "destinationExists").length).toBe(0);
	});

	test("stages multiple mandatory files", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const rules = [rule("opencode.json", "mandatory"), rule("agents", "mandatory", true)];
		const result = await engine.execute(rules);

		expect(result.ok).toBe(true);
		expect(calls.filter((c) => c.method === "stageFile").length).toBe(2);
	});

	test("calls commitStaging after mandatory files", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const result = await engine.execute([rule("opencode.json", "mandatory")]);

		expect(result.ok).toBe(true);
		const commitCalls = calls.filter((c) => c.method === "commitStaging");
		expect(commitCalls.length).toBe(1);
	});
});

// ---- Estandar (Standard) ----

describe("FileMergeEngine — Standard rules", () => {
	test("stages standard file if destination does NOT exist", async () => {
		const { fs, calls } = createMockFs();
		// Override: destination does NOT exist
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules = [rule("README.md", "standard")];
		const result = await engine.execute(rules);

		expect(result.ok).toBe(true);
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(1);
		expect(stageCalls[0]?.args[0]).toBe("README.md");
	});

	test("skips standard file if destination exists", async () => {
		const { fs, calls } = createMockFs();
		// Default mock: destinationExists returns true
		const engine = new FileMergeEngine(fs);

		const rules = [rule("README.md", "standard")];
		const result = await engine.execute(rules);

		expect(result.ok).toBe(true);
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0); // skipped because exists
	});

	test("checks destinationExists for standard files", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		await engine.execute([rule("README.md", "standard")]);

		const existsCalls = calls.filter((c) => c.method === "destinationExists");
		expect(existsCalls.length).toBe(1);
		expect(existsCalls[0]?.args[0]).toBe("README.md");
	});
});

// ---- Opcional (Optional) ----

describe("FileMergeEngine — Optional rules", () => {
	test("stages optional file if user selected AND destination missing", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules = [rule("Justfile", "optional")];
		const result = await engine.execute(rules, ["Justfile"]);

		expect(result.ok).toBe(true);
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(1);
		expect(stageCalls[0]?.args[0]).toBe("Justfile");
	});

	test("skips optional file NOT in selectedOptionals", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules = [rule("Justfile", "optional")];
		// User did NOT select Justfile
		const result = await engine.execute(rules, []);

		expect(result.ok).toBe(true);
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0); // skipped
	});

	test("skips optional file if destination exists even when selected", async () => {
		const { fs, calls } = createMockFs();
		// Default: destinationExists returns true
		const engine = new FileMergeEngine(fs);

		const rules = [rule("Justfile", "optional")];
		const result = await engine.execute(rules, ["Justfile"]);

		expect(result.ok).toBe(true);
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0); // exists, so skipped
	});
});

// ---- Mixed rules ----

describe("FileMergeEngine — Mixed rules", () => {
	test("handles mandatory + standard + optional together", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async (path: string) => path !== "opencode.json";
		const engine = new FileMergeEngine(fs);

		const rules = [
			rule("opencode.json", "mandatory"),
			rule("README.md", "standard"), // exists → skip
			rule("Justfile", "optional"),
		];
		const result = await engine.execute(rules, ["Justfile"]);

		expect(result.ok).toBe(true);
		const staged = calls.filter((c) => c.method === "stageFile").map((c) => c.args[0]);
		// opencode.json: mandatory → always staged
		// README.md: standard, exists → skipped
		// Justfile: optional, selected, destination doesn't exist → wait, does Justfile exist?
		// destinationExists returns true for everything except opencode.json
		// So Justfile exists → skipped
		expect(staged).toEqual(["opencode.json"]);
	});
});

// ---- Error handling ----

describe("FileMergeEngine — Error handling", () => {
	test("returns Failure when stageFile throws", async () => {
		const { fs } = createMockFs();
		fs.stageFile = async () => {
			throw new Error("Disk full");
		};
		const engine = new FileMergeEngine(fs);

		const result = await engine.execute([rule("opencode.json", "mandatory")]);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.phase).toBe("staging");
			expect(result.error.message).toContain("Disk full");
		}
	});

	test("calls cleanStaging when stageFile fails", async () => {
		const { fs, calls } = createMockFs();
		fs.stageFile = async () => {
			throw new Error("Disk full");
		};
		const engine = new FileMergeEngine(fs);

		await engine.execute([rule("opencode.json", "mandatory")]);

		const cleanCalls = calls.filter((c) => c.method === "cleanStaging");
		expect(cleanCalls.length).toBe(1);
	});

	test("returns Failure when commitStaging throws", async () => {
		const { fs } = createMockFs();
		fs.commitStaging = async () => {
			throw new Error("Rename failed");
		};
		const engine = new FileMergeEngine(fs);

		const result = await engine.execute([rule("opencode.json", "mandatory")]);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.phase).toBe("commit");
			expect(result.error.message).toContain("Rename failed");
		}
	});

	test("handles empty rules array gracefully", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const result = await engine.execute([]);

		expect(result.ok).toBe(true);
		// No files to stage
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0);
		// commitStaging is still called (no-op on empty staging dir)
		const commitCalls = calls.filter((c) => c.method === "commitStaging");
		expect(commitCalls.length).toBe(1);
	});

	test("does NOT call commitStaging if stageFile failed", async () => {
		const { fs, calls } = createMockFs();
		fs.stageFile = async () => {
			throw new Error("Fail");
		};
		const engine = new FileMergeEngine(fs);

		await engine.execute([rule("opencode.json", "mandatory")]);

		const commitCalls = calls.filter((c) => c.method === "commitStaging");
		expect(commitCalls.length).toBe(0);
	});
});

// ---- Exclusion logic ----

describe("FileMergeEngine — Exclusion logic", () => {
	test("computes exclusion for standard dir that overlaps with optional sub-paths", async () => {
		const { fs, calls } = createMockFs();
		// Both dirs don't exist yet so standard will stage
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules = [
			rule("docs", "standard", true), // standard directory
			rule("docs/opencode", "optional", true), // optional sub-path
		];
		const result = await engine.execute(rules, ["docs/opencode"]);

		expect(result.ok).toBe(true);

		// Find the stageFile call for "docs"
		const docsStageCall = calls.find(
			(c) => c.method === "stageFile" && c.args[0] === "docs",
		);
		expect(docsStageCall).toBeDefined();

		// The second argument should be the exclusion set containing "opencode"
		const excludeSet = docsStageCall?.args[1] as Set<string> | undefined;
		expect(excludeSet).toBeDefined();
		expect(excludeSet?.has("opencode")).toBe(true);
	});

	test("does NOT compute exclusions for mandatory directory rules", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const rules = [
			rule("agents", "mandatory", true), // mandatory directory
			rule("agents/expert", "optional", true), // optional sub-path
		];
		const result = await engine.execute(rules, ["agents/expert"]);

		expect(result.ok).toBe(true);

		// Mandatory dirs should NOT have exclusions
		const agentsStageCall = calls.find(
			(c) => c.method === "stageFile" && c.args[0] === "agents",
		);
		expect(agentsStageCall).toBeDefined();
		expect(agentsStageCall?.args[1]).toBeUndefined();
	});

	test("does NOT compute exclusions when no overlap exists", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules = [
			rule("docs", "standard", true), // standard directory
			rule("Justfile", "optional"), // unrelated optional
		];
		const result = await engine.execute(rules, ["Justfile"]);

		expect(result.ok).toBe(true);

		const docsStageCall = calls.find(
			(c) => c.method === "stageFile" && c.args[0] === "docs",
		);
		expect(docsStageCall).toBeDefined();
		expect(docsStageCall?.args[1]).toBeUndefined();
	});

	test("computes exclusions for multiple overlapping optional sub-paths", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules = [
			rule("specs", "standard", true),
			rule("specs/design", "optional", true),
			rule("specs/adr", "optional", true),
		];
		const result = await engine.execute(rules, ["specs/design", "specs/adr"]);

		expect(result.ok).toBe(true);

		const specsStageCall = calls.find(
			(c) => c.method === "stageFile" && c.args[0] === "specs",
		);
		expect(specsStageCall).toBeDefined();

		const excludeSet = specsStageCall?.args[1] as Set<string> | undefined;
		expect(excludeSet).toBeDefined();
		expect(excludeSet?.has("design")).toBe(true);
		expect(excludeSet?.has("adr")).toBe(true);
	});
});
