# Plan de implementación – Códice v1.0.0 → v1.0.4
**Fecha:** 2026-06-15 | **Última actualización:** 2026-06-17 | **Metodología:** TDD Iterativo

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
| FEV-1 | Resolución de Issues Críticos (v1.0.5) | Issues #6 (bunx), #2 (overwrite estándar), #3 (permisos), #4 (enlaces), #5 (TECH_DEBT.md en plantilla) | 🟡 Pendiente |

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

### Release v1.0.3 — Activo en npm

**Estado:** ✅ Release Ready (v1.0.3 publicado en npm, v1.0.0/1/2 deprecados)

Todas las fases del plan de implementación han sido completadas exitosamente.

**Resumen de fases:**

| Fase | Objetivo | Estado |
|------|----------|--------|
| F0 | Preparación (entorno, convenciones, CI/CD) | ✅ Completo |
| F1 | Infraestructura (adaptadores) | ✅ Completo |
| F2 | Núcleo/Dominio (entidades, servicios) | ✅ Completo |
| F3 | Interfaces (CLI, DI, Use Cases) | ✅ Completo |
| F4 | Pruebas (E2E, CI, coverage) | ✅ Completo |
| F4.5 | Workspace seguro (`--dest`, `just dev`) | ✅ Completo |
| F4.6 | Code Review + Refactor (TemplateResolver, AtomicStager) | ✅ Completo |
| F5 | CI/CD + Cross-platform (builds, release automation) | ✅ Completo |
| F5.5 | Publicación npm + bunx (paquete @fisherk2-dev/codice) | ✅ Completo |
| F6 | Documentación (README, CHANGELOG, CONTRIBUTING, ARCHITECTURE) | ✅ Completo |

**Métricas finales v1.0.3:**
- `bun test`: 343 pass, 0 fail (682 expects)
- `just check`: 0 errores (biome ci + tsc --noEmit)
- E2E: 6/6 escenarios pasando
- Coverage: 96.84% funciones / 94.22% líneas
- Domain coverage: 100% líneas
- Último commit: `b659bae` en `release/v.1.0.0` (post-ship review fixes)

**Artefactos de release:**
| Platform | Binary | Source |
|----------|--------|--------|
| Linux (x64) | `dist/codice-linux` | `bun build --compile --target=bun-linux-x64-modern` |
| macOS (x64) | `dist/codice-macos` | CI build en `macos-latest` |
| Windows (x64) | `dist/codice-windows.exe` | CI build en `windows-latest` |

**npm package:** `@fisherk2-dev/codice` — v1.0.3 activo, v1.0.0/1/2 deprecados.
Instalación oficial: `bunx @fisherk2-dev/codice@latest` o `npx @fisherk2-dev/codice`

**Release pipeline:** Crear tag `v1.0.3` → GitHub Actions ejecuta `release.yml` → build matrix (3 platforms) → GitHub Release con 3 assets binarios + release notes del CHANGELOG + publicación automática a npm.

**Success Criteria (SPEC.md):** Todos los SC-1 a SC-21 han sido verificados y cumplen los criterios de aceptación.

---

### Release v1.0.4 — Tech Debt & Coverage Closing

**Estado:** ✅ Release Ready

**Tareas ejecutadas en F6.5:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F65-T1 | Refactor VersionComparator: métodos privados → funciones exportadas del módulo | ✅ Completo |
| F65-T2 | 8 tests nuevos para validateVersion y validateVersions | ✅ Completo |
| F65-T3 | Test defense-in-depth guard pathResolver.ts (líneas 23-26 a 100%) | ✅ Completo |
| F65-T4 | Tests ClackPromptsAdapter.promptForMode (4 rutas: clean/project/update/cancel) | ✅ Completo |
| F65-T5 | Tests WorkspaceVersion.fromJSON optionalSelections (array/non-array/missing) | ✅ Completo |
| F65-T6 | TECH_DEBT.md en docs/ con 6 secciones de deuda técnica catalogada | ✅ Completo |

**Métricas v1.0.4:**
- `bun test`: 360 pass, 0 fail (711 expects)
- `just check`: 0 errores (biome ci + tsc --noEmit)
- E2E: 6/6 escenarios pasando
- Coverage: 97.66% funciones / 96.52% líneas
- Domain coverage: 100% líneas
- Último commit: `4f76a55` en `release/v.1.0.0`

**npm package:** `@fisherk2-dev/codice` — v1.0.4 a publicar.
Instalación oficial: `bunx @fisherk2-dev/codice@latest` o `npx @fisherk2-dev/codice`

**Release pipeline:** Crear tag `v1.0.4` → GitHub Actions ejecuta `release.yml` → build matrix (3 platforms) → GitHub Release con 3 assets binarios + release notes del CHANGELOG + publicación automática a npm.

## 3. Desglose por Fase evolutiva

### Fase FEV-1 — Resolución de Issues Críticos (v1.0.5)

**Fecha:** 2026-06-17 | **Autor:** Quetzalcoatl (Visionary Sage) | **Estado:** 🟡 En curso

#### Contexto

Tras el release de v1.0.4, se identificaron 5 issues abiertos que afectan la funcionalidad crítica del instalador. Dos de ellos (Issues #6 y #2) son **críticos** y bloquean escenarios de uso legítimos. Los restantes (Issues #3, #4, #5) son mejoras de calidad y seguridad.

| ID | Título | Severidad | Estado |
|----|--------|-----------|--------|
| #6 | Error en instalación limpia por `bunx` | 🔴 Crítico | Abierto |
| #2 | Actualización sobrescribe archivos Estándar | 🔴 Crítico | Abierto |
| #3 | Añadir permisos extra para credenciales | 🟡 Medio | Abierto |
| #4 | Actualizar enlaces entre documentos | 🟡 Medio | Abierto |
| #5 | Añadir TECH_DEBT.md a plantilla | 🟢 Bajo | Abierto |

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
- [ ] Issue #6 resuelto: instalación vía `bunx` funciona en todos los modos
- [ ] Issue #2 resuelto: Update Workspace no sobrescribe archivos Estándar
- [ ] Issue #3 resuelto: permisos de credenciales actualizados
- [ ] Issue #4 resuelto: todos los enlaces internos funcionan
- [ ] Issue #5 resuelto: TECH_DEBT.md presente en plantilla instalada
- [ ] `bun test`: sin regresión (360 pass, 0 fail)
- [ ] `just check`: 0 errores
- [ ] E2E: 6/6 pasando
- [ ] ADR-007 documentado
- [ ] CHANGELOG actualizado con sección `[Unreleased]`

## 4. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|
| Unitarias | Dominio (entities, services, types) | Bun test | 100% func lines |
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 90% func/lines |
| E2E | 6 escenarios binario compilado | bash + mock server | 6/6 pasando |
| Coverage | Cobertura general | bun test --coverage | > 88% lines, > 89% funcs |

## 5. Métricas de Progreso

- **Tests unit+int:** 360 tests, 0 fail, 711 expects
- **Tests E2E:** 6/6 pasando
- **Coverage:** 97.66% funciones / 96.52% líneas
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

---