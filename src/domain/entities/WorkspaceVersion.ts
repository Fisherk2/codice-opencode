/**
 * Value object representing a semantic version (vX.Y.Z).
 * Wraps the semver library to enforce format validation
 * and provide comparison logic within the domain layer.
 */
export class WorkspaceVersion {
  constructor(
    /** Full version string, e.g. "1.0.0" */
    public readonly version: string,
    /** ISO timestamp of installation */
    public readonly installedAt: string,
    /** Optional list of paths the user selected during install */
    public readonly optionalSelections: readonly string[] = [],
  ) {}

  /**
   * Create a WorkspaceVersion from a raw JSON object.
   * Throws if the object is malformed.
   */
  static fromJSON(data: unknown): WorkspaceVersion {
    const obj = data as Record<string, unknown>;
    if (
      typeof obj.installedVersion !== "string" ||
      typeof obj.installedAt !== "string"
    ) {
      throw new Error("Invalid workspace version file format");
    }
    return new WorkspaceVersion(
      obj.installedVersion,
      obj.installedAt,
      Array.isArray(obj.optionalSelections)
        ? (obj.optionalSelections as string[])
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
