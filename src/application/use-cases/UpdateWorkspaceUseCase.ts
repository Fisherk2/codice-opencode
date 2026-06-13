/**
 * Mode 3: Update Workspace — update an existing installation
 * to the latest template version. Only Obligatorio and Estándar
 * files are updated; Opcional files are preserved.
 */
export class UpdateWorkspaceUseCase {
  /**
   * Execute a workspace update.
   * @param destinationPath - Target directory to update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_destinationPath: string): Promise<void> {
    // TODO: Implement update workspace flow
    // 1. Check .codice-version for current version
    // 2. Query GitHub API for latest release
    // 3. Compare versions (skip if already latest)
    // 4. Apply only Obligatorio + Estándar rules
    // 5. Skip Opcional files entirely
    // 6. Stage files and atomic rename
    // 7. Update .codice-version file
  }
}
