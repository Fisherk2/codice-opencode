# Spec: File Classification Rules (FileRules)

**Project:** Códice – Opencode Workspace Installer  
**Version:** 1.0.0  
**Status:** Approved  
**Author:** Fisherk2  
**Date:** 2026-06-13  
**Scope:** Domain Entity Definition  

---

## 1. Overview

This specification defines the **File Classification System**, a core domain entity (`FileRule`) that governs how every file and directory inside the `template/` source tree is handled during the three installer modes: **Clean Install**, **Project Install**, and **Update**.

The system partitions the template into **three mutually exclusive categories**:

| Category | Spanish Name | Copy Behavior | Conflict Resolution |
|----------|-------------|---------------|-------------------|
| **Mandatory** | Obligatorio | Always copy | **Overwrite** destination |
| **Standard** | Estándar | Copy if missing | **Skip** (preserve user version) |
| **Optional** | Opcional | Copy if user opts-in AND missing | **Skip** if user opts-out or file exists |

> **Design Principle:** The classification is **static** (hard-coded per release) and **hierarchical**. A directory inherits the most restrictive category of any child that deviates, but individual files inside may override the parent when explicitly listed.

---

## 2. Detailed Classification Table

### 2.1 Root-Level Files

| File | Category | Rationale |
|------|----------|-----------|
| `opencode.json` | **Obligatorio** | Core workspace configuration; must stay in sync with installer logic. |
| `skills-lock.json` | **Obligatorio** | Lockfile for reproducible skill resolution; installer manages it. |
| `AGENTS.md` | **Estandar** | Project-specific agent instructions; user may customize. |
| `CHANGELOG.md` | **Estandar** | Project history; user owns content. |
| `CONTRIBUTING.md` | **Estandar** | Contribution guidelines; user may tailor. |
| `LICENSE` | **Estandar** | Legal text; user may replace with their own. |
| `README.md` | **Estandar** | Project readme; user will overwrite with project-specific content. |
| `SPEC.md` | **Estandar** | Specification document; user may extend. |
| `.env.example` | **Estandar** | Environment template; user may expand variables. |
| `Justfile` | **Opcional** | Task runner; not all users need `just`. |
| `Makefile` | **Opcional** | Alternative task runner; mutually exclusive with `Justfile` for many teams. |
| `requirements.txt` | **Opcional** | Python dependencies; only relevant for Python-based workspaces. |

### 2.2 Root-Level Directories

| Directory | Category | Rationale |
|-----------|----------|-----------|
| `agents/` | **Obligatorio** | Agent definitions are installer-managed. |
| `commands/` | **Obligatorio** | Command schemas are installer-managed. |
| `.opencode/` | **Obligatorio** | Core OpenCode configuration directory. |
| `skills/` | **Obligatorio** | Skill definitions are installer-managed. |
| `references/` | **Obligatorio** | Reference files are installer-managed. |
| `scripts/` | **Opcional** | Utility scripts; user may add their own. |
| `tasks/` | **Estandar** | Task definitions; user may extend. |
| `docs/` | **Estandar** (with exceptions) | General documentation; see §2.3. |
| `specs/` | **Estandar** (with exceptions) | Specifications; see §2.4. |

### 2.3 `docs/` Directory – Mixed Category

The `docs/` directory is **Estandar** by default, but contains **Opcional** exceptions:

| Path | Category | Rationale |
|------|----------|-----------|
| `docs/` (directory itself) | **Estandar** | Container for project documentation. |
| `docs/DESIGN.md` | **Opcional** | High-level design doc; user may prefer their own format. |
| `docs/SCHEMA.md` | **Opcional** | Schema reference; user may generate from code instead. |
| `docs/opencode/` | **Opcional** | OpenCode-specific docs; user may not need them. |
| `docs/*` (any other file) | **Estandar** | All other documentation files follow Standard rules. |

> **Merge Rule for Mixed Directories:** When processing `docs/`, the engine walks the tree. The directory is created if missing (Standard behavior). Each child is then evaluated against its own `FileRule`. A child marked Opcional inside an Estandar parent does **not** force the parent to become Obligatorio.

### 2.4 `specs/` Directory – Mixed Category

