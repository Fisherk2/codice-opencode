/**
 * Pack option helpers shared by the Clean Install, Project Install, and Update flows.
 *
 * Both install use cases need to map manifest pack rules to TUI display options
 * and humanize kebab-case pack ids. Centralizing here avoids duplicating the
 * path → id → name transformation in every use case (DRY).
 */

import type { FileRule } from "../domain/entities/FileRule";
import { packIdFromPath } from "../domain/entities/FileRuleManifest";
import type { PackOption } from "./ports/IUserPrompt";

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
 * agentCount is deferred to FEV-22 (per-pack manifest metadata).
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
			agentCount: 0,
		};
	});
}

// Re-export for consumers that need the pack-id derivation.
export { packIdFromPath } from "../domain/entities/FileRuleManifest";
