/**
 * Códice — Opencode Workspace Installer v1.0.0
 *
 * CLI entry point for the interactive installer.
 * Parses command-line arguments, wires dependencies via DI,
 * and launches the appropriate installation mode.
 */

// All @clack/prompts interaction goes through ClackPromptsAdapter
import { CleanInstallUseCase } from "../application/use-cases/CleanInstallUseCase";
import { ProjectInstallUseCase } from "../application/use-cases/ProjectInstallUseCase";
import { UpdateWorkspaceUseCase } from "../application/use-cases/UpdateWorkspaceUseCase";
import { FileMergeEngine } from "../domain/services/FileMergeEngine";
import { VersionComparator } from "../domain/services/VersionComparator";
import type { Result } from "../domain/types/Result";
import { BunFileSystem } from "../infrastructure/adapters/BunFileSystem";
import { ClackPromptsAdapter } from "../infrastructure/adapters/ClackPromptsAdapter";
import { GitHubRestClient } from "../infrastructure/adapters/GitHubRestClient";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Compiled-in binary version (also used for version file) */
export const VERSION = "1.0.0";

const EXIT_SUCCESS = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;
const EXIT_INTERRUPT = 130;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Installation modes supported by the CLI */
export type Mode = "clean" | "project" | "update" | "interactive";

/** Parsed CLI options */
export interface CliOptions {
	readonly force: boolean;
	readonly verbose: boolean;
}

/** Parsed CLI arguments */
export interface ParsedArgs {
	readonly mode: Mode;
	readonly options: CliOptions;
}

/** Wired application dependencies */
export interface Dependencies {
	readonly fileSystem: BunFileSystem;
	readonly userPrompt: ClackPromptsAdapter;
	readonly cleanInstall: CleanInstallUseCase;
	readonly projectInstall: ProjectInstallUseCase;
	readonly updateWorkspace: UpdateWorkspaceUseCase;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse CLI arguments into a mode and options.
 * Returns null if arguments are unrecognized.
 *
 * @param args - Raw argv slice (excluding "node" and script path).
 * @returns ParsedArgs on success, null on unrecognized arguments.
 */
/** Set of all recognized flags (mode, option, and terminal flags) */
const ALLOWED_FLAGS = new Set([
	"--clean",
	"--project",
	"--update",
	"--force",
	"--verbose",
	"--version",
	"-V",
	"--help",
	"-h",
]);

export function parseArgs(args: readonly string[]): ParsedArgs | null {
	const flags = new Set(args.filter((a) => a.startsWith("--")));
	const positional = args.filter((a) => !a.startsWith("--"));

	// Reject any unrecognized flags
	for (const flag of flags) {
		if (!ALLOWED_FLAGS.has(flag)) {
			return null;
		}
	}

	const options: CliOptions = {
		force: flags.has("--force"),
		verbose: flags.has("--verbose"),
	};

	if (flags.has("--clean")) return { mode: "clean", options };
	if (flags.has("--project")) return { mode: "project", options };
	if (flags.has("--update")) return { mode: "update", options };

	// No mode flag → interactive (default), but reject unknown positionals
	if (positional.length === 0) return { mode: "interactive", options };

	// Unknown positional arguments
	return null;
}

// ---------------------------------------------------------------------------
// Help & version output
// ---------------------------------------------------------------------------

function printVersion(): void {
	console.log(`Códice v${VERSION}`);
}

function printHelp(): void {
	console.log(`Códice — Opencode Workspace Installer v${VERSION}

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
  130 Interrupted by user`);
}

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
// Dependency wiring (DI)
// ---------------------------------------------------------------------------

/**
 * Wire all application dependencies.
 * Creates adapters, domain services, and use cases.
 *
 * @param destinationPath - Target directory for installation (default: cwd).
 * @returns Wired Dependencies container.
 */
export function createDependencies(destinationPath?: string): Dependencies {
	const fileSystem = new BunFileSystem(undefined, destinationPath);
	const gitHubClient = new GitHubRestClient();
	const userPrompt = new ClackPromptsAdapter();
	const mergeEngine = new FileMergeEngine(fileSystem);
	const versionComparator = new VersionComparator();

	const cleanInstall = new CleanInstallUseCase(fileSystem, mergeEngine, userPrompt);
	const projectInstall = new ProjectInstallUseCase(fileSystem, mergeEngine, userPrompt);
	const updateWorkspace = new UpdateWorkspaceUseCase(
		fileSystem,
		mergeEngine,
		userPrompt,
		gitHubClient,
		versionComparator,
	);

	return {
		fileSystem,
		userPrompt,
		cleanInstall,
		projectInstall,
		updateWorkspace,
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
		console.error("Usage error: unrecognized arguments. Use --help for usage information.");
		process.exit(EXIT_USAGE);
	}

	const { mode, options } = parsed;
	const destinationPath = process.cwd();

	// Wire dependencies (needed early for SIGINT cleanup)
	const deps = createDependencies(destinationPath);

	// SIGINT handler — clean up staging directory before exit
	const handleSigint = (): void => {
		console.error("\nInterrupted by user. Cleaning up staging directory...");
		deps.fileSystem
			.cleanStaging()
			.then(() => {
				console.error("Staging directory cleaned.");
				process.exit(EXIT_INTERRUPT);
			})
			.catch(() => {
				process.exit(EXIT_INTERRUPT);
			});
	};
	process.on("SIGINT", handleSigint);

	try {
		// Resolve interactive mode (show menu)
		let resolvedMode = mode;
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

		// Handle result
		if (!result.ok) {
			deps.userPrompt.showError(result.error.message);
			process.exit(EXIT_ERROR);
		}

		deps.userPrompt.showSuccess("Operation completed successfully.");
		process.exit(EXIT_SUCCESS);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Fatal error: ${message}`);
		process.exit(EXIT_ERROR);
	} finally {
		process.off("SIGINT", handleSigint);
	}
}

// Only invoke when this is the entry point (not during tests or when imported)
// import.meta.main is true only when the module is directly executed via bun run
if (import.meta.main) {
	main().catch((error: unknown) => {
		console.error("Fatal error:", error instanceof Error ? error.message : String(error));
		process.exit(EXIT_ERROR);
	});
}
