/**
 * Pure helpers for the Update Workspace flow (FEV-21 Phase 4).
 *
 * The version gate and the Option A/B pack resolution are extracted here so
 * UpdateWorkspaceUseCase stays under the 200-line file convention while the
 * helpers remain unit-testable in isolation.
 */

import { getPackRules } from "../../domain/entities/FileRuleManifest";
// Value import: WorkspaceVersion.fromJSON is a runtime static call, so a
// type-only import would be erased and throw "Cannot read properties of
// undefined" inside parseVersionData's try/catch.
import { WorkspaceVersion } from "../../domain/entities/WorkspaceVersion";
import { toPackOptions } from "../packOptions";
import type { IUserPrompt } from "../ports/IUserPrompt";

/**
 * Parse and validate the `.codice-version` payload.
 *
 * Returns null when the file is absent, contains malformed JSON, or fails
 * WorkspaceVersion.fromJSON validation — all three are treated as "no
 * previous installation" by the update version gate.
 */
export function parseVersionData(rawData: string | null): WorkspaceVersion | null {
	if (rawData === null) return null;
	try {
		const parsed: unknown = JSON.parse(rawData);
		return WorkspaceVersion.fromJSON(parsed);
	} catch {
		return null;
	}
}

/**
 * Whether an installation predates the v2.0 pack system.
 *
 * The "v" prefix (e.g. "v1.4.0") is stripped before parsing the major because
 * WorkspaceVersion keeps the raw string from the version file, and semver
 * tolerates a leading "v" during validation.
 */
export function isPreV2Version(localVersion: WorkspaceVersion): boolean {
	const major = parseInt(localVersion.version.replace(/^v/, ""), 10);
	return Number.isFinite(major) && major < 2;
}

/**
 * Options for resolving the pack scope of an update.
 */
export interface UpdatePacksOptions {
	/** Skip interactive prompts (non-interactive mode). */
	readonly force?: boolean;
	/** Packs to add during a non-interactive update. */
	readonly addPacks?: readonly string[];
}

/**
 * Resolve which packs the update merges (Option A vs Option B).
 *
 * Returns null when the update is cancelled: the user chose Cancel, or
 * Option B produced no new packs. Otherwise returns the final pack scope:
 * - addPacks (non-interactive) → installed + addPacks
 * - force (non-interactive) → installed packs only (Option A)
 * - interactive "current" → installed packs only
 * - interactive "add" → installed + newly selected packs
 */
export async function resolveUpdatePacks(
	userPrompt: IUserPrompt,
	installedPacks: readonly string[],
	options: UpdatePacksOptions,
): Promise<readonly string[] | null> {
	if (options.addPacks && options.addPacks.length > 0) {
		// Dedupe against installed packs so the version file never records
		// a pack twice (adding an already-installed pack is a no-op).
		return [...new Set([...installedPacks, ...options.addPacks])];
	}
	if (options.force) {
		return installedPacks;
	}

	const choice = await userPrompt.selectUpdateOption([
		{
			value: "current",
			label: "A) Update current workspace",
			hint: `Only installed packs (${installedPacks.join(", ") || "none"})`,
		},
		{ value: "add", label: "B) Update and add packs", hint: "Add new packs during update" },
		{ value: "cancel", label: "Cancel", hint: "Return to menu" },
	]);
	if (choice === null || choice === "cancel") {
		await userPrompt.showCancel("Update cancelled by user.");
		return null;
	}
	if (choice === "current") {
		return installedPacks;
	}

	// Option B: installed packs are locked (cannot be deselected); only the
	// newly selected packs decide whether the update is worth running.
	// The lock is a hard guarantee: the final scope always contains the
	// installed packs even if the user toggled one off in the menu.
	const packOptions = toPackOptions(getPackRules()).map((option) => ({
		...option,
		locked: installedPacks.includes(option.id),
	}));
	const selected = await userPrompt.selectPacks(packOptions, [...installedPacks]);
	const newPacks = selected.filter((pack) => !installedPacks.includes(pack));
	if (newPacks.length === 0) {
		await userPrompt.showInfo("No new packs selected. Update cancelled.");
		return null;
	}
	return [...installedPacks, ...newPacks];
}
