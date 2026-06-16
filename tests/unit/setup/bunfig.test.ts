/**
 * Bunfig.toml Configuration Tests
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { readTextFile } from "./helpers";

describe("Bunfig.toml Configuration", () => {
	let bunfig: string;

	beforeAll(() => {
		bunfig = readTextFile("bunfig.toml");
	});

	test("has install.dev = true", () => {
		expect(bunfig).toContain("dev = true");
	});

	test("has install.optional = true", () => {
		expect(bunfig).toContain("optional = true");
	});

	test("has install.peer = true", () => {
		expect(bunfig).toContain("peer = true");
	});

	test("has saveTextLockfile = true", () => {
		expect(bunfig).toContain("saveTextLockfile = true");
	});
});
