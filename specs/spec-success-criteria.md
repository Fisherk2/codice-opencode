# Spec: Success Criteria

## Functional Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-1 | The interactive menu presents exactly three modes: Clean Install, Project Install, Update Workspace. | Manual inspection + E2E snapshot |
| SC-2 | Clean Install copies every file from `template/` to the destination, overwriting existing files of the same name. | E2E fixture comparison |
| SC-3 | Project Install copies Obligatorio files unconditionally, Estándar files only if absent, and Opcional files only if selected by user and absent. | Integration test with mock filesystem |
| SC-4 | Update Workspace copies only Obligatorio and Estándar files, skipping Opcional entirely, and performs a version check first. | E2E scenario with pre-seeded destination |
| SC-5 | The version check queries `https://api.github.com/repos/fisherk2/codice-opencode/releases/latest` and parses the tag name. | Integration test with mock HTTP server |
| SC-6 | If the local version equals the remote version, Update Workspace informs the user and exits without copying. | Unit test of VersionComparator + integration test |
| SC-7 | All file writes are atomic: staging directory created, files written to staging, then renamed to destination. | Integration test with forced interruption |
| SC-8 | An interrupted operation (Ctrl+C or kill) leaves the destination directory in its pre-operation state. | E2E test with `SIGINT` injection |

## Performance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-9 | Complete local installation (Clean Install) completes in < 5 seconds on a modern SSD. | E2E timing measurement |
| SC-10 | GitHub API version query completes in < 3 seconds or times out gracefully. | Integration test with delay injection |
| SC-11 | TUI menu renders and responds to input in < 100 milliseconds. | Manual / E2E perceived latency |

## Quality Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-12 | Unit test coverage exceeds 90% for domain layer. | `bun test --coverage` report |
| SC-13 | Overall test coverage exceeds 80%. | `bun test --coverage` report |
| SC-14 | All E2E tests pass in CI on Ubuntu latest runner. | GitHub Actions workflow execution |
| SC-15 | The npm package (tarball) size is < 5MB. | `npm pack --dry-run` size verification |
| SC-16 | The README contains copy-paste installation commands that a non-technical user can execute without modification. | Peer review by non-technical stakeholder |
| SC-17 | No `any` types exist in the production source code. | `tsc --noEmit` strict check |
| SC-18 | Path traversal attempts (e.g., destination containing `../../`) are rejected with exit code 1. | E2E security test |

## Documentation Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-19 | README includes installation instructions, usage examples for all three modes, and troubleshooting section. | Peer review |
| SC-20 | CHANGELOG.md exists and follows Keep a Changelog format with Added, Changed, Fixed, and Security sections. | Manual inspection |
| SC-21 | CI/CD badge is visible in README and reflects the current build status of the `main` branch. | Visual inspection of rendered README |

## v2.1 Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-22 | All 4 new commands (`/sync`, `/migrate`, `/deploy`, `/analyze`) are listed in CHANGELOG 2.1.0. | Manual / CI inspection |
| SC-23 | Agent delegation protocol (FEV-25) verified via tests. | `bun test` test suite |
| SC-24 | npm provenance SLSA v1 generated on release. | GitHub Actions release workflow execution |
