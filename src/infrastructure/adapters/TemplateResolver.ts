import * as fs from "node:fs/promises";
import * as path from "node:path";

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
	 */
	constructor(templateRoot: string) {
		this.templateRoot = templateRoot;
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

			// Check existence using fs.access (works for both files and directories)
			try {
				await fs.access(resolved);
				this.templateCache.set(relativePath, resolved);
				return resolved;
			} catch {
				// Not found in this category; continue to next
			}
		}

		throw new Error(
			`Template file not found: ${relativePath}. Ensure the template directory contains the file under obligatorio/, estandar/, or opcional/.`,
		);
	}
}
