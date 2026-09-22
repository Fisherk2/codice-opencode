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
import { parse as yamlParse } from "yaml";
import {
	migrateV1ToV2Permissions,
	quoteScalar,
	runCli,
} from "../../../scripts/migrate-v1-to-v2-permissions";

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
		expect(output).toContain('- action: "edit"\n    resource: "*"');
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
		expect(output).toContain('- action: "shell"');
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
		expect(output).toContain('- action: "subagent"');
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
		expect(output.split('- action: "edit"').length - 1).toBe(1);
		const editBlock = output.slice(
			output.indexOf('- action: "edit"'),
			output.indexOf('- action: "edit"') + 120,
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

	it("returns 2 when a dry-run migration reports errors (fail-loud contract)", () => {
		// Contract change (documented): apply-with-errors exits 1, dry-run-with-
		// errors exits 2, clean runs exit 0. The old code returned 0 for a dry-run
		// even with errors, hiding the failure from callers scripting the codemod.
		const dir = join(tmpDir, "cli-dry-errors");
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "agent.md"), "# no frontmatter\n");

		expect(runCli([dir, "--dry-run"])).toBe(2);
	});

	it("returns 1 when a non-dry-run migration reports errors", () => {
		const dir = join(tmpDir, "cli-broken");
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "agent.md"), "# no frontmatter\n");

		expect(runCli([dir])).toBe(1);
	});

	it("returns 0 for warnings alone — only errors affect the exit code", () => {
		// write/patch/edit conflicts warn but do not error: exit stays 0.
		const dir = join(tmpDir, "cli-warn-only");
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, "agent.md"),
			`---
description: "Warn Agent"
mode: primary
tools:
  write: deny
  edit: allow
---
# Warn
`,
		);

		expect(runCli([dir])).toBe(0);
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
		const occurrences = output.split('- action: "edit"').length - 1;
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
		expect(output.split('- action: "edit"').length - 1).toBe(1);
		// Survivor keeps the last position (after grep).
		expect(output.indexOf('- action: "grep"')).toBeLessThan(output.indexOf('- action: "edit"'));
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
		expect(output.split('- action: "edit"').length - 1).toBe(1);
		const editBlock = output.slice(
			output.indexOf('- action: "edit"'),
			output.indexOf('- action: "edit"') + 120,
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
		const idx = output.indexOf('- action: "subagent"');
		expect(idx).toBeGreaterThan(-1);
		expect(output.slice(idx, idx + 120)).toContain("effect: deny");
	});

	it("emits the subagent deny brake inside the permissions list, before sibling keys", () => {
		// Reproduction contract: the legacy map is NOT the last key. With the old
		// trailing append, the brake was emitted after `hidden: true`, producing a
		// dangling sequence item (`- action:` under `hidden:`) that breaks YAML.
		// NOTE (old code): the brake was appended to `out` after the frontmatter
		// passthrough loop, so any sibling key after the legacy map corrupted it:
		//   permissions:
		//     ...
		//   hidden: true
		//     - action: subagent   <-- dangling sequence item
		const agent = writeAgent(
			`---
description: "Brake Agent"
mode: subagent
tools:
  edit: allow
hidden: true
---
# Brake
`,
			"case-20",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-20")]);

		expect(result.migrated).toBe(1);
		expect(result.errors).toEqual([]);

		// Independent verifier: the emitted frontmatter must be valid YAML.
		const output = readAgent(agent);
		const fm = output.slice(
			output.indexOf("---") + 3,
			output.indexOf("---", output.indexOf("---") + 3),
		);
		const parsed = yamlParse(fm) as {
			permissions: Array<{ action: string; resource: string; effect: string }>;
			hidden: boolean;
		};
		expect(Array.isArray(parsed.permissions)).toBe(true);
		expect(parsed.hidden).toBe(true);

		// The deny brake must sit between the last permissions: entry and the
		// next sibling key, i.e. be the list's last element.
		const brakeIdx = output.indexOf('- action: "subagent"');
		const hiddenIdx = output.indexOf("hidden: true");
		expect(brakeIdx).toBeGreaterThan(-1);
		expect(brakeIdx).toBeLessThan(hiddenIdx);
		// No subagent rule after the sibling key.
		expect(output.slice(hiddenIdx)).not.toContain('- action: "subagent"');
	});

	it("quotes unquoted-safe scalars and round-trips embedded quotes and backslashes", () => {
		// Action '*' unquoted is a YAML alias (`- action: *` parse error), so the
		// emitter must quote action scalars exactly like resource scalars.
		const agent = writeAgent(
			`---
description: "Star Agent"
mode: subagent
tools:
  "*": ask
---
# Star
`,
			"case-21",
		);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-21")]);

		expect(result.migrated).toBe(1);
		expect(result.errors).toEqual([]);
		const output = readAgent(agent);

		// Independent verifier: emitted frontmatter must be valid YAML whose
		// action field round-trips to the literal string "*".
		const fm = output.slice(
			output.indexOf("---") + 3,
			output.indexOf("---", output.indexOf("---") + 3),
		);
		const parsed = yamlParse(fm) as {
			permissions: Array<{ action: string; resource: string; effect: string }>;
		};
		// mode:subagent without a subagent rule also gets the deny brake,
		// so the list carries the star rule plus the brake.
		const starRule = parsed.permissions.find((p) => p.action === "*");
		expect(starRule).toBeDefined();
		expect(starRule?.effect).toBe("ask");
	});

	it("rejects a malformed nested effect mapping with an error and no write", () => {
		// `{"deny: pwn": allow}` — the naive colon-splitter mangles the quoted key
		// into effect `pwn": allow`, which the old code emitted RAW, producing a
		// malformed mapping. The validator must reject it loud, before emission.
		const agent = writeAgent(
			`---
description: "Pwn Agent"
mode: subagent
permission:
  bash:
    "deny: pwn": allow
---
# Pwn
`,
			"case-22",
		);
		const before = readAgent(agent);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-22")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBe(1);
		expect(result.errors[0]).toContain("invalid effect");
		expect(readAgent(agent)).toBe(before); // file untouched
	});

	it("rejects a control byte in a resource scalar", () => {
		// \u0007 (bell) in a resource: forbidden control byte, must fail loud.
		const agent = writeAgent(
			`---
description: "Bell Agent"
mode: subagent
permission:
  bash:
    "bell\u0007cmd": allow
---
# Bell
`,
			"case-23",
		);
		const before = readAgent(agent);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-23")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBe(1);
		expect(result.errors[0]).toContain("control");
		expect(readAgent(agent)).toBe(before); // file untouched
	});

	it("rejects an effect outside allow/ask/deny", () => {
		const agent = writeAgent(
			`---
description: "Bad Effect Agent"
mode: subagent
tools:
  edit: maybe
---
# Bad Effect
`,
			"case-24",
		);
		const before = readAgent(agent);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-24")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBe(1);
		expect(result.errors[0]).toContain("maybe");
		expect(readAgent(agent)).toBe(before); // file untouched
	});

	it("escapes embedded quotes and backslashes so yaml.parse round-trips them", () => {
		// quoteScalar escaping contract: 'a"b\\c' must survive the emitted YAML
		// and parse back to the original string.
		const tricky = 'a"b\\c';
		const emitted = `resource: ${quoteScalar(tricky)}`;
		const parsed = yamlParse(emitted) as { resource: string };
		expect(parsed.resource).toBe(tricky);
	});

	it("fails loud instead of silently truncating frontmatter nested deeper than 3 levels", () => {
		// parseBlock parses nesting RECURSIVELY, but the passthrough emitter only
		// dumps 3 levels (node.rawLine, child.rawLine, grand.rawLine). With the old
		// code the file below migrated "successfully" while the 4th/5th level was
		// silently dropped from the written output:
		//   request:
		//     headers:            <- emitted
		//       X-Custom:         <- emitted
		//         nested:         <- DROPPED (silent corruption)
		//           deepest: v    <- DROPPED
		const agent = writeAgent(
			`---
description: "Deep Agent"
mode: subagent
request:
  headers:
    X-Custom:
      nested:
        deepest: value
tools:
  edit: allow
---
# Deep
`,
			"case-25",
		);
		const before = readAgent(agent);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-25")]);

		expect(result.migrated).toBe(0);
		expect(result.errors.length).toBe(1);
		expect(result.errors[0]).toContain("nests deeper than 3 levels");
		expect(readAgent(agent)).toBe(before); // no write on fail-loud
	});

	it("preserves every non-target byte: body, comments, fences and untouched keys", () => {
		const agent = writeAgent(
			`---
description: "Golden Agent"
mode: subagent
color: "#ff0000"
tools:
  edit: allow
  bash:
    "git status *": allow
---
# Golden Agent

Multi-paragraph body with **bold**, \`inline code\` and a note that a
migrator must not touch a single byte of this text.

<!-- an HTML comment line -->

\`\`\`bash
echo "fenced code block"
echo 'with single quotes'
\`\`\`

- list item one
  - nested list item
- list item two

Trailing paragraph with a URL: https://example.com/path?query=1&x=2
`,
			"case-26",
		);
		const before = readAgent(agent);

		const result = migrateV1ToV2Permissions([join(tmpDir, "case-26")]);

		expect(result.migrated).toBe(1);
		expect(result.errors).toEqual([]);

		const output = readAgent(agent);
		// The body (everything from the first "# Golden Agent" heading after the
		// closing ---) must be byte-identical.
		const closeMarker = "---\n# Golden Agent";
		const beforeBody = before.slice(before.indexOf(closeMarker) + 4);
		const afterBody = output.slice(output.indexOf(closeMarker) + 4);
		expect(afterBody).toBe(beforeBody);
		// Untouched frontmatter keys pass through verbatim.
		expect(output).toContain('description: "Golden Agent"');
		expect(output).toContain('color: "#ff0000"');
		// And the whole file must still be valid YAML frontmatter.
		const fm = output.slice(4, output.indexOf("\n---", 4));
		const parsed = yamlParse(fm) as {
			description: string;
			color: string;
			permissions: unknown[];
		};
		expect(parsed.description).toBe("Golden Agent");
		expect(parsed.color).toBe("#ff0000");
		expect(Array.isArray(parsed.permissions)).toBe(true);
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
		expect(readAgent(agent)).not.toContain('- action: "subagent"');
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
		expect(readAgent(agent).split('- action: "subagent"').length - 1).toBe(1);
	});
});
