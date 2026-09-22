/**
 * Unit tests for the Opencode Legacy version predicate (FEV-30 Task 3.1).
 *
 * The predicate classifies installs on the retired Opencode Legacy line
 * (<= 2.1.2). The warning itself is emitted once by the detection header
 * (versionInfoMessages); the Clean/Project use cases no longer duplicate it,
 * so there is no banner helper left to test here.
 */

import { describe, expect, test } from "bun:test";
import { isLegacyVersion } from "../../../src/application/legacyBanner";

describe("isLegacyVersion", () => {
	test.each(["2.0.0", "2.1.0", "2.1.1", "2.1.2"])(
		"version %s (< 2.1.3) is on the legacy line",
		(version) => {
			expect(isLegacyVersion(version)).toBe(true);
		},
	);

	test.each(["2.1.3", "2.1.3-beta.1", "2.1.4", "2.1.10", "3.0.0"])(
		"version %s (>= 2.1.3) is not on the legacy line",
		(version) => {
			expect(isLegacyVersion(version)).toBe(false);
		},
	);

	test("invalid version degrades to false (fail-open)", () => {
		expect(isLegacyVersion("abc")).toBe(false);
		expect(isLegacyVersion("")).toBe(false);
	});
});
