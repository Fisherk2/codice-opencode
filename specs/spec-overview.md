# Spec: Overview

## Progress

> **v2.0 Progress:** FEV-17 ✅ + FEV-18 ✅ (2026-08-04) + FEV-19 ✅ + FEV-20 ✅ (2026-08-05) + FEV-21 ✅ (2026-08-06) + FEV-22 ✅ (2026-08-06) + FEV-23 ✅ (2026-08-07) → **v2.0.0 released** (2026-08-07). FEV-23 (v2.0.0 Testing & Integration) is complete: 1920 tests, 30/30 E2E, coverage 95.68% overall / 99.12% production `src/`.
>
> **v2.1 Progress:** FEV-24 ✅ (2026-08-11) — 4 new commands (`/sync`, `/migrate`, `/deploy`, `/analyze`), SDD plugin intent auto-discovery, bilingual intent support. 2048 tests, 30/30 E2E. FEV-25 ✅ complete (agent delegation protocol). 2052 tests, 31/31 E2E.

---

## Objective

Códice is a command-line interface (CLI) tool built with Bun that installs and updates OpenCode workspace templates in an atomic, safe, and intelligent manner. It resolves the fragmentation and customization-loss problem that occurs when users manually merge template updates into existing projects.

### Problem Statement

OpenCode workspace templates evolve over time. Users currently face three painful scenarios:
1. **Clean setup:** A new user wants the latest template but must manually copy dozens of files.
2. **Existing project:** A user wants to adopt the template without overwriting their existing customizations.
3. **Update:** A user wants to pull the latest template improvements but fears losing their local modifications.

Códice automates all three scenarios with a single command, zero external dependencies at runtime, and guaranteed atomic operations.

### User Stories

- **US-1 (New User):** As a developer starting a new project, I want to run a single command that installs the complete OpenCode workspace template so that I can begin coding immediately without manual file copying.
- **US-2 (Existing Project):** As a developer with an existing project, I want to selectively merge template files using classification rules (Obligatorio/Estándar/Opcional) so that my existing customizations are preserved while I adopt the template structure.
- **US-3 (Updater):** As a developer who already uses the template, I want to update only the Standard and Obligatorio files after checking the latest GitHub release version so that I stay current without risking my Optional customizations.
- **US-4 (Non-Technical User):** As a user uncomfortable with CLI tools, I want copy-paste installation instructions and an interactive menu that guides me through each decision so that I never feel lost.
- **US-5 (Safety-Conscious User):** As a developer working on critical code, I want the guarantee that an interrupted update will never corrupt my project so that I can run the installer with confidence.
