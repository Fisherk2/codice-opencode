// ---------------------------------------------------------------------------
// configLoader.ts — SDD Pipeline Configuration Loader
//
// Reads `opencode.json` from a project root and extracts the `sddPipeline`
// configuration section, merging it with canonical defaults.
//
// Uses only Node.js `fs` module — no Bun-specific APIs.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
	isRecord,
	logWarning,
	mergeCommandPhaseMap,
	mergeIntentPatterns,
	mergePhaseSuggestions,
} from "./mergeConfig";
import type { SddPipelineConfig } from "./types";
import { DEFAULT_SDD_PIPELINE_CONFIG } from "./types";

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
		logWarning(`Invalid or unreadable opencode.json at ${configPath}. Falling back to defaults.`);
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
