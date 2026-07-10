# TODO: Fase FEV-7 — Agent Governance & Security Hardening (v1.1.0)

**Estado:** 🟡 Listo para implementar — 0/8 tareas ejecutadas
**Fecha:** 2026-07-10
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → FEV-2-D ✅ → FEV-3 ✅ → FEV-4 ✅ → FEV-5 ✅ → FEV-6 ✅ → **FEV-7 🟡 Pendiente**
**Branch:** `feat/v1.1.0-fev-7` (basada en `feat/v1.1.0-fev-6` o `main`)
**Issues principales:** #26 (system prompts) + #30 (command restrictions)

---

## Contexto Rápido

**Issue #26** — Mejorar system prompts de los 6 agentes primarios con:
1. Regla de **no-assumption** (preguntar antes de ejecutar)
2. **Delegation-first** para 3 agentes que delegan (quetzalcoatl, tlaloc, mictlantecuhtli)

**Issue #30** — Añadir 50+ restricciones de comandos destructivos en:
- `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (capa runtime)
- `template/obligatorio/opencode.json` (capa declarativa)

**Categorías de comandos:** filesystem, git, SQL, Docker, Kubernetes, permissions, process, network, package managers, environment, disk, IaC, cloud, databases (14 categorías).

**Límite de líneas:** ≤150 totales por agente (incluyendo YAML).

**Versión:** v1.1.0 (minor sobre v1.0.14, sin breaking changes).

---

## Tareas Pendientes

### 📋 Slice 1: No-assumption Rule (Issue #26 — parte 1)

#### ✅ FEV7-T1: Add no-assumption rule to 6 primary agents
**Descripción:** Añadir sección `## NO-ASSUMPTION RULE` (idéntica) a los 6 agentes primarios en `template/obligatorio/agents/`. Template Method: la regla es común, la aplicación varía por agente.

**Contenido común (insertar entre `## RULES` y `## KNOWLEDGE`):**

```markdown
## NO-ASSUMPTION RULE

When user intent is ambiguous, **ASK before executing**. Never operate under silent assumptions.

**Operational philosophy:** `Ask → Resolve → Suggest → Warn`

- **Ask:** If instructions are ambiguous, use the `question` tool BEFORE acting.
- **Resolve:** Confirm the exact scope of the task with the user.
- **Suggest:** Propose alternatives if you detect ambiguity or risk.
- **Warn:** Inform about non-obvious consequences before proceeding.
```

**Archivos (6):**
- `huitzilopochtli.md` (88 → ~100)
- `quetzalcoatl.md` (104 → ~116)
- `moctezuma.md` (69 → ~81)
- `tlaloc.md` (138 → ~150) ⚠️ cerca del límite
- `mictlantecuhtli.md` (73 → ~85)
- `tezcatlipoca.md` (66 → ~78)

**Criterios de Aceptación:**
- [ ] Los 6 archivos contienen `## NO-ASSUMPTION RULE`
- [ ] Sección entre `## RULES` y `## KNOWLEDGE` (orden preservado)
- [ ] NO se modifican permisos, modelo, temperature, steps, color
- [ ] Cada agente ≤150 líneas

**Verificación:**
- [ ] `rg -c "^## NO-ASSUMPTION RULE" template/obligatorio/agents/{huitzilopochtli,quetzalcoatl,moctezuma,tlaloc,mictlantecuhtli,tezcatlipoca}.md` → 6 matches
- [ ] `rg "Ask.*Resolve.*Suggest.*Warn" template/obligatorio/agents/*.md` → 6 matches
- [ ] `just check` — 0 errores
- [ ] `bun test` — 502/0 (sin regresión)
- [ ] `git diff` — solo 6 archivos modificados, ~12 líneas añadidas por archivo

**Dependencias:** Ninguna (puede ejecutarse en paralelo con T4).
**Commit:** `feat(agents): add no-assumption rule to 6 primary agents (#26)`
**Scope:** S (30min).

---

### 📋 Slice 2: Delegation-first Rule (Issue #26 — parte 2)

