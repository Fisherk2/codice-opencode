import { describe, expect, it } from "bun:test";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import type { ProgressEvent } from "../../../src/domain/types/ProgressEvent";
import { createMockFileSystem } from "./test-doubles";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create N mandatory file rules with predictable paths.
 */
function createMandatoryRules(count: number): FileRule[] {
	return Array.from({ length: count }, (_, i) => ({
		path: `file-${i}.ts`,
		category: "mandatory" as const,
		isDirectory: false,
		description: `Test file ${i}`,
	}));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FileMergeEngine progress events", () => {
	it("should emit one stage_complete event per file for 10 files", async () => {
		const rules = createMandatoryRules(10);
		const { stub: fs } = createMockFileSystem();
		const engine = new FileMergeEngine(fs);
		const events: ProgressEvent[] = [];

		const result = await engine.execute(rules, {
			onProgress: (event) => {
				events.push(event);
			},
		});

		expect(result.ok).toBe(true);

		// Exactly 10 stage_complete events (one per file)
		const stageComplete = events.filter((e) => e.type === "stage_complete");
		expect(stageComplete).toHaveLength(10);

		// Exactly 10 stage_start events (one per file)
		const stageStart = events.filter((e) => e.type === "stage_start");
		expect(stageStart).toHaveLength(10);

		// commit_start and commit_complete should each fire once
		const commitStart = events.filter((e) => e.type === "commit_start");
		const commitComplete = events.filter((e) => e.type === "commit_complete");
		expect(commitStart).toHaveLength(1);
		expect(commitComplete).toHaveLength(1);

		// No error events on success
		expect(events.filter((e) => e.type === "error")).toHaveLength(0);
	});

	it("should propagate current and total counters correctly", async () => {
		const rules = createMandatoryRules(10);
		const { stub: fs } = createMockFileSystem();
		const engine = new FileMergeEngine(fs);
		const events: ProgressEvent[] = [];

		const result = await engine.execute(rules, {
			onProgress: (event) => {
				events.push(event);
			},
		});

		expect(result.ok).toBe(true);

		// Each stage_start/complete should reflect correct current and total
		for (let i = 0; i < 10; i++) {
			const startEvent = events[i * 2]!;
			const completeEvent = events[i * 2 + 1]!;

			expect(startEvent.type).toBe("stage_start");
			expect(startEvent).toHaveProperty("current", i + 1);
			expect(startEvent).toHaveProperty("total", 10);

			expect(completeEvent.type).toBe("stage_complete");
			expect(completeEvent).toHaveProperty("current", i + 1);
			expect(completeEvent).toHaveProperty("total", 10);
		}

		// Last two events are commit_start and commit_complete
		const lastTwo = events.slice(-2);
		expect(lastTwo[0]!.type).toBe("commit_start");
		expect(lastTwo[0]).toHaveProperty("total", 10);
		expect(lastTwo[1]!.type).toBe("commit_complete");
		expect(lastTwo[1]).toHaveProperty("total", 10);
	});

	it("should emit events in correct order by file path", async () => {
		const rules = createMandatoryRules(10);
		const { stub: fs } = createMockFileSystem();
		const engine = new FileMergeEngine(fs);
		const events: ProgressEvent[] = [];

		const result = await engine.execute(rules, {
			onProgress: (event) => {
				events.push(event);
			},
		});

		expect(result.ok).toBe(true);

		// Stage events carry filePath; commit/error events do not. Narrow
		// the union with a type predicate so TS proves filePath is present
		// without an unsafe cast.
		const isFileStageEvent = (
			event: ProgressEvent,
		): event is Extract<ProgressEvent, { filePath: string }> =>
			event.type === "stage_start" || event.type === "stage_complete";

		// Extract the file paths from stage events in order
		const stageOrder = events.filter(isFileStageEvent).map((e) => e.filePath);

		// Should follow rule order: file-0.ts, file-1.ts, ..., file-9.ts
		const expectedOrder = rules.map((r) => r.path);
		const uniquePaths = [...new Set(stageOrder)];
		expect(uniquePaths).toEqual(expectedOrder);
	});

	it("should emit no progress events when no callback is provided", async () => {
		const rules = createMandatoryRules(10);
		const { stub: fs } = createMockFileSystem();
		const engine = new FileMergeEngine(fs);

		// Omit the onProgress callback
		const result = await engine.execute(rules);

		expect(result.ok).toBe(true);
	});

	it("should handle mixed categories with stage_skip events", async () => {
		const rules: FileRule[] = [
			{ path: "always-copy.txt", category: "mandatory", isDirectory: false, description: "" },
			// Estándar — destination already exists, should skip
			{ path: "exists.txt", category: "standard", isDirectory: false, description: "" },
			// Opcional — not selected, should skip
			{ path: "not-selected.txt", category: "optional", isDirectory: false, description: "" },
		];
		const { stub: fs } = createMockFileSystem();
		// Make exists.txt look like it exists in destination
		fs.destinationExists.mockImplementation(async (path: string) => path === "exists.txt");
		const engine = new FileMergeEngine(fs);
		const events: ProgressEvent[] = [];

		const result = await engine.execute(rules, {
			selectedOptionals: [],
			onProgress: (event) => {
				events.push(event);
			},
		});

		expect(result.ok).toBe(true);

		// 1 stage_start + 1 stage_complete for the mandatory file
		const stageComplete = events.filter((e) => e.type === "stage_complete");
		expect(stageComplete).toHaveLength(1);

		// 2 stage_skip events (exists.txt + not-selected.txt)
		const stageSkip = events.filter((e) => e.type === "stage_skip");
		expect(stageSkip).toHaveLength(2);

		// commit_start and commit_complete should fire once each
		expect(events.filter((e) => e.type === "commit_start")).toHaveLength(1);
		expect(events.filter((e) => e.type === "commit_complete")).toHaveLength(1);

		// Verify skip events have reasons
		expect(stageSkip[0]).toHaveProperty("reason");
		expect(stageSkip[1]).toHaveProperty("reason");
	});

	it("should emit error event and clean staging on staging failure", async () => {
		const rules = createMandatoryRules(3);
		const { stub: fs, calls } = createMockFileSystem();
		// Make the second file fail during staging
		fs.stageFile.mockImplementation(async (path: string) => {
			if (path === "file-1.ts") {
				throw new Error("Disk full");
			}
		});
		const engine = new FileMergeEngine(fs);
		const events: ProgressEvent[] = [];

		const result = await engine.execute(rules, {
			onProgress: (event) => {
				events.push(event);
			},
		});

		expect(result.ok).toBe(false);

		// First file should have staged successfully
		const stageComplete = events.filter((e) => e.type === "stage_complete");
		expect(stageComplete).toHaveLength(1);

		// An error event should be emitted
		const errors = events.filter((e) => e.type === "error");
		expect(errors).toHaveLength(1);
		expect(errors[0]).toHaveProperty("filePath", "file-1.ts");
		expect(errors[0]).toHaveProperty("message");

		// No commit events on failure
		expect(events.filter((e) => e.type === "commit_start")).toHaveLength(0);
		expect(events.filter((e) => e.type === "commit_complete")).toHaveLength(0);

		// Staging should have been cleaned
		expect(calls.cleanStaging).toBe(1);
	});

	it("should emit error event on commit failure", async () => {
		const rules = createMandatoryRules(3);
		const { stub: fs, calls } = createMockFileSystem();
		// Make commitStaging throw
		fs.commitStaging.mockRejectedValue(new Error("Rename failed"));
		const engine = new FileMergeEngine(fs);
		const events: ProgressEvent[] = [];

		const result = await engine.execute(rules, {
			onProgress: (event) => {
				events.push(event);
			},
		});

		expect(result.ok).toBe(false);

		// All 3 files should have staged successfully
		const stageComplete = events.filter((e) => e.type === "stage_complete");
		expect(stageComplete).toHaveLength(3);

		// commit_start should have been emitted
		expect(events.filter((e) => e.type === "commit_start")).toHaveLength(1);

		// An error event should be emitted for the commit failure
		const errors = events.filter((e) => e.type === "error");
		expect(errors).toHaveLength(1);
		expect(errors[0]).toHaveProperty("message");
		expect(errors[0]).toHaveProperty("filePath", "");

		// commit_complete should NOT fire on failure
		expect(events.filter((e) => e.type === "commit_complete")).toHaveLength(0);

		// Staging should have been cleaned
		expect(calls.cleanStaging).toBe(1);
	});

	it("should handle noTemplateCopy entries by skipping them without staging", async () => {
		const rules: FileRule[] = [
			{ path: "real-file.txt", category: "mandatory", isDirectory: false, description: "" },
			{
				path: "virtual-entry",
				category: "optional",
				isDirectory: false,
				description: "",
				noTemplateCopy: true,
			},
		];
		const { stub: fs, calls } = createMockFileSystem();
		const engine = new FileMergeEngine(fs);
		const events: ProgressEvent[] = [];

		const result = await engine.execute(rules, {
			selectedOptionals: ["virtual-entry"],
			onProgress: (event) => {
				events.push(event);
			},
		});

		expect(result.ok).toBe(true);

		// Only the real file should be staged
		expect(calls.stageFile).toHaveLength(1);
		expect(calls.stageFile[0]).toBe("real-file.txt");

		// 1 stage_start + 1 stage_complete for the real file
		const stageComplete = events.filter((e) => e.type === "stage_complete");
		expect(stageComplete).toHaveLength(1);

		// 1 stage_skip for the virtual entry
		const stageSkip = events.filter((e) => e.type === "stage_skip");
		expect(stageSkip).toHaveLength(1);
		expect(stageSkip[0]).toHaveProperty("filePath", "virtual-entry");
		expect(stageSkip[0]).toHaveProperty("reason", "Virtual entry (no template copy)");

		// total should reflect stageable count only (1), not total rules (2)
		const commitStart = events.find((e) => e.type === "commit_start");
		expect(commitStart).toBeDefined();
		if (commitStart?.type === "commit_start") {
			expect(commitStart.total).toBe(1);
		}
	});

	it("should swallow errors thrown by the progress callback", async () => {
		const rules = createMandatoryRules(3);
		const { stub: fs } = createMockFileSystem();
		const engine = new FileMergeEngine(fs);

		// Callback that throws on the second event
		let callCount = 0;
		const result = await engine.execute(rules, {
			onProgress: (_event) => {
				callCount++;
				if (callCount === 2) {
					throw new Error("Callback crashed");
				}
			},
		});

		// The merge should still succeed even though the callback threw
		expect(result.ok).toBe(true);
	});
});