| Path | Category | Rationale |
|------|----------|-----------|
| `specs/` (directory itself) | **Estandar** | Container for project specifications. |
| `specs/design/` | **Opcional** | Design-specific specs; user may manage design elsewhere. |
| `specs/*` (any other file/dir) | **Estandar** | All other spec files follow Standard rules. |

### 2.5 `.opencode/` Directory – Mixed Category

| Path | Category | Rationale |
|------|----------|-----------|
| `.opencode/` (directory itself) | **Obligatorio** | Core configuration directory. |
| `.opencode/plugins/` | **Obligatorio** | Plugin directory inherits parent category. |
| `.opencode/plugins/sdd-workflow-test.md` | **Opcional** | Test workflow spec; only needed for SDD validation. |
| `.opencode/*` (any other file) | **Obligatorio** | All other OpenCode config files are mandatory. |

---

## 3. Merge Behavior Rules

### 3.1 Obligatorio (Mandatory)

```
IF source_exists AND destination_exists:
    OVERWRITE destination with source
    LOG: "[OBLIGATORIO] Overwritten: <path>"
ELIF source_exists AND NOT destination_exists:
    COPY source to destination
    LOG: "[OBLIGATORIO] Created: <path>"
ELSE:
    // source missing — should never happen in a valid template
    ERROR: "Template integrity violation: missing mandatory <path>"
```

**Properties:**
- **Idempotent:** Running twice produces the same result.
- **Destructive:** User modifications to these files are **lost** on every update.
- **Atomic:** Overwrites happen inside the staging directory; the original is preserved until `fs.rename()` succeeds.

### 3.2 Estandar (Standard)

```
IF source_exists AND destination_exists:
    SKIP
    LOG: "[ESTANDAR] Preserved: <path>"
ELIF source_exists AND NOT destination_exists:
    COPY source to destination
    LOG: "[ESTANDAR] Created: <path>"
ELSE:
    // source missing — acceptable (e.g., user deleted from template)
    LOG: "[ESTANDAR] Source missing, skipped: <path>"
```

**Properties:**
- **Non-destructive:** Never overwrites user content.
- **First-install only:** Acts as a "seed" for new projects.
- **Silent on conflict:** No prompt; the user's version wins automatically.

### 3.3 Opcional (Optional)

```
IF user_selected_skip:
    SKIP entirely
    LOG: "[OPCIONAL] Skipped by user: <path>"
ELIF user_selected_include:
    IF source_exists AND destination_exists:
        SKIP
        LOG: "[OPCIONAL] Preserved (exists): <path>"
    ELIF source_exists AND NOT destination_exists:
        COPY source to destination
        LOG: "[OPCIONAL] Created: <path>"
    ELSE:
        LOG: "[OPCIONAL] Source missing, skipped: <path>"
```

**Properties:**
- **User-driven:** Requires explicit opt-in via TUI checklist.
- **Non-destructive:** Even when included, never overwrites existing files.
- **Reversible:** User can re-run installer and change their selection; previously copied files remain, skipped ones can be added later.

---

## 4. Edge Cases & Resolution

### 4.1 Mixed-Category Directories

**Scenario:** `docs/` is Estandar, but `docs/DESIGN.md` is Opcional.

**Resolution:**
1. The directory `docs/` is created if missing (Standard behavior — no overwrite if exists).
2. Each file inside is evaluated independently:
   - `docs/README.md` → Standard rules.
   - `docs/DESIGN.md` → Optional rules (prompt user).
   - `docs/ARCHITECTURE.md` → Standard rules.

**Important:** The presence of an Obligatorio file inside an Estandar directory **does not** upgrade the entire directory. Only that specific file is treated as Obligatorio. Example: if a future release adds `docs/REQUIRED.md` as Obligatorio, only that file overwrites; other docs remain Standard.

### 4.2 Directory vs. File Conflict

**Scenario:** Source has a file `agents/` (malformed template), but destination has a directory `agents/`.

**Resolution:**
- Detect type mismatch before any operation.
- **Abort** with actionable error: `"Type mismatch at <path>: source is file, destination is directory. Manual resolution required."`
- Do **not** attempt automatic recovery to prevent data loss.

### 4.3 Symlinks

**Scenario:** Template or destination contains symbolic links.