#### ✅ FEV7-T2: Add delegation-first rule to 3 delegating agents
**Descripción:** Añadir sección `## DELEGATION-FIRST RULE` a los 3 agentes que delegan. Strategy pattern: cada agente tiene su propio catálogo.

**NO se aplica a:** huitzilopochtli (root), moctezuma (planner), tezcatlipoca (critic).

**Contenido común (insertar entre `## NO-ASSUMPTION RULE` y `## KNOWLEDGE`):**

```markdown
## DELEGATION-FIRST RULE

**Prioritize invoking specialized subagents before writing directly.**

- ✅ **Default:** Invoke subagent via `task()` when one exists in your `## AVAILABLE SUBAGENTS` catalog.
- ⚠️ **Fallback:** Only write directly if NO specialized subagent exists or the task is trivial.
- 🚫 **Never:** Write directly without first verifying the available subagent catalog.
```

**Archivos (3):**
- `quetzalcoatl.md` (~116 → ~126)
- `tlaloc.md` (~150 → ~160) ⚠️ **PUEDE EXCEDER 150 — refactor en T3**
- `mictlantecuhtli.md` (~85 → ~95)

**Criterios de Aceptación:**
- [ ] Los 3 archivos contienen `## DELEGATION-FIRST RULE`
- [ ] Sección entre `## NO-ASSUMPTION RULE` y `## KNOWLEDGE`
- [ ] Los otros 3 agentes NO contienen esta sección
- [ ] Cada agente mantiene coherencia con `## AVAILABLE SUBAGENTS`

**Verificación:**
- [ ] `rg -c "^## DELEGATION-FIRST RULE" template/obligatorio/agents/{quetzalcoatl,tlaloc,mictlantecuhtli}.md` → 3 matches
- [ ] `rg "^## DELEGATION-FIRST RULE" template/obligatorio/agents/{huitzilopochtli,moctezuma,tezcatlipoca}.md` → 0 matches
- [ ] `just check` — 0 errores
- [ ] `bun test` — sin regresión

**Dependencias:** FEV7-T1 (orden del documento).
**Commit:** `feat(agents): add delegation-first rule to 3 delegating agents (#26)`
**Scope:** S (20min).

---

#### ✅ FEV7-T3: Verify line limit constraint (≤150 líneas)
**Descripción:** Verificar que los 6 agentes primarios modificados respeten ≤150 líneas totales. Si `tlaloc.md` excede, refactorizar comprimiendo `## AVAILABLE SUBAGENTS` a `references/subagents-tlaloc.md`.

**Estado proyectado:**

| Agente | Pre-FEV7 | Post-T1+T2 | ≤150? |
|--------|----------|------------|-------|
| huitzilopochtli | 88 | ~100 | ✅ |
| quetzalcoatl | 104 | ~126 | ✅ |
| moctezuma | 69 | ~81 | ✅ |
| tlaloc | 138 | ~160 | ⚠️ **REQUIERE REFACTOR** |
| mictlantecuhtli | 73 | ~95 | ✅ |
| tezcatlipoca | 66 | ~78 | ✅ |

**Criterios de Aceptación:**
- [ ] Los 6 agentes primarios tienen ≤150 líneas
- [ ] Si `tlaloc.md` requirió refactor: lista de subagentes movida a `references/subagents-tlaloc.md`
- [ ] Contenido semántico NO cambia (solo compresión)

**Verificación:**
- [ ] `wc -l template/obligatorio/agents/{huitzilopochtli,quetzalcoatl,moctezuma,tlaloc,mictlantecuhtli,tezcatlipoca}.md` — todos ≤150
- [ ] Si refactor: `rg "references/subagents-tlaloc" template/obligatorio/agents/tlaloc.md` → 1 match
- [ ] `just check` — 0 errores
- [ ] `bun test` — sin regresión

**Dependencias:** FEV7-T1, FEV7-T2.
**Archivos:** Posiblemente `tlaloc.md` (modificar) + `references/subagents-tlaloc.md` (nuevo).
**Commit:** `chore(agents): verify line limit constraint (≤150 lines) (#26)` o merge con T2 si no se requirió refactor.
**Scope:** XS (15min).

---

### 🔒 Slice 3: Plugin Command Restrictions (Issue #30 — parte 1)

