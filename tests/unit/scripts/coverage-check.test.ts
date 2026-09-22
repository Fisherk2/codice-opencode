/**
 * coverage-check.sh — fail-closed threshold resolution.
 *
 * TDD (Fase 2, G1): the validation/resolution phase of the coverage gate had
 * no test, so a broken config could silently approve a build. These tests pin
 * the fail-closed contract:
 *
 *   (a) config JSON absent            -> exit 1
 *   (b) malformed JSON                -> exit 1
 *   (c) '.global' non-numeric         -> exit 1
 *   (d) '.global' out of range / NaN  -> exit 1 (fail-closed; see RED note)
 *   (e) jq absent from PATH           -> exit 1
 *   (f) non-numeric override argument -> exit 1
 *   (g) 'files' without src/cli/main.ts inherits the global threshold
 *
 * Speed contract: these tests MUST NOT run the real coverage suite (~13s).
 * The script derives PROJECT_DIR from its own path, so each test copies it
 * into an isolated temp tree and prepends a fake `bun` to PATH that exits 1.
 * Only the validation/resolution phase is exercised — the coverage phase is
 * intercepted, so the whole file stays in the low milliseconds.
 *
 * Isolation contract: the real scripts/coverage-thresholds.json is never
 * written; every fixture owns its own config inside the temp tree.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	chmodSync,
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const REAL_SCRIPT = join(REPO_ROOT, "scripts", "coverage-check.sh");
const REAL_CONFIG = join(REPO_ROOT, "scripts", "coverage-thresholds.json");

const BASH = Bun.which("bash") ?? "bash";

let baseDir: string;

beforeAll(() => {
	baseDir = mkdtempSync(join(tmpdir(), "coverage-check-"));
});

afterAll(() => {
	rmSync(baseDir, { recursive: true, force: true });
});

interface Fixture {
	root: string;
	script: string;
	configPath: string;
	binDir: string;
}

interface RunResult {
	status: number;
	stdout: string;
	stderr: string;
}

/**
 * Build an isolated project tree with a copy of the real script. When
 * `config` is null the thresholds file is intentionally left absent (case a).
 */
function makeFixture(config: string | null): Fixture {
	const root = mkdtempSync(join(baseDir, "case-"));
	const scriptsDir = join(root, "scripts");
	const binDir = join(root, "bin");
	mkdirSync(scriptsDir, { recursive: true });
	mkdirSync(binDir, { recursive: true });

	const script = join(scriptsDir, "coverage-check.sh");
	copyFileSync(REAL_SCRIPT, script);

	// Intercepts `bun test` so the real suite never runs. Exit 1 mirrors a
	// failing coverage phase and keeps the script's own error path intact.
	const fakeBun = join(binDir, "bun");
	writeFileSync(fakeBun, '#!/usr/bin/env bash\necho "FAKE_BUN_CALLED" >&2\nexit 1\n');
	chmodSync(fakeBun, 0o755);

	const configPath = join(scriptsDir, "coverage-thresholds.json");
	if (config !== null) {
		writeFileSync(configPath, config);
	}

	return { root, script, configPath, binDir };
}

/**
 * A PATH containing only the external commands the script needs before the jq
 * check (dirname/date), deliberately excluding jq. Used for case (e).
 */
function makeJqLessPath(root: string): string {
	const dir = join(root, "no-jq-bin");
	mkdirSync(dir, { recursive: true });
	for (const cmd of ["dirname", "date"]) {
		const real = Bun.which(cmd);
		if (real) symlinkSync(real, join(dir, cmd));
	}
	return dir;
}

function runScript(fx: Fixture, args: string[] = [], pathOverride?: string): RunResult {
	const proc = Bun.spawnSync([BASH, fx.script, ...args], {
		env: {
			...process.env,
			PATH: pathOverride ?? `${fx.binDir}:${process.env.PATH ?? ""}`,
		},
		stdout: "pipe",
		stderr: "pipe",
	});
	return {
		status: proc.exitCode ?? -1,
		stdout: proc.stdout.toString(),
		stderr: proc.stderr.toString(),
	};
}

describe("coverage-check.sh — fail-closed threshold resolution", () => {
	it("(a) exits 1 when the thresholds config is absent", () => {
		const fx = makeFixture(null);

		const result = runScript(fx);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Coverage thresholds config not found");
	});

	it("(b) exits 1 when the config is malformed JSON", () => {
		const fx = makeFixture("{ this is not json");

		const result = runScript(fx);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Invalid coverage thresholds config");
		// The gate must stop before ever invoking the coverage suite.
		expect(result.stderr).not.toContain("Running coverage via bun test");
	});

	it("(c) exits 1 when '.global' is a numeric string instead of a number", () => {
		const fx = makeFixture('{"global": "95"}');

		const result = runScript(fx);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Invalid coverage thresholds config");
		expect(result.stderr).toContain("'.global' must be a number");
		expect(result.stderr).not.toContain("Running coverage via bun test");
	});

	it("(d) exits 1 when '.global' is negative (out of range)", () => {
		const fx = makeFixture('{"global": -1}');

		const result = runScript(fx);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("between 0 and 100");
		expect(result.stderr).not.toContain("Running coverage via bun test");
	});

	it("(d) exits 1 when '.global' exceeds 100 (out of range)", () => {
		const fx = makeFixture('{"global": 101}');

		const result = runScript(fx);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("between 0 and 100");
		expect(result.stderr).not.toContain("Running coverage via bun test");
	});

	it("(d) exits 1 when '.global' is NaN", () => {
		// jq parses bare NaN as a number that serializes to null, so
		// `.global | numbers` accepts it; only a range guard rejects it.
		const fx = makeFixture('{"global": NaN}');

		const result = runScript(fx);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("between 0 and 100");
		expect(result.stderr).not.toContain("Running coverage via bun test");
	});

	it("(e) exits 1 when jq is absent from PATH", () => {
		const fx = makeFixture('{"global": 95}');

		const result = runScript(fx, [], makeJqLessPath(fx.root));

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("jq is required");
	});

	it("(f) exits 1 when the global override argument is not numeric", () => {
		const fx = makeFixture('{"global": 95}');

		const result = runScript(fx, ["not-a-number"]);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Invalid global threshold override");
		expect(result.stderr).not.toContain("Running coverage via bun test");
	});

	it("(g) inherits the global threshold when 'files' omits src/cli/main.ts", () => {
		const fx = makeFixture('{"global": 95, "files": {}}');

		const result = runScript(fx);

		// The resolution log proves main.ts fell back to the global value.
		expect(result.stderr).toContain("src/cli/main.ts threshold: 95%");
	});

	it("(g) uses the per-file threshold when 'files' defines src/cli/main.ts", () => {
		const fx = makeFixture('{"global": 95, "files": {"src/cli/main.ts": 80}}');

		const result = runScript(fx);

		expect(result.stderr).toContain("src/cli/main.ts threshold: 80%");
	});

	it("(g) falls back to the global threshold when the per-file value is out of range", () => {
		const fx = makeFixture('{"global": 95, "files": {"src/cli/main.ts": -1}}');

		const result = runScript(fx);

		expect(result.stderr).toContain("src/cli/main.ts threshold: 95%");
	});

	it("does not mutate the real scripts/coverage-thresholds.json", () => {
		const before = readFileSync(REAL_CONFIG, "utf-8");
		const fx = makeFixture('{"global": 95}');

		runScript(fx);

		expect(readFileSync(REAL_CONFIG, "utf-8")).toBe(before);
	});
});
