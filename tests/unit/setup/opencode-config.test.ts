/**
 * opencode.json — Schema and security deny-pattern validation
 *
 * Verifies that the generated opencode.json template:
 * 1. Is valid JSON
 * 2. Has the expected top-level keys
 * 3. Contains proper deny rules for sensitive credential files
 *    in both the `bash` and `read` permission sections
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const OPENCODE_CONFIG_PATH = path.resolve(
	import.meta.dir,
	"../../../template/obligatorio/opencode.json",
);

interface OpenCodeConfig {
	$schema?: string;
	agent?: Record<string, unknown>;
	permission?: {
		bash?: Record<string, string>;
		read?: Record<string, string>;
	};
	mcp?: Record<string, unknown>;
}

function loadConfig(): OpenCodeConfig {
	const content = fs.readFileSync(OPENCODE_CONFIG_PATH, "utf-8");
	return JSON.parse(content) as OpenCodeConfig;
}

describe("opencode.json — Config Schema", () => {
	test("exists and is valid JSON", () => {
		expect(fs.existsSync(OPENCODE_CONFIG_PATH)).toBe(true);
		const content = fs.readFileSync(OPENCODE_CONFIG_PATH, "utf-8");
		expect(() => JSON.parse(content)).not.toThrow();
	});

	test("has required top-level keys", () => {
		const config = loadConfig();
		expect(config).toHaveProperty("$schema");
		expect(config).toHaveProperty("agent");
		expect(config).toHaveProperty("permission");
		expect(config).toHaveProperty("mcp");
	});
});

describe("opencode.json — Bash Permission Deny Rules", () => {
	const REQUIRED_BASH_DENY = [
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

	const REQUIRED_BASH_DENY_INTERMEDIATE = [
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

	test("has valid bash permission section", () => {
		const config = loadConfig();
		expect(config.permission?.bash).toBeDefined();
	});

	test("has all simple deny rules for credential files", () => {
		const bash = loadConfig().permission?.bash ?? {};
		for (const pattern of REQUIRED_BASH_DENY) {
			expect(bash[pattern]).toBe("deny");
		}
	});

	test("has all intermediate deny rules for credential files", () => {
		const bash = loadConfig().permission?.bash ?? {};
		for (const pattern of REQUIRED_BASH_DENY_INTERMEDIATE) {
			expect(bash[pattern]).toBe("deny");
		}
	});

	test("allows reading .env.example", () => {
		const bash = loadConfig().permission?.bash ?? {};
		expect(bash["* .env.example"]).toBe("allow");
		expect(bash["* ./.env.example"]).toBe("allow");
	});
});

describe("opencode.json — Read Permission Deny Rules", () => {
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

	test("has valid read permission section", () => {
		const config = loadConfig();
		expect(config.permission?.read).toBeDefined();
	});

	test("has all deny rules for credential files", () => {
		const read = loadConfig().permission?.read ?? {};
		for (const pattern of REQUIRED_READ_DENY) {
			expect(read[pattern]).toBe("deny");
		}
	});

	test("allows reading .env.example in read section", () => {
		const read = loadConfig().permission?.read ?? {};
		expect(read["*.env.example"]).toBe("allow");
	});
});
