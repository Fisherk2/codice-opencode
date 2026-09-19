/**
 * Unit tests for the permission → tools migration codemod (FEV-29).
 *
 * The codemod renames the top-level `permission:` key in agent `.md` frontmatter
 * to `tools:` for Opencode V2 compatibility. All nested values are preserved
 * byte-for-byte — only the key name changes.
 *
 * Test strategy: TDD RED phase — these tests should fail before the
 * implementation exists.
 */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { migratePermissionToTools, runCli } from "../../../scripts/migrate-permission-to-tools";

describe("migratePermissionToTools", () => {
	let tmpDir: string;

	beforeAll(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "migrate-permission-"));
	});

	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	/**
	 * Helper: write a mock agent file and return its absolute path.
	 */
	function writeAgent(content: string, subdir: string, filename = "agent.md"): string {
		const dir = join(tmpDir, subdir);
		mkdirSync(dir, { recursive: true });
		const path = join(dir, filename);
		writeFileSync(path, content);
		return path;
	}

	/**
	 * Helper: read the full content of a file.
	 */
	function readAgent(path: string): string {
		return readFileSync(path, "utf-8");
	}

	// --- Case 1: Scalar permission value → tools ---
	it("renames permission: to tools: for scalar values", () => {
		const agent = writeAgent(
			`---
description: "Test Agent"
mode: subagent
permission:
  write: deny
  edit: deny
  grep: allow
---
# Test Agent

Body content here.
`,
			"case-1",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-1")]);

		expect(result.migrated).toBe(1);
		expect(result.errors).toHaveLength(0);
		const output = readAgent(agent);
		expect(output).toContain("tools:");
		expect(output).not.toContain("permission:");
		expect(output).toContain("  write: deny");
		expect(output).toContain("  edit: deny");
		expect(output).toContain("  grep: allow");
		expect(output).toContain("# Test Agent");
	});

	// --- Case 2: Nested map with shell-glob patterns ---
	it("preserves nested bash: patterns byte-for-byte", () => {
		const agent = writeAgent(
			`---
description: "Shell Agent"
mode: subagent
permission:
  write: allow
  bash:
    "* > *": deny
    "* >> *": deny
    "touch *": deny
    "mkdir *": ask
    "cp *": ask
    "mv *": ask
    "rm *": ask
  grep: allow
---
# Shell Agent

Body.
`,
			"case-2",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-2")]);

		expect(result.migrated).toBe(1);
		expect(result.errors).toHaveLength(0);
		const output = readAgent(agent);
		expect(output).toContain("tools:");
		expect(output).not.toContain("permission:");
		expect(output).toContain('    "* > *": deny');
		expect(output).toContain('    "touch *": deny');
		expect(output).toContain('    "mkdir *": ask');
	});

	// --- Case 3: Already migrated (tools: present) → skip ---
	it("skips files that already have tools:", () => {
		const agent = writeAgent(
			`---
description: "Already Migrated"
mode: subagent
tools:
  write: deny
---
# Already Migrated

Body.
`,
			"case-3",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-3")]);

		expect(result.migrated).toBe(0);
		expect(result.skipped).toBe(1);
		// File must NOT be modified
		const output = readAgent(agent);
		expect(output).toContain("tools:");
		expect(output).toContain("  write: deny");
	});

	// --- Case 4: Both permission: and tools: present → error ---
	it("returns error if both permission: and tools: exist", () => {
		writeAgent(
			`---
description: "Mixed Keys"
mode: subagent
permission:
  write: deny
tools:
  write: deny
---
# Mixed Keys

Body.
`,
			"case-4",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-4")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("both permission: and tools:");
	});

	// --- Case 5: Malformed frontmatter (no closing ---) → error ---
	it("returns error for malformed frontmatter without closing ---", () => {
		writeAgent(
			`---
description: "No Close"
mode: subagent
permission:
  write: deny

# No Close

Body.
`,
			"case-5",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-5")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("malformed");
	});

	// --- Case 6: Idempotency — migrate then migrate again ---
	it("is idempotent — second run skips already-migrated files", () => {
		const dir = join(tmpDir, "case-6");
		const agent = writeAgent(
			`---
description: "Idempotent Agent"
mode: subagent
permission:
  write: deny
---
# Idempotent

Body.
`,
			"case-6",
		);

		// First run — should migrate
		const first = migratePermissionToTools([dir]);
		expect(first.migrated).toBe(1);
		expect(first.errors).toHaveLength(0);

		// Second run — should skip (tools: already present)
		const second = migratePermissionToTools([dir]);
		expect(second.migrated).toBe(0);
		expect(second.skipped).toBeGreaterThanOrEqual(1);
		// File unchanged from first migration
		const output = readAgent(agent);
		expect(output).toContain("tools:");
		expect(output).not.toContain("permission:");
	});

	// --- Case 7: --dry-run does not modify files ---
	it("dry-run reports changes without writing", () => {
		const agent = writeAgent(
			`---
description: "Dry Run Agent"
mode: subagent
permission:
  write: deny
---
# Dry Run

Body.
`,
			"case-7",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-7")], { dryRun: true });

		expect(result.migrated).toBe(1);
		// File must remain unchanged
		const output = readAgent(agent);
		expect(output).toContain("permission:");
		expect(output).not.toContain("tools:");
	});

	// --- Case 8: Multiple files in a directory ---
	it("migrates all agent files in a directory", () => {
		const dir = join(tmpDir, "case-8");
		writeAgent(
			`---
description: "Agent A"
mode: subagent
permission:
  write: deny
---
# A
`,
			"case-8",
			"agent-a.md",
		);
		writeAgent(
			`---
description: "Agent B"
mode: subagent
permission:
  write: allow
  edit: allow
---
# B
`,
			"case-8",
			"agent-b.md",
		);

		const result = migratePermissionToTools([dir]);

		expect(result.migrated).toBe(2);
		expect(result.errors).toHaveLength(0);
	});

	// --- Case 9: File without permission: key is skipped ---
	it("skips files that have no permission: key", () => {
		const agent = writeAgent(
			`---
description: "No Permission Key"
mode: subagent
---
# No Permission

Body.
`,
			"case-9",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-9")]);

		expect(result.migrated).toBe(0);
		expect(result.skipped).toBe(1);
		// File unchanged
		const output = readAgent(agent);
		expect(output).not.toContain("tools:");
	});

	// --- Case 10: Nonexistent directory → error ---
	it("reports an error for an unreadable directory", () => {
		const result = migratePermissionToTools([join(tmpDir, "does-not-exist")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("Cannot read directory");
	});

	// --- Case 11: Path that cannot be read as a file → error ---
	it("reports an error for a file that cannot be read", () => {
		const dir = join(tmpDir, "case-11");
		// A directory named `*.md` passes the extension filter but readFileSync throws EISDIR.
		mkdirSync(join(dir, "unreadable.md"), { recursive: true });

		const result = migratePermissionToTools([dir]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("Cannot read file");
	});

	// --- Case 12: File without any frontmatter delimiter → error ---
	it("reports an error for frontmatter with no opening ---", () => {
		writeAgent(
			`# No Frontmatter At All

Just a markdown body with no delimiters.
`,
			"case-12",
		);

		const result = migratePermissionToTools([join(tmpDir, "case-12")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("no opening ---");
	});
});

describe("runCli", () => {
	let tmpDir: string;

	beforeAll(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "migrate-cli-"));
	});

	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("returns 1 when no directories are provided", () => {
		expect(runCli([])).toBe(1);
	});

	it("returns 0 after a successful migration", () => {
		const dir = join(tmpDir, "ok");
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, "agent.md"),
			`---
description: "CLI Agent"
mode: subagent
permission:
  write: deny
---
# CLI
`,
		);

		expect(runCli([dir])).toBe(0);
	});

	it("returns 0 for a dry-run even when errors are reported", () => {
		const dir = join(tmpDir, "broken");
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "agent.md"), "# no frontmatter\n");

		expect(runCli(["--dry-run", dir])).toBe(0);
	});

	it("returns 1 when a non-dry-run migration reports errors", () => {
		const dir = join(tmpDir, "broken-2");
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "agent.md"), "# no frontmatter\n");

		expect(runCli([dir])).toBe(1);
	});
});
