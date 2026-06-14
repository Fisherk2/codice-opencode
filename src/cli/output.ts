/**
 * CLI output helpers for Códice.
 *
 * Extracted from main.ts to respect the 200-line file size limit.
 * Defines exit codes, version display, and help text.
 */

// ---------------------------------------------------------------------------
// Binary version
// ---------------------------------------------------------------------------

/** Compiled-in binary version (also used for version file) */
export const VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Exit codes
// ---------------------------------------------------------------------------

export const EXIT_SUCCESS = 0;
export const EXIT_ERROR = 1;
export const EXIT_USAGE = 2;
export const EXIT_INTERRUPT = 130;

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/**
 * Print the version string to stdout.
 */
export function printVersion(): void {
	console.log(`Códice v${VERSION}`);
}

/**
 * Print usage help text to stdout.
 */
export function printHelp(): void {
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
