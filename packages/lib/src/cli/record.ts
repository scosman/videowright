/**
 * `videowright record` -- auto-advance playback for visual review or
 * external screen capture.
 *
 * Boots its own Vite dev server targeting a single video with `?recordMode=1`.
 * The user can run external screen-capture software over the browser window.
 * No mp4 is produced -- use `videowright render` for export.
 *
 * NOTE: This command is scheduled for removal in Phase 3.
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadVoiceover } from "../timeline/loadVoiceover.js";
import { resolveTiming } from "../timeline/resolveTiming.js";
import type { Segment, Timeline } from "../types.js";
import { discoverAllVideos, discoverProject } from "./discover_project.js";
import { UserError } from "./errors.js";
import { loadModule } from "./ts_loader.js";
import type { VwGlobals } from "./vite_helpers.js";
import {
	findPackageRoot,
	fullReloadPlugin,
	globalsVirtualModulePlugin,
	projectVirtualModulePlugin,
	segmentDiscoveryPlugin,
	spaFallbackPlugin,
} from "./vite_helpers.js";

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

	const { configPath, timelinePath } = discoverProject(cwd, positional, "record");

	// Load config (validates it can be loaded)
	await loadModule(configPath);

	// Build extra globals for voiceover injection
	const voiceoverGlobals: Partial<VwGlobals> = {};
	const voiceoverSuppressed = opts.voiceover === "none";

	if (!voiceoverSuppressed && opts.voiceover) {
		const videoFolder = dirname(timelinePath);
		const voResult = await loadVoiceover({
			videoFolder,
			slug: opts.voiceover,
		});

		voiceoverGlobals.audioFile = `/@fs/${voResult.audioFilePath}`;

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

		voiceoverGlobals.resolvedTiming = resolved.perSegment;

		if (verbose) {
			console.log(`voiceover: ${opts.voiceover} (${voResult.audioFilePath})`);
		}
	} else if (voiceoverSuppressed) {
		voiceoverGlobals.voiceoverNone = true;
		if (verbose) {
			console.log("voiceover: none (suppressed)");
		}
	} else {
		// Check for default_voiceover on the timeline
		try {
			const timelineMod = await loadModule(timelinePath);
			const timeline = timelineMod.default as Timeline;
			if (timeline.default_voiceover) {
				const videoFolder = dirname(timelinePath);
				const audioAbsPath = resolve(videoFolder, timeline.default_voiceover.audio_file);
				if (existsSync(audioAbsPath)) {
					voiceoverGlobals.audioFile = `/@fs/${audioAbsPath}`;
				}
			}
		} catch {
			// Timeline may fail to load; entry_client will surface the error
		}
	}

	// Boot a standalone Vite server for the single-video record view
	const { createServer } = await import("vite");
	const pkgRoot = findPackageRoot();
	const entryDir = resolve(pkgRoot, "src/cli/entry");

	if (!existsSync(resolve(entryDir, "index.html"))) {
		throw new UserError(
			"Internal entry HTML not found",
			"Reinstall videowright; this is a packaging bug.",
		);
	}

	const globals: VwGlobals = {
		timelinePath,
		consumerRoot: cwd,
		...voiceoverGlobals,
	};

	// Discover all videos for the SPA router's project info virtual module.
	// Look up the slug from the discovered videos rather than manually parsing the path.
	const projectInfo = await discoverAllVideos(cwd);
	const slug = projectInfo.videos.find((v) => v.timelinePath === timelinePath)?.slug ?? "unknown";

	const server = await createServer({
		configFile: false,
		root: entryDir,
		plugins: [
			fullReloadPlugin(),
			segmentDiscoveryPlugin(cwd),
			globalsVirtualModulePlugin(globals),
			spaFallbackPlugin(),
			projectVirtualModulePlugin(projectInfo),
		],
		server: {
			port: 0,
			strictPort: false,
			fs: {
				allow: [cwd, pkgRoot],
			},
		},
		resolve: {
			alias: {
				"@consumer": cwd,
			},
		},
	});

	await server.listen();

	const address = server.resolvedUrls?.local?.[0] ?? "http://localhost:0/";
	const base = address.replace(/\/$/, "");
	const recordUrl = `${base}/${slug}/?recordMode=1`;

	if (verbose) {
		console.log(`dev server: ${address}`);
		console.log(`record URL: ${recordUrl}`);
	}

	return {
		url: recordUrl,
		close: () => server.close(),
	};
}

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
			segments.push({ id: entry.id, advances: [] });
		}
	}
	return segments;
}
