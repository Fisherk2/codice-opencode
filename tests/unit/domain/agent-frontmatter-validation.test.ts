/**
 * Agent Frontmatter Validation Tests
 *
 * Validates that all agent .md files in template/obligatorio/packs/
 * conform to the OpenCode agent config schema (https://opencode.ai/config.json).
 *
 * The validation engine lives in ./helpers/agentFrontmatterValidator.ts
 * (reusable by contributors to check a single new agent file).
 *
 * Reference: customize-opencode skill + OpenCode config schema AgentConfig
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
	collectAgentFiles,
	extractFrontmatter,
	HEX_COLOR_PATTERN,
	loadAgentFrontmatter,
	THEME_COLORS,
	VALID_AGENT_FIELDS,
	VALID_MODES,
	type ValidationError,
	validateAgentFrontmatter,
	validatePermission,
} from "./helpers/agentFrontmatterValidator";

const TEMPLATE_ROOT = join(import.meta.dir, "..", "..", "..", "template", "obligatorio", "packs");

const agentFiles = collectAgentFiles(TEMPLATE_ROOT);

const PRIMARY_AGENTS = [
	"huitzilopochtli",
	"quetzalcoatl",
	"tlaloc",
	"mictlantecuhtli",
	"moctezuma",
	"tezcatlipoca",
] as const;

const NON_DELEGATING = new Set(["moctezuma", "tezcatlipoca"]);

/** Fails the test with a formatted error summary when errors is non-empty. */
function assertNoErrors(errors: readonly ValidationError[], label: string): void {
	if (errors.length === 0) return;
	const summary = errors
		.map((e) => `  ${e.file}${e.field ? ` [${e.field}]` : ""}: ${e.message}`)
		.join("\n");
	throw new Error(`Found ${errors.length} ${label}:\n${summary}`);
}

/** Fails the test with a formatted summary when raw strings are non-empty. */
function assertNoRawErrors(errors: readonly string[], label: string): void {
	if (errors.length === 0) return;
	throw new Error(`Found ${errors.length} ${label}:\n${errors.join("\n")}`);
}

