import { describe, expect, test } from "bun:test";
import { validatePackList } from "../../../src/cli/validatePackList";

describe("validatePackList", () => {
	test("returns null when raw is undefined", () => {
		expect(validatePackList(undefined)).toBeNull();
	});

	test("returns raw when a single valid pack ID is provided", () => {
		expect(validatePackList("software-development")).toBe("software-development");
	});

	test("returns raw when multiple valid pack IDs are provided", () => {
		const input = "software-development,business";
		expect(validatePackList(input)).toBe(input);
	});

	test("returns null when any entry is an empty string after splitting", () => {
		// Trailing comma produces an empty entry after split+trim
		expect(validatePackList("software-development,")).toBeNull();
	});

	test("returns null when any entry is unknown", () => {
		expect(validatePackList("software-development,nonexistent-pack")).toBeNull();
	});

	test("returns null for empty string input", () => {
		expect(validatePackList("")).toBeNull();
	});

	test("trims whitespace around entries and still validates", () => {
		const input = " software-development , business ";
		expect(validatePackList(input)).toBe(input);
	});

	test("returns raw for all valid pack IDs", () => {
		const allValid =
			"software-development,business,hardware-emerging,science-research,operations-support,finance,creative,government-legal";
		expect(validatePackList(allValid)).toBe(allValid);
	});

	test("returns null when a single unknown ID is mixed with valid ones", () => {
		expect(validatePackList("business,creative,fake-pack")).toBeNull();
	});

	test("returns null when first entry is empty (leading comma)", () => {
		expect(validatePackList(",software-development")).toBeNull();
	});
});
