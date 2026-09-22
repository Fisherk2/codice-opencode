/**
 * CI Workflow Configuration Tests
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { readTextFile } from "./helpers";

describe("CI Workflow Configuration", () => {
	let ciYaml: string;

	beforeAll(() => {
		ciYaml = readTextFile(".github/workflows/ci.yml");
	});

	test("triggers on push to main and develop", () => {
		expect(ciYaml).toContain("push:");
		expect(ciYaml).toContain("branches: [main, develop]");
	});

	test("triggers on pull_request to main and develop", () => {
		expect(ciYaml).toContain("pull_request:");
		expect(ciYaml).toContain("branches: [main, develop]");
	});

	test("includes ubuntu runner", () => {
		expect(ciYaml).toContain("ubuntu-latest");
	});

	test("includes macos runner", () => {
		expect(ciYaml).toContain("macos-latest");
	});

	test("includes windows runner", () => {
		expect(ciYaml).toContain("windows-latest");
	});

	test("has concurrency with cancel-in-progress", () => {
		expect(ciYaml).toContain("cancel-in-progress: true");
	});

	test("has just check step", () => {
		expect(ciYaml).toContain("just check");
	});

	test("has just test step", () => {
		expect(ciYaml).toContain("just test");
	});

	test("just build step is removed (binary compilation removed in v1.2.0)", () => {
		expect(ciYaml).not.toContain("just build");
	});

	test("has just test-e2e step", () => {
		expect(ciYaml).toContain("just test-e2e");
	});

	test("binary build and smoke test steps are removed", () => {
		expect(ciYaml).not.toContain("Build binary");
		expect(ciYaml).not.toContain("Smoke test binary");
		expect(ciYaml).not.toContain("dist/codice");
		expect(ciYaml).not.toContain("Upload binary artifact");
	});
});
