/**
 * `videowright record` -- auto-advance playback for visual review or
 * external screen capture.
 *
 * Boots the dev server and opens a browser URL with `?recordMode=1`.
 * The user can run external screen-capture software over the browser window.
 * No mp4 is produced -- use `videowright render` for export.
 */

import { dirname, resolve } from "node:path";
import { loadVoiceover } from "../timeline/loadVoiceover.js";
import { resolveTiming } from "../timeline/resolveTiming.js";
import type { Segment, Timeline } from "../types.js";
import { discoverProject } from "./discover_project.js";
import { loadModule } from "./ts_loader.js";

export interface RecordOptions {
	cwd: string;
	positional?: string;
	verbose?: boolean;
	voiceover?: string;
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
	const { timelinePath } = discoverProject(cwd, positional, "record");

	// Build extra globals for voiceover injection
	const extraGlobals: Record<string, unknown> = {};
	const voiceoverSuppressed = opts.voiceover === "none";

	if (!voiceoverSuppressed && opts.voiceover) {
		// CLI voiceover: load and validate
		const videoFolder = dirname(timelinePath);
		const voResult = await loadVoiceover({
			videoFolder,
			slug: opts.voiceover,
		});

		// Inject the audio file path for Vite serving via /@fs/ prefix
		extraGlobals.audioFile = `/@fs/${voResult.audioFilePath}`;

		// Load timeline and segment advances for complete timing resolution.
		// Segment advances are needed so partial voiceover Timings (which only
		// override some segments) fall back correctly for unoverridden segments.
		const timelineMod = await loadModule(timelinePath);
		const timeline = timelineMod.default as Timeline;
		const segments = await loadSegmentAdvances(videoFolder, timeline);

		const resolved = resolveTiming({
			segments,
			defaultTiming: timeline.default_timing,
			defaultVoiceover: timeline.default_voiceover,
			cliVoiceoverSlug: opts.voiceover,
			cliVoiceoverModule: voResult.voiceover,
		});

		extraGlobals.resolvedTiming = resolved.perSegment;

		if (verbose) {
			console.log(`voiceover: ${opts.voiceover} (${voResult.audioFilePath})`);
		}
	} else if (voiceoverSuppressed) {
		// --voiceover none: inject suppression signal so entry_client.ts
		// does not fall through to default_voiceover from the timeline.
		extraGlobals.voiceoverNone = true;

		if (verbose) {
			console.log("voiceover: none (suppressed)");
		}
	}

	// Boot dev server on auto-assigned port
	const { runDev } = await import("./dev.js");
	const devResult = await runDev({ cwd, positional, port: 0, verbose, extraGlobals });

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

/**
 * Load segment advances from segment modules on disk.
 * Resolves segments relative to the video folder (the directory containing
 * timeline.ts), matching the convention used by the rest of the CLI.
 * Returns minimal {id, advances} objects for use with resolveTiming.
 */
async function loadSegmentAdvances(
	videoFolder: string,
	timeline: Timeline,
): Promise<Array<{ id: string; advances: number[] }>> {
	const segments: Array<{ id: string; advances: number[] }> = [];
	for (const entry of timeline.segments) {
		const segPath = resolve(videoFolder, "segments", entry.id, "index.ts");
		try {
			const mod = await loadModule(segPath);
			const seg = mod.default as Segment;
			segments.push({ id: entry.id, advances: seg?.advances ?? [] });
		} catch {
			// If a segment can't be loaded CLI-side (e.g. it imports browser-only
			// assets), fall back to an empty advances array. The browser-side
			// entry_client.ts will have the real advances from Vite-loaded modules.
			segments.push({ id: entry.id, advances: [] });
		}
	}
	return segments;
}
