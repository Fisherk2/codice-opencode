/**
 * Minimal type stub for @opencode-ai/plugin.
 *
 * WHY: The plugin files live in template/ (excluded from tsc), but integration
 * tests import DestructiveCommandBlockPlugin to verify the hook wiring. The
 * full @opencode-ai/plugin package has deep SDK dependencies that aren't
 * installed in the codice project. This stub covers only the Plugin type
 * needed by sdd-pipeline.ts.
 */
declare module "@opencode-ai/plugin" {
	export type Plugin = (
		input: unknown,
		options?: Record<string, unknown>,
	) => Promise<Record<string, (...args: unknown[]) => Promise<unknown>>>;
}
