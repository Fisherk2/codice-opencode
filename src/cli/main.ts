/**
 * Códice CLI entry point — parses args, wires dependencies, launches installer mode.
 */

import type { IUserPrompt } from "../application/ports/IUserPrompt";
import type { Result } from "../domain/types/Result";
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
 * Delegates to IUserPrompt.promptForMode().
 * @param userPrompt - The user prompt adapter instance.
 * @returns Selected mode, or null if user cancelled.
 */
export function promptForMode(
	userPrompt: IUserPrompt,
): Promise<"clean" | "project" | "update" | null> {
	return userPrompt.promptForMode();
}

/**
 * Resolve the installation mode. Shows interactive menu if mode is "interactive",
 * otherwise returns the mode directly. Returns null on user cancel.
 */
export async function resolveInteractiveMode(
	mode: Mode,
	userPrompt: IUserPrompt,
	version: string,
): Promise<"clean" | "project" | "update" | null> {
	if (mode !== "interactive") {
		return mode;
	}

	userPrompt.showIntro(`Códice v${version} — Opencode Workspace Installer`);
	const selected = await promptForMode(userPrompt);
	if (selected === null) {
		userPrompt.showCancel("Installation cancelled.");
		return null;
	}
	return selected;
}

// ---------------------------------------------------------------------------
// Terminal flags and signal handling
// ---------------------------------------------------------------------------

/**
 * Handle terminal flags (--version, --help) which must be processed
 * before any I/O. Exits the process after printing.
 */
function handleTerminalFlags(args: readonly string[]): void {
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
 * Install a SIGINT handler that exits immediately to avoid races with async
 * cleanup. Returns the teardown function that removes the handler.
 *
 * The staging directory will be left behind but cleaned up by the caller
 * (e.g., the test harness's trap handler or the OS temp file cleanup).
 */
function registerSigintHandler(): () => void {
	// Double SIGINT: already handling — exit immediately on the second signal
	let interrupted = false;
	const handleSigint = (): void => {
		if (interrupted) return;
		interrupted = true;
		// biome-ignore lint/suspicious/noConsole: intentional CLI output
		console.error("\nInterrupted by user.");
		process.exit(EXIT_INTERRUPT);
	};
	process.on("SIGINT", handleSigint);
	return () => {
		process.off("SIGINT", handleSigint);
	};
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
	const execOptions = {
		force: options.force,
		version: VERSION,
	};
	if (mode === "clean") {
		return deps.cleanInstall.execute(destinationPath, execOptions);
	}
	if (mode === "project") {
		return deps.projectInstall.execute(destinationPath, execOptions);
	}
	return deps.updateWorkspace.execute(destinationPath, execOptions);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	handleTerminalFlags(args);

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
	const deps = createDependencies(destinationPath, options.verbose);

	// SIGINT handler — immediately exit to avoid races with async cleanup.
	const unregisterSigint = registerSigintHandler();

	try {
		// Resolve interactive mode (show menu if needed)
		const resolved = await resolveInteractiveMode(mode, deps.userPrompt, VERSION);
		if (resolved === null) process.exit(EXIT_INTERRUPT);

		// Execute the selected mode
		const result = await runMode(resolved, deps, destinationPath, options);

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
		unregisterSigint();
	}
}

// Only invoke when this is the entry point (not during tests or when imported).
// import.meta.main is true only when the module is directly executed via bun run.
// The .catch() handler is omitted because main()'s try/catch catches all errors.
if (import.meta.main) {
	main();
}
