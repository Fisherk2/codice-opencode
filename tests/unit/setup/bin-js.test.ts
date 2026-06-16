/**
 * bin.js Wrapper Tests
 *
 * Verifies the npm bin entry point exists and has the correct
 * dynamic import structure required by npm's bin mechanism.
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { fileExists, readTextFile } from "./helpers";

describe("bin.js Wrapper", () => {
	let binJs: string;

	beforeAll(() => {
		binJs = readTextFile("src/cli/bin.js");
	});

	test("bin.js file exists", () => {
		expect(fileExists("src/cli/bin.js")).toBe(true);
	});

	test("has shebang line for bun", () => {
		expect(binJs.startsWith("#!/usr/bin/env bun")).toBe(true);
	});

	test("dynamically imports main.ts", () => {
		expect(binJs).toContain('import("./main.ts")');
	});

	test("calls main() from the imported module", () => {
		expect(binJs).toContain("mod.main()");
	});

	test("uses top-level await", () => {
		expect(binJs).toContain("await import");
		expect(binJs).toContain("await mod.main()");
	});

	test("bin.js is listed in package.json bin entry", () => {
		const pkg = JSON.parse(readTextFile("package.json")) as Record<string, unknown>;
		expect(pkg.bin).toBeDefined();
		expect((pkg.bin as Record<string, string>).codice).toBe("./src/cli/bin.js");
	});
});
