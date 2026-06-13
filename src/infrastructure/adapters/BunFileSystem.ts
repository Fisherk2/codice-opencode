import type { IFileSystem } from "../../application/ports/IFileSystem";

/**
 * Bun-native filesystem adapter with atomic staging support.
 * Uses Bun.file() and Bun.write() APIs for optimal performance.
 */
export class BunFileSystem implements IFileSystem {
	readTemplateFile(_relativePath: string): Promise<string> {
		throw new Error("Not implemented");
	}

	destinationExists(_relativePath: string): Promise<boolean> {
		throw new Error("Not implemented");
	}

	getStagingPath(_relativePath: string): string {
		throw new Error("Not implemented");
	}

	stageFile(_relativePath: string): Promise<void> {
		throw new Error("Not implemented");
	}

	commitStaging(): Promise<void> {
		throw new Error("Not implemented");
	}

	cleanStaging(): Promise<void> {
		throw new Error("Not implemented");
	}

	isWritable(): Promise<boolean> {
		throw new Error("Not implemented");
	}

	isEmpty(): Promise<boolean> {
		throw new Error("Not implemented");
	}

	writeVersionFile(_versionData: string): Promise<void> {
		throw new Error("Not implemented");
	}

	readVersionFile(): Promise<string | null> {
		throw new Error("Not implemented");
	}
}
