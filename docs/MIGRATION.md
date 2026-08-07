# Guía de Migración — v1.x → v2.0.0

**Aplica a:** instalaciones de Códice v1.2.0 y anteriores (`bunx @fisherk2-dev/codice`)
**Fecha:** 2026-08-07
**Versión de destino:** v2.0.0

---

## 1. Resumen

v2.0.0 introduce dos cambios fundamentales respecto a v1.x:

1. **Sistema de packs.** Los ~355 agentes del workspace ya no se instalan "todos a la vez": se organizan en **10 packs** — 2 obligatorios (`main`, `writers`) y 8 seleccionables (software-development, business, hardware-emerging, science-research, operations-support, finance, creative, government-legal). En Clean/Project Install eliges qué packs instalar; el instalador muestra un resumen con conteos de agentes antes de copiar.
2. **Actualizaciones version-gated.** El modo **Update Workspace solo funciona sobre instalaciones v2.0+**. Las instalaciones v1.x (y anteriores) no pueden actualizarse en el lugar: deben reinstalarse con Clean o Project Install.

Si tu instalación ya es v2.0+, no necesitas esta guía. Consulta el [README](../README.md) para el uso normal.

---

## 2. Cambios Rupturistas (Breaking Changes)

| Cambio | v1.x | v2.0.0 |
|--------|------|--------|
| **Update Workspace** | Funcionaba sobre cualquier instalación con `.codice-version` | Bloqueado para instalaciones sin archivo o con versión < 2.0.0. Mensaje de guía: reinstalar |
| **Selección de packs** | "Instalar todo" implícito | Wizard de selección (Clean/Project) o flags `--packs` / `--packs-all` |
| **Formato `.codice-version`** | `{ version, ... }` (legacy `installedVersion`) | v2.0: `{ version, installedPacks, installedAt, optionalSelections? }` |
| **Update Option A/B** | No existía | Option A (solo packs actuales) / Option B (agregar packs, instalados bloqueados) |

### 2.1 Update bloqueado en v1.x

El instalador lee `.codice-version` al arrancar y clasifica la instalación:

| Estado detectado | Comportamiento de Update |
|------------------|--------------------------|
| Sin archivo `.codice-version` | Bloqueado — guía a reinstallar |
| Versión < 1.2.0 | Bloqueado — sugiere limpiar `references/` y `.devin/` antes de reinstalar (ver §5) |
| v1.2.0 ≤ versión < 2.0.0 | Bloqueado — guía a reinstallar con Clean/Project Install |
| v2.0.0+ | Normal — Option A o B |

### 2.2 Formato `.codice-version`

El archivo `.codice-version` en la raíz del proyecto cambió a formato v2.0:

```json
{
  "version": "2.0.0",
  "installedPacks": ["software-development"],
  "installedAt": "2026-08-07T12:00:00.000Z",
  "optionalSelections": ["docs"]
}
```

El parser es **backward-compatible** con el campo legacy `installedVersion`, así que un archivo v1.x existente no rompe el instalador — simplemente se considera pre-2.0.0.

---

## 3. Qué Se Preserva

Al migrar (reinstalar con Clean o Project Install), lo siguiente **no se pierde**:

- **Archivos Estándar** (`docs/`, `specs/`, `tasks/`, `CODE_OF_CONDUCT.md`, etc.): solo se copian si faltan; los existentes se conservan intactos.
- **Archivos Opcionales** seleccionados previamente: el menú de opcionales se vuelve a presentar; los archivos ya presentes no se sobrescriben.
- **Archivos propios del usuario** (código, configuraciones fuera del template): Códice nunca los toca.
- **Agentes personalizados** que agregaste en `agents/`: Clean Install puede sobrescribirlos (es "instalar todo de nuevo"), por eso se recomienda **Project Install** para migrar. Ver FAQ.

> ⚠️ **Clean Install sobrescribe.** Usa Project Install si tienes archivos del template modificados o agentes propios en `agents/` que quieras conservar. Clean Install solo es seguro en directorios vacíos o recién creados.

---

## 4. Migración Paso a Paso

La migración desde v1.x requiere **una reinstalación** — el Update version-gated no cubre v1.x.

### Paso 1 — Verifica tu versión actual

```bash
cat .codice-version
```

Si no existe el archivo, tu instalación es pre-1.2.0 (o manual) → ve al Paso 1 de §5 primero.

### Paso 2 — Reinstala (NO uses Update)

```bash
# En la raíz de tu proyecto:
bunx @fisherk2-dev/codice --project
```

Elige **Project Install** (no Clean) para preservar archivos Estándar y opcionales existentes. No uses `--update`: está bloqueado para v1.x y te guiará a reinstalar de todos modos.

Para instalación no interactiva:

```bash
# Solo packs específicos:
bunx @fisherk2-dev/codice --project --packs software-development,business

# Todos los packs:
bunx @fisherk2-dev/codice --project --packs-all
```

### Paso 3 — Selecciona los packs

En el wizard de selección:

