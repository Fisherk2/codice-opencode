/**
 * Release Workflow Configuration Tests
 *
 * Verifies the release.yml GitHub Actions workflow structure:
 * version validation, npm publish step, binary asset upload,
 * and security hardening (SHA pinning).
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { readTextFile } from "./helpers";

const BINARY_NAMES = ["codice-linux", "codice-macos", "codice-windows.exe"] as const;

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

	// --- Build job ---

	test("has 3-platform build matrix (ubuntu, macos, windows)", () => {
		expect(releaseYaml).toContain("ubuntu-latest");
		expect(releaseYaml).toContain("macos-latest");
		expect(releaseYaml).toContain("windows-latest");
	});

	test("build uses just build", () => {
		expect(releaseYaml).toContain("just build");
	});

	test("uploads binary artifacts", () => {
		expect(releaseYaml).toContain("upload-artifact");
		for (const name of BINARY_NAMES) {
			expect(releaseYaml).toContain(name);
		}
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

	test("has release job that depends on build", () => {
		expect(releaseYaml).toContain("needs: build");
	});

	test("release job has contents:write permission", () => {
		expect(releaseYaml).toContain("contents: write");
	});

	test("creates GitHub release with binary assets", () => {
		expect(releaseYaml).toContain("action-gh-release");
		for (const name of BINARY_NAMES) {
			expect(releaseYaml).toContain(name);
		}
	});

	test("generates SHA-256 checksums for binaries", () => {
		expect(releaseYaml).toContain("sha256sum");
		expect(releaseYaml).toContain("checksums-sha256.txt");
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
