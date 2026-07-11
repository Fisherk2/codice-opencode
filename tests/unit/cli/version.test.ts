import { describe, expect, it } from "bun:test";
import { VERSION } from "../../../src/cli/version";

describe("VERSION", () => {
	it("is a valid semver string", () => {
		expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});

	it("is not empty", () => {
		expect(VERSION.length).toBeGreaterThan(0);
	});
});