#### ✅ FEV7-T4: Add 50+ destructive patterns to sdd-pipeline.ts
**Descripción:** Extender `DESTRUCTIVE_PATTERNS` con 42+ patrones nuevos en 14 categorías. La normalización de bash (strip comments, collapse whitespace) ya cubre bypasses básicos.

**Categorías y conteo:**

| # | Categoría | Patrones nuevos | Total acumulado |
|---|-----------|-----------------|-----------------|
| 0 | (existentes) | — | 8 (rm, git push -f, DROP, mkfs, dd, chmod) |
| 1 | Filesystem | 3 (shred, find -exec rm, find -delete) | 11 |
| 2 | Git | 5 (reset --hard, clean -fd, filter-repo, branch -D, stash drop/clear) | 16 |
| 3 | SQL | 3 (drop schema, truncate, delete from) | 19 |
| 4 | Docker | 4 (rm -f, rmi -f, system prune -a, volume rm/prune) | 23 |
| 5 | Kubernetes | 2 (delete --all, drain) | 25 |
| 6 | Permissions | 2 (chmod 777, chown -R) | 27 |
| 7 | Process | 5 (kill -9 0/1, shutdown, reboot/halt/poweroff) | 32 |
| 8 | Network | 2 (iptables -F, ufw/firewalld disable) | 34 |
| 9 | Package managers | 4 (npm publish, pip --force-reinstall, apt/yum remove) | 38 |
| 10 | Environment | 3 (unset PATH, export PATH=, echo >> .bashrc) | 41 |
| 11 | Disk | 3 (fdisk /dev/, wipefs, parted mklabel) | 44 |
| 12 | IaC | 2 (terraform destroy -auto-approve, pulumi destroy --yes) | 46 |
| 13 | Cloud | 4 (aws s3 rm, ec2/rds terminate, az vm/group delete, gcloud compute delete) | 50 |
| 14 | Databases | 4 (mongo dropDatabase, redis FLUSHALL/FLUSHDB, mysqladmin drop) | **54** |
| | **Total** | **+46 nuevos** | **54 patrones** |

**Estructura del código (organización por categoría):**

```typescript
const DESTRUCTIVE_PATTERNS: RegExp[] = [
  // ─── Filesystem ─────────────────────────────────────
  /rm\s+-[a-z]*r[a-z]*f\b/i,    // [existente]
  /rm\s+-[a-z]*f[a-z]*r\b/i,    // [existente]
  /shred\s+/i,                  // [nuevo]
  /find\s+.*-exec\s+rm\b/i,     // [nuevo]
  /find\s+.*-delete\b/i,        // [nuevo]

  // ─── Git ────────────────────────────────────────────
  /git\s+push\s+(-f|--force)\b/i,  // [existente]
  /git\s+reset\s+--hard\b/i,       // [nuevo]
  /git\s+clean\s+-fd\b/i,          // [nuevo]
  /git\s+filter-repo\b/i,          // [nuevo]
  /git\s+branch\s+-D\b/i,          // [nuevo]
  /git\s+stash\s+(drop|clear)\b/i, // [nuevo]

  // ... (continúa con 12 categorías más)

  // ─── Databases ─────────────────────────────────────
  /(mongo|mongosh)\s+.*\bdropDatabase\b/i,
  /redis-cli\s+.*(FLUSHALL|FLUSHDB)\b/i,
  /mysqladmin\s+drop\b/i,
]
```

**Criterios de Aceptación:**
- [ ] Array `DESTRUCTIVE_PATTERNS` contiene **≥50 patrones totales**
- [ ] Patrones organizados en 14+ bloques con comentarios `// ─── Categoría ──`
- [ ] 7 patrones existentes preservados sin cambios
- [ ] Cada bloque con comentario JSDoc que explica intención

**Verificación:**
- [ ] Conteo manual: `rg "^/" template/obligatorio/.opencode/plugins/sdd-pipeline.ts` filtrado a DESTRUCTIVE_PATTERNS ≥ 50
- [ ] `rg "^// ─" template/obligatorio/.opencode/plugins/sdd-pipeline.ts` ≥ 14 matches
- [ ] `wc -l template/obligatorio/.opencode/plugins/sdd-pipeline.ts` ≤ 700
- [ ] `bun test` — 502/0 (sin regresión)
- [ ] `just check` — 0 errores
- [ ] E2E — 15/15

