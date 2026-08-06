// ---------------------------------------------------------------------------
// Integration tests for tool.execute.before hook behavior
//
// Tests the destructive command blocking (normalizeBash + DESTRUCTIVE_PATTERNS)
// and subagent name validation that power the tool.execute.before hook.
//
// Subagent validation no longer uses a hardcoded VALID_SUBAGENTS set — since
// FEV-20, names are derived at runtime by discoverValidSubagents() scanning
// the user's `agents/` directory (ADR-013: Auto-Discovery). The 6 primary
// agents (PRIMARY_AGENTS) are always valid. This test mimics the discovered
// set with DISCOVERED_SUBAGENTS below.
//
// The hook itself lives inside SddPipelinePlugin (requires @opencode-ai/plugin),
// so we test the pure functions and maps independently.
// ---------------------------------------------------------------------------

import { describe, expect, test } from "bun:test";
import {
	DESTRUCTIVE_PATTERNS,
	PRIMARY_AGENTS,
} from "../../../template/obligatorio/core/.opencode/plugins/src/defaults";

// ---------------------------------------------------------------------------
// Import pure functions (no longer replicated — extracted to module)
// ---------------------------------------------------------------------------

import { normalizeBash } from "../../../template/obligatorio/core/.opencode/plugins/src/normalizeBash";

/** Returns true if the command matches any destructive pattern after normalization. */
function isDestructive(cmd: string): boolean {
	const normalized = normalizeBash(cmd);
	return DESTRUCTIVE_PATTERNS.some((p) => p.test(normalized));
}

/** Mimics auto-discovery: PRIMARY_AGENTS + a representative sample of subagents from agents/. */
const DISCOVERED_SUBAGENTS = new Set([
	"test-engineer",
	"docs-writer",
	"code-reviewer",
	"backend-developer",
	"typescript-pro",
]);

/**
 * Returns true if the subagent name is valid (case-insensitive check).
 *
 * Mirrors sdd-pipeline.ts: the discovered set (from discoverValidSubagents)
 * is used when non-empty, falling back to the 6 PRIMARY_AGENTS. Primary
 * agents are always valid even without a corresponding `agents/` file.
 */
function isValidSubagent(name: string): boolean {
	const normalized = name.toLowerCase();
	return PRIMARY_AGENTS.includes(normalized) || DISCOVERED_SUBAGENTS.has(normalized);
}

// ---------------------------------------------------------------------------
// Tests: normalizeBash
// ---------------------------------------------------------------------------

describe("tool.execute.before — normalizeBash helper", () => {
	test("removes comments (# to end of line)", () => {
		expect(normalizeBash("rm -rf / # dangerous")).toBe("rm -rf /");
	});

	test("replaces newline characters with space (prevents token merging)", () => {
		// normalizeBash replaces \n with space, so tokens stay separate
		expect(normalizeBash("ls\n-la\n/")).toBe("ls -la /");
	});

	test("collapses multiple spaces", () => {
		expect(normalizeBash("rm   -rf   /")).toBe("rm -rf /");
	});

	test("trims leading and trailing whitespace", () => {
		expect(normalizeBash("  rm -rf /  ")).toBe("rm -rf /");
	});

	test("comment-only command becomes empty string", () => {
		expect(normalizeBash("# just a comment")).toBe("");
	});

	test("empty string stays empty", () => {
		expect(normalizeBash("")).toBe("");
	});

	test("safe command is unchanged after normalization", () => {
		expect(normalizeBash("ls -la")).toBe("ls -la");
	});
});

// ---------------------------------------------------------------------------
// Tests: destructive command blocking
// ---------------------------------------------------------------------------

