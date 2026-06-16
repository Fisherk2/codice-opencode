/**
 * Códice — Opencode Workspace Installer v1.0.0
 *
 * CLI entry point for the interactive installer.
 * Parses command-line arguments, wires dependencies via DI,
 * and launches the appropriate installation mode.
 */

import type { Result } from "../domain/types/Result";
import type { ClackPromptsAdapter } from "../infrastructure/adapters/ClackPromptsAdapter";
import { createDependencies, type Dependencies } from "./container";
import {
	EXIT_ERROR,
	EXIT_INTERRUPT,
	EXIT_SUCCESS,
	EXIT_USAGE,
	printHelp,
	printVersion,
	VERSION,
} from "./output";
import { type CliOptions, type Mode, parseArgs } from "./parse-args";

export type { Dependencies } from "./container";
// Re-export for backward compatibility with tests
export { createDependencies } from "./container";
export { VERSION } from "./output";
export { type CliOptions, type Mode, type ParsedArgs, parseArgs } from "./parse-args";
// Export main for dynamic import via bin.js (npm requires .js bin extension)
export { main };

// ---------------------------------------------------------------------------
// Interactive mode selection
// ---------------------------------------------------------------------------

/**
 * Show an interactive mode selection menu.
 * Delegates to ClackPromptsAdapter.promptForMode().
 * @param userPrompt - The ClackPromptsAdapter instance.
 * @returns Selected mode, or null if user cancelled.
 */
export async function promptForMode(
	userPrompt: ClackPromptsAdapter,
): Promise<"clean" | "project" | "update" | null> {
	return userPrompt.promptForMode();
}

// ---------------------------------------------------------------------------
// Mode execution
// ---------------------------------------------------------------------------

/**
 * Execute an installation mode with the given dependencies.
 * Separated from main() to enable testing with mock dependencies.
 *
 * @param mode - Installation mode to execute.
 * @param deps - Wired dependencies.
 * @param destinationPath - Target directory for installation.
 * @param options - CLI options (force, verbose).
 * @returns Result indicating success or failure.
 */
export async function runMode(
	mode: "clean" | "project" | "update",
	deps: Dependencies,
	destinationPath: string,
	options: CliOptions,
): Promise<Result<void, Error>> {
	switch (mode) {
		case "clean": {
			return deps.cleanInstall.execute(destinationPath, {
				force: options.force,
				version: VERSION,
			});
		}
		case "project": {
			return deps.projectInstall.execute(destinationPath, {
				force: options.force,
				version: VERSION,
			});
		}
		case "update": {
			return deps.updateWorkspace.execute(destinationPath, {
				force: options.force,
				version: VERSION,
			});
		}
	}
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	// Terminal flags — handle these first, before any I/O
	if (args.includes("--version") || args.includes("-V")) {
		printVersion();
		process.exit(EXIT_SUCCESS);
	}

	if (args.includes("--help") || args.includes("-h")) {
		printHelp();
		process.exit(EXIT_SUCCESS);
	}

	// Parse mode and options
	const parsed = parseArgs(args);
	if (parsed === null) {
		// biome-ignore lint/suspicious/noConsole: intentional CLI output
		console.error("Usage error: unrecognized arguments. Use --help for usage information.");
		process.exit(EXIT_USAGE);
	}

	const { mode, options, destination } = parsed;
	const destinationPath = destination ?? process.cwd();

	// Wire dependencies (needed early for SIGINT cleanup)
	const deps = createDependencies(destinationPath);

	// SIGINT handler — immediately exit to avoid races with async cleanup.
	// The staging directory will be left behind but cleaned up by the caller
	// (e.g., the test harness's trap handler or the OS temp file cleanup).
	let interrupted = false;
	const handleSigint = (): void => {
		if (interrupted) return; // Double SIGINT: already handling
		interrupted = true;
		// biome-ignore lint/suspicious/noConsole: intentional CLI output
		console.error("\nInterrupted by user.");
		process.exit(EXIT_INTERRUPT);
	};
	process.on("SIGINT", handleSigint);

	try {
		// Resolve interactive mode (show menu)
		let resolvedMode: Mode = mode;
		if (mode === "interactive") {
			deps.userPrompt.showIntro(`Códice v${VERSION} — Opencode Workspace Installer`);
			const selected = await promptForMode(deps.userPrompt);
			if (selected === null) {
				deps.userPrompt.showCancel("Installation cancelled.");
				process.exit(EXIT_INTERRUPT);
			}
			resolvedMode = selected;
		}

		// At this point resolvedMode is guaranteed to be a non-interactive mode
		const executionMode = resolvedMode as "clean" | "project" | "update";

		// Execute the selected mode
		const result = await runMode(executionMode, deps, destinationPath, options);

		// Handle result — each use case calls showSuccess/showCancel/showError on its own
		if (!result.ok) {
			deps.userPrompt.showError(result.error.message);
			process.exit(EXIT_ERROR);
		}

		process.exit(EXIT_SUCCESS);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		// biome-ignore lint/suspicious/noConsole: intentional CLI output
		console.error(`Fatal error: ${message}`);
		process.exit(EXIT_ERROR);
	} finally {
		process.off("SIGINT", handleSigint);
	}
}

// Only invoke when this is the entry point (not during tests or when imported).
// import.meta.main is true only when the module is directly executed via bun run.
// The .catch() handler is omitted because main()'s try/catch catches all errors.
if (import.meta.main) {
	main();
}
