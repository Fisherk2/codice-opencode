# Fix 29 — Fase 2: la clave legacy `tools:` seguía aceptada y un NUL crudo ocultaba el validador

**Fecha:** 2026-09-21 · **Estado:** Resuelto · **Commit:** `387e65c`
**Relacionado:** Fase 2 (migración a `permissions:` nativo V2), Fix 26 (dirección de migración), Fix 28 (kill-switch de delegación), issue #91

## 1. Síntoma

La auditoría posterior a la migración de 349 archivos de agentes (8 packs, un
commit por pack) encontró tres defectos que la migración dejó al descubierto:

1. **CI en rojo.** El gate `just coverage-check 95` (cableado en
   `.github/workflows/ci.yml:74`) fallaba en **93.34%**, por debajo del umbral del
   95%.
2. **Agujero fail-open.** Un agente que aún portara el mapa V1 `tools:` se veía
   como "válido" para el validador, aunque OpenCode V2 lo ignora por completo.
3. **Punto ciego de tooling.** El archivo del validador contenía un byte NUL
   (`0x00`) literal, que hace que grep/ripgrep lo reporten como binario y que las
   herramientas de Read/diff lo omitan — precisamente la superficie que debía
   detectar regresiones.

## 2. Causa raíz (tres defectos encadenados)

### 2.1 Ruta legacy muerta: `validateTools()` y el campo `"tools"`

`tests/unit/domain/helpers/agentFrontmatterValidator.ts` todavía exportaba
`validateTools()` (más el alias `validatePermission`) y mantenía `"tools"` dentro
de `VALID_AGENT_FIELDS`, aunque ningún pack usa ya ese mapa. Dos consecuencias:

- **Código muerto** que nadie ejercitaba — y por eso el gate de cobertura caía a
  93.34% (una rama sin cubrir que además era la equivocada).
- **Loophole:** al declarar `"tools"` como campo válido, el validador aprobaba
  archivos que el runtime no interpreta. Es la misma clase de bug que el
  *silent shadowing* de #91 / fix26.

### 2.2 Clave de permiso fail-open

OpenCode V2 **ignora las claves desconocidas** del frontmatter de agente en lugar
de rechazarlas. Un agente restrictivo que conservara un `tools:` legacy *parecía*
restringido, pero en la práctica quedaba sin restricciones — y sin ningún error
visible. La singular `permission:` ya se rechazaba; `tools:` no.

### 2.3 NUL crudo en la clave anti-duplicados

La clave del guard de duplicados en `validatePermissionsList` usaba un byte
`0x00` **literal** como separador, en lugar del escape ASCII `\u0000`. Un NUL
crudo vuelve el archivo "binario" para grep/ripgrep y lo salta para las
herramientas de lectura/diff: el archivo se convierte en un punto ciego para las
auditorías destinadas a atrapar regresiones.

## 3. Evidencia empírica contra el código de OpenCode V2

Verificado contra el repo `anomalyco/opencode` (rama `dev`):

- `packages/core/src/config.ts` define
  `const decodeOptions = { errors: "all", onExcessProperty: "ignore", propertyOrder: "original" }`.
  Las claves que no pertenecen al esquema se **ignoran**, no se rechazan.
- `packages/core/src/config/agent.ts` — `ConfigV2.Agent.Info` declara
  `model`, `variant`, `request`, `system`, `description`, `mode`, `hidden`,
  `color`, `steps`, `disabled`, `permissions`. **No existe `tools`.**

**Conclusión:** `tools:` no es una clave V2; cualquier mapa `tools:` en el
frontmatter se descarta en silencio. La única defensa es rechazarlo en nuestro
propio validador, que es lo que hace ahora
`tests/unit/domain/helpers/agentFrontmatterValidator.ts` (ver sus comentarios en
`VALID_AGENT_FIELDS`).

## 4. Impacto

| Dimensión | Evaluación |
|-----------|------------|
| Usuarios afectados | Todos los que instalaran un pack aún no migrado con `tools:` legacy |
| Funcionalidad | Degradada — permisos restrictivos silenciosamente inefectivos (fail-open) |
| Integridad de datos | Segura — no hay escritura ni corrupción |
| Reproducibilidad | Siempre para el caso `tools:`; el NUL afectaba a la auditoría, no al runtime |

