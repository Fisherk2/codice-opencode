#!/usr/bin/env bun
/**
 * Mock GitHub API server for Códice E2E tests.
 *
 * Serves a simulated GitHub releases/latest endpoint on a given port.
 * Responds to any GET request with the configured release data.
 *
 * Usage:
 *   bun run tests/e2e/mock-server.ts <port>
 *
 * Environment variables:
 *   MOCK_TAG_NAME  — The tag_name to return (default: "v1.0.0")
 *   MOCK_BODY      — The release body text (default: "Mock release for E2E testing")
 *
 * The server runs until the process receives SIGTERM or SIGINT.
 */

const port = Number(process.argv[2]) || 4567;

const tagName = process.env.MOCK_TAG_NAME ?? "v1.0.0";
const body = process.env.MOCK_BODY ?? "Mock release for E2E testing";

const releaseData = {
	tag_name: tagName,
	name: tagName,
	body,
	draft: false,
	prerelease: false,
	created_at: new Date().toISOString(),
	published_at: new Date().toISOString(),
	html_url: `https://github.com/fisherk2/11-codice-opencode/releases/tag/${tagName}`,
};

Bun.serve({
	port,
	fetch(_req: Request): Response {
		return new Response(JSON.stringify(releaseData), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});
	},
	error(_error: Error): Response {
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	},
});

// Signal readiness to parent process
console.error(`Mock GitHub API server listening on port ${port}`);
