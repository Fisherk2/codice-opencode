/**
 * Mode 2: Project Install — selectively merge template files
 * into an existing project. Preserves user customizations
 * by applying classification rules.
 */
export class ProjectInstallUseCase {
	/**
	 * Execute a project installation with selective merge.
	 * @param destinationPath - Target directory for installation.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async execute(_destinationPath: string): Promise<void> {
		// TODO: Implement project install flow
		// 1. Validate destination is writable
		// 2. Apply classification rules:
		//    - Obligatorio: copy unconditionally
		//    - Estándar: copy only if missing
		//    - Opcional: prompt user via checklist
		// 3. Stage selected files
		// 4. Atomic rename staging to destination
		// 5. Write .codice-version file
	}
}
