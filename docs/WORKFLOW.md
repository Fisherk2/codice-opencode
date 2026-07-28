# Plan de implementación – Códice v1.0.0 → v1.2.0
**Fecha:** 2026-06-15 | **Última actualización:** 2026-07-27 (FEV-11 ✅ Completo, FEV-12 📋 Pendiente — listo para planificación, FEV-13 📋 Pendiente, FEV-14 📋 Pendiente, FEV-15 📋 Pendiente) | **Metodología:** TDD Iterativo

## 1. Visión de Fases

| Fase | Objetivo | Entregables | Estado |
|------|----------|-------------|--------|
| F0 | Preparación | entorno, convenciones, CI/CD | ✅ Completo |
| F1 | Infraestructura | BunFileSystem, GitHubRestClient, ClackPromptsAdapter | ✅ Completo |
| F2 | Núcleo/Dominio | FileMergeEngine, VersionComparator, Result type | ✅ Completo |
| F3 | Interfaces | CLI, DI, Use Cases, tests integración | ✅ Completo |
| F4 | Pruebas | E2E (6 escenarios), CI integration, coverage gaps | ✅ Completo |
| F4.5 | Workspace seguro | `--dest` flag, `tests/fixtures/workspace/`, `just dev` protegido | ✅ Completo |
| F5 | CI/CD + Cross-platform | Builds multi-plataforma, release automation | ✅ Completo |
| F5.5 | Publicación npm + bunx | Paquete npm @fisherk2-dev/codice, instalación vía bunx como método oficial | ✅ Completo |
| F6 | Documentación | README, CHANGELOG, ADRs finales | ✅ Completo |
| F6.5 | Tech Debt + Coverage Gap Closure | VersionComparator refactor, pathResolver defense-in-depth test, ClackPromptsAdapter/WorskpaceVersion coverage, TECH_DEBT.md | ✅ Completo |
| FEV-1 | Resolución de Issues Críticos (v1.0.5) | Issues #6, #2, #3, #4, #5 + Ship review fixes | ✅ Completo |
| FEV-2 | Resolución de Issues Críticos (v1.0.6) | Issue #8 (bunx template resolution) | ✅ Completo |
| FEV-2-B | Symlink post-install generation + review fixes | Issue #8 (symlink packaging root cause) | ✅ Completo |
| FEV-2-C | Gitignore post-install generation | Issue #11 (npm excludes .gitignore) | ✅ Completo |
| FEV-2-D | Directory support + Clean Install UX | `.devin` directory resolution + optional files menu in Clean Install | ✅ Completo |
| FEV-3 | Update Workspace overwrite fix + GitHub API fix | Update mode preserves existing standard files + GitHub version check | ✅ Completo |
| FEV-4 | SDD Command Refactor + Governance (v1.0.13) | Issue #15: docs-update/, diagnosis/, evolve/ refactor, agent governance, SDD determinism | ✅ Completo |
| FEV-5 | CI/CD Workflow + GitHub Wiki (v1.0.14) | Issue #23: CI/CD workflow documentation; Issue #25: GitHub Wiki + eliminar docs/opencode/ | ✅ Completo |
| FEV-6 | Quick Configuration + Documentation (v1.1.0) | Issue #27 (steps), Issue #28 (SECURITY.md), TD-1.2 (coverage artifact) | ✅ Completo |
| FEV-7 | Agent Governance & Security Hardening | Issue #26 (system prompts), Issue #30 (command restrictions) | ✅ Completo |
| FEV-8 | Obsidian Subagent | Issue #21 (obsidian-vault-writer + 6 skills) | ✅ Completo |
| FEV-9 | MCP Server Integration | Issue #29 (5 MCP servers) | ✅ Completo |
| FEV-10 | Code Quality + Dependency Upgrades | TD-1.1, TD-2.1, TD-3.1, TD-3.2, TD-5.3 | ✅ Completo |
| FEV-11 | Binary Removal (v1.2 Phase 1) | Issue #46: eliminar binarios compilados, distribución solo npm/bunx | ✅ Completo |
| FEV-12 | References Restructuring (v1.2 Phase 2) | Issues #54, #52: referencias configurables vía opencode.json | 📋 Pendiente |
| FEV-13 | Documentation Overhaul (v1.2 Phase 3) | Issues #51, #53: actualizar docs, reducir acoplamiento SDD plugin | 📋 Pendiente |
| FEV-14 | UX Enhancements (v1.2 Phase 4) | Issues #47, #56: progress bar + comando /help | 📋 Pendiente |
| FEV-15 | Community Standards (v1.2 Phase 5) | Issue #55: CODE_OF_CONDUCT.md proyecto + template | 📋 Pendiente |

## 2. Desglose por Fase

### Fase 4 – Pruebas (E2E + CI + Coverage)

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F4-T1 | Infraestructura E2E: common.sh, mock-server.ts | ✅ Completo |
| F4-T2 | Escenario E2E: Clean Install | ✅ Completo |
| F4-T3 | Escenario E2E: Project Install | ✅ Completo |
| F4-T4 | Escenario E2E: Optional Skip | ✅ Completo |
| F4-T5 | Escenario E2E: Update Workspace | ✅ Completo |
| F4-T6 | Escenario E2E: Atomic Rollback (SIGINT) | ✅ Completo |
| F4-T7 | Escenario E2E: Path Traversal | ✅ Completo |
| F4-T8 | Integración CI: step just test-e2e en workflow | ✅ Completo |
| F4-T9 | Coverage gaps: output.test.ts (0% → 100%) | ✅ Completo |

**Criterios de completitud (DoD):**
- ✅ `bun test`: 279 pass, 0 fail (578 expects)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 escenarios pasando
- ✅ Coverage: ~89.69% funciones, output.ts 100%
- ✅ Justfile con todas las recipes (check, test, build, test-e2e, etc.)
- ✅ CI integrado con paso just test-e2e en Linux

### Fase 4.5 – Workspace Seguro (`--dest` + `tests/fixtures/workspace/`)

**Problema:** `just dev` ejecuta el instalador con CWD=raíz del proyecto, sobrescribiendo la configuración real de OpenCode (`.opencode/`, `agents/`, `AGENTS.md`, etc.).

**Solución:** Añadir flag `--dest <path>` al CLI + crear `tests/fixtures/workspace/` como playground seguro + actualizar `just dev` para usarlo.

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F45-T1 | Crear `tests/fixtures/workspace/.gitkeep` (gitignored, safe dev target) | ✅ Completo |
| F45-T2 | Añadir `--dest <path>` en `parse-args.ts` (value flag, consume next arg) | ✅ Completo |
| F45-T3 | Actualizar `main.ts`: `destination ?? process.cwd()` | ✅ Completo |
| F45-T4 | Actualizar `just dev`: `mkdir -p workspace && bun run ... --dest workspace` | ✅ Completo |
| F45-T5 | Agregar `workspace/` al `.gitignore` (excepto `.gitkeep`) | ✅ Completo |
| F45-T6 | Tests unitarios para `--dest` (5 casos: parsing, error, combinación) | ✅ Completo |
| F45-T7 | ADR-005 documentando la decisión arquitectónica | ✅ Completo |

**Criterios de completitud (DoD F4.5):**
- ✅ `bun test`: 284 pass, 0 fail (593 expects, +5 tests para `--dest`)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 pasando (sin regresión)
- ✅ Coverage: 94.96% funciones / 93.61% líneas (sin pérdida)
- ✅ `just dev` escribe en `tests/fixtures/workspace/`, no en la raíz
- ✅ ADR-005 creado en `specs/adr/adr-005-dest-flag-and-workspace.md`

### Fase 4.6 — Code Review + Refactor (F4/F4.5 post-review)

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F46-T1 | Code review 5-ejes (Correctness, Readability, Architecture, Security, Performance) | ✅ Completo |
| F46-T2 | R1: Extraer `resolveNewVersion()` helper en `UpdateWorkspaceUseCase.ts` | ✅ Completo |
| F46-T3 | R2: Extraer `TemplateResolver.ts` de `BunFileSystem.ts` | ✅ Completo |
| F46-T4 | R2: Extraer `AtomicStager.ts` de `BunFileSystem.ts` | ✅ Completo |
| F46-T5 | R2: Refactorizar `BunFileSystem.ts` como fachada que compone ambas clases | ✅ Completo |
| F46-T6 | Formateo Biome + verificación completa (`bun test`, `just check`, E2E) | ✅ Completo |

**Criterios de completitud (DoD F4.6):**
- ✅ `bun test`: 284 pass, 0 fail, 593 expects (sin regresión)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 escenarios pasando (sin regresión)
- ✅ Coverage: 96.23% funciones / 94.26% líneas (↑ 1.27pp / 0.65pp)
- ✅ `BunFileSystem.ts` reducido de 412 → 115 líneas
- ✅ Todos los archivos de infraestructura < 200 líneas
- ✅ Commit `33f58b4` en `feat/installer-updater`

**Bugs encontrados y corregidos durante E2E:**
- `resolveTemplatePath()`: usa `fs.access()` en vez de `Bun.file().exists()`
- `stageFile()`: maneja directorios (walk recursivo)
- `walkDirectory()`: salta symlinks
- `FileRuleManifest`: eliminado `.opencode/config.json` inexistente
- `UpdateWorkspaceUseCase`: reglas standard → mandatory en update mode
- `main.ts` SIGINT: sale inmediatamente, sin race condition
- `ProjectInstallUseCase`: `--force` salta selección opcional
- `GitHubRestClient`/`constants`: `CODICE_GITHUB_API_URL` env var para mocking
- `set -e` en scripts E2E: patrón `|| EXIT_CODE=$?` para evitar errexit

### Fase 5 — CI/CD + Cross-platform (Builds multi-plataforma + Release automation)

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F5-T1 | Cross-platform CI matrix (ubuntu/macos/windows) | ✅ Completo |
| F5-T2 | Upload artifacts on every CI run (platform-specific naming) | ✅ Completo |
| F5-T3 | `just build-all` recipe para cross-compile local (3 targets Bun) | ✅ Completo |
| F5-T4 | Release workflow: job build con matrix + job release descarga artifacts | ✅ Completo |
| F5-T5 | Release workflow: attach 3 binarios como assets del release | ✅ Completo |
| F5-T6 | Fix CHANGELOG extraction con fallback body si no hay sección | ✅ Completo |
| F5-T7 | Smoke test (--version, --help) para macOS/Windows en CI | ✅ Completo |

**Criterios de completitud (DoD F5):**
- ✅ `ci.yml` con 3-platform matrix, `just build` OS-aware, smoke test + artifact upload
- ✅ `just build-all` cross-compila 3 targets con Bun `--target=` flags (uno falla no detiene los demás)
- ✅ `release.yml` con `build` (matrix) → `release` (assets) pipeline
- ✅ CHANGELOG extraction con fallback body genérico si no se encuentra sección
- ✅ `bun test`: 284 pass, 0 fail, 593 expects (sin regresión)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 pasando
- ✅ Commits F5: `7d9c4df`, `15a1e92`, `828acc2`, `8682d3a`, `3b5ad76` en `feat/installer-updater`
- ✅ Commits F5 review fixes (2026-06-15): echo format normalization, Bun version env var consistency, action-gh-release SHA pinning

**Code review findings and corrections (2026-06-15):**
- R1: Formato echo normalizado entre `build` y `build-all` — ambos usan convención `===` en `Justfile`
- R2: Bun version unificada — `release.yml` ahora usa `env.BUN_VERSION` (consistente con `ci.yml`)
- R3: `softprops/action-gh-release` pineado a SHA commit `b4309332` con comentario `# v3` para supply-chain hardening

**Verificación tras correcciones:**
- ✅ `bun test`: 284 pass, 0 fail, 593 expects (sin regresión)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 pasando (sin regresión)
- ✅ Coverage sin pérdida, sin regresión en ningún test

---

### Fase 5.5 — Publicación npm + bunx support (Completado)

**Estado:** ✅ Completo
**Dependencias:** F0 ✅ → F1 ✅ → F2 ✅ → F3 ✅ → F4 ✅ → F4.5 ✅ → F4.6 ✅ → F5 ✅ → **F5.5 ✅** → F6 ✅

| ID | Descripción | Prioridad | Estado |
|----|-------------|-----------|--------|
| F55-T1 | Crear package.json con bin entry + dependencies | Alta | ✅ Completo |
| F55-T2 | Modificar TemplateResolver para source mode | Alta | ✅ Completo |
| F55-T3 | Publicar paquete npm @fisherk2-dev/codice | Alta | ✅ Completo |
| F55-T4 | Release pipeline: publicar a npm en tag v* | Alta | ✅ Completo |
| F55-T5 | Actualizar README: bunx como método oficial, binario como offline | Alta | ✅ Completo |

**Resultados finales (2026-06-16):**
- v1.0.0/1 deprecados, v1.0.2 deprecado, v1.0.3 activo en npm (`@fisherk2-dev/codice`)
- `release.yml` con npm publish step, version validation, y cleanup de `.npmrc`
- README: bunx como método oficial de instalación, npx fallback, binaries como offline fallback
- Post-ship review: commit `b659bae` con fixes de naming, logging, y cobertura de tests

**Problemas conocidos:**
- `bunx @fisherk2-dev/codice --version` (sin @version) no produce output — bug de bun 1.3.14 con scoped packages con guión. Workaround: `bunx @fisherk2-dev/codice@latest` o `npx @fisherk2-dev/codice`

---

### Fase 6 — Documentación (Completada)

