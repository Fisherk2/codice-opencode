/**
 * Unit tests for versionData.ts (parseVersionData).
 *
 * parseVersionData was extracted from UpdateWorkspaceUseCase to be shared
 * across use cases; these tests pin down its boundary behaviors (absent
 * file, malformed JSON, schema violations, happy path) in isolation.
 */

import { describe, expect, test } from "bun:test";
import { parseVersionData } from "../../../src/application/versionData";

const V2_VERSION_FILE = JSON.stringify({
	version: "2.0.0",
	installedPacks: ["software-development"],
	installedAt: "2026-01-01T00:00:00.000Z",
});

describe("parseVersionData", () => {
	test("returns null when the file is absent", () => {
		expect(parseVersionData(null)).toBeNull();
	});

	test("returns null when the payload is malformed JSON", () => {
		expect(parseVersionData("{ not json")).toBeNull();
	});

	test("returns null when the payload fails schema validation", () => {
		expect(parseVersionData(JSON.stringify({ version: "not-semver" }))).toBeNull();
	});

	test("parses a v2.0 payload into a WorkspaceVersion", () => {
		const parsed = parseVersionData(V2_VERSION_FILE);
		expect(parsed).not.toBeNull();
		expect(parsed!.version).toBe("2.0.0");
		expect(parsed!.installedPacks).toEqual(["software-development"]);
	});
});
