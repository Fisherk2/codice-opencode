/**
 * coverage-check.sh — fail-closed threshold resolution.
 *
 * TDD (Fase 2, G1): the validation/resolution phase of the coverage gate had
 * no test, so a broken config could silently approve a build. These tests pin
 * the fail-closed contract:
 *
 *   (a) config JSON absent                     -> exit 1
 *   (b) malformed JSON                         -> exit 1
 *   (c) '.global' non-numeric                  -> exit 1
 *   (d) '.global' out of range / NaN           -> exit 1
 *   (d) '.global' at the inclusive 0/100 bounds -> accepted
 *   (e) jq absent from PATH                    -> exit 1
 *   (f) non-numeric or > 100 override argument -> exit 1
 *   (f) in-range override (90)                 -> applied
 *   (g) 'files' without src/cli/main.ts        -> inherits the global threshold
 *   (g) 'files' with an invalid main.ts value  -> exit 1 (fail-closed)
 *   (h) sub-gate file ABSENT from the lcov      -> exit 1 (fail-closed: the
 *       sub-gate cannot be enforced if the file was never instrumented)
 *   (h) sub-gate file present, above/below its threshold -> pass/fail unchanged
 *
 * Speed contract: these tests MUST NOT run the real coverage suite (~13s).
 * The script derives PROJECT_DIR from its own path, so each test copies it
 * into an isolated temp tree and prepends a fake `bun` to PATH. The default
 * fake exits 1 (coverage phase intercepted); the analysis fixtures (h) instead
 * have it write a FAKE_LCOV_CONTENT fixture to --coverage-dir and exit 0, so
 * the Python analysis phase runs on controlled data. The whole file stays well
 * under a second either way.
 *
 * Interception contract: the fake `bun` writes a marker file (path via the
 * FAKE_BUN_MARKER env var) and echoes to stdout. Every test that reaches the
 * coverage phase asserts the marker exists, so a regression in the PATH
 * prepend (which would run the temp tree instead) fails loudly instead of
 * passing silently. A stderr-only signal would be useless: the script
 * silences the fake with `2>/dev/null`.
 *
 * Isolation contract: the real scripts/coverage-thresholds.json is never
 * written; every fixture owns its own config inside the temp tree.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	chmodSync,
	copyFileSync,
	existsSync,
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
	/** When set, the fake `bun` writes this lcov to --coverage-dir and exits 0. */
	lcov?: string;
}

interface RunResult {
	status: number;
	stdout: string;
	stderr: string;
	/** Path the fake `bun` would write when it intercepts the coverage phase. */
	markerPath: string;
}

/**
 * Build an isolated project tree with a copy of the real script. When
 * `config` is null the thresholds file is intentionally left absent (case a).
 * When `options.lcov` is set, the fake `bun` writes it to the `--coverage-dir`
 * it receives and exits 0 (exercising the Python analysis phase); otherwise it
 * exits 1 and the coverage phase is only intercepted.
 */
function makeFixture(config: string | null, options: { lcov?: string } = {}): Fixture {
	const root = mkdtempSync(join(baseDir, "case-"));
	const scriptsDir = join(root, "scripts");
	const binDir = join(root, "bin");
	mkdirSync(scriptsDir, { recursive: true });
	mkdirSync(binDir, { recursive: true });

	const script = join(scriptsDir, "coverage-check.sh");
	copyFileSync(REAL_SCRIPT, script);

	// Intercepts `bun test` so the real suite never runs. It echoes to stdout
	// and writes the FAKE_BUN_MARKER file: the script silences the fake's
	// stderr with 2>/dev/null, so a stderr-only signal would be unobservable.
	const fakeBunLines = [
		"#!/usr/bin/env bash",
		'echo "FAKE_BUN_CALLED"',
		// biome-ignore lint/suspicious/noTemplateCurlyInString: bash parameter expansion, not a JS template literal
		'if [ -n "${FAKE_BUN_MARKER:-}" ]; then echo "called" > "$FAKE_BUN_MARKER"; fi',
	];
	if (options.lcov === undefined) {
		// Exit 1 mirrors a failing coverage phase and keeps the error path intact.
		fakeBunLines.push("exit 1");
	} else {
		// Emit the lcov fixture into the --coverage-dir the script passes, then
		// exit 0 so the script reaches its Python analysis phase.
		fakeBunLines.push(
			'for arg in "$@"; do',
			'  case "$arg" in',
			// biome-ignore lint/suspicious/noTemplateCurlyInString: bash parameter expansion, not a JS template literal
			'    --coverage-dir=*) covdir="${arg#--coverage-dir=}" ;;',
			"  esac",
			"done",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: bash parameter expansion, not a JS template literal
			'if [ -n "${covdir:-}" ]; then mkdir -p "$covdir"; printf "%s" "$FAKE_LCOV_CONTENT" > "$covdir/lcov.info"; fi',
			"exit 0",
		);
	}
	fakeBunLines.push("");

	const fakeBun = join(binDir, "bun");
	writeFileSync(fakeBun, fakeBunLines.join("\n"));
	chmodSync(fakeBun, 0o755);

	const configPath = join(scriptsDir, "coverage-thresholds.json");
	if (config !== null) {
		writeFileSync(configPath, config);
	}

	return { root, script, configPath, binDir, lcov: options.lcov };
}