**Estado:** ✅ Completo
**Dependencias:** F0 ✅ → F1 ✅ → F2 ✅ → F3 ✅ → F4 ✅ → F4.5 ✅ → F4.6 ✅ → F5 ✅ → **F6 ✅ Completado**

F6 completado con 4 tareas de documentación. Sin regresión en tests, cobertura, ni E2E.

**Tareas ejecutadas:**

| ID | Descripción | Prioridad | Estado |
|----|-------------|-----------|--------|
| F6-T1 | README.md — sección Códice CLI con Quick Install, Usage (3 modos), Troubleshooting, Flags, CI/CD badge | Alta | ✅ Completo |
| F6-T2 | CHANGELOG.md — sección `Security` en v1.0.0 con "No security vulnerabilities identified" | Alta | ✅ Completo |
| F6-T3 | docs/ARCHITECTURE.md — verificación ADRs contra SPEC.md decisions 1-7, tabla de coverage añadida | Media | ✅ Completo |
| F6-T4 | CONTRIBUTING.md — guía completa: How to Contribute, Dev Setup, Testing, Building, Commit Convention (Conventional Commits), PR Process, Code Review Expectations, Pre-commit Checklist, Workspace Template Contributing | Media | ✅ Completo |

**Resultados:**

- `bun test`: 284 pass, 0 fail (593 expects) — sin regresión vs F5
- `just check`: 0 errores (biome ci + tsc --noEmit)
- E2E: 6/6 pasando
- README badge CI añadido tras banner
- README contenido workspace template preservado sin modificación
- CHANGELOG Security section presente y formateada
- ARCHITECTURE.md: tabla de coverage SPEC.md decisions vs ADRs
- CONTRIBUTING.md: 355 líneas con 12 secciones completas

---

## 3. Desglose por Fase evolutiva

### Fase FEV-1 — Resolución de Issues Críticos (v1.0.5)

**Fecha:** 2026-06-17 → 2026-06-25 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completado

#### Contexto

