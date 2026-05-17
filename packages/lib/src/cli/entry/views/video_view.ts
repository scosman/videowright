/**
 * Video view: wraps the existing player + HUD + dev-frame for a single video.
 * Mounted at /video/<slug>.
 */

import {
	Player,
	applyMetaDefaults,
	buildSegmentLoaderMap,
	buildTransitionLoaderMap,
	validateTimeline,
} from "../../../index.js";
import type { Config, ProjectInfo, Timeline } from "../../../index.js";
import { resolveTiming } from "../../../timeline/resolveTiming.js";
import { renderDownloadModal } from "../components/download_modal.js";
import { renderHideHudTab } from "../components/hide_hud_tab.js";
import { renderTopBar } from "../components/top_bar.js";
import { applyDevFrameSize, installHudKeyListener, toggleDevHud } from "../dev_frame.js";

// Virtual modules
import {
	audioTrackNone,
	consumerRoot,
	audioFile as injectedAudio,
	resolvedTiming as injectedTiming,
} from "virtual:vw-globals";
import segmentGlobRaw from "virtual:vw-segments";

// Extend window for ready signals
declare global {
	interface Window {
		__VW_PLAYER_READY__: boolean;
		__VW_SEGMENT_ADVANCES__: Record<string, number[]>;
		__VW_SEGMENTS_LOADED__: boolean;
	}
}

/**
 * Build and return the video view DOM for a given slug.
 * Boots the player for the specified video.
 */
export function renderVideoView(projectInfo: ProjectInfo, slug: string): HTMLElement {
	const video = projectInfo.videos.find((v) => v.slug === slug);
	if (!video) {
		throw new Error(`No video found for slug "${slug}"`);
	}

	const container = document.createElement("div");
	container.id = "dev-layout";
	container.setAttribute(
		"style",
		["display: grid", "grid-template-rows: auto 1fr 80px", "width: 100vw", "height: 100vh"].join(
			";",
		),
	);

	// Top bar with breadcrumb and download button
	const topBar = renderTopBar({
		projectName: projectInfo.projectName,
		breadcrumbTitle: video.title,
		showDownload: true,
		onDownload: () => {
			renderDownloadModal({
				slug: video.slug,
				title: video.title,
				onClose: () => {},
			});
		},
	});
	container.appendChild(topBar);

	const videoArea = document.createElement("div");
	videoArea.id = "dev-video-area";
	videoArea.setAttribute(
		"style",
		["display: grid", "place-items: center", "overflow: hidden", "padding: 12px"].join(";"),
	);

	const scaleContainer = document.createElement("div");
	scaleContainer.id = "dev-scale-container";
	scaleContainer.style.position = "relative";
	scaleContainer.style.overflow = "visible";

	const playerHost = document.createElement("div");
	playerHost.id = "player-host";
	playerHost.style.transformOrigin = "top left";

	// Crop marks
	const cropMarks = buildCropMarks();
	scaleContainer.appendChild(playerHost);
	scaleContainer.appendChild(cropMarks);

	videoArea.appendChild(scaleContainer);
	container.appendChild(videoArea);

	const hudContainer = document.createElement("div");
	hudContainer.id = "dev-hud-container";
	hudContainer.setAttribute(
		"style",
		[
			"position: relative",
			"background: var(--bg-surface, #131316)",
			"border-top: 1px solid var(--border-subtle, #26262d)",
			"height: 80px",
			"min-height: 80px",
			"max-height: 80px",
			"overflow: visible",
		].join(";"),
	);

	// Hide-HUD tab anchored to top edge of HUD container
	const hideHudTab = renderHideHudTab({
		onToggle: () => toggleDevHud(),
	});
	hudContainer.appendChild(hideHudTab);

	container.appendChild(hudContainer);

	// Boot the player asynchronously
	bootPlayer(video.timelinePath, playerHost, hudContainer).catch((e) => {
		console.error("Videowright boot error:", e);
		const pre = document.createElement("pre");
		pre.style.cssText = "color:red;padding:1em;font-size:14px;";
		pre.textContent = e instanceof Error ? e.message : String(e);
		playerHost.textContent = "";
		playerHost.appendChild(pre);
	});

	return container;
}

