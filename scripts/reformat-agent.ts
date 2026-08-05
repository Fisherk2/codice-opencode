import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * FEV-18 Phase 1 — v2.0 agent reformatting.
 * Converts agency-agents-main source files (name/description/color/emoji/vibe)
 * to the project standard subagent format (description/mode/permission)
 * with a trailing ## COMPOSITION block.
 */

/** Shape of the parsed source frontmatter. */
export interface ReformatResult {
	ok: boolean;
	content?: string;
	error?: string;
}

interface SourceFrontmatter {
	name: string;
	description: string;
	color?: string;
	emoji?: string;
	vibe?: string;
}

const FRONTMATTER_DELIMITER = "---";

/** Standard subagent permission block (matches legacy convention). */
const SUBAGENT_PERMISSION = `permission:
  write: allow
  edit: allow
  bash:
    "*": ask
  grep: allow
  glob: allow
  lsp: allow
  skill: allow
  todowrite: allow
  webfetch: allow
  websearch: allow
  question: allow`;

/** Fixed accent used when the source color is a named (non-hex) value. */
const DEFAULT_COLOR = "#dcb03b";

/** Normalize a source color to a valid hex string for the v2.0 YAML. */
function normalizeColor(color: string | undefined): string {
	if (!color) return DEFAULT_COLOR;
	const trimmed = color.replace(/['"]/g, "").trim();
	if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
	return DEFAULT_COLOR;
}

/** Extract the frontmatter block between the leading `---` delimiters. */
function parseFrontmatter(
	content: string,
): { frontmatter: SourceFrontmatter; body: string } | null {
	const lines = content.split("\n");
	if (lines[0]?.trim() !== FRONTMATTER_DELIMITER) return null;

	const closingIdx = lines.findIndex(
		(line, idx) => idx > 0 && line.trim() === FRONTMATTER_DELIMITER,
	);
	if (closingIdx === -1) return null;

	const yamlLines = lines.slice(1, closingIdx);
	const body = lines
		.slice(closingIdx + 1)
		.join("\n")
		.trimStart();

	const frontmatter: Partial<SourceFrontmatter> = {};
	for (const line of yamlLines) {
		const match = /^([a-zA-Z-]+):\s*(.*)$/.exec(line);
		if (!match) continue;
		const [, key, rawValue = ""] = match;
		const value = rawValue.replace(/^["']|["']$/g, "").trim();
		switch (key) {
			case "name":
				frontmatter.name = value;
				break;
			case "description":
				frontmatter.description = value;
				break;
			case "color":
				frontmatter.color = value;
				break;
			case "emoji":
				frontmatter.emoji = value;
				break;
			case "vibe":
				frontmatter.vibe = value;
				break;
		}
	}

	if (!frontmatter.name || !frontmatter.description) return null;
	return { frontmatter: frontmatter as SourceFrontmatter, body };
}

/**
 * Strip the source's decorative H1 (always the first body line) so the
 * generated "# <name>" title is the only H1. Source H1s are redundant:
 * they repeat the agent name plus a suffix ("Agent Personality", emoji, etc.)
 * and would otherwise produce two sibling H1s in the converted file.
 */
function stripLeadingH1(body: string): string {
	const lines = body.split("\n");
	const firstContentIdx = lines.findIndex((line) => line.trim().length > 0);
	const firstLine = firstContentIdx !== -1 ? lines[firstContentIdx] : undefined;
	if (firstLine !== undefined && firstLine.startsWith("# ")) {
		lines.splice(firstContentIdx, 1);
	}
	return lines.join("\n").trimStart();
}

/** Build the trailing ## COMPOSITION block from the agent description. */
function buildCompositionBlock(description: string): string {
	const purpose = description.split(/[.。;]/)[0]?.trim() ?? description.trim();
	const snippet = purpose.length > 120 ? `${purpose.slice(0, 117)}...` : purpose;
	return `## COMPOSITION

- **Invoke directly when:** ${snippet}
- **Invoke via:** Primary agents (via task delegation)
- **Do not invoke from:** Another persona without a specific task requiring this specialization.`;
}

/** Generate the v2.0 markdown content from a source file's contents. */
function buildV2Content(content: string): string {
	const parsed = parseFrontmatter(content);
	if (!parsed) {
		throw new Error("Invalid source: missing YAML frontmatter delimited by ---");
	}
	const { frontmatter, body } = parsed;

	const description = `"${frontmatter.name} — ${frontmatter.description}"`;
	const color = normalizeColor(frontmatter.color);

	const yaml = [
		FRONTMATTER_DELIMITER,
		`description: ${description}`,
		"mode: subagent",
		"temperature: 0.1",
		`color: "${color}"`,
		"hidden: true",
		SUBAGENT_PERMISSION,
		FRONTMATTER_DELIMITER,
		"",
	].join("\n");

	const cleanedBody = stripLeadingH1(body);
	const composition = buildCompositionBlock(frontmatter.description);

	return `${yaml}# ${frontmatter.name}\n\n${cleanedBody}\n\n${composition}\n`;
}

/**
 * Convert a source agent file to the v2.0 format.
 * Idempotent: re-running on an already-converted file is a no-op guard.
 * @param sourcePath - agency-agents-main source .md file.
 * @param targetPath - destination .md file in a pack directory.
 * @returns Result with the generated content (ok) or an error message.
 */
export function reformatAgent(sourcePath: string, targetPath: string): ReformatResult {
	let source: string;
	try {
		source = readFileSync(sourcePath, "utf-8");
	} catch {
		return { ok: false, error: `Source file not found: ${sourcePath}` };
	}

	let output: string;
	try {
		output = buildV2Content(source);
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : "Unknown conversion error" };
	}

	try {
		mkdirSync(dirname(targetPath), { recursive: true });
		writeFileSync(targetPath, output);
	} catch (err) {
		return {
			ok: false,
			error: `Failed to write ${targetPath}: ${err instanceof Error ? err.message : "unknown error"}`,
		};
	}

	return { ok: true, content: output };
}
