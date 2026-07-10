# TODO: Fase FEV-8 — Obsidian Subagent (v1.2.0)

**Estado:** 🟡 Listo para implementar — 0/7 tareas ejecutadas
**Fecha:** 2026-07-10
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → FEV-2-D ✅ → FEV-3 ✅ → FEV-4 ✅ → FEV-5 ✅ → FEV-6 ✅ → FEV-7 ✅ → **FEV-8 🟡 Pendiente**
**Branch:** `feat/v1.2.0-fev-8` (basada en `main` con v1.1.0)
**Issue principal:** #21 (obsidian-vault-writer subagent + 6 skills)

---

## Contexto Rápido

**Issue #21** — Crear subagente especializado en administración de vaults de Obsidian + 6 skills de Obsidian/Markdown. El subagente opera en **dos modos** (Strategy pattern):

1. **Vault mode** (`.obsidian/` detectado + obsidian-cli disponible) — usa obsidian-cli
2. **Markdown-only mode** (fallback) — solo Bun.fs sobre archivos `.md`

**Restricciones resueltas con el usuario:**

| Restricción | Resolución |
|-------------|------------|
| ¿Quién invoca? | Solo Huitzilopochtli (restrictivo) |
| ¿Las 6 skills? | obsidian-cli-usage, obsidian-vault-structure, obsidian-frontmatter, obsidian-templater, obsidian-dataview, markdown-style-guide |
| ¿obsidian-cli? | Híbrido contextual (detección + fallback) |
| ¿Cómo instalar skills? | Vía `find-skills` skill a nivel de proyecto (no global) |

**Versión:** v1.2.0 (minor, aditiva).

---

## Tareas Pendientes

### 📋 Slice 1: Subagent Creation (Issue #21 — parte 1)

#### ✅ FEV8-T1: Create obsidian-vault-writer subagent
**Descripción:** Crear `template/obligatorio/agents/obsidian-vault-writer.md` con Strategy pattern (vault/markdown-only), Template Method (workflow 6 pasos), permisos restrictivos (`.md*` only + bash allowlist).

**Estructura del archivo:**

**YAML frontmatter:**
```yaml
---
description: "Specialized subagent for Obsidian vault administration and markdown file management. Invoked exclusively by Huitzilopochtli. Operates in vault mode (uses obsidian-cli when .obsidian/ is detected) or markdown-only mode (filesystem-only for non-vault projects). Triggers: 'obsidian', 'vault', 'dataview', 'templater', 'frontmatter', 'note organization', 'tag taxonomy', 'backlinks', 'graph view', 'markdown collection'."
mode: subagent
color: "#7C3AED"  # Obsidian purple
temperature: 0.2
hidden: true
permission:
  write:
    "*": deny
    "*.md": allow
    "*.mdx": allow
    "*.markdown": allow
  edit:
    "*": deny
    "*.md": allow
    "*.mdx": allow
    "*.markdown": allow
  bash:
    "obsidian *": ask
    "cat *": allow
    "head *": allow
    "tail *": allow
    "grep *": allow
    "find * -name *.md*": allow
    "which *": allow
    "pwd": allow
    "ls *": allow
  grep: allow
  glob: allow
  skill: allow
  todowrite: allow
  webfetch: allow
  websearch: allow
  question: allow
---
```

**Secciones del markdown (≤200 líneas total):**
1. `# Obsidian Vault Writer` — header
2. `## Operational Modes (Strategy Pattern)` — vault vs markdown-only
3. `## Workflow (Template Method)` — 6 pasos (detect → verify → load skills → execute → validate → report)
4. `## Skills` — lista de 6 skills
5. `## Restrictions` — 5+ bullets NEVER
6. `## Composition` — bloque estándar (Invoke directly when: Never. Invoke via: Huitzilopochtli)

**Criterios de Aceptación:**
- [ ] Archivo creado con YAML válido
- [ ] `mode: subagent`, `color: #7C3AED`, `temperature: 0.2`, `hidden: true`
- [ ] `write/edit` solo para `*.md*`; resto deny
- [ ] `bash` con allowlist por modo
- [ ] Secciones: Role, Modes, Workflow, Skills, Restrictions, Composition
- [ ] Tamaño ≤200 líneas

