# Fix 28 — Global `subagent: deny` Killed All Delegation (V2 Permissions Merge Semantics)

**Fecha:** 2026-09-21 · **Estado:** Resuelto · **Commits:** `770acc7`, `164f97f`
**Relacionado:** Fase 2 (migración a `permissions:` nativo V2), Fix 26 (dirección de migración)

## 1. Síntoma

Con el template migrado a `permissions:` nativo V2, ningún primario podía delegar:
huitzilopochtli respondía *"no tengo herramienta de subagent/task activa, ejecuto
directo"* y listaba los 10 `.md` de `agents/` como definiciones no cargadas.

## 2. Pistas falsas descartadas (no era el runtime ni la instalación)

1. **Otra terminal (Konsole):** mismo resultado. El catálogo expuesto era
   `default.*` + `execute` + `search`, sin tool de delegación.
2. **Binario real v2.0.5** (`opencode --version` → `opencode v2.0.5`) vía
   `opencode run "<probe de delegación>"`: la sesión corrió como
   `huitzilopochtli · big-pickle` — **la config sí se cargaba** — pero el
   catálogo tampoco exponía el tool `subagent`.
3. **Reinstalación en Arch:** innecesaria. Esos harnesses sirven el catálogo
   desde el backend; reinstalar el binario no lo cambia.

## 3. Causa raíz (hallazgo del operador, confirmado aquí)

`template/obligatorio/core/opencode.json` tenía como primera regla global:

```json
{ "action": "subagent", "resource": "*", "effect": "deny" }
```

con la intención de que *"los subagentes no puedan delegar"*. Efecto real:
**kill-switch absoluto** — el tool de delegación no se expone en ninguna
sesión, aunque el frontmatter de los primarios declare
`subagent: "*": allow`. Al cambiarlo a `ask`, la delegación empezó a funcionar
de inmediato (probado: docs-writer creó `prueba.txt` con "hola mundo" y luego lo
actualizó a "buenos dias"; artefacto efímero ya eliminado).

## 4. Semántica oficial (fuentes)

`https://opencode.ai/v2/docs/permissions/` y `https://opencode.ai/v2/docs/agents/`:

- **Orden de merge:** *"Lower-priority configuration is loaded first, global
  rules are appended next, and agent rules are appended last"*; *"Agent rules
  are appended after global rules; they do not replace the global array."*
  Gana la última coincidencia.
- **El hijo usa las suyas:** *"A custom subagent uses its own permissions, not
  a subset of its parent's permissions."* Cada eslabón se gobierna por
  global + su propio frontmatter; los `allow` del padre no se heredan.
- **Precedente del freno:** el builtin `general` *"Denies questions and
  launching subagents"*.
- **`hidden` no es seguridad:** *"This controls visibility, not security. Use
  permissions to restrict behavior."* (`hidden` solo saca del catálogo de
  subagentes; todos nuestros subagentes lo tienen en `true` por herencia V1).
- **Default sin match:** `ask`. **Guardados:** *"Allow always"* persiste un
  `allow` por proyecto, pero *"never override a configured `deny`"*
  (argumento a favor del freno explícito).
- Nombres V2 confirmados: `permissions`, `shell`, `subagent` (no `permission`,
  `bash`, `task`).

**Discrepancia doc-vs-conducta (nota para upstream):** según el orden de merge,
el `allow` de los primarios (al final) debería vencer al `deny` global; en la
práctica el `deny` global actuó como interruptor de la feature. Regla operativa:
**global = interruptor (`deny` apaga, `ask` deja operar), frontmatter = control
fino.**

## 5. Riesgo: cadenas de delegación con `ask` global

Ningún subagente tenía reglas `subagent` → una delegación-hija caería al `ask`
global: posible en TUI (pidiendo aprobación por salto) e impredecible en
clientes no interactivos. Diseño aplicado:

| Capa | Regla | Efecto |
|---|---|---|
| Global (`opencode.json`) | `subagent * ask` | Delegable pero gated |
| Primarios delegantes | `subagent * allow` + deny-lists | Delegan por diseño |
| Moctezuma (no delegante) | `subagent * deny` | No delega (preexistente) |
| Subagentes (`writers/` piloto) | `subagent * deny` (nuevo) | Freno anti-cadenas |

En el merge del hijo, su `deny` queda al final y vence al `ask` global; al ser
`deny` configurado, ni un *"Allow always"* accidental lo overridea.

## 6. Cambios aplicados

- `770acc7` — `fix(agents)`: global `subagent * deny → ask` + test
  `opencode-config` actualizado (documenta el kill-switch).
- `164f97f` — `feat(agents)`: el codemod inyecta `subagent *: deny` al migrar
  `mode: subagent` sin reglas (primarios excluidos, explícitas respetadas;
  3 casos TDD 17–19); freno añadido a los 4 `writers/`; suite del validador
  exige el freno en todo `mode: subagent` migrado (los no migrados los cubre
  el codemod al migrarlos).
- Pendiente Fase 2: replicar el freno en los 7 packs restantes vía codemod;
  evaluar `hidden` en subagentes delegables; decidir cobertura para `mode: all`.
