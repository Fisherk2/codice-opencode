/**
 * Terminal flags and process-signal handling for the CLI.
 *
 * Extracted from main.ts to respect the 200-line file convention.
 * handleTerminalFlags deals with --version/--help (exit after printing);
 * registerSigintHandler owns the Ctrl+C path with best-effort cleanup.
 */

import { EXIT_INTERRUPT, EXIT_SUCCESS, printHelp, printVersion } from "./output";

/** Handle terminal flags (--version, --help) before any I/O; exits after printing. */
export function handleTerminalFlags(args: readonly string[]): void {
	if (args.includes("--version") || args.includes("-V")) {
		printVersion();
		process.exit(EXIT_SUCCESS);
	}

	if (args.includes("--help") || args.includes("-h")) {
		printHelp();
		process.exit(EXIT_SUCCESS);
	}
}

/**
 * SIGINT handler: best-effort staging cleanup, then exit.
 * Returns a teardown removing the handler.
 *
 * The cleanup closes the SC-8 gap where an interrupt during commitStaging
 * left residual `.codice-staging/` artifacts. `.codice-backup` files are
 * deliberately NOT touched — they are the only copy of pre-update content
 * on disk, and the next successful commit removes them.
 */
export function registerSigintHandler(cleanup?: () => Promise<void>): () => void {
	// Second SIGINT is a no-op: the first signal already began cleanup and
	// will exit when it finishes (fs.rm with force cannot hang).
	let interrupted = false;
	const handleSigint = async (): Promise<void> => {
		if (interrupted) return;
		interrupted = true;
		// biome-ignore lint/suspicious/noConsole: intentional CLI output
		console.error("\nInterrupted by user.");
		if (cleanup) {
			try {
				await cleanup();
			} catch {
				// Never throw from the signal handler; exit regardless
			}
		}
		process.exit(EXIT_INTERRUPT);
	};
	process.on("SIGINT", handleSigint);
	return () => {
		process.off("SIGINT", handleSigint);
	};
}
