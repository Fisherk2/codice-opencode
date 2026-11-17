# Fix 30 — FEV-31 (v2.1.5): implementación parcial de los issues #111–#116 y reestructuración fuera de alcance

**Fecha:** 2026-11-17 · **Estado:** Diagnosticado · **Rama:** `hotfix/update-payload` @ `1941ed3`
**Relacionado:** FEV-31 / v2.1.5 (milestone 2.1.x), issues [#111](https://github.com/fisherk2/codice-opencode/issues/111)–[#116](https://github.com/fisherk2/codice-opencode/issues/116)
**Nota de estado:** trabajo en progreso — el commit de estabilización `1941ed3` es **INCOMPLETO** (tests en verde, referencias huérfanas y gaps de issues abiertos).

## 1. Resumen

La rama `hotfix/update-payload` contiene una **implementación parcial del hito
FEV-31 (v2.1.5: issues #111–#116)** mezclada con una **reestructuración del
workspace y del template que está fuera del alcance del hito** (traslado de los
ADRs de `specs/adr/` a `docs/adr/`, barajado de skills del template — 8
eliminadas, 17 añadidas —, borrado de `skills-lock.json`, nuevos manifiestos
opcionales `Cargo.toml`/`package.json`/`pyproject.toml`, y retirada de
`.gitmessage` + `requirements.txt`).

El estado del hito es: **2 issues completados (#111, #113), 3 parciales
(#112, #114, #116) y 1 sin empezar (#115)**. La reestructuración dejó
referencias obsoletas que rompieron 9 tests y 3 scripts E2E; esas reparaciones
de referencias ya aterrizaron en el commit `1941ed3` (manifiestos y aserciones
E2E), que deja el árbol en **1972/1972 tests y 31/31 E2E**. Ese commit es, sin
embargo, **INCOMPLETO**: es una estabilización de gates que no cierra ningún
gap de los issues ni repara las referencias huérfanas restantes (ver §4.1).
Lo que resta no es una regresión: el diff es una foto de trabajo en curso.

## 2. Progreso por issue

| Issue | Estado | Evidencia DONE (archivo:línea) | GAP |
|-------|--------|-------------------------------|-----|
| [#111](https://github.com/fisherk2/codice-opencode/issues/111) — Protocolo de delegación, fallback shell | **DONE** | Variante `!`-shell en los 5 agentes delegantes de `template/obligatorio/packs/main/` (moctezuma correctamente excluido): `huitzilopochtli.md:110-118`, `mictlantecuhtli.md:79-87`, `quetzalcoatl.md:127-135`, `tezcatlipoca.md:81-89`, `tlaloc.md:78-86`; variante en `plan.md:28` | Menores: el comando de scan ignora `.opencode/agents/`; la prosa del fallback está en inglés roto |
| [#112](https://github.com/fisherk2/codice-opencode/issues/112) — Comando `/hotfix` | **PARTIAL** | `hotfix.md` existe (esqueleto de 6 fases + cadena de debugger en `hotfix.md:51`); `feature.md` completo; `evolve.md` eliminado | La description del frontmatter estaba vacía (corregida en `1941ed3`); fases 1/3/4/5 vacías; 20+ referencias stale a `/evolve` (fixtures, `docs/opencode`, `wiki-source`); el ciclo ágil `/docs-update`→`/hotfix`→`/deploy` no está documentado |
| [#113](https://github.com/fisherk2/codice-opencode/issues/113) — Plugins en `opencode.json` | **DONE** | Los 6 plugins en `template/obligatorio/core/opencode.json:104-111` | ⚠️ Adyacente fuera de alcance: los modelos de los 6 agentes primarios fueron intercambiados (validados activos en el catálogo OpenCode: big-pickle, glm-5.3-flash-free ×2, nemotron-3.5-super-vl-free, deepseek-v4.1-flash-free, mimo-v2.6-flash-free) |
| [#114](https://github.com/fisherk2/codice-opencode/issues/114) — NEVER ASUMPTION PROTOCOL | **PARTIAL** | Protocolo presente en los 6 agentes: `huitzilopochtli.md:139`, `mictlantecuhtli.md:108`, `moctezuma.md:123`, `quetzalcoatl.md:156`, `tezcatlipoca.md:110`, `tlaloc.md:107` | Falta la viñeta de prohibición de ejecución en background y `web-fetch` en el ítem 4 de la fuente; efecto colateral: 3 agentes superaron el presupuesto de 100 líneas (el presupuesto del test subió a 120 en `1941ed3`) |
| [#115](https://github.com/fisherk2/codice-opencode/issues/115) — find-skills en comandos | **MISSING** | — | Cero referencias a `find-skills` en los comandos del template |
| [#116](https://github.com/fisherk2/codice-opencode/issues/116) — VSA en comandos | **PARTIAL** (placeholders) | Stubs de fase VSA en `spec.md:79-80`, `feature.md:72`, `migrate.md:83`, `diagnosis.md:62` (+ `hotfix.md:31`) | El skill `vertical-slice-architecture` **no existe**; sin UX de question-tool para Prototipado/MVP/Empresarial; el skill debe ser Obligatorio para no dejar referencias colgantes |

## 3. Síntoma

Antes de `1941ed3`, el árbol fallaba así:

- **9 fallos unit/integration:**
  - `file-rule-manifest` ×2 — entradas stale de `.gitmessage`/`requirements.txt`
    y entradas faltantes de `Cargo.toml`/`package.json`/`pyproject.toml` en el
    manifiesto.
  - `main.test.ts:463` y `npm-pack.test.ts:163` — clean install terminaba en
    `EXIT_ERROR` por el force-stage de entradas del manifiesto ya eliminadas.
  - `agent-frontmatter` ×3 — cuerpos de 101/103/103 líneas contra el
    presupuesto de 100.
  - `command-frontmatter` ×2 — `hotfix.md` con description vacía.
- **3 E2E:** `01`/`03`/`13` asertaban el `skills-lock.json` eliminado
  (p. ej. `tests/e2e/01-clean-install.sh`).

Todos quedaron resueltos con `1941ed3`: `just test` **1972/1972** y
`just test-e2e` **31/31**. Los síntomas restantes son de contenido, no de
ejecución (gaps de la tabla §2 y referencias huérfanas de §4.1).

## 4. Causa raíz

Dos causas simultáneas, no una:

1. **La reestructuración cambió el árbol del template sin actualizar a sus
   consumidores:** entradas de `FileRuleManifestData`
   (`src/domain/entities/FileRuleManifestData.ts`), aserciones E2E, enlaces de
   documentación, fixtures y `wiki-source` siguieron apuntando al árbol
   anterior.
2. **Las implementaciones de los issues se detuvieron a mitad de camino:** el
   diff captura trabajo en progreso — comandos con fases vacías, protocolos con
   viñetas pendientes, un issue entero (#115) sin tocar y un skill (#116)
   referenciado pero inexistente.

No hay regresión de comportamiento en código previo: es un snapshot incompleto
más un desacople árbol↔consumidores.

### 4.1 El commit `1941ed3` es una estabilización INCOMPLETA

`1941ed3` («fix: repair manifest/E2E references after template restructuring»)
queda documentado explícitamente como **INCOMPLETO**.

**Lo que SÍ hizo (parcial):**

- Reparó los 9 fallos unit/integration + 3 aserciones E2E: entradas del
  manifiesto, la description de `hotfix.md`, el presupuesto de cuerpo de agente
  100→120 (`agent-frontmatter-validation.test.ts`) y las aserciones E2E de
  `skills-lock.json` → `commands/hotfix.md` (p. ej. `tests/e2e/01-clean-install.sh`),
  más una línea stale del gitignore del template.
- Gates en verde: `just test` **1972/1972**, `just test-e2e` **31/31**.

**Lo que NO hizo — por qué es incompleto:**

1. **Cero gaps de issues cerrados:** #112 fases 1/3/4/5 siguen vacías; #115
   sigue sin implementar; #116 con el skill inexistente y placeholders
   intactos; #114 sin la viñeta de background ni `web-fetch`; #111 sin las
   mejoras del comando de scan.
2. **Referencias huérfanas sin tocar:** `obsidian-vault-writer.md:92-102`
   sigue ordenando cargar 6 skills eliminadas; `docs/ARCHITECTURE.md:12-37`
   conserva los enlaces muertos `../specs/adr/`; `AGENTS.md:67`, `SPEC.md:38`
   y `docs/MIGRATION.md:253-254` sin reparar; los comentarios stale de
   `FileRuleManifestData.ts:47,58` sí se actualizaron, pero
   `specs/spec-agent-packs.md:37` y `specs/spec-file-rules.md:35,45` aún
   mencionan `skills-lock.json`/`.gitmessage`/`requirements.txt`;
   `tests/fixtures/workspace` aún refleja `/evolve` eliminado y skills stale;
   `docs/wiki-source` aún documenta `/evolve`, `obsidian-*`, `xlsx`,
   `skills-lock.json` y `.gitmessage`.
3. **Los cambios extra fuera de alcance (§8) siguen sin documentar** en
   `docs/WORKFLOW.md` / `docs/TECH_DEBT.md` / `docs/ARCHITECTURE.md`.
4. **`just check` sin verificar** (biome no ejecutable en este montaje NTFS —
   limitación del entorno, no del código).

## 5. Impacto

| Dimensión | Evaluación |
|-----------|------------|
| Usuarios afectados | Todos (consumidores del template — un manifiesto roto publicado habría hecho fallar en duro cualquier instalación vía `bunx` antes de `1941ed3`) |
| Funcionalidad | Degradada — referencias colgantes si se publicara: `obsidian-vault-writer.md:92-102` ordena cargar 6 skills eliminadas; 5 comandos referencian un skill VSA inexistente |
| Integridad de datos | Segura |
| Reproducibilidad | Siempre |

## 6. Entorno

- **Plataforma:** Linux
- **Versión:** rama `hotfix/update-payload` @ `1941ed3` (~200 archivos sin
  commitear vs `develop`, más `1941ed3` ya commiteado)
- **Configuración:** biome no ejecutable en este montaje NTFS (`just check`
  no disponible en este entorno — conocido y documentado en `docs/TECH_DEBT.md`)

## 7. Workarounds

> ⚠️ **MITIGACIÓN PARCIAL YA APLICADA**
> `1941ed3` repara los síntomas de ejecución (§3) pero es **INCOMPLETO** (§4.1):
> no cierra los gaps de contenido de §2 ni las referencias huérfanas de §4.1.
> No existe workaround para esos gaps: requieren completar la implementación (§9).

## 8. Cambios fuera de alcance (inventario a documentar)

Estos cambios acompañan al hito pero no pertenecen a FEV-31; el usuario pide
que queden registrados aquí y luego en la documentación formal (paso 8 de §9):

- **Traslado de ADRs** `specs/adr/` → `docs/adr/` (23 archivos). Deja enlaces
  muertos: 23 en `docs/ARCHITECTURE.md:12-37`, además de `AGENTS.md:67`,
  `SPEC.md:38` y `docs/MIGRATION.md:253-254`.
- **Template `estandar`:** nuevos `docs/adr/adr-template.md` y `BACKLOG.md`.
- **Skills del template:** eliminadas `baoyu-*` ×3, `xlsx`, `excel-analysis`,
  `obsidian-*` ×3; añadidas 17: `brainstorming`, `codebase-design`,
  `codebase-onboarding`, `data-analysis`, `data-plotting`,
  `framework-migration-legacy-modernize`, `improve-codebase-architecture`,
  `markdown-mermaid-writing`, `osint-skills`, `pr`, `prototype`,
  `refactor-legacy-code`, `security-audit`, `setup-pre-commit`,
  `spreadsheet-analysis`, `teach`, `tech-debt`.
- **`skills-lock.json` eliminado** — `1941ed3` actualizó los comentarios de
  `FileRuleManifestData.ts:47,58`, pero siguen menciones stale en
  `specs/spec-agent-packs.md:37` y `specs/spec-file-rules.md:35,45`.
- **Reescritura de estilo blanket en 13 comandos** del template.
- **Intercambio de modelos** en `opencode.json:15-65` (6 primarios).

## 9. Solución propuesta

Pasos en orden, sin código — cada uno indica qué cambia y por qué:

1. **Completar #112:** rellenar las fases 1/3/4/5 de `hotfix.md` reutilizando
   las estructuras de `plan.md`/`diagnosis.md`; migrar todas las referencias
   `/evolve` → `/feature` en fixtures, `docs/opencode` y `wiki-source` (NO en
   `docs/diagnosis` — histórico); documentar el ciclo ágil
   `/docs-update`→`/hotfix`→`/deploy`.
2. **Completar #114:** añadir la viñeta de prohibición de ejecución en
   background y `web-fetch` en el ítem 4 de la fuente, en los 6 agentes.
3. **Completar los menores de #111:** que el scan cubra `agents/` y
   `.opencode/agents/`; corregir la prosa del fallback.
4. **Implementar #115:** paso find-skills (tabla → question-tool → instalación
   a nivel de proyecto, nunca global → fallback `npx skills` usando
   `vercel-labs/skills`) en `spec`/`feature`/`diagnosis`/`migrate`.
5. **Implementar #116:** crear el skill `vertical-slice-architecture`
   (`SKILL.md` + `references/` según metodología, universal) en
   `template/obligatorio/core/skills/`; reemplazar los placeholders por
   selección de alcance vía question-tool (Prototipado 1-3 / MVP 4-6 /
   Empresarial 7+), delegación a `software-architect` y salida en
   `WORKFLOW.md`.
6. **Reparar referencias restantes:** `obsidian-vault-writer.md:92-102`,
   enlaces ADR de `ARCHITECTURE`/`AGENTS`/`SPEC`/`MIGRATION`, menciones a
   `skills-lock.json`, regeneración de fixtures y sincronización de
   `wiki-source` según `CONTRIBUTING.md`.
7. **Documentar los cambios extra de §8** en `docs/WORKFLOW.md`,
   `docs/TECH_DEBT.md` y `docs/ARCHITECTURE.md`.
8. **Re-ejecutar los gates:** `just test`, `just coverage-check`,
   `just test-e2e` (con la salvedad de biome/NTFS del §6).

## 10. Recurrencias

| Fecha | Issue similar | Variación |
|-------|---------------|-----------|
| 2026-09-21 | [fix29](fix29-fase2-tools-key-and-nul-audit.md) | Cambio de template que dejó rutas muertas (código/consumidores no sincronizados) |
| 2026-09-21 | [fix28](fix28-subagent-delegation-kill-switch.md) | Cambio de config (`opencode.json`) con efecto en el template no previsto por el autor |

_Patrón repetido: modificaciones del árbol del template sin actualizar a sus
consumidores (manifiesto, E2E, docs). Si ocurre una tercera vez, considerar un
test de consistencia árbol↔manifiesto como automatización._

## 11. Referencias

- Issues del hito: [#111](https://github.com/fisherk2/codice-opencode/issues/111),
  [#112](https://github.com/fisherk2/codice-opencode/issues/112),
  [#113](https://github.com/fisherk2/codice-opencode/issues/113),
  [#114](https://github.com/fisherk2/codice-opencode/issues/114),
  [#115](https://github.com/fisherk2/codice-opencode/issues/115),
  [#116](https://github.com/fisherk2/codice-opencode/issues/116)
- Commit de reparación de referencias: `1941ed3`
- Archivos clave: `template/obligatorio/core/opencode.json`,
  `src/domain/entities/FileRuleManifestData.ts`,
  `tests/e2e/01-clean-install.sh`,
  `template/obligatorio/packs/main/*.md`,
  `template/obligatorio/core/commands/*.md`
- Diagnósticos relacionados: `docs/diagnosis/fix28-subagent-delegation-kill-switch.md`
  (FEV-30), `docs/diagnosis/fix29-fase2-tools-key-and-nul-audit.md` (FEV-29/30)

---

_Diagnóstico creado por `/diagnosis`. Actualizar este archivo si el fix revela hallazgos adicionales._
