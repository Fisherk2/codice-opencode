/**
 * Result of comparing two semantic versions, expressed from the subject's
 * perspective (the object whose compare() method was invoked):
 * - "newer": this version > other version.
 * - "older": this version < other version.
 * - "equal": Both versions are identical.
 *
 * Used by WorkspaceVersion.compare(other). For the remote-vs-local
 * perspective used by VersionComparator, see RemoteVersionStatus.
 */
export type ComparisonResult = "newer" | "older" | "equal";

/**
 * Result of comparing a remote version against a local version, expressed
 * from the remote's perspective:
 * - "ahead":  remote > local (an update is available).
 * - "behind": remote < local (local is ahead; downgrade scenario).
 * - "equal":  Both versions are identical.
 *
 * Distinct from ComparisonResult because the "newer"/"older" wording flips
 * its subject between WorkspaceVersion (this vs other) and VersionComparator
 * (remote vs local). Sharing one type across both silently inverts semantics.
 */
export type RemoteVersionStatus = "ahead" | "behind" | "equal";
