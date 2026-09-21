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

function quoteResource(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
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

function parseBlock(lines: string[], from: number, parentIndent: number): { nodes: FrontNode[]; next: number } {
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
		const node: FrontNode = { key: kv.key, scalar: kv.value === "" ? null : kv.value, rawLine: line, children: [] };
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
function expandLegacyMap(node: FrontNode, filePath: string, warnings: string[]): Rule[] | null {
	const rules: Rule[] = [];
	const editFamily = new Map<string, string>();

	if (node.scalar !== null) {
		// Degenerate `tools: <scalar>` form.
		const effect = node.scalar === "true" ? "allow" : node.scalar === "false" ? "deny" : node.scalar;
		rules.push({ action: "*", resource: "*", effect });
		return rules;
	}

	for (const child of node.children) {
		const action = ACTION_RENAME[child.key] ?? child.key;
		if (child.scalar !== null) {
			rules.push({ action, resource: "*", effect: child.scalar });
			if (child.key === "write" || child.key === "patch" || child.key === "edit") {
				editFamily.set(child.key, child.scalar);
			}
			continue;
		}
		// Nested group, e.g. bash: {pattern: effect}.
		for (const grand of child.children) {
			if (grand.scalar === null) return null;
			rules.push({ action, resource: grand.key, effect: grand.scalar as string });
		}
	}

	if (new Set(editFamily.values()).size > 1) {
		const detail = [...editFamily.entries()].map(([k, v]) => `${k}: ${v}`).join(", ");
		warnings.push(`${filePath}: write/patch/edit merge into 'edit' with conflicting effects (${detail}) — kept file order, review manually`);
	}
	return rules;
}

function emitRules(rules: Rule[]): string[] {
	const lines: string[] = ["permissions:"];
	let prev: Rule | null = null;
	for (const rule of rules) {
		// Collapse consecutive exact duplicates (same outcome under last-match-wins).
		if (prev && prev.action === rule.action && prev.resource === rule.resource && prev.effect === rule.effect) {
			continue;
		}
		lines.push(`  - action: ${rule.action}`);
		lines.push(`    resource: ${quoteResource(rule.resource)}`);
		lines.push(`    effect: ${rule.effect}`);
		prev = rule;
	}
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
	// parseBlock stops at the closing --- (indent 0 <= parent -1? no: indent 0 > -1, so it tries to parse "---" as entry -> splitKeyValue("---") has no colon -> next -1). Treat trailing --- as terminator instead.
	const nodes = parsed.nodes.filter((n) => n.key !== "---" && n.rawLine.trim() !== "---");

	const keys = nodes.map((n) => n.key);
	const hasV2 = keys.includes("permissions");
	const legacyMaps = nodes.filter((n) => LEGACY_MAP_KEYS.has(n.key));
	const hasLegacyMap = legacyMaps.length > 0;

	if (hasV2 && hasLegacyMap) {
		return { status: "error", message: `${filePath}: mixed legacy map and V2 permissions: — migrate manually` };
	}
	if (legacyMaps.length > 1) {
		return { status: "error", message: `${filePath}: both permission: and tools: exist — migrate manually` };
	}

	const scalarMoves = nodes.filter((n) => n.key === "temperature" || n.key === "top_p" || n.key === "maxSteps");
	if (!hasLegacyMap && scalarMoves.length === 0) {
		return { status: "skipped" };
	}
	if (hasV2 && !hasLegacyMap && scalarMoves.length === 0) {
		return { status: "skipped" };
	}

	const out: string[] = [];
	for (const node of nodes) {
		if (node.rawLine.trim() === "---") continue;
		if (LEGACY_MAP_KEYS.has(node.key)) {
			const rules = expandLegacyMap(node, filePath, warnings);
			if (rules === null) {
				return { status: "error", message: `${filePath}: unsupported nesting depth under ${node.key}: — migrate manually` };
			}
			out.push(...emitRules(rules));
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
				out.push(grand.rawLine);
			}
		}
	}

	if (!dryRun) {
		writeFileSync(filePath, [...lines.slice(0, openIdx + 1), ...out, ...lines.slice(closeIdx)].join("\n"));
	}
	return { status: "migrated" };
}

/**
 * Migrates every `*.md` agent file under the given directories.
 */
export function migrateV1ToV2Permissions(dirs: readonly string[], opts: V2MigrationOptions = {}): V2MigrationSummary {
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
