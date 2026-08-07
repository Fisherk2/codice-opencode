import * as fs from "node:fs";
import * as path from "node:path";
import { TEMPLATE_DIR_NAME } from "../config/constants";
import { isPathWithin } from "./pathResolver";
import { VerboseLogger } from "./VerboseLogger";

/**
 * Template category subdirectories, searched in priority order.
 * Mirrors the Spanish↔English mapping documented in FileRule.ts.
 */
const TEMPLATE_CATEGORIES = ["obligatorio", "estandar", "opcional"];

/**
 * Resolves template file paths within a structured template directory.
 *
 * Template files are organized into three category subdirectories:
 *   obligatorio/, estandar/, opcional/
 *
 * When resolving a relative path, each category is searched in order
 * and the first match is returned. Results are cached so each relative
 * path is resolved at most once per instance.
 *
 * This class has NO side effects — it only resolves file paths and
 * reads file contents through Bun's native APIs.
 */
export class TemplateResolver {
	private readonly templateRoot: string;
	private readonly templateCache = new Map<string, string>();
	private readonly logger: VerboseLogger;

	/**
	 * @param templateRoot - Absolute path to the template directory root.
	 *                       Auto-detected when not provided (see detectTemplateRoot).
	 * @param logger - Optional verbose logger; disabled when omitted.
	 */
	constructor(templateRoot?: string, logger?: VerboseLogger) {
		this.templateRoot = templateRoot ?? TemplateResolver.detectTemplateRoot();
		this.logger = logger ?? new VerboseLogger(false);
	}

	/**
	 * Auto-detect the template root based on execution mode.
	 *
	 * - **Source/bunx mode** (bun run, bunx): resolves the template directory relative
	 *   to the source file location (`import.meta.dir`). Since this method is defined in
	 *   `src/infrastructure/adapters/`, the path resolves to `../../../template/` which
	 *   equals the package/project root. This works for both local development and npm
	 *   package execution (e.g. `bunx @fisherk2-dev/codice`).
	 *
	 * - **Fallback**: uses the current working directory for backward compatibility
	 *   with pre-v1.0.0 usage.
	 *
	 * Source: Template file location convention from SPEC.md — template files
	 * are always in a `template/` directory at the project or package root.
	 *
	 * Note: Compiled binary mode was removed in v1.2.0 (ADR-011).
	 */
	static detectTemplateRoot(): string {
		// Source/bunx mode (repo root or npm package)
		// import.meta.dir points to src/infrastructure/adapters/ where
		// TemplateResolver.ts is defined. From there, ../../../template
		// reaches the package root's template/ directory.
		// (FEV-2/Issue #8: path was ../../template which resolved to
		//  src/template because import.meta.dir is in adapters/, not cli/.)
		const sourcePath = path.resolve(import.meta.dir, `../../../${TEMPLATE_DIR_NAME}`);
		if (fs.existsSync(sourcePath)) {
			return sourcePath;
		}

		// Fallback: template relative to CWD (backward compatible)
		const cwdPath = path.resolve(process.cwd(), TEMPLATE_DIR_NAME);
		// biome-ignore lint/suspicious/noConsole: production warning for missing template
		console.warn(
			`[warn] Template not found via source (${sourcePath}). ` +
				`Falling back to current working directory: ${cwdPath}. ` +
				"Run `codice` from the project root, or ensure the template directory is present.",
		);
		return cwdPath;
	}

	/**
	 * Resolve a relative path to its full template file path by searching
	 * each category subdirectory (obligatorio, estandar, opcional) in order.
	 * Supports both files and directories.
	 * Results are cached so each relative path is resolved at most once.
	 *
	 * @param relativePath - Path relative to the template root.
	 * @returns The resolved absolute file path within the template directory.
	 * @throws Error if the path is invalid, escapes the template directory,
	 *               or the file is not found in any category.
	 */
	async resolvePath(relativePath: string): Promise<string> {
		const cached = this.templateCache.get(relativePath);
		if (cached !== undefined) {
			this.logger.log("template_resolve", `${relativePath} (cached: ${cached})`);
			return cached;
		}

		// Reject absolute paths and explicit traversal sequences
		const normalized = path.normalize(relativePath);
		if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
			throw new Error(
				`Invalid template path: ${relativePath}. All template paths must be relative.`,
			);
		}

		const categories = TEMPLATE_CATEGORIES;
		for (const category of categories) {
			const fullPath = path.join(this.templateRoot, category, relativePath);

			// Verify resolved path stays within templateRoot — prevents symlink escape
			// and traversal via path components like `subdir/../../../etc/passwd`.
			const resolved = path.resolve(fullPath);
			if (!isPathWithin(this.templateRoot, resolved)) {
				throw new Error(`Template path escapes template directory: ${relativePath}.`);
			}

			// Check existence — Bun.file().exists() returns false for
			// directories, so we use fs.existsSync() for directory entries.
			if (fs.existsSync(resolved)) {
				this.logger.log("template_resolve", `${relativePath} → ${resolved}`);
				this.templateCache.set(relativePath, resolved);
				return resolved;
			}
		}

		throw new Error(
			`Template file not found: ${relativePath}. Ensure the template directory contains the file under obligatorio/, estandar/, or opcional/.`,
		);
	}
}
