# Wiki Source — Códice

Este directorio contiene el **source of truth** para la GitHub Wiki de Códice.

El wiki repo está clonado en `docs/wiki-source/.wiki/` (ignorado por git del repo
principal — ver `.gitignore`). **No se sincroniza `README.md`** porque es
documentación interna del proceso, no una página de la Wiki.

## Sincronización

Después de cada release, sincronizar los cambios a la Wiki:

```bash
# Desde la raíz del proyecto
rsync -a --delete --exclude='README.md' docs/wiki-source/*.md docs/wiki-source/.wiki/

cd docs/wiki-source/.wiki
git add .
git commit -m "Sync wiki v$(node -p "require('../../package.json').version")"
git push
```

`--exclude='README.md'` asegura que el README no se suba a la Wiki.

## Reglas
- No editar directamente en el wiki repo — siempre en `docs/wiki-source/` primero.
- Todas las páginas pasan por PR/review en el repo principal antes de sincronizar.
- `README.md` nunca se sincroniza a la Wiki.
- Después de cada release, sincronizar a la Wiki.

## Páginas
1. `Home.md` — Página principal
2. `Getting-Started.md` — Primeros pasos
3. `Workspace-Structure.md` — Estructura del workspace
4. `Configuration.md` — Configuración de opencode.json
5. **`SDD-Pipeline.md`** — Plugin de orquestación SDD
6. **`MCP-Servers.md`** — Servidores MCP preconfigurados y activación
7. `Agents.md` — Agentes y guía para añadir nuevos
8. `Commands.md` — Comandos SDD y guía para añadir nuevos
9. `Skills.md` — Skills y guía para añadir nuevos
10. `Troubleshooting.md` — Solución de problemas
