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

	// --- Version validation ---

	test("has version validation step comparing tag vs package.json", () => {
		expect(releaseYaml).toContain("Validate version");
		expect(releaseYaml).toContain("github.ref_name");
		expect(releaseYaml).toContain("package.json");
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

	// --- Security hardening ---

	test("softprops/action-gh-release is SHA-pinned", () => {
		// Should use commit SHA, not just a version tag
		expect(releaseYaml).toMatch(/softprops\/action-gh-release@[a-f0-9]{40}/);
	});

	// --- Concurrency ---

	test("has concurrency group to prevent parallel releases", () => {
		expect(releaseYaml).toContain("concurrency:");
		expect(releaseYaml).toContain("release-");
		expect(releaseYaml).toContain("cancel-in-progress: true");
	});
});
