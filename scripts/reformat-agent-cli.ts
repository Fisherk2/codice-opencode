import { reformatAgent } from "./reformat-agent";

/**
 * FEV-18 CLI entry for single-agent v2.0 conversion.
 * Usage: bun run scripts/reformat-agent-cli.ts <source-file> <target-path> [--dry-run]
 * Exit codes: 0 = success, 1 = invalid arguments or conversion error.
 */

/** Destination used for --dry-run; content is printed to stdout, never persisted. */
const DRY_RUN_TARGET = "/tmp/.reformat-dry-run-target.md";

function printUsage(): void {
	console.error("Usage: bun run scripts/reformat-agent-cli.ts <source-file> <target-path> [--dry-run]");
	console.error("  Converts an agency-agents-main file to the v2.0 project format.");
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
	const result = reformatAgent(sourcePath, dryRun ? DRY_RUN_TARGET : targetPath);

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
}

process.exit(main());
