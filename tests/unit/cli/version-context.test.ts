import { describe, expect, mock as mockFn, test } from "bun:test";
import { detectVersionContext } from "../../../src/cli/versionContext";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";

// ── Helpers ───────────────────────────────────────────────────────

/** Build a valid .codice-version JSON string for the given version/packs. */
function versionJSON(version: string, installedPacks: readonly string[] = []): string {
	return JSON.stringify({
		version,
		installedAt: "2026-06-13T12:00:00.000Z",
		installedPacks,
	});
}

/**
 * Create a minimal mock IFileSystem — only readVersionFile matters here;
 * the remaining port methods are unused stubs.
 */
function createMockFS(versionData: string | null): IFileSystem {
	return {
		readVersionFile: mockFn(() => Promise.resolve(versionData)),
		destinationExists: mockFn(() => Promise.resolve(false)),
		isWritable: mockFn(() => Promise.resolve(true)),
		isEmpty: mockFn(() => Promise.resolve(true)),
		writeVersionFile: mockFn(async () => {}),
		walkTemplateDirectory: mockFn(() => Promise.resolve([])),
		walkDestinationDirectory: mockFn(() => Promise.resolve([])),
	} as unknown as IFileSystem;
}

// ── Tests ─────────────────────────────────────────────────────────

describe("detectVersionContext", () => {
	test("returns 'missing' when version file does not exist (null)", async () => {
		const fs = createMockFS(null);
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("missing");
		expect(result.version).toBeNull();
		expect(result.installedPacks).toEqual([]);
	});

	test("returns 'v2.0+' for version 2.0.0 with installed packs", async () => {
		const fs = createMockFS(versionJSON("2.0.0", ["software-development", "business"]));
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("v2.0+");
		expect(result.version).toBe("2.0.0");
		expect(result.installedPacks).toEqual(["software-development", "business"]);
	});

	test("returns 'pre-2.0.0' for version 1.2.0", async () => {
		const fs = createMockFS(versionJSON("1.2.0"));
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("pre-2.0.0");
		expect(result.version).toBe("1.2.0");
		expect(result.installedPacks).toEqual([]);
	});

	test("returns 'pre-1.2.0' for version 1.1.0", async () => {
		const fs = createMockFS(versionJSON("1.1.0"));
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("pre-1.2.0");
		expect(result.version).toBe("1.1.0");
		expect(result.installedPacks).toEqual([]);
	});

	test("returns 'missing' for malformed JSON (non-object)", async () => {
		const fs = createMockFS("not-valid-json");
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("missing");
		expect(result.version).toBeNull();
		expect(result.installedPacks).toEqual([]);
	});

	test("returns 'v2.0+' for version 3.0.0 (future major)", async () => {
		const fs = createMockFS(versionJSON("3.0.0", ["creative"]));
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("v2.0+");
		expect(result.version).toBe("3.0.0");
		expect(result.installedPacks).toEqual(["creative"]);
	});

	test("returns empty installedPacks for v1.x version (pre-v2.0)", async () => {
		const fs = createMockFS(versionJSON("1.2.0"));
		const result = await detectVersionContext(fs);

		expect(result.installedPacks).toEqual([]);
	});

	test("returns correct installedPacks when file contains v2.0 format with packs", async () => {
		const packs = ["software-development", "finance", "creative"];
		const fs = createMockFS(versionJSON("2.1.0", packs));
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("v2.0+");
		expect(result.installedPacks).toEqual(packs);
	});

	test("returns 'missing' when version file contains null (edge case)", async () => {
		// readVersionFile returns null when file doesn't exist
		const fs = createMockFS(null);
		const result = await detectVersionContext(fs);

		expect(result.status).toBe("missing");
	});
});
