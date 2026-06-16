# ADR-003: Atomic File Operations via Staging + Rename

## Status
Accepted

## Context
The installer modifies user's project files. An interrupted operation (Ctrl+C, kill -9, power loss) must NEVER leave the project in a corrupted state.

## Decision
Implement atomic file writes using a staging directory pattern:
1. Create `.codice-staging/` directory in destination
2. Copy all files to staging directory first
3. Validate staging contents
4. Atomically rename staging to destination (fs.rename)
5. On SIGINT or error: delete staging directory, leave destination untouched

Per-file atomicity: For single-file overwrites, write to `.file.tmp` then rename.

## Consequences
### Positive
- Guaranteed consistency: destination is either fully updated or untouched
- Simple rollback: delete staging directory
- No journal files or complex state tracking
- Works across all supported platforms (Linux, macOS, Windows)

### Negative
- Requires 2x disk space during operation
- Rename may fail across filesystem boundaries (mitigated by creating staging in same directory)
- Slightly slower due to double copy

## Alternatives Considered
- **Journal-based rollback**: Rejected — complex, prone to journal corruption, harder to implement
- **In-place overwrite with backup**: Rejected — backup restoration is not atomic, partial failures possible
- **Git-based patching**: Rejected — requires Git dependency, not all users have Git

## References
- AGENTS.md §Atomicidad
- SPEC.md §Success Criteria SC-7, SC-8
