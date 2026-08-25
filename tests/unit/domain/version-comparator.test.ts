import { describe, expect, test } from "bun:test";
import {
	VersionComparator,
	validateVersion,
	validateVersions,
} from "../../../src/domain/services/VersionComparator";

describe("VersionComparator instantiation", () => {
	test("creates instance with explicit constructor", () => {
		// REF: TECH_DEBT.md TD-1.2 — explicit constructor to fix Bun coverage artifact
		const instance = new VersionComparator();
		expect(instance).toBeInstanceOf(VersionComparator);
	});
});

const comparator = new VersionComparator();

describe("validateVersion", () => {
	test("returns valid normalized version for standard semver", () => {
		const result = validateVersion("1.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("1.0.0");
		}
	});

	test("returns valid normalized version for v-prefixed", () => {
		const result = validateVersion("v2.1.3");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("2.1.3");
		}
	});

	test("returns Failure for invalid version string", () => {
		const result = validateVersion("not-a-version");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toContain("Invalid version format");
			expect(result.error.message).toContain("not-a-version");
		}
	});

	test("returns Failure for empty string", () => {
		const result = validateVersion("");
		expect(result.ok).toBe(false);
	});
});

describe("validateVersions", () => {
	test("returns both normalized versions when both are valid", () => {
		const result = validateVersions("1.0.0", "2.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.localValid).toBe("1.0.0");
			expect(result.value.remoteValid).toBe("2.0.0");
		}
	});

	test("returns Failure when local is invalid (fail-fast)", () => {
		const result = validateVersions("bad", "2.0.0");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toContain("bad");
		}
	});

	test("returns Failure when remote is invalid", () => {
		const result = validateVersions("1.0.0", "bad");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toContain("bad");
		}
	});

	test("accepts v-prefixed versions for both", () => {
		const result = validateVersions("v1.0.0", "v2.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.localValid).toBe("1.0.0");
			expect(result.value.remoteValid).toBe("2.0.0");
		}
	});
});

describe("VersionComparator.compare", () => {
	test("returns 'ahead' when remote is greater than local", () => {
		const result = comparator.compare("1.0.0", "1.1.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("ahead");
		}
	});

	test("returns 'behind' when remote is lesser than local", () => {
		const result = comparator.compare("1.1.0", "1.0.0");
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe("behind");
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
			expect(result.value).toBe("ahead");
		}
	});
});

describe("VersionComparator cache", () => {
	test("sequential calls with identical arguments return the same result", () => {
		const cmp = new VersionComparator();
		const first = cmp.compare("1.0.0", "1.0.0");
		const second = cmp.compare("1.0.0", "1.0.0");
		expect(first.ok).toBe(true);
		expect(second.ok).toBe(true);
		if (first.ok && second.ok) {
			expect(first.value).toBe(second.value);
		}
	});

	test("deterministic result for a specific input pair across repeated calls", () => {
		const cmp = new VersionComparator();
		const r1 = cmp.compare("v2.3.4", "v2.3.5");
		const r2 = cmp.compare("v2.3.4", "v2.3.5");
		expect(r1).toEqual(r2);
	});

	test("caches validation — validateVersion not re-invoked on cache hit", () => {
		let validationCalls = 0;
		const wrapped = (v: string) => {
			validationCalls++;
			return validateVersion(v);
		};

		const cmp = new VersionComparator(wrapped);

		const first = cmp.compare("1.0.0", "1.1.0");
		expect(first.ok).toBe(true);
		expect(validationCalls).toBe(2); // local + remote

		const second = cmp.compare("1.0.0", "1.1.0");
		expect(second.ok).toBe(true);
		expect(validationCalls).toBe(2); // cache hit — no additional validation
		expect(first.ok && second.ok && first.value === second.value).toBe(true);
	});
});
