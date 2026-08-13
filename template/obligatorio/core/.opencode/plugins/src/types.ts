import { COMMAND_PHASE_MAP, PHASE_SUGGESTIONS } from "./defaults";

/**
 * Partial configuration interface for the SDD Pipeline plugin.
 *
 * All fields are optional — when omitted, the plugin falls back to the
 * hardcoded defaults from ./defaults.ts (except intentPatterns, which layers
 * on top of auto-discovered patterns at runtime). This allows users to
 * override specific maps without needing to redefine the entire configuration.
 *
 * @example
 * ```ts
 * const myConfig: SddPipelineConfig = {
 *   commandPhaseMap: { "/my-cmd": "define" },
 *   // intentPatterns and phaseSuggestions fall back to defaults
 * }
 * ```
 */
export interface SddPipelineConfig {
	/**
	 * Override for the command → SDD phase mapping.
	 *
	 * Maps slash commands (e.g., "/build") to pipeline phases
	 * (e.g., "build"). When omitted, uses COMMAND_PHASE_MAP from defaults.
	 */
	readonly commandPhaseMap?: Readonly<Record<string, string>>;

	/**
	 * User overrides for the intent keyword → command mapping.
	 *
	 * This map layers on top of the auto-discovered patterns (derived from
	 * each command file's own `description:` frontmatter at runtime).
	 *
	 * NOTE: PER-KEY OVERRIDE — providing `{ "/spec": ["my keyword"] }`
	 * replaces the discovered keyword list for `/spec`. Keys not present
	 * in this map fall back to their discovered keywords. To extend a
	 * command's keywords without losing the discovered ones, copy the
	 * discovered list into your config and append to it.
	 */
	readonly intentPatterns?: Readonly<Record<string, readonly string[]>>;

	/**
	 * Override for phase-specific agent suggestions.
	 *
	 * Maps phases (e.g., "build") to per-agent suggestion strings shown
	 * in the system prompt. When omitted, uses PHASE_SUGGESTIONS from defaults.
	 */
	readonly phaseSuggestions?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/**
 * Default SDD Pipeline configuration — all fields populated from the
 * canonical defaults. Use this as the default value when no user
 * configuration is provided.
 *
 * `intentPatterns` is intentionally `{}` — intent keywords are derived from
 * command descriptions via auto-discovery at runtime, not from hardcoded
 * defaults. The config value only carries user overrides.
 */
export const DEFAULT_SDD_PIPELINE_CONFIG: SddPipelineConfig = {
	commandPhaseMap: COMMAND_PHASE_MAP,
	intentPatterns: {},
	phaseSuggestions: PHASE_SUGGESTIONS,
} as const;
