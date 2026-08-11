/**
 * Command Frontmatter Validation Tests
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
 * The validation engine lives in ./helpers/commandFrontmatterValidator.ts
 * (reusable by contributors to check a single new command file).
 *
 * Reference: https://opencode.ai/docs/commands, https://opencode.ai/config.json
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
	collectCommandFiles,
	extractFrontmatter,
	loadCommandFrontmatter,
	type ValidationError,
	validateCommandFrontmatter,
} from "./helpers/commandFrontmatterValidator";

const TEMPLATE_ROOT = join(
	import.meta.dir,
	"..",
	"..",
	"..",
	"template",
	"obligatorio",
	"core",
	"commands",
);

const commandFiles = collectCommandFiles(TEMPLATE_ROOT);

/** Fails the test with a formatted error summary when errors is non-empty. */
function assertNoErrors(errors: readonly ValidationError[], label: string): void {
	if (errors.length === 0) return;
	const summary = errors
		.map((e) => `  ${e.file}${e.field ? ` [${e.field}]` : ""}: ${e.message}`)
		.join("\n");
	throw new Error(`Found ${errors.length} ${label}:\n${summary}`);
}

describe("Command Frontmatter Validation", () => {
	it(`discovers ${commandFiles.length} command files in template/obligatorio/core/commands/`, () => {
		expect(commandFiles.length).toBeGreaterThanOrEqual(13);
	});

	describe("YAML frontmatter structure", () => {
		for (const filePath of commandFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			it(`${relPath} has valid YAML frontmatter`, () => {
				const { parsed, error } = loadCommandFrontmatter(filePath);
				expect(error).toBeNull();
				expect(parsed).not.toBeNull();
				// Rejects frontmatter that parses to a scalar (e.g. `---\n42\n---`)
				expect(typeof parsed).toBe("object");
			});
		}
	});

	describe("Required fields", () => {
		for (const filePath of commandFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			it(`${relPath} has required "description" field`, () => {
				const { parsed, error } = loadCommandFrontmatter(filePath);
				expect(error).toBeNull();
				expect(parsed).not.toBeNull();
				expect(parsed!.description).toBeDefined();
				expect(typeof parsed!.description).toBe("string");
				expect((parsed!.description as string).trim().length).toBeGreaterThan(0);
			});
		}
	});

	describe("Field validation", () => {
		const allErrors: ValidationError[] = [];

		for (const filePath of commandFiles) {
			const { parsed, error } = loadCommandFrontmatter(filePath);
			if (error) {
				allErrors.push({ file: relative(TEMPLATE_ROOT, filePath), message: error });
				continue;
			}
			allErrors.push(...validateCommandFrontmatter(filePath, parsed!, TEMPLATE_ROOT));
		}

		it("has no validation errors across all command files", () => {
			assertNoErrors(allErrors, "frontmatter validation errors");
		});
	});

	describe("Synthetic fixture validation", () => {
		// Feeds crafted frontmatter directly to validateCommandFrontmatter to
		// cover branches the real command files never exercise (empty values,
		// wrong types, unknown agents/fields). The path/templateRoot pair is
		// arbitrary — relPath is what the error payloads are scoped to.
		const FIXTURE_PATH = "/fake/commands/spec.md";
		const FIXTURE_ROOT = "/fake/commands";

		const validate = (frontmatter: Record<string, unknown>): ValidationError[] =>
			validateCommandFrontmatter(FIXTURE_PATH, frontmatter, FIXTURE_ROOT);

		it("flags a missing description", () => {
			expect(validate({})).toEqual([
				{ file: "spec.md", field: "description", message: 'Missing required field "description"' },
			]);
		});

		it("flags an empty description", () => {
			expect(validate({ description: "   " })).toEqual([
				{ file: "spec.md", field: "description", message: "description must not be empty" },
			]);
		});

		it("flags a description of the wrong type", () => {
			expect(validate({ description: 42 })).toEqual([
				{
					file: "spec.md",
					field: "description",
					message: "description must be a string, got number",
				},
			]);
		});

		it("flags an unknown agent", () => {
			expect(validate({ description: "Valid", agent: "thor" })).toEqual([
				{
					file: "spec.md",
					field: "agent",
					message:
						'Unknown agent "thor". Known agents: huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli, moctezuma, tezcatlipoca',
				},
			]);
		});

		it("flags an empty model string", () => {
			expect(validate({ description: "Valid", model: "  " })).toEqual([
				{ file: "spec.md", field: "model", message: "model must not be empty" },
			]);
		});

		it("flags a model of the wrong type", () => {
			expect(validate({ description: "Valid", model: 42 })).toEqual([
				{ file: "spec.md", field: "model", message: "model must be a string, got number" },
			]);
		});

		it("flags a subtask of the wrong type", () => {
			expect(validate({ description: "Valid", subtask: "yes" })).toEqual([
				{ file: "spec.md", field: "subtask", message: "subtask must be a boolean, got string" },
			]);
		});

		it("flags a template of the wrong type", () => {
			expect(validate({ description: "Valid", template: 42 })).toEqual([
				{ file: "spec.md", field: "template", message: "template must be a string, got number" },
			]);
		});

		it("flags an unknown top-level field", () => {
			expect(validate({ description: "Valid", phase: "define" })).toEqual([
				{
					file: "spec.md",
					field: "phase",
					message:
						'Unknown frontmatter field "phase". Valid fields: description, agent, model, subtask, template',
				},
			]);
		});

		it("returns no errors for a fully valid frontmatter", () => {
			expect(
				validate({
					description: "Valid",
					agent: "tlaloc",
					model: "gpt-4o",
					subtask: true,
					template: "prompt",
				}),
			).toEqual([]);
		});
	});

	describe("Structural rules", () => {
		for (const filePath of commandFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			it(`${relPath} has a markdown body after frontmatter`, () => {
				const content = readFileSync(filePath, "utf-8");
				const { bodyStart } = extractFrontmatter(content);
				const body = content.slice(bodyStart).trim();
				expect(body.length).toBeGreaterThan(0);
			});
		}
	});

	describe("Body content rules", () => {
		for (const filePath of commandFiles) {
			const relPath = relative(TEMPLATE_ROOT, filePath);
			it(`${relPath} has a "Suggested Next Step" section`, () => {
				const content = readFileSync(filePath, "utf-8");
				expect(content).toContain("Suggested Next Step");
			});
		}
	});
});
