/**
 * Shared harness for unit tests that run real bash scripts from `scripts/`
 * inside an isolated temp tree, with a fake `bun` prepended to PATH.
 *
 * The scripts derive PROJECT_DIR from their own path, so each test copies a
 * script into its own temp tree and stubs `bun` to intercept (or fake) the
 * script's expensive phases. Interception contract: the fake `bun` writes a
 * marker file whose path arrives via the FAKE_BUN_MARKER env var, so a PATH
 * regression — which would run the real tooling instead of the fixture —
 * fails loudly instead of passing silently. A stderr-only signal would be
 * useless: scripts silence the fake with `2>/dev/null`.
 */

import { afterAll, beforeAll, expect } from "bun:test";
import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, join } from "node:path";

export const REPO_ROOT = join(import.meta.dir, "..", "..", "..");

export const BASH = Bun.which("bash") ?? "bash";

export interface RunResult {
	status: number;
	stdout: string;
	stderr: string;
	/** Path the fake `bun` writes when the script reaches the stubbed phase. */
	markerPath: string;
}

export interface ScriptFixture {
	root: string;
	script: string;
	binDir: string;
	/** Extra env vars merged into every `runScript` invocation for this fixture. */
	env: Record<string, string>;
}

export interface FixtureOptions {
	/** Absolute path of the real script to copy into the temp tree. */
	script: string;
	/** Bash lines appended after the shared marker-write prelude. */
	fakeBunBody: string[];
	/** Extra env vars (e.g. fixtures read by the fake `bun`). */
	extraEnv?: Record<string, string>;
}

let baseDir: string;

/**
 * Registers the temp-tree lifecycle for the importing test file. Each file
 * gets one base directory; fixtures nest inside it and everything is removed
 * on suite teardown so the resolution is clean even on unhandled failures.
 */
export function setupScriptTestBase(tmpPrefix: string): void {
	beforeAll(() => {
		baseDir = mkdtempSync(join(tmpdir(), tmpPrefix));
	});
	afterAll(() => {
		rmSync(baseDir, { recursive: true, force: true });
	});
}

/**
 * Builds an isolated project tree under the shared base with a copy of the
 * real script. Callers write any additional files (config, package.json)
 * into `fixture.root` afterwards, so per-script scaffolding stays local.
 */
export function createScriptFixture(options: FixtureOptions): ScriptFixture {
	const { script: realScript, fakeBunBody, extraEnv = {} } = options;
	const root = mkdtempSync(join(baseDir, "case-"));
	const scriptsDir = join(root, "scripts");
	const binDir = join(root, "bin");
	mkdirSync(scriptsDir, { recursive: true });
	mkdirSync(binDir, { recursive: true });

	const script = join(scriptsDir, basename(realScript));
	copyFileSync(realScript, script);

	// The marker is written before anything else so a test can tell "the
	// script reached the stubbed phase" from "it short-circuited earlier",
	// even when the fake exits 1.
	const fakeBunLines = [
		"#!/usr/bin/env bash",
		// biome-ignore lint/suspicious/noTemplateCurlyInString: bash parameter expansion, not a JS template literal
		'if [ -n "${FAKE_BUN_MARKER:-}" ]; then echo called > "$FAKE_BUN_MARKER"; fi',
		...fakeBunBody,
		"",
	];

	const fakeBun = join(binDir, "bun");
	writeFileSync(fakeBun, fakeBunLines.join("\n"));
	chmodSync(fakeBun, 0o755);

	return { root, script, binDir, env: extraEnv };
}

export function runScript(
	fx: ScriptFixture,
	args: readonly string[] = [],
	pathOverride?: string,
): RunResult {
	const markerPath = join(fx.root, "bun-called.marker");
	const proc = Bun.spawnSync([BASH, fx.script, ...args], {
		env: {
			...process.env,
			...fx.env,
			FAKE_BUN_MARKER: markerPath,
			PATH: pathOverride ?? `${fx.binDir}${delimiter}${process.env.PATH ?? ""}`,
		},
		stdout: "pipe",
		stderr: "pipe",
	});
	return {
		status: proc.exitCode ?? -1,
		stdout: proc.stdout.toString(),
		stderr: proc.stderr.toString(),
		markerPath,
	};
}

/** Proves the fake `bun` intercepted the stubbed phase. */
export function expectFakeBunInvoked(result: RunResult): void {
	expect(existsSync(result.markerPath), "fake bun was not invoked").toBe(true);
}

/** Proves the script short-circuited before reaching the fake `bun`. */
export function expectFakeBunNotInvoked(result: RunResult): void {
	expect(existsSync(result.markerPath)).toBe(false);
}

/**
 * A PATH containing only the external commands the script needs before the
 * jq check, deliberately excluding jq. Missing tooling fails loudly rather
 * than silently producing a jq-less PATH by accident (which would make the
 * jq-absent case pass for the wrong reason).
 */
export function makePathWithout(root: string, cmds: readonly string[]): string {
	const dir = join(root, "no-jq-bin");
	mkdirSync(dir, { recursive: true });
	for (const cmd of cmds) {
		const real = Bun.which(cmd);
		expect(real, `required command not found on PATH: ${cmd}`).toBeDefined();
		// `type` is required on Windows (ignored on POSIX): "file" matches the
		// executable we link to.
		symlinkSync(real as string, join(dir, cmd), "file");
	}
	return dir;
}
