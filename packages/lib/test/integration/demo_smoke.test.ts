/**
 * Smoke test: verify the videowright_demo's timeline.ts loads correctly via tsx
 * and that the demo has the expected structure.
 *
 * This does NOT attempt to render Three.js, Lottie, or ECharts in jsdom.
 * It validates structural correctness: the timeline loads, has the right
 * segment count and ids, and the consumer repo layout is well-formed.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { findConfig, findTimeline } from "../../src/cli/discover.js";
import { loadModule } from "../../src/cli/ts_loader.js";
import { resolveTiming } from "../../src/timeline/resolveTiming.js";
import { validateAudioTrack, validateTiming } from "../../src/timeline/validateTiming.js";
import type { AudioTrack, Timeline } from "../../src/types.js";

const DEMO_ROOT = resolve(__dirname, "../../../../examples/videowright_demo");

const EXPECTED_SEGMENT_IDS = [
	"cold-open",
	"title-card",
	"web-tech-gallery",
	"interactive-dev",
	"pixel-perfect-export",
	"voiceover-sync",
	"any-coding-agent",
	"install-cta",
];

describe("cli_dev_against_demo_smoke", () => {
	it("demo directory exists with expected structure", () => {
		expect(existsSync(DEMO_ROOT)).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "videowright.config.ts"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "videos/demo_video/timeline.ts"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "videos/demo_video/voiceover_script/script.md"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "styles/motion-engineering/tokens.css"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "styles/motion-engineering/STYLE.md"))).toBe(true);
	});

	it("all 8 segment directories exist with index.ts", () => {
		for (const id of EXPECTED_SEGMENT_IDS) {
			const segmentPath = join(DEMO_ROOT, "segments", id, "index.ts");
			expect(existsSync(segmentPath), `Missing segment: ${id}`).toBe(true);
		}
	});

	it("findConfig discovers demo config", () => {
		const configPath = findConfig(DEMO_ROOT);
		expect(configPath).not.toBeNull();
		expect(configPath).toContain("videowright.config.ts");
	});

	it("findTimeline discovers demo timeline", () => {
		const timelinePath = findTimeline(DEMO_ROOT);
		expect(timelinePath).not.toBeNull();
		expect(timelinePath).toContain("timeline.ts");
	});

	it("timeline loads via tsx with correct structure", async () => {
		const timelinePath = findTimeline(DEMO_ROOT);
		expect(timelinePath).toBeTruthy();
		if (!timelinePath) return;

		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		expect(timeline).toBeDefined();
		expect(timeline.meta).toBeDefined();
		expect(timeline.meta.title).toBe("Videowright Explainer");
	});

	it("timeline has 8 segments with expected ids", async () => {
		const timelinePath = findTimeline(DEMO_ROOT);
		expect(timelinePath).toBeTruthy();
		if (!timelinePath) return;

		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		expect(timeline.segments).toHaveLength(8);

		const ids = timeline.segments.map((s) => s.id);
		expect(ids).toEqual(EXPECTED_SEGMENT_IDS);
	});

	it("timeline uses fade transition on web-tech-gallery", async () => {
		const timelinePath = findTimeline(DEMO_ROOT);
		expect(timelinePath).toBeTruthy();
		if (!timelinePath) return;

		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		const galleryEntry = timeline.segments.find((s) => s.id === "web-tech-gallery");
		expect(galleryEntry).toBeDefined();
		expect(galleryEntry?.transition).toBe("fade");
	});

	it("segments directory contains all expected segment subdirectories", () => {
		const segmentsDir = join(DEMO_ROOT, "segments");
		const entries = readdirSync(segmentsDir).filter((entry) => {
			const entryPath = join(segmentsDir, entry);
			return statSync(entryPath).isDirectory() && existsSync(join(entryPath, "index.ts"));
		});
		// At minimum, all segments referenced by the demo timeline must be present.
		// Additional segments (e.g. style-pack variants like em-* and rs-*) may also
		// exist on disk, so we only assert a lower bound on the total count.
		expect(entries.length).toBeGreaterThanOrEqual(EXPECTED_SEGMENT_IDS.length);

		for (const id of EXPECTED_SEGMENT_IDS) {
			expect(entries.includes(id), `Missing segment directory: ${id}`).toBe(true);
		}
	});

	it("demo_video has audio-track directory structure", () => {
		const videoDir = join(DEMO_ROOT, "videos/demo_video");
		expect(existsSync(join(videoDir, "voiceover_script/script.md"))).toBe(true);
		expect(existsSync(join(videoDir, "audio/audio_plan.md"))).toBe(true);
		expect(existsSync(join(videoDir, "audio/originals/voiceovers/v4/audio.mp3"))).toBe(true);
		expect(existsSync(join(videoDir, "audio/originals/voiceovers/v4/voiceover.ts"))).toBe(true);
		expect(existsSync(join(videoDir, "audio/originals/voiceovers/v4/timing.json"))).toBe(true);
		expect(existsSync(join(videoDir, "audio/tracks/v1/track.ts"))).toBe(true);
		expect(existsSync(join(videoDir, "audio/tracks/v1/track.mp3"))).toBe(true);
		expect(existsSync(join(videoDir, "audio/tracks/v1/plan_snapshot.md"))).toBe(true);
		// Old layout should be gone
		expect(existsSync(join(videoDir, "voiceover"))).toBe(false);
		expect(existsSync(join(videoDir, "voiceovers"))).toBe(false);
	});

	it("demo_video timeline uses default_audio_track (not default_voiceover)", async () => {
		const timelinePath = join(DEMO_ROOT, "videos/demo_video/timeline.ts");
		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		expect(timeline.default_audio_track).toBeDefined();
		expect((timeline as unknown as Record<string, unknown>).default_voiceover).toBeUndefined();

		const track = timeline.default_audio_track as AudioTrack;
		expect(track.audio_file).toContain("track.mp3");
		expect(track.length_s).toBeGreaterThan(0);
		expect(Object.keys(track.timing.perSegment).length).toBe(8);
		expect(track.timing.perSegment["cold-open"]).toBeDefined();
	});

	it("demo_editorial_mono timeline uses default_audio_track", async () => {
		const timelinePath = join(DEMO_ROOT, "videos/demo_editorial_mono/timeline.ts");
		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		expect(timeline.default_audio_track).toBeDefined();
		expect((timeline as unknown as Record<string, unknown>).default_voiceover).toBeUndefined();

		const track = timeline.default_audio_track as AudioTrack;
		expect(track.timing.perSegment["em-cold-open"]).toBeDefined();
		expect(Object.keys(track.timing.perSegment).length).toBe(8);
	});

	it("demo_risograph timeline uses default_audio_track", async () => {
		const timelinePath = join(DEMO_ROOT, "videos/demo_risograph/timeline.ts");
		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		expect(timeline.default_audio_track).toBeDefined();
		expect((timeline as unknown as Record<string, unknown>).default_voiceover).toBeUndefined();

		const track = timeline.default_audio_track as AudioTrack;
		expect(track.timing.perSegment["rs-cold-open"]).toBeDefined();
		expect(Object.keys(track.timing.perSegment).length).toBe(8);
	});

	it("all three demo audio track files exist on disk", () => {
		const demos = ["demo_video", "demo_editorial_mono", "demo_risograph"];
		for (const demo of demos) {
			const trackMp3 = join(DEMO_ROOT, "videos", demo, "audio/tracks/v1/track.mp3");
			expect(existsSync(trackMp3), `Missing track.mp3 for ${demo}`).toBe(true);
		}
	});

	it("demo_video render pre-flight: audio resolves, timing validates, schedule builds", async () => {
		// Exercises the same code path render.ts runs before launching the browser.
		// If this passes, the render would succeed (browser launch is the only
		// remaining step, and it is blocked by sandbox restrictions in CI/agents).
		const timelinePath = join(DEMO_ROOT, "videos/demo_video/timeline.ts");
		const videoFolder = dirname(timelinePath);
		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;
		const audioTrack = timeline.default_audio_track as AudioTrack;

		// 1. Audio file resolves to an existing mp3
		const audioFilePath = resolve(videoFolder, audioTrack.audio_file);
		expect(existsSync(audioFilePath), `Audio file should exist at ${audioFilePath}`).toBe(true);
		expect(statSync(audioFilePath).size).toBeGreaterThan(100_000); // ~996KB mp3

		// 2. validateAudioTrack passes
		const trackValidation = validateAudioTrack(audioTrack, videoFolder);
		expect(trackValidation.ok).toBe(true);

		// 3. validateTiming passes
		const segmentIds = timeline.segments.map((s) => s.id);
		const timingValidation = validateTiming(audioTrack.timing, segmentIds);
		expect(timingValidation.ok).toBe(true);

		// 4. resolveTiming succeeds and picks the audio_track source
		const resolved = resolveTiming({
			segments: segmentIds.map((id) => ({ id, advances: [1.0] })),
			defaultTiming: timeline.default_timing,
			defaultAudioTrack: timeline.default_audio_track,
		});
		expect(resolved.source).toBe("audio_track");
		expect(Object.keys(resolved.perSegment).length).toBe(8);
	});

	it("demo_editorial_mono render pre-flight validates", async () => {
		const timelinePath = join(DEMO_ROOT, "videos/demo_editorial_mono/timeline.ts");
		const videoFolder = dirname(timelinePath);
		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;
		const audioTrack = timeline.default_audio_track as AudioTrack;

		const audioFilePath = resolve(videoFolder, audioTrack.audio_file);
		expect(existsSync(audioFilePath)).toBe(true);
		expect(validateAudioTrack(audioTrack, videoFolder).ok).toBe(true);
		expect(
			validateTiming(
				audioTrack.timing,
				timeline.segments.map((s) => s.id),
			).ok,
		).toBe(true);
	});

	it("demo_risograph render pre-flight validates", async () => {
		const timelinePath = join(DEMO_ROOT, "videos/demo_risograph/timeline.ts");
		const videoFolder = dirname(timelinePath);
		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;
		const audioTrack = timeline.default_audio_track as AudioTrack;

		const audioFilePath = resolve(videoFolder, audioTrack.audio_file);
		expect(existsSync(audioFilePath)).toBe(true);
		expect(validateAudioTrack(audioTrack, videoFolder).ok).toBe(true);
		expect(
			validateTiming(
				audioTrack.timing,
				timeline.segments.map((s) => s.id),
			).ok,
		).toBe(true);
	});

	it("config loads via tsx with correct structure", async () => {
		const configPath = findConfig(DEMO_ROOT);
		expect(configPath).toBeTruthy();
		if (!configPath) return;

		const mod = await loadModule(configPath);
		const config = mod.default as {
			projectStructure: string;
			defaultStyle?: string;
			defaults?: {
				resolution?: [number, number];
				fps?: number;
				aspectRatio?: string;
			};
		};

		expect(config).toBeDefined();
		expect(config.projectStructure).toBe("v1");
		expect(config.defaultStyle).toBe("motion-engineering");
		expect(config.defaults?.resolution).toEqual([1920, 1080]);
		expect(config.defaults?.fps).toBe(60);
		expect(config.defaults?.aspectRatio).toBe("16:9");
	});
});
