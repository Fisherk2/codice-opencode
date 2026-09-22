/**
 * migrate-v1-to-v2-permissions — Codemod Fase 2 (V1 -> native OpenCode V2).
 *
 * Converts agent frontmatter from the legacy map form (`permission:` or
 * `tools:`) to the native V2 `permissions:` list of
 * `{action, resource, effect}` rules.
 *
 * Conversion contract (https://opencode.ai/v2/docs/migrate-v1/):
 * - scalar `key: effect`            ->  `- action: <key> / resource: "*" / effect`
 * - nested `group: {pattern: effect}` -> one rule per entry, file order kept
 * - renames: `bash` -> `shell`, `task` -> `subagent`, `write`/`patch` -> `edit`
 * - top-level `temperature`/`top_p` -> `request.body`; `maxSteps` -> `steps`
 * - all other keys and the Markdown body are preserved verbatim
 *
 * Guard rails: files already carrying `permissions:` are skipped; files
 * mixing legacy and V2 maps, files with both `permission:` and `tools:`,
 * and malformed frontmatter are reported as errors (fail-loud).
 * Scalar `write`/`patch` vs `edit` disagreements are kept in file order
 * (V2 last-match-wins) and reported as warnings for manual review.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface V2MigrationSummary {
	migrated: number;
	skipped: number;
	errors: string[];
	warnings: string[];
}

export interface V2MigrationOptions {
	dryRun?: boolean;
}

/** Legacy action name -> V2 action name. Unknown keys pass through unchanged. */
const ACTION_RENAME: Record<string, string> = {
	bash: "shell",
	task: "subagent",
	write: "edit",
	patch: "edit",
};

const LEGACY_MAP_KEYS = new Set(["permission", "tools"]);

interface FrontNode {
	key: string;
	scalar: string | null;
	/** Verbatim source lines for this node (key line only, not children). */
	rawLine: string;
	children: FrontNode[];
}

function stripQuotes(value: string): string {
	const t = value.trim();
	if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
		return t.slice(1, -1);
	}
	return t;
}

/**
 * Quotes a scalar for safe YAML emission (double-quoted style). Escapes
 * backslashes and embedded quotes so the value round-trips through any
 * YAML parser. Exported for tests.
 */
