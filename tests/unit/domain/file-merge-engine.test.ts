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
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import type { ProgressEvent } from "../../../src/domain/types/ProgressEvent";

// ---- Mock IFileSystem + IStagingSystem ----

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
		walkTemplateDirectory: async (_path: string) => [],
		walkDestinationDirectory: async (_path: string) => [],
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

// ---- noTemplateCopy flag ----

describe("FileMergeEngine — noTemplateCopy rules", () => {
	test("skips staging for noTemplateCopy rule", async () => {
		const { fs, calls } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const rules: FileRule[] = [
			{
				path: ".virtual-entry",
				category: "optional",
				isDirectory: true,
				description: "Virtual entry",
				noTemplateCopy: true,
			},
		];
		const result = await engine.execute(rules, [".virtual-entry"]);

		expect(result.ok).toBe(true);
		// stageFile should NOT be called for noTemplateCopy rules
		const stageCalls = calls.filter((c) => c.method === "stageFile");
		expect(stageCalls.length).toBe(0);
	});

	test("skips only noTemplateCopy rules, stages others normally", async () => {
		const { fs, calls } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);

		const rules: FileRule[] = [
			{ path: "opencode.json", category: "mandatory", isDirectory: false, description: "Config" },
			{
				path: ".virtual-entry",
				category: "optional",
				isDirectory: true,
				description: "Virtual",
				noTemplateCopy: true,
			},
			{ path: "Justfile", category: "optional", isDirectory: false, description: "Optional file" },
		];
		const result = await engine.execute(rules, [".virtual-entry", "Justfile"]);

		expect(result.ok).toBe(true);
		const staged = calls.filter((c) => c.method === "stageFile").map((c) => c.args[0]);
		// opencode.json (mandatory) and Justfile (optional, selected, missing) should be staged
		// .virtual-entry (noTemplateCopy) should be skipped
		expect(staged).toEqual(["opencode.json", "Justfile"]);
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
		// commitStaging is NOT called when total is 0 (nothing staged)
		const commitCalls = calls.filter((c) => c.method === "commitStaging");
		expect(commitCalls.length).toBe(0);
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
			rule("docs/guides", "optional", true), // optional sub-path
		];
		const result = await engine.execute(rules, ["docs/guides"]);

		expect(result.ok).toBe(true);

		// Find the stageFile call for "docs"
		const docsStageCall = calls.find((c) => c.method === "stageFile" && c.args[0] === "docs");
		expect(docsStageCall).toBeDefined();

		// The second argument should be the exclusion set containing "guides"
		const excludeSet = docsStageCall?.args[1] as Set<string> | undefined;
		expect(excludeSet).toBeDefined();
		expect(excludeSet?.has("guides")).toBe(true);
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
		const agentsStageCall = calls.find((c) => c.method === "stageFile" && c.args[0] === "agents");
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

		const docsStageCall = calls.find((c) => c.method === "stageFile" && c.args[0] === "docs");
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

		const specsStageCall = calls.find((c) => c.method === "stageFile" && c.args[0] === "specs");
		expect(specsStageCall).toBeDefined();

		const excludeSet = specsStageCall?.args[1] as Set<string> | undefined;
		expect(excludeSet).toBeDefined();
		expect(excludeSet?.has("design")).toBe(true);
		expect(excludeSet?.has("adr")).toBe(true);
	});
});

// ---- Progress events ----

