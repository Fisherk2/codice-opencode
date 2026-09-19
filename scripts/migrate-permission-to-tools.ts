/**
 * FEV-29 — Migration codemod: rename `permission:` → `tools:` in agent frontmatter.
 *
 * Walks directories, locates the top-level `permission:` key in YAML frontmatter,
 * and renames it to `tools:` for Opencode V2 compatibility. All nested values
 * (scalar, map, shell-glob patterns) are preserved byte-for-byte.
 *
 * Guard rails:
 * - Fails if `tools:` already exists (already migrated)
 * - Fails if both `permission:` and `tools:` are present (ambiguous state)
 * - Fails if frontmatter is malformed (no closing `---`)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Canonical return shape — readonly to prevent mutation by callers. */
interface MigrationResult {
	readonly migrated: number;
	readonly skipped: number;
	readonly errors: readonly string[];
}

/**
 * Rename the top-level `permission:` key to `tools:` in all `.md` agent files
 * found inside the given directories. Skips files that already use `tools:`
 * or lack `permission:` entirely.
 *
 * @param dirs - Directories to scan (each searched at depth 1 for `*.md` files).
 * @param opts - `{ dryRun: true }` validates and reports without writing files.
 * @returns Summary of migrated, skipped, and errored files.
 */
export function migratePermissionToTools(
	dirs: readonly string[],
	opts?: { readonly dryRun?: boolean },
): MigrationResult {
	const dryRun = opts?.dryRun ?? false;
	let migrated = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const dir of dirs) {
		let entries: string[];
		try {
			entries = readdirSync(dir).filter((e: string) => e.endsWith(".md"));
		} catch {
			errors.push(`Cannot read directory: ${dir}`);
			continue;
		}

		for (const entry of entries) {
			const filePath = join(dir, entry);
			let content: string;
			try {
				content = readFileSync(filePath, "utf-8");
			} catch {
				errors.push(`Cannot read file: ${filePath}`);
				continue;
			}

			const result = migrateOneFile(filePath, content, dryRun);
			if (result.status === "migrated") migrated++;
			else if (result.status === "skipped") skipped++;
			else if (result.status === "error") errors.push(result.message);
		}
	}

	return { migrated, skipped, errors };
}

/** Status discriminator for single-file migration result. */
type FileResult =
	| { readonly status: "migrated" }
	| { readonly status: "skipped" }
	| { readonly status: "error"; readonly message: string };

/**
 * Attempt to migrate a single file's frontmatter from `permission:` to `tools:`.
 * Returns a discriminated union so the caller can tally results.
 */
function migrateOneFile(
	filePath: string,
	content: string,
	dryRun: boolean,
): FileResult {
	const lines = content.split("\n");

	const openIdx = lines.findIndex((l) => l.trim() === "---");
	if (openIdx === -1) {
		return { status: "error", message: `${filePath}: malformed frontmatter (no opening ---)` };
	}

	const closeIdx = lines.findIndex((l, i) => i > openIdx && l.trim() === "---");
	if (closeIdx === -1) {
		return { status: "error", message: `${filePath}: malformed frontmatter (no closing ---)` };
	}

	let permissionIdx = -1;
	let hasTools = false;

	for (let i = openIdx + 1; i < closeIdx; i++) {
		const line = lines[i];
		if (line === undefined) continue;
		if (/^permission:/.test(line)) permissionIdx = i;
		if (/^tools:/.test(line)) hasTools = true;
	}

	// Both keys present — ambiguous state, cannot proceed safely
	if (hasTools && permissionIdx !== -1) {
		return {
			status: "error",
			message: `${filePath}: both permission: and tools: present (ambiguous state)`,
		};
	}

	// Already migrated — not an error, just skip
	if (hasTools) {
		return { status: "skipped" };
	}

	// No permission: key — nothing to do
	if (permissionIdx === -1) {
		return { status: "skipped" };
	}

	// Rename the top-level key (permissionIdx is valid — checked above)
	const target = lines[permissionIdx];
	if (target === undefined) {
		return { status: "error", message: `${filePath}: internal error — permission line missing` };
	}
	lines[permissionIdx] = target.replace(/^permission:/, "tools:");

	if (!dryRun) {
		writeFileSync(filePath, lines.join("\n"));
	}

	return { status: "migrated" };
}

/**
 * CLI runner — parses args, runs the migration, and returns the process exit code.
 * Extracted from the `import.meta.main` block so it is unit-testable.
 *
 * @param args - Raw CLI arguments (e.g. `["--dry-run", "some/dir"]`).
 * @returns `0` on success (or dry-run with errors), `1` on usage or migration error.
 */
export function runCli(args: readonly string[]): number {
	const dryRun = args.includes("--dry-run");
	const dirs = args.filter((a) => !a.startsWith("--"));

	if (dirs.length === 0) {
		console.error("Usage: migrate-permission-to-tools [--dry-run] <dir1> [dir2] ...");
		return 1;
	}

	const result = migratePermissionToTools(dirs, { dryRun });

	if (result.migrated > 0) {
		console.log(`Migrated ${result.migrated} file(s)${dryRun ? " (dry-run)" : ""}`);
	}
	if (result.skipped > 0) {
		console.log(`Skipped ${result.skipped} file(s)`);
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
// Usage: bun run scripts/migrate-permission-to-tools.ts [--dry-run] <dir1> [dir2] ...
if (import.meta.main) {
	process.exit(runCli(process.argv.slice(2)));
}
