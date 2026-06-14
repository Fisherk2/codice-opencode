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
				installedVersion: 123,
				installedAt: "2026-06-13T12:00:00.000Z",
			}),
		).toThrow("must be a version string");
	});

	test("fromJSON rejects non-semver version string", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				installedVersion: "not-a-version",
				installedAt: "2026-06-13T12:00:00.000Z",
			}),
		).toThrow("not a valid semver version");
	});

	test("fromJSON accepts v-prefixed semver versions", () => {
		const v = WorkspaceVersion.fromJSON({
			installedVersion: "v1.0.0",
			installedAt: "2026-06-13T12:00:00.000Z",
		});
		expect(v.version).toBe("v1.0.0");
	});

	test("fromJSON rejects invalid installedAt type", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				installedVersion: "1.0.0",
				installedAt: 123,
			}),
		).toThrow("must be an ISO 8601 timestamp");
	});

	test("fromJSON rejects non-ISO 8601 installedAt string", () => {
		expect(() =>
			WorkspaceVersion.fromJSON({
				installedVersion: "1.0.0",
				installedAt: "yesterday",
			}),
		).toThrow("must be an ISO 8601 timestamp");
	});

	test("fromJSON accepts ISO 8601 with milliseconds", () => {
		const v = WorkspaceVersion.fromJSON({
			installedVersion: "1.0.0",
			installedAt: "2026-06-13T12:00:00.000Z",
		});
		expect(v.installedAt).toBe("2026-06-13T12:00:00.000Z");
	});

	test("fromJSON accepts ISO 8601 without milliseconds", () => {
		const v = WorkspaceVersion.fromJSON({
			installedVersion: "1.0.0",
			installedAt: "2026-06-13T12:00:00Z",
		});
		expect(v.installedAt).toBe("2026-06-13T12:00:00Z");
	});

	test("fromJSON rejects null data", () => {
		expect(() => WorkspaceVersion.fromJSON(null)).toThrow("expected a JSON object");
	});

	test("toJSON serializes correctly", () => {
		const v = new WorkspaceVersion("1.0.0", "2026-06-13T12:00:00.000Z", ["Justfile"]);
		const json = v.toJSON();
		expect(json.installedVersion).toBe("1.0.0");
		expect(json.installedAt).toBe("2026-06-13T12:00:00.000Z");
		expect(json.optionalSelections).toEqual(["Justfile"]);
	});
});
