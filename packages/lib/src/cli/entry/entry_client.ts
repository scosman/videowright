/**
 * Internal entry client for `videowright dev`.
 * Loaded by the dev server's index.html. Imports segments via a virtual module
 * provided by the segment discovery plugin, loads the timeline, and boots the Player.
 */

// These globals are injected by Vite's define config in dev.ts
declare const __VW_TIMELINE_PATH__: string;
declare const __VW_CONSUMER_ROOT__: string;
// Optional: injected by record.ts when --voiceover is used, or by dev.ts
// for default_voiceover audio path resolution
declare const __VW_AUDIO_FILE__: string | undefined;
declare const __VW_RESOLVED_TIMING__: Record<string, number[]> | undefined;
// Injected by record.ts when --voiceover none is used to suppress default_voiceover
declare const __VW_VOICEOVER_NONE__: boolean | undefined;

// Virtual module provided by segmentDiscoveryPlugin in dev.ts.
// It exports a Record<string, () => Promise<Module>> with explicit dynamic imports
// for each segment discovered at server start time.
// @ts-expect-error -- virtual module, no type declarations
import segmentGlobRaw from "virtual:vw-segments";

import {
	Player,
	applyMetaDefaults,
	buildSegmentLoaderMap,
	buildTransitionLoaderMap,
	validateTimeline,
} from "../../index.js";
import type { Config, Timeline } from "../../index.js";
import { resolveTiming } from "../../timeline/resolveTiming.js";

// Extend window for ready signals used by render command (__VW_PLAYER_READY__,
// __VW_SEGMENT_ADVANCES__) and internally for segment-load tracking
// (__VW_SEGMENTS_LOADED__). The record command no longer reads these globals
// directly -- it opens a URL and the user drives playback in-browser.
declare global {
	interface Window {
		__VW_PLAYER_READY__: boolean;
		__VW_SEGMENT_ADVANCES__: Record<string, number[]>;
		__VW_SEGMENTS_LOADED__: boolean;
	}
}

window.__VW_PLAYER_READY__ = false;
window.__VW_SEGMENTS_LOADED__ = false;

async function boot() {
	const segmentGlob = segmentGlobRaw as Record<string, () => Promise<unknown>>;

	if (Object.keys(segmentGlob).length === 0) {
		console.warn(
			`No segments discovered under ${__VW_CONSUMER_ROOT__}/segments/. Check that the segments directory exists and contains <id>/index.ts files.`,
		);
	}

	const segmentLoaders = buildSegmentLoaderMap(segmentGlob);

	// Load timeline
	const timelineMod = (await import(/* @vite-ignore */ __VW_TIMELINE_PATH__)) as {
		default: Timeline;
	};
	const timeline = timelineMod.default;

	// Load config
	const configMod = (await import(
		/* @vite-ignore */ `${__VW_CONSUMER_ROOT__}/videowright.config.ts`
	)) as { default: Config };
	const config = configMod.default;

	const transitionLoaders = buildTransitionLoaderMap(config);
	const finalTimeline = applyMetaDefaults(timeline, config);

	// Validate
	const result = validateTimeline(finalTimeline, segmentLoaders, transitionLoaders);
	if (!result.ok) {
		const messages = result.errors.map((e) => {
			switch (e.kind) {
				case "missing-segment":
					return `Missing segment "${e.segmentId}" in timeline "${e.timelineTitle}"`;
				case "missing-transition":
					return `Missing transition "${e.transitionName}" on segment "${e.segmentId}"`;
				case "missing-title":
					return "Timeline is missing a title";
				case "malformed-segment-path":
					return `Malformed segment path: ${e.path}`;
			}
		});
		throw new Error(`Timeline validation failed:\n${messages.join("\n")}`);
	}

	// Extract advances from each segment so drivers can read them from the browser
	const advancesMap: Record<string, number[]> = {};
	for (const entry of finalTimeline.segments) {
		const loader = segmentLoaders.get(entry.id);
		if (loader) {
			const mod = await loader();
			const seg = mod.default;
			if (seg && Array.isArray(seg.advances)) {
				advancesMap[entry.id] = seg.advances;
			}
		}
	}
	window.__VW_SEGMENT_ADVANCES__ = advancesMap;
	window.__VW_SEGMENTS_LOADED__ = true;

	// Mount player
	const host = document.getElementById("player-host");
	if (!host) throw new Error("No #player-host element found");

	// Support ?hideHud=1 for render screenshots (HUD must not appear in rendered frames)
	// Support ?recordMode=1 for record mode (reduced HUD showing only play button)
	const params = new URLSearchParams(window.location.search);
	const hideHud = params.has("hideHud");
	const recordMode = params.has("recordMode");

	// Resolve audio and timing for voiceover playback.
	// The CLI may inject __VW_AUDIO_FILE__ (dev.ts for default_voiceover, or
	// record.ts for --voiceover <slug>) and __VW_RESOLVED_TIMING__ (record.ts only).
	// __VW_VOICEOVER_NONE__ suppresses default_voiceover (record --voiceover none).
	let audioFile: string | undefined;
	let resolvedTimingMap: Record<string, number[]> | undefined;

	const voiceoverNone =
		typeof __VW_VOICEOVER_NONE__ !== "undefined" ? __VW_VOICEOVER_NONE__ : false;
	const injectedAudio = typeof __VW_AUDIO_FILE__ !== "undefined" ? __VW_AUDIO_FILE__ : undefined;
	const injectedTiming =
		typeof __VW_RESOLVED_TIMING__ !== "undefined" ? __VW_RESOLVED_TIMING__ : undefined;

	if (!voiceoverNone && injectedAudio) {
		audioFile = injectedAudio;
	}

	if (injectedTiming) {
		resolvedTimingMap = injectedTiming;
	} else {
		// Build resolved timing from segment advances + timeline defaults.
		// When voiceover is suppressed, pass no voiceover so resolveTiming
		// falls back to default_timing or segment advances.
		const segments: Array<{ id: string; advances: number[] }> = [];
		for (const entry of finalTimeline.segments) {
			const advances = advancesMap[entry.id];
			if (advances) {
				segments.push({ id: entry.id, advances });
			}
		}

		const resolved = resolveTiming({
			segments,
			defaultTiming: finalTimeline.default_timing,
			defaultVoiceover: voiceoverNone ? undefined : finalTimeline.default_voiceover,
		});
		resolvedTimingMap = resolved.perSegment;
	}

	const playerOpts = {
		hud: !hideHud,
		recordMode,
		audioFile,
		resolvedTiming: resolvedTimingMap,
	};
	const player = new Player(host, playerOpts);
	await player.load(finalTimeline, segmentLoaders, transitionLoaders);
	await player.start();

	// Signal that the player is ready for external drivers (e.g. record command)
	window.__VW_PLAYER_READY__ = true;
}

boot().catch((e) => {
	console.error("Videowright boot error:", e);
	const host = document.getElementById("player-host");
	if (host) {
		// Use textContent (not innerHTML) to safely display error messages
		const pre = document.createElement("pre");
		pre.style.cssText = "color:red;padding:1em;font-size:14px;";
		pre.textContent = e instanceof Error ? e.message : String(e);
		host.textContent = "";
		host.appendChild(pre);
	}
});