describe("tool.execute.before — destructive command blocking", () => {
	test("Scenario 1: rm -rf / is blocked", () => {
		expect(isDestructive("rm -rf /")).toBe(true);
	});

	test("rm -rf / with comments stripped", () => {
		expect(isDestructive("rm -rf / # dangerous command")).toBe(true);
	});

	test("rm -rf with additional flags (rm -fir)", () => {
		expect(isDestructive("rm -fir /")).toBe(true);
	});

	test("Scenario 2: ls -la passes through", () => {
		expect(isDestructive("ls -la")).toBe(false);
	});

	test("Scenario 3: rm -r -f (split flags) — known gap, not blocked by current patterns", () => {
		// Current DESTRUCTIVE_PATTERNS require r and f in the same flag group (-rf),
		// so split flags like -r -f are NOT matched. This is a known detection gap.
		expect(isDestructive("rm -r -f /")).toBe(false);
	});

	test("rm -f -r (reversed split flags) — known gap, not blocked", () => {
		// Similarly, -f -r split across two flag groups is not matched.
		expect(isDestructive("rm -f -r /")).toBe(false);
	});

	test("Scenario 4: commented rm -rf passes through (comments stripped)", () => {
		// normalizeBash strips comments, so "# rm -rf /" becomes ""
		expect(isDestructive("# rm -rf /")).toBe(false);
	});

	test("commented destructive command with surrounding text", () => {
		expect(isDestructive("echo safe # rm -rf /")).toBe(false);
	});

	// ─── Newline bypass fix ──────────────────────────────────

	test("rm -rf / with newline instead of space IS blocked (newlines replaced)", () => {
		// Previously, normalizeBash stripped \n without replacement, allowing
		// "rm\n-rf\n/" to become "rm-rf/" (bypassing the destructive pattern).
		// Now \n is replaced with space, so "rm\n-rf\n/" → "rm -rf /" → blocked.
		expect(isDestructive("rm\n-rf\n/")).toBe(true);
	});

	test("split across multiple newlines is also blocked", () => {
		expect(isDestructive("rm\n-rf\n--no-preserve-root\n/")).toBe(true);
	});

	// ─── Git destructive patterns ─────────────────────────────

	test("git push --force is blocked", () => {
		expect(isDestructive("git push --force")).toBe(true);
	});

	test("git push -f is blocked", () => {
		expect(isDestructive("git push -f")).toBe(true);
	});

	test("git reset --hard is blocked", () => {
		expect(isDestructive("git reset --hard")).toBe(true);
	});

	test("git clean -fd is blocked", () => {
		expect(isDestructive("git clean -fd")).toBe(true);
	});

	test("git branch -D is blocked", () => {
		expect(isDestructive("git branch -D main")).toBe(true);
	});

	test("git stash drop is blocked", () => {
		expect(isDestructive("git stash drop")).toBe(true);
	});

	test("git stash clear is blocked", () => {
		expect(isDestructive("git stash clear")).toBe(true);
	});

	// "The 'safe' git commands pass through
	test("git push (without force) passes through", () => {
		expect(isDestructive("git push origin main")).toBe(false);
	});

	test("git status passes through", () => {
		expect(isDestructive("git status")).toBe(false);
	});

	test("git diff passes through", () => {
		expect(isDestructive("git diff")).toBe(false);
	});

	// ─── SQL destructive patterns ─────────────────────────────

	test("DROP TABLE is blocked", () => {
		expect(isDestructive("DROP TABLE users")).toBe(true);
	});

	test("DROP DATABASE is blocked", () => {
		expect(isDestructive("DROP DATABASE production")).toBe(true);
	});

	test("DROP SCHEMA is blocked", () => {
		expect(isDestructive("DROP SCHEMA public")).toBe(true);
	});

	test("TRUNCATE TABLE is blocked", () => {
		expect(isDestructive("TRUNCATE TABLE users")).toBe(true);
	});

	test("DELETE FROM without WHERE is blocked", () => {
		expect(isDestructive("DELETE FROM users")).toBe(true);
	});

	test("DELETE FROM with WHERE clause passes through", () => {
		// The pattern /delete\s+from\s+\w+\s*;?\s*$/i matches when no WHERE clause
		// This test verifies the pattern does NOT match when WHERE is present
		expect(isDestructive("DELETE FROM users WHERE id = 1")).toBe(false);
	});

	// ─── Docker destructive patterns ──────────────────────────

	test("docker rm -f is blocked", () => {
		expect(isDestructive("docker rm -f container_name")).toBe(true);
	});

	test("docker system prune -a is blocked", () => {
		expect(isDestructive("docker system prune -a")).toBe(true);
	});

	test("docker volume prune is blocked", () => {
		expect(isDestructive("docker volume prune")).toBe(true);
	});

	// ─── Permission destructive patterns ──────────────────────

	test("chmod 777 is blocked", () => {
		expect(isDestructive("chmod 777 /some/file")).toBe(true);
	});

	test("chown -R is blocked", () => {
		expect(isDestructive("chown -R user:group /dir")).toBe(true);
	});

	// ─── Process destructive patterns ─────────────────────────

	test("kill -9 0 (all processes) is blocked", () => {
		expect(isDestructive("kill -9 0")).toBe(true);
	});

	test("shutdown is blocked", () => {
		expect(isDestructive("shutdown -h now")).toBe(true);
	});

	// ─── Package Manager destructive patterns ─────────────────

	test("npm publish is blocked", () => {
		expect(isDestructive("npm publish")).toBe(true);
	});

	test("apt remove is blocked", () => {
		expect(isDestructive("apt remove package-name")).toBe(true);
	});

	// ─── Disk destructive patterns ────────────────────────────

	test("mkfs is blocked", () => {
		expect(isDestructive("mkfs.ext4 /dev/sda1")).toBe(true);
	});

	test("dd if= is blocked", () => {
		expect(isDestructive("dd if=/dev/zero of=/dev/sda")).toBe(true);
	});

	test("terraform destroy -auto-approve is blocked", () => {
		expect(isDestructive("terraform destroy -auto-approve")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Tests: subagent name validation
// ---------------------------------------------------------------------------

describe("tool.execute.before — subagent name validation", () => {
	test("Scenario 5: 'tlaloc' (valid primary agent) passes", () => {
		expect(isValidSubagent("tlaloc")).toBe(true);
	});

	test("all valid primary agents pass", () => {
		expect(isValidSubagent("huitzilopochtli")).toBe(true);
		expect(isValidSubagent("quetzalcoatl")).toBe(true);
		expect(isValidSubagent("moctezuma")).toBe(true);
		expect(isValidSubagent("tlaloc")).toBe(true);
		expect(isValidSubagent("mictlantecuhtli")).toBe(true);
		expect(isValidSubagent("tezcatlipoca")).toBe(true);
	});

	test("valid subagent 'test-engineer' passes", () => {
		expect(isValidSubagent("test-engineer")).toBe(true);
	});

	test("valid subagent 'docs-writer' passes", () => {
		expect(isValidSubagent("docs-writer")).toBe(true);
	});

	test("valid subagent 'code-reviewer' passes", () => {
		expect(isValidSubagent("code-reviewer")).toBe(true);
	});

	test("Scenario 6: 'fake-agent' (invented name) is blocked", () => {
		expect(isValidSubagent("fake-agent")).toBe(false);
	});

	test("empty string is blocked", () => {
		expect(isValidSubagent("")).toBe(false);
	});

	test("non-existent subagent is blocked", () => {
		expect(isValidSubagent("nonexistent-agent")).toBe(false);
	});

	test("Scenario 7: 'TLALOC' (uppercase) passes (case-insensitive)", () => {
		expect(isValidSubagent("TLALOC")).toBe(true);
	});

	test("'Quetzalcoatl' (title case) passes (case-insensitive)", () => {
		expect(isValidSubagent("Quetzalcoatl")).toBe(true);
	});

	test("'TEST-ENGINEER' (uppercase with hyphen) passes (case-insensitive)", () => {
		expect(isValidSubagent("TEST-ENGINEER")).toBe(true);
	});

	test("'Mictlantecuhtli' (mixed case) passes", () => {
		expect(isValidSubagent("Mictlantecuhtli")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Tests: DESTRUCTIVE_PATTERNS exported correctly from defaults
// ---------------------------------------------------------------------------

describe("tool.execute.before — DESTRUCTIVE_PATTERNS export integrity", () => {
	test("DESTRUCTIVE_PATTERNS is a non-empty array", () => {
		expect(DESTRUCTIVE_PATTERNS.length).toBeGreaterThan(0);
	});

	test("all elements are RegExp instances", () => {
		for (const p of DESTRUCTIVE_PATTERNS) {
			expect(p).toBeInstanceOf(RegExp);
		}
	});
});
