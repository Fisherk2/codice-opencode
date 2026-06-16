/**
 * Unit tests for MergeError types and factory helpers.
 */

import { describe, expect, test } from "bun:test";
import type { MergeError } from "../../../src/domain/types/MergeError";
import { commitError, stagingError, validationError } from "../../../src/domain/types/MergeError";

describe("MergeError factories", () => {
	test("stagingError creates error with staging phase", () => {
		const err = stagingError("opencode.json", "Disk full");
		expect(err.phase).toBe("staging");
		expect(err.path).toBe("opencode.json");
		expect(err.message).toBe("Disk full");
	});

	test("commitError creates error with commit phase and no path", () => {
		const err = commitError("Rename failed");
		expect(err.phase).toBe("commit");
		expect(err.path).toBeUndefined();
		expect(err.message).toBe("Rename failed");
	});

	test("validationError creates error with validation phase", () => {
		const err = validationError("agents", "Type mismatch");
		expect(err.phase).toBe("validation");
		expect(err.path).toBe("agents");
		expect(err.message).toBe("Type mismatch");
	});

	test("MergeError type is structurally compatible", () => {
		// Verify structural typing works with all fields
		const err: MergeError = {
			phase: "staging",
			path: "file.txt",
			message: "Test error",
		};
		expect(err.phase).toBe("staging");
		expect(err.path).toBe("file.txt");
		expect(err.message).toBe("Test error");
	});
});
