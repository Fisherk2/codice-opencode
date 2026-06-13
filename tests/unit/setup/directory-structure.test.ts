/**
 * Directory Structure Validation Tests
 */

import { describe, expect, test } from "bun:test";
import { fileExists } from "./helpers";

describe("Directory Structure", () => {
	const requiredDirs = [
		"src/domain/entities",
		"src/domain/services",
		"src/application/ports",
		"src/application/use-cases",
		"src/infrastructure/adapters",
		"src/infrastructure/config",
		"src/cli",
		"tests/unit",
		"tests/integration",
		"tests/e2e",
		"tests/fixtures",
		"template",
	];

	for (const dir of requiredDirs) {
		test(`directory ${dir} exists`, () => {
			expect(fileExists(dir)).toBe(true);
		});
	}
});