async function bootPlayer(
	timelinePath: string,
	host: HTMLElement,
	hudContainer: HTMLElement,
): Promise<void> {
	window.__VW_PLAYER_READY__ = false;
	window.__VW_SEGMENTS_LOADED__ = false;

	const segmentGlob = segmentGlobRaw as Record<string, () => Promise<unknown>>;

	const segmentLoaders = buildSegmentLoaderMap(segmentGlob);

	// Load timeline
	if (!timelinePath) {
		throw new Error("No timeline path configured — video lookup should have caught this.");
	}
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

	applyDevFrameSize(finalTimeline.meta.resolution);
	installHudKeyListener();

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

	// Extract advances
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

	// Support ?hideHud=1 for render screenshots.
	const params = new URLSearchParams(window.location.search);
	const hideHud = params.has("hideHud");

	// Resolve audio track timing
	let audioFileResolved: string | undefined;
	let resolvedTimingMap: Record<string, number[]> | undefined;

	if (!audioTrackNone && injectedAudio) {
		audioFileResolved = injectedAudio;
	} else if (!audioTrackNone && !injectedAudio && finalTimeline.default_audio_track?.audio_file) {
		// In multi-video dev mode, globals.audioFile is not set (dev.ts no
		// longer resolves a single video's audio track). Resolve the audio
		// path client-side using the timeline's absolute path.
		const videoFolder = timelinePath.replace(/\/[^/]+$/, "");
		audioFileResolved = `/@fs/${videoFolder}/${finalTimeline.default_audio_track.audio_file}`;
	}

	if (injectedTiming) {
		resolvedTimingMap = injectedTiming;
	} else {
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
			defaultAudioTrack: audioTrackNone ? undefined : finalTimeline.default_audio_track,
		});
		resolvedTimingMap = resolved.perSegment;
	}

	const playerOpts = {
		hud: !hideHud,
		audioFile: audioFileResolved,
		resolvedTiming: resolvedTimingMap,
	};
	const player = new Player(host, playerOpts);

	// Relocate HUD to the external container below the frame
	const hudEl = host.querySelector(".vw-hud");
	if (hudEl && hudContainer) {
		hudContainer.appendChild(hudEl);
	} else if (!hudEl && !hideHud) {
		console.warn(
			"HUD element (.vw-hud) not found after Player construction; HUD relocation skipped.",
		);
	}

	await player.load(finalTimeline, segmentLoaders, transitionLoaders);
	await player.start();

	window.__VW_PLAYER_READY__ = true;
}

function buildCropMarks(): HTMLElement {
	const wrapper = document.createElement("div");
	wrapper.className = "vw-crop-marks";
	wrapper.setAttribute(
		"style",
		"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;",
	);

	const marks = ["tl-h", "tl-v", "tr-h", "tr-v", "bl-h", "bl-v", "br-h", "br-v"];
	const styles: Record<string, string> = {
		"tl-h": "top:0;left:-26px;width:18px;height:1px",
		"tl-v": "top:-26px;left:0;width:1px;height:18px",
		"tr-h": "top:0;right:-26px;width:18px;height:1px",
		"tr-v": "top:-26px;right:0;width:1px;height:18px",
		"bl-h": "bottom:0;left:-26px;width:18px;height:1px",
		"bl-v": "bottom:-26px;left:0;width:1px;height:18px",
		"br-h": "bottom:0;right:-26px;width:18px;height:1px",
		"br-v": "bottom:-26px;right:0;width:1px;height:18px",
	};

	for (const mark of marks) {
		const el = document.createElement("div");
		el.className = `vw-crop-mark vw-crop-mark--${mark}`;
		el.setAttribute("style", `position:absolute;background:rgba(255,255,255,0.25);${styles[mark]}`);
		wrapper.appendChild(el);
	}

	return wrapper;
}
