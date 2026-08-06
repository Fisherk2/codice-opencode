// ---------------------------------------------------------------------------
// PRIMARY_AGENTS — The 6 built-in primary agents
//
// This is the ONLY hardcoded agent list in the plugin. The primary agents are
// the plugin's identity (ADR-014: Agent Pack System), so they must remain
// valid even when the user's workspace has no `agents/` directory.
//
// Subagent names are deliberately NOT listed here. Per ADR-013
// (Auto-Discovery), they are derived at runtime by discoverValidSubagents()
// in autoDiscovery.ts, which scans the user's `agents/` directory. Adding a
// subagent requires only creating `agents/<name>.md` — no plugin changes.
// ---------------------------------------------------------------------------

/**
 * The 6 primary agent names that are always valid — even when no corresponding
 * `.md` file exists in the user's `agents/` directory. This ensures the SDD
 * pipeline never rejects calls to built-in agents.
 */
export const PRIMARY_AGENTS: readonly string[] = [
	"huitzilopochtli",
	"quetzalcoatl",
	"moctezuma",
	"tlaloc",
	"mictlantecuhtli",
	"tezcatlipoca",
] as const;
