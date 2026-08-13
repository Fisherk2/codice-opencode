// ---------------------------------------------------------------------------
// frontmatter.test.ts — Unit tests for parseFieldFromFrontmatter()
//
// Directly exercises the whitespace/empty/delimiter branches that are only
// hit indirectly through autoDiscovery/intentDiscovery: missing delimiters,
// empty frontmatter blocks, and whitespace-only values (closes the coverage
// gap flagged in the /ship review).
// ---------------------------------------------------------------------------

import { describe, expect, test } from "bun:test";
import { FRONTMATTER_REGEX, parseFieldFromFrontmatter } from "../frontmatter";

/** Caller-style field regex: `/^description:\s*(.+)$/m` (see intentDiscovery.ts). */
const DESCRIPTION_FIELD_REGEX = /^description:\s*(.+)$/m;

/** A field regex without `\s*`, so a trailing-whitespace value is captured. */
const LOOSE_DESCRIPTION_FIELD_REGEX = /^description:(.*)$/m;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("frontmatter.ts — FRONTMATTER_REGEX", () => {
	test("1. Matches a complete frontmatter block", () => {
		const match = "---\nagent: backend-developer\n---\n".match(FRONTMATTER_REGEX);
		expect(match).not.toBeNull();
		expect(match![1]).toBe("agent: backend-developer");
	});

	test("2. Matches an empty frontmatter block (blank content line)", () => {
		// `---\n---` with no content line does not match — the regex requires
		// `\n---` after the (possibly empty) content, so an empty block must
		// have at least a blank line between the delimiters.
		const match = "---\n\n---\n".match(FRONTMATTER_REGEX);
		expect(match).not.toBeNull();
		expect(match![1]).toBe("");
	});

	test("3. Does not match delimiters with no blank line between them", () => {
		expect("---\n---\n".match(FRONTMATTER_REGEX)).toBeNull();
	});

	test("4. Matches a block with CRLF line endings", () => {
		const match = "---\r\ndescription: hello\r\n---\r\n".match(FRONTMATTER_REGEX);
		expect(match).not.toBeNull();
		expect(match![1]).toContain("description: hello");
	});
});

describe("frontmatter.ts — parseFieldFromFrontmatter()", () => {
	// ── Happy path ──────────────────────────────────────────────────────────
	test("5. Returns the trimmed value when the field is present", () => {
		const content = "---\ndescription:   hello world   \n---\nignored body";
		const result = parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX);
		expect(result).toBe("hello world");
	});

	test("6. Matches the first field line only", () => {
		const content = "---\ndescription: first\nother: x\ndescription: second\n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBe("first");
	});

	// ── Missing delimiter ───────────────────────────────────────────────────
	test("7. Returns null when the closing delimiter is missing", () => {
		const content = "---\ndescription: hello\nno closing marker";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	test("8. Returns null when the opening delimiter is missing", () => {
		const content = "description: hello\n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	test("9. Returns null when the delimiters are adjacent (no content line)", () => {
		const content = "---\n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	// ── Empty frontmatter block ─────────────────────────────────────────────
	test("10. Returns null for an empty frontmatter block", () => {
		const content = "---\n\n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	test("11. Returns null for a whitespace-only frontmatter block", () => {
		const content = "---\n   \n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	// ── Field absent ────────────────────────────────────────────────────────
	test("12. Returns null when the field is absent", () => {
		const content = "---\nagent: backend-developer\n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	// ── Empty / whitespace-only value ───────────────────────────────────────
	test("13. Returns null when the field has an empty value", () => {
		const content = "---\ndescription:\n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	test("14. Returns null when the field value is whitespace only", () => {
		const content = "---\ndescription:    \n---\n";
		// The loose regex captures the trailing spaces, which trim to empty —
		// this exercises the rawValue.trim() length guard (frontmatter.ts:48).
		expect(parseFieldFromFrontmatter(content, LOOSE_DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	test("15. Returns null when the field value is whitespace only (caller regex)", () => {
		const content = "---\ndescription:    \n---\n";
		// With `\s*(.+)` the trailing space is still captured in group 1 —
		// `$` matches the line end — so the value reaches the trim guard and
		// trims to empty, exercising the same branch as the loose regex above.
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBeNull();
	});

	// ── Field value trimming ────────────────────────────────────────────────
	test("16. Trims the value even when it spans trailing whitespace", () => {
		const content = "---\ndescription:  lead   \n---\n";
		expect(parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX)).toBe("lead");
	});
});
