/**
 * Internal entry client for `videowright dev`.
 * Loaded by the dev server's index.html. Imports segments via a virtual module
 * provided by the segment discovery plugin, loads the timeline, and boots the Player.
 */

// These globals are injected by Vite's define config in dev.ts
declare const __VW_TIMELINE_PATH__: string;
declare const __VW_CONSUMER_ROOT__: string;

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
	// Support ?recordMode=1 for record mode (reduced HUD for external screen capture;
	// Phase 3 will differentiate this from hideHud by showing a play button)
	const params = new URLSearchParams(window.location.search);
	const hideHud = params.has("hideHud");
	const recordMode = params.has("recordMode");
	const playerOpts = hideHud || recordMode ? { hud: false } : undefined;
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