describe("Agent Frontmatter Validation", () => {
	it(`discovers ${agentFiles.length} agent files in template/obligatorio/packs/`, () => {
		expect(agentFiles.length).toBeGreaterThan(300);
	});

	describe("YAML frontmatter structure", () => {
		for (const filePath of agentFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			it(`${relPath} has valid YAML frontmatter`, () => {
				const { parsed, error } = loadAgentFrontmatter(filePath);
				expect(error).toBeNull();
				expect(parsed).not.toBeNull();
				// Rejects frontmatter that parses to a scalar (e.g. `---\n42\n---`)
				expect(typeof parsed).toBe("object");
			});
		}
	});

	describe("Field validation", () => {
		const allErrors: ValidationError[] = [];

		for (const filePath of agentFiles) {
			const { parsed, error } = loadAgentFrontmatter(filePath);
			if (error) {
				allErrors.push({ file: relative(TEMPLATE_ROOT, filePath), message: error });
				continue;
			}
			allErrors.push(...validateAgentFrontmatter(filePath, parsed!, TEMPLATE_ROOT));
		}

		it("has no validation errors across all agent files", () => {
			assertNoErrors(allErrors, "frontmatter validation errors");
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
			const { parsed, error } = loadAgentFrontmatter(filePath);
			if (error || !parsed?.permission) continue;
			permErrors.push(
				...validatePermission(relative(TEMPLATE_ROOT, filePath), "permission", parsed.permission),
			);
		}

		it("has no permission value errors across all agent files", () => {
			assertNoErrors(permErrors, "permission errors");
		});
	});

	describe("Mode correctness", () => {
		const modeErrors: string[] = [];

		for (const filePath of agentFiles) {
			const { parsed, error } = loadAgentFrontmatter(filePath);
			if (error || !parsed) continue;
			if (parsed.mode && !VALID_MODES.has(parsed.mode as string)) {
				modeErrors.push(`${relative(TEMPLATE_ROOT, filePath)}: mode="${parsed.mode}"`);
			}
			if (parsed.hidden === true && parsed.mode === "primary") {
				modeErrors.push(`${relative(TEMPLATE_ROOT, filePath)}: hidden=true on primary agent`);
			}
		}

		it("has no mode errors across all agent files", () => {
			assertNoRawErrors(modeErrors, "mode errors");
		});
	});

	describe("Color correctness", () => {
		const colorErrors: string[] = [];

		for (const filePath of agentFiles) {
			const { parsed, error } = loadAgentFrontmatter(filePath);
			if (error || !parsed) continue;
			const color = parsed.color;
			if (typeof color === "string" && !HEX_COLOR_PATTERN.test(color) && !THEME_COLORS.has(color)) {
				colorErrors.push(`${relative(TEMPLATE_ROOT, filePath)}: color="${color}"`);
			}
		}

		it("has no color errors across all agent files", () => {
			assertNoRawErrors(colorErrors, "color errors");
		});
	});

	describe("Unknown field detection", () => {
		const unknownFieldErrors: string[] = [];

		for (const filePath of agentFiles) {
			const { parsed, error } = loadAgentFrontmatter(filePath);
			if (error || !parsed) continue;
			for (const key of Object.keys(parsed)) {
				if (!VALID_AGENT_FIELDS.has(key)) {
					unknownFieldErrors.push(`${relative(TEMPLATE_ROOT, filePath)}: "${key}"`);
				}
			}
		}

		it("has no unknown frontmatter fields across all agent files", () => {
			assertNoRawErrors(unknownFieldErrors, "unknown fields");
		});
	});

	describe("FEV-19 permission invariants", () => {
		const DELEGATING_PRIMARY_DENY_LIST = [...PRIMARY_AGENTS];

		for (const agentName of PRIMARY_AGENTS) {
			const filePath = join(TEMPLATE_ROOT, "main", `${agentName}.md`);

			it(`${agentName} has valid task permission structure`, () => {
				const { parsed, error } = loadAgentFrontmatter(filePath);
				expect(error).toBeNull();
				expect(parsed).not.toBeNull();
				const perm = (parsed as Record<string, unknown>).permission as
					| Record<string, unknown>
					| undefined;
				expect(perm?.task).toBeDefined();
			});

			if (NON_DELEGATING.has(agentName)) {
				it(`${agentName} has task: "*": deny (non-delegating)`, () => {
					const { parsed } = loadAgentFrontmatter(filePath);
					const perm = parsed as Record<string, unknown>;
					const task = (perm.permission as Record<string, unknown>).task as Record<string, unknown>;
					expect(task["*"]).toBe("deny");
					expect(Object.values(task).filter((v) => v === "allow").length).toBe(0);
				});
			} else {
				it(`${agentName} has task: "*": allow + 5 deny primaries (no self-deny)`, () => {
					const { parsed } = loadAgentFrontmatter(filePath);
					const perm = parsed as Record<string, unknown>;
					const task = (perm.permission as Record<string, unknown>).task as Record<string, unknown>;

					expect(task["*"]).toBe("allow");

					const denyEntries = Object.entries(task).filter(([k, v]) => k !== "*" && v === "deny");
					expect(denyEntries.length).toBe(5);

					expect(task[agentName]).toBeUndefined();
					expect(task.tezcatlipoca).toBe("deny");

					for (const deny of DELEGATING_PRIMARY_DENY_LIST.filter((n) => n !== agentName)) {
						expect(task[deny]).toBe("deny");
					}
				});
			}
		}
	});

	describe("No subagent index in primary agents", () => {
		for (const agentName of PRIMARY_AGENTS) {
			it(`${agentName} has no AVAILABLE SUBAGENTS section`, () => {
				const content = readFileSync(join(TEMPLATE_ROOT, "main", `${agentName}.md`), "utf-8");
				expect(content).not.toContain("## AVAILABLE SUBAGENTS");
			});

			it(`${agentName} has no "catalog" reference in RULES`, () => {
				const content = readFileSync(join(TEMPLATE_ROOT, "main", `${agentName}.md`), "utf-8");
				const rulesMatch = content.match(/### RULES[\s\S]*?(?=##|$)/);
				if (rulesMatch) {
					expect(rulesMatch[0]).not.toContain("the catalog");
					expect(rulesMatch[0]).not.toContain("AVAILABLE SUBAGENTS catalog");
				}
			});
		}
	});

	describe("Agents directory reference", () => {
		const DELEGATING_AGENTS = PRIMARY_AGENTS.filter((n) => !NON_DELEGATING.has(n));

		for (const agentName of DELEGATING_AGENTS) {
			it(`${agentName} RULES references agents/ directory`, () => {
				const content = readFileSync(join(TEMPLATE_ROOT, "main", `${agentName}.md`), "utf-8");
				expect(content).toContain("agents/");
			});
		}
	});
});
