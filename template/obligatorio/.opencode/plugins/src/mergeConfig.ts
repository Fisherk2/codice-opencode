// ---------------------------------------------------------------------------
// mergeConfig.ts — SDD Pipeline config merge helpers
//
// Shared merge + validation logic used by configLoader. Kept separate so
// configLoader stays under the 200-line convention while the merge rules
// remain cohesive with their validators.
// ---------------------------------------------------------------------------

import { DEFAULTS } from "./defaults";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Valid SDD pipeline phases (case-insensitive on input). */
const VALID_PHASES = new Set(["idle", "define", "plan", "build", "verify", "review", "ship"]);

/** Human-readable phase list for warning messages — derived from VALID_PHASES. */
const VALID_PHASES_STR = [...VALID_PHASES].join(", ");

// ---------------------------------------------------------------------------
// Validators & logging
// ---------------------------------------------------------------------------

/**
 * Returns `true` if `value` is a valid SDD pipeline phase name (case-insensitive).
 */
function isValidPhase(value: string): boolean {
	return VALID_PHASES.has(value.toLowerCase());
}

/**
 * Type guard: returns `true` when `value` is a non-null, non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Writes a warning-level message to stderr with the `[sdd-pipeline]` prefix.
 *
 * Used instead of `console.warn()` to satisfy the `noConsole` lint rule while
 * preserving the same behaviour in an agent-context CLI plugin.
 */
function logWarning(message: string): void {
	process.stderr.write(`[sdd-pipeline] ${message}\n`);
}

// ---------------------------------------------------------------------------
// Merge helpers
// ---------------------------------------------------------------------------

/**
 * Merges a user-provided command → phase map with the default map.
 *
 * - Invalid phase values are skipped with a `logWarning()`.
 * - Valid entries override defaults on conflict.
 * - New entries (commands not in defaults) are added.
 *
 * @param userValue — The user-provided value from `opencode.json`.
 * @returns A complete `Record<string, string>` with all expected entries.
 */
function mergeCommandPhaseMap(userValue: unknown): Record<string, string> {
	const merged: Record<string, string> = { ...DEFAULTS.COMMAND_PHASE_MAP };

	if (!isRecord(userValue)) return merged;

	for (const [command, phase] of Object.entries(userValue)) {
		const phaseStr = String(phase);
		if (!isValidPhase(phaseStr)) {
			logWarning(
				`Invalid phase "${phaseStr}" for command "${command}". ` +
					`Must be one of: ${VALID_PHASES_STR}. Skipping.`,
			);
			continue;
		}
		merged[command] = phaseStr;
	}

	return merged;
}

/**
 * Merges a user-provided intent pattern map with the default map.
 *
 * - Keys that do not start with `"/"` are skipped with a `logWarning()`.
 * - Valid entries override defaults on conflict.
 * - New entries (keys not in defaults) are added.
 *
 * @param userValue — The user-provided value from `opencode.json`.
 * @returns A complete `Record<string, readonly string[]>` with all expected entries.
 */
function mergeIntentPatterns(userValue: unknown): Record<string, readonly string[]> {
	const merged: Record<string, readonly string[]> = {
		...DEFAULTS.INTENT_PATTERNS,
	};

	if (!isRecord(userValue)) return merged;

	for (const [key, value] of Object.entries(userValue)) {
		if (!key.startsWith("/")) {
			logWarning(`Invalid intent pattern key "${key}". Must start with "/". Skipping.`);
			continue;
		}
		// Normalise to a readonly array of strings
		merged[key] = Array.isArray(value) ? value.map((v: unknown) => String(v)) : [];
	}

	return merged;
}

/**
 * Merges a user-provided phase suggestions map with the default map.
 *
 * - Phase keys that are not valid SDD phase names are skipped with a
 *   `logWarning()`.
 * - Within valid phases, user-provided agent suggestions override defaults
 *   at the agent level.
 *
 * @param userValue — The user-provided value from `opencode.json`.
 * @returns A complete `Record<string, Readonly<Record<string, string>>>`.
 */
function mergePhaseSuggestions(
	userValue: unknown,
): Record<string, Readonly<Record<string, string>>> {
	// Deep-copy defaults into mutable structure
	const merged: Record<string, Record<string, string>> = {};
	for (const [phase, agents] of Object.entries(DEFAULTS.PHASE_SUGGESTIONS)) {
		merged[phase] = { ...agents };
	}

	if (!isRecord(userValue)) return merged;

	for (const [phase, agentMap] of Object.entries(userValue)) {
		if (!isValidPhase(phase)) {
			logWarning(
				`Invalid phase "${phase}" in phaseSuggestions. ` +
					`Must be one of: ${VALID_PHASES_STR}. Skipping.`,
			);
			continue;
		}

		if (isRecord(agentMap)) {
			// merged is seeded from DEFAULTS.PHASE_SUGGESTIONS, which covers
			// every phase accepted by isValidPhase — the entry always exists.
			for (const [agent, suggestion] of Object.entries(agentMap)) {
				merged[phase][agent] = String(suggestion);
			}
		}
	}

	return merged;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export { isRecord, logWarning, mergeCommandPhaseMap, mergeIntentPatterns, mergePhaseSuggestions };