export function quoteScalar(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Effects accepted by native OpenCode V2 permission rules. */
const VALID_EFFECTS = new Set(["allow", "ask", "deny"]);

/** A scalar is emittable only if it contains no YAML-breaking control bytes. */
function hasForbiddenControlByte(value: string): boolean {
	for (let i = 0; i < value.length; i++) {
		const b = value.charCodeAt(i);
		if ((b < 32 && b !== 9 && b !== 10 && b !== 13) || b === 127) return true;
	}
	return false;
}

function indentOf(line: string): number {
	const m = line.match(/^ */);
	return m ? m[0].length : 0;
}

/** Splits a `key: value` line on the first colon. Returns null when absent. */
function splitKeyValue(line: string): { key: string; value: string } | null {
	const idx = line.indexOf(":");
	if (idx === -1) return null;
	const key = stripQuotes(line.slice(0, idx).trim());
	if (key === "") return null;
	return { key, value: stripQuotes(line.slice(idx + 1)) };
}

function parseBlock(
	lines: string[],
	from: number,
	parentIndent: number,
): { nodes: FrontNode[]; next: number } {
	const nodes: FrontNode[] = [];
	let i = from;
	while (i < lines.length) {
		const line = lines[i] as string;
		if (line.trim() === "---") break;
		if (line.trim() === "") {
			i++;
			continue;
		}
		if (indentOf(line) <= parentIndent) break;
		const kv = splitKeyValue(line.trim());
		if (!kv) return { nodes, next: -1 };
		const node: FrontNode = {
			key: kv.key,
			scalar: kv.value === "" ? null : kv.value,
			rawLine: line,
			children: [],
		};
		i++;
		if (node.scalar === null) {
			const child = parseBlock(lines, i, indentOf(line));
			if (child.next === -1) return { nodes, next: -1 };
			node.children = child.nodes;
			i = child.next;
		}
		nodes.push(node);
	}
	return { nodes, next: i };
}

interface Rule {
	action: string;
	resource: string;
	effect: string;
}

/** Expands one legacy map node into V2 rules, preserving file order. */
function expandLegacyMap(
	node: FrontNode,
	filePath: string,
	warnings: string[],
): Rule[] | { error: string } | null {
	const rules: Rule[] = [];
	const editFamily = new Map<string, string>();

	/** Rejects an invalid scalar with a loud, actionable error message. */
	const rejectScalar = (kind: string, raw: string, detail: string): { error: string } => ({
		error: `${filePath}: invalid ${kind} '${raw}' — ${detail}; migrate manually`,
	});

	if (node.scalar !== null) {
		// Degenerate `tools: <scalar>` form.
		const effect =
			node.scalar === "true" ? "allow" : node.scalar === "false" ? "deny" : node.scalar;
		if (!VALID_EFFECTS.has(effect)) {
			return rejectScalar("effect", effect, "effect must be one of allow|ask|deny");
		}
		rules.push({ action: "*", resource: "*", effect });
		return rules;
	}

	for (const child of node.children) {
		const action = ACTION_RENAME[child.key] ?? child.key;
		if (child.scalar !== null) {
			if (!VALID_EFFECTS.has(child.scalar)) {
				return rejectScalar("effect", child.scalar, `effect must be one of allow|ask|deny`);
			}
			if (hasForbiddenControlByte(action)) {
				return rejectScalar("action", action, "contains a forbidden control byte");
			}
			rules.push({ action, resource: "*", effect: child.scalar });
			if (child.key === "write" || child.key === "patch" || child.key === "edit") {
				editFamily.set(child.key, child.scalar);
			}
			continue;
		}
		// Nested group, e.g. bash: {pattern: effect}.
		for (const grand of child.children) {
			if (grand.scalar === null) return null;
			if (!VALID_EFFECTS.has(grand.scalar)) {
				return rejectScalar("effect", grand.scalar, `effect must be one of allow|ask|deny`);
			}
			if (hasForbiddenControlByte(grand.key)) {
				return rejectScalar("resource", grand.key, "contains a forbidden control byte");
			}
			rules.push({ action, resource: grand.key, effect: grand.scalar });
		}
	}

	if (new Set(editFamily.values()).size > 1) {
		const detail = [...editFamily.entries()].map(([k, v]) => `${k}: ${v}`).join(", ");
		warnings.push(
			`${filePath}: write/patch/edit merge into 'edit' with conflicting effects (${detail}) — kept file order, review manually`,
		);
	}
	return rules;
}

function ruleKey(rule: Rule): string {
	return `${rule.action}\u0000${rule.resource}`;
}

function emitRules(rules: Rule[], filePath: string, warnings: string[]): string[] {
	const lines: string[] = ["permissions:"];
	const lastIndex = new Map<string, number>();
	rules.forEach((rule, idx) => {
		lastIndex.set(ruleKey(rule), idx);
	});
	rules.forEach((rule, idx) => {
		// Drop shadowed earlier occurrences of the same (action, resource) pair:
		// under V2 last-match-wins the later identical-match rule always decides,
		// so earlier ones are dead. Keeping the last preserves the effective outcome.
		if (lastIndex.get(ruleKey(rule)) !== idx) {
			const survivor = rules[lastIndex.get(ruleKey(rule)) as number] as Rule;
			const next = idx + 1 < rules.length ? (rules[idx + 1] as Rule) : undefined;
			const consecutiveIdentical =
				next !== undefined &&
				next.action === rule.action &&
				next.resource === rule.resource &&
				next.effect === rule.effect;
			// Consecutive merge artifacts collapse silently; anything else is flagged.
			if (!consecutiveIdentical) {
				if (survivor.effect === rule.effect) {
					warnings.push(
						`${filePath}: duplicate permission '${rule.action}' ${quoteScalar(rule.resource)} (same effect '${rule.effect}') — collapsed, kept last occurrence`,
					);
				} else {
					warnings.push(
						`${filePath}: duplicate permission '${rule.action}' ${quoteScalar(rule.resource)} ('${rule.effect}' shadowed by later '${survivor.effect}') — kept last (V2 last-match-wins), review manually`,
					);
				}
			}
			return;
		}
		lines.push(`  - action: ${quoteScalar(rule.action)}`);
		lines.push(`    resource: ${quoteScalar(rule.resource)}`);
		lines.push(`    effect: ${rule.effect}`);
	});
	return lines;
}

type FileOutcome =
	| { status: "migrated" }
	| { status: "skipped" }
	| { status: "error"; message: string };

function migrateOneFile(filePath: string, dryRun: boolean, warnings: string[]): FileOutcome {
	let content: string;
	try {
		content = readFileSync(filePath, "utf-8");
	} catch {
		return { status: "error", message: `${filePath}: Cannot read file` };
	}

	const lines = content.split("\n");
	const openIdx = lines.findIndex((l) => l.trim() === "---");
	if (openIdx === -1) {
		return { status: "error", message: `${filePath}: malformed frontmatter (no opening ---)` };
	}
	const closeRel = lines.slice(openIdx + 1).findIndex((l) => l.trim() === "---");
	if (closeRel === -1) {
		return { status: "error", message: `${filePath}: malformed frontmatter (no closing ---)` };
	}
	const closeIdx = openIdx + 1 + closeRel;

	const parsed = parseBlock(lines, openIdx + 1, -1);
	if (parsed.next === -1) {
		return { status: "error", message: `${filePath}: malformed frontmatter (unparseable entries)` };
	}
	const nodes = parsed.nodes;

	const keys = nodes.map((n) => n.key);
	const hasV2 = keys.includes("permissions");
	const legacyMaps = nodes.filter((n) => LEGACY_MAP_KEYS.has(n.key));
	const hasLegacyMap = legacyMaps.length > 0;

	if (hasV2 && hasLegacyMap) {
		return {
			status: "error",
			message: `${filePath}: mixed legacy map and V2 permissions: — migrate manually`,
		};
	}
	if (legacyMaps.length > 1) {
		return {
			status: "error",
			message: `${filePath}: both permission: and tools: exist — migrate manually`,
		};
	}

	const scalarMoves = nodes.filter(
		(n) => n.key === "temperature" || n.key === "top_p" || n.key === "maxSteps",
	);
	if (!hasLegacyMap && scalarMoves.length === 0) {
		return { status: "skipped" };
	}

	const out: string[] = [];
	const mode = nodes.find((n) => n.key === "mode")?.scalar;
	let subagentCovered = false;
	for (const node of nodes) {
		if (LEGACY_MAP_KEYS.has(node.key)) {
			const rules = expandLegacyMap(node, filePath, warnings);
			if (rules === null) {
				return {
					status: "error",
					message: `${filePath}: unsupported nesting depth under ${node.key}: — migrate manually`,
				};
			}
			if ("error" in rules) {
				return { status: "error", message: rules.error };
			}
			if (rules.some((r) => r.action === "subagent")) subagentCovered = true;
			out.push(...emitRules(rules, filePath, warnings));
			// Delegation brake: a mode:subagent file without subagent rules would fall
			// back to the global `ask` in its child session, letting children launch
			// grandchildren. Inject an explicit deny as the list's LAST element (wins
			// over global ask). Injection only happens when no subagent rule exists,
			// so it provably trails every rule from this map. It must be emitted here,
			// inside the node loop: appending after the passthrough would place it
			// after sibling keys (hidden:, color:, ...) and corrupt the YAML.
			// Primaries are excluded (they delegate by design); explicit rules respected.
			if (mode === "subagent" && !subagentCovered) {
				out.push('  - action: "subagent"');
				out.push('    resource: "*"');
				out.push("    effect: deny");
				warnings.push(
					`${filePath}: mode:subagent without subagent rules — appended subagent *: deny to prevent delegation chains (child sessions would otherwise merge global ask)`,
				);
			}
			continue;
		}
		if (node.key === "temperature" || node.key === "top_p") {
			if (keys.includes("request")) {
				warnings.push(`${filePath}: request: already exists, kept ${node.key}: in place`);
				out.push(node.rawLine);
				continue;
			}
			out.push("request:");
			out.push("  body:");
			out.push(`    ${node.key}: ${node.scalar ?? ""}`);
			continue;
		}
		if (node.key === "maxSteps") {
			if (keys.includes("steps")) {
				warnings.push(`${filePath}: both steps: and maxSteps: exist, kept steps:`);
				continue;
			}
			out.push(`steps: ${node.scalar ?? ""}`);
			continue;
		}
		out.push(node.rawLine);
		for (const child of node.children) {
			out.push(child.rawLine);
			for (const grand of child.children) {
				// Fail-loud guard: the passthrough emitter only dumps 3 levels while
				// parseBlock parses recursively, so a 4th-level key would be silently
				// dropped from the written file. Refuse instead of corrupting.
				if (grand.children.length > 0) {
					return {
						status: "error",
						message: `${filePath}: frontmatter key '${node.key}' nests deeper than 3 levels ('${grand.key}') — migrate manually`,
					};
				}
				out.push(grand.rawLine);
			}
		}
	}

	if (!dryRun) {
		writeFileSync(
			filePath,
			[...lines.slice(0, openIdx + 1), ...out, ...lines.slice(closeIdx)].join("\n"),
		);
	}
	return { status: "migrated" };
}

/**
 * Migrates every `*.md` agent file under the given directories.
 */
export function migrateV1ToV2Permissions(
	dirs: readonly string[],
	opts: V2MigrationOptions = {},
): V2MigrationSummary {
	const dryRun = opts.dryRun ?? false;
	const summary: V2MigrationSummary = { migrated: 0, skipped: 0, errors: [], warnings: [] };

	for (const dir of dirs) {
		let entries: string[];
		try {
			entries = readdirSync(dir);
		} catch {
			summary.errors.push(`Cannot read directory: ${dir}`);
			continue;
		}
		for (const entry of entries) {
			if (!entry.endsWith(".md")) continue;
			const outcome = migrateOneFile(join(dir, entry), dryRun, summary.warnings);
			if (outcome.status === "migrated") summary.migrated++;
			else if (outcome.status === "skipped") summary.skipped++;
			else summary.errors.push(outcome.message);
		}
	}

	return summary;
}

/**
 * CLI runner — parses args, runs the migration, returns the exit code.
 */
export function runCli(args: readonly string[]): number {
	const dryRun = args.includes("--dry-run");
	const dirs = args.filter((a) => !a.startsWith("--"));

	if (dirs.length === 0) {
		console.error("Usage: migrate-v1-to-v2-permissions [--dry-run] <dir1> [dir2] ...");
		return 1;
	}

	const result = migrateV1ToV2Permissions(dirs, { dryRun });

	if (result.migrated > 0) {
		console.log(`Migrated ${result.migrated} file(s)${dryRun ? " (dry-run)" : ""}`);
	}
	if (result.skipped > 0) {
		console.log(`Skipped ${result.skipped} file(s)`);
	}
	if (result.warnings.length > 0) {
		console.log("Warnings:");
		for (const warn of result.warnings) {
			console.log(`  ${warn}`);
		}
	}
	if (result.errors.length > 0) {
		console.error("Errors:");
		for (const err of result.errors) {
			console.error(`  ${err}`);
		}
	}

	return result.errors.length > 0 && !dryRun ? 1 : 0;
}

// --- CLI entry point ---
if (import.meta.main) {
	process.exit(runCli(process.argv.slice(2)));
}
