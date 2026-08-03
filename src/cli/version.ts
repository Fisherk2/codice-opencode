/**
 * Package version shared across CLI modules.
 *
 * Reads from package.json — works in all execution modes (bun run, bunx, npx).
 *
 * Extracted from output.ts so that the DI container (container.ts) can
 * import the version without depending on the presentation layer.
 * Both output.ts and container.ts import from this neutral module.
 *
 * Note: Compiled binary mode was removed in v1.2.0 (ADR-011).
 * The source-mode path is now the only resolution method.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import { version as pkgVersion } from "../../package.json";
export const VERSION: string = pkgVersion;
