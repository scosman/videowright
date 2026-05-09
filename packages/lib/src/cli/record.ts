/**
 * `videowright record` -- auto-advance playback for visual review or
 * external screen capture.
 *
 * Boots the dev server and opens a browser URL with `?recordMode=1`.
 * The user can run external screen-capture software over the browser window.
 * No mp4 is produced -- use `videowright render` for export.
 */

import { discoverProject } from "./discover_project.js";

export interface RecordOptions {
	cwd: string;
	positional?: string;
	verbose?: boolean;
}

export interface RecordResult {
	url: string;
	close: () => Promise<void>;
}

export async function runRecord(opts: RecordOptions): Promise<RecordResult> {
	const { cwd, positional, verbose } = opts;

	// Validate project exists before booting the server. This gives a fast,
	// clear error ("No videowright.config.ts found") instead of a delayed Vite
	// boot error. runDev will re-discover internally -- the duplication is
	// intentional for better error UX.
	discoverProject(cwd, positional, "record");

	// Boot dev server on auto-assigned port
	const { runDev } = await import("./dev.js");
	const devResult = await runDev({ cwd, positional, port: 0, verbose });

	const base = devResult.url.replace(/\/$/, "");
	const separator = base.includes("?") ? "&" : "?";
	const recordUrl = `${base}${separator}recordMode=1`;

	if (verbose) {
		console.log(`dev server: ${devResult.url}`);
		console.log(`record URL: ${recordUrl}`);
	}

	return {
		url: recordUrl,
		close: devResult.close,
	};
}
