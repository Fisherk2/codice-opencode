/**
 * Compiled-in binary version shared across CLI modules.
 *
 * Reads from package.json — works in source mode (bun run, bunx) and
 * compiled binary mode (package.json is bundled at compile time).
 *
 * Extracted from output.ts so that the DI container (container.ts) can
 * import the version without depending on the presentation layer.
 * Both output.ts and container.ts import from this neutral module.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import { version as pkgVersion } from "../../package.json";
export const VERSION: string = pkgVersion;