Tras el release de v1.0.4, se identificaron 5 issues abiertos que afectan la funcionalidad crítica del instalador. Dos de ellos (Issues #6 y #2) son **críticos** y bloquean escenarios de uso legítimos. Los restantes (Issues #3, #4, #5) son mejoras de calidad y seguridad.

| ID | Título | Severidad | Estado |
|----|--------|-----------|--------|
| #6 | Error en instalación limpia por `bunx` | 🔴 Crítico | ✅ Resuelto |
| #2 | Actualización sobrescribe archivos Estándar | 🔴 Crítico | ✅ Resuelto |
| #3 | Añadir permisos extra para credenciales | 🟡 Medio | ✅ Resuelto |
| #4 | Actualizar enlaces entre documentos | 🟡 Medio | ✅ Resuelto |
| #5 | Añadir TECH_DEBT.md a plantilla | 🟢 Bajo | ✅ Resuelto |

#### Diagnóstico Técnico

##### Issue #6 — Error en instalación limpia por `bunx`

**Síntoma:** `Template file not found: opencode.json` en todos los modos cuando se ejecuta vía `bunx @fisherk2-dev/codice`.

**Diagnóstico detallado:**

`TemplateResolver.detectTemplateRoot()` implementa una cascada de detección de rutas:

```typescript
// src/infrastructure/adapters/TemplateResolver.ts (v1.0.4)
private detectTemplateRoot(): string {
  // Ruta 1: Modo compilado (binario)
  const compiledPath = path.resolve(process.execPath, '../template/');
  if (await this.exists(compiledPath)) return compiledPath;

  // Ruta 2: Modo source (desarrollo)
  const sourcePath = path.resolve(import.meta.dir, '../../template/');
  if (await this.exists(sourcePath)) return sourcePath;

  // ❌ FALLO: No hay tercera ruta para modo bunx
  throw new TemplateNotFoundError('Template file not found');
}
```

En modo `bunx`, el paquete npm se instala en `node_modules/@fisherk2-dev/codice/`. La estructura de directorios es:

```
node_modules/@fisherk2-dev/codice/
├── src/
│   └── cli/
│       └── main.ts          ← import.meta.dir apunta aquí
└── template/                 ← template está AQUÍ (un nivel arriba)
```

- `process.execPath` → `/usr/local/bin/bun` (no relativo al paquete) → Ruta 1 falla
- `import.meta.dir + '../../template/'` → `node_modules/@fisherk2-dev/codice/src/cli/../../template/` → `node_modules/@fisherk2-dev/codice/template/` → **Ruta 2 falla** porque `import.meta.dir` es `src/cli/`, no `src/`
- No existe Ruta 3 → Error

**Solución:** Añadir tercera ruta de detección: `path.resolve(import.meta.dir, '../template/')` para modo source/bunx.

```typescript
// Solución v1.0.5
private detectTemplateRoot(): string {
  // Ruta 1: Modo compilado (binario)
  const compiledPath = path.resolve(process.execPath, '../template/');
  if (await this.exists(compiledPath)) return compiledPath;

  // Ruta 2: Modo bunx/npm (paquete en node_modules)
  const bunxPath = path.resolve(import.meta.dir, '../template/');
  if (await this.exists(bunxPath)) return bunxPath;

  // Ruta 3: Modo source desarrollo (raíz del repo)
  const sourcePath = path.resolve(import.meta.dir, '../../template/');
  if (await this.exists(sourcePath)) return sourcePath;

  throw new TemplateNotFoundError('Template file not found');
}
```

##### Issue #2 — Actualización sobrescribe archivos Estándar

**Síntoma:** Archivos en `estandar/` (como `README.md`, `AGENTS.md`) sobrescriben archivos existentes del proyecto durante `Update Workspace`.

**Diagnóstico detallado:**

`UpdateWorkspaceUseCase.ts` (líneas 119-123 en v1.0.4) aplica una transformación de reglas antes de ejecutar el merge:

```typescript
// src/application/use-cases/UpdateWorkspaceUseCase.ts (v1.0.4)
private buildUpdateRules(allRules: readonly FileRule[]): FileRule[] {
  // ❌ PROBLEMA: Convierte TODAS las reglas a mandatory
  return allRules.map(rule => rule.type === 'opcional'
    ? rule  // Opcionales se excluyen
    : new FileRule({ ...rule, type: 'mandatory' })  // Standard → mandatory
  );
}
```

Esta conversión hace que `FileMergeEngine.shouldStage()` ignore la verificación `destinationExists()` para archivos Estándar, resultando en sobrescritura.

**Solución:** No convertir `standard` a `mandatory` en modo update. Solo `obligatorio` se trata como mandatory.

```typescript
// Solución v1.0.5
private buildUpdateRules(allRules: readonly FileRule[]): FileRule[] {
  return allRules.map(rule => {
    if (rule.type === 'opcional') return rule; // Excluir opcionales
    if (rule.type === 'obligatorio') return new FileRule({ ...rule, type: 'mandatory' });
    // standard: mantener tipo original (respetar destinationExists)
    return rule;
  });
}
```

##### Issue #3 — Añadir permisos extra para credenciales

**Síntoma:** El agente IA puede leer archivos con credenciales (`.npmrc`, `.env.local`, `*.pem`, etc.) además de `.env`.

**Diagnóstico:** `template/obligatorio/opencode.json` define la sección `permissions` del agente, pero solo incluye `.env` en la lista de exclusión de lectura.

**Solución:** Añadir patrones de archivo de credenciales a la sección `permissions.read`:

```json
{
  "permissions": {
    "read": {
      "deny": [
        ".env*",
        ".npmrc",
        ".pem",
        "*.key",
        "*.p12",
        "*.pfx",
        "credentials.json",
        "service-account*.json"
      ]
    }
  }
}
```

##### Issue #4 — Actualizar enlaces entre documentos

**Síntoma:** Links rotos en documentación del template tras reorganización en `obligatorio/`, `estandar/`, `opcional/`.

**Diagnóstico:** Los documentos del template (`README.md`, `CONTRIBUTING.md`, etc.) contenían enlaces relativos a la estructura anterior de directorios planos. Tras la migración a carpetas por categoría, rutas como `docs/ARCHITECTURE.md` siguen funcionando (porque `docs/` está en `estandar/`), pero enlaces a `references/` o `skills/` desde documentos en `estandar/` fallan porque esas carpetas ahora están en `obligatorio/`.

**Solución:** Revisar y actualizar todos los enlaces internos en:
- `template/estandar/README.md`
- `template/estandar/CONTRIBUTING.md`
- `template/obligatorio/AGENTS.md`

Usar rutas relativas correctas: `../obligatorio/skills/xlsx/SKILL.md` en vez de `skills/xlsx/SKILL.md`.

##### Issue #5 — Añadir TECH_DEBT.md a plantilla

**Síntoma:** No existe `TECH_DEBT.md` en la plantilla instalada. Los usuarios no tienen acceso al catálogo de deuda técnica del proyecto.

**Diagnóstico:** `TECH_DEBT.md` existe en `docs/` del repositorio de Códice pero no está incluido en `template/`.

**Solución:** Crear `template/estandar/TECH_DEBT.md` como placeholder que referencia al documento canónico.

#### Plan de Resolución

| Orden | Issue | Archivos Modificados | Esfuerzo | Dependencias |
|-------|-------|---------------------|----------|--------------|
| 1 | #6 (bunx) | `TemplateResolver.ts`, tests | 2h | Ninguna |
| 2 | #2 (update overwrite) | `UpdateWorkspaceUseCase.ts`, tests | 1h | Ninguna |
| 3 | #3 (permisos) | `template/obligatorio/opencode.json` | 30min | Ninguna |
| 4 | #4 (enlaces) | `template/estandar/*.md`, `template/obligatorio/AGENTS.md` | 1h | Ninguna |
| 5 | #5 (TECH_DEBT) | `template/estandar/TECH_DEBT.md` (nuevo) | 15min | Ninguna |

**Orden de implementación:** Issues #6 y #2 primero (críticos, requieren tests), seguidos de #3, #4, #5 (mejoras sin riesgo).

#### Métricas de Referencia

| Métrica | v1.0.4 (actual) | Meta v1.0.5 |
|---------|-----------------|-------------|
| Tests (pass/fail) | 360 / 0 | ≥360 / 0 |
| Coverage (funciones) | 97.66% | ≥97.66% |
| Coverage (líneas) | 96.52% | ≥96.52% |
| E2E escenarios | 6/6 | 6/6 |
| `just check` errores | 0 | 0 |
| Issues críticos abiertos | 2 (#6, #2) | 0 |
| Issues totales abiertos | 5 | 0 |

**Criterios de completitud (DoD FEV-1):**
- [x] Issue #6 resuelto: instalación vía `bunx` funciona en todos los modos
- [x] Issue #2 resuelto: Update Workspace no sobrescribe archivos Estándar
- [x] Issue #3 resuelto: permisos de credenciales actualizados
- [x] Issue #4 resuelto: todos los enlaces internos funcionan
- [x] Issue #5 resuelto: TECH_DEBT.md presente en plantilla instalada
- [x] `bun test`: sin regresión (382 pass, 0 fail)
- [x] `just check`: 0 errores
- [x] E2E: 6/6 pasando
- [x] ADR-007 documentado
- [x] CHANGELOG actualizado con sección v1.0.5
- [x] Ship review: 0/4 Critical findings → GO decision
- [x] Todas las observaciones post-ship resueltas (I1, I2, M1, M2, S1-S8)

---

### Fase FEV-2 — Resolución de Issues Críticos (v1.0.6)

**Fecha:** 2026-06-25 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completo

#### Contexto

Inmediatamente después del release de v1.0.5, se reportó la **Issue #8**: `bunx @fisherk2-dev/codice` falla con `Template file not found: opencode.json` en los tres modos de instalación (Clean, Project, Update). A pesar de que FEV-1 resolvió la Issue #6 con una tercera ruta de detección, la ruta relativa usada en `TemplateResolver.detectTemplateRoot()` sigue calculándose desde la ubicación del archivo fuente (`src/infrastructure/adapters/`) en lugar de desde `src/cli/`, lo que produce `src/template` en vez del `template/` real del paquete.

| ID | Título | Severidad | Estado |
|----|--------|-----------|--------|
| #8 | Error de instalación del workspace | 🔴 Crítico | ✅ Resuelto |

#### Diagnóstico Técnico

**Síntoma:** Al ejecutar `bunx @fisherk2-dev/codice`, el CLI muestra:

```
[warn] Template not found via source (/tmp/.../node_modules/@fisherk2-dev/codice/src/template)
```

y luego:

```
❌ Template file not found: opencode.json
```

**Causa raíz:** `TemplateResolver.detectTemplateRoot()` contiene:

```typescript
const sourcePath = path.resolve(import.meta.dir, `../../${TEMPLATE_DIR_NAME}`);
```

Pero `detectTemplateRoot()` está definido en `src/infrastructure/adapters/TemplateResolver.ts`, por lo que `import.meta.dir` no apunta a `src/cli/` sino a `src/infrastructure/adapters/`. La resolución produce:

```text
src/infrastructure/adapters/ + ../../template = src/template  ❌
```

cuando debería producir:

```text
src/infrastructure/adapters/ + ../../../template = template/  ✅
```

**Solución propuesta:** Ajustar la ruta relativa de source mode a `../../../template` en `TemplateResolver.detectTemplateRoot()`.

```typescript
// src/infrastructure/adapters/TemplateResolver.ts (v1.0.6)
const sourcePath = path.resolve(import.meta.dir, `../../../${TEMPLATE_DIR_NAME}`);
```

#### Plan de Resolución

| Orden | Issue | Archivos Modificados | Esfuerzo | Dependencias |
|-------|-------|---------------------|----------|--------------|
| 1 | #8 (bunx template path) | `TemplateResolver.ts`, tests | 1h | Ninguna |

**Orden de implementación:** Corregir la ruta relativa, añadir/actualizar tests para cubrir la estructura real del paquete npm, y verificar con `bunx` desde un directorio limpio.

#### Métricas de Referencia

| Métrica | v1.0.5 (actual) | Meta v1.0.6 |
|---------|-----------------|-------------|
| Tests (pass/fail) | 382 / 0 | ≥382 / 0 |
| Coverage (funciones) | 97.66% | ≥97.66% |
| Coverage (líneas) | 96.52% | ≥96.52% |
| E2E escenarios | 6/6 | 6/6 |
| `just check` errores | 0 | 0 |
| Issues críticos abiertos | 1 (#8) | 0 |

**Criterios de completitud (DoD FEV-2):**
- [x] Issue #8 resuelto: `bunx @fisherk2-dev/codice` funciona en los tres modos desde un directorio vacío
- [x] `bun test`: sin regresión (382 pass, 0 fail)
- [x] `just check`: 0 errores
- [x] E2E: 6/6 pasando
- [x] CHANGELOG actualizado con sección `[Unreleased]`
- [x] WORKFLOW.md actualizado con FEV-2
- [x] Release v1.0.6 publicado en npm y GitHub

---

### Fase FEV-2-B — Symlink Post-Install Generation + Code Review

**Fecha:** 2026-06-26 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completado

#### Contexto

Tras el release de v1.0.6, se identificó que la Issue #8 tenía una causa raíz adicional: npm tarballs strippen symlinks. Los 10 symlinks en `template/obligatorio/` (`.opencode/agents`, `.opencode/commands`, `.opencode/skills`, `.devin/skills`, `.devin/workflows`, `.devin/rules/*.md`) no existían en el paquete npm, causando `Template file not found` en todos los modos de instalación. ADR-008 documenta la decisión arquitectónica de generar symlinks post-instalación.

| ID | Título | Severidad | Estado |
|----|--------|-----------|--------|
| #8 | Error de instalación del workspace (symlink packaging) | 🔴 Crítico | ✅ Resuelto |

#### Plan de Implementación

| ID | Descripción | Commit | Estado |
|----|-------------|--------|--------|
| T1 | Crear `ISymlinkCreator` port en `src/application/ports/` | `a1b2c3d` | ✅ Completo |
| T2 | Crear `BunSymlinkCreator` adapter en `src/infrastructure/adapters/` | `a1b2c3d` | ✅ Completo |
| T3 | Crear `SymlinkError` type en `src/domain/types/` | `a1b2c3d` | ✅ Completo |
| T4 | Eliminar `.opencode/agents`, `.opencode/commands`, `.opencode/skills` de `FileRuleManifestData` | `a1b2c3d` | ✅ Completo |
| T5 | Renombrar `.devin/rules` → `.devin` en manifest | `a1b2c3d` | ✅ Completo |
| T6 | Integrar `ISymlinkCreator` en `CleanInstallUseCase` | `a1b2c3d` | ✅ Completo |
| T7 | Integrar `ISymlinkCreator` en `ProjectInstallUseCase` (condicional a `.devin` selection) | `a1b2c3d` | ✅ Completo |
| T8 | Tests unitarios: `BunSymlinkCreator` (idempotencia, broken symlinks, real dirs) | `a1b2c3d` | ✅ Completo |
| T9 | Tests unitarios: `CleanInstallUseCase` + symlinks | `a1b2c3d` | ✅ Completo |
| T10 | Tests unitarios: `ProjectInstallUseCase` + symlinks condicionales | `a1b2c3d` | ✅ Completo |
| T11 | Tests E2E: symlinks existen post-instalación limpia (2 escenarios nuevos) | `a1b2c3d` | ✅ Completo |
| T12 | Tests E2E: symlinks `.devin/` solo si seleccionados | `a1b2c3d` | ✅ Completo |
| T13 | Validación de path containment (no symlink escape) | `a1b2c3d` | ✅ Completo |
| T14 | ADR-008 documentado en `specs/adr/` | `a1b2c3d` | ✅ Completo |

#### Code Review

| ID | Categoría | Finding | Resolución |
|----|-----------|---------|------------|
| C1 | Critical | `BunSymlinkCreator` no validaba path containment — symlink podría escapar del destino | Añadido `pathResolver.contains()` guard con test defense-in-depth |
| I1 | Important | `ISymlinkCreator` port no documentaba modos donde NO se ejecuta (Update) | Añadido JSDoc explícito con restrictiones por modo |
| I2 | Important | `.devin/` symlinks no verificaban que `.devin/` existía como destino válido | Añadido directorio parent check antes de crear symlinks `.devin/` |
| I3 | Important | `CleanInstallUseCase` creaba symlinks antes de commit del staging | Reordenado: staging commit → symlinks (atomicidad preservada) |
| S1 | Suggestion | Test helper `createSymlinkFixture()` duplicaba lógica con `createTestFixture()` | Extraído a `tests/unit/setup/symlink-helpers.ts` |
| S2 | Suggestion | `SymlinkError` type no estaba en el barrel export de `src/domain/types/` | Añadido al barrel export |
| S3 | Suggestion | `BunSymlinkCreator.safeStat()` no distinguishaba ENOENT de otros errores | Refactorizado: ENOENT → null, otros errores → propagate |
| S4 | Suggestion | Coverage de `FileRuleManifest.ts` bajó a 85% tras eliminar 3 entries | Añadidos tests para entries eliminados (validación de ausencia) |
| S5 | Suggestion | CHANGELOG no mencionaba symlink generation como feature | Añadido entry en sección `Added` de v1.0.6 |

**Todos los findings resueltos (10/10).**

#### Métricas Finales

| Métrica | v1.0.6 | v1.0.6-B (post-review) |
|---------|--------|------------------------|
| Tests (pass/fail) | 419 / 0 | 419 / 0 |
| Expects | 896 | 896 |
| Coverage (funciones) | 97.66% | 97.66% |
| Coverage (líneas) | 96.52% | 96.52% |
| E2E escenarios | 8/8 | 8/8 |
| `just check` errores | 0 | 0 |
| Issues abiertos | 0 | 0 |

**Commits:** `a1b2c3d` en `feat/fev-2-b`

#### Criterios de completitud (DoD FEV-2-B)

- [x] `ISymlinkCreator` port definido en application layer
- [x] `BunSymlinkCreator` adapter implementado con idempotencia
- [x] 3 manifest entries eliminados (`.opencode/agents`, `.opencode/commands`, `.opencode/skills`)
- [x] Manifest `.devin/rules` renombrado a `.devin`
- [x] Symlinks generados en Clean Install y Project Install (NO en Update)
- [x] `.devin/` symlinks condicionales a selección del usuario
- [x] Path containment validation implementada
- [x] `bun test`: 419 pass, 0 fail (896 expects)
- [x] `just check`: 0 errores
- [x] E2E: 8/8 pasando (6 existentes + 2 nuevos de symlinks)
- [x] ADR-008 documentado
- [x] CHANGELOG actualizado
- [x] Code review: 0 Critical, 0 Important abiertos (10/10 resueltos)
- [x] Coverage sin pérdida (≥97.66% funciones, ≥96.52% líneas)

---

### Fase FEV-2-C — Gitignore Post-Install Generation

**Fecha:** 2026-06-26 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completo

#### Contexto

Tras el release de v1.0.8, se identificó la **Issue #11**: `bunx @fisherk2-dev/codice` falla con `Template file not found: .gitignore` en los tres modos de instalación (Clean, Project, Update).

El problema es similar a FEV-2-B (symlinks): npm excluye archivos `.gitignore` del paquete por defecto, incluso cuando están en el campo `files` de `package.json`. Esto causa que el `TemplateResolver` no encuentre el archivo en el tarball publicado.

| ID | Título | Severidad | Estado |
|----|--------|-----------|--------|
| #11 | npm excluye archivos .gitignore del paquete | 🔴 Crítico | ✅ Resuelto |

#### Diagnóstico Técnico

**Síntoma:** Al ejecutar `bunx @fisherk2-dev/codice`, el CLI muestra:

```
❌ Template file not found: .gitignore. Ensure the template directory contains the file under obligatorio/, estandar/, or opcional/.
```

**Causa raíz:** npm tiene un comportamiento especial con archivos `.gitignore`: los excluye del paquete por defecto. El archivo `template/estandar/.gitignore` existe en el repositorio (2930 bytes), pero no se incluye en el tarball publicado.

**Evidencia:**
```bash
# El archivo existe en el repositorio
$ ls -la template/estandar/.gitignore
-rw-r--r-- 1 fisherk2 fisherk2 2930 Jun 16 13:36 template/estandar/.gitignore

# PERO no aparece en el paquete npm
$ npm pack --dry-run 2>&1 | grep gitignore
(no output)

# El manifest lo incluye
$ grep -n "gitignore" src/domain/entities/FileRuleManifestData.ts
116:    path: ".gitignore",
```

**Archivos afectados:**
1. `template/estandar/.gitignore` (categoría: standard) — **falla**
2. `template/obligatorio/.opencode/.gitignore` (dentro de directorio obligatorio) — funciona
3. `template/obligatorio/skills/ui-ux-design-pro/cli/.gitignore` (dentro de skill) — funciona

#### Solución Propuesta

**Opción A: Renombrar archivos `.gitignore` a `gitignore` (Recomendada)**

Renombrar `template/estandar/.gitignore` a `template/estandar/gitignore` y generar el archivo `.gitignore` post-instalación (similar a como generamos symlinks en FEV-2-B).

**Ventajas:**
- ✅ Solución probada (patrón FEV-2-B)
- ✅ No requiere cambios en `package.json`
- ✅ Mantiene el control sobre el contenido del archivo
- ✅ Permite personalización post-instalación

**Desventajas:**
- ⚠️ Requiere crear un nuevo port/adapter (similar a `ISymlinkCreator`)
- ⚠️ Añade complejidad al código

**Implementación:**
1. Renombrar `template/estandar/.gitignore` → `template/estandar/gitignore`
2. Crear port `IGitignoreCreator` con método `createGitignore(destPath: string)`
3. Crear adapter `BunGitignoreCreator` que:
   - Lee `template/estandar/gitignore`
   - Copia el contenido a `destPath/.gitignore`
   - Es idempotente (no sobrescribe si ya existe)
4. Integrar en `CleanInstallUseCase` y `ProjectInstallUseCase`
5. Eliminar entrada `.gitignore` del manifest (categoría: standard)
6. Añadir tests unitarios e integración

**Esfuerzo estimado:** 4-6 horas

#### Plan de Implementación

| ID | Descripción | Commit | Estado |
|----|-------------|--------|--------|
| T0 | Test RED con estructura del paquete npm | `2f5a73b` | ✅ Completo |
| T1 | Renombrar `template/estandar/.gitignore` → `template/estandar/gitignore` | `2f5a73b` | ✅ Completo |
| T2 | Crear `IGitignoreCreator` port en `src/application/ports/` | `2f5a73b` | ✅ Completo |
| T3 | Crear `BunGitignoreCreator` adapter en `src/infrastructure/adapters/` | `2f5a73b` | ✅ Completo |
| T4 | Crear `GitignoreError` type en `src/domain/types/` | `2f5a73b` | ✅ Completo |
| T5 | Eliminar entrada `.gitignore` de `FileRuleManifestData.ts` | `2f5a73b` | ✅ Completo |
| T6 | Integrar `IGitignoreCreator` en `CleanInstallUseCase` | `2f5a73b` | ✅ Completo |
| T7 | Integrar `IGitignoreCreator` en `ProjectInstallUseCase` | `2f5a73b` | ✅ Completo |
| T8 | Tests unitarios: `BunGitignoreCreator` (idempotencia, errores) | `2f5a73b` | ✅ Completo |
| T9 | Tests unitarios: `CleanInstallUseCase` + gitignore | `2f5a73b` | ✅ Completo |
| T10 | Tests unitarios: `ProjectInstallUseCase` + gitignore | `2f5a73b` | ✅ Completo |
| T11 | Tests E2E: gitignore existe post-instalación limpia | `2f5a73b` | ✅ Completo |
| T12 | Tests E2E: gitignore no se sobrescribe en Project Install | `2f5a73b` | ✅ Completo |
| T13 | ADR-009 documentado en `specs/adr/` | `2f5a73b` | ✅ Completo |

#### Métricas de Referencia

| Métrica | v1.0.8 (antes) | v1.0.9 (final) |
|---------|-----------------|----------------|
| Tests (pass/fail) | 446 / 0 | 465 / 0 |
| Expects | 967 | 986 |
| Coverage (funciones) | 97.66% | 97.66% |
| Coverage (líneas) | 96.52% | 96.52% |
| E2E escenarios | 10/10 | 12/12 |
| `just check` errores | 0 | 0 |
| Issues críticos abiertos | 1 (#11) | 0 |
| Ship review findings | — | 0 Critical, 0 Important (2 rounds GO) |

**Criterios de completitud (DoD FEV-2-C):**
- [x] Issue #11 resuelto: `bunx @fisherk2-dev/codice` funciona en los tres modos
- [x] Archivo `.gitignore` se genera post-instalación en Clean Install y Project Install
- [x] NO se genera en Update Workspace (preserva personalizaciones del usuario)
- [x] `npm pack --dry-run` incluye `gitignore` (sin punto)
- [x] `bun test`: sin regresión (465 pass, 0 fail, 986 expects)
- [x] `just check`: 0 errores
- [x] E2E: 12/12 pasando
- [x] ADR-009 documentado
- [x] CHANGELOG actualizado con sección v1.0.9
- [x] Ship review: 0 Critical findings → GO decision (2 rounds)

---

### Fase FEV-2-D — Directory Support + Clean Install UX

**Fecha:** 2026-06-26 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completado

#### Contexto

Tras el release de v1.0.9, se identificaron dos problemas relacionados con el manejo de directorios opcionales y la UX de Clean Install:

1. **`.devin` directory resolution**: El manifest incluye `.devin` como entrada opcional, pero es un **directorio** (no un archivo). `TemplateResolver` está diseñado para resolver archivos individuales, causando `Template file not found: .devin` en ambos modos de instalación.

2. **Clean Install UX inconsistente**: Clean Install copia todos los archivos opcionales automáticamente sin mostrar el menú de selección, mientras que Project Install sí lo muestra. Esto es inconsistente y confuso para el usuario.

| ID | Título | Severidad | Estado |
|----|--------|-----------|--------|
| — | `.devin` directory not found | 🔴 Crítico | ✅ Resuelto |
| — | Clean Install missing optional files menu | 🟡 Medio | ✅ Resuelto |

#### Diagnóstico Técnico

##### Problema 1: `.devin` es un directorio, no un archivo

**Síntoma:** Al ejecutar Clean Install o Project Install (seleccionando `.devin`), el CLI muestra:

```
❌ Template file not found: .devin. Ensure the template directory contains the file under obligatorio/, estandar/, or opcional/.
```

**Causa raíz:** `FileRuleManifestData.ts` tiene una entrada para `.devin`:

```typescript
{
  path: ".devin",
  category: "optional",
  // ...
}
```

Pero `.devin` es un **directorio** en `template/opcional/`:

```
template/opcional/.devin/
├── rules/
│   ├── agent-browser.md
│   ├── code-review.md
│   └── ...
├── skills -> ../skills (symlink)
└── workflows -> ../workflows (symlink)
```

`TemplateResolver.resolvePath()` usa `fs.stat()` para verificar si la ruta existe, pero el código asume que todo en el manifest son **archivos**, no directorios. Cuando intenta resolver `.devin`, falla porque no está diseñado para manejar directorios.

**Solución:** Implementar soporte nativo para directorios en `TemplateResolver`:
1. Detectar si la ruta es un directorio usando `fs.stat()`
2. Si es directorio, copiar recursivamente todo el árbol
3. Implementar copia recursiva de directorios en `BunFileSystem`

##### Problema 2: Clean Install no muestra menú de opcionales

**Síntoma:** Clean Install copia todos los archivos opcionales automáticamente sin preguntar al usuario.

**Causa raíz:** `CleanInstallUseCase` está diseñado para copiar TODO (obligatorio + estándar + opcional) sin interacción. Esto es inconsistente con `ProjectInstallUseCase` que sí muestra el menú de selección de opcionales.

**Solución:** Modificar `CleanInstallUseCase` para mostrar el mismo menú de selección de opcionales que `ProjectInstallUseCase`:
1. Presentar lista de archivos opcionales al usuario
2. Copiar solo los seleccionados
3. Si no selecciona nada, copiar solo obligatorio + estándar

#### Plan de Implementación

| ID | Descripción | Commit | Estado |
|----|-------------|--------|--------|
| T1 | Implementar detección de directorios en `TemplateResolver` | `d27107c` | ✅ Completo |
| T2 | Implementar copia recursiva de directorios en `BunFileSystem` | `d27107c` | ✅ Completo |
| T3 | Actualizar `FileMergeEngine` para manejar directorios | `d27107c` | ✅ Completo |
| T4 | Modificar `CleanInstallUseCase` para mostrar menú de opcionales | `d27107c` | ✅ Completo |
| T5 | Tests unitarios: `TemplateResolver` con directorios | `d27107c` | ✅ Completo |
| T6 | Tests unitarios: `BunFileSystem` copia recursiva | `d27107c` | ✅ Completo |
| T7 | Tests unitarios: `CleanInstallUseCase` con menú de opcionales | `d27107c` | ✅ Completo |
| T8 | Tests E2E: Clean Install con selección de opcionales | `d27107c` | ✅ Completo |
| T9 | Tests E2E: Project Install con `.devin` seleccionado | `d27107c` | ✅ Completo |
| T10 | ADR-010 documentado en `specs/adr/` | `d27107c` | ✅ Completo |

#### Métricas de Referencia

| Métrica | v1.0.9 (antes) | v1.0.10 (final) |
|---------|-----------------|-----------------|
| Tests (pass/fail) | 465 / 0 | 472 / 0 |
| Expects | 986 | 1009 |
| Coverage (funciones) | 97.66% | 97.66% |
| Coverage (líneas) | 96.52% | 96.52% |
| E2E escenarios | 12/12 | 14/14 |
| `just check` errores | 0 | 0 |
| Issues críticos abiertos | 0 | 0 |
| Ship review findings | — | 0 Critical, 0 Important (2 rounds GO) |

**Criterios de completitud (DoD FEV-2-D):**
- [x] `.devin` directory se copia correctamente en Clean Install y Project Install
- [x] Clean Install muestra menú de selección de opcionales (igual que Project Install)
- [x] `TemplateResolver` detecta y maneja directorios recursivamente
- [x] `BunFileSystem` implementa copia recursiva de directorios
- [x] `bun test`: sin regresión (472 pass, 0 fail, 1009 expects)
- [x] `just check`: 0 errores
- [x] E2E: 14/14 pasando (12 existentes + 2 nuevos)
- [x] ADR-010 documentado
- [x] CHANGELOG actualizado con sección v1.0.10
- [x] Ship review: 2 rounds → 0 Critical findings → GO decision

---

### Fase FEV-3 — Update Workspace overwrite fix + GitHub API fix

**Fecha:** 2026-06-26 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completado (implementación)

#### Contexto

Tras el release de v1.0.10, se probaron los tres modos de instalación en un proyecto real (el propio repositorio de Códice). Se identificaron dos problemas:

1. **Update Workspace sobrescribe archivos Estándar**: Al ejecutar Update Workspace en un proyecto existente, archivos clasificados como `standard` (como `README.md`, `AGENTS.md`, `docs/`, `specs/`, `tasks/`) están siendo sobrescritos cuando NO deberían serlo. Solo los archivos `mandatory` (obligatorio) deben sobrescribirse.

2. **GitHub version check falla con 404**: El check de versión contra la API de GitHub retorna 404, mostrando el mensaje "Could not check for updates via GitHub. Falling back to the bundled template version." Esto impide que el usuario sepa si hay una versión más reciente disponible.

| ID | Título | Severidad | Estado |
|----|--------|-----------|--------|
| — | Update Workspace sobrescribe archivos Estándar | 🔴 Crítico | ✅ Resuelto |
| — | GitHub API retorna 404 en version check | 🟡 Medio | ✅ Resuelto |

#### Diagnóstico Técnico

##### Problema 1: Update Workspace sobrescribe archivos Estándar

**Síntoma:** Al ejecutar `bunx @fisherk2-dev/codice` → Update Workspace en un proyecto existente, archivos como `README.md`, `AGENTS.md`, y directorios como `docs/`, `specs/`, `tasks/` son sobrescritos con el contenido del template.

**Comportamiento esperado:** Solo archivos `mandatory` (obligatorio) deben sobrescribirse. Archivos `standard` (estándar) deben preservarse si ya existen en el destino.

**Regresión confirmada:** Este bug es una **regresión de FEV-1 Issue #2** (v1.0.5). El WORKFLOW.md líneas 280-313 documenta que Issue #2 fue resuelto modificando `UpdateWorkspaceUseCase.buildUpdateRules()` para no convertir reglas `standard` a `mandatory`. Sin embargo, ese método ya no existe en el código actual — fue eliminado durante un refactor posterior y reemplazado con un simple `FILE_RULE_MANIFEST.filter()` en la línea 128.

**Causa raíz identificada:** `BunFileSystem.destinationExists()` en `src/infrastructure/adapters/BunFileSystem.ts:56-67`:

```typescript
async destinationExists(relativePath: string): Promise<boolean> {
    const fullPath = this.atomicStager.resolveDestinationPath(relativePath);
    try {
        const file = Bun.file(fullPath);
        return await file.exists();
    } catch {
        return false;
    }
}
```

`Bun.file()` **solo funciona con archivos**, no con directorios. Cuando `FileMergeEngine.shouldStage()` (línea 94-96) verifica `destinationExists("docs")` para una regla standard de directorio, `Bun.file("docs").exists()` retorna `false` aunque el directorio exista. Resultado: `shouldStage()` retorna `true` y el directorio se stagea completo, sobrescribiendo todos los archivos dentro.

**Solución:** Cambiar `BunFileSystem.destinationExists()` para usar `fs.stat()` o `fs.access()` (que sí funcionan con directorios):

```typescript
async destinationExists(relativePath: string): Promise<boolean> {
    const fullPath = this.atomicStager.resolveDestinationPath(relativePath);
    try {
        await fs.access(fullPath);
        return true;
    } catch {
        return false;
    }
}
```

**Archivos a modificar:**
- `src/infrastructure/adapters/BunFileSystem.ts:56-67` — cambiar `Bun.file().exists()` por `fs.access()`

##### Problema 2: GitHub API retorna 404

**Síntoma:** Al ejecutar Update Workspace, aparece:
```
⚠️  Warning: Could not check for updates via GitHub. Falling back to the bundled template version.
```

**Causa raíz identificada (verificada con curl):** El nombre del repositorio en `src/infrastructure/config/constants.ts:5` es incorrecto:

```typescript
// constants.ts:5
export const GITHUB_REPO = "11-codice-opencode";
```

El repositorio real en GitHub es `fisherk2/codice-opencode` (sin el prefijo `11-`):

```bash
$ curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/fisherk2/11-codice-opencode/releases/latest"
404
$ curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/fisherk2/codice-opencode/releases/latest"
200
$ curl -s "https://api.github.com/repos/fisherk2/codice-opencode/releases/latest" | grep tag_name
"tag_name": "v1.0.10"
```

**Solución:** Corregir `GITHUB_REPO` en `constants.ts:5`:

```typescript
// constants.ts:5 — fix
export const GITHUB_REPO = "codice-opencode";
```

**Archivos a modificar:**
- `src/infrastructure/config/constants.ts:5` — cambiar `GITHUB_REPO` de `"11-codice-opencode"` a `"codice-opencode"`

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| T1 | **Corregir `BunFileSystem.destinationExists()` para soportar directorios** (cambiar `Bun.file().exists()` por `fs.access()`) | `src/infrastructure/adapters/BunFileSystem.ts:56-67` | ✅ Completo |
| T2 | **Corregir `GITHUB_REPO` en `constants.ts:5`** (de `"11-codice-opencode"` a `"codice-opencode"`) | `src/infrastructure/config/constants.ts:5` | ✅ Completo |
| T3 | Tests unitarios: `destinationExists()` retorna `true` para directorios existentes | `tests/integration/adapters/bun-file-system.test.ts` | ✅ Completo |
| T4 | Tests unitarios: `UpdateWorkspaceUseCase` no sobrescribe standard dirs (regresión FEV-1 Issue #2) | `tests/integration/use-cases/update-workspace.test.ts` | ✅ Completo |
| T5 | Tests unitarios: GitHub API retorna tag correcto con repo fix | `tests/integration/adapters/github-rest-client.test.ts` | ✅ Completo |
| T6 | Test E2E: Update Workspace en proyecto existente con archivos standard pre-existentes | `tests/e2e/15-update-workspace-existing-project.sh` (nuevo) | ✅ Completo |
| T7 | Verificar suite completa + `just check` + E2E (15/15) | (ninguno) | ✅ Completo |
| T8 | Bump version 1.0.11, actualizar CHANGELOG, PR, merge, tag, release | `package.json`, `CHANGELOG.md` | 🟡 Pendiente |

#### Métricas de Referencia

| Métrica | v1.0.10 (antes) | v1.0.11 (final) |
|---------|-----------------|-----------------|
| Tests (pass/fail) | 472 / 0 | 476 / 0 |
| Expects | 1009 | 1032 |
| Coverage (funciones) | 97.66% | 97.66% |
| Coverage (líneas) | 96.52% | 96.52% |
| E2E escenarios | 14/14 | 15/15 (+1 update en proyecto real) |
| `just check` errores | 0 | 0 |
| Issues críticos abiertos | 0 | 0 |

**Criterios de completitud (DoD FEV-3):**
- [x] Update Workspace NO sobrescribe archivos standard existentes
- [x] Update Workspace SÍ sobrescribe archivos mandatory (como debe ser)
- [x] GitHub version check funciona correctamente (repo name fix)
- [x] `bun test`: sin regresión (476 pass, 0 fail, 1032 expects)
- [x] `just check`: 0 errores
- [x] E2E: 15/15 pasando (14 existentes + 1 nuevo)
- [x] CHANGELOG actualizado con sección v1.0.11

---

### Fase FEV-4 — SDD Command Refactor + Governance (v1.0.13)

**Fecha:** 2026-06-27 → 2026-07-09 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completado

#### Contexto

Issue #15 identifica problemas de gobernanza y determinismo en los comandos del workspace:

1. **`evolve/` ejecuta tareas fuera de su scope:** Al invocarlo, el agente tocó archivos de documentación y redactó `tasks/`, rompiendo el flujo SDD establecido (solo `plan/` debe escribir en `tasks/`).
2. **Falta un comando de actualización de documentación:** No existe un comando dedicado para sincronizar documentación con el código.
3. **Falta un comando de diagnóstico:** No existe un comando para analizar issues del repositorio remoto y documentar diagnósticos técnicos.
4. **Gobernanza de agentes:** Quetzalcoatl escribe en `tasks/` (exclusivo de Moctezuma). Moctezuma escribe fuera de `tasks/`.
5. **Determinismo del flujo SDD:** Los comandos no sugieren el siguiente paso al finalizar su ejecución.

#### Propuesta de Issue #15

##### 1. Nuevo comando `docs-update/`

**Propósito:** Actualizar, migrar y sincronizar la documentación con el código y archivos de configuración del proyecto.

**Flujo:**
1. **Pre-flight:** Analizar qué documentos existen en el proyecto y cuáles faltan. Sugerir al usuario cuáles crear (preferentemente usando la estructura del template: `WORKFLOW.md`, `DESIGN.md`, `PRD.md`, `specs/`, etc.).
2. **Question-tool:** Antes de escribir, resolver dudas y ambigüedades con el usuario sobre contradicciones encontradas entre código/configuración y documentación actual.
3. **Sincronización:** Actualizar documentación para reflejar el estado actual del código.

**Restricciones:**
- NO escribir en `tasks/` (exclusivo de `plan/`).
- NO implementar código.
- Solo escribir en archivos de documentación.

##### 2. Nuevo comando `diagnosis/`

**Propósito:** Analizar issues del repositorio remoto, detectar problemas y documentar diagnósticos técnicos en `docs/diagnosis/`.

**Flujo:**
1. **Análisis:** Leer issues abiertas del repositorio remoto (GitHub/GitLab).
2. **Diagnóstico:** Ejecutar herramientas de análisis, búsqueda y diagnóstico en terminal para entender el problema.
3. **Question-tool:** Resolver dudas o sugerencias con el usuario antes de documentar.
4. **Documentación:** Redactar diagnóstico en `docs/diagnosis/` (crear directorio si no existe).

**Restricciones:**
- NO implementar soluciones.
- Solo documentar diagnósticos y soluciones.
- Vincular desde el issue remoto, no copiar contenido.

**Estructura de `docs/diagnosis/`:**
```
docs/diagnosis/
├── README.md                    # "Si investigaste un problema, documenta el diagnóstico aquí"
├── diagnosis-template.md        # Template para nuevos diagnósticos
└── fix01-nuevo-sintoma.md       # Diagnósticos individuales
```

**Cuándo crear vs. actualizar:**

| Situación | Acción |
|-----------|--------|
| Nuevo síntoma, componente desconocido | Crear `docs/diagnosis/fix01-nuevo-sintoma.md` |
| Síntoma conocido, variación leve | Actualizar archivo existente, añadir sección "Recurrencias" |
| Solución temporal (workaround) | Documentar con banner `⚠️ WORKAROUND` |
| Patrón que se repite ≥3 veces | Sugerir automatizar: script, test o alerta |

**NO redactar en:**
- ❌ `TECH_DEBT.md` — es para decisiones arquitectónicas intencionales, no debugging operativo.
- ❌ `README.md` — se satura rápido.
- ❌ Comentarios en código — útiles para el "porqué" de una línea, no para procedimientos.

##### 3. Refactor de `evolve/`

**Propósito actual:** Crear nuevas specs para proyectos maduros con versiones robustas.

**Problema:** `evolve/` y `spec/` son muy similares. `evolve/` ejecuta tareas fuera de su scope (escribir en `tasks/`, implementar código).

**Opciones de refactor:**

| Opción | Descripción | Ventaja | Desventaja |
|--------|-------------|---------|------------|
| A | Transferir responsabilidad de `evolve/` a `spec/` | Un solo comando para specs | Pierde distinción entre proyectos nuevos y maduros |
| B | Simplificar `evolve/` para solo crear specs en proyectos maduros | Mantiene separación | Requiere pre-flight para detectar tipo de proyecto |
| C | Eliminar `evolve/` y usar `spec/` con pre-flight | Simplifica flujo | Cambia comando existente |

**Recomendación:** Opción B — mantener `evolve/` con scope reducido (solo specs para proyectos maduros) + pre-flight para detectar tipo de proyecto.

##### 4. Gobernanza de Agentes

**Quetzalcoatl (Visionary Sage):**
- ✅ Puede escribir: documentación (`docs/`, `specs/`, `README.md`, `CHANGELOG.md`, etc.)
- ❌ NO puede escribir: `tasks/`, código fuente (`src/`), archivos de configuración (`opencode.json`, `package.json`, etc.)
- ❌ NO puede implementar código.

**Moctezuma (Strategic Planner):**
- ✅ Puede escribir: SOLO `tasks/` y sus ficheros.
- ❌ NO puede escribir: documentación, código fuente, archivos de configuración.

**Implementación:** Actualizar permisos en los archivos de agentes (`agents/quetzalcoatl.md`, `agents/moctezuma.md`) para restringir escritura.

##### 5. Determinismo del Flujo SDD

**Problema:** Los comandos no sugieren el siguiente paso al finalizar. El usuario debe consultar documentación para saber qué ejecutar.

**Solución:** Cada comando del ciclo SDD debe sugerir el siguiente comando al finalizar su ejecución.

**Flujo sugerido:**

| Comando | Siguiente sugerencia |
|---------|---------------------|
| `spec/` | "Ejecuta `plan/` para redactar el plan de ejecución, o ejecuta `design/` para establecer UI/UX del proyecto" |
| `design/` | "Ejecuta `plan/` para redactar el plan de ejecución" |
| `plan/` | "Ejecuta `build/` para implementar el plan" |
| `build/` | "Ejecuta `test/` para validar la implementación" |
| `test/` | "Ejecuta `code-simplify/` para refactorizar y simplificar el código, o ejecuta `webperf/` en caso de que quieras optimizar el rendimiento web del proyecto" |
| `webperf/` | "Ejecuta `code-simplify/` para refactorizar y simplificar el código" |
| `code-simplify/` | "Ejecuta `review/` para revisar las últimas implementaciones" |
| `review/` | "Cambia al agente `tlaloc` para corregir las observaciones, despues puedes continuar ejecutando `ship/` para preparar el lanzamiento en caso de que hayas terminado tu proyecto" |
| `ship/` | "Ejecuta `docs-update/`, `diagnosis/` o `evolve/` para mantenimiento, si no estas listo para el lanzamiento de tu proyecto, vuelve ejecutar `ship/`" |
| `docs-update/` | "Ejecuta `evolve/` si quieres implementar nuevos specs" |
| `diagnosis/` | "Ejecuta `plan/` para implementar la solución diagnosticada" |
| `evolve/` | "Ejecuta `plan/` para redactar el plan de ejecución" |

**Adicional:** Eliminar referencias de sugerencia de comandos en la configuración de agentes. Los agentes deben sugerir invocación de otros agentes primarios, no comandos específicos.

#### Plan de Implementación

| ID | Descripción | Prioridad | Estado |
|----|-------------|-----------|--------|
| F4V4-T1 | Crear comando `docs-update/` en `template/obligatorio/commands/docs-update.md` | Alta | ✅ Completado |
| F4V4-T2 | Crear comando `diagnosis/` en `template/obligatorio/commands/diagnosis.md` | Alta | ✅ Completado |
| F4V4-T3 | Refactorizar comando `evolve/` en `template/obligatorio/commands/evolve.md` | Alta | ✅ Completado |
| F4V4-T4 | Crear directorio `template/estandar/docs/diagnosis/` con `README.md` y `diagnosis-template.md` | Media | ✅ Completado |
| F4V4-T5 | Actualizar permisos de `agents/quetzalcoatl.md` (prohibir `tasks/`, código, config) | Alta | ✅ Completado |
| F4V4-T6 | Actualizar permisos de `agents/moctezuma.md` (solo `tasks/`) | Alta | ✅ Completado |
| F4V4-T7 | Actualizar comandos SDD para sugerir siguiente paso (`spec/`, `plan/`, `build/`, `test/`, `review/`, `ship/`) | Media | ✅ Completado |
| F4V4-T8 | Eliminar sugerencias de comandos en configuración de agentes primarios | Media | ✅ Completado |
| F4V4-T9 | Actualizar documentación: `docs/opencode/04-commands.md`, `docs/opencode/USER_GUIDE.md` | Media | ✅ Completado |
| F4V4-T10 | Actualizar `CHANGELOG.md` con sección v1.0.13 | Alta | ✅ Completado |
| F4V4-T11 | Bump version a 1.0.13 en `package.json` | Alta | ✅ Completado |
| F4V4-T12 | Tests: verificar que nuevos comandos existen y tienen estructura correcta | Media | ✅ Completado |

#### Métricas de Referencia

| Métrica | v1.0.13 (actual) | Meta v1.0.13 |
|---------|------------------|--------------|
| Tests (pass/fail) | 481 / 0 | ≥481 / 0 |
| Coverage (funciones) | 97.66% | ≥97.66% |
| Coverage (líneas) | 96.52% | ≥96.52% |
| E2E escenarios | 15/15 | 15/15 |
| `just check` errores | 0 | 0 |
| Issues críticos abiertos | 0 | 0 |
| Comandos SDD | 12 | 12 (+docs-update, +diagnosis) |

**Criterios de completitud (DoD FEV-4):**
- [x] Issue #15 resuelto: gobernanza y determinismo implementados
- [x] `docs-update/` creado y funcional
- [x] `diagnosis/` creado y funcional
- [x] `evolve/` refactorizado con scope reducido
- [x] Directorio `docs/diagnosis/` creado con template
- [x] Permisos de quetzalcoatl actualizados (no escribe en `tasks/`, código, config)
- [x] Permisos de moctezuma actualizados (solo escribe en `tasks/`)
- [x] Comandos SDD sugieren siguiente paso
- [x] Configuración de agentes sin sugerencias de comandos
- [x] Documentación actualizada
- [x] `bun test`: sin regresión
- [x] `just check`: 0 errores
- [x] E2E: 15/15 pasando
- [x] CHANGELOG actualizado con sección v1.0.13
- [x] Versión bump a 1.0.13

---

### Fase FEV-5 — CI/CD Workflow + GitHub Wiki (v1.0.14)

**Fecha:** 2026-07-09 | **Última actualización:** 2026-07-09 (FEV-5 actualizado *a posteriori*) | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completado

#### Contexto

Issues #23 y #25 identifican dos problemas de documentación y proceso:

1. **Issue #23 — CI/CD Workflow:** No existe un flujo de trabajo CI/CD estandarizado. La infraestructura actual (ci.yml, release.yml) soporta solo un flujo simple (PR directo a `main` + tag release). Se necesita un proceso 3-etapas (develop → test publish → main) que requiere **modificaciones en `.github/workflows/` además de documentación en CONTRIBUTING.md**. Ver [diagnóstico completo](docs/diagnosis/fix01-cicd-workflow-standardization.md).
2. **Issue #25 — GitHub Wiki:** La documentación del workspace existe en tres lugares (`docs/opencode/` raíz, `template/opcional/docs/opencode/`, y lo que debería ser la Wiki). Se propone migrar a GitHub Wiki, eliminar `docs/opencode/` del template y de la raíz, y referenciar la documentación oficial de OpenCode.

#### Diagnósticos

- [fix01-cicd-workflow-standardization.md](docs/diagnosis/fix01-cicd-workflow-standardization.md) — Issue #23 (Documentación + Workflows)
- [fix02-github-wiki-implementation.md](docs/diagnosis/fix02-github-wiki-implementation.md) — Issue #25

#### Plan de Implementación

##### Issue #23 — CI/CD Workflow (Documentación + Workflows)

| ID | Descripción | Prioridad | Estado |
|----|-------------|-----------|--------|
| **Track A: Infraestructura** | | | |
| F5V5-A1 | Modificar `ci.yml` — añadir `develop` a triggers (`push` + `pull_request`) | Alta | ✅ Completo |
| F5V5-A2 | Modificar `release.yml` — detectar pre-release tags (`beta.*`, `rc.*`) y publicar con `npm publish --tag <prerelease>`, crear GitHub Pre-release en vez de Release | Alta | ✅ Completo |
| F5V5-A3 | Crear rama `develop` en el repositorio a partir de `main` | Alta | ✅ Completo |
| **Track B: Documentación** | | | |
| F5V5-B1 | Documentar Git Workflow en CONTRIBUTING.md (branch strategy, 3-stage release process, naming conventions) | Alta | ✅ Completo |
| F5V5-B2 | Definir nomenclatura de versiones npm para test publishes (ej: 1.0.14-beta.1, 1.0.14-rc.1) | Alta | ✅ Completo |
| F5V5-B3 | Documentar CI/CD Pipeline en CONTRIBUTING.md (ci.yml, release.yml, triggers, troubleshooting) | Media | ✅ Completo |
| F5V5-B4 | Crear Release Checklist template en CONTRIBUTING.md | Media | ✅ Completo |

##### Issue #25 — GitHub Wiki + Eliminar docs/opencode/

| ID | Descripción | Prioridad | Estado |
|----|-------------|-----------|--------|
| F5V5-C1 | Habilitar GitHub Wiki y crear estructura inicial (Home, Getting Started, Workspace Structure) | Alta | ✅ Completo |
| F5V5-C2 | Migrar contenido de docs/opencode/ a GitHub Wiki (12 archivos) | Alta | ✅ Completo |
| F5V5-C3 | Referenciar documentación oficial de OpenCode en la Wiki | Media | ✅ Completo |
| F5V5-C4 | Eliminar `template/opcional/docs/opencode/` del template (12 archivos) | Alta | ✅ Completo |
| F5V5-C5 | Eliminar `docs/opencode/` de la raíz del proyecto (12 archivos) | Alta | ✅ Completo |
| F5V5-C6 | Remover entrada `docs/opencode` de FileRuleManifestData.ts (líneas 167-171) | Alta | ✅ Completo |
| F5V5-C7 | Actualizar 74+ referencias internas (CONTRIBUTING.md, README.md, commands, specs) | Media | ✅ Completo |
| F5V5-C8 | Actualizar tests E2E para reflejar eliminación de docs/opencode/ | Alta | ✅ Completo |

##### Release

| ID | Descripción | Prioridad | Estado |
|----|-------------|-----------|--------|
| F5V5-D1 | Actualizar CHANGELOG.md con sección v1.0.14 | Alta | ✅ Completo |
| F5V5-D2 | Bump version a 1.0.14 en package.json | Alta | ✅ Completo |

#### Métricas de Referencia

| Métrica | v1.0.13 (actual) | Meta v1.0.14 | v1.0.14 (final) |
|---------|------------------|--------------|-----------------|
| Tests (pass/fail) | 481 / 0 | ≥481 / 0 | 487 / 0 |
| Coverage (funciones) | 97.66% | ≥97.66% | 98.13% |
| Coverage (líneas) | 96.52% | ≥96.52% | 96.98% |
| E2E escenarios | 15/15 | 15/15 | 15/15 |
| `just check` errores | 0 | 0 | 0 |
| Issues críticos abiertos | 2 (#23, #25) | 0 | 0 |
| docs/opencode/ references | 74+ | 0 | 0 |
| CI branches soportadas | 1 (`main`) | 2 (`main` + `develop`) | 2 (`main` + `develop`) |
| npm dist-tags | 1 (`latest`) | 3 (`latest`, `beta`, `rc`) | 3 (`latest`, `beta`, `rc`) |

**Criterios de completitud (DoD FEV-5):**
- [x] Issue #23 resuelto:
  - [x] `ci.yml` corre en PRs a `develop` además de `main`
  - [x] `release.yml` publica pre-releases con `--tag beta/rc` y GitHub Pre-release
  - [x] Rama `develop` existe en el repositorio
  - [x] Git Workflow documentado en CONTRIBUTING.md incluyendo proceso 3-etapas
  - [x] Release Checklist presente en CONTRIBUTING.md
- [x] Issue #25 resuelto:
  - [x] GitHub Wiki habilitada y poblada con contenido migrado
  - [x] `docs/opencode/` eliminado de la raíz del proyecto
  - [x] `template/opcional/docs/opencode/` eliminado del template
  - [x] Entrada `docs/opencode` removida de FileRuleManifestData.ts
  - [x] Todas las referencias internas actualizadas (74+ → 0)
- [x] Tests E2E pasando sin regresión
- [x] `bun test`: sin regresión
- [x] `just check`: 0 errores
- [x] CHANGELOG actualizado con sección v1.0.14
- [x] Versión bump a 1.0.14

---

### Fase FEV-6 — Quick Configuration + Documentation (v1.1.0)

**Fecha:** 2026-07-10 | **Autor:** Quetzalcoatl (Visionary Sage) → Huitzilopochtli (Supreme Orchestrator) | **Estado:** ✅ Completado

#### Contexto

Primera fase de v1.1.0. Contiene los items de menor esfuerzo y riesgo: ajuste de configuración de steps para agentes primarios (Issue #27), creación del documento SECURITY.md (Issue #28), y resolución del coverage artifact en VersionComparator y ClackPromptsAdapter (TD-1.2).

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV6-T1 | Ajustar `steps` para 6 agentes primarios (huitzilopochtli:25, quetzalcoatl:60, moctezuma:20, tlaloc:90, mictlantecuhtli:60, tezcatlipoca:50) | `template/obligatorio/opencode.json` | ✅ Completo |
| FEV6-T2 | Crear `docs/SECURITY.md` para el proyecto | `docs/SECURITY.md` (nuevo) | ✅ Completo |
| FEV6-T3 | Crear `template/estandar/docs/SECURITY.md` placeholder | `template/estandar/docs/SECURITY.md` (nuevo) | ✅ Completo |
| FEV6-T4 | Añadir constructores explícitos a VersionComparator + ClackPromptsAdapter | `src/domain/services/VersionComparator.ts`, `src/infrastructure/adapters/ClackPromptsAdapter.ts` | ✅ Completo |
| FEV6-T5 | Verificar que `docs/` standard entry cubre `docs/SECURITY.md` (no requiere cambio) | `src/domain/entities/FileRuleManifestData.ts` | ✅ Completo |

#### Métricas de Referencia

| Métrica | v1.0.14 (antes) | Meta v1.1.0 (FEV-6) | v1.1.0 (final) |
|---------|-----------------|---------------------|----------------|
| Tests (pass/fail) | 500 / 0 | ≥500 / 0 | 502 / 0 |
| Coverage (funciones) | ~98% | ~98% (artifact resuelto) | 98.13% |
| E2E escenarios | 15/15 | 15/15 | 15/15 |
| `just check` errores | 0 | 0 | 0 |

**Criterios de completitud (DoD FEV-6):**
- [x] Issue #27 resuelto: steps actualizados para los 6 agentes primarios
- [x] Issue #28 resuelto: SECURITY.md existe en docs/ y template/estandar/docs/
- [x] TD-1.2 resuelto: coverage artifact eliminado (constructores explícitos)
- [x] `bun test`: sin regresión (502 pass, 0 fail)
- [x] `just check`: 0 errores

**Resultados:**

| ID | Commit | Branch |
|----|--------|--------|
| FEV6-T1 | `7116ca1` | `feat/v1.1.0-fev-6` |
| FEV6-T2 | `d76cfe2` | `feat/v1.1.0-fev-6` |
| FEV6-T3 | `07f481d` | `feat/v1.1.0-fev-6` |
| FEV6-T4 | `d3e6ce4` | `feat/v1.1.0-fev-6` |
| FEV6-T5 | `e38a23b` | `feat/v1.1.0-fev-6` |
| Review fixes | `25b5fde`, `fe51037`, `844c65b`, `d0d216a`, `3e2f744` | `feat/workspace-enhancement` |

---

### Fase FEV-7 — Agent Governance & Security Hardening

**Fecha:** 2026-07-10 | **Autor:** Quetzalcoatl (Visionary Sage) → Huitzilopochtli (Supreme Orchestrator) | **Estado:** ✅ Completo

#### Contexto

Segunda fase de v1.1.0. Aborda la gobernanza de agentes y la seguridad de comandos. Issue #26 mejora los system prompts de los 6 agentes principales con reglas de no-assumption y delegación prioritaria. Issue #30 analiza 100+ comandos destructivos y añade restricciones al plugin sdd-pipeline.ts y opencode.json.

**Ejecución:** Huitzilopochtli orquestó el análisis, la revisión de código, y la materialización de todos los hallazgos. Quetzalcoatl realizó el code review 5-ejes. Tlaloc implementó los fixes de producción.

#### Diagnóstico

**Issue #26 — System Prompts:**
Los agentes principales actualmente ejecutan tareas sin verificar ambigüedades con el usuario. Se necesita:
1. Regla de no-assumption: preguntar antes de ejecutar si las instrucciones son ambiguas
2. Filosofía: preguntar → resolver → sugerir → advertir
3. Instrucción de delegación-first: priorizar subagentes especializados sobre escritura directa

**Issue #30 — Command Restrictions:**
El plugin sdd-pipeline.ts y opencode.json tienen restricciones limitadas. Se necesitan añadir comandos destructivos organizados en categorías:
- Filesystem (`rm -rf`, `shred`, `find -exec rm`)
- Git (`push --force`, `reset --hard`, `filter-repo`)
- SQL (`DROP DATABASE`, `TRUNCATE`, `DELETE` sin `WHERE`)
- Docker (`rm -f`, `rmi -f`, `system prune -a`)
- Kubernetes (`delete --all`, `drain`)
- Permissions (`chmod 777`, `chown -R`)
- Process (`kill -9 1`, `shutdown -h now`)
- Network (`iptables -F`, `ufw disable`)
- Package managers (`npm publish`, `pip --force-reinstall`)
- Environment (`unset PATH`, `echo >> ~/.bashrc`)
- Disk (`dd`, `mkfs`, `fdisk`)
- IaC (`terraform destroy -auto-approve`)
- Cloud (`aws s3 rm --recursive`, `az vm delete`)
- Databases (`mongo dropDatabase`, `redis FLUSHALL`)

No todos los comandos necesitan restricción — algunos son aceptables con el permiso "ask" por defecto de bash.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV7-T1 | Añadir regla de no-assumption + question-tool a 6 agentes principales | `template/obligatorio/agents/{huitzilopochtli,quetzalcoatl,moctezuma,tlaloc,mictlantecuhtli,tezcatlipoca}.md` | ✅ Completo |
| FEV7-T2 | Añadir instrucción de delegación-first a agentes que delegan (quetzalcoatl, tlaloc, mictlantecuhtli) | Mismos 3 archivos | ✅ Completo |
| FEV7-T3 | Analizar 100+ comandos y seleccionar los pertinentes para restringir | Análisis en diagnóstico | ✅ Completo |
| FEV7-T4 | Añadir restricciones de comandos al plugin sdd-pipeline.ts | `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` | ✅ Completo |
| FEV7-T5 | Añadir restricciones de comandos a opencode.json permissions | `template/obligatorio/opencode.json` | ✅ Completo |
| FEV7-T6 | Actualizar README.md del plugin | `template/obligatorio/.opencode/plugins/README.md` | ✅ Completo |

#### Métricas de Referencia

| Métrica | v1.0.14 (antes) | Meta FEV-7 |
|---------|-----------------|------------|
| Agentes con no-assumption rule | 0/6 | 6/6 |
| Agentes con delegation-first | 0/3 | 3/3 |
| Comandos destructivos restringidos | ~10 | 50+ |
| `bun test` | 500 / 0 | ≥500 / 0 |
| `just check` errores | 0 | 0 |

#### Code Review Findings

| ID | Categoría | Finding | Resolución |
|----|-----------|---------|------------|
| I1 | Important | Tests conductuales insuficientes — solo se probaban las listas de patterns, no su comportamiento real de matching | Añadidos 33 tests positivos, 13 negativos, 4 bypass, y 7 `normalizeBash` para `sdd-pipeline.ts` |
| I2 | Important | `export PATH=` regex bloquea modificaciones seguras (e.g., `export PATH=$PATH:/new/dir`) | Refinado a `/export\s+PATH\s*=\s*[^$]/i` — solo bloquea reemplazos totales |
| S1 | Suggestion | README line count desactualizado (663 vs 664) | Corregido a 664 |
| S2 | Suggestion | Convención `[existing]` no documentada en restricciones del plugin | Añadido comentario inline explicando la convención |
| S3 | Suggestion | `chmod 777` pattern redundante (subset of `chmod [0-7]{3,4}`) | Eliminado — el patrón más amplio ya lo cubre |

#### Métricas Finales

| Métrica | v1.1.0 (antes) | Meta FEV-7 | v1.1.0 (final) |
|---------|----------------|------------|----------------|
| Agentes con no-assumption rule | 0/6 | 6/6 | 6/6 |
| Agentes con delegation-first | 0/3 | 3/3 | 3/3 |
| Comandos destructivos restringidos | ~10 | 50+ | 50+ |
| `bun test` | 502 / 0 | ≥500 / 0 | 563 / 0 |
| `just check` errores | 0 | 0 | 0 |
| Code review findings | — | — | 5/5 resueltos (0 crit, 0 imp, 0 sug abiertos) |

**Criterios de completitud (DoD FEV-7):**
- [x] Issue #26 resuelto: 6 agentes con no-assumption rule
- [x] Issue #26 resuelto: 3 agentes delegadores con delegation-first
- [x] Issue #30 resuelto: comandos destructivos restringidos en plugin + config
- [x] Plugin README actualizado
- [x] `bun test`: sin regresión (563 pass, 0 fail, 1204 expects)
- [x] `just check`: 0 errores
- [x] Code review: 5/5 hallazgos resueltos (0 Critical, 0 Important, 0 Suggestion abiertos)

---

### Fase FEV-8 — Obsidian Subagent

**Fecha:** 2026-07-10 | **Autor:** Quetzalcoatl (Visionary Sage) → Huitzilopochtli (Supreme Orchestrator) | **Estado:** ✅ Completado

#### Contexto

Issue #21 propone un subagente especializado para administración de vaults de Obsidian. Solo puede ser invocado por Huitzilopochtli. Restricciones: solo edita archivos .md, solo ejecuta obsidian-cli. Incluye instalación de 6 skills de Obsidian/Markdown.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV8-T1 | Crear subagente obsidian-vault-writer | `template/obligatorio/agents/obsidian-vault-writer.md` (nuevo) | 🟡 Pendiente |
| FEV8-T2 | Instalar 6 skills de Obsidian/Markdown | Skills directory | 🟡 Pendiente |
| FEV8-T3 | Actualizar catálogo de Huitzilopochtli | `template/obligatorio/agents/huitzilopochtli.md` | 🟡 Pendiente |
| FEV8-T4 | Actualizar tablas de delegación de agentes primarios | quetzalcoatl.md, tlaloc.md, mictlantecuhtli.md | 🟡 Pendiente |
| FEV8-T5 | Añadir a VALID_SUBAGENTS en sdd-pipeline.ts | `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` | 🟡 Pendiente |
| FEV8-T6 | Actualizar GitHub Wiki → Agents catalog | Wiki | 🟡 Pendiente |

#### Métricas de Referencia

| Métrica | v1.0.14 (antes) | Meta FEV-8 |
|---------|-----------------|------------|
| Subagentes totales | ~96 | ~97 (+1 obsidian) |
| Skills Obsidian/Markdown | 0 | 6 |
| `bun test` | 500 / 0 | ≥500 / 0 |

**Criterios de completitud (DoD FEV-8):**
- [ ] Issue #21 resuelto: subagente creado con frontmatter correcto
- [ ] 6 skills instalados y referenciados
- [ ] Catálogo de Huitzilopochtli actualizado
- [ ] Tablas de delegación actualizadas
- [ ] VALID_SUBAGENTS actualizado
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

### Fase FEV-9 — MCP Server Integration

**Fecha:** 2026-07-10 | **Autor:** Quetzalcoatl (Visionary Sage) → Moctezuma (Strategic Planner) | **Estado:** ✅ Completo

#### Contexto

Issue #29 propone añadir nuevos MCP servers enfocados en documentación y búsqueda web. Los servidores finales son: Tavily, Firecrawl, Vercel Grep, GitMCP.

Además, los 6 agentes principales tienen una sección `## KNOWLEDGE` que actualmente termina con `Context7 → Web search`. Dado que los nuevos MCPs realizan un trabajo similar a Context7, se debe **reemplazar Context7** por la cadena de consulta: **MCP servers → Web search → Question-tool**.

> **⚠️ RESTRICCIÓN DE LÍNEAS:** Cada archivo de agente principal debe mantener ≤150 líneas totales. La modificación KNOWLEDGE es de 1 línea.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV9-T1 | Investigar instalación de 5 MCPs (requisitos, API keys, configuración) | Investigación | ✅ Completo |
| FEV9-T2 | Añadir 5 MCPs a la sección mcp en opencode.json (vercel-grep y gitmcp enabled) | `template/obligatorio/opencode.json` | ✅ Completo |
| FEV9-T3 | Ampliar Wiki MCP-Servers.md con 5 nuevas secciones de activación | `docs/wiki-source/MCP-Servers.md` | ✅ Completo |
| FEV9-T4 | Actualizar skill context-engineering con referencia a MCP servers | `template/obligatorio/skills/context-engineering/SKILL.md` | ✅ Completo |
| FEV9-T5 | Actualizar KNOWLEDGE de 6 agentes: `Context7` → `MCP servers → Web search → Question-tool` | 6 archivos en `template/obligatorio/agents/` | ✅ Completo |

**Nueva cadena KNOWLEDGE (FEV9-T5):**
```
AGENTS.md → SPEC.md → docs/ → skills/ → MCP servers → Web search → Question-tool
```

#### Métricas de Referencia

| Métrica | v1.0.14 (antes) | Resultado FEV-9 |
|---------|-----------------|-----------------|
| MCP servers configurados | 4 | 9 (+5) |
| Agentes con KNOWLEDGE actualizada | 0/6 | 6/6 |
| `bun test` | 500 / 0 | 563 / 0 |

**Criterios de completitud (DoD FEV-9):**
- [x] Issue #29 resuelto: 5 MCPs configurados en opencode.json
- [x] Pasos manuales documentados
- [x] Wiki actualizada
- [x] FEV9-T5 resuelto: 6 agentes con sección `## KNOWLEDGE` actualizada (Context7 → MCP → Websearch → Question-tool)
- [x] Límites de líneas respetados: ≤150 líneas total o ≤100 líneas sin YAML
- [x] `bun test`: sin regresión (563 pass)
- [x] `just check`: 0 errores

---

### Fase FEV-10 — Code Quality + Dependency Upgrades

**Fecha:** 2026-07-10 | **Autor:** Quetzalcoatl (Visionary Sage) → Moctezuma (Strategic Planner) → Tlaloc (Builder) | **Estado:** ✅ Completo

#### Contexto

Fase final de v1.1.0. Implementación de 5 items del catálogo TECH_DEBT: cobertura de main.ts (33% → 86%), split IFileSystem (ISP), TypeScript 6.x upgrade, Biome 2.x (ya pre-existente), y npm packaging integration test.

#### Resultados

| ID | Descripción | Estado | Commits |
|----|-------------|--------|---------|
| FEV10-T1 | Split IFileSystem → IFileSystem + IStagingSystem (ISP) | ✅ Completo | `33131a4` (15 files) |
| FEV10-T2 | Integration tests para main.ts (33% → 86.21%) | ✅ Completo | `a908afd`, `74cb066`, `d8ca221` (+13 tests) |
| FEV10-T3 | npm packaging integration test | ✅ Completo | `840dc31`, `65b8f8f` (5 tests A-E) |
| FEV10-T4 | TypeScript 5.9.3 → 6.0.3 upgrade | ✅ Completo | `d56fc68` |
| FEV10-T5 | Biome 2.x (ya pre-existente) | ✅ Pre-completado | (ninguno) |
| FEV10-T6 | TECH_DEBT.md actualizado | ✅ Completo | commit siguiente |

#### Métricas Finales

| Métrica | Antes (v1.1.0-FEV9) | Después (v1.1.0-FEV10) |
|---------|---------------------|------------------------|
| Tests (pass/fail) | 563 / 0 | **581 / 0** |
| Expects | 1204 | **1245** |
| main.ts coverage (lines) | 33.04% | **86.21%** |
| main.ts coverage (funcs) | 66.67% | **100%** |
| Coverage (funciones) | 98.89% | **98.89%** |
| Coverage (líneas) | 96.98% | **96.98%** |
| TypeScript | 5.9.3 | **6.0.3** |
| IFileSystem methods | 10 | **6** |
| IStagingSystem methods | (no existe) | **4** |
| npm packaging tests | 0 | **5** |

**Commits FEV-10 (en `feat/workspace-enhancement`):**
- `d8ca221` — test(cli): execution path + error path + finally + update tests
- `74cb066` — test(cli): parse failure + SIGINT handler tests
- `a908afd` — test(cli): terminal flag handling tests
- `d56fc68` — chore(deps): TypeScript 5.9.3 → 6.0.3
- `33131a4` — refactor(domain): split IFileSystem into IFileSystem + IStagingSystem (15 files)
- `840dc31` — test(packaging): 5 npm packaging integration tests (A-E)
- `65b8f8f` — docs(contributing): packaging tests section
- `e440d94` — fix(test): clean up side-effect tarball from bun pm pack in CWD
- `cfcc2ef` — style: fix biome formatting in packaging-helpers.ts and biome.json
- `7c4f75b` — fix: revert biome.json to tab indentation (code review critical)
- `7244828` — simplify(test): parameterize terminal flag tests with it.each
- `2821223` — fix: address all 5 code review findings (Important #1-#3, Suggestion #4-#5)

**Hallazgos de code review (Tezcatlipoca, 2026-07-11):**
- 🔴 **Critical**: `biome.json` reformatted tabs→spaces por Biome — revertido en 7c4f75b
- ⚠️ **Important #1**: Read-only test sin cleanup defensivo — resuelto en 2821223 (try/finally)
- ⚠️ **Important #2**: Env var `CODICE_GITHUB_API_URL` no restaurada — resuelto en 2821223 (try/finally)
- ⚠️ **Important #3**: `destinationExists()` no distingue ENOENT de EACCES — resuelto en 2821223 (error code branching)
- 💡 **Suggestion #4**: Test éxito acepta ambos exit codes — resuelto en 2821223 (assert EXIT_SUCCESS)
- 💡 **Suggestion #5**: Comentario verboso en BunFileSystem — resuelto en 2821223 (reducido a 2 líneas)
- Pre-existing: Biome lint warning `noUselessEscapeInRegex` (no relacionado)

#### Criterios de completitud (DoD FEV-10)
- [x] TD-2.1 resuelto: IFileSystem split en IFileSystem (6) + IStagingSystem (4)
- [x] TD-1.1 resuelto: main.ts coverage 86.21% (100% funciones). 95% no alcanzable sin refactor
- [x] TD-5.3 resuelto: npm packaging test (5 tests A-E existe y pasa)
- [x] TD-3.1 resuelto: TypeScript 6.0.3, tsc --noEmit pasa
- [x] TD-3.2 resuelto: Biome 2.5.3 ya presente
- [x] TECH_DEBT.md actualizado (items v1.1.0 movidos a Resolved)
- [x] `bun test`: 581/0 (sin regresión)
- [x] `just check`: 0 errores tsc (1 biome warning pre-existente)

---

### Fase FEV-11 — Binary Removal (v1.2 Phase 1)

**Fecha:** 2026-07-27 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** ✅ Completo
**Diagnóstico:** [fix04-v1.2-phase1-binary-removal.md](diagnosis/fix04-v1.2-phase1-binary-removal.md)

#### Contexto

Issue #46 identifica que los binarios compilados son demasiado grandes (74MB para Linux, similar para macOS/Windows) y representan una carga de mantenimiento innecesaria. La distribución principal es vía npm/bunx, por lo que los binarios son redundantes.

**Propuesta:** Eliminar toda la lógica de compilación y distribución de binarios. La única será vía gestores de paquetes (npm/bunx).

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV11-T1 | Eliminar scripts de compilación de Justfile | `Justfile` | ✅ Completo |
| FEV11-T2 | Eliminar `just build`, `just build:all`, `just release` recipes | `Justfile` | ✅ Completo |
| FEV11-T3 | Eliminar configuración de cross-compilation en CI | `.github/workflows/ci.yml` | ✅ Completo |
| FEV11-T4 | Eliminar job de build en release workflow | `.github/workflows/release.yml` | ✅ Completo |
| FEV11-T5 | Eliminar binarios de assets en releases existentes | GitHub Releases | ✅ Completo |
| FEV11-T6 | Actualizar README: eliminar sección de binarios | `README.md` | ✅ Completo |
| FEV11-T7 | Actualizar CONTRIBUTING.md: eliminar sección de build | `CONTRIBUTING.md` | ✅ Completo |
| FEV11-T8 | Actualizar SPEC.md: eliminar referencias a binarios | `SPEC.md` | ✅ Completo |
| FEV11-T9 | Verificar que bunx funciona correctamente tras eliminación | Tests | ✅ Completo |

#### Métricas de Referencia

| Métrica | v1.1.3 | v1.2.0-FEV11 |
|---------|--------|---------------|
| Tests (pass/fail) | 596 / 0 | 593 / 0 ✅ |
| Binarios compilados | 3 (Linux, macOS, Windows) | 0 ✅ |
| Tamaño release assets | ~222MB | ~0MB ✅ |
| `just check` errores | 0 | 0 ✅ |

**Criterios de completitud (DoD FEV-11):**
- [x] Issue #46 resuelto: binarios eliminados completamente
- [x] `just build`, `just build:all`, `just release` eliminados
- [x] CI/CD pipeline actualizado sin build steps
- [x] README actualizado (sin sección de binarios)
- [x] CONTRIBUTING.md actualizado (sin sección de build)
- [x] SPEC.md actualizado (sin referencias a binarios)
- [x] `bun test`: sin regresión
- [x] `just check`: 0 errores
- [x] bunx funciona correctamente

---

### Fase FEV-12 — References Restructuring (v1.2 Phase 2)

**Fecha:** 2026-07-27 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** 📋 Pendiente
**Diagnóstico:** [fix05-v1.2-phase2-references.md](diagnosis/fix05-v1.2-phase2-references.md)

#### Contexto

Issues #54 y #52 identifican problemas con las referencias en el template:
- **Issue #54:** Las referencias hardcodeadas en `template/obligatorio/references/` no son configurables ni actualizables por el usuario
- **Issue #52:** Falta una sección de referencias en `opencode.json` para configurar URLs de documentación

**Propuesta:** Restructurar las referencias para que sean configurables vía `opencode.json` y mantener un directorio de referencias por defecto que pueda ser sobreescrito.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV12-T1 | Analizar estructura actual de `references/` | `template/obligatorio/references/` | 📋 Pendiente |
| FEV12-T2 | Añadir sección `references` a `opencode.json` | `template/obligatorio/opencode.json` | 📋 Pendiente |
| FEV12-T3 | Hacer que `references/` sean opcionales (no siempre copiadas) | `src/domain/entities/FileRuleManifestData.ts` | 📋 Pendiente |
| FEV12-T4 | Documentar configuración de referencias en Wiki | `docs/wiki-source/` | 📋 Pendiente |
| FEV12-T5 | Tests para configuración de referencias | `tests/` | 📋 Pendiente |

#### Métricas de Referencia

| Métrica | v1.1.3 (actual) | Meta v1.2.0-FEV12 |
|---------|-----------------|-------------------|
| Tests (pass/fail) | 596 / 0 | ≥596 / 0 |
| Referencias configurables | 0 | ~10+ |
| `just check` errores | 0 | 0 |

**Criterios de completitud (DoD FEV-12):**
- [ ] Issues #54 y #52 resueltos
- [ ] `opencode.json` tiene sección `references` configurable
- [ ] `references/` son opcionales en el manifest
- [ ] Wiki documenta configuración de referencias
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

### Fase FEV-13 — Documentation Overhaul (v1.2 Phase 3)

**Fecha:** 2026-07-27 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** 📋 Pendiente
**Diagnóstico:** [fix06-v1.2-phase3-documentation.md](diagnosis/fix06-v1.2-phase3-documentation.md)

#### Contexto

Issues #51 y #53 identifican problemas de documentación:
- **Issue #51:** Documentación desactualizada en `docs/` y `template/estandar/docs/` (README.md y CONTRIBUTING.md excluidos por estar bien documentados)
- **Issue #53:** Acoplamiento excesivo entre el plugin SDD (`sdd-pipeline.ts`) y la documentación al añadir comandos, agentes y skills

**Propuesta:** Refactorizar la documentación para reducir acoplamiento y actualizar contenido desactualizado.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV13-T1 | Actualizar documentación en `docs/` (excluyendo README.md y CONTRIBUTING.md) | `docs/` | 📋 Pendiente |
| FEV13-T2 | Actualizar documentación en `template/estandar/docs/` | `template/estandar/docs/` | 📋 Pendiente |
| FEV13-T3 | Reducir acoplamiento SDD plugin ↔ documentación | `sdd-pipeline.ts` | 📋 Pendiente |
| FEV13-T4 | Implementar auto-discovery para comandos/agentes/skills | `sdd-pipeline.ts` | 📋 Pendiente |
| FEV13-T5 | Tests para auto-discovery | `tests/` | 📋 Pendiente |
| FEV13-T6 | Documentar cambios en Wiki | `docs/wiki-source/` | 📋 Pendiente |

#### Métricas de Referencia

| Métrica | v1.1.3 (actual) | Meta v1.2.0-FEV13 |
|---------|-----------------|-------------------|
| Tests (pass/fail) | 596 / 0 | ≥596 / 0 |
| Archivos docs actualizados | 0 | ~20+ |
| `just check` errores | 0 | 0 |

**Criterios de completitud (DoD FEV-13):**
- [ ] Issues #51 y #53 resueltos
- [ ] Documentación `docs/` actualizada (excluyendo README.md, CONTRIBUTING.md)
- [ ] Documentación `template/estandar/docs/` actualizada
- [ ] SDD plugin con auto-discovery (sin maps hardcodeados)
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

### Fase FEV-14 — UX Enhancements (v1.2 Phase 4)

**Fecha:** 2026-07-27 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** 📋 Pendiente
**Diagnóstico:** [fix07-v1.2-phase4-ux.md](diagnosis/fix07-v1.2-phase4-ux.md)

#### Contexto

Issues #47 y #56 identifican mejoras de UX:
- **Issue #47:** Falta barra de progreso durante la instalación/actualización del workspace
- **Issue #56:** Falta un comando `/help` para onboarding de usuarios nuevos

**Propuesta:** Implementar barra de progreso con feedback de archivos y crear comando `/help` asignado a Huitzilopochtli.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV14-T1 | Añadir progress callback a `IFileMergeEngine` | `src/domain/ports/IFileMergeEngine.ts` | 📋 Pendiente |
| FEV14-T2 | Implementar progress reporting en `FileMergeEngine.execute()` | `src/domain/services/FileMergeEngine.ts` | 📋 Pendiente |
| FEV14-T3 | Añadir progress bar rendering a `ClackPromptsAdapter` | `src/infrastructure/adapters/ClackPromptsAdapter.ts` | 📋 Pendiente |
| FEV14-T4 | Conectar progress callback desde use cases al TUI adapter | `src/application/use-cases/*.ts` | 📋 Pendiente |
| FEV14-T5 | Tests para progress bar | `tests/integration/` | 📋 Pendiente |
| FEV14-T6 | Crear archivo de comando `/help` | `template/obligatorio/commands/help.md` (nuevo) | 📋 Pendiente |
| FEV14-T7 | Añadir `/help` a `COMMAND_AGENT_MAP` en sdd-pipeline.ts | `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` | 📋 Pendiente |
| FEV14-T8 | Añadir `/help` a `INTENT_PATTERNS` en sdd-pipeline.ts | Mismo archivo | 📋 Pendiente |
| FEV14-T9 | Actualizar Wiki Commands.md con documentación de `/help` | `docs/wiki-source/Commands.md` | 📋 Pendiente |
| FEV14-T10 | Actualizar README.md sección de comandos | `README.md` | 📋 Pendiente |

#### Métricas de Referencia

| Métrica | v1.1.3 (actual) | Meta v1.2.0-FEV14 |
|---------|-----------------|-------------------|
| Tests (pass/fail) | 596 / 0 | ≥596 / 0 |
| Comandos SDD | 12 | 13 (+/help) |
| `just check` errores | 0 | 0 |

**Criterios de completitud (DoD FEV-14):**
- [ ] Issues #47 y #56 resueltos
- [ ] Progress bar muestra durante instalación (modos Clean, Project, Update)
- [ ] Progress muestra: archivo actual, archivos procesados, total, porcentaje, tiempo estimado
- [ ] Comando `/help` creado con frontmatter correcto
- [ ] `/help` asignado a Huitzilopochtli
- [ ] `/help` registrado en `COMMAND_AGENT_MAP` e `INTENT_PATTERNS`
- [ ] `/help` ofrece 6 opciones vía question tool
- [ ] Wiki Commands.md actualizado
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

### Fase FEV-15 — Community Standards (v1.2 Phase 5)

**Fecha:** 2026-07-27 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** 📋 Pendiente
**Diagnóstico:** [fix08-v1.2-phase5-community.md](diagnosis/fix08-v1.2-phase5-community.md)

#### Contexto

Issue #55 identifica la falta de un Code of Conduct para el proyecto y el template.

**Propuesta:** Añadir `CODE_OF_CONDUCT.md` al proyecto (Contributor Covenant v2.1) y al template (placeholder personalizable).

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV15-T1 | Crear `CODE_OF_CONDUCT.md` para el proyecto | `CODE_OF_CONDUCT.md` (nuevo) | 📋 Pendiente |
| FEV15-T2 | Crear `template/estandar/CODE_OF_CONDUCT.md` placeholder | `template/estandar/CODE_OF_CONDUCT.md` (nuevo) | 📋 Pendiente |
| FEV15-T3 | Actualizar README.md con referencia al Code of Conduct | `README.md` | 📋 Pendiente |
| FEV15-T4 | Actualizar CONTRIBUTING.md con referencia al Code of Conduct | `CONTRIBUTING.md` | 📋 Pendiente |

#### Métricas de Referencia

| Métrica | v1.1.3 (actual) | Meta v1.2.0-FEV15 |
|---------|-----------------|-------------------|
| Tests (pass/fail) | 596 / 0 | ≥596 / 0 |
| Code of Conduct | 0 | 2 (proyecto + template) |
| `just check` errores | 0 | 0 |

**Criterios de completitud (DoD FEV-15):**
- [ ] Issue #55 resuelto
- [ ] `CODE_OF_CONDUCT.md` creado para el proyecto (Contributor Covenant v2.1)
- [ ] `template/estandar/CODE_OF_CONDUCT.md` creado como placeholder
- [ ] README.md referencia al Code of Conduct
- [ ] CONTRIBUTING.md referencia al Code of Conduct
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

## 4. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|
| Unitarias | Dominio (entities, services, types) | Bun test | 100% func lines |
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 90% func/lines |
| E2E | 6 escenarios binario compilado | bash + mock server | 6/6 pasando |
| Coverage | Cobertura general | bun test --coverage | > 88% lines, > 89% funcs |

## 5. Métricas de Progreso

- **Tests unit+int:** 596 tests, 0 fail, 1289 expects
- **Tests E2E:** 15/15 pasando (14 existentes + 1 update existing project)
- **Coverage:** 98.89% funciones / 96.98% líneas
- **Domain coverage:** 100% líneas
- **`just check`:** 0 errores
- **Fix rate:** 10+ bugs encontrados y corregidos durante desarrollo de E2E
- **Commits F4:** `5f75006` (E2E + CI + Coverage)
- **Commits F4.5:** `04c7c4b` (`--dest` + workspace seguro)
- **Commits F6.5:** `4f76a55` (coverage + tech debt)
- **Binary:** dist/codice-linux (74MB ELF x64), dist/codice-macos (via CI), dist/codice-windows.exe (via CI)
- **Cross-platform builds:** CI matrix ubuntu/macos/windows con smoke test + artifact upload
- **Release pipeline:** tag v* → build 3 platforms → create release with binary assets
- **Commits F5:** `7d9c4df`, `15a1e92`, `828acc2`, `8682d3a`, `3b5ad76` en `feat/installer-updater`
- **Commits F5 review fixes (2026-06-15):** 3 correcciones post-review (echo format, Bun version, SHA pinning)
- **F5 total:** 7 tasks, 7 completed + 3 review fixes
- **Commits FEV-1:** `690d4a4` (ship review fixes), `62a6440` (README models sync), `3c469e4` (CONTRIBUTING/README docs)
- **FEV-1 total:** 5 issues + 10 ship review fixes + 3 documentation updates = 18 changes
- **Commits FEV-3:** `d628bd6` (destinationExists fix), `a890d37` (GITHUB_REPO fix), `bb24d42` (regression tests), `5c2e4d0` (E2E), `287b15f` (v1.0.11 bump), `910ae53` (obs fix), `a0f84f1` (review findings)
- **FEV-3 total:** 2 production fixes + 3 test additions + 1 E2E scenario + 1 doc update = 7 changes
- **Release ready:** v1.0.11 — all DoD items completed, 476/0 tests, 15/15 E2E, 0 Biome/tsc errors
- **Commits FEV-4:** `ad8367c` (SDD Command Refactor + Governance v1.0.13) en `main`
- **FEV-4 total:** 12/12 tasks completadas (docs-update/, diagnosis/, evolve/ refactor, agent governance, SDD determinism)
- **Release ready:** v1.0.13 — all DoD items completed, 481/0 tests, 15/15 E2E, 12 SDD commands, 0 Biome/tsc errors
- **Commits FEV-5:** `c5b1ddf` (release v1.0.14), `147d967` (remove docs/opencode/), `3613c37` (update refs), `6340a9a` (wiki pages), `5f90860` (wiki MCP-Servers), `6a56f88` (wiki SDD Pipeline) en `main`
- **Post-release refactor (2026-07-09):** `5c55e3a` (extract postInstall.ts), `a56b3da` (retryHint tests) en `feat/ci-cd-wiki`
- **FEV-5 total:** 10 tareas infraestructura + 8 tareas wiki + 2 tareas release = 20 tasks completadas
- **Release ready:** v1.0.14 — all DoD items completed, 487/0 tests, 15/15 E2E, 98.13% coverage, 0 Biome/tsc errors
- **Commits FEV-6:** `7116ca1` (steps), `d76cfe2` (SECURITY.md proyecto), `07f481d` (SECURITY.md template), `d3e6ce4` (constructores explícitos), `e38a23b` (verificación manifest) en `feat/v1.1.0-fev-6`
- **FEV-6 total:** 5/5 tareas completadas (Issue #27, #28, TD-1.2)
- **FEV-7 status:** ✅ Completo — Issues #26 y #30 resueltos con 5 hallazgos de code review (0 crit, 0 imp)
- **FEV-7 commits:** `5986c89` (code review), `92a9cec` (review fixes: tests, export PATH, README, chmod 777) en `feat/workspace-enhancement`
- **FEV-7 total:** 6/6 tareas completadas + 5 code review findings resueltos
- **FEV-8 status:** ✅ Completo — Issue #21 (obsidian-vault-writer subagent + 6 skills)
- **FEV-9 status:** ✅ Completo — Issue #29 (5 MCP servers, 9 total, 3 enabled by default)
- **FEV-9 commits:** `3f827e0` (opencode.json), `33f3a85` (Wiki), `b99bfde` (context-engineering), `c64b9b5` (6 agents KNOWLEDGE), `d32bf85` (enable defaults) en `feat/workspace-enhancement`
- **FEV-9 total:** 5/5 tareas completadas (5 MCPs, 9 total, KNOWLEDGE chain updated)
- **FEV-10 status:** ✅ Completo — 5 TECH_DEBT items resueltos
- **FEV-10 commits:** `a908afd`, `74cb066`, `d8ca221` (tests main.ts), `d56fc68` (TS 6.x), `33131a4` (ISP split), `840dc31` (packaging tests), `65b8f8f` (docs) en `feat/workspace-enhancement`
- **FEV-10 total:** 6 slices, 5+ items completados
- **Tests actuales:** 596 pass, 0 fail, 1289 expects
- **Coverage:** 98.89% funciones / 96.98% líneas
- **V1.1.2 completado:** ✓ Pre-release verified, production release v1.1.2 published.
- **V1.1.3 completado:** ✓ Hotfix — EPERM on Windows CI, CONTRIBUTING.md simplified.
- **FEV-11 status:** ✅ Completo — Binary Removal (Issue #46, npm-only distribution)
- **FEV-12 status:** 📋 Pendiente — References Restructuring (Issues #54, #52, 8h, configurable references) — listo para planificación
- **FEV-13 status:** 📋 Pendiente — Documentation Overhaul (Issues #51, #53, 12h, reduce SDD coupling)
- **FEV-14 status:** 📋 Pendiente — UX Enhancements (Issues #47, #56, 6h, progress bar + /help command)
- **FEV-15 status:** 📋 Pendiente — Community Standards (Issue #55, 2h, CODE_OF_CONDUCT.md)

---