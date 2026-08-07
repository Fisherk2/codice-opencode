import { afterEach, describe, expect, mock, test } from "bun:test";
import { VerboseLogger } from "../../../src/infrastructure/adapters/VerboseLogger";

/**
 * VerboseLogger unit tests.
 *
 * Covers the two branches (enabled/disabled), the operation-only and
 * operation+detail formats, and the timestamp prefix. console.warn is
 * mocked so stderr output is verified without polluting test output.
 */
describe("VerboseLogger", () => {
	// biome-ignore lint/suspicious/noConsole: test code — capturing original to restore afterEach
	const originalWarn = console.warn;
	afterEach(() => {
		console.warn = originalWarn;
	});

	test("disabled logger emits nothing", () => {
		const warnCalls: unknown[][] = [];
		console.warn = mock((...args: unknown[]) => {
			warnCalls.push(args);
		});

		const logger = new VerboseLogger(false);
		logger.log("stage", "file.txt → dest/file.txt");
		logger.log("commit", "2 file(s)");

		expect(warnCalls.length).toBe(0);
	});

	test("enabled logger emits timestamped operation-only line", () => {
		const warnCalls: unknown[][] = [];
		console.warn = mock((...args: unknown[]) => {
			warnCalls.push(args);
		});

		const logger = new VerboseLogger(true);
		logger.log("clean");

		expect(warnCalls.length).toBe(1);
		const message = warnCalls[0]?.[0] as string;
		// Timestamp prefix: [ISO 8601] operation
		expect(message).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		expect(message).toContain("] clean");
	});

	test("enabled logger emits operation: detail line", () => {
		const warnCalls: unknown[][] = [];
		console.warn = mock((...args: unknown[]) => {
			warnCalls.push(args);
		});

		const logger = new VerboseLogger(true);
		logger.log("symlink", "created /w/.opencode/agents → ../agents");

		expect(warnCalls.length).toBe(1);
		const message = warnCalls[0]?.[0] as string;
		expect(message).toContain("] symlink: created /w/.opencode/agents → ../agents");
	});
});
