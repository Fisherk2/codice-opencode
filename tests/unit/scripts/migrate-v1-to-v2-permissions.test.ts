/**
 * migrate-v1-to-v2-permissions — Codemod V1 (permission:/tools: map) to native V2 (permissions: list).
 *
 * TDD (Fase 2): these tests are written BEFORE the script exists (RED),
 * then the script is implemented to make them pass (GREEN).
 *
 * Conversion contract (opencode.ai/v2/docs/migrate-v1):
 * - `permission:` / `tools:` map  ->  `permissions:` [{action, resource, effect}]
 * - renames: bash -> shell, task -> subagent, write/patch -> edit
 * - scalar `key: effect` -> resource "*"; nested maps expand in file order
 * - top-level `temperature`/`top_p` -> request.body; `maxSteps` -> `steps`
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrateV1ToV2Permissions, runCli } from "../../../scripts/migrate-v1-to-v2-permissions";

let tmpDir: string;

beforeAll(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "migrate-v2-"));
});

afterAll(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

function writeAgent(content: string, dir: string, name = "agent.md"): string {
	const d = join(tmpDir, dir);
	mkdirSync(d, { recursive: true });
	const p = join(d, name);
	writeFileSync(p, content);
	return p;
}

function readAgent(path: string): string {
	return readFileSync(path, "utf-8");
}

describe("migrateV1ToV2Permissions", () => {
	it("converts a scalar permission map to a permissions list", () => {
		const agent = writeAgent(
			`---
description: "Scalar Agent"
mode: subagent
tools:
  write: allow
  edit: deny
---
# Scalar
`,
			"case-1",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-1")]);

		expect(result.migrated).toBe(1);
		expect(result.errors).toEqual([]);
		const output = readAgent(agent);
		expect(output).toContain("permissions:");
		expect(output).toContain('- action: edit\n    resource: "*"');
		expect(output).not.toContain("\ntools:");
	});

	it("expands nested bash maps to shell rules preserving file order", () => {
		const agent = writeAgent(
			`---
description: "Nested Agent"
mode: subagent
tools:
  bash:
    "*": ask
    "git status *": allow
    "rm -rf *": deny
---
# Nested
`,
			"case-2",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-2")]);

		expect(result.migrated).toBe(1);
		const output = readAgent(agent);
		const askIdx = output.indexOf('resource: "*"');
		const allowIdx = output.indexOf('resource: "git status *"');
		const denyIdx = output.indexOf('resource: "rm -rf *"');
		expect(askIdx).toBeGreaterThan(-1);
		expect(allowIdx).toBeGreaterThan(askIdx);
		expect(denyIdx).toBeGreaterThan(allowIdx);
		expect(output).toContain("- action: shell");
		expect(output).not.toContain("bash:");
	});

	it("renames task to subagent preserving the primary deny-list", () => {
		const agent = writeAgent(
			`---
description: "Primary Agent"
mode: primary
tools:
  task:
    "*": allow
    "quetzalcoatl": deny
    "moctezuma": deny
---
# Primary
`,
			"case-3",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-3")]);

		expect(result.migrated).toBe(1);
		const output = readAgent(agent);
		expect(output).toContain("- action: subagent");
		expect(output).toContain('resource: "quetzalcoatl"');
		expect(output).not.toContain("task:");
	});

	it("merges write and patch into edit and warns on scalar conflicts", () => {
		const agent = writeAgent(
			`---
description: "Merge Agent"
mode: primary
tools:
  write: deny
  edit: allow
  patch: deny
---
# Merge
`,
			"case-4",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-4")]);

		expect(result.migrated).toBe(1);
		expect(result.warnings.length).toBeGreaterThan(0);
		const output = readAgent(agent);
		expect(output).not.toContain("write:");
		expect(output).not.toContain("patch:");
		// Duplicate (edit, *) rules collapse under last-match-wins: the earlier
		// deny and allow are dead (shadowed by the trailing patch-derived deny),
		// so only the surviving deny is emitted.
		expect(output.split("- action: edit").length - 1).toBe(1);
		const editBlock = output.slice(
			output.indexOf("- action: edit"),
			output.indexOf("- action: edit") + 120,
		);
		expect(editBlock).toContain("effect: deny");
	});

	it("converts the legacy permission: key as well", () => {
		const agent = writeAgent(
			`---
description: "Legacy Agent"
mode: subagent
permission:
  edit: deny
---
# Legacy
`,
			"case-5",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-5")]);

		expect(result.migrated).toBe(1);
		const output = readAgent(agent);
		expect(output).toContain("permissions:");
		expect(output).not.toContain("\npermission:");
	});

	it("moves top-level temperature under request.body", () => {
		const agent = writeAgent(
			`---
description: "Temp Agent"
mode: subagent
temperature: 0.1
tools:
  edit: allow
---
# Temp
`,
			"case-6",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-6")]);

		expect(result.migrated).toBe(1);
		const output = readAgent(agent);
		expect(output).toContain("request:");
		expect(output).toContain("temperature: 0.1");
		expect(output).not.toContain("\ntemperature:");
	});

	it("renames maxSteps to steps", () => {
		const agent = writeAgent(
			`---
description: "Steps Agent"
mode: subagent
maxSteps: 40
tools:
  edit: allow
---
# Steps
`,
			"case-7",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-7")]);

		expect(result.migrated).toBe(1);
		const output = readAgent(agent);
		expect(output).toContain("steps: 40");
		expect(output).not.toContain("maxSteps");
	});

	it("skips files already carrying permissions:", () => {
		const agent = writeAgent(
			`---
description: "Done Agent"
mode: subagent
permissions:
  - action: edit
    resource: "*"
    effect: allow
---
# Done
`,
			"case-8",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-8")]);

		expect(result.migrated).toBe(0);
		expect(result.skipped).toBe(1);
		expect(result.errors).toEqual([]);
		expect(readAgent(agent)).toContain("permissions:");
	});

	it("errors on mixed tools: and permissions: keys", () => {
		writeAgent(
			`---
description: "Mixed Agent"
mode: subagent
tools:
  edit: allow
permissions:
  - action: edit
    resource: "*"
    effect: allow
---
# Mixed
`,
			"case-9",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-9")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("errors on malformed frontmatter without closing ---", () => {
		writeAgent(
			`---
description: "Broken Agent"
mode: subagent
tools:
  edit: allow

# No Close
`,
			"case-10",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-10")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("is idempotent: a second run skips the migrated file", () => {
		const agent = writeAgent(
			`---
description: "Idem Agent"
mode: subagent
tools:
  edit: allow
---
# Idem
`,
			"case-11",
		);

		const first = migrateV1ToV2Permissions([join(tmpDir, "case-11")]);
		expect(first.migrated).toBe(1);
		const afterFirst = readAgent(agent);

		const second = migrateV1ToV2Permissions([join(tmpDir, "case-11")]);
		expect(second.migrated).toBe(0);
		expect(second.skipped).toBe(1);
		expect(readAgent(agent)).toBe(afterFirst);
	});

	it("dry-run reports without writing", () => {
		const agent = writeAgent(
			`---
description: "Dry Agent"
mode: subagent
tools:
  edit: allow
---
# Dry
`,
			"case-12",
		);
		const before = readAgent(agent);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-12")], { dryRun: true });

		expect(result.migrated).toBe(1);
		expect(readAgent(agent)).toBe(before);
	});

	it("reports an error for an unreadable directory", () => {
		const result = migrateV1ToV2Permissions([join(tmpDir, "does-not-exist")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("Cannot read directory");
	});
});

describe("runCli", () => {
	it("returns 1 when no directories are provided", () => {
		expect(runCli([])).toBe(1);
	});

	it("returns 0 after a successful migration", () => {
		const dir = join(tmpDir, "cli-ok");
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, "agent.md"),
			`---
description: "CLI Agent"
mode: subagent
tools:
  edit: allow
---
# CLI
`,
		);

		expect(runCli([dir])).toBe(0);
	});

	it("returns 1 when a non-dry-run migration reports errors", () => {
		const dir = join(tmpDir, "cli-broken");
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "agent.md"), "# no frontmatter\n");

		expect(runCli([dir])).toBe(1);
	});
});

describe("migrateV1ToV2Permissions — output hygiene", () => {
	it("collapses consecutive duplicate rules from write/edit merge", () => {
		const agent = writeAgent(
			`---
description: "Dedupe Agent"
mode: subagent
tools:
  write: allow
  edit: allow
---
# Dedupe
`,
			"case-13",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-13")]);

		expect(result.migrated).toBe(1);
		const output = readAgent(agent);
		const occurrences = output.split("- action: edit").length - 1;
		expect(occurrences).toBe(1);
	});
});

describe("migrateV1ToV2Permissions — duplicate action+resource guard", () => {
	it("does not warn on consecutive identical merge artifacts", () => {
		writeAgent(
			`---
description: "Silent Agent"
mode: primary
tools:
  write: allow
  edit: allow
---
# Silent
`,
			"case-14",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-14")]);

		expect(result.migrated).toBe(1);
		expect(result.warnings).toEqual([]);
	});

	it("collapses non-consecutive same-effect duplicates keeping the last, with a warning", () => {
		const agent = writeAgent(
			`---
description: "Split Agent"
mode: subagent
tools:
  write: deny
  grep: allow
  patch: deny
---
# Split
`,
			"case-15",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-15")]);

		expect(result.migrated).toBe(1);
		expect(result.warnings.some((w) => w.includes("duplicate"))).toBe(true);
		const output = readAgent(agent);
		expect(output.split("- action: edit").length - 1).toBe(1);
		// Survivor keeps the last position (after grep).
		expect(output.indexOf("- action: grep")).toBeLessThan(output.indexOf("- action: edit"));
	});

	it("keeps the last occurrence on conflicting effects and warns about shadowing", () => {
		const agent = writeAgent(
			`---
description: "Shadow Agent"
mode: subagent
tools:
  write: deny
  grep: allow
  edit: allow
---
# Shadow
`,
			"case-16",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-16")]);

		expect(result.migrated).toBe(1);
		expect(result.warnings.some((w) => w.includes("shadowed"))).toBe(true);
		const output = readAgent(agent);
		expect(output.split("- action: edit").length - 1).toBe(1);
		const editBlock = output.slice(
			output.indexOf("- action: edit"),
			output.indexOf("- action: edit") + 120,
		);
		expect(editBlock).toContain("effect: allow");
	});

	it("appends subagent deny when migrating a subagent without subagent rules", () => {
		const agent = writeAgent(
			`---
description: "Chain Agent"
mode: subagent
tools:
  edit: allow
---
# Chain
`,
			"case-17",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-17")]);

		expect(result.migrated).toBe(1);
		expect(result.warnings.some((w) => w.includes("delegation"))).toBe(true);
		const output = readAgent(agent);
		const idx = output.indexOf("- action: subagent");
		expect(idx).toBeGreaterThan(-1);
		expect(output.slice(idx, idx + 120)).toContain("effect: deny");
	});

	it("does not inject subagent rules when migrating a primary", () => {
		const agent = writeAgent(
			`---
description: "Primary Agent"
mode: primary
tools:
  edit: allow
---
# Primary
`,
			"case-18",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-18")]);

		expect(result.migrated).toBe(1);
		expect(readAgent(agent)).not.toContain("- action: subagent");
	});

	it("respects an explicit subagent rule and does not inject a second one", () => {
		const agent = writeAgent(
			`---
description: "Explicit Agent"
mode: subagent
tools:
  edit: allow
  task:
    "*": allow
---
# Explicit
`,
			"case-19",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-19")]);

		expect(result.migrated).toBe(1);
		expect(readAgent(agent).split("- action: subagent").length - 1).toBe(1);
	});
});
