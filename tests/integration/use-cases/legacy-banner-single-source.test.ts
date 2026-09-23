/**
 * Single-source Opencode Legacy banner (P4 regression guard).
 *
 * main() always shows the detection header (detectVersionContext ->
 * showVersionInfo -> buildVersionInfoMessages) before resolving the mode, and
 * the Clean/Project use cases share the exact fileSystem/destination as
 * detection (createDependencies(destinationPath)). The header therefore owns
 * the legacy warning; the install use cases must not emit it a second time.
 *
 * This test reconstructs that pipeline — real detection + real header builder
 * + real use case on a shared mock fileSystem — and counts emissions across
 * both former sites: exactly one for a legacy install, zero for >= 2.1.3.
 */

import { describe, expect, it } from "bun:test";
import { LEGACY_BANNER_MESSAGE } from "../../../src/application/legacyBanner";
import type { VersionDisplayInfo } from "../../../src/application/ports/IUserPrompt";
import type { InstallUseCaseBase } from "../../../src/application/use-cases/InstallUseCaseBase";
import { ProjectInstallUseCase } from "../../../src/application/use-cases/ProjectInstallUseCase";
import { detectVersionContext } from "../../../src/cli/main";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import { buildVersionInfoMessages } from "../../../src/infrastructure/adapters/versionInfoMessages";
import { OPENCODE_SYMLINKS } from "../../../src/infrastructure/config/symlinks";
import { createCleanInstallFixture } from "./clean-install-fixture";
import {
	createMockFileSystem,
	createMockGitignoreCreator,
	createMockPrompt,
	createMockSymlinkCreator,
	type MockedFileSystem,
	type UserPromptMock,
} from "./test-doubles";

const INSTALLED_AT = "2026-01-01T00:00:00.000Z";

/** Build a `.codice-version` payload pinned to the given installed version. */
function versionFile(version: string): string {
	return JSON.stringify({ version, installedPacks: [], installedAt: INSTALLED_AT });
}

type Mode = "clean" | "project";

interface Fixture {
	fs: MockedFileSystem;
	prompt: UserPromptMock;
	useCase: InstallUseCaseBase;
}

/** Wire the real use case for the given mode over a shared mock fileSystem. */
function buildFixture(mode: Mode, readVersionFile: string | null): Fixture {
	if (mode === "clean") {
		const { fs, prompt, useCase } = createCleanInstallFixture({ readVersionFile });
		return { fs, prompt, useCase };
	}

	const { stub: fs } = createMockFileSystem({ readVersionFile, trackDestinationExists: true });
	const prompt = createMockPrompt({ selectOptionalDefault: "none" });
	const useCase = new ProjectInstallUseCase(
		fs,
		new FileMergeEngine(fs),
		prompt,
		createMockSymlinkCreator(),
		OPENCODE_SYMLINKS,
		createMockGitignoreCreator(),
	);
	return { fs, prompt, useCase };
}

/** Replace showWarning with a recorder and return the captured messages. */
function recordWarnings(prompt: UserPromptMock): string[] {
	const warnings: string[] = [];
	prompt.showWarning.mockImplementation((message: string) => {
		warnings.push(message);
	});
	return warnings;
}

/** Count banner emissions across the detection header and the install flow. */
function countEmissions(info: VersionDisplayInfo, warnings: readonly string[]): number {
	const headerEmits = buildVersionInfoMessages(info).message.includes(LEGACY_BANNER_MESSAGE);
	const warningEmits = warnings.filter((w) => w.includes(LEGACY_BANNER_MESSAGE)).length;
	return (headerEmits ? 1 : 0) + warningEmits;
}

describe("Opencode Legacy banner — single source across detection + install", () => {
	for (const mode of ["clean", "project"] as const) {
		it(`${mode}: a legacy install emits the banner exactly once`, async () => {
			const { fs, prompt, useCase } = buildFixture(mode, versionFile("2.1.2"));
			const warnings = recordWarnings(prompt);

			const info = await detectVersionContext(fs);
			const result = await useCase.execute("/tmp/legacy-dest", { force: true });

			expect(result.ok).toBe(true);
			expect(countEmissions(info, warnings)).toBe(1);
		});

		it(`${mode}: an install >= 2.1.3 emits no banner`, async () => {
			const { fs, prompt, useCase } = buildFixture(mode, versionFile("2.1.3"));
			const warnings = recordWarnings(prompt);

			const info = await detectVersionContext(fs);
			const result = await useCase.execute("/tmp/current-dest", { force: true });

			expect(result.ok).toBe(true);
			expect(countEmissions(info, warnings)).toBe(0);
		});
	}
});
