/**
 * Release Workflow Configuration Tests
 *
 * Verifies the release.yml GitHub Actions workflow structure:
 * version validation, npm publish step, release creation,
 * and security hardening (SHA pinning).
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { readTextFile } from "./helpers";

describe("Release Workflow Configuration", () => {
	let releaseYaml: string;

	beforeAll(() => {
		releaseYaml = readTextFile(".github/workflows/release.yml");
	});

	// --- Trigger ---

	test("triggers on tag push matching v*", () => {
		expect(releaseYaml).toContain("tags:");
		expect(releaseYaml).toContain("'v*'");
	});

	test("supports workflow_dispatch with tag input", () => {
		expect(releaseYaml).toContain("workflow_dispatch:");
		expect(releaseYaml).toContain("tag:");
	});

	test("quality gate validates the released tag, not the dispatch branch", () => {
		// On workflow_dispatch the run starts on the branch, not the tag; the
		// quality job must hand the resolved tag to ci.yml so the gates run
		// against the exact commit being published (same expression as the
		// TAG env, recomputed because `env` context is not allowed in `with:`).
		const qualityBlock = releaseYaml.slice(
			releaseYaml.indexOf("# GitHub forbids"),
			releaseYaml.indexOf("  release:"),
		);
		expect(qualityBlock).toContain("./.github/workflows/ci.yml");
		expect(qualityBlock).toContain(
			"ref: ${{ github.event_name == 'workflow_dispatch' && inputs.tag || github.ref_name }}",
		);
	});

	// --- Version validation ---

	test("has version validation step comparing tag vs package.json", () => {
		expect(releaseYaml).toContain("Validate version");
		// Tag is resolved through the TAG env indirection: workflow_dispatch uses
		// the inputs.tag, tag push falls back to github.ref_name.
		expect(releaseYaml).toContain("TAG:");
		expect(releaseYaml).toContain("inputs.tag");
		expect(releaseYaml).toContain("github.ref_name");
		expect(releaseYaml).toContain("package.json");
		// Prerelease tags demand an exact match (incl. suffix); stable tags
		// compare the base version only.
		expect(releaseYaml).toContain('"$TAG_VERSION" != "$PKG_VERSION"');
		expect(releaseYaml).toContain('"$TAG_VERSION_BASE" != "$PKG_VERSION_BASE"');
	});

	test("does not interpolate untrusted github context into shell scripts (injection guard)", () => {
		// GitHub Actions interpolates ${{ }} BEFORE the shell runs, so a crafted
		// tag could execute arbitrary commands. Env vars ($GITHUB_REF_NAME) are
		// safe because they are expanded by the shell AFTER the script starts.
		expect(releaseYaml).not.toContain("${" + "{ github.ref_name }}");
	});

	test("version validation uses jq for robust JSON parsing", () => {
		expect(releaseYaml).toContain("jq -r '.version' package.json");
	});

	test("version validation fails if tag does not match package.json", () => {
		expect(releaseYaml).toContain("does not match package.json version");
		expect(releaseYaml).toContain("exit 1");
	});

	// --- Pre-release detection ---

	test("has pre-release detection step that parses tag suffix", () => {
		expect(releaseYaml).toContain("Detect release type");
		expect(releaseYaml).toContain("beta|rc");
		expect(releaseYaml).toContain("npm_tag");
	});

	test("pre-release tags set npm_tag to beta or rc using bash variable", () => {
		expect(releaseYaml).toMatch(/npm_tag=\$\{SUFFIX\}/);
	});

	test("pre-release detection sets type, npm_tag, and make_latest outputs", () => {
		expect(releaseYaml).toContain("type=prerelease");
		expect(releaseYaml).toContain("npm_tag=latest");
		expect(releaseYaml).toContain("make_latest=true");
		expect(releaseYaml).toContain("make_latest=false");
	});

	test("npm publish uses --tag with detected npm_tag", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: This is a bash variable in a YAML workflow, not a JS template literal
		expect(releaseYaml).toContain('--tag "${NPM_TAG}"');
	});

	test("GitHub release uses prerelease flag", () => {
		expect(releaseYaml).toContain("prerelease:");
	});

	test("make_latest is dynamically set via release_type output", () => {
		expect(releaseYaml).toMatch(/make_latest: .*release_type.outputs.make_latest/);
	});

	// --- npm publish ---

	test("has npm publish step", () => {
		expect(releaseYaml).toContain("Publish to npm");
	});

	test("npm publish uses NPM_TOKEN from secrets", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: This is a GitHub Actions expression, not a JS template string
		expect(releaseYaml).toContain("NPM_TOKEN: ${{ secrets.NPM_TOKEN }}");
	});

	test("npm publish creates .npmrc with auth token", () => {
		expect(releaseYaml).toContain("//registry.npmjs.org/:_authToken=");
	});

	test("npm publish cleans up .npmrc on exit via trap", () => {
		expect(releaseYaml).toContain("trap 'rm -f .npmrc' EXIT");
	});

	test("npm publish distinguishes 'already published' from real failures", () => {
		expect(releaseYaml).toContain("cannot publish over the previously published version");
	});

	test("npm publish propagates real errors (not just echo)", () => {
		expect(releaseYaml).toContain("PUBLISH_EXIT");
		expect(releaseYaml).toContain("exit $PUBLISH_EXIT");
	});

	// --- Release job ---

	test("release job has contents:write permission", () => {
		expect(releaseYaml).toContain("contents: write");
	});

	test("creates GitHub release without binary assets", () => {
		expect(releaseYaml).toContain("action-gh-release");
		// Binary names should NOT be present (binary removal in v1.2.0)
		expect(releaseYaml).not.toContain("codice-linux");
		expect(releaseYaml).not.toContain("codice-macos");
		expect(releaseYaml).not.toContain("codice-windows.exe");
		expect(releaseYaml).not.toContain("sha256sum");
		expect(releaseYaml).not.toContain("checksums-sha256.txt");
	});

	test("release job does not depend on build job (build job removed in v1.2.0)", () => {
		// Build job was removed with binary compilation (FEV-11)
		expect(releaseYaml).not.toContain("needs: build");
		expect(releaseYaml).not.toContain("Build binary");
		expect(releaseYaml).not.toContain("upload-artifact");
	});

	test("extracts release body from CHANGELOG", () => {
		expect(releaseYaml).toContain("Extract release body from CHANGELOG");
		expect(releaseYaml).toContain("CHANGELOG.md");
	});

	// --- Post-publish smoke test (retry window) ---

	test("has a post-publish artifact verification step", () => {
		expect(releaseYaml).toContain("Verify published artifact");
	});

	test("smoke test retries for ~7.5 minutes to ride out registry propagation lag", () => {
		// Registry read replicas can lag several minutes behind a successful
		// publish; a short window produces false negatives (run 35715057975).
		// Pin the widened window, tolerating whitespace variations.
		expect(releaseYaml).toMatch(/ATTEMPTS=30/);
		expect(releaseYaml).toMatch(/seq\s+1\s+"\$ATTEMPTS"/);
		expect(releaseYaml).toMatch(/sleep\s+15/);
		expect(releaseYaml).toMatch(/elapsed=\$\(\(\s*\(i\s*-\s*1\)\s*\*\s*15\s*\)\)/);

		// Derive the window from the pinned constants so the test states the
		// intent ("~7.5 min") instead of a magic number: 30 attempts x 15s = 450s.
		const attempts = Number(releaseYaml.match(/ATTEMPTS=(\d+)/)?.[1]);
		const sleepSeconds = Number(releaseYaml.match(/sleep\s+(\d+)/)?.[1]);
		expect(attempts).toBe(30);
		expect(sleepSeconds).toBe(15);
		expect(attempts * sleepSeconds).toBe(450);
	});

	// --- Security hardening ---

	test("softprops/action-gh-release is SHA-pinned", () => {
		// Should use commit SHA, not just a version tag
		expect(releaseYaml).toMatch(/softprops\/action-gh-release@[a-f0-9]{40}/);
	});

	// --- Concurrency ---

	test("has concurrency group to prevent parallel releases", () => {
		expect(releaseYaml).toContain("concurrency:");
		expect(releaseYaml).toContain("release-");
		// Deliberately false: cancelling an in-flight publish can leave npm and
		// the GitHub release inconsistent (partial publish, missing asset).
		expect(releaseYaml).toContain("cancel-in-progress: false");
	});
});
