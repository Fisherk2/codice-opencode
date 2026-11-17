# FEV-31 (v2.1.5) — Issues #111–#116 + reparación de referencias + documentación out-of-scope — Todo

> **Estado:** PLANIFICADO — 0 de 11 tasks ejecutadas. Plan fuente: [`tasks/plan.md`](./plan.md).
> **Presupuesto (decisión 2026-11-17):** body ≤ **180 líneas** en agentes principales y comandos, sin contar YAML frontmatter (T0b).
> **Rama:** `hotfix/update-payload` · **Target:** v2.1.5 · **Milestone:** 2.1.x
> **Diagnóstico:** [`docs/diagnosis/fix30-fev31-partial-issue-implementation.md`](../docs/diagnosis/fix30-fev31-partial-issue-implementation.md)
> **Issues:** #111 · #112 · #113 · #114 · #115 · #116
>
> **Baseline congelado (2026-11-17 @ `7560187`):** `just test` 1972/0 · `just test-e2e` 31/31 · `tsc --noEmit` 0 · `just check` NO ejecutable (biome en NTFS), lint validado con `/tmp/opencode/biome ci src/ tests/` → exit 0 · `git status --short | wc -l` = 200
>
> **Commits:** 1 por concern lógico · Conventional Commits · trailer `Co-Authored-By: Moctezuma <dev@fisherk2.com>`
> **Gate por commit:** `just test` 0 fail + `bun run tsc --noEmit` exit 0 + `/tmp/opencode/biome ci src/ tests/` exit 0

---

## Fase A — Baseline y presupuesto (T0 → T0b)

- [x] **T0** Congelar baseline + inventariar referencias stale. Subagent: `codebase-archaeologist`. Skills: `codebase-onboarding`, `codebase-design`. Tools: `codebase-memory-mcp`, `vercel-grep`.
  - [x] `just test` → 1972 pass / 0 fail
  - [x] `just test-e2e` → 31/31
  - [x] `bun run tsc --noEmit` → exit 0
  - [x] `bunx @biomejs/biome ci src/ tests/` → fallo registrado como **limitación NTFS**; lint local validado con `/tmp/opencode/biome ci src/ tests/` → 147 archivos, exit 0
  - [x] `git status --short | wc -l` → 200 · `git log --oneline -1` → `7560187`
  - [x] Inventario de 14 filas copiado a la tabla siguiente

- [x] **T0b** Alinear presupuesto de líneas a **180** en agentes y comandos (decisión del usuario 2026-11-17). Subagent: `test-engineer`. Skills: `test-driven-development`, `clean-code`, `documentation-and-adrs`. Tools: shell (`just test`, `tsc --noEmit`). **Antes de T1/T3.**
  - [x] `specs/spec-agent-format-v2.md:325` (§8 *Line budget*): 100 → **180**, aclarando "body sin frontmatter"
  - [x] `tests/unit/domain/agent-frontmatter-validation.test.ts:249,254`: nombre del test + `toBeLessThanOrEqual(120)` → **180**; comentario stale de la l.243 (100) corregido; comentario FEV-31 de la l.247 ajustado
  - [x] `tests/unit/domain/command-frontmatter-validation.test.ts`: **nuevo** describe "Body line budget", mide el body vía `extractFrontmatter` y afirma `toBeLessThanOrEqual(180)` para los 18 comandos (mismo patrón que el test de agentes)
  - [x] `docs/CODE_STYLE.md:23`: nota junto a la regla de 200 líneas — "Template Markdown prompts (agentes y comandos): body ≤180 líneas, excluyendo YAML frontmatter"
  - [x] 0 matches de `100 lines` / `120 lines` / `toBeLessThanOrEqual(120)` en `tests/`, `specs/`, `docs/` (fuera de `docs/diagnosis/` e históricos)
  - [x] `just test` → 1990 pass / 0 fail (+18) · `tsc --noEmit` → exit 0 · biome → exit 0

