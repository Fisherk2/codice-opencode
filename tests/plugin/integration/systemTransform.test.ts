// ---------------------------------------------------------------------------
// Integration tests for experimental.chat.system.transform hook behavior
//
// Tests the buildSddContext function and the state-driven system prompt
// injection logic (phase suggestion, intent suggestion, array mutation).
//
// buildSddContext lives inside the SddPipelinePlugin factory closure, so we
// replicate it here. The state management logic (consuming last_intent, phase
// suggestions) is also replicated from the hook for independent testing.
// ---------------------------------------------------------------------------

import { describe, expect, test } from "bun:test";
import { PHASE_SUGGESTIONS } from "../../../template/obligatorio/.opencode/plugins/src/defaults";

// ---------------------------------------------------------------------------
// Types (replicated from the plugin)
// ---------------------------------------------------------------------------

interface SddState {
	pipeline_phase: string;
	active_spec: string | null;
	current_task: string | null;
	completed_tasks: string[];
	pending_tasks: string[];
	agent_type: string;
	last_intent: string | null;
}

// ---------------------------------------------------------------------------
// Replicated logic from the plugin's system.transform hook
// ---------------------------------------------------------------------------

/** Replicates buildSddContext from the plugin. */
function buildSddContext(state: SddState): string {
	const lines = [
		"## SDD Pipeline State",
		`- Phase: ${state.pipeline_phase}`,
		`- Active spec: ${state.active_spec ?? "none"}`,
		`- Current task: ${state.current_task ?? "none"}`,
		`- Agent type: ${state.agent_type}`,
		`- Completed: ${state.completed_tasks.join(", ") || "none"}`,
		`- Pending: ${state.pending_tasks.join(", ") || "none"}`,
	];
	return lines.join("\n");
}

/** Replicates the full system prompt injection (unshift + suggestion + intent). */
function injectSddContext(state: SddState, systemPrompt: string[]): void {
	const sddContext = buildSddContext(state);

	// Phase suggestion
	const suggestion = PHASE_SUGGESTIONS[state.pipeline_phase]?.[state.agent_type];
	const suggestionLine = suggestion ? `\n> **Suggestion:** ${suggestion}` : "";

	// Intent suggestion
	let intentLine = "";
	if (state.last_intent) {
		intentLine = `\n> **Intent detected:** User wants to \`${state.last_intent}\`. Suggest they use the command.`;
		state.last_intent = null; // Consume intent
	}

	systemPrompt.unshift(sddContext + suggestionLine + intentLine);
}

/** Helper to create a default state with optional overrides. */
function createState(overrides?: Partial<SddState>): SddState {
	return {
		pipeline_phase: "idle",
		active_spec: null,
		current_task: null,
		completed_tasks: [],
		pending_tasks: [],
		agent_type: "unknown",
		last_intent: null,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Tests: buildSddContext output
// ---------------------------------------------------------------------------

describe("system.transform — buildSddContext output", () => {
	test("Scenario 1: idle phase with unknown agent injects basic context", () => {
		const state = createState();
		const context = buildSddContext(state);

		expect(context).toContain("## SDD Pipeline State");
		expect(context).toContain("Phase: idle");
		expect(context).toContain("Agent type: unknown");
		expect(context).toContain("Active spec: none");
		expect(context).toContain("Current task: none");
		expect(context).toContain("Completed: none");
		expect(context).toContain("Pending: none");
	});

	test("custom pipeline phase and agent appear in context", () => {
		const state = createState({
			pipeline_phase: "build",
			agent_type: "tlaloc",
		});
		const context = buildSddContext(state);

		expect(context).toContain("Phase: build");
		expect(context).toContain("Agent type: tlaloc");
	});

	test("non-null active_spec appears in context", () => {
		const state = createState({
			active_spec: "spec-auth-flow",
		});
		const context = buildSddContext(state);

		expect(context).toContain("Active spec: spec-auth-flow");
		expect(context).not.toContain("Active spec: none");
	});

	test("completed tasks appear as comma-separated list", () => {
		const state = createState({
			completed_tasks: ["task-1", "task-2"],
		});
		const context = buildSddContext(state);

		expect(context).toContain("Completed: task-1, task-2");
		expect(context).not.toContain("Completed: none");
	});

	test("pending tasks appear as comma-separated list", () => {
		const state = createState({
			pending_tasks: ["task-a", "task-b", "task-c"],
		});
		const context = buildSddContext(state);

		expect(context).toContain("Pending: task-a, task-b, task-c");
	});

	test("all context fields present and in expected order", () => {
		const state = createState();
		const context = buildSddContext(state);
		const lines = context.split("\n");

		expect(lines[0]).toBe("## SDD Pipeline State");
		expect(lines[1]).toMatch(/^- Phase: /);
		expect(lines[2]).toMatch(/^- Active spec: /);
		expect(lines[3]).toMatch(/^- Current task: /);
		expect(lines[4]).toMatch(/^- Agent type: /);
		expect(lines[5]).toMatch(/^- Completed: /);
		expect(lines[6]).toMatch(/^- Pending: /);
	});
});

// ---------------------------------------------------------------------------
// Tests: phase suggestion injection
// ---------------------------------------------------------------------------

describe("system.transform — phase suggestions", () => {
	test("Scenario 1: idle phase with unknown agent gets no suggestion", () => {
		const state = createState({ pipeline_phase: "idle", agent_type: "unknown" });
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).not.toContain("**Suggestion:**");
		expect(prompt[0]).toContain("## SDD Pipeline State");
	});

	test("Scenario 2: build phase with huitzilopochtli gets build-phase delegation suggestion", () => {
		// huitzilopochtli has a suggestion in the build phase (tlaloc does not)
		const state = createState({ pipeline_phase: "build", agent_type: "huitzilopochtli" });
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).toContain("**Suggestion:**");
		expect(prompt[0]).toContain("Consider delegating implementation to tlaloc");
		expect(prompt[0]).toContain("## SDD Pipeline State");
	});

	test("build phase with tezcatlipoca gets build-phase suggestion", () => {
		const state = createState({ pipeline_phase: "build", agent_type: "tezcatlipoca" });
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).toContain("**Suggestion:**");
		expect(prompt[0]).toContain("Consider /build first to implement code");
	});

	test("verify phase with tlaloc gets test verification suggestion", () => {
		// tlaloc has a suggestion in the verify phase
		const state = createState({ pipeline_phase: "verify", agent_type: "tlaloc" });
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).toContain("**Suggestion:**");
		expect(prompt[0]).toContain("Consider /test to verify your implementation");
	});

	test("agent with no suggestion for its phase gets no suggestion line", () => {
		// ship phase has no entry for tezcatlipoca
		const state = createState({ pipeline_phase: "ship", agent_type: "tezcatlipoca" });
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).not.toContain("**Suggestion:**");
	});

	test("idle phase has no suggestions for any agent", () => {
		expect(PHASE_SUGGESTIONS.idle).toEqual({});
	});
});

