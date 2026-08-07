import { describe, expect, test } from "bun:test";
import type { VersionDisplayInfo } from "../../../src/application/ports/IUserPrompt";
import { buildVersionInfoMessages } from "../../../src/infrastructure/adapters/versionInfoMessages";

describe("buildVersionInfoMessages", () => {
	test("missing status shows no-installation guidance", () => {
		const info: VersionDisplayInfo = { version: null, installedPacks: [], status: "missing" };

		const result = buildVersionInfoMessages(info);

		expect(result.title).toContain("No Installation Detected");
		expect(result.message).toContain("No previous Códice installation found");
		expect(result.message).toContain("Update is not available");
	});

	test("pre-1.2.0 status includes the detected version", () => {
		const info: VersionDisplayInfo = { version: "1.1.0", installedPacks: [], status: "pre-1.2.0" };

		const result = buildVersionInfoMessages(info);

		expect(result.title).toContain("Pre-1.2.0 Installation Detected");
		expect(result.message).toContain("v1.1.0");
		expect(result.message).toContain("references/ and .devin/");
	});

	test("pre-1.2.0 falls back to '?' when version is unknown", () => {
		const info: VersionDisplayInfo = { version: null, installedPacks: [], status: "pre-1.2.0" };

		expect(buildVersionInfoMessages(info).message).toContain("v?");
	});

	test("pre-2.0.0 status explains the new pack system", () => {
		const info: VersionDisplayInfo = { version: "1.9.0", installedPacks: [], status: "pre-2.0.0" };

		const result = buildVersionInfoMessages(info);

		expect(result.title).toContain("Pre-2.0.0 Installation Detected");
		expect(result.message).toContain("v1.9.0");
		expect(result.message).toContain("pack system");
	});

	test("v2.0+ status lists installed packs", () => {
		const info: VersionDisplayInfo = {
			version: "2.0.0",
			installedPacks: ["software-development", "business"],
			status: "v2.0+",
		};

		const result = buildVersionInfoMessages(info);

		expect(result.title).toContain("v2.0+ Installation Detected");
		expect(result.message).toContain("Current installation: v2.0.0");
		expect(result.message).toContain("software-development, business");
	});

	test("v2.0+ shows '(none)' when no packs are installed", () => {
		const info: VersionDisplayInfo = { version: "2.0.0", installedPacks: [], status: "v2.0+" };

		expect(buildVersionInfoMessages(info).message).toContain("(none)");
	});
});
