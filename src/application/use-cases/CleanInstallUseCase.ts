/**
 * Mode 1: Clean Install — overwrites everything in the destination
 * with the complete template. No classification rules applied;
 * all files are treated as Obligatorio.
 */
export class CleanInstallUseCase {
	/**
	 * Execute a clean installation of the full template.
	 * @param destinationPath - Target directory for installation.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async execute(_destinationPath: string): Promise<void> {
		// TODO: Implement clean install flow
		// 1. Validate destination is writable
		// 2. Confirm with user if destination not empty
		// 3. Stage all template files
		// 4. Atomic rename staging to destination
		// 5. Write .codice-version file
	}
}