/**
 * A PATH containing only the external commands the script needs before the jq
 * check (dirname/date), deliberately excluding jq. Used for case (e). Missing
 * tooling fails loudly rather than silently producing a jq-less PATH by
 * accident (which would make case (e) pass for the wrong reason).
 */
function makeJqLessPath(root: string): string {
	const dir = join(root, "no-jq-bin");
	mkdirSync(dir, { recursive: true });
	for (const cmd of ["dirname", "date"]) {
		const real = Bun.which(cmd);
		expect(real, `required command not found on PATH: ${cmd}`).toBeDefined();
		symlinkSync(real as string, join(dir, cmd));
	}
	return dir;
}

function runScript(fx: Fixture, args: string[] = [], pathOverride?: string): RunResult {
	const markerPath = join(fx.root, "bun-called.marker");
	const proc = Bun.spawnSync([BASH, fx.script, ...args], {
		env: {
			...process.env,
			FAKE_BUN_MARKER: markerPath,
			...(fx.lcov === undefined ? {} : { FAKE_LCOV_CONTENT: fx.lcov }),
			PATH: pathOverride ?? `${fx.binDir}:${process.env.PATH ?? ""}`,
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

/**
 * Proves the fake `bun` intercepted the coverage phase. Without this a PATH
 * regression would run the temp tree and the other assertions could still
 * pass — the marker makes the interception observable and load-bearing.
 */
function expectCoveragePhaseIntercepted(result: RunResult): void {
	expect(existsSync(result.markerPath), "fake bun was not invoked").toBe(true);
	expect(result.stdout).toContain("FAKE_BUN_CALLED");
	expect(result.stderr).toContain("bun test --coverage failed.");
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

	it("(d) accepts the inclusive lower boundary (global = 0)", () => {
		const fx = makeFixture('{"global": 0}');

		const result = runScript(fx);

		expect(result.stderr).not.toContain("between 0 and 100");
		expect(result.stderr).toContain("global threshold: 0%");
		expectCoveragePhaseIntercepted(result);
	});

	it("(d) accepts the inclusive upper boundary (global = 100)", () => {
		const fx = makeFixture('{"global": 100}');

		const result = runScript(fx);

		expect(result.stderr).not.toContain("between 0 and 100");
		expect(result.stderr).toContain("global threshold: 100%");
		expectCoveragePhaseIntercepted(result);
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

	it("(f) exits 1 when the global override exceeds 100", () => {
		// `coverage < 999` is always true, so an unbounded override would fail
		// every build with a confusing message instead of a config error.
		const fx = makeFixture('{"global": 95}');

		const result = runScript(fx, ["999"]);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Invalid global threshold override");
		expect(result.stderr).toContain("between 0 and 100");
		expect(result.stderr).not.toContain("Running coverage via bun test");
	});

	it("(f) accepts a valid in-range override and applies it", () => {
		const fx = makeFixture('{"global": 95}');

		const result = runScript(fx, ["90"]);

		expect(result.stderr).not.toContain("Invalid global threshold override");
		expect(result.stderr).toContain("global threshold: 90%");
		expectCoveragePhaseIntercepted(result);
	});

	it("(g) inherits the global threshold when 'files' omits src/cli/main.ts", () => {
		const fx = makeFixture('{"global": 95, "files": {}}');

		const result = runScript(fx);

		// The resolution log proves main.ts fell back to the global value.
		expect(result.stderr).toContain("src/cli/main.ts threshold: 95%");
		expectCoveragePhaseIntercepted(result);
	});

	it("(g) uses the per-file threshold when 'files' defines src/cli/main.ts", () => {
		const fx = makeFixture('{"global": 95, "files": {"src/cli/main.ts": 80}}');

		const result = runScript(fx);

		expect(result.stderr).toContain("src/cli/main.ts threshold: 80%");
		expectCoveragePhaseIntercepted(result);
	});

	for (const bad of ["-1", "101", "NaN"]) {
		it(`(g) exits 1 when src/cli/main.ts is present but invalid (${bad})`, () => {
			// Fail-closed asymmetry with '.global': a present-but-invalid value
			// must not silently relax the sub-gate. A typo like 150 is a config
			// error, not an implicit "inherit the global" request.
			const fx = makeFixture(`{"global": 95, "files": {"src/cli/main.ts": ${bad}}}`);

			const result = runScript(fx);

			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Invalid coverage thresholds config");
			expect(result.stderr).toContain("src/cli/main.ts");
			expect(result.stderr).toContain("between 0 and 100");
			expect(result.stderr).not.toContain("Running coverage via bun test");
		});
	}

	it("does not mutate the real scripts/coverage-thresholds.json", () => {
		const before = readFileSync(REAL_CONFIG, "utf-8");
		const fx = makeFixture('{"global": 95}');

		runScript(fx);

		// The fixture read its own config, not the real one...
		expect(readFileSync(fx.configPath, "utf-8")).toBe('{"global": 95}');
		// ...and the real one is byte-identical.
		expect(readFileSync(REAL_CONFIG, "utf-8")).toBe(before);
	});
});

// ---------------------------------------------------------------------------
// Per-file sub-gate analysis (h) — fail-closed when the file is not in lcov
// ---------------------------------------------------------------------------

/** Minimal lcov record for one file with the given found/hit line counts. */
function lcovRecord(file: string, lf: number, lh: number): string {
	return [`SF:${file}`, `LF:${lf}`, `LH:${lh}`, "end_of_record", ""].join("\n");
}

describe("coverage-check.sh — per-file sub-gate is fail-closed", () => {
	it("(h) exits 1 when src/cli/main.ts is absent from the coverage report", () => {
		// The configured sub-gate file was never instrumented. The old
		// `if main_lf > 0` guard skipped the sub-gate silently, so a green
		// global check approved the build; the gate must fail closed instead.
		const fx = makeFixture('{"global": 50, "files": {"src/cli/main.ts": 80}}', {
			lcov: lcovRecord("src/domain/other.ts", 10, 10),
		});

		const result = runScript(fx);

		expect(existsSync(result.markerPath), "fake bun was not invoked").toBe(true);
		expect(result.status).toBe(1);
		expect(`${result.stdout}${result.stderr}`).toContain(
			"'src/cli/main.ts' not found in coverage report",
		);
	});

	it("(h) passes when src/cli/main.ts meets its per-file threshold", () => {
		const fx = makeFixture('{"global": 50, "files": {"src/cli/main.ts": 80}}', {
			lcov: lcovRecord("src/cli/main.ts", 100, 90),
		});

		const result = runScript(fx);

		expect(existsSync(result.markerPath), "fake bun was not invoked").toBe(true);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("PASS: Coverage meets threshold");
	});

	it("(h) exits 1 when src/cli/main.ts is below its per-file threshold", () => {
		const fx = makeFixture('{"global": 50, "files": {"src/cli/main.ts": 80}}', {
			lcov: lcovRecord("src/cli/main.ts", 100, 50),
		});

		const result = runScript(fx);

		expect(result.status).toBe(1);
		expect(result.stdout).toContain("main.ts coverage below");
	});
});
