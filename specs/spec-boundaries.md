# Spec: Boundaries

## Always

- **Validate inputs immediately.** Every path, version string, and user selection is validated at the point of entry. Fail fast with actionable error messages.
- **Use atomic file operations.** All writes that affect the user's project must go through the staging directory + rename pattern. No direct overwrites of existing user files.
- **Log structured output in verbose mode.** When `--verbose` is passed, emit timestamped, structured log lines to stderr describing every operation, decision, and external call.
- **Respect the classification rules.** Obligatorio files are always copied. Estándar files are copied only if missing. Opcional files are copied only if the user explicitly selects them and the file is missing.
- **Check version in Update mode.** Before executing an update, query the GitHub API for the latest release, compare with the local version, and inform the user if they are already up to date.
- **Clean up on exit.** On normal completion or `SIGINT`, remove any staging directories created during the session.
- **Prevent path traversal.** Resolve all paths and verify the destination remains within the intended project directory before any write operation.
- **Run agent delegation protocol for primary agents** (v2.1) — every non-trivial `task()` call must include deterministic instructions, skills to load, and goal checklist.

## Ask First

- **Overwriting existing files in Clean Install mode.** If the destination directory is not empty, warn the user and require confirmation before deleting or overwriting anything.
- **Copying Optional files in Project Install mode.** Present a checkbox list of all optional files. Only copy those the user selects. If the user deselects all, copy none.
- **Proceeding when GitHub API is unreachable.** If the version check fails due to network issues, ask whether to continue with the local template or abort.
- **Installing into a directory that does not look like a project.** If the destination lacks expected markers (e.g., no `.git` directory, no `package.json`), ask for confirmation that the user selected the correct path.

## Never

- **Never execute arbitrary code from the template.** Do not run shell scripts, eval JavaScript, or execute binaries embedded in the template directory. The installer is a file copier, not a script runner.
- **Never hardcode absolute paths.** All paths must be constructed with `path.join()` or `path.resolve()`. No `/home/user/...` or `C:\Users\...` literals in source code.
- **Never ignore errors silently.** Every caught exception or error result must be logged, mapped to a user-facing message, and propagated up the call stack until handled.
- **Never use `any` in TypeScript.** All variables, parameters, and return values must have explicit types. Use `unknown` with guards when necessary.
- **Never log secrets or tokens.** If GitHub authentication tokens are supported in the future, they must never appear in logs, even in verbose mode.
- **Never modify files outside the designated destination directory.** The installer must not touch parent directories, sibling directories, or system paths.
- **Never depend on the order of unrelated module initialization.** Avoid temporal coupling. All dependencies must be explicitly injected.
- **Never duplicate logic.** Extract shared behavior into domain services or utility functions. Follow DRY.
- **Never write comments that state the obvious.** Comments must explain intent and rationale, not restate the code.