describe("FileMergeEngine — Progress events", () => {
	function collectEvents(): {
		cb: (e: ProgressEvent) => void;
		events: ProgressEvent[];
	} {
		const events: ProgressEvent[] = [];
		const cb = (e: ProgressEvent): void => {
			events.push(e);
		};
		return { cb, events };
	}

	test("emits stage_start + stage_complete for each staged file", async () => {
		const { fs } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		const rules = [rule("opencode.json", "mandatory"), rule("README.md", "standard")];
		const result = await engine.execute(rules, undefined, cb);

		expect(result.ok).toBe(true);
		const starts = events.filter((e) => e.type === "stage_start");
		const completes = events.filter((e) => e.type === "stage_complete");
		expect(starts.length).toBe(2);
		expect(completes.length).toBe(2);
		expect(starts[0]?.filePath).toBe("opencode.json");
		expect(starts[1]?.filePath).toBe("README.md");
	});

	test("emits stage_skip for noTemplateCopy files", async () => {
		const { fs } = createMockFs();
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		const rules: FileRule[] = [
			{
				path: ".virtual-entry",
				category: "optional",
				isDirectory: true,
				description: "Virtual",
				noTemplateCopy: true,
			},
		];
		await engine.execute(rules, [".virtual-entry"], cb);

		const skips = events.filter((e) => e.type === "stage_skip");
		expect(skips.length).toBe(1);
		if (skips[0]?.type === "stage_skip") {
			expect(skips[0].filePath).toBe(".virtual-entry");
			expect(skips[0].reason).toContain("no template copy");
		}
	});

	test("emits stage_skip for standard file when destination exists", async () => {
		const { fs } = createMockFs();
		// Default: destinationExists returns true
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		await engine.execute([rule("README.md", "standard")], undefined, cb);

		const skips = events.filter((e) => e.type === "stage_skip");
		expect(skips.length).toBe(1);
		if (skips[0]?.type === "stage_skip") {
			expect(skips[0].filePath).toBe("README.md");
			expect(skips[0].reason).toBe("Destination already exists");
		}
	});

	test("emits commit_start + commit_complete", async () => {
		const { fs } = createMockFs();
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		await engine.execute([rule("opencode.json", "mandatory")], undefined, cb);

		const hasCommitStart = events.some((e) => e.type === "commit_start");
		const hasCommitComplete = events.some((e) => e.type === "commit_complete");
		expect(hasCommitStart).toBe(true);
		expect(hasCommitComplete).toBe(true);
	});

	test("emits error when staging fails", async () => {
		const { fs } = createMockFs();
		fs.stageFile = async () => {
			throw new Error("Disk full");
		};
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		const result = await engine.execute([rule("opencode.json", "mandatory")], undefined, cb);

		expect(result.ok).toBe(false);
		const errors = events.filter((e) => e.type === "error");
		expect(errors.length).toBe(1);
		if (errors[0]?.type === "error") {
			expect(errors[0].filePath).toBe("opencode.json");
			expect(errors[0].message).toContain("Disk full");
		}
	});

	test("callback exception is swallowed (merge completes)", async () => {
		const { fs } = createMockFs();
		const engine = new FileMergeEngine(fs);

		const throwCb = (): void => {
			throw new Error("Callback crashed");
		};

		const result = await engine.execute([rule("opencode.json", "mandatory")], undefined, throwCb);

		expect(result.ok).toBe(true);
	});

	test("events emitted in correct order for single mandatory file", async () => {
		const { fs } = createMockFs();
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		await engine.execute([rule("opencode.json", "mandatory")], undefined, cb);

		expect(events.length).toBeGreaterThanOrEqual(4);
		expect(events[0]?.type).toBe("stage_start");
		expect(events[1]?.type).toBe("stage_complete");
		expect(events[2]?.type).toBe("commit_start");
		expect(events[3]?.type).toBe("commit_complete");
	});

	test("correct current/total values in progress events", async () => {
		const { fs } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		const rules = [
			rule("opencode.json", "mandatory"),
			rule("README.md", "standard"),
			rule("Justfile", "standard"),
		];
		await engine.execute(rules, undefined, cb);

		const starts = events.filter((e) => e.type === "stage_start");
		expect(starts.length).toBe(3);
		// total should be 3 for all start events
		for (const event of starts) {
			if (event.type === "stage_start") {
				expect(event.total).toBe(3);
			}
		}
		// current should increment: 1, 2, 3
		expect(starts[0]?.type === "stage_start" && starts[0].current).toBe(1);
		expect(starts[1]?.type === "stage_start" && starts[1].current).toBe(2);
		expect(starts[2]?.type === "stage_start" && starts[2].current).toBe(3);
	});

	test("no events emitted when onProgress is undefined (backward compat)", async () => {
		const { fs } = createMockFs();
		const engine = new FileMergeEngine(fs);

		let spyCalled = false;
		const originalStageFile = fs.stageFile;
		fs.stageFile = async (path: string, excludeSubDirs?: Set<string>) => {
			spyCalled = true;
			await originalStageFile(path, excludeSubDirs);
		};

		const result = await engine.execute([rule("opencode.json", "mandatory")]);

		expect(result.ok).toBe(true);
		expect(spyCalled).toBe(true);
	});

	test("progress events include correct total with mixed noTemplateCopy rules", async () => {
		const { fs } = createMockFs();
		fs.destinationExists = async () => false;
		const engine = new FileMergeEngine(fs);
		const { cb, events } = collectEvents();

		const rules: FileRule[] = [
			{ path: "opencode.json", category: "mandatory", isDirectory: false, description: "Config" },
			{
				path: ".devin",
				category: "optional",
				isDirectory: true,
				description: "Virtual",
				noTemplateCopy: true,
			},
			{ path: "Justfile", category: "optional", isDirectory: false, description: "Optional file" },
		];
		await engine.execute(rules, ["Justfile"], cb);

		const starts = events.filter((e) => e.type === "stage_start");
		expect(starts.length).toBe(2); // only 2 non-noTemplateCopy rules

		// total should be 2 (excluding noTemplateCopy)
		for (const event of starts) {
			if (event.type === "stage_start") {
				expect(event.total).toBe(2);
			}
		}

		// commit events should also use total=2
		const commitStart = events.find((e) => e.type === "commit_start");
		expect(commitStart).toBeDefined();
		if (commitStart?.type === "commit_start") {
			expect(commitStart.total).toBe(2);
		}

		// stage_skip should have been emitted for .devin
		const skips = events.filter((e) => e.type === "stage_skip");
		expect(skips.length).toBe(1);
	});
});
