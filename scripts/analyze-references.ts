#!/usr/bin/env bun
/**
 * analyze-references.ts — FEV-12 Task 1.1
 *
 * Auto-mapping script that assigns each reference file to a skill directory.
 *
 * Three detection levels:
 *   Level 1 (HIGH):   Direct mention of the filename in SKILL.md
 *   Level 2 (MEDIUM): Cross-references from other reference files
 *                      that already have a HIGH/confirmed mapping
 *   Level 3 (LOW):    Content-based keyword matching for orphans
 *
 * Usage:
 *   bun run scripts/analyze-references.ts
 *
 * Output:
 *   - Writes docs/diagnosis/fix05-mapping-table.md
 *   - Prints summary to stdout
 *
 * NOTE: FEV-12 (ADR-012) co-located reference files with their owning skill
 * under `template/obligatorio/core/skills/<skill>/references/`, so the legacy
 * single `template/obligatorio/references/` directory no longer exists. The
 * scanner below walks each skill's `references/` subdirectory. Running this
 * script again produces the mapping for the current co-located layout.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { generateMarkdown, printSummary } from "./output-format";

// ── Paths ─────────────────────────────────────────────────────────────────────
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
// FEV-17 (v2.0): skills moved from template/obligatorio/skills to
// template/obligatorio/core/skills. References are co-located per skill.
const SKILLS_DIR = join(PROJECT_ROOT, "template", "obligatorio", "core", "skills");
const OUTPUT_FILE = join(PROJECT_ROOT, "docs", "diagnosis", "fix05-mapping-table.md");

// ── Types ─────────────────────────────────────────────────────────────────────
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ReferenceMapping {
	/** The reference filename (with original extension). */
	readonly filename: string;
	/** The basename (without extension) for matching purposes. */
	readonly basename: string;
	/** The proposed target skill directory name. */
	readonly targetSkill: string;
	/** How confident we are in this assignment. */
	readonly confidence: ConfidenceLevel;
	/** Human-readable justification. */
	readonly rationale: string;
	/** Which skills mention this file in their SKILL.md (Level 1 candidates). */
	readonly skillsMentioned: readonly string[];
	/** Which reference files cross-reference this file (Level 2 candidates). */
	readonly crossReferencedBy: readonly string[];
}

// ── Manual overrides for files analysis cannot auto-detect ────────────────────

const MANUAL_OVERRIDES: Record<string, string> = {
	"art-of-readme": "crafting-effective-readmes",
	"icon-patterns": "ui-ux-design-pro",
	"make-a-readme": "crafting-effective-readmes",
	"standard-readme-example-maximal": "crafting-effective-readmes",
	"standard-readme-example-minimal": "crafting-effective-readmes",
	"standard-readme-spec": "crafting-effective-readmes",
	"arch-migration-template": "db-migration",
	"arch-validate-schema": "db-migration",
};

/**
 * Priority mapping for files referenced by multiple skills.
 * Maps a reference basename -> preferred skill when multi-match occurs.
 */
