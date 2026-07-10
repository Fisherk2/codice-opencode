# Wiki Source — Códice

Este directorio contiene el **source of truth** para la GitHub Wiki de Códice.

Las 9 páginas aquí se sincronizan manualmente al wiki repo después de cada release:

```bash
# Clonar el wiki repo (solo la primera vez)
git clone https://github.com/fisherk2/codice-opencode.wiki.git /tmp/wiki

# Sincronizar todas las páginas
cp docs/wiki-source/*.md /tmp/wiki/

# Si hay que eliminar páginas que ya no existen
cd /tmp/wiki && git rm --cached *.md 2>/dev/null; true
cp /ruta/a/codice-opencode/docs/wiki-source/*.md /tmp/wiki/

# Commit y push
cd /tmp/wiki
git add .
git commit -m "Sync wiki v$(node -p "require('/ruta/a/codice-opencode/package.json').version")"
git push

# Limpiar
rm -rf /tmp/wiki
```

## Reglas
- No editar directamente en el wiki repo — siempre en `docs/wiki-source/` primero.
- Todas las páginas pasan por PR/review en el repo principal antes de sincronizar.
- Después de cada release, sincronizar a la Wiki.

## Páginas
1. `Home.md` — Página principal
2. `Getting-Started.md` — Primeros pasos
3. `Workspace-Structure.md` — Estructura del workspace
4. `Configuration.md` — Configuración de opencode.json
5. **`MCP-Servers.md`** — Servidores MCP preconfigurados y activación
6. `Agents.md` — Agentes y guía para añadir nuevos
7. `Commands.md` — Comandos SDD y guía para añadir nuevos
8. `Skills.md` — Skills y guía para añadir nuevos
9. `Customization-Guide.md` — Recetas de customización
10. `Troubleshooting.md` — Solución de problemas
