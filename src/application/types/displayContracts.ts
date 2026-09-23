/**
 * Pure data contracts shared across user-prompt ports.
 *
 * Type-only module: no imports of values, kept separate from the
 * interfaces so the segregated ports (IMessageDisplay, IProgressReporter,
 * IUserPrompt) can share these shapes without forming import cycles.
 */

/**
 * Pack metadata for the pack selection screen.
 */
export interface PackOption {
	/** Pack identifier (e.g., "software-development") */
	readonly id: string;
	/** Human-readable name (e.g., "Software Development") */
	readonly name: string;
	/** Short description of pack contents */
	readonly description: string;
	/** Approximate agent count in this pack */
	readonly agentCount: number;
	/** Whether this pack is locked (already installed, can't be deselected in Update Option B) */
	readonly locked?: boolean;
}

/**
 * Display metadata for the local installation state.
 * Used to show "Current installation: v2.0.0, Packs: software-development" in the TUI.
 */
export interface VersionDisplayInfo {
	/** Detected local version (e.g., "2.0.0"), or null if not detected */
	readonly version: string | null;
	/** Packs installed locally (empty if pre-v2.0) */
	readonly installedPacks: readonly string[];
	/** Installation status for messaging */
	readonly status: "missing" | "pre-1.2.0" | "pre-2.0.0" | "v2.0+";
}

/**
 * Update sub-option choice.
 */
export type UpdateOption = "current" | "add" | "cancel";

/** Installation modes selectable from the TUI or CLI flags. */
export type InstallMode = "clean" | "project" | "update";

export interface UpdateOptionChoice {
	readonly value: UpdateOption;
	readonly label: string;
	readonly hint?: string;
}

/**
 * Pre-install summary data displayed before the merge step.
 * The user has already confirmed overwrite + packs + optionals; this is
 * informational only (no confirmation step per FEV-22 decision #5).
 */
export interface InstallSummaryInfo {
	/** Packs to install with their agent counts */
	readonly packs: readonly { readonly id: string; readonly agentCount: number }[];
	/** Mandatory directories always included in the install */
	readonly mandatoryDirs: readonly string[];
	/** Optional files the user selected (empty if none) */
	readonly optionalFiles: readonly string[];
	/** Total exact agents (sum of pack agentCount, verified by pack-agent-counts.test) */
	readonly totalAgents: number;
	/** Total files (packs + mandatory + optionals) */
	readonly totalFiles: number;
}
