/**
 * Códice CLI entry point — parses args, wires dependencies, launches installer mode.
 */

import type {
	InstallMode,
	IUserPrompt,
	VersionDisplayInfo,
} from "../application/ports/IUserPrompt";
import { getAllPackIds } from "../domain/entities/FileRuleManifest";
import type { Result } from "../domain/types/Result";
import { createDependencies, type Dependencies } from "./container";
import { EXIT_ERROR, EXIT_INTERRUPT, EXIT_SUCCESS, EXIT_USAGE, VERSION } from "./output";
import { type CliOptions, type Mode, parseArgs } from "./parse-args";
import { handleTerminalFlags, registerSigintHandler } from "./signalHandlers";
import { detectVersionContext } from "./versionContext";

export { createDependencies, type Dependencies } from "./container";
export { VERSION } from "./output";
export { type CliOptions, type Mode, type ParsedArgs, parseArgs } from "./parse-args";
export { handleTerminalFlags, registerSigintHandler } from "./signalHandlers";
export { detectVersionContext } from "./versionContext";
// Export main for dynamic import via bin.js (npm requires .js bin extension)
export { main };

// --- Interactive mode selection ---

/** Show an interactive mode selection menu; delegates to IUserPrompt. */
export function promptForMode(userPrompt: IUserPrompt): Promise<InstallMode | null> {
	return userPrompt.promptForMode();
}

/**
 * Resolve the installation mode; interactive mode shows the menu. Blocks
 * "update" for pre-v2.0 installs (the update system needs pack metadata).
 */
export async function resolveInteractiveMode(
	mode: Mode,
	userPrompt: IUserPrompt,
	version: string,
	versionContext: VersionDisplayInfo,
): Promise<InstallMode | null> {
	if (mode !== "interactive") {
		return mode;
	}

	userPrompt.showIntro(`Códice v${version} — Opencode Workspace Installer`);
	const selected = await promptForMode(userPrompt);
	if (selected === null) {
		userPrompt.showCancel("Installation cancelled.");
		return null;
	}
	if (selected === "update" && versionContext.status !== "v2.0+") {
		userPrompt.showWarning(
			"Update is not available for this installation. Use Clean Install or Project Install instead.",
		);
		return null;
	}
	return selected;
}

// --- Mode execution ---

/**
 * Execute an installation mode with the given dependencies.
 * Separated from main() to enable testing with mock dependencies.
 */
export async function runMode(
	mode: InstallMode,
	deps: Dependencies,
	destinationPath: string,
	options: CliOptions,
): Promise<Result<void, Error>> {
	const execOptions = { force: options.force, version: VERSION };
	const packs = resolvePacks(options); // Compute packs once before branching

	if (mode === "clean") {
		return deps.cleanInstall.execute(destinationPath, {
			...execOptions,
			packs,
		});
	}
	if (mode === "project") {
		return deps.projectInstall.execute(destinationPath, {
			...execOptions,
			packs,
		});
	}
	return deps.updateWorkspace.execute(destinationPath, {
		...execOptions,
		addPacks: options.updateAddPacks,
	});
}

/**
 * Resolve CLI pack selection: --packs-all wins, then --packs, then undefined
 * so the use case falls back to its own wizard (selectPacks).
 */
function resolvePacks(options: CliOptions): readonly string[] | undefined {
	if (options.packsAll) return getAllPackIds();
	if (options.packs && options.packs.length > 0) return options.packs;
	return undefined;
}

// --- Entry point ---

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

	// SIGINT handler — best-effort staging cleanup before exit. An immediate
	// exit would leave residual .codice-staging/ after an interrupt mid-commit.
	const unregisterSigint = registerSigintHandler(() => deps.fileSystem.cleanStaging());

	try {
		// Detect local installation state and surface it in the TUI header
		const versionContext = await detectVersionContext(deps.fileSystem);
		deps.userPrompt.showVersionInfo(versionContext);

		// Resolve interactive mode (show menu if needed)
		const resolved = await resolveInteractiveMode(mode, deps.userPrompt, VERSION, versionContext);
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
if (import.meta.main) {
	main();
}
