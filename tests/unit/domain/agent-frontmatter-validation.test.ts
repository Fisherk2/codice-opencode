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
	validatePermissionsList,
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

// Non-delegating agents: subagent: "*": deny (per FEV-19, tezcatlipoca removed from this set in v2.1.3 hotfix)
const NON_DELEGATING = new Set(["moctezuma"]);

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

	describe("Tools value correctness", () => {
		const toolErrors: ValidationError[] = [];

		for (const filePath of agentFiles) {
			const { parsed, error } = loadAgentFrontmatter(filePath);
			if (error || !parsed?.tools) continue;
			toolErrors.push(
				...validatePermission(relative(TEMPLATE_ROOT, filePath), "tools", parsed.tools),
			);
		}

		it("has no tools value errors across all agent files", () => {
			assertNoErrors(toolErrors, "tools errors");
		});
	});

	describe("Permissions value correctness (V2)", () => {
		const permErrors: ValidationError[] = [];

		for (const filePath of agentFiles) {
			const { parsed, error } = loadAgentFrontmatter(filePath);
			if (error || !parsed?.permissions) continue;
			permErrors.push(
				...validatePermissionsList(
					relative(TEMPLATE_ROOT, filePath),
					"permissions",
					parsed.permissions,
				),
			);
		}

		it("has no permissions value errors across all agent files", () => {
			assertNoErrors(permErrors, "permissions errors");
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

	describe("FEV-29 legacy permission: regression guard", () => {
		it("rejects permission: as an invalid agent frontmatter field", () => {
			const errors = validateAgentFrontmatter(
				join(TEMPLATE_ROOT, "main", "moctezuma.md"),
				{ description: "test", mode: "subagent", permission: { write: "deny" } },
				TEMPLATE_ROOT,
			);
			const permissionErrors = errors.filter((e) => e.field === "permission");
			expect(permissionErrors.length).toBeGreaterThan(0);
		});

		it("has no agent file using the legacy permission: key", () => {
			const legacyUsers: string[] = [];
			for (const filePath of agentFiles) {
				const { parsed, error } = loadAgentFrontmatter(filePath);
				if (error || !parsed) continue;
				if (Object.hasOwn(parsed, "permission")) {
					legacyUsers.push(relative(TEMPLATE_ROOT, filePath));
				}
			}
			expect(legacyUsers).toEqual([]);
		});
	});

	describe("FEV-19 subagent delegation invariants (V2 permissions)", () => {
		const DELEGATING_PRIMARY_DENY_LIST = [...PRIMARY_AGENTS];

		function subagentRules(
			parsed: Record<string, unknown>,
		): Array<{ resource: string; effect: string }> {
			const permissions = (parsed.permissions ?? []) as Array<Record<string, unknown>>;
			return permissions
				.filter((r) => r.action === "subagent")
				.map((r) => ({ resource: r.resource as string, effect: r.effect as string }));
		}

		for (const agentName of PRIMARY_AGENTS) {
			const filePath = join(TEMPLATE_ROOT, "main", `${agentName}.md`);

			it(`${agentName} declares subagent delegation rules`, () => {
				const { parsed, error } = loadAgentFrontmatter(filePath);
				expect(error).toBeNull();
				expect(parsed).not.toBeNull();
				expect(subagentRules(parsed as Record<string, unknown>).length).toBeGreaterThan(0);
			});

			if (NON_DELEGATING.has(agentName)) {
				it(`${agentName} has subagent: "*": deny (non-delegating)`, () => {
					const { parsed } = loadAgentFrontmatter(filePath);
					const rules = subagentRules(parsed as Record<string, unknown>);
					expect(rules.find((r) => r.resource === "*")?.effect).toBe("deny");
					expect(rules.filter((r) => r.effect === "allow").length).toBe(0);
				});
			} else {
				it(`${agentName} has subagent: "*": allow + deny all other primaries (no self-deny)`, () => {
					const { parsed } = loadAgentFrontmatter(filePath);
					const rules = subagentRules(parsed as Record<string, unknown>);

					expect(rules.find((r) => r.resource === "*")?.effect).toBe("allow");

					const denyEntries = rules.filter((r) => r.resource !== "*" && r.effect === "deny");
					expect(denyEntries.length).toBe(5);

					// Agent must not deny itself
					expect(rules.find((r) => r.resource === agentName)).toBeUndefined();

					// Must deny all other primaries
					for (const deny of DELEGATING_PRIMARY_DENY_LIST.filter((n) => n !== agentName)) {
						expect(rules.find((r) => r.resource === deny)?.effect).toBe("deny");
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

	describe("validatePermissionsList duplicate guard", () => {
		it("accepts distinct action+resource pairs", () => {
			const errors = validatePermissionsList("test.md", "permissions", [
				{ action: "edit", resource: "*", effect: "ask" },
				{ action: "edit", resource: "*.md", effect: "allow" },
			]);
			expect(errors).toEqual([]);
		});

		it("rejects duplicate action+resource pairs", () => {
			const errors = validatePermissionsList("test.md", "permissions", [
				{ action: "edit", resource: "*", effect: "allow" },
				{ action: "grep", resource: "*", effect: "allow" },
				{ action: "edit", resource: "*", effect: "deny" },
			]);
			expect(errors.length).toBe(1);
			expect(errors[0]?.message).toContain('Duplicate permission for action "edit" resource "*"');
		});
	});

	describe("Fase-2 subagent delegation brake", () => {
		it("every migrated mode:subagent file denies subagent delegation", () => {
			// A child session merges global permissions with its OWN frontmatter
			// (https://opencode.ai/v2/docs/permissions/). Without an explicit
			// subagent deny, a child would fall back to the global `ask` and
			// could launch grandchildren (delegation chains). Files not yet
			// migrated (no `permissions:` list) are skipped: the codemod injects
			// the brake automatically on migration (case-17).
			const offenders: string[] = [];
			for (const filePath of agentFiles) {
				const { parsed, error } = loadAgentFrontmatter(filePath);
				if (error || !parsed) continue;
				if ((parsed as Record<string, unknown>).mode !== "subagent") continue;
				const permissions = (parsed as Record<string, unknown>).permissions;
				if (!Array.isArray(permissions)) continue;
				const denies = (permissions as Array<Record<string, unknown>>).some(
					(r) => r.action === "subagent" && r.resource === "*" && r.effect === "deny",
				);
				if (!denies) offenders.push(relative(TEMPLATE_ROOT, filePath));
			}
			expect(offenders).toEqual([]);
		});
	});
});
