import { describe, expect, it, vi } from "vitest";
import { script } from "../../src/script/script.js";
import { defineSegment } from "../../src/segment/defineSegment.js";
import type { SegmentLoaderMap } from "../../src/timeline/index.js";
import type { Timeline } from "../../src/types.js";

// ---- Helpers ----

function makeLoader(id: string, voiceover?: string) {
	const seg = defineSegment({
		id,
		voiceover,
		async play() {},
	});
	return async () => ({ default: seg });
}

function makeLoaderMap(entries: Array<{ id: string; voiceover?: string }>): SegmentLoaderMap {
	const map: SegmentLoaderMap = new Map();
	for (const e of entries) {
		map.set(e.id, makeLoader(e.id, e.voiceover));
	}
	return map;
}

// ---- Tests ----

describe("script helper", () => {
	it("script_walks_segments_in_order", async () => {
		const timeline: Timeline = {
			meta: { title: "Launch Video" },
			segments: [{ id: "intro" }, { id: "feature" }, { id: "outro" }],
		};

		const loaders = makeLoaderMap([
			{ id: "intro", voiceover: "Welcome to the launch." },
			{ id: "feature", voiceover: "Here is the feature." },
			{ id: "outro", voiceover: "Thanks for watching." },
		]);

		const result = await script(timeline, loaders);

		expect(result).toContain("# Launch Video");
		expect(result).toContain("## intro");
		expect(result).toContain("Welcome to the launch.");
		expect(result).toContain("## feature");
		expect(result).toContain("Here is the feature.");
		expect(result).toContain("## outro");
		expect(result).toContain("Thanks for watching.");

		// Verify ordering: intro before feature before outro
		const introIdx = result.indexOf("## intro");
		const featureIdx = result.indexOf("## feature");
		const outroIdx = result.indexOf("## outro");
		expect(introIdx).toBeLessThan(featureIdx);
		expect(featureIdx).toBeLessThan(outroIdx);
	});

	it("script_handles_missing_vo", async () => {
		const timeline: Timeline = {
			meta: { title: "Test" },
			segments: [{ id: "intro" }, { id: "silent" }, { id: "outro" }],
		};

		const loaders = makeLoaderMap([
			{ id: "intro", voiceover: "Has VO." },
			{ id: "silent" }, // no voiceover
			{ id: "outro", voiceover: "Also has VO." },
		]);

		const result = await script(timeline, loaders);

		// silent should not have a ## header section in the VO part
		expect(result).not.toContain("## silent");
		// But silent should be listed in the no-VO section
		expect(result).toContain("silent");
		expect(result).toContain("No voiceover");
	});

	it("script_empty_timeline", async () => {
		const timeline: Timeline = {
			meta: { title: "Empty Video" },
			segments: [],
		};

		const loaders: SegmentLoaderMap = new Map();

		const result = await script(timeline, loaders);
		expect(result).toContain("# Empty Video");
		// No segment headers
		expect(result).not.toContain("##");
	});

	it("script_handles_missing_loader", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const timeline: Timeline = {
			meta: { title: "Test" },
			segments: [{ id: "intro" }, { id: "missing" }],
		};

		const loaders = makeLoaderMap([{ id: "intro", voiceover: "Hello." }]);

		const result = await script(timeline, loaders);
		expect(result).toContain("## intro");
		expect(result).toContain("Hello.");

		// Missing loader emits a warning
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("missing"));
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no loader"));

		warnSpy.mockRestore();
	});

	it("script_all_segments_without_vo", async () => {
		const timeline: Timeline = {
			meta: { title: "Silent Movie" },
			segments: [{ id: "scene1" }, { id: "scene2" }],
		};

		const loaders = makeLoaderMap([{ id: "scene1" }, { id: "scene2" }]);

		const result = await script(timeline, loaders);
		expect(result).toContain("# Silent Movie");
		expect(result).toContain("scene1");
		expect(result).toContain("scene2");
		expect(result).toContain("No voiceover");
	});
});
