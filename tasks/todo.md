# TODO: F0 – Preparación y Convenciones

**Estado:** ⏳ Pendiente  
**Fecha:** 2026-06-13  
**Dependencias:** Ninguna (F0 es la base)

---

## Phase 1: Inicialización del Proyecto

### F0-T1: Inicializar proyecto Bun con `bun init`

**Descripción:** Bootstrap del proyecto usando `bun init` para crear `package.json`, `tsconfig.json`, y punto de entrada. Limpiar archivos auto-generados.

**Criterios de aceptación:**
- [ ] `bun init` se ejecuta sin errores
- [ ] `package.json` contiene name `"codice"`, version `"1.0.0"`, y type `"module"`
- [ ] `tsconfig.json` tiene strict mode habilitado
- [ ] Archivos boilerplate auto-generados eliminados

**Verificación:**
- [ ] `bun --version` outputs `>= 1.1.x`
- [ ] `cat package.json | grep '"type": "module"'` succeeds
- [ ] `ls src/` muestra solo archivos creados por esta tarea

**Dependencias:** Ninguna  
**Scope:** XS

---

### F0-T2: Crear estructura de directorios Clean Architecture

**Descripción:** Crear el árbol de directorios completo bajo `src/` según SPEC.md §Project Structure. También crear el árbol `tests/` y el directorio `dist/`.

**Criterios de aceptación:**
- [ ] `src/domain/entities/` existe con stubs de `FileRule.ts` y `WorkspaceVersion.ts`
- [ ] `src/domain/services/` existe con stubs de `FileMergeEngine.ts` y `VersionComparator.ts`
- [ ] `src/application/use-cases/` existe con los tres stubs de use cases
- [ ] `src/application/ports/` existe con stubs de `IFileSystem.ts`, `IGitHubClient.ts`, `IUserPrompt.ts`
- [ ] `src/infrastructure/adapters/` existe con stubs de `BunFileSystem.ts`, `GitHubRestClient.ts`, `ClackPromptsAdapter.ts`
- [ ] `src/infrastructure/config/` existe con stub de `constants.ts`
- [ ] `src/cli/main.ts` existe como stub del punto de entrada
- [ ] `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/fixtures/` existen
- [ ] `dist/` existe

**Verificación:**
- [ ] `find src -type d | sort` lista todos los directorios esperados
- [ ] `find tests -type d | sort` lista todos los directorios de test esperados
- [ ] Todos los archivos stub exportan algo (incluso si es solo `// TODO`)

**Dependencias:** F0-T1  
**Scope:** S

---

### F0-T3: Instalar dependencias del proyecto

**Descripción:** Instalar las dependencias de runtime y desarrollo definidas en el tech stack.

**Criterios de aceptación:**
- [ ] `@clack/prompts` instalado (TUI framework)
- [ ] `semver` instalado (version parsing)
- [ ] `biome` instalado como dev dependency (linting/formatting)

**Verificación:**
- [ ] `bun add @clack/prompts semver` succeeds
- [ ] `bun add -d biome` succeeds
- [ ] `ls node_modules/@clack/` muestra `prompts`
- [ ] `ls node_modules/semver/` existe
- [ ] `ls node_modules/.bin/biome` existe

**Dependencias:** F0-T1  
**Scope:** S

---

## Phase 2: Configuración del Task Runner

### F0-T4: Crear `Justfile` con todas las tareas de desarrollo

**Descripción:** Crear el `Justfile` con todas las tareas definidas en SPEC.md §Commands.

**Criterios de aceptación:**
- [ ] `just setup` instala dependencias, verifica Bun version >= 1.1.x, y crea directorios requeridos
- [ ] `just dev` ejecuta `src/cli/main.ts` via `bun run` con verbose logging
- [ ] `just lint` ejecuta Biome en `src/` y `tests/`
- [ ] `just format` ejecuta Biome format en modo escritura
- [ ] `just check` ejecuta lint + format check + typecheck en secuencia
- [ ] `just test` ejecuta `bun test` en todos los archivos `*.test.ts`
- [ ] `just test:unit` ejecuta solo `tests/unit/**/*.test.ts`
- [ ] `just test:integration` ejecuta solo `tests/integration/**/*.test.ts`
- [ ] `just test:e2e` compila binary y ejecuta scripts E2E en shell
- [ ] `just test:coverage` ejecuta `bun test --coverage` y enforce > 80% threshold
- [ ] `just build` compila el binary a `dist/codice-<platform>`
- [ ] `just build:all` dispara workflow de compilación multiplataforma
- [ ] `just release` crea GitHub Release con binaries adjuntos
- [ ] `just -n` (dry run) muestra todas las recetas sin ejecutar

