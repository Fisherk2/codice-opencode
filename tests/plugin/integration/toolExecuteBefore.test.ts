import { describe, expect, test } from "bun:test";
import { DESTRUCTIVE_PATTERNS } from "../../../template/obligatorio/core/.opencode/plugins/src/destructivePatterns";
import { normalizeBash } from "../../../template/obligatorio/core/.opencode/plugins/src/normalizeBash";

/** Returns true if the command matches any destructive pattern after normalization. */
function isDestructive(cmd: string): boolean {
	const normalized = normalizeBash(cmd);
	return DESTRUCTIVE_PATTERNS.some((p) => p.test(normalized));
}

describe("destructive command blocking", () => {
	// ─── normalizeBash helper ──────────────────────────────

	test("removes comments (# to end of line)", () => {
		expect(normalizeBash("rm -rf / # dangerous")).toBe("rm -rf /");
	});

	test("replaces newline characters with space", () => {
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

	// ─── Filesystem destructive patterns ───────────────────

	test("blocks rm -rf", () => {
		expect(isDestructive("rm -rf /tmp/mydir")).toBe(true);
	});

	test("rm -rf with comments stripped", () => {
		expect(isDestructive("rm -rf / # dangerous command")).toBe(true);
	});

	test("rm -rf with additional flags (rm -fir)", () => {
		expect(isDestructive("rm -fir /")).toBe(true);
	});

	test("rm -r -f (split flags) is a known gap", () => {
		expect(isDestructive("rm -r -f /")).toBe(false);
	});

	test("allows safe rm", () => {
		expect(isDestructive("rm file.txt")).toBe(false);
	});

	test("blocks shred", () => {
		expect(isDestructive("shred -vfz /tmp/secret.txt")).toBe(true);
	});

	test("blocks find -exec rm", () => {
		expect(isDestructive("find . -name '*.bak' -exec rm {} \\;")).toBe(true);
	});

	test("blocks find -delete", () => {
		expect(isDestructive("find . -delete")).toBe(true);
	});

	// ─── Git destructive patterns ──────────────────────────

	test("blocks git push --force", () => {
		expect(isDestructive("git push --force origin main")).toBe(true);
	});

	test("blocks git push -f", () => {
		expect(isDestructive("git push -f")).toBe(true);
	});

	test("blocks git reset --hard", () => {
		expect(isDestructive("git reset --hard HEAD~1")).toBe(true);
	});

	test("blocks git clean -fd", () => {
		expect(isDestructive("git clean -fd")).toBe(true);
	});

	test("blocks git filter-repo", () => {
		expect(isDestructive("git filter-repo --force")).toBe(true);
	});

	test("blocks git branch -D", () => {
		expect(isDestructive("git branch -D main")).toBe(true);
	});

	test("blocks git stash drop", () => {
		expect(isDestructive("git stash drop")).toBe(true);
	});

	test("blocks git stash clear", () => {
		expect(isDestructive("git stash clear")).toBe(true);
	});

	test("allows git push without force", () => {
		expect(isDestructive("git push origin main")).toBe(false);
	});

	test("allows git status", () => {
		expect(isDestructive("git status")).toBe(false);
	});

	// ─── SQL destructive patterns ──────────────────────────

	test("blocks DROP TABLE", () => {
		expect(isDestructive("psql -c 'DROP TABLE users'")).toBe(true);
	});

	test("blocks DROP DATABASE", () => {
		expect(isDestructive("DROP DATABASE production")).toBe(true);
	});

	test("blocks DROP SCHEMA", () => {
		expect(isDestructive("DROP SCHEMA public")).toBe(true);
	});

	test("blocks TRUNCATE TABLE", () => {
		expect(isDestructive("TRUNCATE TABLE users")).toBe(true);
	});

	test("blocks DELETE FROM without WHERE", () => {
		expect(isDestructive("DELETE FROM users")).toBe(true);
	});

	test("allows DELETE FROM with WHERE clause", () => {
		expect(isDestructive("DELETE FROM users WHERE id = 1")).toBe(false);
	});

	// ─── Docker destructive patterns ───────────────────────

	test("blocks docker rm -f", () => {
		expect(isDestructive("docker rm -f container_name")).toBe(true);
	});

	test("blocks docker system prune -a", () => {
		expect(isDestructive("docker system prune -a")).toBe(true);
	});

	test("blocks docker volume prune", () => {
		expect(isDestructive("docker volume prune")).toBe(true);
	});

	// ─── Permission destructive patterns ───────────────────

	test("blocks chmod 777", () => {
		expect(isDestructive("chmod 777 /some/file")).toBe(true);
	});

	test("blocks chown -R", () => {
		expect(isDestructive("chown -R user:group /dir")).toBe(true);
	});

	// ─── Process destructive patterns ──────────────────────

	test("blocks kill -9 0 (all processes)", () => {
		expect(isDestructive("kill -9 0")).toBe(true);
	});

	test("blocks shutdown", () => {
		expect(isDestructive("shutdown -h now")).toBe(true);
	});

	// ─── Package Manager destructive patterns ──────────────

	test("blocks npm publish", () => {
		expect(isDestructive("npm publish")).toBe(true);
	});

	test("blocks apt remove", () => {
		expect(isDestructive("apt remove package-name")).toBe(true);
	});

	// ─── Disk destructive patterns ─────────────────────────

	test("blocks mkfs", () => {
		expect(isDestructive("mkfs.ext4 /dev/sda1")).toBe(true);
	});

	test("blocks dd if=", () => {
		expect(isDestructive("dd if=/dev/zero of=/dev/sda")).toBe(true);
	});

	test("blocks terraform destroy -auto-approve", () => {
		expect(isDestructive("terraform destroy -auto-approve")).toBe(true);
	});

	// ─── Kubernetes destructive patterns ───────────────────

	test("blocks kubectl delete --all", () => {
		expect(isDestructive("kubectl delete pods --all")).toBe(true);
	});

	test("blocks kubectl drain", () => {
		expect(isDestructive("kubectl drain node-1")).toBe(true);
	});

	// ─── Normalization edge cases ──────────────────────────

	test("normalizes whitespace before matching", () => {
		expect(isDestructive("  rm  -rf  /tmp  ")).toBe(true);
	});

	test("normalizes comments before matching", () => {
		expect(isDestructive("# this is a comment\nrm -rf /tmp")).toBe(true);
	});

	test("rm -rf with newline instead of space IS blocked", () => {
		expect(isDestructive("rm\n-rf\n/")).toBe(true);
	});

	test("split across multiple newlines is also blocked", () => {
		expect(isDestructive("rm\n-rf\n--no-preserve-root\n/")).toBe(true);
	});

	test("allows safe cat", () => {
		expect(isDestructive("cat README.md")).toBe(false);
	});

	test("allows ls", () => {
		expect(isDestructive("ls -la")).toBe(false);
	});
});
