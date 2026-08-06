import type { PackOption } from "../../application/ports/IUserPrompt";

/**
 * Map a PackOption to a @clack/prompts multiselect option.
 * Locked packs are flagged in the label and hint so the user cannot
 * accidentally deselect an already-installed pack.
 */
export function toPackPromptOption(opt: PackOption): {
	value: string;
	label: string;
	hint: string;
} {
	const lockedSuffix = opt.locked ? " [INSTALLED, LOCKED]" : "";
	return {
		value: opt.id,
		label: `${opt.name} (~${opt.agentCount} agents)${lockedSuffix}`,
		hint: opt.locked ? "Already installed — cannot be removed" : opt.description,
	};
}
