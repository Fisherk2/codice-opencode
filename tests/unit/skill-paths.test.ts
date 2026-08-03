/**
 * skill-paths.test.ts -- Cross-skill reference path validation
 *
 * Ensures that all ../<other-skill>/references/<file> references
 * found in the SKILL.md files under template/obligatorio/skills/
 * point to files that actually exist. Without this test, renaming
 * a skill would silently break cross-skill reference paths.
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../template/obligatorio/skills");

describe("cross-skill reference paths (FEV-12, A-2)", () => {
	// Find all SKILL.md files
	const skillDirs = fs
		.readdirSync(SKILLS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	test.each(skillDirs)(
		"all cross-skill reference paths in skills/%s/SKILL.md point to existing files",
		(skillDir) => {
			const skillMdPath = path.join(SKILLS_DIR, skillDir, "SKILL.md");
			if (!fs.existsSync(skillMdPath)) {
				return; // skip skills without SKILL.md
			}

			const content = fs.readFileSync(skillMdPath, "utf-8");
			// Match markdown link paths like: ../<skill>/references/<file>.md
			// Markdown [text](link) syntax may produce two matches per unique path;
			// use a Set to validate each unique path only once.
			const crossSkillPattern = /\.\.\/([a-z0-9-]+)\/references\/([a-z0-9.-]+\.md)/g;
			const matches = [...content.matchAll(crossSkillPattern)];
			const validated = new Set<string>();

			for (const match of matches) {
				const targetSkill = match[1];
				const fileName = match[2];
				if (targetSkill === undefined || fileName === undefined) {
					continue; // Should not happen with this regex, but satisfy TS
				}
				const key = `${targetSkill}/${fileName}`;
				if (validated.has(key)) continue;
				validated.add(key);

				const expectedPath = path.join(SKILLS_DIR, targetSkill, "references", fileName);

				expect(fs.existsSync(expectedPath)).toBe(true);
			}

			// No assertion on found — zero cross-skill refs is valid
		},
	);

	test("total cross-skill references count is stable", () => {
		let total = 0;
		const crossSkillPattern = /\.\.\/([a-z0-9-]+)\/references\/([a-z0-9.-]+\.md)/g;

		for (const skillDir of skillDirs) {
			const skillMdPath = path.join(SKILLS_DIR, skillDir, "SKILL.md");
			if (!fs.existsSync(skillMdPath)) continue;

			const content = fs.readFileSync(skillMdPath, "utf-8");
			const matches = content.match(crossSkillPattern);
			if (matches) total += matches.length;
		}

		// Expected: 13 cross-skill reference occurrences across the codebase
		// (solid/SKILL.md has 5 per-skill paths each appearing in [text](link)
		//  = 10 matches; clean-code/SKILL.md has 2 on one line + 1 on another = 3)
		expect(total).toBe(13);
	});
});
