#!/usr/bin/env bun
/**
 * analyze-references.ts — FEV-12 Task 1.1
 *
 * Auto-mapping script that assigns each of the 59 reference files
 * in template/obligatorio/references/ to a skill directory.
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
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// ── Paths ─────────────────────────────────────────────────────────────────────
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const SKILLS_DIR = join(PROJECT_ROOT, "template", "obligatorio", "skills");
const REFERENCES_DIR = join(PROJECT_ROOT, "template", "obligatorio", "references");
const OUTPUT_FILE = join(PROJECT_ROOT, "docs", "diagnosis", "fix05-mapping-table.md");

// ── Types ─────────────────────────────────────────────────────────────────────
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

interface ReferenceMapping {
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
 * Get the list of all files in the references directory (any extension).
 * Returns entries with original filename and basename (without extension).
 */
function getReferenceFiles(refsDir: string): Array<{ filename: string; basename: string }> {
	return readdirSync(refsDir)
		.filter((f) => f !== "." && f !== ".." && !f.startsWith(".gitkeep"))
		.map((f) => {
			// Strip the last extension for basename
			const dotIdx = f.lastIndexOf(".");
			const basename = dotIdx > 0 ? f.slice(0, dotIdx) : f;
			return { filename: f, basename };
		})
		.sort((a, b) => a.basename.localeCompare(b.basename));
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
	refsDir: string,
	refFiles: Array<{ filename: string; basename: string }>,
): Map<string, string[]> {
	const index = new Map<string, string[]>();
	const mdFiles = refFiles.filter((f) => f.filename.endsWith(".md"));

	for (const file of mdFiles) {
		const content = readFileSync(join(refsDir, file.filename), "utf-8");

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

// ── Main Analysis ─────────────────────────────────────────────────────────────

function analyze(): ReferenceMapping[] {
	const refFiles = getReferenceFiles(REFERENCES_DIR);
	const skillMentions = indexSkillMentions(SKILLS_DIR, refFiles);
	const crossRefs = indexCrossReferences(REFERENCES_DIR, refFiles);

	// Phase 1: Level 1 (HIGH) and Level 3 (LOW/orphans)
	const tempMapping = new Map<string, ReferenceMapping>();

	for (const { filename, basename } of refFiles) {
		const candidates = skillMentions.get(basename) ?? [];
		const crossRefList = crossRefs.get(basename) ?? [];

		// Manual override check
		if (basename in MANUAL_OVERRIDES) {
			const targetSkill = MANUAL_OVERRIDES[basename];
			tempMapping.set(basename, {
				filename,
				basename,
				targetSkill,
				confidence: "LOW",
				rationale: "No SKILL.md match; assigned via content analysis to most relevant skill",
				skillsMentioned: candidates,
				crossReferencedBy: crossRefList,
			});
			continue;
		}

		if (candidates.length >= 1) {
			// 1a) Single match — HIGH confidence
			if (candidates.length === 1) {
				tempMapping.set(basename, {
					filename,
					basename,
					targetSkill: candidates[0],
					confidence: "HIGH",
					rationale: `Directly referenced in skills/${candidates[0]}/SKILL.md`,
					skillsMentioned: candidates,
					crossReferencedBy: crossRefList,
				});
			} else {
				// 1b) Multi-match — pick the most relevant one
				const bestMatch = pickBestSkill(filename, basename, candidates);
				tempMapping.set(basename, {
					filename,
					basename,
					targetSkill: bestMatch,
					confidence: "HIGH",
					rationale: `Referenced in ${candidates.length} skills; best match: ${bestMatch}`,
					skillsMentioned: candidates,
					crossReferencedBy: crossRefList,
				});
			}
		} else if (crossRefList.length > 0) {
			// Level 2: no direct SKILL match but cross-referenced by other files
			const resolved = resolveCrossReferenceSkill(crossRefList, tempMapping);
			if (resolved) {
				tempMapping.set(basename, {
					filename,
					basename,
					targetSkill: resolved,
					confidence: "MEDIUM",
					rationale: `No direct SKILL.md match; cross-referenced by ${crossRefList.join(", ")} → resolves to ${resolved}`,
					skillsMentioned: candidates,
					crossReferencedBy: crossRefList,
				});
			} else {
				// Cross-referenced but multiple possible targets
				tempMapping.set(basename, {
					filename,
					basename,
					targetSkill: "clean-code",
					confidence: "MEDIUM",
					rationale: `Cross-referenced by ${crossRefList.join(", ")} but target ambiguous; defaulting to clean-code`,
					skillsMentioned: candidates,
					crossReferencedBy: crossRefList,
				});
			}
		} else {
			// True orphan — shouldn't happen since we catch MANUAL_OVERRIDES above
			tempMapping.set(basename, {
				filename,
				basename,
				targetSkill: "general",
				confidence: "LOW",
				rationale: "Orphan — no SKILL.md mention, no cross-references, no manual override",
				skillsMentioned: candidates,
				crossReferencedBy: crossRefList,
			});
		}
	}

	return [...tempMapping.values()];
}

// ── Output ────────────────────────────────────────────────────────────────────

function generateMarkdown(mappings: ReferenceMapping[]): string {
	const lines: string[] = [];
	lines.push("# FEV-12 — References-to-Skills Mapping Table");
	lines.push("");
	lines.push("**Generated by:** `scripts/analyze-references.ts`");
	lines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
	lines.push(`**Total files:** ${mappings.length} (57 .md + 2 non-.md)`);
	lines.push("");
	lines.push("## Confidence Level Distribution");
	lines.push("");
	const high = mappings.filter((m) => m.confidence === "HIGH").length;
	const med = mappings.filter((m) => m.confidence === "MEDIUM").length;
	const low = mappings.filter((m) => m.confidence === "LOW").length;
	lines.push("| Confidence | Count |");
	lines.push("|------------|-------|");
	lines.push(`| HIGH       | ${high} |`);
	lines.push(`| MEDIUM     | ${med} |`);
	lines.push(`| LOW        | ${low} |`);
	lines.push(`| **Total**  | **${mappings.length}** |`);
	lines.push("");

	// Summary by skill
	const skillCounts = new Map<string, number>();
	for (const m of mappings) {
		skillCounts.set(m.targetSkill, (skillCounts.get(m.targetSkill) ?? 0) + 1);
	}
	lines.push("## Distribution by Skill");
	lines.push("");
	lines.push("| Skill | References |");
	lines.push("|-------|------------|");
	for (const [skill, count] of [...skillCounts.entries()].sort()) {
		lines.push(`| ${skill} | ${count} |`);
	}
	lines.push("");

	// Full mapping table
	lines.push("## Full Mapping");
	lines.push("");
	lines.push("| # | File | Target Skill | Confidence | Rationale |");
	lines.push("|---|------|--------------|------------|-----------|");
	let idx = 1;
	for (const m of mappings) {
		const confBadge =
			m.confidence === "HIGH"
				? "🟢 HIGH"
				: m.confidence === "MEDIUM"
					? "🟡 MEDIUM"
					: "🔴 LOW";
		lines.push(
			`| ${idx++} | \`${m.filename}\` | \`${m.targetSkill}\` | ${confBadge} | ${m.rationale} |`,
		);
	}
	lines.push("");

	// Files needing manual review
	const lowFiles = mappings.filter((m) => m.confidence === "LOW");
	if (lowFiles.length > 0) {
		lines.push("## ⚠️ Files Requiring Manual Review (LOW confidence)");
		lines.push("");
		lines.push("These files had no direct SKILL.md mentions. They were assigned based on");
		lines.push("content/keyword analysis. Review the assignments below:");
		lines.push("");
		for (const m of lowFiles) {
			lines.push(`- **\`${m.filename}\`** → \`${m.targetSkill}\` — ${m.rationale}`);
		}
		lines.push("");
	}

	return lines.join("\n");
}

function printSummary(mappings: ReferenceMapping[]): void {
	const high = mappings.filter((m) => m.confidence === "HIGH").length;
	const med = mappings.filter((m) => m.confidence === "MEDIUM").length;
	const low = mappings.filter((m) => m.confidence === "LOW").length;
	const uniqueSkills = new Set(mappings.map((m) => m.targetSkill)).size;

	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("  FEV-12 Reference Analysis Summary");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`  Total files analyzed:  ${mappings.length}`);
	console.log(`  Unique skills target:  ${uniqueSkills}`);
	console.log(`  HIGH confidence:       ${high}  (direct SKILL.md mention)`);
	console.log(`  MEDIUM confidence:     ${med}  (cross-reference resolution)`);
	console.log(`  LOW confidence:        ${low}  (content-based / manual override)`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	for (const m of mappings) {
		const icon =
			m.confidence === "HIGH" ? "✓" : m.confidence === "MEDIUM" ? "~" : "?";
		console.log(`  ${icon} ${m.filename.padEnd(42)} → ${m.targetSkill}`);
	}
}

// ── Entry point ───────────────────────────────────────────────────────────────

if (import.meta.main) {
	const mappings = analyze();
	const markdown = generateMarkdown(mappings);

	writeFileSync(OUTPUT_FILE, markdown, "utf-8");
	printSummary(mappings);
	console.log(`\n  Output written to: ${relative(PROJECT_ROOT, OUTPUT_FILE)}`);
}