## 5. Fix aplicado (`387e65c`)

- **`agentFrontmatterValidator.ts`**: se elimina la ruta legacy muerta —
  `validateTools()`, el alias `validatePermission` y la entrada `"tools"` de
  `VALID_AGENT_FIELDS`. La clave ahora falla el chequeo de campos desconocidos,
  igual que la singular `permission:`. Quitar el código muerto repara además el
  gate de cobertura.
- **Mismo archivo**: el byte `0x00` literal pasa a ser el escape `\u0000` en la
  clave del guard de duplicados. La semántica no cambia (el separador debe seguir
  siendo inmune a colisiones) y queda fijada por un test de colisión.
- **Encabezados U+1F504 reparados** en 2 archivos de pack cuyos bytes UTF-8 se
  habían degradado a `=` + `0x04`.
- **Nuevo guard** `tests/unit/quality/source-hygiene.test.ts`: falla ante
  cualquier byte de control crudo (tabla de verdad de 30 bytes — C0 menos
  TAB/LF/CR, más DEL) en las superficies de texto rastreadas `src`, `tests`,
  `scripts` y `template/obligatorio/packs`. Excluye deliberadamente los
  directorios de instalación gitignorados (`agents/`, `commands/`, `.opencode/`)
  para que el test sea hermético: idéntico en local y en CI.
- **Tests**: se rechaza `tools:` legacy (llamada directa y sobre todos los
  archivos de pack), se cubren las cinco ramas de error de
  `validatePermissionsList`.

## 6. Verificación

| Gate | Resultado |
|------|-----------|
| `just test` | **1986 pass / 0 fail** |
| `just check` | Limpio (biome + `tsc --noEmit`) |
| `just coverage-check 95` | **PASS — 96.00%** (antes 93.34%) |
| Universo de agentes | 359 archivos `.md` en `template/obligatorio/packs/` |

## 7. Follow-ups rastreados

1. **Claves nativas V2 aún rechazadas.** `VALID_AGENT_FIELDS` no incluye `system`
   ni `disabled` (declara la legacy `disable`), aunque ambos son claves reales de
   `ConfigV2.Agent.Info`. Un agente que las use hoy falla el validador.
2. **Productor legacy `reformat-agent` — RESUELTO.** Los tres archivos
   (`scripts/reformat-agent.ts`, su CLI y su test) fueron retirados: emitían el
   mapa `tools:` V1, que V2 ignora y el validador rechaza. La spec §6/§7 quedó
   actualizada y el CHANGELOG lo registra en `### Removed`. Su equivalente vigente
   es `scripts/migrate-v1-to-v2-permissions.ts`.
3. **Deuda diferida de Fase-2 — registrada en `docs/TECH_DEBT.md` (v2.1.3).**
   La auditoría de arquitectura (ver ADR-021) diferidió cuatro hallazgos de
   prioridad Important, rastreados como `TD-V2-93-f2..TD-V2-96`:
   emisión write-safe atómica del codemod, gap de superficie del escaneo de
   higiene (`SCAN_ROOTS` + allowlist sin extensión), punto ciego del invariant
   de brake (`mode: subagent` sin `permissions:` escapa el chequeo CI) y los
   pendientes del parser (pérdida de líneas en blanco internas y la semántica
   degenerada `tools: <scalar>` → `action: "*"` sin confirmar contra OpenCode V2).

## 8. Referencias

- Commit del fix: `387e65c` — `fix(agents): reject the legacy tools: key and de-NUL the validator`
- Migración: `scripts/migrate-v1-to-v2-permissions.ts`, `scripts/migrate-all-packs.ts`
- Spec: `specs/spec-agent-format-v2.md` §3 (bloque de permisos), §7 (implementaciones de referencia)
- Diagnósticos relacionados: `docs/diagnosis/fix26-permission-tools-migration.md`, `docs/diagnosis/fix28-subagent-delegation-kill-switch.md`
- Evidencia V2: `packages/core/src/config.ts`, `packages/core/src/config/agent.ts` (`anomalyco/opencode`, rama `dev`)
- Guard: `tests/unit/quality/source-hygiene.test.ts`
- Issue: #91

---

_Diagnóstico creado por `/diagnosis`. Actualizar este archivo si el fix revela hallazgos adicionales._