- `software-development` viene pre-seleccionado (146 agentes).
- Debes elegir al menos **1 pack**.
- El instalador muestra un **resumen** (packs con conteos, directorios obligatorios `core`/`main`/`writers`, opcionales seleccionados, total de agentes/archivos) antes de copiar.
- Cancelar en cualquier punto aborta **antes** de escribir nada (operación atómica).

### Paso 4 — Verifica la migración

```bash
# El archivo debe tener formato v2.0 con installedPacks:
cat .codice-version

# Los agentes deben estar planos en agents/ (sin subdirectorios de packs):
ls agents/ | head

# Los packs obligatorios deben existir (main → 6 agentes primarios):
ls agents/huitzilopochtli.md agents/quetzalcoatl.md 2>/dev/null
```

Si algo falló a mitad, Códice revierte automáticamente (staging + rollback) — tu proyecto queda como estaba.

---

## 5. Limpieza Pre-1.2.0 (recomendado)

Las instalaciones **anteriores a v1.2.0** pueden contener restos de versiones viejas que ya no se usan:

| Directorio | Qué era | Estado en v2.0.0 |
|------------|---------|------------------|
| `references/` | Referencias centralizadas (pre-FEV-12) | Ya no se instala — las referencias viven junto a cada skill |
| `.devin/` | Capa de compatibilidad con Devin (7 symlinks) | Eliminado en v1.2.0 (breaking) |

El Update mode de v2.0.0 lo detecta y **sugiere eliminarlos** antes de reinstalar:

```bash
# Revisa si existen (desde la raíz del proyecto):
ls -d references .devin 2>/dev/null

# Si confirmas que ya no los usas, elimínalos:
rm -rf references .devin
```

> Son archivos del template antiguo, no código tuyo. Eliminarlos es seguro si no los modificaste.

---

## 6. FAQ

### ¿Puedo actualizar desde v1.x con `--update`?

**No.** Update Workspace está version-gated: solo opera sobre instalaciones v2.0+. Ejecutar `--update` en v1.x muestra un mensaje de guía que te redirige a reinstalar. Es un cambio deliberado: el formato de `.codice-version`, el sistema de packs y la lógica de merge cambiaron lo suficiente como para que una "actualización" incremental no sea segura.

### ¿Qué pasa con mis agentes personalizados?

Se conservan siempre que existan en tu `agents/` y elige **Project Install**:

- Project Install copia agentes de packs solo si faltan → tus archivos `agents/mi-agente.md` no se sobrescriben.
- Clean Install **sí sobrescribe** `agents/` — úsalo solo en proyectos nuevos o si quieres resetear el workspace.
- Tras migrar, tu agente sigue disponible: el plugin auto-descubre cualquier `.md` en `agents/` (recursivo), no requiere registrarlo en catálogos.

### ¿Puedo agregar packs más adelante?

**Sí**, de dos formas:

```bash
# Interactivo — Update → Option B (agregar packs):
bunx @fisherk2-dev/codice --update

# No interactivo — agregar packs específicos:
bunx @fisherk2-dev/codice --update --update-add-packs creative,business
```

En Option B los packs ya instalados quedan **bloqueados** (no se pueden quitar, solo agregar).

### ¿Cómo elimino un pack?

**Todavía no existe un mecanismo.** Los agentes de un pack instalado persisten en `agents/`. La eliminación de packs está **diferida a v2.3.0** (tracked como TD-V2-6 en [TECH_DEBT.md](./TECH_DEBT.md)). Mientras tanto, puedes eliminar manualmente los archivos de agentes de ese pack (consulta los IDs en `installedPacks` de `.codice-version`).

### ¿Por qué el tarball npm creció (8MB)?

v2.0.0 distribuye los 8 packs seleccionables dentro del paquete (ADR-014), por eso el tarball supera el target de 5MB. Es una desviación conocida y aceptada — ver §7.2 en [TECH_DEBT.md](./TECH_DEBT.md).

### ¿Qué pasa si cancelo a mitad de la migración?

Nada. Códice usa staging + rename atómicos: una interrupción (Ctrl+C, kill) deja el directorio destino en su estado previo y limpia el staging.

---

## 7. Relacionado

- **[SPEC.md](../SPEC.md)** — Especificación central del proyecto (v2.0.0).
- **[spec-agent-packs.md](../specs/spec-agent-packs.md)** — Sistema de packs: clasificación, permisos, estructura.
- **[spec-installer-ux-v2.md](../specs/spec-installer-ux-v2.md)** — UX del instalador v2: wizard, version gating, metadata, resumen.
- **[ADR-014](../specs/adr/adr-014-agent-pack-system.md)** — Decisión de arquitectura del sistema de packs.
- **[ADR-015](../specs/adr/adr-015-installer-ux-v2.md)** — Decisión de arquitectura de la UX v2 del instalador.
- **[TECH_DEBT.md](./TECH_DEBT.md)** — TD-V2-6 (eliminación de packs, v2.2.0) y desviaciones conocidas.
- **[CHANGELOG.md](../CHANGELOG.md)** — Notas de release [2.0.0].
