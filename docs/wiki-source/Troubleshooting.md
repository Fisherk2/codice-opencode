# Troubleshooting

This guide covers common issues you may encounter while using the Códice workspace installer and its generated workspace. Each entry follows a **Symptom → Cause → Solution** structure so you can quickly identify and resolve the problem.

If you do not find your issue here, check the [OpenCode V2 troubleshooting guide](https://opencode.ai/v2/docs/troubleshooting/) or open a bug report on [GitHub Issues](https://github.com/fisherk2/codice-opencode/issues).

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

## 2. "Update Workspace is blocked" or "Pre-1.2.0 Installation Detected"

**Symptom:** When selecting **Update Workspace**, the installer shows one of these notes (verbatim from `src/application/versionInfoMessages.ts` and `versionGateMessages.ts`):

```
ℹ️  No Installation Detected
No previous Códice installation found.
Update is not available — use Clean Install or Project Install.
```

```
⚠️  Pre-1.2.0 Installation Detected
Detected pre-1.2.0 installation (v1.1.0).
We recommend deleting references/ and .devin/ directories before reinstalling.
Update is not available — use Clean Install or Project Install.
```

```
⚠️  Pre-2.0.0 Installation Detected
Detected v1.x installation (v1.5.0).
The update system has changed in v2.0.0. Please reinstall using Clean Install or Project Install to adopt the new pack system.
```

The update stops without copying files.

**Cause:** Starting with v2.0.0, Update Workspace is **version-gated** — it only runs on v2.0+ installations. The installer reads `.codice-version` on startup and classifies the installation:

| Detected state | Behavior |
|----------------|----------|
| No `.codice-version` file | Blocked — guides you to reinstall |
| Version < 1.2.0 | Blocked — suggests cleaning up `references/` and `.devin/` before reinstalling |
| v1.2.0 ≤ version < 2.0.0 | Blocked — guides you to reinstall with Clean/Project Install |
| v2.0.0+ | Normal — Option A (current packs) or Option B (add packs) |
| v2.0.0 – 2.1.2 | Normal, but the version note also prints `⚠ Opencode Legacy only — upgrade to ≥ 2.1.3 for native Opencode V2 support` — those installs predate native V2 support (`src/application/legacyBanner.ts:15-18`, ADR-022) |
| GitHub API unreachable | **Not** a block: the update warns `Could not check for updates via GitHub. Falling back to the bundled template version.` and continues using the template bundled in the package you just ran (`src/infrastructure/adapters/GitHubRestClient.ts:15-17`, `src/application/use-cases/updateStatusCheck.ts:30-34`) |

This is by design, not a bug. The update system was redesigned in v2.0.0 to support the pack system (ADR-014) and cannot operate on legacy v1.x installations.

**Solution:** Reinstall using Clean Install or Project Install:

```bash
# Clean Install (fresh start — overwrites everything):
bunx @fisherk2-dev/codice --clean

# Project Install (preserves existing customizations):
bunx @fisherk2-dev/codice --project
```

After reinstalling, your `.codice-version` will record v2.0+ and future updates will work normally. Your existing standard files (e.g., customized `README.md`) are preserved with Project Install.

---

## 3. "Permission denied when writing files" during installation

**Symptom:** The installer fails partway through with an error like:
```
Error: Permission denied at /path/to/destination/opencode.json
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
   bunx @fisherk2-dev/codice --dest ~/projects/my-project
   ```

2. **Use sudo (temporary)** — Only recommended if you understand the security implications:
   ```bash
   sudo bunx @fisherk2-dev/codice --dest /opt/my-project
   ```

3. **Fix directory permissions** — Make the directory writable by your user:
   ```bash
   sudo chown -R $(whoami) /path/to/destination
   bunx @fisherk2-dev/codice --dest /path/to/destination
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
| **Mandatory** (`obligatorio/`) | Always overwritten — core configuration, agents, commands |
| **Standard** (`estandar/`) | Existing **files** are preserved as-is. Existing **directories** (`docs/`, `specs/`, `tasks/`) are diffed file-by-file against the template and only the files your project is missing get copied |
| **Optional** (`opcional/`) | Skipped entirely — update rules filter optional entries out (`src/application/use-cases/UpdateWorkspaceUseCase.ts:126-128`) |

So a customized `README.md` is never overwritten, and new files a release adds inside a standard directory **do** arrive — whole directories are no longer skipped (`src/domain/services/stagePlanner.ts:33-51`). The skip message you see when a directory genuinely has nothing new is `No new files in directory` (`src/domain/services/mergeRules.ts:18-22`).

What update mode will not do is overwrite an existing standard file whose upstream content changed — your copy always wins.

**Solution:** Nothing to do for new files inside `docs/` or `specs/` — the update copies them. Two manual cases remain:

1. You want the upstream version of a standard file, discarding your edits: delete your copy and re-run Update Workspace. The file is then missing, so it gets copied.
2. You want to know what changed upstream without deleting anything: diff your file against `template/estandar/` in the repository at the release tag you updated to.

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

**Solution:** Recreate the links with **Project Install**, never with Clean Install.

First clear whatever occupies the link path, because the installer deliberately leaves existing content alone:

- A real directory at `.opencode/agents` is **skipped, not replaced**, with `[warn] Skipping symlink creation: … is a real directory. Remove the directory and re-run to create the symlink.` (`src/infrastructure/adapters/BunSymlinkCreator.ts:113-121`).
- An existing symlink — even a broken one — is skipped idempotently (`BunSymlinkCreator.ts:108-111`), so remove it too if the target moved.

```bash
rmdir .opencode/agents .opencode/commands .opencode/skills   # empty placeholder dirs
rm .opencode/agents                                          # or a broken symlink, one per path
```

Then re-run Project Install, which performs the post-install step that creates the three links (`src/application/postInstall.ts:145-152`):

```bash
bunx @fisherk2-dev/codice --dest . --project
```

Project Install re-copies the **mandatory** payload (`opencode.json`, `agents/`, `commands/`, `skills/`) and leaves your existing **standard** files alone — a standard rule is staged only when the destination is missing (`src/domain/services/stagePlanner.ts:73-76`). Back up any local edits to `opencode.json` first: it is mandatory, so it is overwritten.

> **⚠️ Do not use `--force --clean` (or plain `--clean`) for this.** Clean Install marks every manifest rule mandatory — "overwrite destination regardless of existing state" — and `--force` auto-selects all 10 packs and all optional files without asking (`src/application/use-cases/CleanInstallUseCase.ts:2-4,40-41,57,66-67`). It overwrites your `README.md`, `AGENTS.md`, `docs/` and `specs/` content. No flag regenerates symlinks on their own.

If you would rather not re-copy any payload file, create the links by hand — they are plain relative symlinks, exactly what the installer writes (`BunSymlinkCreator.ts:187-188`):

```bash
ln -s ../agents   .opencode/agents
ln -s ../commands .opencode/commands
ln -s ../skills   .opencode/skills
```

On Windows, create them from an elevated or developer-mode terminal with `mklink /D .opencode\agents ..\agents` (same relative target form).

If symlinks are consistently missing after every install, verify that your project directory is writable by the current user (see Issue #3 above).

---

## 7. "MCP server is not connecting" or "MCP tools not showing up"

**Symptom:** After enabling an MCP server in `opencode.json` and restarting OpenCode, the server's tools do not appear in the agent's tool list. Running `opencode mcp list` shows the server with a warning or error status.

**Cause:** Several common scenarios:

| Symptom | Likely Cause |
|---------|--------------|
| Server shows "not connected" | Missing dependency (e.g., `uv` not installed for Excel/Jupyter MCP) |
| Server starts but tools timeout | Network issues for remote servers; slow startup for local servers |
| Chrome DevTools MCP fails | Chrome is not running with `--remote-debugging-port=9222` |
| MCP tools interfere with other servers | Too many servers enabled simultaneously, exhausting context |

**Solution:**

1. **Verify prerequisites** — Each MCP server has specific requirements. See [MCP Servers](MCP-Servers) for per-server prerequisites (Python packages, Chrome, Docker, etc.).

2. **Check server status** — Run the OpenCode MCP diagnostics command:
   ```bash
   opencode mcp list
   ```
   This shows all configured servers and their connection status.

3. **Test the MCP server directly** — For local servers, run the command in your terminal to verify it starts correctly:
   ```bash
   # Chrome DevTools MCP
   npx -y chrome-devtools-mcp@1.7.0 --auto-connect

   # Excel MCP
   uvx excel-mcp-server stdio

   # Jupyter MCP
   uvx mcp-jupyter-notebook
   ```

4. **Increase the timeout** — If a server is slow to start or respond (common for remote servers), add a per-server `timeout` object. V2 separates the purposes — defaults: `startup` 30s, `catalog` 30s, `execution` 12h:
   ```json
   {
     "mcp": {
       "servers": {
         "my-server": {
           "type": "remote",
           "url": "https://my-server.com/mcp",
           "timeout": {
             "startup": 45000,
             "catalog": 45000
           }
         }
       }
     }
   }
   ```

5. **Check for port conflicts** — Chrome DevTools MCP requires port 9222. Verify no other process is using it:
   ```bash
   lsof -i :9222
   ```

6. **Disable other MCP servers temporarily** — Isolate connectivity issues by disabling all MCP servers except the one you are testing. Set `"disabled": true` for others in `opencode.json`.

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

- **[OpenCode Troubleshooting Guide](https://opencode.ai/v2/docs/troubleshooting/)** — Official service, log, and diagnostics reference (V2 has no separate FAQ page)
- **[GitHub Issues](https://github.com/fisherk2/codice-opencode/issues)** — Report bugs, request features, or search existing issues for solutions
- **When reporting a bug**, include:
  - Your operating system and version
  - Códice version (`bunx @fisherk2-dev/codice --version`)
  - How you ran the installer (bunx or npx)
  - The full output with `--verbose` flag
  - Steps to reproduce the issue
