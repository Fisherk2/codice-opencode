/**
 * Value object representing a semantic version (vX.Y.Z).
 * TODO: Wrap the semver library to enforce format validation
 * and provide comparison logic within the domain layer.
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
		if (typeof obj.installedAt !== "string") {
			throw new Error(
				`Invalid .codice-version file: field 'installedAt' must be an ISO 8601 timestamp string, received ${typeof obj.installedAt}`,
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
