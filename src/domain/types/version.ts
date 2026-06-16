/**
 * Result of comparing two semantic versions.
 * - "newer": Local version is less than the remote (update available).
 * - "older": Local version is greater than the remote (downgrade scenario).
 * - "equal": Both versions are identical.
 */
export type ComparisonResult = "newer" | "older" | "equal";
