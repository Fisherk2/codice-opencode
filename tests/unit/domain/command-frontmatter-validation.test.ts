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
	VALID_AGENTS,
	VALID_COMMAND_FIELDS,
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

/** Fails the test with a formatted summary when raw strings are non-empty. */
function assertNoRawErrors(errors: readonly string[], label: string): void {
	if (errors.length === 0) return;
	throw new Error(`Found ${errors.length} ${label}:\n${errors.join("\n")}`);
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

	describe("Agent field correctness", () => {
		const agentErrors: string[] = [];

		for (const filePath of commandFiles) {
			const { parsed, error } = loadCommandFrontmatter(filePath);
			if (error || !parsed?.agent) continue;
			if (!VALID_AGENTS.has(parsed.agent as string)) {
				agentErrors.push(`${relative(TEMPLATE_ROOT, filePath)}: agent="${parsed.agent}"`);
			}
		}

		it("has no unknown agent values across all command files", () => {
			assertNoRawErrors(agentErrors, "unknown agent values");
		});
	});

	describe("Optional field types", () => {
		const typeErrors: string[] = [];

		for (const filePath of commandFiles) {
			const { parsed, error } = loadCommandFrontmatter(filePath);
			if (error || !parsed) continue;
			const relPath = relative(TEMPLATE_ROOT, filePath);

			// model must be string if present
			if (parsed.model !== undefined && typeof parsed.model !== "string") {
				typeErrors.push(`${relPath}: model=${typeof parsed.model} (expected string)`);
			}

			// subtask must be boolean if present
			if (parsed.subtask !== undefined && typeof parsed.subtask !== "boolean") {
				typeErrors.push(`${relPath}: subtask=${typeof parsed.subtask} (expected boolean)`);
			}

			// template must be string if present
			if (parsed.template !== undefined && typeof parsed.template !== "string") {
				typeErrors.push(`${relPath}: template=${typeof parsed.template} (expected string)`);
			}
		}

		it("has no optional field type errors across all command files", () => {
			assertNoRawErrors(typeErrors, "optional field type errors");
		});
	});

	describe("Unknown field detection", () => {
		const unknownFieldErrors: string[] = [];

		for (const filePath of commandFiles) {
			const { parsed, error } = loadCommandFrontmatter(filePath);
			if (error || !parsed) continue;
			for (const key of Object.keys(parsed)) {
				if (!VALID_COMMAND_FIELDS.has(key)) {
					unknownFieldErrors.push(`${relative(TEMPLATE_ROOT, filePath)}: "${key}"`);
				}
			}
		}

		it("has no unknown frontmatter fields across all command files", () => {
			assertNoRawErrors(unknownFieldErrors, "unknown fields");
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
