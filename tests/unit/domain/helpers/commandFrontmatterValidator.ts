/**
 * Command frontmatter validation engine.
 *
 * Validates that all command .md files in template/obligatorio/core/commands/
 * conform to the OpenCode command config schema (https://opencode.ai/docs/commands).
 *
 * Schema fields (from OpenCode docs):
 *   - description (required): one-line description starting with an action verb
 *   - agent (optional): primary agent that executes this command
 *   - model (optional): override default model for this command
 *   - subtask (optional): boolean to force subagent invocation
 *   - template (optional in markdown): prompt template (body is used instead)
 *
 * Reference: https://opencode.ai/docs/commands, https://opencode.ai/config.json
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

// ─── Schema constants (derived from https://opencode.ai/config.json) ───

/** Valid top-level fields for command frontmatter. */
export const VALID_COMMAND_FIELDS: ReadonlySet<string> = new Set([
	"description",
	"agent",
	"model",
	"subtask",
	"template",
]);

/** Known primary agents in the Códice workspace. */
export const VALID_AGENTS: ReadonlySet<string> = new Set([
	"huitzilopochtli",
	"quetzalcoatl",
	"tlaloc",
	"mictlantecuhtli",
	"moctezuma",
	"tezcatlipoca",
]);

// ─── Helpers ───

export function collectCommandFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			results.push(...collectCommandFiles(fullPath));
		} else if (entry.endsWith(".md")) {
			results.push(fullPath);
		}
	}
	return results;
}

export function extractFrontmatter(content: string): {
	frontmatter: string | null;
	bodyStart: number;
} {
	if (!content.startsWith("---")) {
		return { frontmatter: null, bodyStart: 0 };
	}
	const secondDelimiter = content.indexOf("\n---", 3);
	if (secondDelimiter === -1) {
		return { frontmatter: null, bodyStart: 0 };
	}
	return {
		frontmatter: content.slice(3, secondDelimiter).trim(),
		bodyStart: secondDelimiter + 4,
	};
}

export interface ValidationError {
	file: string;
	field?: string;
	message: string;
}

export function validateCommandFrontmatter(
	filePath: string,
	frontmatter: Record<string, unknown>,
	templateRoot: string,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const relPath = relative(templateRoot, filePath);

	// 1. Check for unknown top-level fields
	for (const key of Object.keys(frontmatter)) {
		if (!VALID_COMMAND_FIELDS.has(key)) {
			errors.push({
				file: relPath,
				field: key,
				message: `Unknown frontmatter field "${key}". Valid fields: ${[...VALID_COMMAND_FIELDS].join(", ")}`,
			});
		}
	}

	// 2. Validate description (required)
	if (frontmatter.description === undefined) {
		errors.push({
			file: relPath,
			field: "description",
			message: 'Missing required field "description"',
		});
	} else if (typeof frontmatter.description !== "string") {
		errors.push({
			file: relPath,
			field: "description",
			message: `description must be a string, got ${typeof frontmatter.description}`,
		});
	} else if ((frontmatter.description as string).trim().length === 0) {
		errors.push({
			file: relPath,
			field: "description",
			message: "description must not be empty",
		});
	}

	// 3. Validate agent (optional, but if present must be a known agent)
	if (frontmatter.agent !== undefined) {
		if (typeof frontmatter.agent !== "string") {
			errors.push({
				file: relPath,
				field: "agent",
				message: `agent must be a string, got ${typeof frontmatter.agent}`,
			});
		} else if (!VALID_AGENTS.has(frontmatter.agent as string)) {
			errors.push({
				file: relPath,
				field: "agent",
				message: `Unknown agent "${frontmatter.agent}". Known agents: ${[...VALID_AGENTS].join(", ")}`,
			});
		}
	}

	// 4. Validate model (optional, string if present)
	if (frontmatter.model !== undefined) {
		if (typeof frontmatter.model !== "string") {
			errors.push({
				file: relPath,
				field: "model",
				message: `model must be a string, got ${typeof frontmatter.model}`,
			});
		} else if ((frontmatter.model as string).trim().length === 0) {
			errors.push({
				file: relPath,
				field: "model",
				message: "model must not be empty",
			});
		}
	}

	// 5. Validate subtask (optional, boolean if present)
	if (frontmatter.subtask !== undefined) {
		if (typeof frontmatter.subtask !== "boolean") {
			errors.push({
				file: relPath,
				field: "subtask",
				message: `subtask must be a boolean, got ${typeof frontmatter.subtask}`,
			});
		}
	}

	// 6. Validate template (optional, string if present — markdown body is used instead)
	if (frontmatter.template !== undefined) {
		if (typeof frontmatter.template !== "string") {
			errors.push({
				file: relPath,
				field: "template",
				message: `template must be a string, got ${typeof frontmatter.template}`,
			});
		}
	}

	return errors;
}

/**
 * Read, extract, and parse a command file's frontmatter in one step.
 *
 * Returns a discriminated result so callers never need to catch YAML errors:
 * `error` is non-null when the frontmatter is missing or unparseable.
 */
export function loadCommandFrontmatter(filePath: string): {
	parsed: Record<string, unknown> | null;
	error: string | null;
} {
	const content = readFileSync(filePath, "utf-8");
	const { frontmatter } = extractFrontmatter(content);
	if (!frontmatter) {
		return { parsed: null, error: "Missing frontmatter" };
	}
	try {
		return { parsed: parseYaml(frontmatter) as Record<string, unknown>, error: null };
	} catch {
		return { parsed: null, error: "YAML parse error" };
	}
}
