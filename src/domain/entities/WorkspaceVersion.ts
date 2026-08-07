import { eq, gt, lt, compare as semverCompare, valid } from "semver";
import type { ComparisonResult } from "../types/version";

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
		/** Pack IDs selected via the installer wizard (v2.0), e.g. ["software-development"] */
		public readonly installedPacks: readonly string[] = [],
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
	 * Accepts both the v2.0 "version" field and the legacy v1.x
	 * "installedVersion" field for backward compatibility.
	 * Throws if the object is malformed.
	 */
	static fromJSON(data: unknown): WorkspaceVersion {
		if (typeof data !== "object" || data === null) {
			throw new Error(
				`Invalid .codice-version file: expected a JSON object at root, received ${typeof data}`,
			);
		}

		const obj = data as Record<string, unknown>;
		const versionField = obj.version ?? obj.installedVersion;

		if (typeof versionField !== "string") {
			throw new Error(
				`Invalid .codice-version file: field 'version' must be a version string (e.g. "1.0.0"), received ${typeof versionField}`,
			);
		}
		if (!valid(versionField)) {
			throw new Error(
				`Invalid .codice-version file: field 'version' is not a valid semver version (e.g. "1.0.0"), received "${versionField}"`,
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

		// installedPacks is a v2.0 field: missing → none, present-but-malformed → fail fast.
		let installedPacks: readonly string[] = [];
		if (obj.installedPacks !== undefined) {
			if (!Array.isArray(obj.installedPacks)) {
				throw new Error(
					`Invalid .codice-version file: field 'installedPacks' must be an array of pack IDs (e.g. ["software-development"]), received ${typeof obj.installedPacks}`,
				);
			}
			installedPacks = obj.installedPacks.filter(
				(entry): entry is string => typeof entry === "string",
			);
		}

		return new WorkspaceVersion(
			versionField,
			obj.installedAt,
			installedPacks,
			Array.isArray(obj.optionalSelections)
				? obj.optionalSelections.filter((s): s is string => typeof s === "string")
				: [],
		);
	}

	/** Serialize to JSON (v2.0 format) for disk persistence. */
	toJSON(): Record<string, unknown> {
		return {
			version: this.version,
			installedPacks: [...this.installedPacks],
			installedAt: this.installedAt,
			optionalSelections: [...this.optionalSelections],
		};
	}
}