**Verificación:**
- [ ] `rg "mode: subagent" template/obligatorio/agents/obsidian-vault-writer.md` → 1 match
- [ ] `rg "Operational Modes" template/obligatorio/agents/obsidian-vault-writer.md` → 1 match
- [ ] `rg -c "NEVER" template/obligatorio/agents/obsidian-vault-writer.md` → ≥5 matches
- [ ] `wc -l template/obligatorio/agents/obsidian-vault-writer.md` ≤ 200
- [ ] `just check` — 0 errores
- [ ] `bun test` — 563/0 (sin regresión)

**Dependencias:** Ninguna (puede ejecutarse en paralelo con T2).
**Commit:** `feat(agents): add obsidian-vault-writer subagent with Strategy pattern (#21)`
**Scope:** M (1h).

---

### 📋 Slice 2: Skills Installation (Issue #21 — parte 2)

#### ✅ FEV8-T2: Search 6 Obsidian/Markdown skills via find-skills
**Descripción:** Usar `find-skills` skill (ubicada en `.opencode/skills/find-skills/`) para buscar las 6 skills necesarias. Documentar resultados en `tasks/fev8-skills-search.md`.

**Skills a buscar:**

| # | Skill name | Propósito |
|---|-----------|-----------|
| 1 | `obsidian-cli-usage` | Referencia de comandos CLI |
| 2 | `obsidian-vault-structure` | Organización de carpetas/notas |
| 3 | `obsidian-frontmatter` | YAML metadata schema |
| 4 | `obsidian-templater` | Templater script syntax |
| 5 | `obsidian-dataview` | Dataview query language |
| 6 | `markdown-style-guide` | Convenciones markdown |

**Proceso:**
1. Invocar `find-skills` skill
2. Para cada skill: buscar en catálogo público (Anthropic, skills.sh)
3. Si encontrada → descargar a `/tmp/opencode/obsidian-skills/`
4. Si NO encontrada → marcar como `to_create`
5. Documentar en `tasks/fev8-skills-search.md`

**Criterios de Aceptación:**
- [ ] Reporte de búsqueda: 6 skills × 2 fuentes = 12 búsquedas
- [ ] `tasks/fev8-skills-search.md` con tabla de resultados
- [ ] Skills encontradas: en `/tmp/opencode/obsidian-skills/`
- [ ] Cada skill encontrada tiene `SKILL.md` con frontmatter válido

**Verificación:**
- [ ] `ls /tmp/opencode/obsidian-skills/` contiene directorios de skills encontradas
- [ ] Cada SKILL.md tiene frontmatter `name` y `description`
- [ ] Reporte incluye: nombre, fuente (URL), versión

**Dependencias:** Ninguna (paralelo con T1).
**Commit:** `chore(skills): search 6 obsidian/markdown skills via find-skills (#21)`
**Scope:** S (30min).

---

#### ✅ FEV8-T3: Install/create 6 skills at project level
**Descripción:** Para cada una de las 6 skills:
- Si fue `found` en T2: copiar de `/tmp/opencode/obsidian-skills/` a `template/obligatorio/skills/<name>/`
- Si fue `to_create`: crear `template/obligatorio/skills/<name>/SKILL.md` desde cero

**Paso adicional (CONTRIBUTING.md "Add a New Skill"):** Tras instalar, actualizar `.opencode/skills/using-agent-skills/SKILL.md` — añadir las 6 skills al árbol "Skill Discovery" y la tabla "Quick Reference".

**Estructura de cada skill (80-150 líneas):**

```yaml
---
name: <skill-name>
description: <action verb + what it does>
---

# <Skill Title>

## Overview
<2-3 sentences>

## When to Use
<list of triggers>

## Process / Reference
<actionable content>

## Examples
<1-2 examples>

## Verification
<how to confirm>
```

**Criterios de Aceptación:**
- [ ] 6 skills en `template/obligatorio/skills/<skill-name>/SKILL.md`
- [ ] Cada skill tiene frontmatter válido
- [ ] Tamaño de cada skill: 80-150 líneas
- [ ] Skills `found`: instaladas con contenido original
- [ ] Skills `to_create`: siguen el formato estándar (verificable por comparación con `crafting-effective-readmes`)
- [ ] Nombres kebab-case
- [ ] `using-agent-skills/SKILL.md` actualizado con las 6 skills en árbol + tabla

