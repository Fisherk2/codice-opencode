/**
 * Unit tests for VersionComparator service.
 *
 * Tests version comparison, update availability detection,
 * and release type determination using the semver library.
 */

import { describe, expect, test } from "bun:test";
import { VersionComparator } from "../../../src/domain/services/VersionComparator";

const comparator = new VersionComparator();

describe("VersionComparator.compare", () => {
	test("returns 'newer' when remote is greater than local", () => {
		const result = comparator.compare("1.0.0", "1.1.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("newer");
		}
	});

	test("returns 'older' when remote is lesser than local", () => {
		const result = comparator.compare("1.1.0", "1.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("older");
		}
	});

	test("returns 'equal' when versions match", () => {
		const result = comparator.compare("1.0.0", "1.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("equal");
		}
	});

	test("returns Failure for invalid local version", () => {
		const result = comparator.compare("not-a-version", "1.0.0");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toContain("Invalid version format");
			expect(result.error.message).toContain("not-a-version");
		}
	});

	test("returns Failure for invalid remote version", () => {
		const result = comparator.compare("1.0.0", "abc.def.ghi");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toContain("Invalid version format");
			expect(result.error.message).toContain("abc.def.ghi");
		}
	});

	test("returns Failure for empty string", () => {
		const result = comparator.compare("", "1.0.0");
		expect(result.ok).toBe(false);
	});

	test("accepts v-prefixed versions", () => {
		const result = comparator.compare("v1.0.0", "v1.1.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("newer");
		}
	});
});

describe("VersionComparator.isUpdateAvailable", () => {
	test("returns true when remote is newer", () => {
		expect(comparator.isUpdateAvailable("1.0.0", "1.1.0")).toBe(true);
	});

	test("returns false when versions are equal", () => {
		expect(comparator.isUpdateAvailable("1.0.0", "1.0.0")).toBe(false);
	});

	test("returns false when local is newer than remote", () => {
		expect(comparator.isUpdateAvailable("1.1.0", "1.0.0")).toBe(false);
	});

	test("returns false when either version is invalid", () => {
		expect(comparator.isUpdateAvailable("bad", "1.0.0")).toBe(false);
		expect(comparator.isUpdateAvailable("1.0.0", "bad")).toBe(false);
	});
});

describe("VersionComparator.getReleaseType", () => {
	test("returns 'major' for major version bump", () => {
		const result = comparator.getReleaseType("1.0.0", "2.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("major");
		}
	});

	test("returns 'minor' for minor version bump", () => {
		const result = comparator.getReleaseType("1.0.0", "1.1.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("minor");
		}
	});

	test("returns 'patch' for patch version bump", () => {
		const result = comparator.getReleaseType("1.0.0", "1.0.1");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("patch");
		}
	});

	test("returns 'none' for equal versions", () => {
		const result = comparator.getReleaseType("1.0.0", "1.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("none");
		}
	});

	test("returns Failure for invalid local version", () => {
		const result = comparator.getReleaseType("bad", "1.0.0");
		expect(result.ok).toBe(false);
	});

	test("returns Failure for invalid remote version", () => {
		const result = comparator.getReleaseType("1.0.0", "bad");
		expect(result.ok).toBe(false);
	});

	test("returns 'major' for premajor version bump", () => {
		const result = comparator.getReleaseType("1.0.0", "2.0.0-pre.1");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe("major");
	});

	test("returns 'minor' for preminor version bump", () => {
		const result = comparator.getReleaseType("1.0.0", "1.1.0-pre.1");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe("minor");
	});

	test("returns 'patch' for prepatch version bump", () => {
		const result = comparator.getReleaseType("1.0.0", "1.0.1-pre.1");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe("patch");
	});
});
