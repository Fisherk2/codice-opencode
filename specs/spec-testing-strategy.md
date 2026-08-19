# Spec: Testing Strategy

Testing is organized in three phases with distinct scopes, tools, and success criteria.

## Phase 1: Unit Tests

**Scope:** Pure domain logic — entities, value objects, and domain services.  
**Location:** `tests/unit/`  
**Tool:** `bun:test`  
**Patterns:**
- Arrange-Act-Assert (AAA) structure in every test.
- One assertion concept per test; multiple expect calls allowed if testing one logical outcome.
- Fixtures as plain objects, not file system trees.
- Mocking limited to injecting test doubles via constructor parameters (no global mocks).

**Targets:**
- `FileRule` entity correctly classifies files and validates rule types.
- `WorkspaceVersion` value object parses `vX.Y.Z`, rejects invalid formats, compares correctly.
- `FileMergeEngine` applies the correct strategy (Obligatorio overwrites, Estándar skips existing, Opcional respects user choice).
- `VersionComparator` returns `newer`, `older`, `equal`, `incompatible` results.

**Success Criteria:**
- > 90% code coverage.
- Execution time < 1 second for the full unit suite.
- Zero dependencies on Bun runtime APIs or file system.

## Phase 2: Integration Tests

**Scope:** Adapter behavior with mocked external systems.  
**Location:** `tests/integration/`  
**Tool:** `bun:test` with manual mocks and temporary directories.  
**Patterns:**
- `BunFileSystem` tested against real temporary directories created in `beforeAll` and destroyed in `afterAll`.
- `GitHubRestClient` tested with a local HTTP server or fetch mock returning predefined JSON payloads.
- `ClackPromptsAdapter` tested by simulating input streams and capturing output.

**Targets:**
- Atomic staging: a write operation creates a staging file, then renames it to the target. If interrupted, target remains untouched.
- GitHub API timeout: a request exceeding 3 seconds returns a domain timeout error.
- GitHub API error mapping: 404 returns "release not found", 403 returns "rate limited", network failure returns "unreachable".
- TUI signal handling: `SIGINT` during a prompt cleans up any active staging directory.

**Success Criteria:**
- > 70% coverage of infrastructure adapters.
- All filesystem tests use isolated temporary paths.
- All network tests do not hit the real GitHub API.

## Phase 3: End-to-End (E2E) Tests

**Scope:** CLI behavior in isolated environments.  
**Location:** `tests/e2e/`  
**Tool:** Bash scripts (`bash` or `zx`) that orchestrate the CLI.  
**Patterns:**
- Each test creates a fresh temporary directory as the "project".
- The CLI is executed via `bun run src/cli/main.ts` (local development) or `bunx @fisherk2-dev/codice` (published package).
- Tests invoke the CLI with environment variables to mock GitHub API responses or use `--skip-version-check` flag.
- Post-execution assertions verify directory contents, file existence, and absence of corruption.

**Scenarios:**
1. **Clean Install:** Run CLI in empty directory. Assert all template files exist in destination.
2. **Project Install (Selective):** Pre-populate destination with a file that also exists in template/estandar. Assert the existing file is preserved, not overwritten.
3. **Project Install (Optional Skip):** Present optional files, simulate skipping one. Assert skipped file is absent, others are present.
4. **Update Workspace:** Pre-populate with older version. Run update mode. Assert only obligatorio and estandar files are updated; optional files untouched.
5. **Atomic Rollback (SIGINT):** Simulate a crash mid-operation. Assert destination directory is in its original state, staging directory is absent or cleaned.
6. **Path Traversal Rejection:** Attempt to install to a path outside the allowed base using `../` sequences. Assert exit code 1 and no files written outside boundary.
7. **Symlinks Clean Install:** Run CLI in empty directory. Assert all 3 symlinks exist and resolve correctly.
8. **Symlinks Project Install:** Run project install with `--force`. Assert `.opencode/` symlinks exist.
9. **Symlinks Idempotency:** Run CLI twice in the same directory. Assert symlinks are created only once and remain valid.
10. **Update No Symlinks:** Run update mode on an existing installation. Assert no symlinks are created or modified.
11. **Gitignore Clean Install:** Run CLI in empty directory. Assert `.gitignore` exists in destination with correct content.
12. **Gitignore Project Install:** Pre-populate destination with an existing `.gitignore`. Run project install. Assert existing `.gitignore` is preserved, not overwritten.
13. **Clean Install Optional Menu:** Run clean install. Assert optional files menu is presented to the user before copying.
14. **Project Install Optional Selection:** Run project install with optional files. Assert only selected optional files are copied.
15. **Update Workspace Existing Project:** Pre-populate destination with standard files. Run update mode. Assert standard files are NOT overwritten (only mandatory files are).
16–30. **Additional E2E scenarios (v2.0.0):** Update blocked pre-1.2.0, update Option B, flat agents destination, non-interactive packs, project install packs, pack-aware project install, clean-install summary passthrough, version-context classification, and related pack system integration scenarios.
31. **v2.1.0 Commands Installed:** Run clean install and verify the 4 new v2.1.0 commands (`/sync`, `/migrate`, `/deploy`, `/analyze`) exist in `.opencode/commands` and are reachable. Total: 31 E2E scenarios.

**Success Criteria:**
- All 31 E2E scenarios pass in CI on Ubuntu runner.
- Exit codes validated for success (0) and failure (1).
- No test leaves artifacts in the repository workspace.
