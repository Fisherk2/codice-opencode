// ---------------------------------------------------------------------------
// configLoader.ts — SDD Pipeline Configuration Loader
//
// Reads `opencode.json` from a project root and extracts the `sddPipeline`
// configuration section, merging it with canonical defaults.
//
// Uses only Node.js `fs` module — no Bun-specific APIs.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { DEFAULTS } from "./defaults";
import type { SddPipelineConfig } from "./types";
import { DEFAULT_SDD_PIPELINE_CONFIG } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Valid SDD pipeline phases (case-insensitive on input). */
const VALID_PHASES = new Set(["idle", "define", "plan", "build", "verify", "review", "ship"]);

const VALID_PHASES_STR = "idle, define, plan, build, verify, review, ship";

// ---------------------------------------------------------------------------
// Helpers
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
			if (!merged[phase]) {
				merged[phase] = {};
			}
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

/**
 * Loads and merges SDD pipeline configuration from a project's `opencode.json`.
 *
 * Algorithm:
 * 1. Check if `opencode.json` exists at `{projectDir}/opencode.json`
 * 2. If missing, return {@link DEFAULT_SDD_PIPELINE_CONFIG}
 * 3. Read and parse JSON (wrapped in try-catch for parse errors)
 * 4. Extract the `sddPipeline` key (optional)
 * 5. Validate and merge each section with canonical defaults
 * 6. Return the fully populated merged config
 *
 * Validation rules:
 * - `commandPhaseMap` values: must be a valid SDD phase (case-insensitive)
 * - `intentPatterns` keys: must start with `"/"`
 * - `phaseSuggestions` keys: must be a valid SDD phase name
 * - Invalid entries are **skipped** (with `logWarning()`), not erroring out
 * - Parse errors in `opencode.json` return defaults (with warning)
 *
 * @param projectDir - Absolute path to the project root directory.
 * @returns A fully populated {@link SddPipelineConfig} with all fields set.
 *
 * @example
 * ```ts
 * const config = loadSddConfig("/path/to/project")
 * config.commandPhaseMap["/spec"] // → "define" (or user override)
 * ```
 */
export function loadSddConfig(projectDir: string): SddPipelineConfig {
	const configPath = join(projectDir, "opencode.json");

	// 1. Check if opencode.json exists
	if (!existsSync(configPath)) {
		return DEFAULT_SDD_PIPELINE_CONFIG;
	}

	// 2. Read and parse JSON (wrap in try-catch for parse errors)
	let parsed: unknown;
	try {
		const raw = readFileSync(configPath, "utf-8");
		parsed = JSON.parse(raw);
	} catch {
		logWarning(
			`Invalid or unreadable opencode.json at ${configPath}. ` + "Falling back to defaults.",
		);
		return DEFAULT_SDD_PIPELINE_CONFIG;
	}

	// 3. Must be a non-null object at the top level
	if (!isRecord(parsed)) {
		return DEFAULT_SDD_PIPELINE_CONFIG;
	}

	// 4. Extract the optional sddPipeline key
	const sddPipeline = parsed.sddPipeline;
	if (!isRecord(sddPipeline) || Object.keys(sddPipeline).length === 0) {
		return DEFAULT_SDD_PIPELINE_CONFIG;
	}

	// 5. Merge each section with defaults
	return {
		commandPhaseMap: mergeCommandPhaseMap(sddPipeline.commandPhaseMap),
		intentPatterns: mergeIntentPatterns(sddPipeline.intentPatterns),
		phaseSuggestions: mergePhaseSuggestions(sddPipeline.phaseSuggestions),
	};
}