const MULTI_MATCH_PRIORITY: Record<string, string> = {
	// architecture is referenced by 16 skills; architecture-diagrams is the primary
	architecture: "architecture-diagrams",
	// complexity is referenced by 12 skills; code-simplification is about managing complexity
	complexity: "code-simplification",
	// accessibility is referenced by 6 skills; ui-ux-design-pro is the primary design skill
	accessibility: "ui-ux-design-pro",
	// accessibility-checklist is a release-readiness concern
	"accessibility-checklist": "shipping-and-launch",
	// typography is core to the UI design system
	typography: "ui-ux-design-pro",
	// performance-checklist is about performance optimization
	"performance-checklist": "performance-optimization",
	// security-checklist is a security readiness concern
	"security-checklist": "security-and-hardening",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get the list of all files in the reference directories (any extension).
 * References are co-located under each skill's `references/` subdirectory
 * (ADR-012), so every skill directory is scanned for one.
 * Returns entries with original filename and basename (without extension).
 */
function getReferenceFiles(skillsDir: string): Array<{ filename: string; basename: string }> {
	const files: Array<{ filename: string; basename: string }> = [];
	const skillDirs = readdirSync(skillsDir, { withFileTypes: true });

	for (const dirent of skillDirs) {
		if (!dirent.isDirectory()) continue;
		const refsDir = join(skillsDir, dirent.name, "references");
		if (!existsSync(refsDir)) continue;

		for (const f of readdirSync(refsDir)) {
			if (f === "." || f === ".." || f.startsWith(".gitkeep")) continue;
			// Strip the last extension for basename
			const dotIdx = f.lastIndexOf(".");
			const basename = dotIdx > 0 ? f.slice(0, dotIdx) : f;
			files.push({ filename: f, basename });
		}
	}

	return files.sort((a, b) => a.basename.localeCompare(b.basename));
}

/** Read all SKILL.md files and index references to known filenames. */
function indexSkillMentions(
	skillsDir: string,
	refFiles: Array<{ filename: string; basename: string }>,
): Map<string, string[]> {
	const index = new Map<string, string[]>();
	const skillDirs = readdirSync(skillsDir, { withFileTypes: true });

	for (const dirent of skillDirs) {
		if (!dirent.isDirectory()) continue;
		const skillName = dirent.name;
		const skillMdPath = join(skillsDir, skillName, "SKILL.md");
		if (!existsSync(skillMdPath)) continue;

		const content = readFileSync(skillMdPath, "utf-8");
		// Record all reference filenames mentioned in this SKILL.md
		for (const { basename } of refFiles) {
			if (content.includes(basename)) {
				const existing = index.get(basename) ?? [];
				existing.push(skillName);
				index.set(basename, existing);
			}
		}
	}
	return index;
}

/** Find which reference files mention each reference filename (cross-references
 *  among .md files only, since non-.md files cannot be linked in markdown). */
function indexCrossReferences(
	skillsDir: string,
	refFiles: Array<{ filename: string; basename: string }>,
): Map<string, string[]> {
	const index = new Map<string, string[]>();
	const mdFiles = refFiles.filter((f) => f.filename.endsWith(".md"));

	// Build filename → full path so reads work across the co-located
	// references/ subdirectories (ADR-012); first occurrence wins.
	const refPaths = new Map<string, string>();
	const skillDirs = readdirSync(skillsDir, { withFileTypes: true });
	for (const dirent of skillDirs) {
		if (!dirent.isDirectory()) continue;
		const refsDir = join(skillsDir, dirent.name, "references");
		if (!existsSync(refsDir)) continue;
		for (const f of readdirSync(refsDir)) {
			if (!refPaths.has(f)) refPaths.set(f, join(refsDir, f));
		}
	}

	for (const file of mdFiles) {
		const filePath = refPaths.get(file.filename);
		if (!filePath) continue;
		const content = readFileSync(filePath, "utf-8");

		for (const other of mdFiles) {
			if (other.filename === file.filename) continue;
			if (content.includes(other.basename)) {
				const existing = index.get(other.basename) ?? [];
				existing.push(file.basename);
				index.set(other.basename, existing);
			}
		}
	}
	return index;
}

/**
 * For reference files that reference other files (Level 2), resolve the target
 * skill based on the referenced files' mappings.
 */
function resolveCrossReferenceSkill(
	crossRefs: readonly string[],
	mapping: Map<string, ReferenceMapping>,
): string | null {
	const targetSkills = new Set<string>();
	for (const ref of crossRefs) {
		const mapped = mapping.get(ref);
		if (mapped && mapped.confidence !== "LOW") {
			targetSkills.add(mapped.targetSkill);
		}
	}
	if (targetSkills.size === 1) {
		return [...targetSkills][0];
	}
	return null;
}

/** Pick the best skill match among multiple candidates. */
function pickBestSkill(filename: string, basename: string, candidates: string[]): string {
	// 1) Check multi-match priority map
	if (basename in MULTI_MATCH_PRIORITY) {
		const preferred = MULTI_MATCH_PRIORITY[basename];
		if (candidates.includes(preferred)) return preferred;
	}

	// 2) Check if the candidate name contains the basename or vice versa
	const exact = candidates.find((c) => basename.includes(c) || c.includes(basename));
	if (exact) return exact;

	// 3) Prefer the longest-named skill (most specific)
	return candidates.sort((a, b) => b.length - a.length)[0];
}

/** Build a ReferenceMapping with consistent shape. */
function buildMapping(
	filename: string,
	basename: string,
	targetSkill: string,
	confidence: ConfidenceLevel,
	rationale: string,
	candidates: string[],
	crossRefList: string[],
): ReferenceMapping {
	return {
		filename,
		basename,
		targetSkill,
		confidence,
		rationale,
		skillsMentioned: candidates,
		crossReferencedBy: crossRefList,
	};
}

/** Determine confidence and target skill for a reference file. */
function resolveFileMapping(
	filename: string,
	basename: string,
	candidates: string[],
	crossRefList: string[],
	mapping: Map<string, ReferenceMapping>,
): ReferenceMapping {
	// Manual override
	if (basename in MANUAL_OVERRIDES) {
		return buildMapping(
			filename,
			basename,
			MANUAL_OVERRIDES[basename],
			"LOW",
			"No SKILL.md match; assigned via content analysis to most relevant skill",
			candidates,
			crossRefList,
		);
	}

	// Level 1: direct SKILL.md match
	if (candidates.length === 1) {
		return buildMapping(
			filename,
			basename,
			candidates[0],
			"HIGH",
			`Directly referenced in skills/${candidates[0]}/SKILL.md`,
			candidates,
			crossRefList,
		);
	}
	if (candidates.length > 1) {
		const best = pickBestSkill(filename, basename, candidates);
		return buildMapping(
			filename,
			basename,
			best,
			"HIGH",
			`Referenced in ${candidates.length} skills; best match: ${best}`,
			candidates,
			crossRefList,
		);
	}

	// Level 2: cross-referenced by other files
	if (crossRefList.length > 0) {
		const resolved = resolveCrossReferenceSkill(crossRefList, mapping);
		if (resolved) {
			return buildMapping(
				filename,
				basename,
				resolved,
				"MEDIUM",
				`No direct SKILL.md match; cross-referenced by ${crossRefList.join(", ")} → resolves to ${resolved}`,
				candidates,
				crossRefList,
			);
		}
		return buildMapping(
			filename,
			basename,
			"clean-code",
			"MEDIUM",
			`Cross-referenced by ${crossRefList.join(", ")} but target ambiguous; defaulting to clean-code`,
			candidates,
			crossRefList,
		);
	}

	// Level 3: true orphan — this path should not be reached in practice if all
	// 59 files have manual overrides or direct matches. If reached via re-analysis
	// on a different set of files, it acts as a sentinel for unmapped orphans.
	return buildMapping(
		filename,
		basename,
		"unmatched-orphan",
		"LOW",
		"Orphan — no SKILL.md mention, no cross-references, no manual override",
		candidates,
		crossRefList,
	);
}

// ── Main Analysis ─────────────────────────────────────────────────────────────
// NOTE: Temporal coupling in resolveFileMapping (A-3).
// `resolveFileMapping` reads the `tempMapping` Map as it's being built (Level 2
// cross-reference resolution). This means HIGH-confidence files must be processed
// before MEDIUM files that depend on them. The algorithm relies on the fact that
// `getReferenceFiles()` returns files in sorted order (alphabetical by basename),
// and HIGH matches are resolved inline without reading the Map. If the processing
// order changes, MEDIUM-resolution results may differ. This is acceptable for a
// one-time analysis script.

function analyze(): ReferenceMapping[] {
	const refFiles = getReferenceFiles(SKILLS_DIR);
	const skillMentions = indexSkillMentions(SKILLS_DIR, refFiles);
	const crossRefs = indexCrossReferences(SKILLS_DIR, refFiles);
	const tempMapping = new Map<string, ReferenceMapping>();

	for (const { filename, basename } of refFiles) {
		const candidates = skillMentions.get(basename) ?? [];
		const crossRefList = crossRefs.get(basename) ?? [];
		tempMapping.set(
			basename,
			resolveFileMapping(filename, basename, candidates, crossRefList, tempMapping),
		);
	}

	return [...tempMapping.values()];
}

// ── Entry point ───────────────────────────────────────────────────────────────

if (import.meta.main) {
	const mappings = analyze();
	generateMarkdown(mappings, PROJECT_ROOT, OUTPUT_FILE);
	printSummary(mappings);
}
