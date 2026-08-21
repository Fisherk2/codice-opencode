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

/**
 * Extracts the bash command string from the tool output args.
 * Returns empty string when no bash command is present.
 */
function extractBashCommand(value: unknown): string {
	if (typeof value !== "object" || value === null) return "";
	const obj = value as Record<string, unknown>;
	if (typeof obj.command !== "string") return "";
	return obj.command;
}

export const DestructiveCommandBlockPlugin: Plugin = async () => ({
	"tool.execute.before": async (input: unknown, output: unknown) => {
		if (typeof input !== "object" || input === null) return;
		const obj = input as Record<string, unknown>;
		if (typeof obj.tool !== "string" || obj.tool.toLowerCase() !== "bash") return;

		const cmd = normalizeBash(extractBashCommand(output));
		for (const pattern of DESTRUCTIVE_PATTERNS) {
			if (pattern.test(cmd)) {
				throw new Error("Destructive command blocked. Use safe alternatives.");
			}
		}
	},
});
