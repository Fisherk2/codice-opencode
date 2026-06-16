import { describe, expect, it } from "bun:test";
import { parseArgs } from "../../../src/cli/parse-args";

describe("parseArgs", () => {
	it("should return interactive mode when no flags are given", () => {
		const result = parseArgs([]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("interactive");
		expect(result!.options.force).toBe(false);
		expect(result!.options.verbose).toBe(false);
	});

	it("should return clean mode for --clean flag", () => {
		const result = parseArgs(["--clean"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("clean");
	});

	it("should return project mode for --project flag", () => {
		const result = parseArgs(["--project"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("project");
	});

	it("should return update mode for --update flag", () => {
		const result = parseArgs(["--update"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("update");
	});

	it("should extract --force flag", () => {
		const result = parseArgs(["--clean", "--force"]);
		expect(result).not.toBeNull();
		expect(result!.options.force).toBe(true);
	});

	it("should extract --verbose flag", () => {
		const result = parseArgs(["--project", "--verbose"]);
		expect(result).not.toBeNull();
		expect(result!.options.verbose).toBe(true);
	});

	it("should allow combined --force and --verbose flags", () => {
		const result = parseArgs(["--update", "--force", "--verbose"]);
		expect(result).not.toBeNull();
		expect(result!.options.force).toBe(true);
		expect(result!.options.verbose).toBe(true);
	});

	it("should return null for unknown positional arguments", () => {
		const result = parseArgs(["unknown-arg"]);
		expect(result).toBeNull();
	});

	it("should return null for unknown flags", () => {
		const result = parseArgs(["--unknown-flag"]);
		expect(result).toBeNull();
	});

	it("should return interactive mode when only flags (force/verbose) are provided without a mode flag", () => {
		const result = parseArgs(["--force", "--verbose"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("interactive");
		expect(result!.options.force).toBe(true);
		expect(result!.options.verbose).toBe(true);
	});

	// -----------------------------------------------------------------------
	// --dest flag tests
	// -----------------------------------------------------------------------

	it("should parse --dest with a path", () => {
		const result = parseArgs(["--clean", "--dest", "/tmp/test-dir"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("clean");
		expect(result!.destination).toBe("/tmp/test-dir");
	});

	it("should return null if --dest is provided without a value", () => {
		const result = parseArgs(["--clean", "--dest"]);
		expect(result).toBeNull();
	});

	it("should extract destination in interactive mode", () => {
		const result = parseArgs(["--dest", "/custom/path"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("interactive");
		expect(result!.destination).toBe("/custom/path");
	});

	it("should keep destination undefined when --dest is not provided", () => {
		const result = parseArgs(["--clean"]);
		expect(result).not.toBeNull();
		expect(result!.destination).toBeUndefined();
	});

	it("should allow combined --dest with --force and --verbose", () => {
		const result = parseArgs(["--update", "--dest", "./my-project", "--force", "--verbose"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("update");
		expect(result!.destination).toBe("./my-project");
		expect(result!.options.force).toBe(true);
		expect(result!.options.verbose).toBe(true);
	});
});
