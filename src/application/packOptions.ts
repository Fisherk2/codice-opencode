/**
 * Pack option helpers shared by the Clean Install, Project Install, and Update flows.
 *
 * Both install use cases need to map manifest pack rules to TUI display options
 * and humanize kebab-case pack ids. Centralizing here avoids duplicating the
 * path → id → name transformation in every use case (DRY).
 */

import type { FileRule } from "../domain/entities/FileRule";
import { getPackRules, packIdFromPath } from "../domain/entities/FileRuleManifest";
import type { IUserPrompt, PackOption } from "./ports/IUserPrompt";

/** Packs pre-selected by default in the installer wizard. */
export const DEFAULT_PACKS = ["software-development"] as const;

/**
 * Convert a kebab-case pack id to a human-readable title.
 * "software-development" → "Software Development"
 */
export function humanizePackId(id: string): string {
	return id
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

/**
 * Map manifest pack rules to TUI display options.
 * agentCount comes from the manifest (FEV-22); rules without it default to 0
 * so legacy manifests keep rendering identically.
 *
 * @param rules - Pack rules from the manifest (e.g., getPackRules()).
 * @returns PackOption list suitable for IUserPrompt.selectPacks().
 */
export function toPackOptions(rules: readonly FileRule[]): readonly PackOption[] {
	return rules.map((rule) => {
		const id = packIdFromPath(rule.path);
		return {
			id,
			name: humanizePackId(id),
			description: rule.description,
			agentCount: rule.agentCount ?? 0,
		};
	});
}

/**
 * Show the pack-selection wizard with the default pack pre-selected.
 * Shared by Clean and Project install so the interactive branch stays in
 * one place — the FEV-22 per-pack metadata change will touch it once.
 */
export async function promptForPackSelection(userPrompt: IUserPrompt): Promise<readonly string[]> {
	return await userPrompt.selectPacks(toPackOptions(getPackRules()), [...DEFAULT_PACKS]);
}

// Re-export for consumers that need the pack-id derivation.
export { packIdFromPath } from "../domain/entities/FileRuleManifest";
