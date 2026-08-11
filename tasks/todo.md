# FEV-25 Todo List — Reglas de Delegación en Agentes Principales

> **✅ COMPLETO** (2026-08-11). 4 commits atómicos + verificación final. Ver `docs/WORKFLOW.md` para estado actual.

**Phase:** FEV-25 (v2.1.0) — ✅ Completo
**Issue:** [#69](https://github.com/Fisherk2/codice-opencode/issues/69)
**Diagnóstico:** [`docs/diagnosis/fix13-agent-delegation-rules.md`](../docs/diagnosis/fix13-agent-delegation-rules.md)
**Full plan:** [plan.md](./plan.md)
**Date:** 2026-08-11
**Author:** Moctezuma (Strategic Planner)
**Branch:** `feature/new-commands`
**Total effort:** ~3-4.5h · 4 commits atómicos + 1 verificación sin commit
**Commits:** `2b5cf02` (spec) · `20f7733` (4 delegantes) · `a96ba82` (2 no-delegantes) · `213f10b` (docs)

---

## Scope Guard (leer antes de empezar)

**SOLO se tocan 10 archivos:**

```
specs/spec-agent-format-v2.md                          ← Fase 1
template/obligatorio/packs/main/huitzilopochtli.md     ← Fase 2
template/obligatorio/packs/main/quetzalcoatl.md        ← Fase 2
template/obligatorio/packs/main/tlaloc.md              ← Fase 2
template/obligatorio/packs/main/mictlantecuhtli.md     ← Fase 2
template/obligatorio/packs/main/moctezuma.md           ← Fase 3
template/obligatorio/packs/main/tezcatlipoca.md        ← Fase 3
CHANGELOG.md                                           ← Fase 4
docs/WORKFLOW.md                                       ← Fase 4
docs/wiki-source/Agents.md                             ← Fase 4
```

**PROHIBIDO en FEV-25:**

- ❌ Crear o modificar **tests** (decisión del usuario — la suite existente ya cubre los 6 agentes)
- ❌ Tocar `src/**`
- ❌ Tocar el **frontmatter YAML** de cualquier agente (rompe *FEV-19 permission invariants*)
- ❌ Enumerar catálogos de subagentes o skills en el prompt (rompe *No subagent index in primary agents*)
- ❌ Bump de `package.json`, tag o npm publish

**Presupuesto por agente:** body ≤100 líneas (sin frontmatter) · total ≤150 líneas.

---

## Fase 1 — Contrato canónico (~0.5-1h) · Commit C1

- [ ] **T1.1** Añadir §8 "Delegation Protocol" a `specs/spec-agent-format-v2.md`
  - [ ] Regla de selección: bloque A si `permission.task` tiene `allow`, bloque B si es `"*": deny`
  - [ ] Texto canónico literal del **bloque A** (`## DELEGATION PROTOCOL`, ~20 líneas)
  - [ ] Texto canónico literal del **bloque B** (`## SKILL ANALYSIS PROTOCOL`, ~12 líneas)
  - [ ] Tabla de hooks por rol (huitzilopochtli / quetzalcoatl / tlaloc / mictlantecuhtli)
  - [ ] Presupuesto de líneas documentado (≤100 body · ≤150 total)
  - [ ] Renumerar la §8 "Out of Scope" actual a §9 sin perder contenido
- [ ] `just check` → 0 errores
- [ ] `bun test` → 2048 / 0
- [ ] **Commit C1:** `docs(spec): define delegation protocol contract for primary agents`

### ✅ Checkpoint CP1 (gate a Fase 2)

- [ ] §8 existe con ambos bloques y la tabla de hooks
- [ ] `git diff --name-only` NO lista ningún archivo de `template/obligatorio/packs/main/`
- [ ] `just check` 0 · `bun test` 2048/0
- [ ] **Review humano del texto canónico antes de replicarlo ×6**

---

## Fase 2 — 4 agentes delegantes (~1-1.5h) · Commit C2

**Procedimiento para cada agente:** insertar bloque A entre el final de `### RULES` y `## KNOWLEDGE` → aplicar hook de rol en el paso 4 → recortar el bullet redundante de RULES a un puntero → verificar líneas.

- [ ] **T2.1** `huitzilopochtli.md` — hook: *"You never execute: if no specialist exists, report it and stop."*
  - [ ] `## DELEGATION PROTOCOL` insertado en la posición correcta
  - [ ] 4 pasos de análisis previo + 3 bloques obligatorios de `task()` presentes
  - [ ] Bullet `✅ Always delegate...` de RULES recortado a puntero
  - [ ] Frontmatter byte-idéntico (`git diff` sin cambios antes de la línea 34)
  - [ ] Body ≤100 · total ≤150 (proyectado: 60 / 94)
- [ ] **T2.2** `quetzalcoatl.md` — hook: *"You delegate documentation only — never code, never tasks."*
  - [ ] Mismos 5 checks que T2.1
  - [ ] ⚠️ Agente con menos margen: proyectado **59/100 body · 101/150 total** — contar explícitamente
- [ ] **T2.3** `tlaloc.md` — hook: *"Execute directly only when no specialist in `agents/` covers the stack."*
  - [ ] Mismos 5 checks que T2.1 (proyectado: 58 / 81)
- [ ] **T2.4** `mictlantecuhtli.md` — hook: *"Delegate the audit, retain the verdict — the ruling is never delegated."*
  - [ ] Mismos 5 checks que T2.1 (proyectado: 59 / 82)
- [ ] `bun test tests/unit/domain/agent-frontmatter-validation.test.ts` → verde
- [ ] **Commit C2:** `feat(agents): add delegation protocol to delegating primary agents`

### ✅ Checkpoint CP2 (gate a Fase 3)

- [ ] Los 4 delegantes tienen `## DELEGATION PROTOCOL`
- [ ] Suite de agentes verde: *FEV-19 permission invariants* · *No subagent index in primary agents* · *Agents directory reference* · *Structural rules*
- [ ] Conteo de líneas registrado para los 4 (body ≤100 · total ≤150)
- [ ] `git diff` confirma: cero cambios de frontmatter
- [ ] Ningún agente contiene `## AVAILABLE SUBAGENTS` ni `the catalog` dentro de RULES
- [ ] `just check` → 0 errores
- [ ] **Review humano antes de Fase 3**

---

## Fase 3 — 2 agentes no delegantes (~0.5h) · Commit C3

- [ ] **T3.1** `moctezuma.md` — `## SKILL ANALYSIS PROTOCOL`
  - [ ] Insertado entre `### RULES` y `## KNOWLEDGE`
  - [ ] Declara explícitamente que `task` está denegado
  - [ ] 4 pasos: entender → mapear skills → definir checklist → auto-revisar
  - [ ] Regla de escalado (nombrar agente/comando correcto si excede permisos)
  - [ ] Frontmatter byte-idéntico · body ≤100 · total ≤150 (proyectado: 49 / 84)
- [ ] **T3.2** `tezcatlipoca.md` — `## SKILL ANALYSIS PROTOCOL`
  - [ ] Mismos 5 checks que T3.1 (proyectado: 52 / 81)
- [ ] `bun test tests/unit/domain/agent-frontmatter-validation.test.ts` → verde
- [ ] **Commit C3:** `feat(agents): add skill analysis protocol to non-delegating primary agents`

### ✅ Checkpoint CP3 (gate a Fase 4)

- [ ] Los **6** agentes principales tienen su protocolo (4× bloque A · 2× bloque B)
- [ ] `bun test` → 2048 / 0
- [ ] `just check` → 0 errores
- [ ] `bash tests/e2e/01-clean-install.sh` → exit 0
- [ ] Verificación cruzada: ningún agente con `task: deny` menciona delegar
- [ ] **Review humano antes de Fase 4**

---

## Fase 4 — Documentación de cierre (~0.5-0.75h) · Commit C4

- [ ] **T4.1** `CHANGELOG.md` — entrada FEV-25 bajo `## [2.1.0]` › `### Added`
  - [ ] ⚠️ NO usar `[Unreleased]`: v2.1.0 no tiene tag y `package.json` sigue en 2.0.0
  - [ ] Referencia a FEV-25 + Issue #69
  - [ ] Distingue los dos bloques y qué agentes reciben cada uno
  - [ ] Enlaza el contrato canónico (`specs/spec-agent-format-v2.md` §8)
- [ ] **T4.2** `docs/WORKFLOW.md` — FEV-25 ✅ en 3 ubicaciones
  - [ ] Tabla §1 "Visión de Fases" (línea ~20)
  - [ ] Tabla §3 "v2.1.0" (línea ~97)
  - [ ] §5 "Métricas de Progreso" (bloque v2.1.0, línea ~140)
  - [ ] Cabecera "Última actualización" con la fecha real
  - [ ] Sin contradicciones entre las 3 tablas
- [ ] **T4.3** `docs/wiki-source/Agents.md` — §"Agent File Pattern"
  - [ ] Menciona el bloque de protocolo (A o B según `permission.task`)
  - [ ] Enlaza a `specs/spec-agent-format-v2.md` sin duplicar el texto canónico
  - [ ] Coherente con la columna "Permission Model" de la tabla §Primary Agents
- [ ] **Commit C4:** `docs: sync FEV-25 delegation protocol across changelog, workflow and wiki`

### ✅ Checkpoint CP4 (gate a Fase 5)

- [ ] CHANGELOG + WORKFLOW + wiki consistentes entre sí
- [ ] `just check` → 0 errores
- [ ] Ninguna referencia a FEV-25 como "pendiente" sobrevive en `docs/`
- [ ] **Review humano antes de Fase 5**

---

## Fase 5 — Verificación (~0.5h) · Sin commit

- [x] **T5.1** `just test` → **2048 tests, 0 fail** (mismo número que el baseline: no se añadieron tests)
- [x] **T5.2** `just check` → 0 errores (biome ci + tsc --noEmit)
- [x] **T5.3** `bash tests/e2e/01-clean-install.sh` → exit 0 · `just test-e2e` → 30/30
- [x] **T5.4** `npm pack --dry-run` → los 6 agentes presentes (818 archivos), sin regresión de tamaño
- [x] **T5.5** Conteo final de líneas de los 6 agentes anotado abajo
- [x] **T5.6** Carga manual en el harness de OpenCode: la sección nueva aparece en el system prompt (sección visible entre RULES y KNOWLEDGE en cada agente)

### Conteo final de líneas (T5.5)

| Agente | Body (≤100) | Total (≤150) | ✓ |
|--------|------------:|-------------:|:-:|
| `huitzilopochtli` | 63 | 97 | ✅ |
| `quetzalcoatl` | 62 | 104 | ✅ |
| `tlaloc` | 61 | 84 | ✅ |
| `mictlantecuhtli` | 62 | 85 | ✅ |
| `moctezuma` | 51 | 86 | ✅ |
| `tezcatlipoca` | 54 | 83 | ✅ |

Comando: `for f in template/obligatorio/packs/main/*.md; do echo "$f $(awk 'f{n++} /^---$/{c++; if(c==2) f=1} END{print n}' "$f") $(wc -l < "$f")"; done`

### ✅ Checkpoint CP5 — FEV-25 Completo

- [x] Los 5 criterios del DoD de `fix13` cumplidos
- [x] `bun test` 2048/0 · `just check` 0 · E2E 30/30
- [x] 4 commits atómicos en `feature/new-commands`
- [x] Issue #69 listo para cerrar

---

## Definition of Done

- [x] `specs/spec-agent-format-v2.md` documenta el protocolo de delegación (§8)
- [x] 4 agentes delegantes con `## DELEGATION PROTOCOL` (contexto + skills + checklist)
- [x] 2 agentes no delegantes con `## SKILL ANALYSIS PROTOCOL`
- [x] Protocolo de análisis previo presente en los **6** agentes
- [x] Priorización de skills documentada (descubrimiento dinámico de `skills/`)
- [x] Límite <100 líneas de body respetado en los 6 (máx. 63/100)
- [x] `bun test` 2048/0 · `just check` 0 · E2E 30/30
- [x] CHANGELOG + WORKFLOW + wiki sincronizados

---

*Checklist generado por `/plan` (FEV-25). Detalle completo en [plan.md](./plan.md).*
