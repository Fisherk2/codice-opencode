/**
 * check-ts-version.sh — advisory drift warning for the resolved TypeScript.
 *
 * `bun run tsc` resolves the native TypeScript 7 binary from node_modules. On
 * mounts that ignore chmod (fuseblk/NTFS, nosuid,nodev) that binary loses its
 * executable bit and Bun silently falls back to a globally installed tsc, so
 * the type-check validates the wrong compiler. The script warns when the
 * resolved major drifts from the major declared in package.json.
 *
 * Contract pinned here:
 *
 *   (a) resolved major == declared major             -> exit 0, no warning
 *   (b) resolved major != declared major             -> exit 0, warning names
 *                                                       both versions on stderr
 *   (c) package.json absent / no `typescript` entry  -> exit 0, silent
 *   (d) jq absent from PATH                          -> exit 0, silent
 *   (e) `bun run tsc --version` fails / is unparseable -> exit 0, silent
 *
 * The script is advisory: it must ALWAYS exit 0 so it can never block
 * `just check` or CI. Speed contract: no coverage suite, no network — the
 * script derives PROJECT_DIR from its own path, so each test copies it into an
 * isolated temp tree and prepends a fake `bun` to PATH. The whole file stays
 * well under a second.
 *
 * Interception contract: the fake `bun` writes a marker (FAKE_BUN_MARKER) so a
 * PATH regression that runs the real compiler fails loudly instead of passing
 * for the wrong reason. Tests that exit before reaching the compiler assert
 * the marker is ABSENT, proving the short-circuit happened where expected.
 */

import { describe, expect, it } from "bun:test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	createScriptFixture,
	expectFakeBunInvoked,
	expectFakeBunNotInvoked,
	makePathWithout,
	runScript,
	type ScriptFixture,
	setupScriptTestBase,
} from "./harness";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const REAL_SCRIPT = join(REPO_ROOT, "scripts", "check-ts-version.sh");

setupScriptTestBase("check-ts-version-");

interface FixtureOptions {
	/** Raw package.json content; null => the file is left absent. */
	packageJson?: string | null;
	/** Fake `bun` stdout; null => the fake exits 1 (unresolvable compiler). */
	bunVersion?: string | null;
}

const DEFAULT_PACKAGE_JSON = '{"devDependencies":{"typescript":"^7.0.2"}}';

function makeFixture(options: FixtureOptions = {}): ScriptFixture {
	const bunVersion = options.bunVersion === undefined ? "Version 7.0.0" : options.bunVersion;
	const fakeBunBody = bunVersion === null ? ["exit 1"] : [`echo "${bunVersion}"`];

	const fx = createScriptFixture({ script: REAL_SCRIPT, fakeBunBody });

	const packageJson =
		options.packageJson === undefined ? DEFAULT_PACKAGE_JSON : options.packageJson;
	if (packageJson !== null) {
		writeFileSync(join(fx.root, "package.json"), packageJson);
	}

	return fx;
}

describe("check-ts-version.sh — advisory drift warning", () => {
	it("(a) exits 0 without a warning when the resolved major matches", () => {
		const fx = makeFixture({
			packageJson: '{"devDependencies":{"typescript":"^7.0.2"}}',
			bunVersion: "Version 7.0.1",
		});

		const result = runScript(fx);

		expect(result.status).toBe(0);
		expect(result.stderr).not.toContain("WARNING");
		expectFakeBunInvoked(result);
	});

	it("(b) exits 0 with a warning naming both versions on a major mismatch", () => {
		const fx = makeFixture({
			packageJson: '{"devDependencies":{"typescript":"^7.0.2"}}',
			bunVersion: "Version 6.0.3",
		});

		const result = runScript(fx);

		expect(result.status).toBe(0);
		expect(result.stderr).toContain("WARNING");
		expect(result.stderr).toContain("6.0.3");
		expect(result.stderr).toContain("7.0.2");
		expectFakeBunInvoked(result);
	});

	it("(c) exits 0 silently when package.json is absent", () => {
		const fx = makeFixture({ packageJson: null });

		const result = runScript(fx);

		expect(result.status).toBe(0);
		expect(result.stderr).not.toContain("WARNING");
		// Short-circuits before the compiler is ever invoked.
		expectFakeBunNotInvoked(result);
	});

	it("(c) exits 0 silently when package.json declares no typescript", () => {
		const fx = makeFixture({ packageJson: '{"devDependencies":{}}' });

		const result = runScript(fx);

		expect(result.status).toBe(0);
		expect(result.stderr).not.toContain("WARNING");
		expectFakeBunNotInvoked(result);
	});

	it("(d) exits 0 silently when jq is absent from PATH", () => {
		const fx = makeFixture();

		const result = runScript(fx, [], makePathWithout(fx.root, ["dirname"]));

		expect(result.status).toBe(0);
		expect(result.stderr).not.toContain("WARNING");
		expectFakeBunNotInvoked(result);
	});

	it("(e) exits 0 silently when the compiler version cannot be resolved", () => {
		const fx = makeFixture({ bunVersion: null });

		const result = runScript(fx);

		expect(result.status).toBe(0);
		expect(result.stderr).not.toContain("WARNING");
		expectFakeBunInvoked(result);
	});
});
