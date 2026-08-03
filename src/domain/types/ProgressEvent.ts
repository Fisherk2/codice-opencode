/**
 * Discriminated union representing a single progress event during file merge.
 * Domain layer type — no TUI dependency.
 */
export type ProgressEvent =
	| {
			readonly type: "stage_start";
			readonly current: number;
			readonly total: number;
			readonly filePath: string;
	  }
	| { readonly type: "stage_skip"; readonly filePath: string; readonly reason: string }
	| {
			readonly type: "stage_complete";
			readonly current: number;
			readonly total: number;
			readonly filePath: string;
	  }
	| { readonly type: "commit_start"; readonly total: number }
	| { readonly type: "commit_complete"; readonly total: number }
	| { readonly type: "error"; readonly filePath: string; readonly message: string };

/**
 * Callback invoked by FileMergeEngine to report progress.
 * The callback receives a discriminated ProgressEvent describing
 * the current operation phase, file, and (where applicable) progress
 * counters.
 */
export type ProgressCallback = (event: ProgressEvent) => void;
