/**
 * Unit tests for updateFlow.ts pure helpers (FEV-21 Phase 4).
 *
 * The version gate and Option A/B pack resolution were extracted from
 * UpdateWorkspaceUseCase specifically to be unit-testable in isolation;
 * these tests pin down the boundary behaviors (corrupt input, v-prefix,
 * cancel paths) without mocking the whole use case.
 */

import { describe, expect, mock as mockFn, test } from "bun:test";
import type { IUserPrompt } from "../../../../src/application/ports/IUserPrompt";
import {
	isPreV2Version,
	parseVersionData,
	resolveUpdatePacks,
} from "../../../../src/application/use-cases/updateFlow";

const V2_VERSION_FILE = JSON.stringify({
	version: "2.0.0",
	installedPacks: ["software-development"],
	installedAt: "2026-01-01T00:00:00.000Z",
});

function createMockPrompt(): IUserPrompt & {
	warnings: string[];
	infos: string[];
	cancels: string[];
} {
	const warnings: string[] = [];
	const infos: string[] = [];
	const cancels: string[] = [];
	return {
		showWarning: mockFn((msg: string) => {
			warnings.push(msg);
		}),
		showInfo: mockFn((msg: string) => {
			infos.push(msg);
		}),
		showCancel: mockFn((msg: string) => {
			cancels.push(msg);
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
		get warnings() {
			return warnings;
		},
		get infos() {
			return infos;
		},
		get cancels() {
			return cancels;
		},
	};
}

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

describe("isPreV2Version", () => {
	test("returns true for 1.x versions", () => {
		const v = parseVersionData(
			JSON.stringify({ version: "1.4.0", installedAt: "2026-01-01T00:00:00.000Z" }),
		);
		expect(isPreV2Version(v!)).toBe(true);
	});

	test("strips a v-prefix before parsing the major", () => {
		const v = parseVersionData(
			JSON.stringify({ version: "v1.2.0", installedAt: "2026-01-01T00:00:00.000Z" }),
		);
		expect(isPreV2Version(v!)).toBe(true);
	});

	test("returns false for 2.x versions", () => {
		const v = parseVersionData(V2_VERSION_FILE);
		expect(isPreV2Version(v!)).toBe(false);
	});
});

describe("resolveUpdatePacks", () => {
	test("non-interactive addPacks merges and dedupes against installed", async () => {
		const prompt = createMockPrompt();
		const result = await resolveUpdatePacks(prompt, ["software-development"], {
			force: true,
			addPacks: ["creative", "software-development"],
		});
		expect(result).toEqual(["software-development", "creative"]);
		expect(prompt.selectUpdateOption).not.toHaveBeenCalled();
	});

	test("force without addPacks returns installed packs only (Option A)", async () => {
		const prompt = createMockPrompt();
		const result = await resolveUpdatePacks(prompt, ["software-development", "business"], {
			force: true,
		});
		expect(result).toEqual(["software-development", "business"]);
	});

	test("interactive 'current' returns installed packs only", async () => {
		const prompt = createMockPrompt();
		(prompt.selectUpdateOption as ReturnType<typeof mockFn>).mockResolvedValue("current");
		const result = await resolveUpdatePacks(prompt, ["software-development"], {});
		expect(result).toEqual(["software-development"]);
	});

	test("interactive cancel returns null and shows cancel message", async () => {
		const prompt = createMockPrompt();
		(prompt.selectUpdateOption as ReturnType<typeof mockFn>).mockResolvedValue("cancel");
		const result = await resolveUpdatePacks(prompt, ["software-development"], {});
		expect(result).toBeNull();
		expect(prompt.cancels).toContain("Update cancelled by user.");
	});

	test("Option B with zero new packs returns null and shows info", async () => {
		const prompt = createMockPrompt();
		(prompt.selectUpdateOption as ReturnType<typeof mockFn>).mockResolvedValue("add");
		// User selects only already-installed packs → no new packs
		(prompt.selectPacks as ReturnType<typeof mockFn>).mockResolvedValue(["software-development"]);
		const result = await resolveUpdatePacks(prompt, ["software-development"], {});
		expect(result).toBeNull();
		expect(prompt.infos).toContain("No new packs selected. Update cancelled.");
	});

	test("Option B keeps installed packs even when deselected (hard lock)", async () => {
		const prompt = createMockPrompt();
		(prompt.selectUpdateOption as ReturnType<typeof mockFn>).mockResolvedValue("add");
		// User deselects the installed pack — only creative remains
		(prompt.selectPacks as ReturnType<typeof mockFn>).mockResolvedValue(["creative"]);
		const result = await resolveUpdatePacks(prompt, ["software-development"], {});
		expect(result).toEqual(["software-development", "creative"]);
	});
});
