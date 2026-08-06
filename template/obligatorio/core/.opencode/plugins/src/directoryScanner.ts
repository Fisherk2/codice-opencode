// ---------------------------------------------------------------------------
// DIRECTORY SCANNER — Markdown file discovery helpers
//
// Two scan variants serve different consumers:
// - `scanMarkdownFiles` (flat): commands/ is flat — one command = one top-level
//   file. Used by discoverCommandAgentMap().
// - `scanMarkdownFilesRecursive` (tree): agents/ may nest (forward-compatible
//   with a future packs/<name>/ layout per ADR-014). Used by
//   discoverValidSubagents().
//
// Hidden entries (dot-files and dot-directories) are skipped in BOTH variants
// so tooling-internal state (.git, .opencode, .gitkeep) never registers as an
// agent or command name.
// ---------------------------------------------------------------------------

import { existsSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

/**
 * Scans a directory for markdown files and returns their base names (without `.md`).
 *
 * Top-level only — commands are flat. Subagent discovery uses the recursive variant.
 *
 * @param dir - Path to the directory to scan.
 * @returns Array of base names (e.g., `["spec", "build"]` for `spec.md`, `build.md`).
 */
export function scanMarkdownFiles(dir: string): string[] {
	if (!existsSync(dir)) {
		return [];
	}

	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".md")
		.map((entry) => basename(entry.name, ".md"));
}

/**
 * Recursively scans a directory tree for `.md` files, returning base names
 * without the extension. Recursion keeps discovery forward-compatible with a
 * future `packs/<name>/` layout; hidden entries (`.git`, `.opencode`, and
 * dot-files like `.agent.md`) are skipped so tooling-internal state never
 * registers as a subagent name.
 *
 * @param dir - Path to the directory to scan.
 * @returns Flat array of base names (e.g., `["spec", "build"]`).
 */
export function scanMarkdownFilesRecursive(dir: string): string[] {
	if (!existsSync(dir)) {
		return [];
	}
	const names: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		// Skip ALL hidden entries (dirs and files) — dot-files like `.gitkeep`
		// or `.agent.md` are tooling state, not agent registrations.
		if (entry.name.startsWith(".")) continue;
		if (entry.isDirectory()) {
			names.push(...scanMarkdownFilesRecursive(join(dir, entry.name)));
		} else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
			names.push(basename(entry.name, ".md"));
		}
	}
	return names;
}
