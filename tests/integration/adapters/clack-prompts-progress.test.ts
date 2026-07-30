import { beforeEach, describe, expect, it, mock } from "bun:test";

// Track calls to clack.progress and clack.log methods
const progressOpts: Array<{ max?: number; style?: string }> = [];
const progressBarCalls: Array<{ method: string; args: unknown[] }> = [];
const logCalls: Array<{ method: string; args: string[] }> = [];

const mockProgressBar = {
	start: mock((label?: string) => {
		progressBarCalls.push({ method: "start", args: [label] });
	}) as (label?: string) => void,
	advance: mock((step?: number, msg?: string) => {
		progressBarCalls.push({ method: "advance", args: [step, msg] });
	}) as (step?: number, msg?: string) => void,
	stop: mock(() => {
		progressBarCalls.push({ method: "stop", args: [] });
	}) as () => void,
};

mock.module("@clack/prompts", () => ({
	note: mock(() => {}),
	confirm: mock(() => Promise.resolve(true)),
	multiselect: mock(() => Promise.resolve([])),
	select: mock(() => Promise.resolve("clean")),
	spinner: mock(() => ({ start: mock(() => {}), stop: mock(() => {}), message: mock(() => {}) })),
	intro: mock(() => {}),
	outro: mock(() => {}),
	cancel: mock(() => {}),
	isCancel: mock(() => false),
	progress: mock((opts?: { max?: number; style?: string }) => {
		progressOpts.push({ max: opts?.max, style: opts?.style });
		return mockProgressBar;
	}) as (opts?: { max?: number; style?: string }) => typeof mockProgressBar,
	log: {
		message: mock((_msg?: string) => {}) as (...args: unknown[]) => void,
		info: mock((msg: string) => {
			logCalls.push({ method: "info", args: [msg] });
		}) as (msg: string) => void,
		success: mock((msg: string) => {
			logCalls.push({ method: "success", args: [msg] });
		}) as (msg: string) => void,
		step: mock((msg: string) => {
			logCalls.push({ method: "step", args: [msg] });
		}) as (msg: string) => void,
		warn: mock((msg: string) => {
			logCalls.push({ method: "warn", args: [msg] });
		}) as (msg: string) => void,
		warning: mock((_msg: string) => {}) as (msg: string) => void,
		error: mock((msg: string) => {
			logCalls.push({ method: "error", args: [msg] });
		}) as (msg: string) => void,
	},
}));

// Import after mock is set up
const { ClackPromptsAdapter } = await import(
	"../../../src/infrastructure/adapters/ClackPromptsAdapter"
);

describe("ClackPromptsAdapter — progress methods", () => {
	let adapter: InstanceType<typeof ClackPromptsAdapter>;

	beforeEach(() => {
		progressOpts.length = 0;
		progressBarCalls.length = 0;
		logCalls.length = 0;
		adapter = new ClackPromptsAdapter();
	});

	describe("showProgressBar", () => {
		it("creates clack.progress with max=total and starts with label", () => {
			adapter.showProgressBar(10, "Installing...");

			expect(progressOpts).toEqual([{ max: 10, style: "heavy" }]);
			expect(progressBarCalls).toContainEqual({
				method: "start",
				args: ["Installing..."],
			});
		});

		it("skips start when label is not provided", () => {
			adapter.showProgressBar(5);

			expect(progressOpts).toEqual([{ max: 5, style: "heavy" }]);
			expect(progressBarCalls).not.toContainEqual(expect.objectContaining({ method: "start" }));
		});
	});

	describe("updateProgress", () => {
		it("advances progress bar with file path", () => {
			adapter.showProgressBar(10);
			adapter.updateProgress(3, "src/file.ts");

			expect(progressBarCalls).toContainEqual({
				method: "advance",
				args: [1, "Processing: src/file.ts"],
			});
		});

		it("does nothing when progress bar is not initialized", () => {
			expect(() => adapter.updateProgress(0, "file.ts")).not.toThrow();
		});
	});

	describe("completeProgress", () => {
		it("stops and clears the progress bar", () => {
			adapter.showProgressBar(10);
			adapter.completeProgress();

			expect(progressBarCalls).toContainEqual({ method: "stop", args: [] });
		});

		it("does nothing when progress bar is not initialized", () => {
			expect(() => adapter.completeProgress()).not.toThrow();
		});
	});

	describe("logProgressEvent", () => {
		it.each([
			["commit: 47 files committed", "success", "✓ 47 files committed"],
			["symlink: Created .opencode/agents", "success", "🔗 Created .opencode/agents"],
		])('"%s" prefix calls clack.log.%s', (message, method, expectedText) => {
			adapter.logProgressEvent(message);
			expect(logCalls).toContainEqual({
				method,
				args: [expectedText],
			});
		});

		it('"gitignore:" prefix calls clack.log.info', () => {
			adapter.logProgressEvent("gitignore: Generated .gitignore");
			expect(logCalls).toContainEqual({
				method: "info",
				args: ["📄 Generated .gitignore"],
			});
		});

		it('"error:" prefix calls clack.log.error', () => {
			adapter.logProgressEvent("error: Permission denied");
			expect(logCalls).toContainEqual({
				method: "error",
				args: ["✗ Permission denied"],
			});
		});

		it('"skip:" prefix calls clack.log.warn', () => {
			adapter.logProgressEvent("skip: File already exists");
			expect(logCalls).toContainEqual({
				method: "warn",
				args: ["⊘ File already exists"],
			});
		});

		it("unknown prefix calls clack.log.step with full message", () => {
			adapter.logProgressEvent("unknown: doing something");
			expect(logCalls).toContainEqual({
				method: "step",
				args: ["unknown: doing something"],
			});
		});

		it("message without colon calls clack.log.step", () => {
			adapter.logProgressEvent("Processing files");
			expect(logCalls).toContainEqual({
				method: "step",
				args: ["Processing files"],
			});
		});
	});
});
