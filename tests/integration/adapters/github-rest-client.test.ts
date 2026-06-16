import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { GitHubRestClient } from "../../../src/infrastructure/adapters/GitHubRestClient";

/**
 * Integration tests for GitHubRestClient.
 * Uses mocked fetch to simulate API responses without real network calls.
 */
describe("GitHubRestClient", () => {
	const API_URL = "https://api.github.com/repos/test/test/releases/latest";
	const TIMEOUT_MS = 3_000;

	let client: GitHubRestClient;
	let originalFetch: unknown;

	beforeEach(() => {
		// Save original fetch
		originalFetch = globalThis.fetch;

		// Create client with test URL
		client = new GitHubRestClient(API_URL, TIMEOUT_MS);
	});

	afterEach(() => {
		// Restore original fetch
		globalThis.fetch = originalFetch as typeof globalThis.fetch;
	});

	/**
	 * Helper to mock globalThis.fetch with a resolved response.
	 * Cast is needed because Bun's fetch type includes extra properties (preconnect).
	 */
	function mockFetchOnce(response: Response): void {
		globalThis.fetch = mock(() => Promise.resolve(response)) as unknown as typeof globalThis.fetch;
	}

	/**
	 * Helper to mock globalThis.fetch with a rejected promise.
	 */
	function mockFetchError(error: Error): void {
		globalThis.fetch = mock(() => Promise.reject(error)) as unknown as typeof globalThis.fetch;
	}

	describe("getLatestReleaseTag", () => {
		it("should return the tag name from a successful response", async () => {
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "v1.2.3" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBe("v1.2.3");
		});

		it("should accept pre-release semver tags", async () => {
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "v2.0.0-beta.1" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBe("v2.0.0-beta.1");
		});

		it("should accept pre-release tags with rc suffix", async () => {
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "v1.5.0-rc.2" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBe("v1.5.0-rc.2");
		});

		it("should reject non-semver tag names", async () => {
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "release-2024-06" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should reject tag with invalid format", async () => {
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "latest" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should return null on 404 response", async () => {
			mockFetchOnce(new Response("Not Found", { status: 404 }));

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should return null on 403 rate limit response", async () => {
			mockFetchOnce(new Response("Rate Limited", { status: 403 }));

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should return null on network failure", async () => {
			mockFetchError(new Error("Network unreachable"));

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should return null on malformed JSON", async () => {
			mockFetchOnce(
				new Response("not json", {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should return null when tag_name is missing", async () => {
			mockFetchOnce(
				new Response(JSON.stringify({ id: 123 }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should return null on non-JSON response body", async () => {
			mockFetchOnce(
				new Response(null, {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should reject oversized response via content-length header", async () => {
			// 2 MB declared content-length exceeds the 1 MB limit
			const oversizedHeaders = new Headers({
				"Content-Type": "application/json",
				"content-length": String(2 * 1024 * 1024),
			});
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "v1.0.0" }), {
					status: 200,
					headers: oversizedHeaders,
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});

		it("should reject oversized response via actual body length", async () => {
			// Response body of 1.5 MB but content-length is missing/lying
			const bigBody = "x".repeat(2 * 1024 * 1024);
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "v1.0.0", data: bigBody }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const tag = await client.getLatestReleaseTag();
			expect(tag).toBeNull();
		});
	});

	describe("getLatestReleaseNotes", () => {
		it("should return the release body text", async () => {
			mockFetchOnce(
				new Response(
					JSON.stringify({
						tag_name: "v1.0.0",
						body: "## Release Notes\n\n- Feature A\n- Bug fix B",
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				),
			);

			const notes = await client.getLatestReleaseNotes();
			expect(notes).toBe("## Release Notes\n\n- Feature A\n- Bug fix B");
		});

		it("should return null when body is missing", async () => {
			mockFetchOnce(
				new Response(JSON.stringify({ tag_name: "v1.0.0" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const notes = await client.getLatestReleaseNotes();
			expect(notes).toBeNull();
		});

		it("should return null on HTTP error", async () => {
			mockFetchOnce(new Response("Server Error", { status: 500 }));

			const notes = await client.getLatestReleaseNotes();
			expect(notes).toBeNull();
		});
	});

	describe("timeout behavior", () => {
		it("should return null when request exceeds timeout", async () => {
			// Create a client with very short timeout
			const fastTimeoutClient = new GitHubRestClient(API_URL, 10);

			// Custom implementation needed to respect AbortSignal
			globalThis.fetch = mock(
				(_url: string, options?: { signal?: AbortSignal }) =>
					new Promise<void>((_resolve, reject) => {
						const timer = setTimeout(() => {
							// If abort doesn't fire, we reject (but it should fire at 10ms)
							reject(new Error("Should have been aborted"));
						}, 100);

						// Respect the AbortSignal from GitHubRestClient
						if (options?.signal) {
							options.signal.onabort = () => {
								clearTimeout(timer);
								reject(new DOMException("The operation was aborted", "AbortError"));
							};
						}
					}),
			) as unknown as typeof globalThis.fetch;

			const tag = await fastTimeoutClient.getLatestReleaseTag();
			expect(tag).toBeNull();
		}, 5000); // Give 5s for this test
	});
});
