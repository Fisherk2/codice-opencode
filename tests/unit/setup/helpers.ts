/**
 * Shared helpers for F0 setup validation tests.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Project root for resolving paths
export const PROJECT_ROOT = resolve(import.meta.dir, "../../..");

/**
 * Typed interfaces for configuration files
 */
export interface PackageJson {
	name: string;
	version: string;
	type: string;
	scripts: Record<string, string>;
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
}

export interface BiomeJson {
	$schema: string;
	vcs: {
		enabled: boolean;
		clientKind: string;
		useIgnoreFile: boolean;
	};
	files: {
		includes: string[];
	};
	formatter: {
		enabled: boolean;
		indentStyle: string;
		lineWidth: number;
	};
	linter: {
		enabled: boolean;
		rules: {
			preset: string;
			style: Record<string, string>;
			complexity: Record<string, string>;
			correctness: Record<string, string>;
			suspicious: Record<string, string>;
		};
	};
	javascript: {
		formatter: {
			quoteStyle: string;
			lineWidth: number;
			trailingCommas: string;
			semicolons: string;
			arrowParentheses: string;
		};
	};
	json: {
		formatter: {
			indentStyle: string;
			indentWidth: number;
			lineWidth: number;
		};
	};
	assist: {
		enabled: boolean;
		actions: {
			source: {
				organizeImports: string;
			};
		};
	};
}

/**
 * Helper: Read and parse JSON file with typed result
 */
export function readJsonFile<T>(relativePath: string): T {
	const fullPath = join(PROJECT_ROOT, relativePath);
	const content = readFileSync(fullPath, "utf-8");
	try {
		return JSON.parse(content) as T;
	} catch (e) {
		throw new Error(
			`Failed to parse ${relativePath}: ${e instanceof Error ? e.message : String(e)}`,
		);
	}
}

/**
 * Helper: Read text file as string
 */
export function readTextFile(relativePath: string): string {
	const fullPath = join(PROJECT_ROOT, relativePath);
	return readFileSync(fullPath, "utf-8");
}

/**
 * Helper: Check if file exists
 */
export function fileExists(relativePath: string): boolean {
	const fullPath = join(PROJECT_ROOT, relativePath);
	return existsSync(fullPath);
}
