# FEV-27 Todo List — Security & Observability

> **⏳ PENDIENTE** — 4 items · ~6-8h estimada · 12 commits atómicos

**Phase:** FEV-27 (v2.1.1) — Pendiente
**Issues/TD:** [#80](https://github.com/Fisherk2/codice-opencode/issues/80), [#81](https://github.com/Fisherk2/codice-opencode/issues/81), TD-V2-9, TD-V2-51
**Full plan:** [plan.md](./plan.md)
**Branch:** `fix/fev-27-security-observability`
**Total effort:** ~6-8h · 12 commits atómicos (1 por task + 1 audit + 1 release prep batch)
**Methodology:** Vertical slicing · commits atómicos · TDD donde aplique · checkpoints entre fases

---

## Scope Guard (leer antes de empezar)

**SOLO se tocan estos archivos:**

```
src/domain/types/ProgressEvent.ts                                    ← Phase 1
src/infrastructure/adapters/AtomicStager.ts                          ← Phase 1, Phase 3
src/infrastructure/config/constants.ts                               ← Phase 3
template/obligatorio/core/opencode.json                              ← Phase 2
template/obligatorio/core/.opencode/plugins/sdd-pipeline.ts          ← Phase 4
template/obligatorio/core/.opencode/plugins/src/*                    ← Phase 4 (delete 12, keep 3)
template/obligatorio/core/.opencode/plugins/src/__tests__/*          ← Phase 4 (delete obsolete)
tests/integration/adapters/atomic-stager.test.ts                     ← Phase 1, Phase 3
tests/plugin/integration/*.ts                                        ← Phase 4
tests/plugin/e2e/*.sh                                                ← Phase 4
docs/wiki-source/Configuration.md                                    ← Phase 2
docs/diagnosis/fix19-sigint-backup-overwrite.md                      ← Phase 3
CHANGELOG.md                                                         ← Checkpoint 5
docs/TECH_DEBT.md                                                    ← Checkpoint 5
docs/WORKFLOW.md                                                     ← Checkpoint 5
docs/wiki-source/.wiki/*                                             ← Checkpoint 5
```

**PROHIBIDO en FEV-27:**

- ❌ Tocar lógica de FileMergeEngine o VersionComparator (out of scope)
- ❌ Cambiar firma de métodos públicos (mantener backward compatibility)
- ❌ Incluir FEV-26 (ya merged) o FEV-28 (fase separada)
- ❌ Publicar release v2.1.1 (esperar FEV-28 según decisión del usuario)
- ❌ Modificar ADR-003 o agregar ADR-021 sin discusión arquitectónica previa
- ❌ Usar `any` en código de producción
- ❌ Romper los 31/31 escenarios E2E existentes
- ❌ Cambiar schema de ProgressEvent sin actualizar consumers (VerboseLogger, etc.)

---

## Estado por Task

### Phase 1: Observability Foundation (TD-V2-51) — 1h

- [ ] **Task 1.1** — Add `staging_cleanup` event variant
  - [ ] Editar `src/domain/types/ProgressEvent.ts` — añadir variant `{ type: "staging_cleanup", stagingPath: string }`
  - [ ] Editar `src/infrastructure/adapters/AtomicStager.ts::cleanStaging()` — añadir `this.logger.log("staging_cleanup", this.stagingRoot)` antes de `fs.rm`
  - [ ] Editar `tests/integration/adapters/atomic-stager.test.ts` — añadir test que verifica emisión del evento
  - [ ] Ejecutar `just check` — 0 errores
  - [ ] Ejecutar `just test-integration tests/integration/adapters/atomic-stager.test.ts` — 0 fallos
  - [ ] **Commit:** `feat(observability): emit staging_cleanup event in --verbose mode`

### Checkpoint 1 — Phase 1 complete

- [ ] `just check` — 0 errores
- [ ] `just test-integration` — 0 fallos
- [ ] Coverage ≥95% production `src/`
- [ ] **Review humano** — confirmar shape del evento antes de Phase 2

---

### Phase 2: External Directory Governance (#81) — 1-2h

- [ ] **Task 2.1** — Add `external_directory` permission block
  - [ ] Editar `template/obligatorio/core/opencode.json` — añadir bloque `"external_directory"` después de `"read"` (línea 326)
  - [ ] Configurar deny-by-default: `"*": "deny"` primero
  - [ ] Añadir allowlist: `~/.agents/*`, `~/.bun/*`, `~/.cargo/*`, `~/go/*`, `~/.local/*`, `~/.cache/*`, `~/Projects/*`, `/tmp/*` (todos `allow`)
  - [ ] Validar JSON: `bun -e "JSON.parse(await Bun.file('template/obligatorio/core/opencode.json').text())"`
  - [ ] Editar `docs/wiki-source/Configuration.md` — documentar nuevo bloque de permission
  - [ ] Ejecutar `just check` — 0 errores
  - [ ] **Commit:** `feat(security): add external_directory permission block to template`

### Checkpoint 2 — Phase 2 complete

- [ ] `just check` — 0 errores
- [ ] JSON validado manualmente
- [ ] Wiki documentada
- [ ] **Review humano** — confirmar alcance de allowlist antes de Phase 3

---

### Phase 3: Backup Safety (TD-V2-9) — 2-3h

- [ ] **Task 3.1** — Define `BACKUP_INTENT_FILE` constant
  - [ ] Editar `src/infrastructure/config/constants.ts` — añadir `export const BACKUP_INTENT_FILE = ".codice-backup-intent";`
  - [ ] Ejecutar `just check` — 0 errores
  - [ ] **Commit:** `chore(infra): define BACKUP_INTENT_FILE constant`

- [ ] **Task 3.2** — Implement backup intent marker in `commitStaging()`
  - [ ] Editar `src/infrastructure/adapters/AtomicStager.ts::commitStaging()`:
    - [ ] Importar `BACKUP_INTENT_FILE` desde `constants.ts`
    - [ ] Fail-fast check: `if (await fs.access(intentPath).catch(() => null)) throw new Error("Previous commit was interrupted...")`
    - [ ] Escribir intent marker: `await fs.writeFile(intentPath, new Date().toISOString())`
    - [ ] Cleanup intent marker en éxito: `await fs.unlink(intentPath).catch(() => {})`
  - [ ] Editar `tests/integration/adapters/atomic-stager.test.ts`:
    - [ ] Test: interrupted commit preserves intent marker
    - [ ] Test: next commit refuses with clear error when orphan marker exists
    - [ ] Test: successful commit cleans up intent marker
  - [ ] Ejecutar `just test-integration tests/integration/adapters/atomic-stager.test.ts` — 0 fallos
  - [ ] Ejecutar `just check` — 0 errores
  - [ ] **Commit:** `feat(security): protect backup integrity with .codice-backup-intent marker`

- [ ] **Task 3.3** — Update diagnosis document
  - [ ] Editar `docs/diagnosis/fix19-sigint-backup-overwrite.md`:
    - [ ] Cambiar "Proposed Solution" → "Implemented Solution"
    - [ ] Cambiar status de `diagnosed` a `resolved (FEV-27)`
    - [ ] Añadir referencia al commit de Task 3.2
  - [ ] **Commit:** `docs(diagnosis): mark TD-V2-9 backup overwrite as resolved in FEV-27`

### Checkpoint 3 — Phase 3 complete

- [ ] `just check` — 0 errores
- [ ] `just test-integration` — atomic-stager suite 0 fallos
- [ ] Verificación manual: SIGINT simulado preserva backups correctamente
- [ ] **Review humano** — confirmar wording del mensaje de error antes de Phase 4

---

### Phase 4: Plugin Reduction (#80) — 3-4h

- [ ] **Task 4.1** — Audit plugin dependencies (read-only)
  - [ ] Ejecutar `grep -rn "from.*autoDiscovery\|from.*chatMessage\|from.*configLoader\|from.*defaults\|from.*directoryScanner\|from.*frontmatter\|from.*intentDiscovery\|from.*mentionPatterns\|from.*mergeConfig\|from.*spanishIntents\|from.*stopwords\|from.*validSubagents" template/ tests/ skills/`
  - [ ] Confirmar 0 consumidores externos inesperados
  - [ ] Marcar `chatMessage.test.ts`, `systemTransform.test.ts`, `help-command-discovery.test.ts` para borrado
  - [ ] **Sin commit** (audit-only)

- [ ] **Task 4.2** — Delete obsolete plugin modules
  - [ ] Eliminar 12 archivos en `template/obligatorio/core/.opencode/plugins/src/`:
    - [ ] `autoDiscovery.ts`
    - [ ] `chatMessage.ts`
    - [ ] `configLoader.ts`
    - [ ] `defaults.ts`
    - [ ] `directoryScanner.ts`
    - [ ] `frontmatter.ts`
    - [ ] `intentDiscovery.ts`
    - [ ] `mentionPatterns.ts`
    - [ ] `mergeConfig.ts`
    - [ ] `spanishIntents.ts`
    - [ ] `stopwords.ts`
    - [ ] `validSubagents.ts`
  - [ ] Eliminar archivos de test obsoletos en `template/obligatorio/core/.opencode/plugins/src/__tests__/`
  - [ ] Verificar: `ls template/obligatorio/core/.opencode/plugins/src/ | wc -l` = 3
  - [ ] Ejecutar `just check` — 0 errores
  - [ ] **Commit:** `refactor(plugin): reduce SDD plugin to destructive command block only`

- [ ] **Task 4.3** — Rewrite `sdd-pipeline.ts` to minimal form
  - [ ] Editar `template/obligatorio/core/.opencode/plugins/sdd-pipeline.ts`:
    - [ ] Eliminar imports de módulos borrados
    - [ ] Eliminar hooks `experimental.chat.system.transform` y `chat.message`
    - [ ] Eliminar audit log helpers
    - [ ] Eliminar SddState, pipeline_phase logic
    - [ ] Renombrar `SddError` → `DestructiveCommandError`
    - [ ] Renombrar export `SddPipelinePlugin` → `DestructiveCommandBlockPlugin`
    - [ ] Preservar: `tool.execute.before` hook con DESTRUCTIVE_PATTERNS + normalizeBash
  - [ ] Verificar: `wc -l template/obligatorio/core/.opencode/plugins/sdd-pipeline.ts` < 50 líneas
  - [ ] Ejecutar `bun test tests/plugin/integration/toolExecuteBefore.test.ts` — 0 fallos
  - [ ] **Commit:** `refactor(plugin): rewrite sdd-pipeline.ts as minimal destructive gate`

- [ ] **Task 4.4** — Update plugin integration tests
  - [ ] Eliminar `tests/plugin/integration/chatMessage.test.ts`
  - [ ] Eliminar `tests/plugin/integration/systemTransform.test.ts`
  - [ ] Verificar si `tests/plugin/integration/help-command-discovery.test.ts` es obsoleto → eliminar si sí
  - [ ] Reescribir `tests/plugin/integration/toolExecuteBefore.test.ts`:
    - [ ] Eliminar imports de `PRIMARY_AGENTS`, `discoverValidSubagents`, etc.
    - [ ] Mantener solo tests de `DESTRUCTIVE_PATTERNS` + `normalizeBash`
    - [ ] Añadir tests para el nuevo `DestructiveCommandBlockPlugin` (mock input/output)
  - [ ] Ejecutar `just test-plugin-integration` — 0 fallos
  - [ ] **Commit:** `test(plugin): update integration tests for minimal destructive gate`

- [ ] **Task 4.5** — Update plugin E2E scenarios
  - [ ] Eliminar `tests/plugin/e2e/18-audit-log.sh`
  - [ ] Simplificar `tests/plugin/e2e/16-plugin-installation.sh`:
    - [ ] Eliminar assertions sobre audit log
    - [ ] Mantener: plugin loads, command block works
  - [ ] Simplificar `tests/plugin/e2e/17-plugin-lint.sh`:
    - [ ] Eliminar checks sobre archivos borrados
    - [ ] Mantener: biome + tsc sobre los 3 archivos restantes
  - [ ] Ejecutar `bash tests/plugin/e2e/run-plugin-e2e.sh` — 2/2 passing
  - [ ] **Commit:** `test(plugin): update E2E scenarios for minimal plugin`

### Checkpoint 4 — Phase 4 complete

- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 0 fallos
- [ ] `just test-integration` — 0 fallos
- [ ] `just test-plugin-integration` — 0 fallos (suite reducida)
- [ ] `just test-plugin-e2e` — 2/2 passing
- [ ] `just test-e2e` — 31/31 passing (no regresión)
- [ ] Coverage ≥95% production `src/`
- [ ] Plugin reducido: 4 archivos (sdd-pipeline.ts + 3 src/ modules + __tests__)
- [ ] **Review humano** — confirmar alcance de reducción antes de Release Prep

---

### Phase 5: Release Prep

- [ ] **Task 5.1** — Update `CHANGELOG.md`
  - [ ] Añadir entrada `## [2.1.1] - YYYY-MM-DD` (con fecha del día)
  - [ ] Sección `### Security`:
    - [ ] Plugin SDD reducido a bloqueante de comandos destructivos (#80)
    - [ ] Permisos `external_directory` con deny-by-default (#81)
    - [ ] Marcador `.codice-backup-intent` protege integridad de backups (TD-V2-9)
  - [ ] Sección `### Added`:
    - [ ] Evento `staging_cleanup` para observabilidad (TD-V2-51)
  - [ ] Ejecutar `git diff CHANGELOG.md | head -50` — verificar formato
  - [ ] **Commit:** `docs(changelog): add v2.1.1 entry with FEV-27 items`

- [ ] **Task 5.2** — Update `docs/TECH_DEBT.md`
  - [ ] Añadir nueva sección `### Resolved in v2.1.1 (FEV-26+FEV-27)` después de FEV-26
  - [ ] Listar 4 items de FEV-27 con issue/TD IDs y diagnóstico
  - [ ] Actualizar fila FEV-27 en tabla `### v2.1.1` → marcar `✅ Resuelto (YYYY-MM-DD)`
  - [ ] Actualizar fila v2.1.1 en `## Summary` → contar items resueltos
  - [ ] Actualizar `Last updated:` a fecha del día
  - [ ] **Commit:** `docs(tech-debt): mark FEV-27 4 items as resolved in v2.1.1`

- [ ] **Task 5.3** — Update `docs/WORKFLOW.md`
  - [ ] Actualizar fila FEV-27 en tabla de fases (línea 22):
    - [ ] Estado: `⏳ Pendiente` → `✅ Completo (YYYY-MM-DD)`
  - [ ] Actualizar bloque de FEV-27 (líneas 144-163):
    - [ ] Estado: `⏳ Pendiente` → `✅ Completo (YYYY-MM-DD)`
    - [ ] Effort real vs estimado (si difiere)
    - [ ] Métricas: tests añadidos, líneas eliminadas (plugin reduction)
  - [ ] Actualizar `Resumen de Fases v2.1.1` (líneas 189-194):
    - [ ] FEV-27 → ✅ Completo
  - [ ] **Commit:** `docs(workflow): mark FEV-27 as completed with metrics summary`

- [ ] **Task 5.4** — Sync GitHub Wiki
  - [ ] Ejecutar: `rsync -a --delete --exclude='README.md' docs/wiki-source/*.md docs/wiki-source/.wiki/`
  - [ ] Verificar que `docs/wiki-source/.wiki/` tiene cambios (Configuration.md principalmente)
  - [ ] `cd docs/wiki-source/.wiki && git add . && git commit -m "Sync wiki v2.1.1 with FEV-27 changes"`
  - [ ] `git push origin main` (rama del wiki)
  - [ ] Volver al directorio raíz
  - [ ] **Commit:** `docs(wiki): record wiki sync in repo state` (si aplica tracking)

### Checkpoint 5 — Phase 5 complete (FINAL)

- [ ] Toda la documentación consistente con el código
- [ ] Wiki sincronizado y pusheado
- [ ] `just check` + `just test` (todos los suites) pasan
- [ ] Coverage ≥95% production `src/`
- [ ] **NO publicar release v2.1.1** (esperar FEV-28 según decisión del usuario)
- [ ] **Review humano** — aprobar merge a develop

---

## Definition of Done (Validación Final)

- [ ] 12 tasks completadas con criterios de aceptación cumplidos
- [ ] 12 commits atómicos con conventional commit messages
- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 0 fallos
- [ ] `just test-integration` — 0 fallos
- [ ] `just test-plugin-integration` — 0 fallos (suite reducida)
- [ ] `just test-plugin-e2e` — 2/2 passing
- [ ] `just test-e2e` — 31/31 passing (sin regresión)
- [ ] `just test-packaging` — 5/5 passing
- [ ] Coverage ≥95% production `src/`
- [ ] Plugin file count: 4 archivos en `plugins/src/` (3 módulos + `__tests__/`)
- [ ] Plugin main file: < 50 líneas
- [ ] CHANGELOG.md actualizado
- [ ] docs/TECH_DEBT.md actualizado
- [ ] docs/WORKFLOW.md actualizado
- [ ] GitHub Wiki sincronizado
- [ ] Branch `fix/fev-27-security-observability` lista para PR a `develop`
- [ ] PR abierto con título `fix(security+observability): resolve FEV-27 (#80, #81, TD-V2-9, TD-V2-51)`
- [ ] **Esperar FEV-28 antes de merge final a develop**

---

## Comandos Útiles (referencia rápida)

```bash
# Antes de empezar Phase 1
git checkout develop
git pull origin develop
git checkout -b fix/fev-27-security-observability

# Validación continua
just check                           # biome ci + tsc --noEmit
just test-unit                       # Solo dominio
just test-integration                # Adaptadores + use cases
just test-plugin-integration         # Tests del plugin
just test-plugin-e2e                 # E2E del plugin (bash)
just test-e2e                        # 31 escenarios CLI
just test-packaging                  # Tarball npm

# Validación específica
bun test tests/integration/adapters/atomic-stager.test.ts -- --grep "staging_cleanup"
bun test tests/integration/adapters/atomic-stager.test.ts -- --grep "backup.intent"
bun test tests/plugin/integration/toolExecuteBefore.test.ts
bash tests/plugin/e2e/run-plugin-e2e.sh

# Validación JSON manual
bun -e "JSON.parse(await Bun.file('template/obligatorio/core/opencode.json').text())"

# Wiki sync
rsync -a --delete --exclude='README.md' docs/wiki-source/*.md docs/wiki-source/.wiki/
```

---

## Tracking de Tiempo

| Phase | Estimado | Real | Notas |
|-------|----------|------|-------|
| Phase 1 (TD-V2-51) | 1h | — | — |
| Phase 2 (#81) | 1-2h | — | — |
| Phase 3 (TD-V2-9) | 2-3h | — | — |
| Phase 4 (#80) | 3-4h | — | — |
| Phase 5 (Release Prep) | 0.5h | — | — |
| **Total** | **6-8h** | — | — |

---

Co-Authored-By: Moctezuma <dev@fisherk2.com>
