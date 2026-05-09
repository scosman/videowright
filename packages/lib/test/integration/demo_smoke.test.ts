/**
 * Smoke test: verify the demo_example's timeline.ts loads correctly via tsx
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

const DEMO_ROOT = resolve(__dirname, "../../../../examples/demo_example");

const EXPECTED_SEGMENT_IDS = [
	"intro",
	"feature-svg",
	"feature-three",
	"feature-lottie",
	"feature-echarts",
	"feature-cards",
	"outro",
];

describe("cli_dev_against_demo_smoke", () => {
	it("demo directory exists with expected structure", () => {
		expect(existsSync(DEMO_ROOT)).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "videowright.config.ts"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "videos/demo/timeline.ts"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "videos/demo/voiceover/script.md"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "styles/tokens.css"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "styles/tokens.ts"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "styles/STYLE.md"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "transitions/logo-morph.ts"))).toBe(true);
	});

	it("all 7 segment directories exist with index.ts", () => {
		for (const id of EXPECTED_SEGMENT_IDS) {
			const segmentPath = join(DEMO_ROOT, "segments", id, "index.ts");
			expect(existsSync(segmentPath), `Missing segment: ${id}`).toBe(true);
		}
	});

	it("component directories exist", () => {
		expect(existsSync(join(DEMO_ROOT, "components/animated-title/index.ts"))).toBe(true);
		expect(existsSync(join(DEMO_ROOT, "components/feature-card/index.ts"))).toBe(true);
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
		expect(timeline.meta.title).toBe("Videowright — Demo");
		expect(timeline.meta.aspectRatio).toBe("16:9");
		expect(timeline.meta.resolution).toEqual([1920, 1080]);
		expect(timeline.meta.fps).toBe(60);
	});

	it("timeline has 7 segments with expected ids", async () => {
		const timelinePath = findTimeline(DEMO_ROOT);
		expect(timelinePath).toBeTruthy();
		if (!timelinePath) return;

		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		expect(timeline.segments).toHaveLength(7);

		const ids = timeline.segments.map((s) => s.id);
		expect(ids).toEqual(EXPECTED_SEGMENT_IDS);
	});

	it("timeline uses logo-morph custom transition on feature-cards", async () => {
		const timelinePath = findTimeline(DEMO_ROOT);
		expect(timelinePath).toBeTruthy();
		if (!timelinePath) return;

		const mod = await loadModule(timelinePath);
		const timeline = mod.default as Timeline;

		const cardsEntry = timeline.segments.find((s) => s.id === "feature-cards");
		expect(cardsEntry).toBeDefined();
		expect(cardsEntry?.transition).toBe("logo-morph");
	});

	it("buildNodeSegmentLoaderMap discovers all 7 segments", () => {
		const loaderMap = buildNodeSegmentLoaderMap(DEMO_ROOT);
		expect(loaderMap.size).toBe(7);

		for (const id of EXPECTED_SEGMENT_IDS) {
			expect(loaderMap.has(id), `Missing loader for: ${id}`).toBe(true);
		}
	});

	it("config loads via tsx and registers logo-morph transition", async () => {
		const configPath = findConfig(DEMO_ROOT);
		expect(configPath).toBeTruthy();
		if (!configPath) return;

		const mod = await loadModule(configPath);
		const config = mod.default as {
			projectStructure: string;
			transitions?: Record<string, unknown>;
		};

		expect(config).toBeDefined();
		expect(config.projectStructure).toBe("v1");
		expect(config.transitions).toBeDefined();
		expect(config.transitions?.["logo-morph"]).toBeDefined();
		expect(typeof config.transitions?.["logo-morph"]).toBe("function");
	});
});
