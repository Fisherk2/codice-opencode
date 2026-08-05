import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ReformatResult } from "../../../scripts/reformat-agent";
import { reformatAgent } from "../../../scripts/reformat-agent";

/**
 * Unit tests for the v2.0 agent reformatting pipeline (FEV-18 Phase 1).
 * Verifies source (agency-agents-main) → v2.0 (project standard) conversion,
 * including COMPOSITION block append and idempotency guarantees.
 */
describe("reformatAgent", () => {
	let tmpDir: string;

	beforeAll(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "reformat-agent-"));
	});

	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	const sourceWithAllFields = `---
name: AI Engineer
description: Expert AI/ML engineer specializing in model development and deployment
color: blue
emoji: 🤖
vibe: Turns ML models into production features.
---

# AI Engineer Agent

You are an **AI Engineer**, an expert AI/ML engineer.

## Core Mission
- Build machine learning models
`;

	function writeSource(content: string, filename = "source.md"): string {
		const path = join(tmpDir, filename);
		writeFileSync(path, content);
		return path;
	}

	function writeTarget(filename = "target.md"): string {
		return join(tmpDir, filename);
	}

	it("converts source YAML to v2.0 format (description, mode, permission present; no name/emoji/vibe)", () => {
		const source = writeSource(sourceWithAllFields, "source-1.md");
		const target = writeTarget("target-1.md");

		const result: ReformatResult = reformatAgent(source, target);

		expect(result.ok).toBe(true);
		const output = result.content ?? "";
		expect(output).toContain('description: "AI Engineer');
		expect(output).toContain("mode: subagent");
		expect(output).toContain("hidden: true");
		expect(output).toContain("temperature: 0.1");
		expect(output).toContain("permission:");
		expect(output).toContain("  write: allow");
		expect(output).not.toContain("name: AI Engineer");
		expect(output).not.toContain("emoji:");
		expect(output).not.toContain("vibe:");
	});

	it("appends a ## COMPOSITION block at the end", () => {
		const source = writeSource(sourceWithAllFields, "source-2.md");
		const target = writeTarget("target-2.md");

		const result: ReformatResult = reformatAgent(source, target);

		expect(result.ok).toBe(true);
		const output = result.content ?? "";
		expect(output).toContain("## COMPOSITION");
		expect(output).toContain("**Invoke directly when:**");
		expect(output).toContain("**Invoke via:**");
		const compIndex = output.indexOf("## COMPOSITION");
		const bodyEnd = output.indexOf("## Core Mission");
		expect(compIndex).toBeGreaterThan(bodyEnd);
	});

	it("is idempotent — running twice produces identical output", () => {
		const source = writeSource(sourceWithAllFields, "source-3.md");
		const target1 = writeTarget("target-3a.md");
		const target2 = writeTarget("target-3b.md");

		const first: ReformatResult = reformatAgent(source, target1);
		const second: ReformatResult = reformatAgent(source, target2);

		expect(first.ok).toBe(true);
		expect(second.ok).toBe(true);
		expect(first.content).toBe(second.content);
		// Re-running on the same target must not duplicate COMPOSITION
		const again: ReformatResult = reformatAgent(source, target1);
		expect((again.content ?? "").split("## COMPOSITION")).toHaveLength(2);
	});

	it("preserves the body content from the source", () => {
		const source = writeSource(sourceWithAllFields, "source-4.md");
		const target = writeTarget("target-4.md");

		const result: ReformatResult = reformatAgent(source, target);

		expect(result.ok).toBe(true);
		const output = result.content ?? "";
		expect(output).toContain("You are an **AI Engineer**, an expert AI/ML engineer.");
		expect(output).toContain("- Build machine learning models");
	});

	it("returns an error for files without YAML frontmatter", () => {
		const source = writeSource("# No Frontmatter\n\nJust a body.\n", "source-5.md");
		const target = writeTarget("target-5.md");

		const result: ReformatResult = reformatAgent(source, target);

		expect(result.ok).toBe(false);
		expect(result.error).toContain("frontmatter");
	});

	it("returns an error for nonexistent source files", () => {
		const missing = join(tmpDir, "does-not-exist.md");
		const target = writeTarget("target-6.md");

		const result: ReformatResult = reformatAgent(missing, target);

		expect(result.ok).toBe(false);
		expect(result.error).toContain("not found");
	});

	it("works with hex color and missing vibe field (optional fields)", () => {
		const source = `---
name: CMS Developer
description: Drupal and WordPress specialist
color: "#059669"
emoji: 🖥️
---

# CMS Developer Agent

You are a **CMS Developer**.
`;
		const src = writeSource(source, "source-7.md");
		const target = writeTarget("target-7.md");

		const result: ReformatResult = reformatAgent(src, target);

		expect(result.ok).toBe(true);
		expect(result.content).toContain("mode: subagent");
		expect(result.content).not.toContain("vibe:");
	});

	it("writes the target file when not in dry-run mode", async () => {
		const source = writeSource(sourceWithAllFields, "source-8.md");
		const target = writeTarget("target-8.md");

		const result: ReformatResult = reformatAgent(source, target);

		expect(result.ok).toBe(true);
		const written = Bun.file(target);
		expect(await written.exists()).toBe(true);
	});

	it("removes the source '# <name> Agent' H1 heading duplication", () => {
		const source = writeSource(sourceWithAllFields, "source-9.md");
		const target = writeTarget("target-9.md");

		const result: ReformatResult = reformatAgent(source, target);

		expect(result.ok).toBe(true);
		const output = result.content ?? "";
		// The v2.0 title is "# AI Engineer" (not "# AI Engineer Agent")
		expect(output).not.toContain("# AI Engineer Agent");
		expect(output).toContain("# AI Engineer");
	});

	it("uses mkdir for nested target paths", async () => {
		const source = writeSource(sourceWithAllFields, "source-10.md");
		const target = join(tmpDir, "nested", "dir", "target-10.md");
		mkdirSync(join(tmpDir, "nested", "dir"), { recursive: true });

		const result: ReformatResult = reformatAgent(source, target);

		expect(result.ok).toBe(true);
		expect(await Bun.file(target).exists()).toBe(true);
	});
});