**Verificación:**
- [ ] `just -n` lista las 13 recetas
- [ ] `just setup` completa sin error en primera ejecución
- [ ] `just lint` pasa en el boilerplate actual

**Dependencias:** F0-T1, F0-T2  
**Scope:** M

---

## Phase 3: Linting y CI

### F0-T5: Configurar Biome para linting y formatting

**Descripción:** Crear `biome.json` con reglas que matcheen los requisitos de estilo TypeScript del proyecto.

**Criterios de aceptación:**
- [ ] `biome.json` existe con configuración válida
- [ ] `just lint` pasa en todos los archivos TypeScript existentes sin errores
- [ ] `just format` formatea todos los archivos TypeScript in place
- [ ] `just check` falla si archivos están sin formatear o tienen errores de lint

**Verificación:**
- [ ] `just lint` exits 0 en el codebase actual
- [ ] `just format --check` exits 0 después de correr format
- [ ] No tipos `any` en ningún archivo `.ts` después de formatear

**Dependencias:** F0-T3, F0-T4  
**Scope:** S

---

### F0-T6: Configurar GitHub Actions workflow para F0

**Descripción:** Crear `.github/workflows/ci.yml` que corra en cada push/PR a `main`.

**Criterios de aceptación:**
- [ ] `.github/workflows/ci.yml` existe
- [ ] Workflow se dispara en `push` y `pull_request` a `main`
- [ ] Jobs corren en `ubuntu-latest`, `macos-latest`, `windows-latest`
- [ ] Cada job corre `just check` y `just build`
- [ ] Artifacts se suben en caso de falla para debugging

**Verificación:**
- [ ] `cat .github/workflows/ci.yml | grep 'ubuntu-latest'` succeeds
- [ ] El archivo workflow es YAML válido (sin errores de sintaxis)

**Dependencias:** F0-T4, F0-T5  
**Scope:** S

---

## Checkpoint: Después de F0-T1 a F0-T6

| Elemento de Checkpoint | Estado |
|------------------------|--------|
| `bun --version` >= 1.1.x | ✅ Confirmado: v1.3.14 |
| `just setup` se ejecuta sin error | Pending |
| `just lint` pasa en boilerplate | Pending |
| `just format` formatea todos los archivos | Pending |
| `just -n` muestra las 13 recetas | Pending |
| `.github/workflows/ci.yml` YAML válido | Pending |
| Todos los stubs exportan algo | Pending |

---

## Preguntas Abiertas — Resueltas

| # | Pregunta | Respuesta |
|---|----------|-----------|
| F0-O1 | ¿La CI debe ejecutar E2E tests? | **Solo en Release** — E2E tests solo corren en el workflow de release, no en cada PR. |
| F0-O2 | ¿Necesitamos `bunfig.toml`? | **Sí** — Crear `bunfig.toml` para configuración centralizada de Bun |
| F0-O3 | ¿Incluimos `.editorconfig`? | **No** — Biome es suficiente para consistencia entre editores |

---

## Tarea Adicional

### F0-T7: Crear `bunfig.toml` para configuración de Bun

**Descripción:** Crear `bunfig.toml` con configuración centralizada de Bun para el proyecto. Incluye settings de instalación, objetivos de compilación, y opciones de compile.

**Criterios de aceptación:**
- [ ] `bunfig.toml` existe con configuración válida
- [ ] La configuración soporta objetivos de compilación multiplataforma
- [ ] Los settings de instalación están configurados (production vs development)

**Verificación:**
- [ ] `cat bunfig.toml` es TOML válido
- [ ] Bun lee la config sin warnings

**Dependencias:** F0-T1  
**Scope:** XS

---

*Última actualización: 2026-06-13*