import { reformatAgent } from "./reformat-agent";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * FEV-18 CLI entry for single-agent v2.0 conversion.
 * Usage: bun run scripts/reformat-agent-cli.ts <source-file> <target-path> [--dry-run]
 * Exit codes: 0 = success, 1 = invalid arguments or conversion error.
 */

/** Prefix for the per-invocation temp dir --dry-run writes to before deleting it. */
const DRY_RUN_DIR_PREFIX = "reformat-dry-run-";

function printUsage(): void {
	console.error(
		"Usage: bun run scripts/reformat-agent-cli.ts <source-file> <target-path> [--dry-run]",
	);
	console.error("  Converts a source agent file to the v2.0 project format.");
}

function main(): number {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const positional = args.filter((arg) => arg !== "--dry-run");

	if (positional.length !== 2) {
		printUsage();
		return 1;
	}

	const [sourcePath, targetPath] = positional;
	// Dry-run writes into a unique temp dir (no predictable path for a
	// symlink-overwrite attack) and removes it before exiting.
	const dryRunDir = dryRun ? mkdtempSync(join(tmpdir(), DRY_RUN_DIR_PREFIX)) : undefined;
	const dryRunTarget = dryRunDir ? join(dryRunDir, "output.md") : targetPath;

	try {
		const result = reformatAgent(sourcePath, dryRunTarget);
		if (!result.ok) {
			console.error(`Error: ${result.error}`);
			return 1;
		}
		if (dryRun) {
			console.log(result.content);
		} else {
			console.log(`Reformatted: ${sourcePath} -> ${targetPath}`);
		}
		return 0;
	} finally {
		if (dryRunDir) rmSync(dryRunDir, { recursive: true, force: true });
	}
}

process.exit(main());
