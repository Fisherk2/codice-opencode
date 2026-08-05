import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { distribute, parseMapping } from "../../../scripts/distribute-agents";

/**
 * Unit tests for the FEV-18 Phase 2 batch distribution logic.
 * Verifies mapping parsing and per-pack distribution (legacy copy + new reformat).
 */
describe("distributeAgents", () => {
	let tmpDir: string;

	beforeAll(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "distribute-agents-"));
	});

	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	const mappingSample = `# Audit

## Pack: \`software-development\`

| Source | Agent | Format |
|--------|-------|--------|
| new | \`api-platform-engineer\` | v2.0 |
| legacy | \`backend-developer\` | v1.x |

## Pack: \`finance\`

| Source | Agent | Format |
|--------|-------|--------|
| new | \`payments-billing-engineer\` | v2.0 |
`;

	it("parses the pack-assignment markdown into per-pack entries", () => {
		const mappingPath = join(tmpDir, "mapping.md");
		writeFileSync(mappingPath, mappingSample);

		const entries = parseMapping(mappingPath);

		expect(entries).toHaveLength(3);
		expect(entries[0]).toEqual({
			agent: "api-platform-engineer",
			source: "new",
			pack: "software-development",
		});
		expect(entries[1]).toEqual({
			agent: "backend-developer",
			source: "legacy",
			pack: "software-development",
		});
		expect(entries[2]).toEqual({
			agent: "payments-billing-engineer",
			source: "new",
			pack: "finance",
		});
	});

	it("skips non-table rows and the summary section", () => {
		const mappingPath = join(tmpDir, "mapping-2.md");
		writeFileSync(
			mappingPath,
			`# Header

## 1. Pack Summary

| Pack | Total |
|------|-------|
| \`software-development\` | 2 |

## Pack: \`creative\`

| Source | Agent | Format |
|--------|-------|--------|
| new | \`ui-designer\` | v2.0 |
`,
		);

		const entries = parseMapping(mappingPath);

		expect(entries).toHaveLength(1);
		expect(entries[0]).toEqual({ agent: "ui-designer", source: "new", pack: "creative" });
	});

	it("distributes legacy agents by copying (v1.x format preserved)", () => {
		const srcDir = join(tmpDir, "sin-clasificar");
		const packsDir = join(tmpDir, "packs");
		const legacyDir = join(packsDir, "software-development");
		mkdirSync(srcDir, { recursive: true });
		mkdirSync(legacyDir, { recursive: true });
		writeFileSync(join(srcDir, "backend-developer.md"), "---\nlegacy v1.x content\n---\n");

		const result = distribute(
			[{ agent: "backend-developer", source: "legacy", pack: "software-development" }],
			srcDir,
			packsDir,
			() => ({ ok: true }),
		);

		expect(result.ok).toBe(true);
		const written = readFileSyncSafe(join(legacyDir, "backend-developer.md"));
		expect(written).toContain("legacy v1.x content");
		// v1.x content must NOT be reformatted
		expect(written).not.toContain("mode: subagent");
	});

	it("returns error listing for missing legacy source files", () => {
		const packsDir = join(tmpDir, "packs-2");
		mkdirSync(join(packsDir, "creative"), { recursive: true });

		const result = distribute(
			[{ agent: "missing-agent", source: "legacy", pack: "creative" }],
			join(tmpDir, "no-sin-clasificar"),
			packsDir,
			() => ({ ok: true }),
		);

		expect(result.ok).toBe(false);
		expect(result.errors.join(" ")).toContain("missing-agent");
	});
});

/** Read a file or return empty string if missing. */
function readFileSyncSafe(path: string): string {
	try {
		return readFileSync(path, "utf-8");
	} catch {
		return "";
	}
}