**Resolution:**
- **Follow symlinks** in the source (copy the target content, not the link itself).
- **Preserve symlinks** in the destination if they point within the workspace.
- If a symlink in the destination would be overwritten by an Obligatorio file, resolve the symlink first, then overwrite the resolved file.

### 4.4 Empty Directories

**Scenario:** Template contains an empty directory (e.g., `tasks/` with no files yet).

**Resolution:**
- **Standard/Obligatorio:** Create the empty directory in destination if missing.
- **Optional:** Only create if user opted-in AND the directory is explicitly listed in the optional checklist. Empty optional directories are **not** created unless the user selects them.

### 4.5 File Permissions

**Scenario:** Source file has executable bit set (e.g., `scripts/setup.sh`).

**Resolution:**
- **Preserve permissions** from source during copy.
- On Windows, ignore POSIX permission bits and rely on file extension associations.
- Log permission preservation in `--verbose` mode.

### 4.6 Case Sensitivity (Cross-Platform)

**Scenario:** Template has `readme.md` (lowercase), destination has `README.md` (uppercase) on a case-insensitive filesystem (macOS/Windows).

**Resolution:**
- Normalize to **lowercase** for comparison on case-insensitive filesystems.
- Treat as the same file; apply Standard rules (skip if exists).
- Log: `"[ESTANDAR] Case-insensitive match preserved: <path>"`.

---

## 5. Validation Rules

### 5.1 Template Integrity Check (Pre-Install)

Before any installation begins, the engine validates the template directory:

| Check | Severity | Action on Failure |
|-------|----------|-------------------|
| All Obligatorio paths exist in template | **Fatal** | Abort with `"Template incomplete: missing mandatory <path>"` |
| No path is classified in more than one category | **Fatal** | Abort with `"Classification conflict at <path>: <cat1> vs <cat2>"` |
| No unknown paths exist in template without a rule | **Warning** | Log `"Unclassified path in template: <path>. Treating as Estandar."` |
| All Opcional paths are leaf files or directories | **Info** | Log for audit; no action required |
| Directory classifications are consistent with children | **Warning** | Log `"Directory <dir> is Estandar but contains Obligatorio child <child>. Ensure this is intentional."` |

### 5.2 Destination Safety Check (Pre-Install)

| Check | Severity | Action on Failure |
|-------|----------|-------------------|
| Destination path is writable | **Fatal** | Abort with `"Permission denied: <path>. Check directory permissions."` |
| Destination is within allowed root (Path Traversal) | **Fatal** | Abort with `"Path traversal detected: <path> is outside workspace."` |
| No ongoing staging directory from previous failed run | **Warning** | Prompt user: `"Stale staging directory found. Clean up? (Y/n)"` |

### 5.3 Post-Install Verification

After `fs.rename()` completes:

| Check | Method |
|-------|--------|
| All Obligatorio files exist in destination | `fs.existsSync()` per path |
| File hashes of copied Obligatorio files match source | `Bun.hash.file()` comparison |
| No staging directory remains | `fs.rmdirSync(stagingDir, { recursive: true })` then verify absence |
| Destination directory count matches expected | Count files per category and compare against manifest |

### 5.4 Classification Manifest Format

The `FileRule` entity is serialized as a manifest for validation:

```typescript
interface FileRule {
  path: string;           // Relative to template/
  category: "mandatory" | "standard" | "optional";
  isDirectory: boolean;   // true for dirs, false for files
  description: string;    // Human-readable rationale
}

type ClassificationManifest = FileRule[];
```

**Example entry:**
```json
{
  "path": "opencode.json",
  "category": "mandatory",
  "isDirectory": false,
  "description": "Core workspace configuration managed by installer"
}
```

---

## 6. Versioning Implications

### 6.1 Update Mode Behavior

In **Update Workspace** mode, the installer queries the remote latest release and compares it with the local version. The classification system determines **which files are eligible for update**:

| Category | Updated in Update Mode? | Behavior |
|----------|------------------------|----------|
| **Obligatorio** | ✅ Yes | Always overwritten with latest template version. |
| **Estandar** | ❌ No | Never touched; user's project-specific content is preserved. |
| **Opcional** | ⚠️ Conditional | Only if user re-runs installer and changes selection; existing optional files are never overwritten. |

