/**
 * Unit tests for WorkspaceVersion value object.
 * Tests comparison methods that use the semver library.
 */

import { describe, expect, test } from "bun:test";
import { WorkspaceVersion } from "../../../src/domain/entities/WorkspaceVersion";

describe("WorkspaceVersion comparison", () => {
	test("isNewerThan returns true when this version is greater", () => {
		const v1 = new WorkspaceVersion("1.1.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		expect(v1.isNewerThan(v2)).toBe(true);
	});

	test("isNewerThan returns false when this version is lesser", () => {
		const v1 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.1.0", "2026-06-13T12:00:00.000Z");
		expect(v1.isNewerThan(v2)).toBe(false);
	});

	test("isNewerThan returns false when versions are equal", () => {
		const v1 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.0.0", "2026-06-14T12:00:00.000Z");
		expect(v1.isNewerThan(v2)).toBe(false);
	});

	test("isOlderThan returns true when this version is lesser", () => {
		const v1 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.1.0", "2026-06-13T12:00:00.000Z");
		expect(v1.isOlderThan(v2)).toBe(true);
	});

	test("isOlderThan returns false when this version is greater", () => {
		const v1 = new WorkspaceVersion("1.1.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		expect(v1.isOlderThan(v2)).toBe(false);
	});

	test("isOlderThan returns false when versions are equal", () => {
		const v1 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.0.0", "2026-06-14T12:00:00.000Z");
		expect(v1.isOlderThan(v2)).toBe(false);
	});

	test("equals returns true when versions match", () => {
		const v1 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.0.0", "2026-06-14T12:00:00.000Z");
		expect(v1.equals(v2)).toBe(true);
	});

	test("equals returns false when versions differ", () => {
		const v1 = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const v2 = new WorkspaceVersion("1.1.0", "2026-06-13T12:00:00.000Z");
		expect(v1.equals(v2)).toBe(false);
	});

	test("compare returns 'newer' when remote is greater than local", () => {
		const local = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const remote = new WorkspaceVersion("1.1.0", "2026-06-14T12:00:00.000Z");
		expect(local.compare(remote)).toBe("older");
	});

	test("compare returns 'older' when remote is lesser than local", () => {
		const local = new WorkspaceVersion("1.1.0", "2026-06-13T12:00:00.000Z");
		const remote = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		expect(local.compare(remote)).toBe("newer");
	});

	test("compare returns 'equal' when versions match", () => {
		const local = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		const remote = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z");
		expect(local.compare(remote)).toBe("equal");
	});

	test("fromJSON rejects invalid version format", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				version: 123,
				installedAt: "2026-06-13T12:00:00.000Z",
			}),
		).toThrow("must be a version string");
	});

	test("fromJSON rejects non-semver version string", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				version: "not-a-version",
				installedAt: "2026-06-13T12:00:00.000Z",
			}),
		).toThrow("not a valid semver version");
	});

	test("fromJSON accepts v-prefixed semver versions", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "v1.0.0",
			installedAt: "2026-06-13T12:00:00.000Z",
		});
		expect(v.version).toBe("v1.0.0");
	});

	test("fromJSON rejects invalid installedAt type", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				version: "1.0.0",
				installedAt: 123,
			}),
		).toThrow("must be an ISO 8601 timestamp");
	});

	test("fromJSON rejects non-ISO 8601 installedAt string", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				version: "1.0.0",
				installedAt: "yesterday",
			}),
		).toThrow("must be an ISO 8601 timestamp");
	});

	test("fromJSON accepts ISO 8601 with milliseconds", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "1.0.0",
			installedAt: "2026-06-13T12:00:00.000Z",
		});
		expect(v.installedAt).toBe("2026-06-13T12:00:00.000Z");
	});

	test("fromJSON accepts ISO 8601 without milliseconds", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "1.0.0",
			installedAt: "2026-06-13T12:00:00Z",
		});
		expect(v.installedAt).toBe("2026-06-13T12:00:00Z");
	});

	test("fromJSON rejects null data", () => {
		expect(() => WorkspaceVersion.fromJSON(null)).toThrow("expected a JSON object");
	});

	test("toJSON serializes correctly", () => {
		const v = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z", [], ["Justfile"]);
		const json = v.toJSON();
		expect(json.version).toBe("1.0.0");
		expect(json.installedAt).toBe("2026-06-13T12:00:00.000Z");
		expect(json.optionalSelections).toEqual(["Justfile"]);
	});

	test("fromJSON parses optionalSelections array of strings", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "1.0.0",
			installedAt: "2026-06-13T12:00:00.000Z",
			optionalSelections: ["Justfile", "README.md"],
		});
		expect(v.optionalSelections).toEqual(["Justfile", "README.md"]);
	});

	test("fromJSON treats non-array optionalSelections as empty", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "1.0.0",
			installedAt: "2026-06-13T12:00:00.000Z",
			optionalSelections: "not-an-array",
		});
		expect(v.optionalSelections).toEqual([]);
	});

	test("fromJSON treats missing optionalSelections as empty", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "1.0.0",
			installedAt: "2026-06-13T12:00:00.000Z",
		});
		expect(v.optionalSelections).toEqual([]);
	});
});

describe("WorkspaceVersion v2.0 format", () => {
	test("fromJSON accepts v2.0 format with version and installedPacks", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "2.0.0",
			installedPacks: ["software-development", "business"],
			installedAt: "2026-08-06T12:00:00.000Z",
		});
		expect(v.version).toBe("2.0.0");
		expect(v.installedPacks).toEqual(["software-development", "business"]);
	});

	test("fromJSON accepts legacy v1.x format with installedVersion (backward compat)", () => {
		const v = WorkspaceVersion.fromJSON({
			installedVersion: "1.2.0",
			installedAt: "2026-08-06T12:00:00.000Z",
		});
		expect(v.version).toBe("1.2.0");
		expect(v.installedPacks).toEqual([]);
	});

	test("fromJSON rejects installedPacks that is not an array", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				version: "2.0.0",
				installedPacks: "software-development",
				installedAt: "2026-08-06T12:00:00.000Z",
			}),
		).toThrow("must be an array of pack IDs");
	});

	test("fromJSON filters non-string entries from installedPacks", () => {
		const v = WorkspaceVersion.fromJSON({
			version: "2.0.0",
			installedPacks: ["software-development", 123, null, "business"],
			installedAt: "2026-08-06T12:00:00.000Z",
		});
		expect(v.installedPacks).toEqual(["software-development", "business"]);
	});

	test("toJSON emits v2.0 format with version, installedPacks, installedAt, optionalSelections", () => {
		const v = new WorkspaceVersion(
			"2.0.0",
			"2026-08-06T12:00:00.000Z",
			["software-development"],
			["scripts/build.sh"],
		);
		expect(v.toJSON()).toEqual({
			version: "2.0.0",
			installedPacks: ["software-development"],
			installedAt: "2026-08-06T12:00:00.000Z",
			optionalSelections: ["scripts/build.sh"],
		});
	});
});
