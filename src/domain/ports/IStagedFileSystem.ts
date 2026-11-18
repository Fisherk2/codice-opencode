import type { IFileSystem } from "./IFileSystem";
import type { IStagingSystem } from "./IStagingSystem";

/**
 * The staged-filesystem contract: full filesystem access plus atomic
 * staging — the intersection every merge/install consumer depends on.
 */
export type IStagedFileSystem = IFileSystem & IStagingSystem;
