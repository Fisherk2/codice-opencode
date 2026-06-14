# TODO: F1 – Infrastructure (Adapters)

**Estado:** 🟢 Listo para Implementar
**Fecha:** 2026-06-14
**Dependencias:** F0 ✅ Completado

---

## Phase 1: Template Setup

### F1-T0: Setup template directory structure

**Descripción:** Reorganizar el directorio `template/` plano en la estructura de 3 subdirectorios definida en `spec-file-rules.md`. Crear `obligatorio/`, `estandar/`, `opcional/` y mover los archivos existentes.

**Criterios de aceptación:**
- [ ] `template/obligatorio/` contiene: `opencode.json`, `skills-lock.json`, `agents/`, `commands/`, `.opencode/`, `skills/`, `references/`
- [ ] `template/estandar/` contiene: `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`, `SPEC.md`, `.env.example`, `scripts/`, `tasks/`, `docs/` (con excepciones), `specs/` (con excepciones)
- [ ] `template/opcional/` contiene: `Justfile`, `Makefile`, `requirements.txt`, `docs/DESIGN.md`, `docs/SCHEMA.md`, `docs/opencode/`, `specs/design/`, `.opencode/plugins/sdd-workflow-test.md`
- [ ] `docs/DESIGN.md`, `docs/SCHEMA.md`, `docs/opencode/` movidos a opcional/
- [ ] `specs/design/` movido a opcional/
- [ ] `.opencode/plugins/sdd-workflow-test.md` movido a opcional/
- [ ] No hay archivos sueltos en la raíz de `template/` (solo los 3 dirs de categoría)
- [ ] `bun test` sigue pasando (74 tests F0 sin cambios)

**Verificación:**
- [ ] `ls template/` muestra solo `obligatorio/`, `estandar/`, `opcional/`
- [ ] `find template/obligatorio/` lista todos los archivos y directorios obligatorios
- [ ] `find template/estandar/` lista todos los archivos y directorios estándar
- [ ] `find template/opcional/` lista todos los archivos y directorios opcionales
- [ ] `bun test` → 74/74 pass (sin cambios)

**Dependencias:** Ninguna (F0 ✅)
**Scope:** S

---

## Phase 2: Adapter Implementation

### F1-T1: BunFileSystem adapter

**Descripción:** Implementar los 11 métodos de `IFileSystem` usando las APIs nativas de Bun. Patrón atómico con staging: `stageFile()` copia de template a staging; `commitStaging()` renombra a destino; `cleanStaging()` limpia en rollback. Prevención de path traversal via `path.resolve()` + validación de frontera.

**Criterios de aceptación:**
- [ ] `readTemplateFile(relativePath)` lee de `template/` usando `Bun.file().text()`
- [ ] `destinationExists(relativePath)` verifica destino con `Bun.file().exists()`
- [ ] `getStagingPath(relativePath)` retorna `path.join(stagingDir, relativePath)`
- [ ] `stageFile(relativePath)` lee de template, escribe a staging (crea directorios intermedios)
- [ ] `commitStaging()` renombra archivos de staging a destino; falla gracefully si rename falla
- [ ] `cleanStaging()` elimina el directorio staging recursivamente
- [ ] `isWritable()` verifica permiso de escritura del directorio destino
- [ ] `isEmpty()` retorna `true` si destino no tiene archivos (excepto .git/ y .codice-version)
- [ ] `writeVersionFile(versionData)` escribe `.codice-version` en la raíz del destino atómicamente
- [ ] `readVersionFile()` lee `.codice-version` de la raíz del destino (null si no existe)
- [ ] Intento de path traversal (`../` fuera del destino) retorna `false`/`null`/`throw` — nunca escribe fuera de la frontera

**Verificación:**
- [ ] `bun test` para los nuevos tests de integración pasa
- [ ] `just lint` pasa con cero warnings en `BunFileSystem.ts`
- [ ] Los 11 métodos retornan tipos correctos (sin `any`)
- [ ] El directorio staging no existe después de llamar `cleanStaging()`

**Dependencias:** F1-T0
**Scope:** M

---

### F1-T2: GitHubRestClient adapter

**Descripción:** Implementar `IGitHubClient` usando `fetch` con `AbortController` para timeout. Mapeo de errores HTTP a valores de retorno del dominio: 404 → `null`, 403 → `null`, network failure → `null`, timeout → `null`.

**Criterios de aceptación:**
- [ ] `getLatestReleaseTag()` hace fetch a `GITHUB_API_LATEST_RELEASE`, parsea `tag_name` del JSON
- [ ] `getLatestReleaseNotes()` hace fetch a la misma URL, parsea `body` del JSON
- [ ] Timeout exactamente `GITHUB_API_TIMEOUT_MS` (3000ms) via `AbortController.timeout`
- [ ] HTTP 404 → retorna `null` (no lanza error)
- [ ] HTTP 403 → retorna `null` (rate limited, no lanza error)
- [ ] Network unreachable → retorna `null` (no lanza error)
- [ ] Respuesta exitosa con JSON malformado → retorna `null`
- [ ] Todos los paths de error loguean mensaje accionable a stderr (en modo verbose)

**Verificación:**
- [ ] `bun test` integration tests pasan (usando `fetch` mockeado)
- [ ] Comportamiento de timeout verificado: respuesta después de 4s retorna `null`
- [ ] `just lint` pasa con cero warnings

