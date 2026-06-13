import type { Result } from "../../domain/types/Result";

/**
 * Mode 1: Clean Install — overwrites everything in the destination
 * with the complete template. No classification rules applied;
 * all files are treated as Obligatorio.
 */
export class CleanInstallUseCase {
	/**
	 * Execute a clean installation of the full template.
	 * @param destinationPath - Target directory for installation.
	 * @returns Result indicating success or a structured error.
	 */
	async execute(_destinationPath: string): Promise<Result<void, Error>> {
		// TODO: Implement clean install flow
		throw new Error("Not implemented");
	}
}
