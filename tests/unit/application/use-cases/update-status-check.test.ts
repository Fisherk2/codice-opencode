/**
 * Unit tests for updateStatusCheck.ts helpers (FEV-21 Phase 4).
 *
 * reportRemoteStatus and notifyIfUpToDate were extracted from
 * UpdateWorkspaceUseCase to keep the class under the 200-line convention;
 * these tests pin down the informational status behaviors (no remote tag,
 * remote ahead, up-to-date, comparison failure) in isolation.
 */

import { describe, expect, mock as mockFn, test } from "bun:test";
import type { IGitHubClient } from "../../../../src/application/ports/IGitHubClient";
import type { IUserPrompt } from "../../../../src/application/ports/IUserPrompt";
import {
	notifyIfUpToDate,
	reportRemoteStatus,
	type UpdateStatusDeps,
} from "../../../../src/application/use-cases/updateStatusCheck";
import { WorkspaceVersion } from "../../../../src/domain/entities/WorkspaceVersion";

/** VersionComparator stub: returns a canned result for every compare() call. */
function makeComparator(result: "ahead" | "behind" | "equal") {
	return {
		compare: mockFn(() => ({ ok: true, value: result }) as const),
	};
}

function makePrompt(): IUserPrompt & { warnings: string[]; infos: string[] } {
	const warnings: string[] = [];
	const infos: string[] = [];
	return {
		showWarning: mockFn((msg: string) => {
			warnings.push(msg);
		}),
		showInfo: mockFn((msg: string) => {
			infos.push(msg);
		}),
		confirm: mockFn(() => Promise.resolve(true)),
		selectOptional: mockFn(() => Promise.resolve([])),
		showProgressBar: mockFn(() => {}),
		updateProgress: mockFn(() => {}),
		completeProgress: mockFn(() => {}),
		logProgressEvent: mockFn(() => {}),
		showIntro: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showError: mockFn(() => {}),
		promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
		selectPacks: mockFn(() => Promise.resolve(["software-development"] as const)),
		showVersionInfo: mockFn(() => {}),
		selectUpdateOption: mockFn(() =>
			Promise.resolve<"current" | "add" | "cancel" | null>("current"),
		),
		showInstallSummary: mockFn(() => {}),
		showCancel: mockFn(() => {}),
		get warnings() {
			return warnings;
		},
		get infos() {
			return infos;
		},
	};
}

function makeDeps(overrides: Partial<UpdateStatusDeps> = {}): UpdateStatusDeps {
	return {
		gitHubClient: { getLatestReleaseTag: mockFn(() => Promise.resolve(null)) },
		versionComparator: makeComparator("behind"),
		userPrompt: makePrompt(),
		bundledVersion: "2.0.0",
		...overrides,
	} as unknown as UpdateStatusDeps;
}

describe("reportRemoteStatus", () => {
	test("warns and returns when the GitHub check yields no tag", async () => {
		const deps = makeDeps();
		await reportRemoteStatus(
			deps,
			WorkspaceVersion.fromJSON({ version: "2.0.0", installedAt: "2026-01-01T00:00:00.000Z" })!,
		);

		const prompt = deps.userPrompt as unknown as { warnings: string[] };
		expect(prompt.warnings.length).toBe(1);
		expect(prompt.warnings[0]).toMatch(/Could not check for updates via GitHub/);
	});

	test("informs the user when a newer remote version exists", async () => {
		const gitHubClient: IGitHubClient = {
			getLatestReleaseTag: mockFn(() => Promise.resolve("v2.1.0")),
		};
		const deps = makeDeps({
			gitHubClient,
			versionComparator: makeComparator("ahead"),
		});
		await reportRemoteStatus(
			deps,
			WorkspaceVersion.fromJSON({ version: "2.0.0", installedAt: "2026-01-01T00:00:00.000Z" })!,
		);

		const prompt = deps.userPrompt as unknown as { infos: string[] };
		expect(prompt.infos.length).toBe(1);
		expect(prompt.infos[0]).toMatch(/newer version \(v2\.1\.0\)/);
		expect(prompt.infos[0]).toMatch(/v2\.0\.0/); // bundled version surfaced
	});

	test("stays silent when remote is behind or equal (no newer release)", async () => {
		const gitHubClient: IGitHubClient = {
			getLatestReleaseTag: mockFn(() => Promise.resolve("v1.9.0")),
		};
		const deps = makeDeps({
			gitHubClient,
			versionComparator: makeComparator("behind"),
		});
		await reportRemoteStatus(
			deps,
			WorkspaceVersion.fromJSON({ version: "2.0.0", installedAt: "2026-01-01T00:00:00.000Z" })!,
		);

		const prompt = deps.userPrompt as unknown as { infos: string[]; warnings: string[] };
		expect(prompt.infos.length).toBe(0);
		expect(prompt.warnings.length).toBe(0);
	});
});

describe("notifyIfUpToDate", () => {
	test("returns true and informs when installed >= bundled", async () => {
		const deps = makeDeps({ versionComparator: makeComparator("behind") });
		const upToDate = await notifyIfUpToDate(
			deps,
			WorkspaceVersion.fromJSON({ version: "2.0.0", installedAt: "2026-01-01T00:00:00.000Z" })!,
		);

		const prompt = deps.userPrompt as unknown as { infos: string[] };
		expect(upToDate).toBe(true);
		expect(prompt.infos.length).toBe(1);
		expect(prompt.infos[0]).toMatch(/already up to date/);
	});

	test("returns false and stays silent when bundled is newer", async () => {
		const deps = makeDeps({ versionComparator: makeComparator("ahead") });
		const upToDate = await notifyIfUpToDate(
			deps,
			WorkspaceVersion.fromJSON({ version: "2.0.0", installedAt: "2026-01-01T00:00:00.000Z" })!,
		);

		const prompt = deps.userPrompt as unknown as { infos: string[] };
		expect(upToDate).toBe(false);
		expect(prompt.infos.length).toBe(0);
	});

	test("returns false on a failed comparison (safe default: attempt the update)", async () => {
		const deps = makeDeps({
			versionComparator: {
				// Explicit Failure shape: mockFn() widens ok to boolean, but the
				// comparator contract is Result<RemoteVersionStatus, Error>.
				compare: mockFn((): { ok: false; error: Error } => ({
					ok: false,
					error: new Error("boom"),
				})),
			},
		});
		const upToDate = await notifyIfUpToDate(
			deps,
			WorkspaceVersion.fromJSON({ version: "2.0.0", installedAt: "2026-01-01T00:00:00.000Z" })!,
		);

		expect(upToDate).toBe(false);
	});
});
