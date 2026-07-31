/**
 * Unit tests for InstallUseCaseBase overridable default methods.
 *
 * The Template Method base class defines defaults for getConfirmMessage,
 * getCancelMessage, getProgressLabel, and getRetryHint. Concrete subclasses
 * (CleanInstallUseCase, ProjectInstallUseCase) may override them, but the
 * defaults must behave correctly as safety-net fallbacks.
 *
 * These defaults were previously uncovered because coverage tools require
 * each overridable method to be exercised on at least one concrete instance.
 * The MinimalInstallUseCase stub below inherits all defaults without
 * overriding them, giving us a testable concrete instance.
 */

import { describe, expect, test } from "bun:test";
import { InstallUseCaseBase } from "../../../../src/application/use-cases/InstallUseCaseBase";
import type { FileRule } from "../../../../src/domain/entities/FileRule";

// ---- Minimal concrete subclass (inherits all defaults) ----

class MinimalInstallUseCase extends InstallUseCaseBase {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal stub, not production code
	constructor() {
		// Provide empty mocks for all 6 dependencies. None of the default
		// methods under test touch these — they exist only to satisfy the
		// abstract constructor contract.
		super({} as any, {} as any, {} as any, {} as any, [], {} as any);
	}

	protected buildRules(_selectedOptionals: readonly string[]): readonly FileRule[] {
		return [];
	}

	protected async selectOptionals(_force: boolean): Promise<readonly string[]> {
		return [];
	}

	protected getSuccessMessage(): string {
		return "Minimal install complete.";
	}

	// Public test delegates — expose protected methods for coverage testing.
	// This is the idiomatic way to test Template Method defaults without
	// weakening the production base class's API surface.

	testGetConfirmMessage(path: string): string {
		return this.getConfirmMessage(path);
	}

	testGetCancelMessage(): string {
		return this.getCancelMessage();
	}

	testGetProgressLabel(): string {
		return this.getProgressLabel();
	}

	testGetRetryHint(): boolean {
		return this.getRetryHint();
	}
}

// ---- Test suite ----

describe("InstallUseCaseBase — overridable defaults", () => {
	const useCase = new MinimalInstallUseCase();

	describe("getConfirmMessage(destinationPath)", () => {
		test("returns a non-empty string that includes the destination path", () => {
			// Arrange
			const testPath = "/tmp/my-project";

			// Act
			const message = useCase.testGetConfirmMessage(testPath);

			// Assert
			expect(message.length).toBeGreaterThan(0);
			expect(message).toContain(testPath);
			expect(message).toContain("not empty");
		});

		test("includes the word 'overwritten' to warn about data loss", () => {
			// Act
			const message = useCase.testGetConfirmMessage("/some/other/path");

			// Assert
			expect(message).toMatch(/overwritten/i);
		});

		test("includes the destination path even for relative paths", () => {
			// Arrange
			const relativePath = "./my-folder";

			// Act
			const message = useCase.testGetConfirmMessage(relativePath);

			// Assert
			expect(message).toContain(relativePath);
		});
	});

	describe("getCancelMessage()", () => {
		test("returns the expected cancellation message", () => {
			// Act
			const message = useCase.testGetCancelMessage();

			// Assert
			expect(message).toBe("Installation cancelled by user.");
		});

		test("returns a string that does not reference overwriting", () => {
			// Act
			const message = useCase.testGetCancelMessage();

			// Assert — cancel and confirm messages serve different purposes
			expect(message).not.toMatch(/overwrite/i);
		});

		test("returns a deterministic string (consistent across calls)", () => {
			// Act
			const first = useCase.testGetCancelMessage();
			const second = useCase.testGetCancelMessage();

			// Assert
			expect(first).toBe(second);
		});
	});

	describe("getProgressLabel()", () => {
		test("returns a non-empty progress label", () => {
			// Act
			const label = useCase.testGetProgressLabel();

			// Assert
			expect(label.length).toBeGreaterThan(0);
		});

		test("returns the default 'Installing...' label", () => {
			// Act
			const label = useCase.testGetProgressLabel();

			// Assert
			expect(label).toBe("Installing...");
		});
	});

	describe("getRetryHint()", () => {
		test("returns false by default", () => {
			// Act
			const retry = useCase.testGetRetryHint();

			// Assert — CleanInstallUseCase overrides to true; base default is false
			expect(retry).toBe(false);
		});

		test("returns a consistent boolean value across calls", () => {
			// Act
			const first = useCase.testGetRetryHint();
			const second = useCase.testGetRetryHint();

			// Assert
			expect(first).toBe(second);
		});
	});
});
