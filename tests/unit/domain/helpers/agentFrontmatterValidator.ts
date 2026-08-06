/**
 * Agent frontmatter validation engine.
 *
 * Schema constants and validation functions extracted verbatim from
 * agent-frontmatter-validation.test.ts so the same rules can be reused by any
 * test that inspects agent files. `loadAgentFrontmatter` collapses the
 * read → extract → parse sequence that the test previously repeated inline.
 *
 * TEMPLATE_ROOT is intentionally NOT resolved here: the caller computes it and
 * passes it in, so the helper stays independent of this repo's layout.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

// ─── Schema constants (derived from https://opencode.ai/config.json) ───

export const VALID_AGENT_FIELDS: ReadonlySet<string> = new Set([
	"description",
	"mode",
	"model",
	"variant",
	"temperature",
	"top_p",
	"prompt",
	"tools",
	"disable",
	"hidden",
	"options",
	"color",
	"steps",
	"maxSteps",
	"permission",
	"name", // silently routed to options by OpenCode
]);

export const VALID_MODES: ReadonlySet<string> = new Set(["subagent", "primary", "all"]);

export const THEME_COLORS: ReadonlySet<string> = new Set([
	"primary",
	"secondary",
	"accent",
	"success",
	"warning",
	"error",
	"info",
]);

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const VALID_PERMISSION_ACTIONS: ReadonlySet<string> = new Set(["allow", "ask", "deny"]);

// ─── Helpers ───

export function collectAgentFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			results.push(...collectAgentFiles(fullPath));
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

export function validateAgentFrontmatter(
	filePath: string,
	frontmatter: Record<string, unknown>,
	templateRoot: string,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const relPath = relative(templateRoot, filePath);

	// 1. Check for unknown top-level fields
	for (const key of Object.keys(frontmatter)) {
		if (!VALID_AGENT_FIELDS.has(key)) {
			errors.push({
				file: relPath,
				field: key,
				message: `Unknown frontmatter field "${key}". Valid fields: ${[...VALID_AGENT_FIELDS].join(", ")}`,
			});
		}
	}

	// 2. Validate mode
	if (frontmatter.mode !== undefined) {
		if (!VALID_MODES.has(frontmatter.mode as string)) {
			errors.push({
				file: relPath,
				field: "mode",
				message: `Invalid mode "${frontmatter.mode}". Must be one of: ${[...VALID_MODES].join(", ")}`,
			});
		}
	}

	// 3. Validate color
	if (frontmatter.color !== undefined) {
		const color = frontmatter.color as string;
		if (typeof color !== "string") {
			errors.push({
				file: relPath,
				field: "color",
				message: `color must be a string, got ${typeof color}`,
			});
		} else if (!HEX_COLOR_PATTERN.test(color) && !THEME_COLORS.has(color)) {
			errors.push({
				file: relPath,
				field: "color",
				message: `Invalid color "${color}". Must be hex (#RRGGBB) or theme color: ${[...THEME_COLORS].join(", ")}`,
			});
		}
	}

	// 4. Validate temperature
	if (frontmatter.temperature !== undefined) {
		if (typeof frontmatter.temperature !== "number") {
			errors.push({
				file: relPath,
				field: "temperature",
				message: `temperature must be a number, got ${typeof frontmatter.temperature}`,
			});
		}
	}

	// 5. Validate steps
	if (frontmatter.steps !== undefined) {
		if (
			typeof frontmatter.steps !== "number" ||
			frontmatter.steps <= 0 ||
			!Number.isInteger(frontmatter.steps)
		) {
			errors.push({
				file: relPath,
				field: "steps",
				message: `steps must be a positive integer, got ${JSON.stringify(frontmatter.steps)}`,
			});
		}
	}

	// 6. Validate description
	if (frontmatter.description !== undefined) {
		if (typeof frontmatter.description !== "string") {
			errors.push({
				file: relPath,
				field: "description",
				message: `description must be a string, got ${typeof frontmatter.description}`,
			});
		}
	}

	// 7. Validate permission structure
	if (frontmatter.permission !== undefined) {
		const permErrors = validatePermission(relPath, "permission", frontmatter.permission);
		errors.push(...permErrors);
	}

	// 8. Validate mode-specific rules
	if (frontmatter.mode === "primary") {
		if (frontmatter.hidden === true) {
			errors.push({
				file: relPath,
				field: "hidden",
				message: `hidden: true is only valid for mode: subagent, not mode: primary`,
			});
		}
	}

	return errors;
}

export function validatePermission(
	filePath: string,
	fieldPath: string,
	value: unknown,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (typeof value === "string") {
		// Flat permission: "allow" | "ask" | "deny"
		if (!VALID_PERMISSION_ACTIONS.has(value)) {
			errors.push({
				file: filePath,
				field: fieldPath,
				message: `Invalid permission value "${value}". Must be "allow", "ask", or "deny"`,
			});
		}
		return errors;
	}

	if (typeof value !== "object" || value === null) {
		errors.push({
			file: filePath,
			field: fieldPath,
			message: `permission must be a string or object, got ${typeof value}`,
		});
		return errors;
	}

	const obj = value as Record<string, unknown>;
	for (const [key, val] of Object.entries(obj)) {
		// Object keys can be either standard permission keys or custom tool patterns
		// Standard permission keys must be in the valid set
		// Custom tool patterns (like "bash" with sub-patterns) are allowed

		if (typeof val === "string") {
			// Flat action for this tool
			if (!VALID_PERMISSION_ACTIONS.has(val)) {
				errors.push({
					file: filePath,
					field: `${fieldPath}.${key}`,
					message: `Invalid permission action "${val}". Must be "allow", "ask", or "deny"`,
				});
			}
		} else if (typeof val === "object" && val !== null) {
			// Object pattern: { "pattern": "action", ... }
			const patternObj = val as Record<string, unknown>;
			for (const [pattern, action] of Object.entries(patternObj)) {
				if (typeof action !== "string") {
					errors.push({
						file: filePath,
						field: `${fieldPath}.${key}.${pattern}`,
						message: `Permission pattern action must be a string, got ${typeof action}`,
					});
				} else if (!VALID_PERMISSION_ACTIONS.has(action)) {
					errors.push({
						file: filePath,
						field: `${fieldPath}.${key}.${pattern}`,
						message: `Invalid permission action "${action}". Must be "allow", "ask", or "deny"`,
					});
				}
			}
		} else {
			errors.push({
				file: filePath,
				field: `${fieldPath}.${key}`,
				message: `Permission value must be a string or object, got ${typeof val}`,
			});
		}
	}

	return errors;
}

/**
 * Read, extract, and parse an agent file's frontmatter in one step.
 *
 * Returns a discriminated result so callers never need to catch YAML errors:
 * `error` is non-null when the frontmatter is missing or unparseable.
 */
export function loadAgentFrontmatter(filePath: string): {
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
		// Only YAML syntax errors map here; fs errors propagate with their real message.
		return { parsed: null, error: "YAML parse error" };
	}
}
