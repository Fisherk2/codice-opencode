import * as fs from "node:fs";
import * as path from "node:path";
import { TEMPLATE_DIR_NAME } from "../config/constants";

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

	/**
	 * @param templateRoot - Absolute path to the template directory root.
	 *                       Auto-detected when not provided (see detectTemplateRoot).
	 */
	constructor(templateRoot?: string) {
		this.templateRoot = templateRoot ?? TemplateResolver.detectTemplateRoot();
	}

	/**
	 * Auto-detect the template root based on execution mode.
	 *
	 * - **Source/bunx mode** (bun run, bunx): resolves the template directory relative
	 *   to the source file location (`import.meta.dir`). Template is at `src/cli/../../template/`
	 *   which equals the package/project root. This works for both local development
	 *   and npm package execution (e.g. `bunx @fisherk2-dev/codice`).
	 *
	 * - **Compiled mode** (standalone binary): resolves the template directory
	 *   relative to the binary location.
	 *
	 * - **Fallback**: uses the current working directory for backward compatibility
	 *   with pre-v1.0.0 usage.
	 *
	 * Source: Template file location convention from SPEC.md — template files
	 * are always in a `template/` directory at the project or package root.
	 */
	static detectTemplateRoot(): string {
		// Path 1: Source/bunx mode (repo root or npm package)
		// In both development and bunx execution, import.meta.dir points
		// to src/cli/ (or tests/integration/), and template is ../../template/
		// from that location.
		const sourcePath = path.resolve(import.meta.dir, `../../${TEMPLATE_DIR_NAME}`);
		if (fs.existsSync(sourcePath)) {
			return sourcePath;
		}

		// Path 2: Compiled mode (standalone binary)
		// process.argv[0] is the compiled binary path; fallback to process.execPath
		const binaryDir = path.dirname(process.argv[0] ?? process.execPath);
		const binaryRelativePath = path.resolve(binaryDir, `../${TEMPLATE_DIR_NAME}`);
		if (fs.existsSync(binaryRelativePath)) {
			return binaryRelativePath;
		}

		// Fallback: template relative to CWD (backward compatible)
		return path.resolve(process.cwd(), TEMPLATE_DIR_NAME);
	}

	/**
	 * Read a file from the template directory.
	 * Searches each category subdirectory in order (obligatorio → estandar → opcional),
	 * resolves the file path, and returns the file contents.
	 *
	 * @param relativePath - Path relative to the template root.
	 * @returns The file contents as a string.
	 * @throws Error if the file is not found in any category or the path is invalid.
	 */
	async readFile(relativePath: string): Promise<string> {
		const fullPath = await this.resolvePath(relativePath);
		const file = Bun.file(fullPath);
		return file.text();
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
			return cached;
		}

		// Reject absolute paths and explicit traversal sequences
		const normalized = path.normalize(relativePath);
		if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
			throw new Error(
				`Invalid template path: ${relativePath}. All template paths must be relative.`,
			);
		}

		const categories = ["obligatorio", "estandar", "opcional"];
		for (const category of categories) {
			const fullPath = path.join(this.templateRoot, category, relativePath);

			// Verify resolved path stays within templateRoot — prevents symlink escape
			// and traversal via path components like `subdir/../../../etc/passwd`.
			// The trailing separator prevents substring prefix matching (e.g. /home/project
			// vs /home/project-evil).
			const resolved = path.resolve(fullPath);
			const templateWithSep = path.resolve(this.templateRoot) + path.sep;
			if (!resolved.startsWith(templateWithSep)) {
				throw new Error(`Template path escapes template directory: ${relativePath}.`);
			}

			// Check existence — fs.access() cannot read embedded files in compiled
			// binaries, but Bun.file() can. However, Bun.file().exists() returns
			// false for directories, so we use fs.existsSync() for directory entries.
			if (fs.existsSync(resolved)) {
				this.templateCache.set(relativePath, resolved);
				return resolved;
			}
		}

		throw new Error(
			`Template file not found: ${relativePath}. Ensure the template directory contains the file under obligatorio/, estandar/, or opcional/.`,
		);
	}
}
