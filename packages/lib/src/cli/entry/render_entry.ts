/**
 * Render-mode entry client for `videowright render`.
 * Similar to entry_client.ts but boots the player in render mode
 * and exposes page-evaluate-callable globals for frame-by-frame control.
 */

// Virtual module provided by globalsVirtualModulePlugin -- exports concrete
// values that were previously injected via Vite's define: config.
import { consumerRoot, renderFps, timelinePath } from "virtual:vw-globals";

// Virtual module provided by segmentDiscoveryPlugin
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

// Extend window for render-mode globals
declare global {
	interface Window {
		__VW_RENDER__: boolean;
		__VW_RENDER_READY__: boolean;
		__VW_RENDER_ADVANCE__: () => Promise<boolean>;
		__VW_RENDER_ERROR__: string | null;
		__VW_SEGMENT_ADVANCES__: Record<string, number[]>;
		__VW_SEGMENTS_LOADED__: boolean;
		__VW_ENGAGE_VIRTUAL_TIME__: () => void;
		__VW_ADVANCE_CLOCK__: (deltaMs: number) => void | Promise<void>;
	}
}

window.__VW_RENDER__ = true;
window.__VW_RENDER_READY__ = false;
window.__VW_RENDER_ERROR__ = null;
window.__VW_SEGMENTS_LOADED__ = false;

async function boot() {
	const segmentGlob = segmentGlobRaw as Record<string, () => Promise<unknown>>;
	const segmentLoaders = buildSegmentLoaderMap(segmentGlob);

	// Load timeline
	const timelineMod = (await import(/* @vite-ignore */ timelinePath)) as {
		default: Timeline;
	};
	const timeline = timelineMod.default;

	// Load config
	const configMod = (await import(/* @vite-ignore */ `${consumerRoot}/videowright.config.ts`)) as {
		default: Config;
	};
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

	// Mount player in render mode
	const host = document.getElementById("player-host");
	if (!host) throw new Error("No #player-host element found");

	const fps = typeof renderFps === "number" ? renderFps : 60;
	const player = new Player(host, { renderMode: true, hud: false, fps });
	await player.load(finalTimeline, segmentLoaders, transitionLoaders);
	await player.start();

	// Expose render control globals for page.evaluate
	window.__VW_RENDER_ADVANCE__ = async () => {
		try {
			return await player.renderAdvance();
		} catch (e) {
			window.__VW_RENDER_ERROR__ = e instanceof Error ? e.message : String(e);
			return false;
		}
	};

	window.__VW_RENDER_READY__ = true;
}

boot().catch((e) => {
	console.error("Videowright render boot error:", e);
	window.__VW_RENDER_ERROR__ = e instanceof Error ? e.message : String(e);
	// Still set ready so the driver can read the error
	window.__VW_RENDER_READY__ = true;
});