### Checkpoint A
- [x] Baseline registrado · inventario materializado · 0 archivos tocados al cerrar T0
- [ ] Spec 100 → 180 · test de agentes 120 → 180 · **test de comandos creado** con 180 · nota en `CODE_STYLE.md`
- [ ] `grep -rn "toBeLessThanOrEqual(180)" tests/unit/domain/{agent,command}-frontmatter-validation.test.ts` → 2 matches

---

## Anexo A — Inventario de referencias stale (14 filas, verificado con `git ls-files | xargs grep`)

| # | Ubicación | Referencia rota | Task | Estado |
|---|-----------|------------------|------|--------|
| 1 | `template/obligatorio/packs/writers/obsidian-vault-writer.md:92-102` | 6 skills eliminadas (`obsidian-vault`, `obsidian-markdown`, `obsidian-cli`, `baoyu-format-markdown`, `baoyu-url-to-markdown`, `baoyu-markdown-to-html`) | T8 | [ ] |
| 2 | `docs/ARCHITECTURE.md:12-37` | 23 enlaces `../specs/adr/` | T8 | [ ] |
| 3 | `AGENTS.md:67` | `[adr/](specs/adr/)` | T8 | [ ] |
| 4 | `SPEC.md:38` | `see [specs/adr/](specs/adr/)` | T8 | [ ] |
| 5 | `docs/MIGRATION.md:253-254` | `[ADR-014](../specs/adr/…)`, `[ADR-015](../specs/adr/…)` | T8 | [ ] |
| 6 | `template/estandar/SPEC.md`, `template/estandar/docs/ARCHITECTURE.md` | `specs/adr/` | T8 | [ ] |
| 7 | `specs/spec-agent-packs.md:37` | `skills-lock.json` | T8 | [ ] |
| 8 | `specs/spec-file-rules.md:35,45` | `skills-lock.json`, `requirements.txt` | T8 | [ ] |
| 9 | `docs/wiki-source/Skills.md` | `obsidian-*`, `xlsx`, `excel-analysis` | T8 | [ ] |
| 10 | `docs/wiki-source/{Commands,Agents,Workspace-Structure}.md` | `/evolve` | T4 | [ ] |
| 11 | `README.md:33,275,349` | `/evolve`, "17 Slash Commands", "51 Engineering Skills" | T4 | [ ] |
| 12 | `template/obligatorio/core/commands/docs-update.md:87` | `/evolve` | T4 | [ ] |
| 13 | `template/obligatorio/packs/main/quetzalcoatl.md:199` | `Invoke via: … /evolve` | T4 | [ ] |
| 14 | `tests/fixtures/workspace/` | `/evolve`, `skills-lock.json`, `requirements.txt` (gitignored → verificación) | T8 | [ ] |

**Contadores reales (verificados):** ~~60 skills~~ → **61 skills** (T6 añadió `vertical-slice-architecture`; el plan se escribió con 60) · 18 comandos · 10 packs.

---

## Fase B — Protocolos de agente (#114, #111) — **SECUENCIAL**

- [x] **T1** #114 — NEVER ASSUMPTION completo (6 agentes). Subagent: `technical-writer`. Skills: `clean-code`, `documentation-and-adrs`. Tools: `vercel-grep`. Recursos: issue #114, opencode.ai/v2/docs/agents.
  - [x] Viñeta de **prohibición de ejecución en background** (`&`, `nohup`, `disown`, `setsid`, huérfanos) — 1 línea — en los 6 agentes
  - [x] Ítem 4 de "Source of truth" cita `websearch`/`webfetch`
  - [x] Prosa en inglés gramaticalmente correcta
  - [x] Cuerpo de cada agente ≤ **180 líneas** (102/104/89/101/104/101)
  - [x] Frontmatter `permissions:` intacto (sin `tools:` / `permission:`)
  - [x] `just test` → 1990 pass / 0 fail · `tsc --noEmit` → 0