// ---------------------------------------------------------------------------
// Tests: intent detection injection
// ---------------------------------------------------------------------------

describe("system.transform — intent injection and consumption", () => {
	test("Scenario 3: last_intent set injects intent suggestion into prompt", () => {
		const state = createState({ last_intent: "/build" });
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).toContain("**Intent detected:**");
		expect(prompt[0]).toContain("User wants to `/build`");
	});

	test("last_intent is consumed after injection (set to null)", () => {
		const state = createState({ last_intent: "/spec" });
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		// First injection consumed the intent
		expect(state.last_intent).toBeNull();
	});

	test("Scenario 4: after intent consumed, next call has no intent suggestion", () => {
		const state = createState({ last_intent: "/build" });
		const prompt1: string[] = ["first prompt"];
		injectSddContext(state, prompt1);

		expect(prompt1[0]).toContain("**Intent detected:**");

		// Second call — last_intent was consumed
		const prompt2: string[] = ["second prompt"];
		injectSddContext(state, prompt2);

		expect(prompt2[0]).not.toContain("**Intent detected:**");
		expect(state.last_intent).toBeNull();
	});

	test("intent suggestion coexists with phase suggestion when both present", () => {
		// build + huitzilopochtli has a phase suggestion; last_intent adds intent line too
		const state = createState({
			pipeline_phase: "build",
			agent_type: "huitzilopochtli",
			last_intent: "/build",
		});
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).toContain("**Suggestion:**");
		expect(prompt[0]).toContain("**Intent detected:**");
		expect(prompt[0]).toContain("## SDD Pipeline State");
	});

	test("no intent line when last_intent is null", () => {
		const state = createState();
		const prompt: string[] = ["existing prompt"];
		injectSddContext(state, prompt);

		expect(prompt[0]).not.toContain("**Intent detected:**");
	});
});

// ---------------------------------------------------------------------------
// Tests: system prompt array mutation
// ---------------------------------------------------------------------------

describe("system.transform — system prompt array mutation", () => {
	test("Scenario 5: context is prepended via unshift (array index 0)", () => {
		const state = createState({ pipeline_phase: "define", agent_type: "quetzalcoatl" });
		const prompt: string[] = ["original first element", "original second element"];
		injectSddContext(state, prompt);

		expect(prompt[0]).toContain("## SDD Pipeline State");
		expect(prompt[1]).toBe("original first element");
		expect(prompt[2]).toBe("original second element");
		expect(prompt.length).toBe(3);
	});

	test("unshift preserves existing prompt content", () => {
		const state = createState();
		const prompt: string[] = ["You are a helpful assistant.", "Follow the user's instructions."];
		injectSddContext(state, prompt);

		expect(prompt.length).toBe(3);
		expect(prompt[1]).toBe("You are a helpful assistant.");
		expect(prompt[2]).toBe("Follow the user's instructions.");
	});

	test("unshift works on empty array", () => {
		const state = createState();
		const prompt: string[] = [];
		injectSddContext(state, prompt);

		expect(prompt.length).toBe(1);
		expect(prompt[0]).toContain("## SDD Pipeline State");
	});

	test("multiple consecutive calls prepend each time", () => {
		const state = createState();
		const prompt: string[] = ["original"];

		injectSddContext(state, prompt);
		injectSddContext(state, prompt);
		injectSddContext(state, prompt);

		expect(prompt.length).toBe(4);
		expect(prompt[3]).toBe("original");
	});
});

// ---------------------------------------------------------------------------
// Tests: PHASE_SUGGESTIONS structure from defaults
// ---------------------------------------------------------------------------

describe("system.transform — PHASE_SUGGESTIONS structure", () => {
	test("all SDD phases except idle have suggestions", () => {
		const phasesWithSuggestions: readonly string[] = [
			"define",
			"plan",
			"build",
			"verify",
			"review",
			"ship",
		];
		for (const phase of phasesWithSuggestions) {
			const suggestions = PHASE_SUGGESTIONS[phase as keyof typeof PHASE_SUGGESTIONS]!;
			expect(Object.keys(suggestions).length).toBeGreaterThan(0);
		}
	});

	test("idle phase has empty suggestions", () => {
		expect(PHASE_SUGGESTIONS.idle).toEqual({});
	});

	test("verify.tlaloc suggestion references /test", () => {
		// tlaloc is not in build phase suggestions; verify phase has tlaloc with /test
		const verifySuggestions = PHASE_SUGGESTIONS.verify!;
		expect(verifySuggestions.tlaloc).toContain("/test");
	});
});
