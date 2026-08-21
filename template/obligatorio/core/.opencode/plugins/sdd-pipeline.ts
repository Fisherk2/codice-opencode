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

interface BashArgs {
	command?: unknown;
}

/**
 * Narrow type guard for the tool.execute.before args. Returns the raw
 * command string, or an empty string when no bash command is present.
 */
function argsToCommand(value: unknown): string {
	const args = value as BashArgs | undefined;
	if (typeof args?.command !== "string") return "";
	return args.command;
}

export const DestructiveCommandBlockPlugin: Plugin = async () => ({
	"tool.execute.before": async (input: unknown, output: unknown) => {
		const inp = input as { tool?: unknown } | undefined;
		if (typeof inp?.tool !== "string" || inp.tool.toLowerCase() !== "bash") return;

		const cmd = normalizeBash(argsToCommand(output));
		for (const pattern of DESTRUCTIVE_PATTERNS) {
			if (pattern.test(cmd)) {
				throw new Error("Destructive command blocked. Use safe alternatives.");
			}
		}
	},
});
