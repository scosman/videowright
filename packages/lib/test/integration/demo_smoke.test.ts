/**
 * Smoke test: verify the videowright_demo's timeline.ts loads correctly via tsx
 * and that the demo has the expected structure.
 *
 * This does NOT attempt to render Three.js, Lottie, or ECharts in jsdom.
 * It validates structural correctness: the timeline loads, has the right
 * segment count and ids, and the consumer repo layout is well-formed.
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { findConfig, findTimeline } from "../../src/cli/discover.js";
import { buildNodeSegmentLoaderMap } from "../../src/cli/script_cmd.js";
import { loadModule } from "../../src/cli/ts_loader.js";
import type { Timeline } from "../../src/types.js";

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
		expect(existsSync(join(DEMO_ROOT, "videos/demo_video/voiceover/script.md"))).toBe(true);
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

	it("buildNodeSegmentLoaderMap discovers all expected segments", () => {
		const loaderMap = buildNodeSegmentLoaderMap(DEMO_ROOT);
		// At minimum, all segments referenced by the demo timeline must be discovered.
		// Additional segments (e.g. style-pack variants like em-* and rs-*) may also
		// exist on disk, so we only assert a lower bound on the total count.
		expect(loaderMap.size).toBeGreaterThanOrEqual(EXPECTED_SEGMENT_IDS.length);

		for (const id of EXPECTED_SEGMENT_IDS) {
			expect(loaderMap.has(id), `Missing loader for: ${id}`).toBe(true);
		}
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
