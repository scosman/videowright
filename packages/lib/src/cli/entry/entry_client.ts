/**
 * Internal entry client for `videowright dev`.
 * Loaded by the dev server's index.html. Uses Vite's import.meta.glob to discover
 * consumer segments, loads the timeline, and boots the Player.
 */

// These globals are injected by Vite's define config in dev.ts
declare const __VW_TIMELINE_PATH__: string;
declare const __VW_CONSUMER_ROOT__: string;

import {
	Player,
	applyMetaDefaults,
	buildSegmentLoaderMap,
	buildTransitionLoaderMap,
	validateTimeline,
} from "../../index.js";
import type { Config, Timeline } from "../../index.js";

async function boot() {
	// Discover segment modules via Vite glob.
	// Alias-based globs (@consumer/...) can be fragile in some Vite versions.
	// If the glob resolves empty, we log a diagnostic below.
	const segmentGlob = import.meta.glob("@consumer/segments/*/index.ts") as Record<
		string,
		() => Promise<unknown>
	>;

	if (Object.keys(segmentGlob).length === 0) {
		console.warn(
			`No segments discovered under ${__VW_CONSUMER_ROOT__}/segments/. Check that the segments directory exists and contains <id>/index.ts files.`,
		);
	}

	const segmentLoaders = buildSegmentLoaderMap(
		// Normalize glob keys to /segments/... format expected by buildSegmentLoaderMap
		Object.fromEntries(
			Object.entries(segmentGlob).map(([key, loader]) => {
				const normalized = key.replace(/^@consumer/, "");
				return [normalized, loader];
			}),
		),
	);

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

	// Mount player
	const host = document.getElementById("player-host");
	if (!host) throw new Error("No #player-host element found");

	const player = new Player(host);
	await player.load(finalTimeline, segmentLoaders, transitionLoaders);
	await player.start();
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
