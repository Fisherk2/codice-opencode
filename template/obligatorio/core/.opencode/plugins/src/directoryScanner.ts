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
// Hidden entries are skipped by the recursive variant (dot-files and
// dot-directories) so tooling-internal state (.git, .opencode, .gitkeep)
// never registers as an agent name. The flat variant only filters by the
// `.md` extension — command files are user-authored and expected to be
// visible at the top level of commands/.
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
 * A basename that appears in more than one subdirectory (e.g. the same agent
 * name in two packs) is emitted only once — the Set in the caller dedupes —
 * and a debug warning names the colliding file so the template author can
 * detect the ambiguity instead of it failing silently.
 *
 * @param dir - Path to the directory to scan.
 * @param maxDepth - Maximum subdirectory depth to descend (default 10).
 *                   Guards against stack overflow on pathological trees.
 * @returns Flat array of base names (e.g., `["spec", "build"]`).
 */
export function scanMarkdownFilesRecursive(dir: string, maxDepth = 10): string[] {
	if (!existsSync(dir)) {
		return [];
	}
	const names: string[] = [];
	// Shared across recursion levels so a basename seen in one subtree
	// triggers the duplicate warning when it reappears in another.
	const seen = new Set<string>();
	scanTree(dir, maxDepth, names, seen);
	return names;
}

/**
 * Depth-first walk sharing the `names` and `seen` accumulators. Kept as a
 * separate function so the public signature stays `(dir, maxDepth?)` while
 * every recursion level sees the same duplicate-tracking set.
 */
function scanTree(dir: string, maxDepth: number, names: string[], seen: Set<string>): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		// Skip ALL hidden entries (dirs and files) — dot-files like `.gitkeep`
		// or `.agent.md` are tooling state, not agent registrations.
		if (entry.name.startsWith(".")) continue;
		if (entry.isDirectory()) {
			if (maxDepth <= 0) {
				// biome-ignore lint/suspicious/noConsole: intentional plugin telemetry log
				console.debug(
					`[directoryScanner] Max depth exceeded at ${join(dir, entry.name)} — skipping subtree`,
				);
				continue;
			}
			scanTree(join(dir, entry.name), maxDepth - 1, names, seen);
		} else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
			const base = basename(entry.name, ".md");
			if (seen.has(base)) {
				// biome-ignore lint/suspicious/noConsole: intentional plugin telemetry log
				console.debug(
					`[directoryScanner] Duplicate agent basename "${base}" at ${join(dir, entry.name)} — first occurrence wins`,
				);
			}
			seen.add(base);
			names.push(base);
		}
	}
}
