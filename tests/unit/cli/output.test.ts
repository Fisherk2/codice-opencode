/**
 * Tests for CLI output helpers (output.ts)
 */

import { describe, expect, spyOn, test } from "bun:test";

// The module might have been imported already in other tests, so we
// use a fresh import for each test group via dynamic import with cache bust.
// Actually, re-importing the same module gives the same reference, so we
// just import once and test the exports directly.
import {
	EXIT_ERROR,
	EXIT_INTERRUPT,
	EXIT_SUCCESS,
	EXIT_USAGE,
	printHelp,
	printVersion,
	VERSION,
} from "../../../src/cli/output";

describe("output constants", () => {
	test("VERSION is a non-empty string", () => {
		expect(typeof VERSION).toBe("string");
		expect(VERSION.length).toBeGreaterThan(0);
	});

	test("VERSION follows semver format", () => {
		expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});

	test("EXIT_SUCCESS is 0", () => {
		expect(EXIT_SUCCESS).toBe(0);
	});

	test("EXIT_ERROR is 1", () => {
		expect(EXIT_ERROR).toBe(1);
	});

	test("EXIT_USAGE is 2", () => {
		expect(EXIT_USAGE).toBe(2);
	});

	test("EXIT_INTERRUPT is 130", () => {
		expect(EXIT_INTERRUPT).toBe(130);
	});

	test("all exit codes are distinct", () => {
		const codes = [EXIT_SUCCESS, EXIT_ERROR, EXIT_USAGE, EXIT_INTERRUPT];
		expect(new Set(codes).size).toBe(codes.length);
	});
});

describe("printVersion", () => {
	test("should print the version string to stdout", () => {
		const spy = spyOn(console, "log").mockImplementation(() => {});

		try {
			printVersion();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(`Códice v${VERSION}`);
		} finally {
			spy.mockRestore();
		}
	});
});

describe("printHelp", () => {
	test("should print help text containing Códice and version", () => {
		const spy = spyOn(console, "log").mockImplementation(() => {});

		try {
			printHelp();
			expect(spy).toHaveBeenCalledTimes(1);
			const helpText = spy.mock.calls[0]![0] as string;
			expect(helpText).toContain("Códice");
			expect(helpText).toContain(VERSION);
			expect(helpText).toContain("--clean");
			expect(helpText).toContain("--project");
			expect(helpText).toContain("--update");
			expect(helpText).toContain("--version");
			expect(helpText).toContain("--help");
			expect(helpText).toContain("--force");
			expect(helpText).toContain("--verbose");
			expect(helpText).toContain("--dest");
			expect(helpText).toContain("Exit codes");
		} finally {
			spy.mockRestore();
		}
	});
});
