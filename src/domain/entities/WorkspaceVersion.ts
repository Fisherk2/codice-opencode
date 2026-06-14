import { eq, gt, lt, compare as semverCompare, valid } from "semver";

/**
 * Result of comparing a local and remote version.
 * - "newer": Local version is greater than the remote.
 * - "older": Local version is less than the remote.
 * - "equal": Both versions are identical.
 */
export type ComparisonResult = "newer" | "older" | "equal";

/**
 * Value object representing a semantic version (vX.Y.Z).
 * Uses the semver library for version parsing and comparison.
 */
export class WorkspaceVersion {
	constructor(
		/** Full version string, e.g. "1.0.0" */
		public readonly version: string,
		/**
		 * ISO 8601 timestamp of installation (e.g. "2026-06-13T12:00:00.000Z")
		 */
		public readonly installedAt: string,
		/** Optional list of paths the user selected during install */
		public readonly optionalSelections: readonly string[] = [],
	) {}

	/**
	 * Returns true if this version is newer (greater) than the given version.
	 */
	isNewerThan(other: WorkspaceVersion): boolean {
		return gt(this.version, other.version);
	}

	/**
	 * Returns true if this version is older (less) than the given version.
	 */
	isOlderThan(other: WorkspaceVersion): boolean {
		return lt(this.version, other.version);
	}

	/**
	 * Returns true if this version equals the given version.
	 */
	equals(other: WorkspaceVersion): boolean {
		return eq(this.version, other.version);
	}

	/**
	 * Compare this version against another.
	 * Returns "newer" if this > other, "older" if this < other, "equal" if same.
	 */
	compare(other: WorkspaceVersion): ComparisonResult {
		const result = semverCompare(this.version, other.version);
		if (result > 0) return "newer";
		if (result < 0) return "older";
		return "equal";
	}

	/**
	 * Create a WorkspaceVersion from a raw JSON object.
	 * Throws if the object is malformed.
	 */
	static fromJSON(data: unknown): WorkspaceVersion {
		if (typeof data !== "object" || data === null) {
			throw new Error(
				`Invalid .codice-version file: expected a JSON object at root, received ${typeof data}`,
			);
		}

		const obj = data as Record<string, unknown>;

		if (typeof obj.installedVersion !== "string") {
			throw new Error(
				`Invalid .codice-version file: field 'installedVersion' must be a version string (e.g. "1.0.0"), received ${typeof obj.installedVersion}`,
			);
		}
		if (!valid(obj.installedVersion)) {
			throw new Error(
				`Invalid .codice-version file: field 'installedVersion' is not a valid semver version (e.g. "1.0.0"), received "${obj.installedVersion}"`,
			);
		}
		if (typeof obj.installedAt !== "string") {
			throw new Error(
				`Invalid .codice-version file: field 'installedAt' must be an ISO 8601 timestamp string, received ${typeof obj.installedAt}`,
			);
		}
		// Validate ISO 8601 format (e.g. "2026-06-13T12:00:00.000Z" or "2026-06-13T12:00:00Z")
		const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
		if (!iso8601Pattern.test(obj.installedAt)) {
			throw new Error(
				`Invalid .codice-version file: field 'installedAt' must be an ISO 8601 timestamp (e.g. "2026-06-13T12:00:00.000Z"), received "${obj.installedAt}"`,
			);
		}

		return new WorkspaceVersion(
			obj.installedVersion,
			obj.installedAt,
			Array.isArray(obj.optionalSelections)
				? obj.optionalSelections.filter((s): s is string => typeof s === "string")
				: [],
		);
	}

	/** Serialize to JSON for disk persistence. */
	toJSON(): Record<string, unknown> {
		return {
			installedVersion: this.version,
			installedAt: this.installedAt,
			optionalSelections: [...this.optionalSelections],
		};
	}
}