**Verificación:**
- [ ] `ls template/obligatorio/skills/{obsidian-cli-usage,obsidian-vault-structure,obsidian-frontmatter,obsidian-templater,obsidian-dataview,markdown-style-guide}/SKILL.md` → 6 archivos
- [ ] `rg -c "^---$" template/obligatorio/skills/{obsidian,markdown}*` → cada skill tiene frontmatter
- [ ] `wc -l template/obligatorio/skills/{obsidian,markdown}*/SKILL.md` → todos 80-150 líneas
- [ ] `just check` — 0 errores
- [ ] `bun test` — sin regresión

**Dependencias:** FEV8-T2.
**Archivos:** 6 nuevos archivos.
**Commit:** `feat(skills): add 6 obsidian/markdown skills (X found, Y created) (#21)`
**Scope:** L (2h).

---

### 🔒 Slice 3: Catalog & Permissions (Issue #21 — parte 3)

#### ✅ FEV8-T4: Update Huitzilopochtli AVAILABLE SUBAGENTS catalog
**Descripción:** Añadir `obsidian-vault-writer` al catálogo de Huitzilopochtli. Actualizar conteo Documentation (5 → 6).

**Cambio específico en `huitzilopochtli.md`:**

```diff
- - **Documentation** (5): docs-writer, research-analyst, knowledge-synthesizer, scientific-literature-researcher, search-specialist
+ - **Documentation** (6): docs-writer, research-analyst, knowledge-synthesizer, scientific-literature-researcher, search-specialist, obsidian-vault-writer
```

**Criterios de Aceptación:**
- [ ] `huitzilopochtli.md` contiene `obsidian-vault-writer` en Documentation
- [ ] Conteo "(5)" → "(6)"
- [ ] NO se modifica ningún otro campo
- [ ] Tamaño del archivo sigue ≤150 (constraint FEV-7)

**Verificación:**
- [ ] `rg "obsidian-vault-writer" template/obligatorio/agents/huitzilopochtli.md` → 1 match
- [ ] `rg "Documentation.*6" template/obligatorio/agents/huitzilopochtli.md` → 1 match
- [ ] `wc -l template/obligatorio/agents/huitzilopochtli.md` ≤ 150
- [ ] `just check` — 0 errores
- [ ] `bun test` — sin regresión

**Dependencias:** FEV8-T1, FEV8-T3.
**Archivos:** `template/obligatorio/agents/huitzilopochtli.md` (1 línea modificada).
**Commit:** `feat(agents): add obsidian-vault-writer to Huitzilopochtli catalog (#21)`
**Scope:** XS (10min).

---



#### ✅ FEV8-T5: Add obsidian-vault-writer to VALID_SUBAGENTS in sdd-pipeline.ts
**Descripción:** Añadir `'obsidian-vault-writer'` al Set `VALID_SUBAGENTS` en `sdd-pipeline.ts`. Actualizar comentario de conteo (97 → 98 subagentes, 103 → 104 totales).

**Cambio específico:**

```diff
- // All 103 agents: 97 subagents + 6 primary agents
- // Used to validate task() calls — rejects invented subagent names
+ // All 104 agents: 98 subagents + 6 primary agents
+ // Used to validate task() calls — rejects invented subagent names
  const VALID_SUBAGENTS = new Set([
    // Primary agents
    'huitzilopochtli', 'quetzalcoatl', 'moctezuma', 'tlaloc', 'mictlantecuhtli', 'tezcatlipoca',
    ...
    // Documentation & Research
    'docs-writer', 'research-analyst', 'knowledge-synthesizer',
    'scientific-literature-researcher', 'search-specialist',
+   'obsidian-vault-writer',  // (FEV-8) — Obsidian vault administration
    ...
```

**Criterios de Aceptación:**
- [ ] `sdd-pipeline.ts` contiene `'obsidian-vault-writer'` en `VALID_SUBAGENTS`
- [ ] Comentario de conteo actualizado: 97 → 98, 103 → 104
- [ ] NO se elimina ningún otro subagente
- [ ] TypeScript compila sin errores
- [ ] `task(subagent_type: "obsidian-vault-writer")` NO lanza SddError

