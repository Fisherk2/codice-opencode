import { describe, expect, test } from "bun:test";
import type { PackOption } from "../../../src/application/ports/IUserPrompt";
import { toPackPromptOption } from "../../../src/infrastructure/adapters/packPromptOptions";

describe("toPackPromptOption", () => {
	test("maps a plain pack to a clack option with agent count in the label", () => {
		const pack: PackOption = {
			id: "software-development",
			name: "Software Development",
			description: "Core development agents",
			agentCount: 4,
		};

		const result = toPackPromptOption(pack);

		expect(result).toEqual({
			value: "software-development",
			label: "Software Development (~4 agents)",
			hint: "Core development agents",
		});
	});

	test("flags locked packs in label and hint", () => {
		const pack: PackOption = {
			id: "software-development",
			name: "Software Development",
			description: "Core development agents",
			agentCount: 4,
			locked: true,
		};

		const result = toPackPromptOption(pack);

		expect(result.label).toContain("[INSTALLED, LOCKED]");
		expect(result.hint).toBe("Already installed — cannot be removed");
	});
});
