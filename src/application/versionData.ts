/**
 * Pure parser for the `.codice-version` payload.
 *
 * This module exists so the parser lives outside the update flow: both the
 * update version gate (use-cases) and application helpers (legacy banner)
 * read the version file, and neither should import from a use-case flow
 * module for a pure parse.
 */

// Value import: WorkspaceVersion.fromJSON is a runtime static call, so a
// type-only import would be erased and throw "Cannot read properties of
// undefined" inside parseVersionData's try/catch.
import { WorkspaceVersion } from "../domain/entities/WorkspaceVersion";

/**
 * Parse and validate the `.codice-version` payload.
 *
 * Returns null when the file is absent, contains malformed JSON, or fails
 * WorkspaceVersion.fromJSON validation — all three are treated as "no
 * previous installation" by the update version gate.
 */
export function parseVersionData(rawData: string | null): WorkspaceVersion | null {
	if (rawData === null) return null;
	try {
		const parsed: unknown = JSON.parse(rawData);
		return WorkspaceVersion.fromJSON(parsed);
	} catch {
		return null;
	}
}
