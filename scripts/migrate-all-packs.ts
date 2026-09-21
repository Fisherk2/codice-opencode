/**
 * migrate-all-packs — Bulk Fase-2 runner over the 8 pending packs.
 *
 * Iterates the packs pending V1->V2 migration in ascending size order and
 * delegates every per-file conversion to `migrateV1ToV2Permissions`
 * (imported, never duplicated). Dry-run is the default; `--apply` opts
 * into writing. Prints a machine-readable JSON report to stdout and a
 * human table to stderr. Exit code mirrors the codemod: 1 only when a
 * real (non-dry-run) pass produced errors.
 *
 * Usage:
 *   bun run scripts/migrate-all-packs.ts [--apply] [--pack=<name> ...] [--exclude=<name> ...]
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { V2MigrationOptions, V2MigrationSummary } from "./migrate-v1-to-v2-permissions";
import { migrateV1ToV2Permissions } from "./migrate-v1-to-v2-permissions";

/** Packs still carrying V1 `tools:` maps, ascending by file count. */
export const PENDING_PACKS: readonly string[] = [
	"government-legal",
	"creative",
	"finance",
	"operations-support",
	"science-research",
	"hardware-emerging",
	"business",
	"software-development",
];

export interface PackReport {
	pack: string;
	total: number;
	migrated: number;
	skipped: number;
	errors: string[];
	warnings: string[];
}

export interface AllPacksTotals {
	migrated: number;
	skipped: number;
	errors: number;
	warnings: number;
}

export interface AllPacksReport {
	dryRun: boolean;
	packs: PackReport[];
	totals: AllPacksTotals;
}

export interface ParsedArgs {
	dryRun: boolean;
	packs: string[];
	exclude: string[];
}

export type CodemodFn = (dirs: readonly string[], opts?: V2MigrationOptions) => V2MigrationSummary;

export interface RunAllPacksOptions {
	root?: string;
	packs?: readonly string[];
	exclude?: readonly string[];
	dryRun?: boolean;
	migrate?: CodemodFn;
}

export interface RunCliDeps {
	root?: string;
	migrate?: CodemodFn;
}

function defaultPacksRoot(): string {
	const scriptsDir = fileURLToPath(new URL(".", import.meta.url));
	return join(scriptsDir, "..", "template", "obligatorio", "packs");
}

function collectFlag(args: readonly string[], prefix: string): string[] {
	const values: string[] = [];
	for (const arg of args) {
		if (!arg.startsWith(prefix)) continue;
		for (const part of arg.slice(prefix.length).split(",")) {
			const name = part.trim();
			if (name !== "") values.push(name);
		}
	}
	return values;
}

export function parseArgs(args: readonly string[]): ParsedArgs {
	return {
		dryRun: !args.includes("--apply"),
		packs: collectFlag(args, "--pack="),
		exclude: collectFlag(args, "--exclude="),
	};
}

/**
 * Filters PENDING_PACKS to the requested subset, preserving ascending
 * order. Unknown names are ignored; `_root` is kept for call-site
 * symmetry with `runAllPacks` (existence is resolved per pack at run).
 */
export function resolvePacks(
	_root: string,
	only: readonly string[],
	exclude: readonly string[],
): string[] {
	const wanted = new Set(only);
	const skipped = new Set(exclude);
	return PENDING_PACKS.filter(
		(pack) => (wanted.size === 0 || wanted.has(pack)) && !skipped.has(pack),
	);
}

function countMarkdownFiles(dir: string): number | null {
	try {
		return readdirSync(dir).filter((entry) => entry.endsWith(".md")).length;
	} catch {
		return null;
	}
}

export function runAllPacks(opts: RunAllPacksOptions = {}): AllPacksReport {
	const dryRun = opts.dryRun ?? true;
	const root = opts.root ?? defaultPacksRoot();
	const migrate: CodemodFn = opts.migrate ?? migrateV1ToV2Permissions;
	const packs = resolvePacks(root, opts.packs ?? [], opts.exclude ?? []);

	const reports: PackReport[] = [];
	for (const pack of packs) {
		const dir = join(root, pack);
		const total = countMarkdownFiles(dir);
		if (total === null) {
			reports.push({
				pack,
				total: 0,
				migrated: 0,
				skipped: 0,
				errors: [`Cannot read directory: ${dir}`],
				warnings: [],
			});
			continue;
		}
		const summary = migrate([dir], { dryRun });
		reports.push({
			pack,
			total,
			migrated: summary.migrated,
			skipped: summary.skipped,
			errors: [...summary.errors],
			warnings: [...summary.warnings],
		});
	}

	const totals: AllPacksTotals = {
		migrated: reports.reduce((n, r) => n + r.migrated, 0),
		skipped: reports.reduce((n, r) => n + r.skipped, 0),
		errors: reports.reduce((n, r) => n + r.errors.length, 0),
		warnings: reports.reduce((n, r) => n + r.warnings.length, 0),
	};
	return { dryRun, packs: reports, totals };
}

function formatHuman(report: AllPacksReport): string {
	const lines = [
		`packs: ${report.packs.length} | migrated: ${report.totals.migrated} | skipped: ${report.totals.skipped} | errors: ${report.totals.errors} | warnings: ${report.totals.warnings}${report.dryRun ? " (dry-run)" : ""}`,
		"pack | total | migrated | skipped | errors | warnings",
	];
	for (const pack of report.packs) {
		lines.push(
			`${pack.pack} | ${pack.total} | ${pack.migrated} | ${pack.skipped} | ${pack.errors.length} | ${pack.warnings.length}`,
		);
	}
	return lines.join("\n");
}

/** CLI runner — parses args, runs the packs, returns the exit code. */
export function runCli(args: readonly string[], deps: RunCliDeps = {}): number {
	const parsed = parseArgs(args);
	const root = deps.root ?? defaultPacksRoot();
	const packs = resolvePacks(root, parsed.packs, parsed.exclude);
	const report = runAllPacks({
		root,
		packs,
		dryRun: parsed.dryRun,
		migrate: deps.migrate,
	});

	console.log(JSON.stringify(report, null, 2));
	console.error(formatHuman(report));
	if (report.totals.errors > 0) {
		for (const pack of report.packs) {
			for (const err of pack.errors) console.error(`  ${err}`);
		}
	}
	return report.totals.errors > 0 && !report.dryRun ? 1 : 0;
}

// --- CLI entry point ---
if (import.meta.main) {
	process.exit(runCli(process.argv.slice(2)));
}
