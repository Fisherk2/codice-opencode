# FEV-28 Todo List — Infrastructure & Performance

**Phase:** FEV-28 (v2.1.1)
**Branch:** `fix/fev-28-infrastructure-performance`
**Base:** `develop`
**Plan:** [plan.md](./plan.md)
**Wall-clock estimate:** 2-3h total

---

## Phase 1 — TD-V2-7: SHA-pins → Node 24-compatible (1-1.5h)

- [ ] **Task 1.1** Bump SHA-pins en `.github/workflows/ci.yml` y `.github/workflows/release.yml`
  - [ ] `ci.yml` línea 38: `actions/checkout@11d5960a...` → `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1)
  - [ ] `ci.yml` línea 49: `actions/cache@0057852bf...` → `actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9` (v6.1.0)
  - [ ] `ci.yml` línea 46: `extractions/setup-just@dd310ad5a...` → `extractions/setup-just@53165ef7e734c5c07cb06b3c8e7b647c5aa16db3` (v4)
  - [ ] `release.yml` línea 32: `actions/checkout@11d5960a...` → `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1)
  - [ ] `oven-sh/setup-bun` se mantiene (SHA actual `0c5077e5...` ya es v2.2.0)
  - [ ] Commit: `chore(ci): bump GitHub Actions SHA-pins to Node 24-compatible majors`

**Checkpoint Phase 1:**
- [ ] `git diff ci.yml release.yml` muestra solo los SHA-pins esperados (4 líneas modificadas, ninguna otra)
- [ ] Push activa CI → `gh run watch` confirma 3/3 jobs verde en ubuntu/macos/windows
- [ ] `gh run view --log | grep "Node.js 20 actions"` retorna 0 líneas (sin warnings)

---

## Phase 2 — TD-V2-61: VersionComparator semver cache (1h)

- [ ] **Task 2.1** Añadir `Map<string, SemVer>` privado + test (TDD)
  - [ ] Escribir test PRIMERO en `tests/unit/domain/version-comparator.test.ts` — nuevo `describe("VersionComparator cache")`:
    - [ ] Test 1: 2 llamadas `compare("1.0.0", "1.0.0")` retornan mismo resultado (sanity)
    - [ ] Test 2: el cache interno contiene la entrada esperada después de `compare()` (verificable vía cast a `unknown` o exponer getter de test)
  - [ ] Modificar `src/domain/services/VersionComparator.ts`:
    - [ ] Añadir `private readonly cache: Map<string, string>` (tipo `string` = resultado de `semver.valid()`, no el objeto SemVer completo porque `valid()` retorna string|null)
    - [ ] Constructor inicializa `this.cache = new Map()`
    - [ ] `compare()` consulta cache antes de llamar a `validateVersions()` interno
    - [ ] NO modificar `validateVersion()` ni `validateVersions()` (funciones puras del módulo, deben quedarse side-effect-free)
  - [ ] `just check` 0 errores
  - [ ] `just test` 1931+ tests verde (1931 base + 2 nuevos = 1933)
  - [ ] Commit: `perf(domain): cache parsed semver objects in VersionComparator`

**Decisiones de implementación:**
- Cache es `Map<string, string>` (key = version input, value = normalized output de `semver.valid()`). NO cachea el objeto SemVer completo porque `compare()` solo necesita el string normalizado.
- Cache es **solo en la clase**, no en las funciones puras exportadas. Esto preserva la pureza de `validateVersion()`.
- Sin cambios en `IVersionComparator` port — el cache es detalle interno.

---

## Quality Gate Checkpoint (post Phase 2)

- [ ] `just check` — 0 errores (biome ci + tsc --noEmit)
- [ ] `just test` — 1931+ tests, 0 fail (esperado 1933 con 2 nuevos)
- [ ] `just test-e2e` — 31/31 escenarios (Linux)
- [ ] `just test-packaging` — 5/5 escenarios
- [ ] `just test-coverage` — ≥95% lines, ≥95% funcs en production `src/`
- [ ] CI matrix (ubuntu + macos + windows) sin warnings de Node 20 deprecation
- [ ] Sin tipos `any` introducidos en código de producción
- [ ] Comentarios explican el *porqué*, no el *qué*

---

## Post-FEV-28 (no parte de este todo, cubre release manager)

Una vez ambas fases mergeadas a `develop`:

- [ ] `docs/WORKFLOW.md` → mover FEV-28 de "⏳ Pendiente" a "✅ Completo" con fecha 2026-08-21+
- [ ] `docs/TECH_DEBT.md` → marcar TD-V2-7 y TD-V2-61 como resueltos en v2.1.1
- [ ] `CHANGELOG.md` → entrada v2.1.1 con los 2 items de FEV-28
- [ ] PR `develop` → `main` → tag → `bun publish` con dist-tag `beta`

---

## Out of Scope (NO hacer)

- ❌ Tocar `WorkspaceVersion` (usa `semver.valid()` directamente, fuera de TD-V2-61)
- ❌ Tocar `GitHubRestClient` (usa `semver.valid()` directamente, fuera de TD-V2-61)
- ❌ Crear módulo de caché compartido global
- ❌ Usar WeakMap (sobre-ingeniería para cardinal acotado)
- ❌ Cambiar SHA-pins a tags mutables (`@v4`) — rompe ADR-019
- ❌ Publicar release v2.1.1 en este PR (lo hace release manager después)
- ❌ Modificar `opencode.json` (no afectado)
- ❌ Modificar `package.json` (sin nuevas deps)

---

## Definition of Done (FEV-28)

- [ ] Las 2 fases completadas con sus commits atómicos
- [ ] Quality gate checkpoint pasa al 100%
- [ ] PR abierto a `develop` con descripción linkeando TD-V2-7 y TD-V2-61
- [ ] CI matrix verde en los 3 OS sin warnings de Node 20
- [ ] Coverage ≥ 95% en production `src/`
- [ ] Sin `any` introducido
- [ ] Documentación sincronizada (WORKFLOW + TECH_DEBT)

---

*Created by Moctezuma · Last revised: 2026-08-21*
