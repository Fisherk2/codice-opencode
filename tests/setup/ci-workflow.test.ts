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

	test("declares an optional ref input for the reusable release quality checkout", () => {
		// release.yml passes the released tag as `ref`; push/PR runs leave it
		// empty and keep checking out the triggering ref (checkout default).
		const callBlock = ciYaml.slice(ciYaml.indexOf("workflow_call:"), ciYaml.indexOf("jobs:"));
		expect(callBlock).toContain("inputs:");
		expect(callBlock).toMatch(/ref:/);
		expect(callBlock).toContain("required: false");
	});

	test("checkout step consumes the explicit ref input when provided", () => {
		const checkoutBlock = ciYaml.slice(
			ciYaml.indexOf("uses: actions/checkout@"),
			ciYaml.indexOf("Setup Bun"),
		);
		expect(checkoutBlock).toContain("ref: ${{ inputs.ref }}");
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

	test("coverage step is config-driven (no hardcoded threshold)", () => {
		// The 95% threshold lives in scripts/coverage-thresholds.json; pinning it
		// again on the CI invocation would silently desync from the JSON.
		expect(ciYaml).toContain("run: just coverage-check");
		const invocations = ciYaml.match(/just coverage-check[^\n]*/g) ?? [];
		expect(invocations.length).toBeGreaterThan(0);
		for (const line of invocations) {
			expect(line.trim(), line).toBe("just coverage-check");
		}
		expect(ciYaml).not.toMatch(/just coverage-check\s+[0-9]/);
	});

	test("binary build and smoke test steps are removed", () => {
		expect(ciYaml).not.toContain("Build binary");
		expect(ciYaml).not.toContain("Smoke test binary");
		expect(ciYaml).not.toContain("dist/codice");
		expect(ciYaml).not.toContain("Upload binary artifact");
	});
});