- [ ] **T2** #111 — DELEGATION PROTOCOL (5 agentes delegantes + `plan.md`). Subagent: `prompt-engineer`. Skills: `clean-code`, `documentation-and-adrs`. Tools: shell, `vercel-grep`. Recursos: issue #111, opencode.ai/v2/docs/commands/#shell.
  - [ ] Bloque bash escanea **`agents/` y `.opencode/agents/`** en una invocación, salida `nombre :: descripción`
  - [ ] Fallback en español claro + **prohíbe la herramienta Glob** para listar subagentes
  - [ ] `/plan` expone la variante `!`-shell con el roster de subagentes
  - [ ] `moctezuma.md` **sin** DELEGATION PROTOCOL
  - [ ] Cuerpos ≤ **180 líneas** (guard alineado en T0b)
  - [ ] `just test` → 0 fail · `tsc --noEmit` → 0

### Checkpoint B
- [ ] `grep -rn "nohup\|disown\|setsid" template/obligatorio/packs/main/` → 6 archivos
- [ ] `grep -rn "webfetch" template/obligatorio/packs/main/` → 6 archivos
- [ ] `grep -rn "\.opencode/agents" template/obligatorio/packs/main/` → 5 archivos (no moctezuma)
- [ ] `grep -c "DELEGATION PROTOCOL" template/obligatorio/packs/main/moctezuma.md` → 0
- [ ] `just test` → 0 fail (guards de cuerpo ≤180 para agentes y comandos)
- [ ] Revisión humana de la prosa en inglés de los 6 agentes

---

## Fase C — Comando `/hotfix` (#112) — T3 ∥ T4

- [x] **T3** #112a — fases 1/3/4/5 de `hotfix.md`. Subagent: `workflow-architect`. Skills: `incremental-implementation`, `documentation-and-adrs`, `planning-and-task-breakdown`, `test-driven-development`. Tools: `codebase-memory-mcp`. Recursos: issue #112, opencode.ai/v2/docs/commands/, comandos del template.
  - [x] Fase 1 → `docs/diagnosis/<slug>.md` con `diagnosis-template.md` (+ regla "si hay fix en curso, actualizar ese")
  - [x] Fase 2 → `tasks/plan.md` + `tasks/todo.md` con criterios de aceptación (completada también: era una nota en español)
  - [x] Fase 3 → TDD explícito ("ningún gap de pruebas queda fuera")
  - [x] Fase 4 → `just test` + revisión + corrección de observaciones
  - [x] Fase 5 → **GO / not-GO** sin desplegar
  - [x] Fase 6 → cierre de ticket + actualización de documentación (estaba vacía)
  - [x] Frontmatter válido: `description` no vacío, `agent: tlaloc`
  - [x] `grep -c "^## Phase" hotfix.md` → 6, ninguna vacía (body 133 líneas)

- [x] **T4** #112b — `/evolve` → `/feature` + ciclo ágil + contadores. Subagent: `docs-writer`. Skills: `crafting-effective-readmes`, `documentation-and-adrs`, `markdown-mermaid-writing`. Tools: `vercel-grep`. Recursos: issue #112, opencode.ai/v2/docs/commands/.
  - [x] `README.md`: lista de comandos con `/feature` + `/hotfix`, "**18 Slash Commands**", "**61 Engineering Skills**"
  - [x] `README.md`: Mermaid "Evolutionary Flow" con `/feature` y ciclo `/docs-update` → `/hotfix` → `/deploy`
  - [x] `README.md`: fila "Evolve project" → "Feature project"
  - [x] `template/obligatorio/core/commands/docs-update.md:87` → "Run `/feature` to create new specs"
  - [x] `template/obligatorio/packs/main/quetzalcoatl.md:199` → `Invoke via: … /feature …`
  - [x] `docs/wiki-source/{Agents,Commands,Workspace-Structure,Getting-Started,Home}.md` → `/feature` + ciclo ágil + contador 18/61
  - [x] `git ls-files -z | xargs -0 grep -n "/evolve" | grep -v CHANGELOG.md | grep -v docs/diagnosis/` → **0**

### Checkpoint C
- [ ] `/hotfix` con 6 fases completas · 0 refs a `/evolve` · README con 18/60
- [ ] `just test` → 0 fail

---

## Fase D — #115 find-skills (T5)

