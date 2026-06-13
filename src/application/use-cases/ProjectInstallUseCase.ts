import type { Result } from "../../domain/types/Result";

/**
 * Mode 2: Project Install — selectively merge template files
 * into an existing project. Preserves user customizations
 * by applying classification rules.
 */
export class ProjectInstallUseCase {
	/**
	 * Execute a project installation with selective merge.
	 * @param destinationPath - Target directory for installation.
	 * @returns Result indicating success or a structured error.
	 */
	async execute(_destinationPath: string): Promise<Result<void, Error>> {
		// TODO: Implement project install flow
		throw new Error("Not implemented");
	}
}
