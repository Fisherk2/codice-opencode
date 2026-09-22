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

	test.each(["2.1.0", "2.1.1", "2.1.2"])(
		"when installed version is %s (<= 2.1.2), prints the legacy banner",
		async (version) => {
			const { prompt, warnings } = createPrompt();

			await maybePrintLegacyBanner(createLoader(versionFile(version)), prompt);

			expect(warnings).toEqual([BANNER_MESSAGE]);
		},
	);

	// "2.1.10" kills the lexicographic trap: string-wise it sorts below
	// "2.1.2", but numerically patch 10 > 2, so semver keeps it off the
	// legacy line.
	test.each(["2.1.3", "2.1.4", "2.1.10", "3.0.0"])(
		"when installed version is %s (>= 2.1.3), does not print the banner",
		async (version) => {
			const { prompt, warnings } = createPrompt();

			await maybePrintLegacyBanner(createLoader(versionFile(version)), prompt);

			expect(warnings).toEqual([]);
		},
	);

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

	test("when .codice-version uses the legacy v1.x installedVersion field, prints the banner", async () => {
		const { prompt, warnings } = createPrompt();
		const v1Payload = JSON.stringify({ installedVersion: "1.2.0", installedAt: INSTALLED_AT });

		await maybePrintLegacyBanner(createLoader(v1Payload), prompt);

		// WorkspaceVersion.fromJSON accepts the v1.x field; 1.2.0 <= 2.1.2 puts
		// those installs on the retired legacy line, so the nudge applies.
		expect(warnings).toEqual([BANNER_MESSAGE]);
	});

	test("when showWarning itself throws, the promise still resolves without rethrowing", async () => {
		const throwingPrompt: Pick<IUserPrompt, "showWarning"> = {
			showWarning: (_message: string): void => {
				throw new Error("TUI crashed");
			},
		};

		// Full fail-open: even the warning channel failing must not take the
		// caller's flow down with it.
		const settled = await maybePrintLegacyBanner(
			createLoader(versionFile("2.1.0")),
			throwingPrompt,
		);

		expect(settled).toBeUndefined();
	});

	test("when .codice-version contains malformed JSON, degrades to a silent no-op", async () => {
		const { prompt, warnings } = createPrompt();

		await maybePrintLegacyBanner(createLoader("not-json{"), prompt);

		expect(warnings).toEqual([]);
	});
});
