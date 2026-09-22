/**
 * Unit tests for the Opencode Legacy banner helper (FEV-30 Task 3.1).
 *
 * The banner is purely advisory: installs on the retired Opencode Legacy line
 * (<= 2.1.2) get a nudge after the V1 plugin removal. Every absent, corrupt,
 * or failing input must degrade to a silent no-op so the banner can never
 * break an install or update run.
 */

import { describe, expect, test } from "bun:test";
import { maybePrintLegacyBanner } from "../../../src/application/legacyBanner";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";

const INSTALLED_AT = "2026-01-01T00:00:00.000Z";

const BANNER_MESSAGE = "⚠ Opencode Legacy only — upgrade to ≥ 2.1.4 for native Opencode V2 support";

/** Build a `.codice-version` payload pinned to the given installed version. */
function versionFile(version: string): string {
	return JSON.stringify({ version, installedPacks: [], installedAt: INSTALLED_AT });
}

/** Loader double returning the given raw payload (null = file absent). */
function createLoader(raw: string | null): Pick<IFileSystem, "readVersionFile"> {
	return {
		readVersionFile: async () => raw,
	};
}

/** Warning double that records every message shown to the user. */
function createPrompt(): { prompt: Pick<IUserPrompt, "showWarning">; warnings: string[] } {
	const warnings: string[] = [];
	return {
		warnings,
		prompt: {
			showWarning: (message: string): void => {
				warnings.push(message);
			},
		},
	};
}

describe("maybePrintLegacyBanner", () => {
	test("when .codice-version is absent, does not print the banner", async () => {
		const { prompt, warnings } = createPrompt();

		await maybePrintLegacyBanner(createLoader(null), prompt);

		expect(warnings).toEqual([]);
	});

	test("when installed version is <= 2.1.2, prints the legacy banner", async () => {
		for (const version of ["2.1.0", "2.1.1", "2.1.2"]) {
			const { prompt, warnings } = createPrompt();

			await maybePrintLegacyBanner(createLoader(versionFile(version)), prompt);

			expect(warnings).toEqual([BANNER_MESSAGE]);
		}
	});

	test("when installed version is >= 2.1.3, does not print the banner", async () => {
		for (const version of ["2.1.3", "2.1.4", "3.0.0"]) {
			const { prompt, warnings } = createPrompt();

			await maybePrintLegacyBanner(createLoader(versionFile(version)), prompt);

			expect(warnings).toEqual([]);
		}
	});

	test("when installed version is invalid, does not print and does not throw", async () => {
		const { prompt, warnings } = createPrompt();
		const corruptFile = JSON.stringify({ version: "abc", installedAt: INSTALLED_AT });

		await maybePrintLegacyBanner(createLoader(corruptFile), prompt);

		expect(warnings).toEqual([]);
	});

	test("when the loader is absent or fails, degrades to a graceful no-op", async () => {
		const { prompt, warnings } = createPrompt();

		await maybePrintLegacyBanner(null, prompt);
		await maybePrintLegacyBanner(
			{
				readVersionFile: async (): Promise<string> => {
					throw new Error("EACCES: permission denied");
				},
			},
			prompt,
		);

		expect(warnings).toEqual([]);
	});
});