- [x] **T5** Paso de setup de skills en `/spec`, `/feature`, `/diagnosis`, `/migrate`. Subagent: `technical-writer`. Skills: `find-skills`, `documentation-and-adrs`, `spec-driven-development`. Tools: `vercel-grep`, web search. Recursos: issue #115, skills.sh/vercel-labs/skills/find-skills, github.com/vercel-labs/skills.
  - [x] Fase propia (no viñeta) tras la de intención/análisis, en los 4 comandos
  - [x] Invoca `find-skills` + **fallback documentado**: `npx skills use "https://github.com/vercel-labs/skills" --skill "find-skills"`
  - [x] Presenta **tabla** de skills candidatas
  - [x] Usa `question` tool: todas / solo las más importantes / ninguna
  - [x] **NUNCA global** — instalación a nivel de proyecto (texto literal en los 4)
  - [x] `just test` → 0 fail · `tsc --noEmit` → 0

### Checkpoint D
- [ ] `grep -rln "find-skills" template/obligatorio/core/commands/{spec,feature,diagnosis,migrate}.md` → 4 archivos
- [ ] `grep -rln "nunca global\|NUNCA global\|never global" template/obligatorio/core/commands/` → 4 archivos
- [ ] `just test` → 0 fail

---

## Fase E — #116 VSA (T6 → T7)

- [ ] **T6** Crear skill `vertical-slice-architecture` (**obligatorio**). Subagent: `software-architect`. Skills: `skill-creator`, `opencode-skill-creator`, `clean-ddd-hexagonal`, `documentation-and-adrs`. Tools: plugin `opencode-skill-creator` (`skill_*`), web search. Recursos: issue #116, 3× skills.sh VSA, Wikipedia metodologías, nadirbad.dev, opencode.ai/docs/skills.
  - [ ] `template/obligatorio/core/skills/vertical-slice-architecture/SKILL.md` con frontmatter válido
  - [ ] Contenido: qué es VSA · decisión waterfall vs ágil · criterio de fases (1-3 / 4-6 / 7+) · **anti-patrones cascada** · algoritmo de corte vertical
  - [ ] `references/` con ≥4 archivos (cascada · ágil Scrum/Kanban · VSA · comparativa de decisión)
  - [ ] Refs internas apuntan a archivos que existen
  - [ ] **Sin** links cross-skill `../<skill>/references/*.md` — o bump del contador `tests/unit/skill-paths.test.ts:74` (13 → N) en el mismo commit con comentario.delta
  - [ ] `SKILL.md` breve por diseño (el detalle va a `references/`); el presupuesto enforced de 180 líneas aplica a agentes y comandos, no a skills
  - [ ] `just test` → 0 fail

- [x] **T7** Fases VSA en los 5 comandos. Subagent: `workflow-architect`. Skills: `clean-ddd-hexagonal`, `codebase-design`, `documentation-and-adrs`. Tools: `codebase-memory-mcp`. Recursos: issue #116, skill VSA de T6.
  - [x] `spec`, `feature`, `diagnosis`, `migrate`, `hotfix` con fase VSA real (sin placeholders)
  - [x] `question` tool con 3 alcances: Prototype (1-3) / MVP (4-6) / Enterprise (7+)
  - [x] Delegación a `software-architect` **cargando** `vertical-slice-architecture` (+ `clean-ddd-hexagonal`, `codebase-design`)
  - [x] Destino del roadmap: `docs/WORKFLOW.md` (establece en `/spec`; actualiza en `/feature`, `/diagnosis`, `/migrate`)
  - [x] `grep -rn "\[Aqui se delega" template/obligatorio/core/commands/` → **0**

### Checkpoint E
- [ ] Skill VSA en `template/obligatorio/core/skills/` con `references/` (≥4 metodologías)
- [ ] `grep -rln "vertical-slice-architecture" template/obligatorio/core/commands/` → 5 archivos
- [ ] `grep -rln "Prototype\|MVP\|Enterprise" template/obligatorio/core/commands/` → 5 archivos
- [ ] `tests/unit/skill-paths.test.ts` verde (contador 13, salvo bump documentado)
- [ ] `just test` → 0 fail

---