**Verificación:**
- [ ] `rg "'obsidian-vault-writer'" template/obligatorio/.opencode/plugins/sdd-pipeline.ts` → 1 match
- [ ] `rg "All 104 agents" template/obligatorio/.opencode/plugins/sdd-pipeline.ts` → 1 match
- [ ] `bun -e "tsc --noEmit" template/obligatorio/.opencode/plugins/sdd-pipeline.ts` exit 0
- [ ] `just check` — 0 errores
- [ ] `bun test` — sin regresión (563/0)

**Dependencias:** FEV8-T1, FEV8-T4.
**Archivos:** `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (1 línea + 2 comentarios).
**Commit:** `feat(plugin): add obsidian-vault-writer to VALID_SUBAGENTS (#21)`
**Scope:** XS (10min).

---

### 📚 Slice 4: Documentation & Release

#### ✅ FEV8-T6: Update CHANGELOG.md with v1.2.0 entry + bump version
**Descripción:** Añadir entrada v1.2.0 a `CHANGELOG.md` (Keep a Changelog format). Bumpear `package.json` de `1.1.0` a `1.2.0`.

**Entrada CHANGELOG:**

```markdown
## [v1.2.0] - 2026-07-10

### Added
- **Obsidian Vault Writer Subagent (Issue #21):** New specialized subagent for Obsidian vault administration and markdown file management. Strategy pattern (vault mode uses obsidian-cli; markdown-only mode uses Bun.fs). Invocable exclusively by Huitzilopochtli.
- **6 Obsidian/Markdown Skills (Issue #21):** obsidian-cli-usage, obsidian-vault-structure, obsidian-frontmatter, obsidian-templater, obsidian-dataview, markdown-style-guide.
- **Catalog Update:** obsidian-vault-writer added to Huitzilopochtli's Documentation subagent group (5 → 6).
- **Plugin Validation:** obsidian-vault-writer added to VALID_SUBAGENTS set (97 → 98 subagents).

### Changed
- **Subagent count:** 96 → 97 subagents in workspace template.
```

**Cambio `package.json`:**

```diff
- "version": "1.1.0"
+ "version": "1.2.0"
```

**Criterios de Aceptación:**
- [ ] Entrada `[v1.2.0]` con fecha 2026-07-10
- [ ] 3+ secciones: Added, Changed (Security si aplica)
- [ ] Referencia a Issue #21
- [ ] `package.json` `"version": "1.2.0"`
- [ ] No se modifica ningún otro campo de `package.json`

**Verificación:**
- [ ] `rg "v1.2.0.*2026-07-10" CHANGELOG.md` → 1 match
- [ ] `rg "Issue #21" CHANGELOG.md` → 1+ match
- [ ] `rg "\"version\"" package.json` → muestra `"version": "1.2.0"`
- [ ] `git diff package.json` → 1 línea modificada
- [ ] `just check` — 0 errores

**Dependencias:** FEV8-T1, T2, T3, T4, T5.
**Archivos:** `CHANGELOG.md`, `package.json` (2 archivos).
**Commit:** 2 commits separados:
- `docs(changelog): v1.2.0 entry with obsidian-vault-writer subagent (#21)`
- `chore(release): bump version to 1.2.0`
**Scope:** XS (15min).

---

#### ✅ FEV8-T7: Document wiki updates needed (manual step)
**Descripción:** Documentar los cambios necesarios en el GitHub Wiki (repo separado `fisherk2/codice-opencode.wiki`). El maintainer los aplica manualmente.

**Cambios a documentar:**

1. **Home page:** agent count 103 → 104
2. **Agents → Documentation:** nueva subsección con descripción del subagente
3. **Agents → Huitzilopochtli:** actualizar conteo Documentation (5 → 6)
4. **Customization Guide:** cross-reference a obsidian-vault-writer como ejemplo de Strategy pattern

**Archivo a crear:** `docs/wiki-updates/fev-8.md` con la especificación completa de cambios.

**Criterios de Aceptación:**
- [ ] `docs/wiki-updates/fev-8.md` existe
- [ ] Lista de páginas afectadas con contenido exacto a añadir/modificar
- [ ] Instrucciones claras para el maintainer

**Verificación:**
- [ ] `ls docs/wiki-updates/fev-8.md` → existe
- [ ] Manual: el maintainer puede seguir las instrucciones sin ambigüedad

**Dependencias:** FEV8-T1, FEV8-T4.
**Archivos:** `docs/wiki-updates/fev-8.md` (nuevo).
**Commit:** `docs(wiki): specify wiki updates needed for FEV-8 (#21)`
**Scope:** XS (15min).

---

## Checkpoints

### Checkpoint 1: After FEV8-T1
- [ ] `obsidian-vault-writer.md` existe con YAML válido
- [ ] Permissions: `write/edit` solo para `*.md*`; `bash` allowlist restrictiva
- [ ] Secciones presentes: Role, Modes, Workflow, Skills, Restrictions, Composition
- [ ] Tamaño ≤200 líneas
- [ ] `just check` — 0 errores
- [ ] `bun test` — 563/0 (sin regresión)

**Bloqueante para T4/T5:** Si falla, NO proceder a Slice 3.

### Checkpoint 2: After FEV8-T2, T3
- [ ] 6 skills en `template/obligatorio/skills/<skill-name>/SKILL.md`
- [ ] Cada skill tiene frontmatter válido
- [ ] Tamaño: 80-150 líneas cada una
- [ ] Skills `found` instaladas con contenido original
- [ ] Skills `to_create` siguen el formato estándar
- [ ] `just check` — 0 errores
- [ ] `bun test` — sin regresión

**Bloqueante para T4/T5:** Si falla, NO proceder a Slice 3.

### Checkpoint 3: After FEV8-T4, T5
- [ ] `huitzilopochtli.md` incluye `obsidian-vault-writer` en Documentation (6)
- [ ] `sdd-pipeline.ts` `VALID_SUBAGENTS` incluye `'obsidian-vault-writer'`
- [ ] Comentario de conteo: 97 → 98 subagentes
- [ ] `just check` — 0 errores
- [ ] `bun test` — 563/0 (sin regresión)

**Bloqueante para T6/T7:** Si falla, NO proceder a Slice 4.

### Gate FEV-8
- [ ] 7 commits atómicos en `feat/v1.2.0-fev-8`
- [ ] Issue #21 resuelto: subagente + 6 skills + catálogo + plugin validation
- [ ] `package.json` bumped a `1.2.0`
- [ ] `CHANGELOG.md` con entrada v1.2.0
- [ ] `docs/wiki-updates/fev-8.md` documenta cambios pendientes
- [ ] Sin regresión en tests, coverage, ni E2E
- [ ] Listo para PR a `develop`

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FEV8-T0: Análisis Issue #21 (no commit) | XS | 15min |
| FEV8-T1: Subagent obsidian-vault-writer | M | 1h |
| FEV8-T2: Búsqueda via find-skills | S | 30min |
| FEV8-T3: Install/create 6 skills | L | 2h |
| FEV8-T4: Update Huitzilopochtli catalog | XS | 10min |
| FEV8-T5: VALID_SUBAGENTS en sdd-pipeline.ts | XS | 10min |
| FEV8-T6: CHANGELOG + bump version | XS | 15min |
| FEV8-T7: Documentar wiki updates | XS | 15min |
| Checkpoint 1 | — | 5min |
| Checkpoint 2 | — | 5min |
| Checkpoint 3 | — | 5min |
| Gate FEV-8 | — | 5min |
| Commits (7) | — | 15min |
| Code review | — | 45min |
| **Total** | | **~4-5h** |

---

## Post-FEV-8 (preview de FEV-9)

FEV-8 sienta las bases para FEV-9 (MCP Server Integration):
- Modificará `## KNOWLEDGE` de 6 agentes (no tocada en FEV-8)
- Añadirá 6 MCP servers a `opencode.json` (compatible con FEV-7 deny entries)
- Actualizará `sdd-pipeline.ts` para detectar MCP servers (compatible con FEV-8 T5)

Las modificaciones de FEV-8 son **compatibles** con FEV-9 (no se requieren refactors).

---

*Última actualización: 2026-07-10 (FEV-8 planificado)*
