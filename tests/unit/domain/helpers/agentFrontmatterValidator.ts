/**
 * Agent frontmatter validation engine.
 *
 * Schema constants and validation functions extracted from
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
	"temperature", // legacy in V2 (use request.body); accepted during migration
	"top_p", // legacy in V2 (use request.body); accepted during migration
	"prompt", // legacy in V2 (use system/body); accepted during migration
	// NOTE: `tools` (map) is intentionally NOT a valid agent-file field. It is the
	// legacy V1 tool map; native V2 replaced it with the `permissions:` list.
	// Rejecting it prevents the silent-shadowing class of bug (issue #91).
	"disable", // legacy in V2 (use disabled); accepted during migration
	"hidden",
	"options",
	"color",
	"steps",
	"maxSteps", // legacy in V2 (use steps); accepted during migration
	"permissions", // native V2: [{action, resource, effect}]
	"request", // native V2: {headers, body}
	"system", // native V2: system prompt string
	"disabled", // native V2: boolean; disables the agent
	// NOTE: `permission` (singular) is intentionally NOT a valid agent-file field.
	// Native V2 uses `permissions:` (list) in agent .md frontmatter; the singular
	// `permission` only ever applied to opencode.json. Allowing it here masked
	// issue #91 silently.
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

	// 7. Validate permissions list (native OpenCode V2 agent key)
	if (frontmatter.permissions !== undefined) {
		errors.push(...validatePermissionsList(relPath, "permissions", frontmatter.permissions));
	}

	// 8. Validate request overlay (native OpenCode V2 agent key)
	if (frontmatter.request !== undefined) {
		if (typeof frontmatter.request !== "object" || frontmatter.request === null) {
			errors.push({
				file: relPath,
				field: "request",
				message: `request must be an object, got ${typeof frontmatter.request}`,
			});
		}
	}

	// 9. Validate mode-specific rules
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

/**
 * Validate the native V2 `permissions:` frontmatter list.
 *
 * Each rule must be `{action: string, resource: string, effect}` with
 * effect in "allow" | "ask" | "deny" (https://opencode.ai/v2/docs/permissions).
 */
export function validatePermissionsList(
	filePath: string,
	fieldPath: string,
	value: unknown,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!Array.isArray(value)) {
		errors.push({
			file: filePath,
			field: fieldPath,
			message: `permissions must be a list, got ${value === null ? "null" : typeof value}`,
		});
		return errors;
	}

	const seen = new Map<string, number>();
	value.forEach((rule, idx) => {
		const path = `${fieldPath}[${idx}]`;
		if (typeof rule !== "object" || rule === null) {
			errors.push({
				file: filePath,
				field: path,
				message: `permissions rule must be an object, got ${rule === null ? "null" : typeof rule}`,
			});
			return;
		}
		const entry = rule as Record<string, unknown>;
		for (const key of ["action", "resource", "effect"]) {
			if (typeof entry[key] !== "string") {
				errors.push({
					file: filePath,
					field: `${path}.${key}`,
					message: `permissions rule "${key}" must be a string, got ${entry[key] === null ? "null" : typeof entry[key]}`,
				});
			}
		}
		if (typeof entry.effect === "string" && !VALID_PERMISSION_ACTIONS.has(entry.effect)) {
			errors.push({
				file: filePath,
				field: `${path}.effect`,
				message: `Invalid permissions effect "${entry.effect}". Must be "allow", "ask", or "deny"`,
			});
		}
		if (typeof entry.action === "string" && typeof entry.resource === "string") {
			const key = `${entry.action}\u0000${entry.resource}`;
			const firstIdx = seen.get(key);
			if (firstIdx !== undefined) {
				errors.push({
					file: filePath,
					field: path,
					message: `Duplicate permission for action "${entry.action}" resource "${entry.resource}" (first at ${fieldPath}[${firstIdx}]) — under V2 last-match-wins the earlier rule is dead; collapse to a single rule`,
				});
			} else {
				seen.set(key, idx);
			}
		}
	});

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
