/**
 * Códice — Opencode Workspace Installer v1.0.0
 *
 * CLI entry point for the interactive installer.
 * Parses command-line arguments, wires dependencies,
 * and launches the appropriate installation mode.
 */

const VERSION = "1.0.0";

function printVersion(): void {
	console.log(`Códice v${VERSION}`);
}

function printHelp(): void {
	console.log(`
Códice — Opencode Workspace Installer v${VERSION}

Usage:
  codice                  Interactive menu (default)
  codice --clean [--force]  Non-interactive clean install
  codice --project [--force] Non-interactive project install
  codice --update [--force]  Non-interactive update workspace
  codice --version           Show version and exit
  codice --help              Show this help and exit

Flags:
  --force     Skip all confirmations
  --verbose   Enable structured JSON logging to stderr

Exit codes:
  0   Success
  1   Runtime error
  2   CLI usage error
  130 Interrupted by user
`);
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	// Terminal flags
	if (args.includes("--version") || args.includes("-V")) {
		printVersion();
		process.exit(0);
	}

	if (args.includes("--help") || args.includes("-h")) {
		printHelp();
		process.exit(0);
	}

	// TODO: Implement mode dispatch (interactive default)
	// TODO: Handle --force, --verbose flags
	// TODO: Wire dependency injection
	// TODO: Handle SIGINT cleanup

	console.log("Códice v1.0.0 — coming soon!");
}

main().catch((error: unknown) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
