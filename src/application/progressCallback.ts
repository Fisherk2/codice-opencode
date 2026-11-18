/**
 * Progress-event wiring from the domain merge engine to the TUI.
 *
 * @module
 */

import type { ProgressCallback } from "../domain/types/ProgressEvent";
import type { IUserPrompt } from "./ports/IUserPrompt";

/**
 * Create a progress callback wired to the given TUI prompt adapter.
 *
 * Shared across all three installation modes (Clean, Project, Update)
 * to avoid duplicating the switch-on-event-type pattern.
 *
 * The callback:
 * - Sets up a progress bar once on the first stage_start event.
 * - Advances the bar per file via updateProgress.
 * - Logs structured events for commit start/complete and errors.
 * - Catches listener exceptions to ensure the progress bar is always
 *   completed, even if a downstream handler throws.
 *
 * @param userPrompt - TUI adapter implementing IUserPrompt.
 * @param label - Descriptive label for the progress bar (e.g. "Clean install...").
 * @returns A ProgressCallback suitable for FileMergeEngine.execute().
 */
export function createProgressCallback(userPrompt: IUserPrompt, label: string): ProgressCallback {
	let barStarted = false;
	// Spinner redraws are the TUI's hot path: @clack's spinner re-renders
	// per updateProgress, so redrawing on every file for large packs costs
	// more than the copies. Redraw on the first file, at least
	// REDRAW_MIN_FILES apart, at least REDRAW_MIN_MS apart, and always on
	// the final file so the bar lands exactly on total.
	const REDRAW_MIN_FILES = 10;
	const REDRAW_MIN_MS = 100;
	let lastDraw: { current: number; at: number } | null = null;
	return (event) => {
		try {
			switch (event.type) {
				case "stage_start":
					if (!barStarted) {
						userPrompt.showProgressBar(event.total, label);
						barStarted = true;
					}
					break;
				case "stage_complete": {
					const now = Date.now();
					const isLast = event.current >= event.total;
					const enoughFiles =
						lastDraw !== null && event.current - lastDraw.current >= REDRAW_MIN_FILES;
					const enoughTime = lastDraw !== null && now - lastDraw.at >= REDRAW_MIN_MS;
					if (lastDraw === null || isLast || enoughFiles || enoughTime) {
						userPrompt.updateProgress(event.current, event.filePath);
						lastDraw = { current: event.current, at: now };
					}
					break;
				}
				case "stage_skip":
					break;
				case "commit_start":
					userPrompt.logProgressEvent(`commit: Committing ${event.total} files atomically...`);
					break;
				case "commit_complete":
					// commit_complete is only emitted when total > 0 (FileMergeEngine
					// skips commit when nothing was staged), so the progress bar is
					// guaranteed to have been started by a prior stage_start.
					if (event.note) {
						userPrompt.showWarning(event.note);
					}
					userPrompt.logProgressEvent(`commit: ${event.total} files committed`);
					userPrompt.completeProgress();
					break;
				case "error":
					userPrompt.logProgressEvent(`error: ${event.filePath}: ${event.message}`);
					userPrompt.completeProgress();
					break;
			}
		} catch {
			userPrompt.completeProgress();
		}
	};
}
