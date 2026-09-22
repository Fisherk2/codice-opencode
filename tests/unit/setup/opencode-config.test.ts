/**
 * opencode.json — Schema and security deny-pattern validation (OpenCode V2)
 *
 * Verifies that the generated opencode.json template (OpenCode V2):
 * 1. Is valid JSON
 * 2. Uses native V2 top-level keys (`agents`, `permissions`, `mcp.servers`)
 * 3. Contains no legacy V1 keys (`agent`, `permission`, `disable`, top-level `temperature`)
 * 4. Contains proper deny rules for sensitive credential files
 *    in both the `shell` and `read` permission actions
 *
 * V2 semantics: `permissions` is an ordered rule list; the LAST matching
 * rule wins, so assertions resolve the last match for (action, resource).
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const OPENCODE_CONFIG_PATH = path.resolve(
	import.meta.dir,
	"../../../template/obligatorio/core/opencode.json",
);

interface PermissionRule {
	action: string;
	resource: string;
	effect: string;
}

interface AgentEntry {
	model?: string;
	color?: string;
	steps?: number;
	disabled?: boolean;
	request?: { body?: { temperature?: number } };
	temperature?: number;
	disable?: boolean;
}

interface OpenCodeConfig {
	$schema?: string;
	agents?: Record<string, AgentEntry>;
	permissions?: PermissionRule[];
	mcp?: { servers?: Record<string, unknown> };
	// Legacy V1 keys — must be absent
	agent?: unknown;
	permission?: unknown;
}

function loadConfig(): OpenCodeConfig {
	const content = fs.readFileSync(OPENCODE_CONFIG_PATH, "utf-8");
	return JSON.parse(content) as OpenCodeConfig;
}

function rulesFor(action: string): PermissionRule[] {
	return (loadConfig().permissions ?? []).filter((r) => r.action === action);
}

/** Resolves the effective V2 outcome: last matching rule wins. */
function lastEffect(action: string, resource: string): string | undefined {
	const matches = rulesFor(action).filter((r) => r.resource === resource);
	return matches.length > 0 ? matches[matches.length - 1]?.effect : undefined;
}

describe("opencode.json — Config Schema (V2)", () => {
	test("exists and is valid JSON", () => {
		expect(fs.existsSync(OPENCODE_CONFIG_PATH)).toBe(true);
		const content = fs.readFileSync(OPENCODE_CONFIG_PATH, "utf-8");
		expect(() => JSON.parse(content)).not.toThrow();
	});

	test("has required V2 top-level keys", () => {
		const config = loadConfig();
		expect(config).toHaveProperty("$schema");
		expect(config).toHaveProperty("agents");
		expect(config).toHaveProperty("permissions");
		expect(config).toHaveProperty("mcp");
		expect(config.mcp).toHaveProperty("servers");
	});

	test("has no legacy V1 top-level keys", () => {
		const config = loadConfig();
		expect(config).not.toHaveProperty("agent");
		expect(config).not.toHaveProperty("permission");
	});

	test("primary agents carry temperature under request.body", () => {
		const agents = loadConfig().agents ?? {};
		for (const name of [
			"huitzilopochtli",
			"quetzalcoatl",
			"moctezuma",
			"tlaloc",
			"mictlantecuhtli",
			"tezcatlipoca",
		]) {
			const entry = agents[name];
			expect(entry).toBeDefined();
			expect(entry?.request?.body?.temperature).toBeNumber();
			expect(entry).not.toHaveProperty("temperature");
			expect(entry).not.toHaveProperty("disable");
		}
	});

	test("builtin agents use disabled instead of disable", () => {
		const agents = loadConfig().agents ?? {};
		for (const name of ["build", "plan", "explore", "general"]) {
			expect(agents[name]?.disabled).toBe(true);
			expect(agents[name]).not.toHaveProperty("disable");
		}
	});

	test("asks subagent delegation globally (per-agent rules refine)", () => {
		// Empirical Fase-2 finding: a global `deny` on `subagent` acts as an
		// absolute kill-switch — the delegation tool is not exposed even when a
		// primary's frontmatter allows it. `ask` keeps delegation operable while
		// per-agent frontmatter (appended last) decides allow/deny per agent.
		// Official merge order: global rules first, agent rules last
		// (https://opencode.ai/v2/docs/permissions/).
		expect(lastEffect("subagent", "*")).toBe("ask");
	});

	test("mcp servers use disabled instead of enabled", () => {
		const servers = loadConfig().mcp?.servers ?? {};
		expect(Object.keys(servers).length).toBeGreaterThan(0);
		for (const [name, server] of Object.entries(servers)) {
			const entry = server as Record<string, unknown>;
			expect(entry, `server ${name}`).not.toHaveProperty("enabled");
			if ("disabled" in entry) {
				expect(typeof entry.disabled).toBe("boolean");
			}
		}
	});
});