**Dependencias:** Ninguna (puede paralelizarse con F1-T0, F1-T1)
**Scope:** S

---

### F1-T3: ClackPromptsAdapter

**Descripción:** Implementar los 11 métodos de `IUserPrompt` usando `@clack/prompts` real. Wire `note()` para warning/info, `confirm()` para sí/no, `multiselect()` para selección de archivos opcionales (con agrupamiento cuando >10 items), `spinner` para ops async, `intro()`/`outro()`/`cancel()` para mensajes de flujo.

**Criterios de aceptación:**
- [ ] `showWarning(message)` muestra warning via `@clack/prompts.note()` con estilo apropiado
- [ ] `showInfo(message)` muestra info via `@clack/prompts.note()`
- [ ] `confirm(message, defaultYes)` retorna `true`/`false` desde `@clack/prompts.confirm()`
- [ ] `selectOptional(options)` muestra multiselect agrupado; agrupa por primer segmento del path cuando count > 10
- [ ] `showSpinner(message)` / `stopSpinner()` inicia/detiene spinner con mensaje
- [ ] `showIntro(title)` muestra banner de título
- [ ] `showSuccess(message)` muestra mensaje de éxito
- [ ] `showCancel(message)` / `showError(message)` muestra mensajes de cancelación/error
- [ ] Todos los prompts son non-blocking para métodos de display (retorno sync `void`)

**Verificación:**
- [ ] `bun test` integration tests pasan (módulo `@clack/prompts` mockeado)
- [ ] `just lint` pasa con cero warnings
- [ ] El adaptador puede ser instanciado sin errores

**Dependencias:** Ninguna (puede paralelizarse con F1-T0, F1-T1)
**Scope:** S

---

## Phase 3: Testing

### F1-T4: Integration tests para los 3 adaptadores

**Descripción:** Escribir tests de integración para los tres adaptadores usando `bun:test` con directorios temporales reales y dependencias externas mockeadas.

**BunFileSystem tests:**
- Crear directorio temporal real como destino, `template/` real para lecturas
- Test `stageFile()` crea archivo en staging
- Test `commitStaging()` promueve a destino
- Test `cleanStaging()` elimina staging
- Test `destinationExists()` retorna booleanos correctos
- Test `isEmpty()` / `isWritable()` behavior
- Test ciclo escritura/lectura de version file
- Test rechazo de path traversal (intentos de escribir fuera del destino → error/null)

**GitHubRestClient tests:**
- Mock `fetch` para retornar JSON predefinido (success, 404, 403, timeout)
- Test timeout retorna `null`
- Test 404 retorna `null`
- Test 403 retorna `null`
- Test extracción exitosa de tag

**ClackPromptsAdapter tests:**
- Mock módulo `@clack/prompts` para capturar argumentos de llamadas
- Verificar `confirm()` llama a `confirm()` con mensaje correcto
- Verificar `selectOptional()` llama a `multiselect()` con opciones correctas
- Verificar output agrupado cuando >10 items

**Criterios de aceptación:**
- [ ] BunFileSystem: ≥8 tests, todos pasan
- [ ] GitHubRestClient: ≥6 tests, todos pasan (fetch mockeado, sin red real)
- [ ] ClackPromptsAdapter: ≥6 tests, todos pasan (@clack/prompts mockeado)
- [ ] Todos los tests usan `bun test` (no scripts de shell)
- [ ] Cobertura total de F1 >70% de los adaptadores de infraestructura
- [ ] Los 74 tests F0 existentes siguen pasando (sin regresión)

**Verificación:**
- [ ] `bun test` → todos pasan
- [ ] `bun test --coverage` → cobertura de adaptadores >70%

**Dependencias:** F1-T1, F1-T2, F1-T3 (todos los adaptadores deben existir antes de testear)
**Scope:** M

---

## Preguntas Abiertas — Resueltas

| # | Pregunta | Respuesta |
|---|----------|-----------|
| F1-O1 | ¿Cómo locate BunFileSystem el directorio template en producción (embebido en binary vs. lado a lado)? | **Deferred a F3** — por ahora usar `path.join(process.cwd(), "template")` en dev; la estrategia de compilación se maneja cuando se configure el build del binary |
| F1-O2 | ¿El directorio staging debe estar dentro o fuera del destino? | **Dentro del destino** — manejo de paths más simple; se limpia en éxito o SIGINT |

---

## Checkpoint: Después de F1-T0 a F1-T4

| Elemento de Checkpoint | Estado |
|------------------------|--------|
| Directorio template organizado en 3 subdirs | Pending |
| BunFileSystem: los 11 métodos de IFileSystem implementados | Pending |
| GitHubRestClient: 2 métodos con timeout + mapeo de errores | Pending |
| ClackPromptsAdapter: los 11 métodos de IUserPrompt con @clack/prompts real | Pending |
| Tests de integración BunFileSystem: ≥8 tests pasan | Pending |
| Tests de integración GitHubRestClient: ≥6 tests pasan | Pending |
| Tests de integración ClackPromptsAdapter: ≥6 tests pasan | Pending |
| `just lint` pasa en todos los archivos F1 | Pending |
| `bun test` (todos los 74 F0 + nuevos F1): todos pasan | Pending |
| Cobertura de adaptadores >70% | Pending |

---

*Última actualización: 2026-06-14*