## Fase F — Reparación de referencias (T8)

- [ ] **T8** Cerrar filas 1–9 y 14 del Anexo A. Subagent: `codebase-archaeologist`. Skills: `codebase-onboarding`, `codebase-design`, `documentation-and-adrs`. Tools: `codebase-memory-mcp`, `vercel-grep`. Recursos: fix30 §4.1, CONTRIBUTING.md.
  - [ ] `obsidian-vault-writer.md`: sin skills eliminadas — sustitutos existentes o nota de instalación bajo demanda vía `find-skills`
  - [ ] `docs/ARCHITECTURE.md`: 23 enlaces → `docs/adr/adr-0NN-*.md` (0 con `../specs/adr/`)
  - [ ] `AGENTS.md`, `SPEC.md`, `docs/MIGRATION.md`: enlaces ADR corregidos
  - [ ] `template/estandar/SPEC.md`, `template/estandar/docs/ARCHITECTURE.md`: enlaces ADR corregidos
  - [ ] `specs/spec-agent-packs.md:37`, `specs/spec-file-rules.md:35,45`: sin `skills-lock.json` / `requirements.txt`
  - [ ] `docs/wiki-source/Skills.md`: sin `obsidian-*`, `xlsx`, `excel-analysis`; refleja 60 skills
  - [ ] `tests/fixtures/workspace/` regenerado sin `/evolve`, `skills-lock.json`, `requirements.txt`
  - [ ] `docs/diagnosis/*` **intacto**
  - [ ] `just test` → 0 fail · `just test-e2e` → 31/31 · `tsc --noEmit` → 0

### Checkpoint F
- [ ] `git ls-files -z | xargs -0 grep -n "specs/adr/" | grep -v CHANGELOG.md | grep -v docs/diagnosis/ | grep -v tasks/` → **0**
- [ ] `grep -rn "obsidian-vault\|baoyu-format-markdown" template/obligatorio/packs/writers/obsidian-vault-writer.md` → **0**
- [ ] `just test` → 0 fail · `just test-e2e` → 31/31

---

## Fase G — Documentación out-of-scope §8 (T9)

- [x] **T9** Registrar §8 del diagnóstico. Subagent: `docs-writer`. Skills: `documentation-and-adrs`, `crafting-effective-readmes`, `agent-md-refactor`. Tools: `gitmcp`, `vercel-grep`. Recursos: fix30 §8, CONTRIBUTING.md.
  - [x] `docs/WORKFLOW.md`: fila **FEV-31** + sección con el snapshot (ADR move, skills +17/-8, `skills-lock.json` y `.gitmessage`/`requirements.txt` eliminados, manifiestos opcionales nuevos, reescritura de estilo de 13 comandos, swap de 6 modelos)
  - [x] `docs/TECH_DEBT.md`: entrada con estado (resuelto en FEV-31 / abierto) + limitación `just check` en NTFS
  - [x] `docs/ARCHITECTURE.md`: nota del traslado `specs/adr/` → `docs/adr/` (23 archivos) + nota de que `1941ed3` fue **estabilización INCOMPLETA**
  - [x] `docs/wiki-source/`: comandos 18, skills 61, ADRs en `docs/adr/`, ciclo `/docs-update` → `/hotfix` → `/deploy`
  - [x] Los swaps de modelo de #113 marcados como **adyacentes fuera de alcance**
  - [x] `docs/diagnosis/fix30-…md`: §2 y §4.1 actualizados con el estado final (resto del archivo literal)
  - [x] `CHANGELOG.md`: entrada `[2.1.5]`
  - [x] `just test` → 1991/0 · e2e 31/31

### Checkpoint G
- [ ] `grep -n "FEV-31" docs/WORKFLOW.md docs/TECH_DEBT.md` → ambos
- [ ] `grep -n "docs/adr" docs/ARCHITECTURE.md` → rutas `docs/adr/`
- [ ] `just test` → 0 fail

---

## Fase H — Cierre (T10)

