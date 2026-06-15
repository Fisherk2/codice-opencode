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

	test("triggers on push to main", () => {
		expect(ciYaml).toContain("push:");
		expect(ciYaml).toContain("branches: [main]");
	});

	test("triggers on pull_request to main", () => {
		expect(ciYaml).toContain("pull_request:");
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

	test("has just build step", () => {
		expect(ciYaml).toContain("just build");
	});

	test("has just test-e2e step", () => {
		expect(ciYaml).toContain("just test-e2e");
	});
});