**Dependencias:** Ninguna (paralelo con T1).
**Archivos:** `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (modificar).
**Commit:** `feat(plugin): add 50+ destructive command patterns (#30)`
**Scope:** M (1.5h).

**Tests manuales (no formales):**
- [ ] `rm -rf /` → bloqueado
- [ ] `rm -fir /` → bloqueado
- [ ] `git push --force origin main` → bloqueado
- [ ] `git reset --hard HEAD~5` → bloqueado
- [ ] `DROP TABLE users` → bloqueado
- [ ] `TRUNCATE TABLE logs` → bloqueado
- [ ] `kubectl delete pods --all` → bloqueado
- [ ] `terraform destroy -auto-approve` → bloqueado
- [ ] `redis-cli FLUSHALL` → bloqueado
- [ ] `npm install package` → **NO** bloqueado
- [ ] `git status` → **NO** bloqueado

---

### 🔒 Slice 4: Config Command Restrictions (Issue #30 — parte 2)

#### ✅ FEV7-T5: Add 50+ deny entries to opencode.json
**Descripción:** Añadir entradas `bash` "deny" en `template/obligatorio/opencode.json` para los mismos 50+ comandos. Capa declarativa que complementa el plugin runtime.

**Sintaxis OpenCode bash permissions:**
- `"command*": "deny"` — deniega comando + cualquier argumento
- `"* command*": "deny"` — deniega desde cualquier cwd (más común)

**Entradas a añadir en `permission.bash` (después de credentials deny entries):**

```json
"rm -rf *": "deny",
"rm -fr *": "deny",
"shred *": "deny",
"find * -exec rm *": "deny",
"find * -delete": "deny",
"git push -f *": "deny",
"git push --force *": "deny",
"git reset --hard *": "deny",
"git clean -fd *": "deny",
"git filter-repo *": "deny",
"git branch -D *": "deny",
"git stash drop": "deny",
"git stash clear": "deny",
"drop table *": "deny",
"drop database *": "deny",
"drop schema *": "deny",
"truncate table *": "deny",
"truncate *": "deny",
"docker rm -f *": "deny",
"docker rmi -f *": "deny",
"docker system prune -a *": "deny",
"docker volume rm *": "deny",
"docker volume prune *": "deny",
"kubectl delete * --all *": "deny",
"kubectl drain *": "deny",
"chmod -R 777 *": "deny",
"chmod 777 *": "deny",
"chown -R *": "deny",
"kill -9 0": "deny",
"kill -9 1": "deny",
"shutdown -h *": "deny",
"shutdown -r *": "deny",
"reboot": "deny",
"halt": "deny",
"poweroff": "deny",
"iptables -F *": "deny",
"iptables -F": "deny",
"ufw disable": "deny",
"firewalld disable": "deny",
"npm publish *": "deny",
"npm publish": "deny",
"pip install * --force-reinstall *": "deny",
"apt remove *": "deny",
"apt purge *": "deny",
"apt-get remove *": "deny",
"apt-get purge *": "deny",
"yum remove *": "deny",
"dnf remove *": "deny",
"unset PATH": "deny",
"fdisk /dev/*": "deny",
"wipefs *": "deny",
"terraform destroy -auto-approve *": "deny",
"pulumi destroy --yes *": "deny",
"aws s3 rm --recursive *": "deny",
"aws ec2 terminate-instances *": "deny",
"aws rds delete-db-instance *": "deny",
"az vm delete *": "deny",
"az group delete *": "deny",
"gcloud compute instances delete *": "deny",
"mongo * dropDatabase": "deny",
"mongosh * dropDatabase": "deny",
"redis-cli * FLUSHALL": "deny",
"redis-cli * FLUSHDB": "deny",
"mysqladmin drop *": "deny"
```

**Criterios de Aceptación:**
- [ ] Sección `permission.bash` contiene **≥50 deny entries nuevas**
- [ ] Sintaxis correcta OpenCode (`"command*": "deny"` o `"* command*": "deny"`)
- [ ] Deny entries existentes (credentials) NO modificadas
- [ ] JSON válido

**Verificación:**
- [ ] `bun -e "JSON.parse(require('fs').readFileSync('template/obligatorio/opencode.json', 'utf8'))"` exit 0
- [ ] `rg -c "\"deny\"" template/obligatorio/opencode.json` — total deny entries ≥ 82 (32 existentes + 50 nuevas)
- [ ] `just check` — 0 errores
- [ ] `bun test` — sin regresión

**Dependencias:** FEV7-T4 (categorías deben coincidir).
**Archivos:** `template/obligatorio/opencode.json` (modificar).
**Commit:** `feat(config): add 50+ destructive command deny entries (#30)`
**Scope:** S (45min).

---

### 📚 Slice 5: Documentation & Release

#### ✅ FEV7-T6: Update plugin README.md
**Descripción:** Actualizar sección "1. Destructive Command Blocking" en `template/obligatorio/.opencode/plugins/README.md` con las 14 categorías y 50+ patrones. Añadir subsección "Defense-in-Depth".

**Cambios:**
1. Reemplazar lista de 7 patrones con lista completa organizada por categoría
2. Añadir tabla resumen con conteo por categoría
3. Añadir subsección "Defense-in-Depth" explicando plugin + config
4. Actualizar referencias a conteo de agentes (103 → 103 sigue igual)

**Criterios de Aceptación:**
- [ ] Sección lista 14 categorías con conteo
- [ ] Subsección "Defense-in-Depth" presente
- [ ] Estructura del README mantenida (no se reorganizan secciones)
- [ ] README crece ~50-80 líneas (163 → ~220)

**Verificación:**
- [ ] `rg "Defense-in-Depth" template/obligatorio/.opencode/plugins/README.md` → 1 match
- [ ] `rg "^### .* Filesystem|^### .* Git" template/obligatorio/.opencode/plugins/README.md` → 5+ matches
- [ ] `wc -l template/obligatorio/.opencode/plugins/README.md` ≥ 200
- [ ] `just check` — 0 errores

**Dependencias:** FEV7-T4 (patrones definidos).
**Archivos:** `template/obligatorio/.opencode/plugins/README.md` (modificar).
**Commit:** `docs(plugin): document 50+ destructive command patterns (#30)`
**Scope:** S (45min).

---

#### ✅ FEV7-T7: Update CHANGELOG.md with v1.1.0 entry
**Descripción:** Añadir entrada v1.1.0 a `CHANGELOG.md` siguiendo Keep a Changelog.

**Entrada (resumen):**

```markdown
## [v1.1.0] - 2026-07-10

### Added
- **Agent Governance (Issue #26):** No-assumption rule (6 agentes) + delegation-first (3 agentes).
- **Destructive Command Restrictions (Issue #30):** 50+ patrones en plugin + opencode.json.
- **Step counts (Issue #27, FEV-6):** Ajustados para 6 agentes primarios.
- **SECURITY.md (Issue #28, FEV-6):** Creado en docs/ y template/estandar/docs/.

### Changed
- **Coverage artifact (TD-1.2, FEV-6):** Constructores explícitos en VersionComparator + ClackPromptsAdapter.

### Security
- **Destructive command hardening (Issue #30):** rm -rf, git push --force, DROP DATABASE, mkfs, dd if=, chmod 777, git reset --hard, kubectl delete --all, terraform destroy -auto-approve, redis FLUSHALL, y 40+ patrones adicionales ahora bloqueados en runtime.
```

**Criterios de Aceptación:**
- [ ] Entrada `[v1.1.0]` con fecha 2026-07-10
- [ ] 3+ secciones: Added, Changed, Security
- [ ] Referencias a #26, #27, #28, #30

**Verificación:**
- [ ] `rg "v1.1.0.*2026-07-10" CHANGELOG.md` → 1 match
- [ ] `rg "Issue #26|Issue #30" CHANGELOG.md` → 2+ matches

**Dependencias:** FEV7-T1, T2, T4, T5.
**Archivos:** `CHANGELOG.md` (modificar).
**Commit:** `docs(changelog): v1.1.0 entry with agent governance and security hardening`
**Scope:** XS (20min).

---

#### ✅ FEV7-T8: Bump version to 1.1.0 in package.json
**Descripción:** Cambiar `"version": "1.0.14"` a `"version": "1.1.0"` en `package.json`.

**Criterios de Aceptación:**
- [ ] `"version": "1.1.0"`
- [ ] Ningún otro campo modificado

**Verificación:**
- [ ] `rg "\"version\"" package.json` → muestra `"version": "1.1.0"`
- [ ] `git diff package.json` → 1 línea modificada
- [ ] `just check` — 0 errores

**Dependencias:** FEV7-T7 (CHANGELOG primero).
**Archivos:** `package.json` (modificar).
**Commit:** `chore(release): bump version to 1.1.0`
**Scope:** XS (5min).

---

## Checkpoints

### Checkpoint 1: After T1, T2, T3
- [ ] 6 agentes con `## NO-ASSUMPTION RULE`
- [ ] 3 agentes (quetzalcoatl, tlaloc, mictlantecuhtli) con `## DELEGATION-FIRST RULE`
- [ ] 3 agentes (huitzilopochtli, moctezuma, tezcatlipoca) SIN `## DELEGATION-FIRST RULE`
- [ ] Los 6 agentes ≤150 líneas
- [ ] `just check` — 0 errores
- [ ] `bun test` — 502/0 (sin regresión)

**Bloqueante para T4/T5:** Si falla, NO proceder a Slices 3-4.

### Checkpoint 2: After T4, T5
- [ ] `DESTRUCTIVE_PATTERNS` ≥50 entradas en 14 categorías
- [ ] `opencode.json` `permission.bash` ≥50 deny entries nuevas
- [ ] Categorías coinciden entre plugin y config
- [ ] JSON válido
- [ ] `just check` — 0 errores
- [ ] `bun test` — 502/0 (sin regresión)
- [ ] E2E — 15/15

**Bloqueante para T6/T7/T8:** Si falla, NO proceder a Slice 5.

### Gate FEV-7
- [ ] 8 commits atómicos en `feat/v1.1.0-fev-7`
- [ ] Issue #26 resuelto (6 + 3 agentes)
- [ ] Issue #30 resuelto (50+ comandos en 2 capas)
- [ ] Plugin README actualizado
- [ ] CHANGELOG v1.1.0 entry presente
- [ ] Versión bump a 1.1.0
- [ ] Sin regresión en tests, coverage, ni E2E
- [ ] Listo para PR a `develop`

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FEV7-T0: Análisis Issues (no commit) | XS | 20min |
| FEV7-T1: No-assumption 6 agentes | S | 30min |
| FEV7-T2: Delegation-first 3 agentes | S | 20min |
| FEV7-T3: Verificar ≤150 líneas | XS | 15min |
| FEV7-T4: Patrones en sdd-pipeline.ts | M | 1.5h |
| FEV7-T5: Deny entries en opencode.json | S | 45min |
| FEV7-T6: Actualizar plugin README | S | 45min |
| FEV7-T7: CHANGELOG v1.1.0 | XS | 20min |
| FEV7-T8: Bump version 1.1.0 | XS | 5min |
| Checkpoint 1 | — | 10min |
| Checkpoint 2 | — | 10min |
| Gate FEV-7 | — | 10min |
| Commits (8) | — | 20min |
| Code review | — | 1h |
| **Total** | | **~6-7h** |

---

## Post-FEV-7 (preview de FEV-8)

FEV-7 sienta las bases para FEV-8 (Obsidian Subagent):
- Nuevo subagente `obsidian-vault-writer` se añadirá a `VALID_SUBAGENTS` (compatible con los patrones destructivos actuales)
- Modificaciones a tablas de delegación de 3 agentes (compatible con delegation-first recién añadido)
- Huitzilopochtli puede actualizarse (compatible con no-assumption recién añadido)

Las modificaciones de FEV-7 son **compatibles** con FEV-8 (no se requieren refactor).

---

*Última actualización: 2026-07-10 (FEV-7 planificado)*
