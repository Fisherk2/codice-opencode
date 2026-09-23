/**
 * Shared data-only contracts for the update workspace flow.
 *
 * Lives outside the use-case class file so helpers and the use case can
 * both import it without creating a module cycle.
 */

/**
 * Options for the update workspace execution.
 */
export interface UpdateWorkspaceOptions {
	/** Skip the confirmation prompt */
	readonly force?: boolean;
	/** Explicit version tag (overrides GitHub version lookup) */
	readonly version?: string;
	/** Packs to add during a non-interactive update (Option B without the menu) */
	readonly addPacks?: readonly string[];
}