### 6.2 Version Bump Scenarios

**Scenario A: Patch Release (e.g., v1.0.0 → v1.0.1)**
- Typically only Obligatorio files change (bug fixes in `opencode.json`, agent updates).
- Update mode is safe and non-destructive for user content.

**Scenario B: Minor Release (e.g., v1.0.0 → v1.1.0)**
- May add new Standard files (e.g., new `docs/WORKFLOW.md`).
- New Standard files are copied if missing; existing ones remain untouched.
- May add new Optional files; user is prompted on next run.

**Scenario C: Major Release (e.g., v1.0.0 → v2.0.0)**
- May reclassify files (rare, breaking change).
- If a file moves from Standard → Obligatorio, it will start being overwritten.
- **Migration notice required:** Major releases must document any classification changes in release notes.

### 6.3 Local Version Tracking

The installer writes a `.codice-version` file to the destination root (Obligatorio, hidden):

```json
{
  "installedVersion": "1.0.0",
  "installedAt": "2026-06-13T10:00:00Z",
  "optionalSelections": [
    "Justfile",
    "docs/DESIGN.md"
  ]
}
```

This file enables:
- **Idempotent updates:** Re-running the same version is a no-op for Obligatorio files (hash check).
- **Optional recall:** Pre-checks the same optional items on subsequent runs.
- **Audit trail:** Support and debugging.

### 6.4 Rollback Considerations

Because Obligatorio files are overwritten, the staging directory preserves the pre-update state:

```
staging/
├── new/          # Files from new template version
└── backup/       # Snapshot of destination before any change
```

If the update fails after `fs.rename()`, the backup can be restored. Standard and Optional files are never in `backup/` because they are never modified.

---

## 7. TUI Checklist Integration

### 7.1 Optional Items Presentation

When the user selects **Project Install** or **Update** mode, the TUI presents optional items grouped by category:

```
? Select optional files to include: (Press <space> to select, <a> to toggle all)

 ◯ Build & Task Runners
   ◯ Justfile
   ◯ Makefile

 ◯ Dependencies
   ◯ requirements.txt

 ◯ Documentation
   ◯ docs/DESIGN.md
   ◯ docs/SCHEMA.md
   ◯ docs/opencode/

 ◯ Testing & Workflow
   ◯ .opencode/plugins/sdd-workflow-test.md

 ◯ Design Specs
   ◯ specs/design/
```

### 7.2 Default Selections

- **All Optional items are unchecked by default.**
- The user must explicitly opt-in.
- Previous selections from `.codice-version` are **pre-checked** in Update mode for convenience.

### 7.3 Validation

- At least one item must be selected if the user is in Project Install mode and wants optional content (otherwise, the mode is equivalent to Clean Install).
- Mutually exclusive items (e.g., `Justfile` and `Makefile`) are **not** enforced at the UI level; the installer copies both if selected, but logs a warning.

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Template** | The source directory containing the canonical workspace files shipped with the installer. |
| **Destination** | The target directory where the workspace is being installed or updated. |
| **Staging** | A temporary directory where all file operations are performed before atomic promotion. |
| **Obligatorio** | Classification for files that are installer-managed and always overwritten. |
| **Estandar** | Classification for files that seed a new project but are never modified thereafter. |
| **Opcional** | Classification for files that require explicit user consent to be copied. |
| **FileRule** | The domain entity encapsulating the classification of a single path. |
| **Merge Engine** | The service (`FileMergeEngine`) that applies `FileRule` classifications during installation. |

---

## 9. Related Specifications

- [Spec: FileMergeEngine](./spec-merge-engine.md) — Algorithmic details of the merge process.
- [Spec: AtomicFileWriter](./spec-atomic-writer.md) — Staging and atomic promotion mechanics.
- [Spec: VersionComparator](./spec-version-comparator.md) — Semantic version comparison for Update mode.
- [Spec: TUI / ClackPromptsAdapter](./spec-tui.md) — Interactive checklist implementation.

---

## 10. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-13 | Initial specification. Defined 3-category system, complete hierarchy, merge behaviors, edge cases, validation rules, and versioning implications. |

---

*End of Spec: File Classification Rules*
