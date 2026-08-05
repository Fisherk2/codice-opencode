import { reformatAgent } from "./reformat-agent";

/**
 * FEV-18 CLI entry for single-agent v2.0 conversion.
 * Usage: bun run scripts/reformat-agent.ts <source-file> <target-path> [--dry-run]
 * Exit codes: 0 = success, 1 = invalid arguments or conversion error.
 */

function printUsage(): void {
	console.error("Usage: bun run scripts/reformat-agent.ts <source-file> <target-path> [--dry-run]");
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

	if (dryRun) {
		// --dry-run prints generated content to stdout without writing.
		const result = reformatAgent(sourcePath, "/tmp/.reformat-dry-run-target.md");
		if (!result.ok) {
			console.error(`Error: ${result.error}`);
			return 1;
		}
		console.log(result.content);
		return 0;
	}

	const result = reformatAgent(sourcePath, targetPath);
	if (!result.ok) {
		console.error(`Error: ${result.error}`);
		return 1;
	}
	console.log(`Reformatted: ${sourcePath} -> ${targetPath}`);
	return 0;
}

process.exit(main());
