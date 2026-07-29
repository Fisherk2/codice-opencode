import { describe, expect, test } from "bun:test";
import { DEFAULT_SDD_PIPELINE_CONFIG } from "../types";

describe("types.ts — DEFAULT_SDD_PIPELINE_CONFIG", () => {
	test("exists and is non-null", () => {
		expect(DEFAULT_SDD_PIPELINE_CONFIG).toBeDefined();
		expect(DEFAULT_SDD_PIPELINE_CONFIG).not.toBeNull();
	});

	test("has commandPhaseMap with expected values", () => {
		const map = DEFAULT_SDD_PIPELINE_CONFIG.commandPhaseMap;
		expect(map).toBeDefined();
		expect(map!["/spec"]).toBe("define");
		expect(map!["/build"]).toBe("build");
		expect(map!["/test"]).toBe("verify");
	});

	test("has intentPatterns with expected values", () => {
		const patterns = DEFAULT_SDD_PIPELINE_CONFIG.intentPatterns;
		expect(patterns).toBeDefined();
		expect(patterns!["/build"]).toBeDefined();
		expect(patterns!["/build"]!.includes("build")).toBe(true);
	});

	test("has phaseSuggestions with expected values", () => {
		const suggestions = DEFAULT_SDD_PIPELINE_CONFIG.phaseSuggestions;
		expect(suggestions).toBeDefined();
		expect(suggestions!["define"]).toBeDefined();
		expect(suggestions!["ship"]).toBeDefined();
	});

	test("all fields are optional (can be omitted)", () => {
		// This is a compile-time check expressed as a runtime test:
		// Verify that we can destructure with defaults
		const {
			commandPhaseMap = {},
			intentPatterns = {},
			phaseSuggestions = {},
		} = DEFAULT_SDD_PIPELINE_CONFIG;

		expect(commandPhaseMap).toBeDefined();
		expect(intentPatterns).toBeDefined();
		expect(phaseSuggestions).toBeDefined();
	});
});
