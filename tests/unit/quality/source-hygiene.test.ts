/**
 * Source hygiene — no raw control bytes in the owned text surfaces.
 *
 * A raw NUL (0x00) inside a text file makes grep/ripgrep report the file as
 * binary and makes diff/read tooling skip or garble it: the file turns into a
 * blind spot for exactly the audits meant to catch regressions. The rest of the
 * C0 range (minus tab/newline/carriage-return) and DEL matter for the same
 * reason — in practice they only appear when a multi-byte character (an emoji,
 * typically) was mangled by an encoding round-trip.
 *
 * When this fails it names file, line, byte and offset so the offender is
 * unambiguous. Escape sequences (`\u0000` written as six ASCII characters) are
 * the correct form; the raw byte is not.
 *
 * Only tracked source surfaces are scanned: `agents/`, `commands/`, `skills/`,
 * `references/` and `.opencode/` are gitignored install artifacts, so including
 * them would make this test pass in CI and fail locally (non-hermetic). The
 * installed copies are reproduced from `template/`, which *is* scanned.
 */

import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");

/** Tracked source surfaces — must stay free of raw control bytes. */
const SCAN_ROOTS: readonly string[] = ["src", "tests", "scripts", "template/obligatorio/packs"];

const TEXT_EXTENSIONS: readonly string[] = [
	".ts",
	".tsx",
	".js",
	".mjs",
	".json",
	".sh",
	".md",
	".toml",
	".yml",
	".yaml",
];

/** Vendored, generated or fixture trees that are not ours to police. */
const EXCLUDED_FRAGMENTS: readonly string[] = [
	"node_modules",
	".git",
	"coverage",
	"fixtures/workspace",
];

interface Offense {
	readonly file: string;
	readonly line: number;
	readonly offset: number;
	readonly byte: string;
}

function isExcluded(relPath: string): boolean {
	const posix = relPath.split(sep).join("/");
	return EXCLUDED_FRAGMENTS.some((fragment) => posix.includes(fragment));
}

function isTextFile(relPath: string): boolean {
	return TEXT_EXTENSIONS.some((extension) => relPath.endsWith(extension));
}

function collectTextFiles(absDir: string): string[] {
	if (!existsSync(absDir)) return [];
	const found: string[] = [];
	for (const entry of readdirSync(absDir, { withFileTypes: true })) {
		const abs = join(absDir, entry.name);
		const rel = relative(REPO_ROOT, abs);
		if (isExcluded(rel)) continue;
		// Symlinks are skipped deliberately: `isDirectory()` is false for them, and
		// following one could escape or duplicate the scanned surface.
		if (entry.isDirectory()) {
			found.push(...collectTextFiles(abs));
		} else if (entry.isFile() && isTextFile(rel)) {
			found.push(abs);
		}
	}
	return found;
}

/** C0 controls minus \t \n \r, plus DEL. */
export function isForbiddenControlByte(byte: number): boolean {
	return (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte === 127;
}

function scanForControlBytes(absPath: string): Offense[] {
	const bytes = readFileSync(absPath);
	const offenses: Offense[] = [];
	for (let index = 0; index < bytes.length; index += 1) {
		const byte = bytes[index];
		if (byte === undefined || !isForbiddenControlByte(byte)) continue;
		let line = 1;
		for (let cursor = 0; cursor < index; cursor += 1) {
			if (bytes[cursor] === 10) line += 1;
		}
		offenses.push({
			file: relative(REPO_ROOT, absPath),
			line,
			offset: index,
			byte: `0x${byte.toString(16).padStart(2, "0")}`,
		});
	}
	return offenses;
}

describe("Source hygiene", () => {
	const files = SCAN_ROOTS.flatMap((root) => collectTextFiles(join(REPO_ROOT, root)));

	it("scans the owned text surfaces", () => {
		expect(files.length).toBeGreaterThan(300);
	});

	it("has no raw control bytes in the scanned text files", () => {
		const report = files
			.flatMap(scanForControlBytes)
			.map(
				(offense) =>
					`${offense.file}:${offense.line} byte ${offense.byte} at offset ${offense.offset}`,
			);
		expect(report).toEqual([]);
	});
});

describe("isForbiddenControlByte truth table", () => {
	it("forbids exactly the C0 range minus TAB/LF/CR, plus DEL", () => {
		const forbidden = Array.from({ length: 256 }, (_, byte) => byte).filter(isForbiddenControlByte);
		expect(forbidden).toEqual([
			...Array.from({ length: 9 }, (_, i) => i), // 0x00-0x08
			11, // VT
			12, // FF
			...Array.from({ length: 17 }, (_, i) => 14 + i), // 0x0E-0x1E
			31, // 0x1F
			127, // DEL
		]);
	});

	it("allows TAB, LF, CR and printable ASCII", () => {
		for (const byte of [9, 10, 13, 32, 65, 126]) {
			expect(isForbiddenControlByte(byte)).toBe(false);
		}
	});
});
