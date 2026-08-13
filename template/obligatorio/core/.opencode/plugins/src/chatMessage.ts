// ---------------------------------------------------------------------------
// CHAT MESSAGE — Pure decision logic for the chat.message hook
//
// The chat.message hook in sdd-pipeline.ts applies three detection stages:
// agent mentions, slash commands, and intent keywords. The decision logic is
// extracted here into pure functions so tests can exercise the REAL detection
// code instead of replicating it — the plugin factory itself requires
// @opencode-ai/plugin at runtime and cannot be imported in tests.
//
// Ordering is significant and preserved exactly as the hook applies it:
//   1. Agent mention  — first match wins (insertion order).
//   2. Slash command  — explicit user intent; SHADOWS keyword detection.
//   3. Intent keyword — only when no slash command matched.
// ---------------------------------------------------------------------------

import { escapeRegExp } from "./escapeRegExp";

// ---------------------------------------------------------------------------
// Text normalization
// ---------------------------------------------------------------------------

/**
 * Strips diacritics so intent matching is accent-insensitive ("especificacion"
 * matches "especificación"). NFD decomposes accented characters into base +
 * combining mark, then `\p{M}` removes every combining mark. Case is NOT
 * lowered here — matchers use the "i" flag instead.
 *
 * @param value - The raw text to normalize.
 * @returns The text with combining marks removed.
 */
export function normalizeText(value: string): string {
	return value.normalize("NFD").replace(/\p{M}/gu, "");
}

// ---------------------------------------------------------------------------
// Intent keyword matching
// ---------------------------------------------------------------------------

/**
 * Precompiles intent keyword lists into per-keyword RegExp objects.
 *
 * Building `new RegExp(...)` per keyword per message (the pre-fix hook) is
 * wasteful; compiling once at plugin init lets every chat.message re-use the
 * same instances. Keywords are accent-normalized at compile time so matching
 * stays diacritics-insensitive without per-call normalization cost.
 *
 * Map iteration preserves the input record's insertion order, keeping
 * first-match-wins intent detection deterministic.
 *
 * @param patterns - Command → keyword list record (e.g. the output of
 *                   `mergeIntentKeywordLayers`).
 * @returns A Map keyed by command whose values are word-boundary RegExp per
 *          keyword.
 */
export function compileIntentPatterns(
	patterns: Record<string, readonly string[]>,
): ReadonlyMap<string, readonly RegExp[]> {
	const compiled = new Map<string, RegExp[]>();
	for (const [command, keywords] of Object.entries(patterns)) {
		compiled.set(
			command,
			keywords.map((keyword) => {
				const escaped = escapeRegExp(normalizeText(keyword));
				return new RegExp(`\\b${escaped}\\b`, "i");
			}),
		);
	}
	return compiled;
}

/**
 * Detects which command a natural-language message maps to via intent
 * keywords. First-match-wins over the compiled patterns' insertion order.
 *
 * @param message - The raw user message (matching is case- and
 *                  accent-insensitive).
 * @param compiledPatterns - Precompiled patterns from
 *                           {@link compileIntentPatterns}.
 * @returns The matched command (e.g. `"/sync"`) or `null` when no keyword
 *          matches.
 */
export function detectIntentFromMessage(
	message: string,
	compiledPatterns: ReadonlyMap<string, readonly RegExp[]>,
): string | null {
	const normalized = normalizeText(message);
	for (const [command, patterns] of compiledPatterns) {
		if (patterns.some((pattern) => pattern.test(normalized))) {
			return command;
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Command & agent detection
// ---------------------------------------------------------------------------

/**
 * Detects the first agent @mentioned in a message.
 *
 * @param content - The raw message content.
 * @param patterns - Agent → mention-pattern map (AGENT_MENTION_PATTERNS or
 *                   discoverAgentMentionPatterns output).
 * @returns The first matching agent name, or `null`.
 */
export function detectAgentMention(
	content: string,
	patterns: Record<string, readonly RegExp[]>,
): string | null {
	for (const [agentType, agentPatterns] of Object.entries(patterns)) {
		if (agentPatterns.some((pattern) => pattern.test(content))) {
			return agentType;
		}
	}
	return null;
}

/**
 * Detects a leading slash command in a message. Requires a word boundary
 * after the command name (space, EOL, or non-word char) so "/specification"
 * does not match "/spec".
 *
 * @param content - The raw message content.
 * @param commandAgentMap - Command → agent map whose keys are the candidate
 *                          commands (e.g. COMMAND_AGENT_MAP).
 * @returns The matched command (e.g. `"/spec"`), or `null`.
 */
export function detectSlashCommand(
	content: string,
	commandAgentMap: Record<string, string>,
): string | null {
	const lower = content.toLowerCase();
	for (const command of Object.keys(commandAgentMap)) {
		if (lower.startsWith(command)) {
			const nextChar = lower[command.length];
			const isEnd = lower.length === command.length;
			const hasBoundary = isEnd || !nextChar || /\s/.test(nextChar);
			if (hasBoundary) {
				return command;
			}
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Combined routing decision
// ---------------------------------------------------------------------------

/** Result of the three-stage chat.message detection, applied by the hook. */
export interface ChatMessageRouting {
	/** First @mentioned agent, or null. */
	agentMention: string | null;
	/** Matched slash command, or null. */
	slashCommand: string | null;
	/** Matched intent command — always null when a slash command matched. */
	intent: string | null;
}

/**
 * Computes the full chat.message routing decision.
 *
 * Slash commands are explicit user intent: when one matches, keyword
 * detection is skipped entirely, so "/plan the deploy" routes to /plan and
 * never sets last_intent="/deploy".
 *
 * @param content - The raw message content.
 * @param deps - Detection inputs: agent mention patterns, command → agent
 *               map, and compiled intent patterns.
 * @returns The combined routing decision.
 */
export function detectChatMessageRouting(
	content: string,
	deps: {
		agentMentionPatterns: Record<string, readonly RegExp[]>;
		commandAgentMap: Record<string, string>;
		intentPatterns: ReadonlyMap<string, readonly RegExp[]>;
	},
): ChatMessageRouting {
	const agentMention = detectAgentMention(content, deps.agentMentionPatterns);
	const slashCommand = detectSlashCommand(content, deps.commandAgentMap);
	const intent =
		slashCommand === null ? detectIntentFromMessage(content, deps.intentPatterns) : null;
	return { agentMention, slashCommand, intent };
}
