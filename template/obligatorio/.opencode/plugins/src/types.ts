import { COMMAND_PHASE_MAP, INTENT_PATTERNS, PHASE_SUGGESTIONS } from "./defaults";

/**
 * Partial configuration interface for the SDD Pipeline plugin.
 *
 * All fields are optional — when omitted, the plugin falls back to the
 * hardcoded defaults from ./defaults.ts. This allows users to override
 * specific maps without needing to redefine the entire configuration.
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
	 * Override for the intent keyword → command mapping.
	 *
	 * Maps natural-language keywords (e.g., "implement", "test") to
	 * their corresponding slash commands. When omitted, uses
	 * INTENT_PATTERNS from defaults.
	 *
	 * NOTE: This is a FULL OVERRIDE per command key, not a merge.
	 * Providing `{ "/spec": ["my keyword"] }` replaces ALL keywords
	 * for `/spec`, losing defaults like "requirement", "idea", etc.
	 * To add keywords without losing defaults, copy the existing
	 * defaults into your config and append to them.
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
 */
export const DEFAULT_SDD_PIPELINE_CONFIG: SddPipelineConfig = {
	commandPhaseMap: COMMAND_PHASE_MAP,
	intentPatterns: INTENT_PATTERNS,
	phaseSuggestions: PHASE_SUGGESTIONS,
} as const;
