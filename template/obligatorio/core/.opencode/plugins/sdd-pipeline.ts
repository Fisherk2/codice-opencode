import type { Plugin } from "@opencode-ai/plugin";
import { DESTRUCTIVE_PATTERNS } from "./src/destructivePatterns";
import { normalizeBash } from "./src/normalizeBash";

/**
 * Minimal safety-net plugin that blocks destructive bash commands
 * (rm -rf, git push --force, DROP TABLE, etc.) before execution.
 *
 * This is the ONLY unique value the plugin provides — all other
 * governance (agent permissions, command permissions, intent routing)
 * is handled by opencode.json permissions.
 */
export const DestructiveCommandBlockPlugin: Plugin = async () => ({
	"tool.execute.before": async (input: unknown, output: unknown) => {
		const inp = input as { tool?: string } | undefined;
		const out = output as { args?: Record<string, unknown> } | undefined;

		if (inp?.tool?.toLowerCase() !== "bash") return;

		const cmd = normalizeBash((out?.args?.command as string) ?? "");
		for (const pattern of DESTRUCTIVE_PATTERNS) {
			if (pattern.test(cmd)) {
				throw new Error("Destructive command blocked. Use safe alternatives.");
			}
		}
	},
});
