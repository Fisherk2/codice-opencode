# Troubleshooting

This guide covers common issues you may encounter while using the Códice workspace installer and its generated workspace. Each entry follows a **Symptom → Cause → Solution** structure so you can quickly identify and resolve the problem.

If you do not find your issue here, check the [OpenCode FAQ](https://opencode.ai/docs/faq) or open a bug report on [GitHub Issues](https://github.com/fisherk2/codice-opencode/issues).

---

## 1. "Template file not found: opencode.json" when running via bunx

**Symptom:** Running `bunx @fisherk2-dev/codice` fails with:
```
[warn] Template file not found: opencode.json
```
The installer exits without showing the interactive menu.

**Cause:** The CLI uses a path detection cascade to find the embedded template directory. When executed via `bunx` (without a pinned version), the relative path calculation can point to the wrong directory depending on how bun resolves the scoped package. The bare invocation `bunx @fisherk2-dev/codice` is more susceptible to cache and resolution issues than a version-pinned invocation.

Another contributing factor is that the template root detection runs from `src/infrastructure/adapters/` but the template lives at the package root, so the `../../` calculation produces `src/template` instead of the correct `template/` directory. This was fixed across multiple releases (v1.0.5–v1.0.6) but can still surface with stale caches.

**Solution:** Pin the version explicitly:
```bash
bunx @fisherk2-dev/codice@latest
```

If that still fails, force a fresh download:
```bash
bunx --fresh @fisherk2-dev/codice@latest
```

As a secondary fallback, use `npx` instead:
```bash
npx @fisherk2-dev/codice
```

Both commands behave identically once running — the issue is limited to the initial template resolution step and does not affect functionality after installation.

---

## 2. "GitHub version check fails with 404" in Update Workspace

**Symptom:** When selecting **Update Workspace** mode, the installer displays:
```
⚠️  Warning: Could not check for updates via GitHub. Falling back to the bundled template version.
```
The version check returns HTTP 404.

**Cause:** The `GITHUB_REPO` constant in the installer source was set to `"11-codice-opencode"` (an internal working name) instead of the correct repository name `"codice-opencode"`. The GitHub API endpoint `GET /repos/fisherk2/11-codice-opencode/releases/latest` returns 404 because the repository is actually located at `fisherk2/codice-opencode`.

This was fixed in the v1.0.11 release (commit `a890d37`). The current version of the constant is:
```
GITHUB_REPO = "codice-opencode"
```
which correctly resolves to `https://api.github.com/repos/fisherk2/codice-opencode/releases/latest`.

**Solution:** Update to the latest Códice version, which ships with the corrected repository name:
```bash
bunx --fresh @fisherk2-dev/codice@latest
```

If you cannot upgrade (air-gapped system, pinned version), the version check is **non-blocking**. The installer falls back gracefully to the bundled template version and proceeds with the update using local files. You can manually check for releases at [github.com/fisherk2/codice-opencode/releases](https://github.com/fisherk2/codice-opencode/releases).

---

## 3. "Permission denied when writing files" during installation

**Symptom:** The installer fails partway through with an error like:
```
Error: Permission denied at /path/to/destination/.opencode/plugins/sdd-pipeline.ts
```
or the CLI exits with a non-zero code without copying any files.

**Cause:** The destination directory or one of its parent directories does not grant write permission to the current user. This commonly happens when:

- Installing into a system-owned location (e.g., `/usr/local`, `/opt`, `/etc`)
- Installing into a directory owned by `root` or another user
- The destination is on a read-only filesystem
- SELinux or AppArmor restrictions are in effect

**Solution:** Choose one of the following:

1. **Use a different destination** — Install into a user-owned directory where you have write permissions:
   ```bash
   codice --dest ~/projects/my-project
   ```

2. **Use sudo (temporary)** — Only recommended if you understand the security implications:
   ```bash
   sudo bunx @fisherk2-dev/codice --dest /opt/my-project
   ```

3. **Fix directory permissions** — Make the directory writable by your user:
   ```bash
   sudo chown -R $(whoami) /path/to/destination
   codice --dest /path/to/destination
   ```

The installer performs path containment validation and will never write outside the designated destination directory, even when run with elevated privileges.

---

## 4. "Clean Install warns about non-empty directory"

**Symptom:** Selecting **Clean Install** shows a warning:
```
⚠️ Destination directory is not empty. Clean Install will overwrite existing files.
Continue? (y/N)
```

**Cause:** Clean Install is designed for **fresh projects** — it copies the complete template (mandatory, standard, and optionally selected files) and overwrites anything that already exists at the destination. If the directory already contains files (e.g., an existing project, previous template files, or any other content), the installer warns you before proceeding.

**Solution:** You have three options depending on your goal:

| Goal | Action |
|------|--------|
| Start fresh, do not care about existing files | Type `y` to proceed. Clean Install will overwrite all matching files. |
| Preserve existing customizations | **Cancel** and use **Project Install** instead. Project Install only copies mandatory files unconditionally, preserves standard files if they already exist, and asks which optional files to include. |
| Preserve existing files permanently | Move or back up the existing files, then re-run Clean Install into the emptied directory. |

```bash
# Back up existing files first
mv my-project my-project.backup
mkdir my-project
bunx @fisherk2-dev/codice --dest my-project

# Or use Project Install to avoid overwrites
bunx @fisherk2-dev/codice --dest my-project --project
```

---

## 5. "Update Workspace doesn't update my files"

**Symptom:** After running **Update Workspace**, some template files that you expected to be updated (e.g., `README.md`, `AGENTS.md`) remain unchanged. Only a subset of files was copied.

**Cause:** This is by design, not a bug. The Update Workspace mode follows strict file classification rules:

| Classification | Behavior in Update Mode |
|---------------|------------------------|
| **Mandatory** (`obligatorio/`) | Always overwritten — core configuration, agents, commands, plugins |
| **Standard** (`estandar/`) | **Only copied if the file does not exist** in the destination. If it already exists, it is preserved as-is. |
| **Optional** (`opcional/`) | Skipped entirely — never touched during updates |

This means that if you have customized your `README.md` or `AGENTS.md` (both standard files), Update Workspace will **not** overwrite them. The same applies to standard directories like `docs/` and `specs/` — if the directory exists, the entire directory is skipped.

**Solution:** Accept this as a data-loss prevention mechanism. If you need new files from a standard directory that were added in a more recent template release, you must copy them manually:

1. Identify which new standard files exist in the latest template release:
   ```bash
   # Compare the template repository structure with your project
   # Files in template/estandar/ that don't exist in your project
   ```

2. Copy the new files manually:
   ```bash
   cp /path/to/new-template/estandar/new-file.md ./new-file.md
   ```

3. If you genuinely want the upstream version of a standard file (discarding your changes), delete it first and re-run Update Workspace.

---

## 6. "Symlinks are broken after installation"

**Symptom:** After installation, the `.opencode/agents`, `.opencode/commands`, or `.opencode/skills` directories are missing or are regular empty directories instead of symlinks. Running OpenCode fails with "agent not found" or "command not recognized".

**Cause:** The npm packaging system **strips symlinks** from published packages (tarballs). When Códice is installed via `bunx` or `npx`, the symlinks that normally point from `.opencode/` into `agents/`, `commands/`, and `skills/` are missing from the extracted package. The Códice installer generates these symlinks during a **post-installation step**, but if the installation was interrupted or the post-install step failed (e.g., permission issue), the symlinks will be absent.

The affected symlinks are:

| Target in `.opencode/` | Points to |
|------------------------|-----------|
| `.opencode/agents` | `../agents` |
| `.opencode/commands` | `../commands` |
| `.opencode/skills` | `../skills` |

Additionally, if the `.devin/` optional directory was selected, inner symlinks (`.devin/skills`, `.devin/workflows`, `.devin/rules/*`) may also be missing.

**Solution:** Re-run the installer in force mode to regenerate all symlinks without overwriting your existing template files:

```bash
bunx @fisherk2-dev/codice --force --mode clean
```

The `--force` flag skips confirmation prompts, and `--mode clean` ensures the full post-installation generation step runs. This will:

1. Re-copy mandatory files (safe — they always match the current template)
2. Re-generate all symlinks in `.opencode/` and (if applicable) `.devin/`
3. Preserve your existing standard and optional files

If symlinks are consistently missing after every install, verify that your project directory is writable by the current user (see Issue #3 above).

---

## General Diagnostics

### Check your Códice version
```bash
bunx @fisherk2-dev/codice --version
```

### Enable verbose logging
```bash
bunx @fisherk2-dev/codice --verbose
```
Verbose mode prints structured log lines to stderr showing every operation, decision, and external call. Include this output when reporting bugs.

### Verify installed files
After installation, confirm the key files and symlinks exist:
```bash
ls -la .opencode/agents .opencode/commands .opencode/skills
# Expected output: all three should show as symbolic links
# lrwxrwxrwx ... .opencode/agents -> ../agents
```

---

## Still stuck?

- **[OpenCode FAQ](https://opencode.ai/docs/faq)** — General questions about OpenCode itself (configuration, models, permissions, providers)
- **[GitHub Issues](https://github.com/fisherk2/codice-opencode/issues)** — Report bugs, request features, or search existing issues for solutions
- **When reporting a bug**, include:
  - Your operating system and version
  - Códice version (`codice --version`)
  - How you ran the installer (bunx, npx, or binary)
  - The full output with `--verbose` flag
  - Steps to reproduce the issue