describe("opencode.json — Shell Permission Deny Rules (V2)", () => {
	const REQUIRED_SHELL_DENY = [
		"* .env",
		"* .env.*",
		"* ./.env",
		"* ./.env.*",
		"* .npmrc",
		"* .pem",
		"* .key",
		"* .p12",
		"* .pfx",
		"* credentials.json",
		"* service-account*.json",
		"* .ssh/id_*",
		"* .ssh/config",
		"* .aws/credentials",
		"* .kube/config",
		"* .netrc",
		"* .pgpass",
		"* .git-credentials",
		"* .docker/config.json",
		"* .gpg",
		"* .ovpn",
	];

	const REQUIRED_SHELL_DENY_INTERMEDIATE = [
		"* .npmrc *",
		"* .pem *",
		"* .key *",
		"* .p12 *",
		"* .pfx *",
		"* credentials.json *",
		"* service-account*.json *",
		"* .netrc *",
		"* .pgpass *",
		"* .git-credentials *",
		"* .gpg *",
		"* .ovpn *",
	];

	test("has shell permission rules", () => {
		expect(rulesFor("shell").length).toBeGreaterThan(0);
	});

	test("has all simple deny rules for credential files", () => {
		for (const pattern of REQUIRED_SHELL_DENY) {
			expect(lastEffect("shell", pattern)).toBe("deny");
		}
	});

	test("has all intermediate deny rules for credential files", () => {
		for (const pattern of REQUIRED_SHELL_DENY_INTERMEDIATE) {
			expect(lastEffect("shell", pattern)).toBe("deny");
		}
	});

	test("allows reading .env.example", () => {
		expect(lastEffect("shell", "* .env.example")).toBe("allow");
		expect(lastEffect("shell", "* ./.env.example")).toBe("allow");
	});
});

describe("opencode.json — Read Permission Deny Rules (V2)", () => {
	const REQUIRED_READ_DENY = [
		"*.env",
		"*.env.*",
		".npmrc",
		"*.pem",
		"*.key",
		"*.p12",
		"*.pfx",
		"credentials.json",
		"service-account*.json",
		".ssh/id_*",
		".ssh/config",
		".aws/credentials",
		".kube/config",
		".netrc",
		".pgpass",
		".git-credentials",
		".docker/config.json",
		"*.gpg",
		"*.ovpn",
	];

	test("has read permission rules", () => {
		expect(rulesFor("read").length).toBeGreaterThan(0);
	});

	test("has all deny rules for credential files", () => {
		for (const pattern of REQUIRED_READ_DENY) {
			expect(lastEffect("read", pattern)).toBe("deny");
		}
	});

	test("allows reading .env.example in read action", () => {
		expect(lastEffect("read", "*.env.example")).toBe("allow");
	});
});

describe("opencode.json — Permission Bypass Hardening (post-SDD-removal)", () => {
	// The retired SDD plugin normalized bash commands and blocked exec-chaining
	// at runtime; the static permission list is now the only defense. Commands
	// that can chain execution (`find -execdir`, `xargs sh -c`, `curl | sh`) or
	// write arbitrary files via redirection (`echo x >> ~/.ssh/authorized_keys`,
	// `awk 'print > "path"'`) must never sit in `allow` — redirection cannot be
	// covered by deny wildcards, so the only structural fix is `ask`.
	const EXEC_CAPABLE_SHELL_COMMANDS = [
		"find *",
		"echo",
		"echo *",
		"printf *",
		"awk *",
		"sed *",
		"xargs *",
		"curl *",
		"http *", // httpie — same fetch-and-pipe risk class as curl
	];

	const REQUIRED_SHELL_HARDENING_DENIES = [
		"find * -exec *",
		"find * -execdir *",
		"xargs sh *",
		"xargs bash *",
		"xargs chmod *",
		"xargs curl *",
		"rm -fir *",
		"rm --force --recursive *",
		"rm --recursive --force *",
		"rm * --force --recursive *",
		"rm * --recursive --force *",
	];

	// Space-less / tilde / relative-path variants the space-anchored denies
	// (`* .ssh/id_*`) cannot match.
	const REQUIRED_SHELL_SECRET_READ_DENIES = ["*.env", "*.ssh/id_*", "*aws/credentials"];

	const REQUIRED_READ_HARDENING_DENIES = [
		"*id_rsa*",
		"*id_ed25519*",
		"*id_ecdsa*",
		"*.envrc*",
		"**/.npmrc",
		"credentials.json*",
	];

	test("exec-capable shell commands are gated to ask, not allowed", () => {
		for (const resource of EXEC_CAPABLE_SHELL_COMMANDS) {
			expect(lastEffect("shell", resource), resource).toBe("ask");
		}
	});

	test("denies exec-chaining via find/xargs as defense in depth", () => {
		for (const pattern of REQUIRED_SHELL_HARDENING_DENIES) {
			expect(lastEffect("shell", pattern), pattern).toBe("deny");
		}
	});

	test("denies space-less secret-read variants in shell", () => {
		for (const pattern of REQUIRED_SHELL_SECRET_READ_DENIES) {
			expect(lastEffect("shell", pattern), pattern).toBe("deny");
		}
	});

	test("denies unanchored secret paths in read action", () => {
		for (const pattern of REQUIRED_READ_HARDENING_DENIES) {
			expect(lastEffect("read", pattern), pattern).toBe("deny");
		}
	});

	test("pre-existing hardening denies survive unchanged", () => {
		expect(lastEffect("shell", "rm -rf *")).toBe("deny");
		expect(lastEffect("shell", "rm -r -f *")).toBe("deny");
		expect(lastEffect("shell", "sed -i *")).toBe("deny");
		expect(lastEffect("shell", "tee *")).toBe("deny");
		expect(lastEffect("shell", "* .ssh/id_*")).toBe("deny");
		expect(lastEffect("read", ".ssh/id_*")).toBe("deny");
		expect(lastEffect("read", "*.env.example")).toBe("allow");
		expect(lastEffect("shell", "* .env.example")).toBe("allow");
	});
});
