/**
 * MergeError → Error wrapping for use-case result contracts.
 *
 * @module
 */

import type { MergeError } from "../domain/types/MergeError";

/**
 * Wrap a domain MergeError into a generic Error with enriched context.
 *
 * MergeError carries structured phase/path information that would be lost
 * when converting to the generic Error returned by use cases. Appending
 * phase and (when known) path keeps the user-facing message actionable.
 */
export function wrapMergeError(err: MergeError): Error {
	const context = err.path ? ` during ${err.phase} of ${err.path}` : ` during ${err.phase}`;
	return new Error(`${err.message}${context}`);
}
