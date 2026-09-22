/**
 * Agent Frontmatter Validation Tests
 *
 * Validates that all agent .md files in template/obligatorio/packs/
 * conform to the native OpenCode V2 agent format described in
 * specs/spec-agent-format-v2.md §3–4 (https://opencode.ai/v2/docs/permissions).
 *
 * The validation engine lives in ./helpers/agentFrontmatterValidator.ts
 * (reusable by contributors to check a single new agent file).
 *
 * Reference: specs/spec-agent-format-v2.md §3–4 + https://opencode.ai/v2/docs/permissions
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
	collectAgentFiles,
	extractFrontmatter,
	loadAgentFrontmatter,
	type ValidationError,
	validateAgentFrontmatter,
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

	describe("Fase-2 legacy tools: regression guard", () => {
		// Native V2 replaced the V1 `tools:` map with the `permissions:` list.
		// Accepting `tools:` here would let the silent-shadowing class of bug
		// (issue #91 / fix26) return unnoticed: OpenCode V2 ignores the legacy
		// key, so a restrictive agent would look unrestricted.
		it("rejects tools: as an invalid agent frontmatter field", () => {
			const errors = validateAgentFrontmatter(
				join(TEMPLATE_ROOT, "main", "moctezuma.md"),
				{ description: "test", mode: "subagent", tools: { write: "deny" } },
				TEMPLATE_ROOT,
			);
			const toolErrors = errors.filter((e) => e.field === "tools");
			expect(toolErrors.length).toBeGreaterThan(0);
			expect(toolErrors[0]?.message).toContain('Unknown frontmatter field "tools"');
		});

		it("has no agent file using the legacy tools: key", () => {
			const legacyUsers: string[] = [];
			for (const filePath of agentFiles) {
				const { parsed, error } = loadAgentFrontmatter(filePath);
				if (error || !parsed) continue;
				if (Object.hasOwn(parsed, "tools")) {
					legacyUsers.push(relative(TEMPLATE_ROOT, filePath));
				}
			}
			expect(legacyUsers).toEqual([]);
		});
	});

	describe("V2-native agent keys accepted during migration", () => {
		it("accepts disabled as a native V2 agent frontmatter field", () => {
			const errors = validateAgentFrontmatter(
				join(TEMPLATE_ROOT, "main", "moctezuma.md"),
				{ description: "t", mode: "subagent", disabled: true },
				TEMPLATE_ROOT,
			);
			expect(errors).toEqual([]);
		});

		it("accepts system as a native V2 agent frontmatter field", () => {
			const errors = validateAgentFrontmatter(
				join(TEMPLATE_ROOT, "main", "moctezuma.md"),
				{ description: "t", mode: "subagent", system: "You are terse." },
				TEMPLATE_ROOT,
			);
			expect(errors).toEqual([]);
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

	describe("Fase-2 legacy tools: regression guard", () => {
		it("rejects permission: as an invalid agent frontmatter field", () => {
			const errors = validateAgentFrontmatter(
				join(TEMPLATE_ROOT, "main", "moctezuma.md"),
				{ description: "test", mode: "subagent", permission: { write: "deny" } },
				TEMPLATE_ROOT,
			);
			const permissionErrors = errors.filter((e) => e.field === "permission");
			expect(permissionErrors.length).toBeGreaterThan(0);
			expect(permissionErrors[0]?.message).toContain('Unknown frontmatter field "permission"');
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

	describe("Primary agent body line budget", () => {
		// spec-agent-format-v2.md §8: primary agent bodies stay ≤100 lines
		// (excluding YAML frontmatter). Only the body is enforced: total file
		// length is frontmatter-dependent and V2 `permissions:` lists push some
		// primaries (e.g. quetzalcoatl.md) past the retired ≈150-line total.
		for (const agentName of PRIMARY_AGENTS) {
			it(`${agentName} body stays within 100 lines`, () => {
				const content = readFileSync(join(TEMPLATE_ROOT, "main", `${agentName}.md`), "utf-8");
				const { bodyStart } = extractFrontmatter(content);
				const body = content.slice(bodyStart).trim();
				const lineCount = body === "" ? 0 : body.split("\n").length;
				expect(lineCount).toBeLessThanOrEqual(100);
			});
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

		it("does not collide when a space in one field offsets the other", () => {
			const errors = validatePermissionsList("test.md", "permissions", [
				{ action: "a b", resource: "c", effect: "allow" },
				{ action: "a", resource: "b c", effect: "deny" },
			]);
			expect(errors).toEqual([]);
		});
	});

	describe("validatePermissionsList error branches", () => {
		it("rejects a non-list permissions value", () => {
			const errors = validatePermissionsList("test.md", "permissions", "allow");
			expect(errors.length).toBe(1);
			expect(errors[0]?.message).toContain("must be a list");
		});

		it("rejects a null rule", () => {
			const errors = validatePermissionsList("test.md", "permissions", [null]);
			expect(errors.length).toBe(1);
			expect(errors[0]?.message).toContain("must be an object");
		});

		it("rejects a non-object rule", () => {
			const errors = validatePermissionsList("test.md", "permissions", ["edit"]);
			expect(errors.length).toBe(1);
			expect(errors[0]?.message).toContain("must be an object");
		});

		it("rejects a rule field of the wrong type", () => {
			const errors = validatePermissionsList("test.md", "permissions", [
				{ action: 42, resource: "*", effect: "allow" },
			]);
			expect(errors.some((e) => e.message.includes('"action" must be a string'))).toBe(true);
		});

		it("rejects an invalid effect", () => {
			const errors = validatePermissionsList("test.md", "permissions", [
				{ action: "edit", resource: "*", effect: "maybe" },
			]);
			expect(errors.some((e) => e.message.includes('Invalid permissions effect "maybe"'))).toBe(
				true,
			);
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
