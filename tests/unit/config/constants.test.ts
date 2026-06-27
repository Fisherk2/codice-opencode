/**
 * Unit tests for constants module.
 *
 * Tests getGitHubApiUrl() across all validation paths:
 * - Default when env var is not set
 * - Valid HTTPS github.com overrides
 * - Invalid protocol fallback (HTTP)
 * - Non-github hostname fallback
 * - Malformed URL fallback
 */

import { afterEach, describe, expect, test } from "bun:test";
import { getGitHubApiUrl } from "../../../src/infrastructure/config/constants";

// NOTE: GITHUB_REPO was "11-codice-opencode" (wrong — returned 404 on API calls).
// Corrected to "codice-opencode" as part of FEV-3.
// See: src/infrastructure/config/constants.ts:5
const DEFAULT_URL = "https://api.github.com/repos/fisherk2/codice-opencode/releases/latest";

describe("getGitHubApiUrl", () => {
	const ORIGINAL_ENV = process.env.CODICE_GITHUB_API_URL;

	afterEach(() => {
		// Restore original env var after each test
		process.env.CODICE_GITHUB_API_URL = ORIGINAL_ENV;
	});

	test("returns default URL when env var is not set", () => {
		delete process.env.CODICE_GITHUB_API_URL;
		const result = getGitHubApiUrl();
		expect(result).toBe(DEFAULT_URL);
	});

	test("returns default URL when env var is empty string", () => {
		process.env.CODICE_GITHUB_API_URL = "";
		const result = getGitHubApiUrl();
		expect(result).toBe(DEFAULT_URL);
	});

	describe("CODICE_BYPASS_URL_VALIDATION", () => {
		const ORIGINAL_BYPASS = process.env.CODICE_BYPASS_URL_VALIDATION;

		afterEach(() => {
			process.env.CODICE_BYPASS_URL_VALIDATION = ORIGINAL_BYPASS;
		});

		test("bypass returns env var for HTTP localhost (E2E mock server)", () => {
			const mockUrl = "http://localhost:4567";
			process.env.CODICE_BYPASS_URL_VALIDATION = "true";
			process.env.CODICE_GITHUB_API_URL = mockUrl;
			const result = getGitHubApiUrl();
			expect(result).toBe(mockUrl);
		});

		test("bypass returns env var for any arbitrary URL", () => {
			const mockUrl = "http://not-github.com/api";
			process.env.CODICE_BYPASS_URL_VALIDATION = "true";
			process.env.CODICE_GITHUB_API_URL = mockUrl;
			const result = getGitHubApiUrl();
			expect(result).toBe(mockUrl);
		});

		test("bypass is NOT triggered when set to non-true value", () => {
			process.env.CODICE_BYPASS_URL_VALIDATION = "false";
			process.env.CODICE_GITHUB_API_URL = "http://api.github.com/repos/test/repo/releases/latest";
			const result = getGitHubApiUrl();
			// Falls back because http:// fails validation
			expect(result).toBe(DEFAULT_URL);
		});

		test("bypass is NOT triggered when unset, even for valid URL", () => {
			delete process.env.CODICE_BYPASS_URL_VALIDATION;
			const validUrl = "https://api.github.com/repos/fisherk2/11-codice-opencode/releases/latest";
			process.env.CODICE_GITHUB_API_URL = validUrl;
			const result = getGitHubApiUrl();
			expect(result).toBe(validUrl);
		});
	});

	describe("valid override (HTTPS github.com)", () => {
		test("returns override for full canonical URL", () => {
			const overrideUrl =
				"https://api.github.com/repos/fisherk2/11-codice-opencode/releases/latest";
			process.env.CODICE_GITHUB_API_URL = overrideUrl;
			const result = getGitHubApiUrl();
			expect(result).toBe(overrideUrl);
		});

		test("returns override for github.com subdomain", () => {
			const overrideUrl = "https://my-mirror.github.com/custom/path";
			process.env.CODICE_GITHUB_API_URL = overrideUrl;
			const result = getGitHubApiUrl();
			expect(result).toBe(overrideUrl);
		});

		test("returns override for exact github.com hostname", () => {
			const overrideUrl = "https://github.com";
			process.env.CODICE_GITHUB_API_URL = overrideUrl;
			const result = getGitHubApiUrl();
			expect(result).toBe(overrideUrl);
		});

		test("returns override for deeply nested subdomain", () => {
			const overrideUrl = "https://a.b.c.github.com/api/v1";
			process.env.CODICE_GITHUB_API_URL = overrideUrl;
			const result = getGitHubApiUrl();
			expect(result).toBe(overrideUrl);
		});
	});

	describe("fallback to default", () => {
		test("falls back for HTTP protocol URL", () => {
			process.env.CODICE_GITHUB_API_URL = "http://api.github.com/repos/test/repo/releases/latest";
			const result = getGitHubApiUrl();
			expect(result).toBe(DEFAULT_URL);
		});

		test("falls back for non-github hostname", () => {
			process.env.CODICE_GITHUB_API_URL = "https://evilgithub.com/api";
			const result = getGitHubApiUrl();
			expect(result).toBe(DEFAULT_URL);
		});

		test("falls back for malformed URL", () => {
			process.env.CODICE_GITHUB_API_URL = "not-a-url";
			const result = getGitHubApiUrl();
			expect(result).toBe(DEFAULT_URL);
		});

		test("falls back for HTTPS hostname that ends with .github.com but is not actually github.com", () => {
			// This is a subdomain of evilgithub.com, NOT a subdomain of github.com
			// It passes hostname.endsWith(".github.com") but we test the negation:
			// evilgithub.com does NOT end with .github.com
			process.env.CODICE_GITHUB_API_URL = "https://subdomain.evilgithub.com/api";
			const result = getGitHubApiUrl();
			expect(result).toBe(DEFAULT_URL);
		});
	});
});
