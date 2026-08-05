/**
 * Agent Frontmatter Validation Tests
 *
 * Validates that all agent .md files in template/obligatorio/packs/
 * conform to the OpenCode agent config schema (https://opencode.ai/config.json).
 *
 * This catches:
 * - Invalid YAML frontmatter
 * - Unknown top-level fields
 * - Invalid mode, color, permission values
 * - Missing required structural elements
 *
 * Reference: customize-opencode skill + OpenCode config schema AgentConfig
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

// ─── Schema constants (derived from https://opencode.ai/config.json) ───

const VALID_AGENT_FIELDS = new Set([
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

const VALID_MODES = new Set(["subagent", "primary", "all"]);

const THEME_COLORS = new Set([
	"primary",
	"secondary",
	"accent",
	"success",
	"warning",
	"error",
	"info",
]);

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const VALID_PERMISSION_ACTIONS = new Set(["allow", "ask", "deny"]);

// ─── Helpers ───

function collectAgentFiles(dir: string): string[] {
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

function extractFrontmatter(content: string): {
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

interface ValidationError {
	file: string;
	field?: string;
	message: string;
}

function validateAgentFrontmatter(
	filePath: string,
	frontmatter: Record<string, unknown>,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const relPath = relative(TEMPLATE_ROOT, filePath);

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

	// 9. Validate body exists (agent must have a prompt/body)
	// This is checked at file level, not frontmatter level

	return errors;
}

function validatePermission(
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

// ─── Test constants ───

const TEMPLATE_ROOT = join(import.meta.dir, "..", "..", "..", "template", "obligatorio", "packs");

const agentFiles = collectAgentFiles(TEMPLATE_ROOT);

// ─── Tests ───

describe("Agent Frontmatter Validation", () => {
	it(`discovers ${agentFiles.length} agent files in template/obligatorio/packs/`, () => {
		expect(agentFiles.length).toBeGreaterThan(300);
	});

	describe("YAML frontmatter structure", () => {
		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			it(`${relPath} has valid YAML frontmatter`, () => {
				const content = readFileSync(filePath, "utf-8");
				const { frontmatter } = extractFrontmatter(content);

				expect(frontmatter).not.toBeNull();
				expect(frontmatter!.length).toBeGreaterThan(0);

				// Parse YAML — should not throw
				const parsed = parseYaml(frontmatter!);
				expect(typeof parsed).toBe("object");
				expect(parsed).not.toBeNull();
			});
		}
	});

	describe("Field validation", () => {
		const allErrors: ValidationError[] = [];

		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			const content = readFileSync(filePath, "utf-8");
			const { frontmatter } = extractFrontmatter(content);

			if (!frontmatter) {
				allErrors.push({
					file: relPath,
					message: "Missing frontmatter",
				});
				continue;
			}

			let parsed: Record<string, unknown>;
			try {
				parsed = parseYaml(frontmatter) as Record<string, unknown>;
			} catch {
				allErrors.push({
					file: relPath,
					message: "YAML parse error",
				});
				continue;
			}

			const errors = validateAgentFrontmatter(filePath, parsed);
			allErrors.push(...errors);
		}

		it("has no validation errors across all agent files", () => {
			if (allErrors.length > 0) {
				const summary = allErrors
					.map((e) => `  ${e.file}${e.field ? ` [${e.field}]` : ""}: ${e.message}`)
					.join("\n");
				expect(allErrors.length).toBe(0);
				// This will fail with the full error list
				throw new Error(`Found ${allErrors.length} frontmatter validation errors:\n${summary}`);
			}
			expect(allErrors.length).toBe(0);
		});
	});

	describe("Structural rules", () => {
		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			it(`${relPath} has a markdown body after frontmatter`, () => {
				const content = readFileSync(filePath, "utf-8");
				const { bodyStart } = extractFrontmatter(content);
				const body = content.slice(bodyStart).trim();
				expect(body.length).toBeGreaterThan(0);
			});
		}
	});

	describe("Permission value correctness", () => {
		const permErrors: ValidationError[] = [];

		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			const content = readFileSync(filePath, "utf-8");
			const { frontmatter } = extractFrontmatter(content);
			if (!frontmatter) continue;

			let parsed: Record<string, unknown>;
			try {
				parsed = parseYaml(frontmatter) as Record<string, unknown>;
			} catch {
				continue;
			}

			if (parsed.permission) {
				const errors = validatePermission(relPath, "permission", parsed.permission);
				permErrors.push(...errors);
			}
		}

		it("has no permission value errors across all agent files", () => {
			if (permErrors.length > 0) {
				const summary = permErrors.map((e) => `  ${e.file} [${e.field}]: ${e.message}`).join("\n");
				throw new Error(`Found ${permErrors.length} permission errors:\n${summary}`);
			}
			expect(permErrors.length).toBe(0);
		});
	});

	describe("Mode correctness", () => {
		const modeErrors: string[] = [];

		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			const content = readFileSync(filePath, "utf-8");
			const { frontmatter } = extractFrontmatter(content);
			if (!frontmatter) continue;

			let parsed: Record<string, unknown>;
			try {
				parsed = parseYaml(frontmatter) as Record<string, unknown>;
			} catch {
				continue;
			}

			if (parsed.mode && !VALID_MODES.has(parsed.mode as string)) {
				modeErrors.push(`${relPath}: mode="${parsed.mode}"`);
			}

			if (parsed.hidden === true && parsed.mode === "primary") {
				modeErrors.push(`${relPath}: hidden=true on primary agent`);
			}
		}

		it("has no mode errors across all agent files", () => {
			if (modeErrors.length > 0) {
				throw new Error(`Found ${modeErrors.length} mode errors:\n${modeErrors.join("\n")}`);
			}
			expect(modeErrors.length).toBe(0);
		});
	});

	describe("Color correctness", () => {
		const colorErrors: string[] = [];

		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			const content = readFileSync(filePath, "utf-8");
			const { frontmatter } = extractFrontmatter(content);
			if (!frontmatter) continue;

			let parsed: Record<string, unknown>;
			try {
				parsed = parseYaml(frontmatter) as Record<string, unknown>;
			} catch {
				continue;
			}

			if (parsed.color !== undefined) {
				const color = parsed.color as string;
				if (
					typeof color === "string" &&
					!HEX_COLOR_PATTERN.test(color) &&
					!THEME_COLORS.has(color)
				) {
					colorErrors.push(`${relPath}: color="${color}"`);
				}
			}
		}

		it("has no color errors across all agent files", () => {
			if (colorErrors.length > 0) {
				throw new Error(`Found ${colorErrors.length} color errors:\n${colorErrors.join("\n")}`);
			}
			expect(colorErrors.length).toBe(0);
		});
	});

	describe("Unknown field detection", () => {
		const unknownFieldErrors: string[] = [];

		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			const content = readFileSync(filePath, "utf-8");
			const { frontmatter } = extractFrontmatter(content);
			if (!frontmatter) continue;

			let parsed: Record<string, unknown>;
			try {
				parsed = parseYaml(frontmatter) as Record<string, unknown>;
			} catch {
				continue;
			}

			for (const key of Object.keys(parsed)) {
				if (!VALID_AGENT_FIELDS.has(key)) {
					unknownFieldErrors.push(`${relPath}: "${key}"`);
				}
			}
		}

		it("has no unknown frontmatter fields across all agent files", () => {
			if (unknownFieldErrors.length > 0) {
				throw new Error(
					`Found ${unknownFieldErrors.length} unknown fields:\n${unknownFieldErrors.join("\n")}`,
				);
			}
			expect(unknownFieldErrors.length).toBe(0);
		});
	});

	describe("FEV-19 permission invariants", () => {
		// All 6 primary agents should have unified task permissions
		const PRIMARY_AGENTS = [
			"huitzilopochtli",
			"quetzalcoatl",
			"tlaloc",
			"mictlantecuhtli",
			"moctezuma",
			"tezcatlipoca",
		];

		const DELEGATING_PRIMARY_DENY_LIST = [
			"huitzilopochtli",
			"quetzalcoatl",
			"tezcatlipoca",
			"moctezuma",
			"tlaloc",
			"mictlantecuhtli",
		];

		const NON_DELEGATING = ["moctezuma", "tezcatlipoca"];

		for (const agentName of PRIMARY_AGENTS) {
			const filePath = join(TEMPLATE_ROOT, "main", `${agentName}.md`);

			it(`${agentName} has valid task permission structure`, () => {
				const content = readFileSync(filePath, "utf-8");
				const { frontmatter } = extractFrontmatter(content);
				expect(frontmatter).not.toBeNull();

				const parsed = parseYaml(frontmatter!) as Record<string, unknown>;
				expect(parsed.permission).toBeDefined();

				const perm = parsed.permission as Record<string, unknown>;
				expect(perm.task).toBeDefined();
			});

			if (NON_DELEGATING.includes(agentName)) {
				it(`${agentName} has task: "*": deny (non-delegating)`, () => {
					const content = readFileSync(filePath, "utf-8");
					const { frontmatter } = extractFrontmatter(content);
					const parsed = parseYaml(frontmatter!) as Record<string, unknown>;
					const perm = parsed.permission as Record<string, unknown>;
					const task = perm.task as Record<string, unknown>;

					expect(task["*"]).toBe("deny");
					// No explicit allows
					const allowCount = Object.values(task).filter((v) => v === "allow").length;
					expect(allowCount).toBe(0);
				});
			} else {
				it(`${agentName} has task: "*": allow + 5 deny primaries (no self-deny)`, () => {
					const content = readFileSync(filePath, "utf-8");
					const { frontmatter } = extractFrontmatter(content);
					const parsed = parseYaml(frontmatter!) as Record<string, unknown>;
					const perm = parsed.permission as Record<string, unknown>;
					const task = perm.task as Record<string, unknown>;

					expect(task["*"]).toBe("allow");

					// Exactly 5 deny entries (the 5 OTHER primaries)
					const denyEntries = Object.entries(task).filter(([k, v]) => k !== "*" && v === "deny");
					expect(denyEntries.length).toBe(5);

					// Must NOT deny itself
					expect(task[agentName]).toBeUndefined();

					// Must deny tezcatlipoca (all delegators deny tezcatlipoca)
					expect(task.tezcatlipoca).toBe("deny");

					// Must deny the 4 other delegating primaries (not self)
					const expectedDenies = DELEGATING_PRIMARY_DENY_LIST.filter((n) => n !== agentName);
					for (const deny of expectedDenies) {
						expect(task[deny]).toBe("deny");
					}
				});
			}
		}
	});

	describe("No subagent index in primary agents", () => {
		const PRIMARY_AGENTS = [
			"huitzilopochtli",
			"quetzalcoatl",
			"tlaloc",
			"mictlantecuhtli",
			"moctezuma",
			"tezcatlipoca",
		];

		for (const agentName of PRIMARY_AGENTS) {
			it(`${agentName} has no AVAILABLE SUBAGENTS section`, () => {
				const filePath = join(TEMPLATE_ROOT, "main", `${agentName}.md`);
				const content = readFileSync(filePath, "utf-8");
				expect(content).not.toContain("## AVAILABLE SUBAGENTS");
			});

			it(`${agentName} has no "catalog" reference in RULES`, () => {
				const filePath = join(TEMPLATE_ROOT, "main", `${agentName}.md`);
				const content = readFileSync(filePath, "utf-8");
				// Check RULES section for stale catalog references
				const rulesMatch = content.match(/### RULES[\s\S]*?(?=##|$)/);
				if (rulesMatch) {
					expect(rulesMatch[0]).not.toContain("the catalog");
					expect(rulesMatch[0]).not.toContain("AVAILABLE SUBAGENTS catalog");
				}
			});
		}
	});

	describe("Agents directory reference", () => {
		const DELEGATING_AGENTS = ["huitzilopochtli", "quetzalcoatl", "tlaloc", "mictlantecuhtli"];

		for (const agentName of DELEGATING_AGENTS) {
			it(`${agentName} RULES references agents/ directory`, () => {
				const filePath = join(TEMPLATE_ROOT, "main", `${agentName}.md`);
				const content = readFileSync(filePath, "utf-8");
				expect(content).toContain("agents/");
			});
		}
	});
});
