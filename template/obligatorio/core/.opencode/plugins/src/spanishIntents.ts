// ---------------------------------------------------------------------------
// SPANISH INTENTS — Static Spanish keywords for the built-in commands
//
// Auto-discovery derives keywords from each command's English `description:`
// frontmatter, so Spanish intent detection for the built-in commands would be
// lost without a static complement. This map restores it for the six primary
// intents (spec/plan/build/test/review/ship) plus /deploy, whose Spanish verb
// ("desplegar") is unambiguous.
//
// These keywords are layered between the discovered patterns and user
// overrides in sdd-pipeline.ts — user overrides still win per command key.
// ---------------------------------------------------------------------------

/**
 * Spanish keywords layered onto the auto-discovered intent patterns.
 *
 * Keys must reference commands that exist in COMMAND_AGENT_MAP (guarded by
 * spanishIntents.test.ts). Values are stopword-exempt by construction — they
 * are not passed through deriveIntentKeywords' STOPWORDS filter.
 */
export const SPANISH_INTENT_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
	"/spec": ["especificar", "especificación"],
	"/plan": ["planificar", "planificación"],
	"/build": ["construir", "codificar", "implementar"],
	"/test": ["probar", "verificar", "testear"],
	"/review": ["revisar", "revisión", "auditar"],
	"/ship": ["lanzar", "publicar"],
	// "desplegar" is the Spanish verb for deploy — it belongs to /deploy, not
	// /ship, so a Spanish "desplegar la app" routes to the deploy command.
	"/deploy": ["desplegar", "despliegue"],
} as const;
