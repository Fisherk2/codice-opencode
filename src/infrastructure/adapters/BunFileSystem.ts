import type { IFileSystem } from "../../application/ports/IFileSystem";

/**
 * Bun-native filesystem adapter with atomic staging support.
 * Uses Bun.file() and Bun.write() APIs for optimal performance.
 */
export class BunFileSystem implements IFileSystem {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	readTemplateFile(_relativePath: string): Promise<string> {
		throw new Error("Not implemented");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	destinationExists(_relativePath: string): Promise<boolean> {
		throw new Error("Not implemented");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getStagingPath(_relativePath: string): string {
		throw new Error("Not implemented");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	writeVersionFile(_versionData: string): Promise<void> {
		throw new Error("Not implemented");
	}

	readVersionFile(): Promise<string | null> {
		throw new Error("Not implemented");
	}
}