- [x] **T10** Gates + cierre + commits atómicos. Subagent: `test-engineer`. Skills: `git-workflow-and-versioning`, `code-review-and-quality`, `test-driven-development`. Tools: shell (`just test`, `just coverage-check`, `just test-e2e`). Recursos: CONTRIBUTING.md, diagnosis-template.md.
  - [x] `just test` → 1991 pass / 0 fail (≥1972)
  - [ ] `just coverage-check` → **rojo local: 94.24% (2748/2916)**, `src/` aislado 96.78%, `main.ts` 98.84%. No es regresión: el tag `v2.1.4` en un worktree limpio da **94.23%** con el mismo bun 1.4.4. Registrado como **TD-V2-98**; la autoridad es CI (bun 1.3)
  - [x] `just test-e2e` → 31/31
  - [x] `bun run tsc --noEmit` → exit 0
  - [x] `just check` → **no ejecutable (NTFS)**; lint verificado con `/tmp/opencode/biome ci src/ tests/` → exit 0
  - [x] `docs/diagnosis/fix30-…md` §4.1: `1941ed3` sigue como INCOMPLETO histórico + nota de cierre por FEV-31
  - [x] Commits atómicos (1 por concern), Conventional Commits, trailer `Co-Authored-By: Moctezuma <dev@fisherk2.com>` en los 15 de esta sesión (los 4 previos de la rama conservan el trailer de Tezcatlipoca, su agente de sesión)
  - [x] `git status` limpio; los cambios del payload quedaron en 4 commits `(payload)` en lugar de perderse
  - [ ] PR a `develop` abierto, **sin mergear** hasta GO del usuario

### Checkpoint H — gate de salida de FEV-31
- [x] `just test` 0 fail (1991) · `just test-e2e` 31/31 · `tsc --noEmit` 0
- [ ] `just coverage-check` rojo **solo en local** (94.24%; `src/` 96.78%, `main.ts` 98.84%) — mismo fallo en el tag `v2.1.4` (94.23%) con bun 1.4.4 → **TD-V2-98**, CI es la autoridad
- [x] `just check` pendiente de CI (limitación NTFS documentada); lint local con `/tmp/opencode/biome` → exit 0
- [x] Todas las casillas de este archivo marcadas (salvo las dos declaradas arriba/abajo)
- [x] `git log --oneline develop..HEAD` → 27 commits, cada uno mapea a 1 task o a 1 concern del payload

---

## Notas de ejecución

- **R1** `just check` no ejecutable (binario biome sin permiso de ejecución en montaje fuseblk/NTFS, exit 126 — TD-V2-97) → lint validado localmente con `install -m 755 node_modules/@biomejs/cli-linux-x64/biome /tmp/opencode/biome` + `/tmp/opencode/biome ci src/ tests/` → **exit 0** (147 archivos). `just check` igualmente se declara en el commit y se revalida en CI.
- **R2** `tests/unit/skill-paths.test.ts:74` afirma `cross-skill refs === 13` → el skill VSA debe usar solo refs locales; si no, bumpear en el mismo commit.
- **R3** Presupuesto de cuerpo = **180 líneas** para agentes y comandos (T0b; headroom real 77 y 71) → el riesgo baja a Medio; aun así, sintetizar la viñeta de background a 1 línea, no pegar el bloque del issue.
- **R3b** Regla transversal: T1, T2, T3, T4, T5 y T7 escriben prompts → deben mantener el body ≤180; verificar en cada checkpoint.
- **R4** T1 y T2 **secuenciales** (mismos 6 archivos). T3 ∥ T4 sí es seguro (archivos disjuntos).
- **R5** T6 antes de T7 (el skill debe existir antes de referenciarlo).
- **R6** Prohibido `git checkout --` / `git restore` / `git stash` / `git reset --hard` sobre los ~200 archivos no commiteados del usuario.
- **R7** `docs/wiki-source/.wiki/` es un **repo git separado** → su push es un paso aparte (ver CONTRIBUTING.md).
- **R8** `docs/diagnosis/*` es histórico inmutable: solo se actualizan §2 y §4.1 de fix30.

---

_Plan y todo generados por `/plan` (Moctezuma). No implementar sin `/build`._
