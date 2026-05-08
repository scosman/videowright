import { describe, expect, it, vi } from "vitest";
import { defineSegment } from "../../src/segment/defineSegment.js";
import {
	applyMetaDefaults,
	buildSegmentLoaderMap,
	buildTransitionLoaderMap,
	validateTimeline,
} from "../../src/timeline/index.js";
import type { SegmentLoaderMap, TransitionLoaderMap } from "../../src/timeline/index.js";
import type { Config, Timeline, Transition } from "../../src/types.js";

// ---- Helpers ----

function makeSegmentLoaders(...ids: string[]): SegmentLoaderMap {
	const map: SegmentLoaderMap = new Map();
	for (const id of ids) {
		const seg = defineSegment({ id, async play() {} });
		map.set(id, async () => ({ default: seg }));
	}
	return map;
}

function makeTransitionLoaders(...names: string[]): TransitionLoaderMap {
	const map: TransitionLoaderMap = new Map();
	const noop: Transition = async () => {};
	for (const name of names) {
		map.set(name, async () => ({ default: noop }));
	}
	return map;
}

// ---- buildSegmentLoaderMap ----

const stubLoader = () => async () => ({ default: {} as unknown });

describe("buildSegmentLoaderMap", () => {
	it("build_segment_map_simple", () => {
		const glob: Record<string, () => Promise<unknown>> = {
			"/segments/intro/index.ts": stubLoader(),
			"/segments/feature/index.ts": stubLoader(),
			"/segments/outro/index.ts": stubLoader(),
		};

		const map = buildSegmentLoaderMap(glob);
		expect(map.size).toBe(3);
		expect(map.has("intro")).toBe(true);
		expect(map.has("feature")).toBe(true);
		expect(map.has("outro")).toBe(true);
	});

	it("build_segment_map_skips_malformed", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const glob: Record<string, () => Promise<unknown>> = {
			"/segments/intro/index.ts": stubLoader(),
			"/wrong/path.ts": stubLoader(),
			"/segments/nested/deep/index.ts": stubLoader(),
		};

		const map = buildSegmentLoaderMap(glob);
		expect(map.size).toBe(1);
		expect(map.has("intro")).toBe(true);
		expect(warnSpy).toHaveBeenCalledOnce();

		const args = warnSpy.mock.calls[0];
		expect(args[0]).toContain("skipped");
		const errors = args[1] as Array<{ kind: string; path: string }>;
		expect(errors).toHaveLength(2);
		expect(errors[0].kind).toBe("malformed-segment-path");

		warnSpy.mockRestore();
	});

	it("build_segment_map_throws_on_duplicate_id", () => {
		// Duplicate segment ids can't happen with real Vite globs (filesystem prevents it).
		// This is a defensive check. We verify the throw path by calling buildSegmentLoaderMap
		// with a patched Object.keys that yields duplicates.
		const loader = stubLoader();
		const glob: Record<string, () => Promise<unknown>> = {
			"/segments/intro/index.ts": loader,
		};

		const originalKeys = Object.keys;
		Object.keys = ((obj: object) => {
			if (obj === glob) {
				return ["/segments/intro/index.ts", "/segments/intro/index.ts"];
			}
			return originalKeys(obj);
		}) as typeof Object.keys;

		try {
			expect(() => buildSegmentLoaderMap(glob)).toThrow("Duplicate segment id: intro");
		} finally {
			Object.keys = originalKeys;
		}
	});
});

// ---- buildTransitionLoaderMap ----

describe("buildTransitionLoaderMap", () => {
	it("build_transition_map_has_builtins", () => {
		const config: Config = { projectStructure: "v1" };
		const map = buildTransitionLoaderMap(config);

		expect(map.has("cut")).toBe(true);
		expect(map.has("fade")).toBe(true);
		expect(map.has("slideLeft")).toBe(true);
		expect(map.has("slideRight")).toBe(true);
		expect(map.has("slideUp")).toBe(true);
		expect(map.has("slideDown")).toBe(true);
		expect(map.size).toBe(6);
	});

	it("build_transition_map_user_overrides_warn", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const noop: Transition = async () => {};
		const customLoader = async () => ({ default: noop });
		const config: Config = {
			projectStructure: "v1",
			transitions: {
				fade: customLoader,
			},
		};

		const map = buildTransitionLoaderMap(config);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("fade"));
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("shadows"));

		// User's loader wins
		const loader = map.get("fade");
		expect(loader).toBe(customLoader);

		warnSpy.mockRestore();
	});

	it("build_transition_map_no_user_transitions", () => {
		const config: Config = { projectStructure: "v1" };
		const map = buildTransitionLoaderMap(config);
		expect(map.size).toBe(6);
	});
});

// ---- validateTimeline ----

describe("validateTimeline", () => {
	it("validate_passes_for_valid_timeline", () => {
		const timeline: Timeline = {
			meta: { title: "My Video" },
			segments: [
				{ id: "intro" },
				{ id: "feature", transition: "fade" },
				{ id: "outro", transition: { type: "slideLeft" } },
			],
		};

		const segLoaders = makeSegmentLoaders("intro", "feature", "outro");
		const transLoaders = makeTransitionLoaders("fade", "slideLeft");

		const result = validateTimeline(timeline, segLoaders, transLoaders);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.timeline).toBe(timeline);
		}
	});

	it("validate_missing_segment", () => {
		const timeline: Timeline = {
			meta: { title: "Test Video" },
			segments: [{ id: "foo" }],
		};

		const segLoaders = makeSegmentLoaders();
		const transLoaders = makeTransitionLoaders();

		const result = validateTimeline(timeline, segLoaders, transLoaders);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].kind).toBe("missing-segment");
			if (result.errors[0].kind === "missing-segment") {
				expect(result.errors[0].segmentId).toBe("foo");
				expect(result.errors[0].timelineTitle).toBe("Test Video");
			}
		}
	});

	it("validate_missing_transition_string", () => {
		const timeline: Timeline = {
			meta: { title: "Test" },
			segments: [{ id: "intro", transition: "morph" }],
		};

		const segLoaders = makeSegmentLoaders("intro");
		const transLoaders = makeTransitionLoaders();

		const result = validateTimeline(timeline, segLoaders, transLoaders);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].kind).toBe("missing-transition");
			if (result.errors[0].kind === "missing-transition") {
				expect(result.errors[0].transitionName).toBe("morph");
				expect(result.errors[0].segmentId).toBe("intro");
			}
		}
	});

	it("validate_missing_transition_object", () => {
		const timeline: Timeline = {
			meta: { title: "Test" },
			segments: [{ id: "intro", transition: { type: "morph" } }],
		};

		const segLoaders = makeSegmentLoaders("intro");
		const transLoaders = makeTransitionLoaders();

		const result = validateTimeline(timeline, segLoaders, transLoaders);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].kind).toBe("missing-transition");
			if (result.errors[0].kind === "missing-transition") {
				expect(result.errors[0].transitionName).toBe("morph");
			}
		}
	});

	it("validate_missing_title", () => {
		const timeline = {
			meta: { title: "" },
			segments: [{ id: "intro" }],
		} as Timeline;

		const segLoaders = makeSegmentLoaders("intro");
		const transLoaders = makeTransitionLoaders();

		const result = validateTimeline(timeline, segLoaders, transLoaders);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.some((e) => e.kind === "missing-title")).toBe(true);
		}
	});

	it("validate_aggregates_multiple_errors", () => {
		const timeline: Timeline = {
			meta: { title: "" },
			segments: [{ id: "missing1" }, { id: "missing2", transition: "unknown" }],
		};

		const segLoaders = makeSegmentLoaders();
		const transLoaders = makeTransitionLoaders();

		const result = validateTimeline(timeline, segLoaders, transLoaders);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			// missing-title + 2 missing-segment + 1 missing-transition = 4
			expect(result.errors.length).toBeGreaterThanOrEqual(4);
			const kinds = result.errors.map((e) => e.kind);
			expect(kinds).toContain("missing-title");
			expect(kinds).toContain("missing-segment");
			expect(kinds).toContain("missing-transition");

			// When title is empty, missing-segment errors use "(untitled)" fallback
			const segErr = result.errors.find((e) => e.kind === "missing-segment");
			if (segErr?.kind === "missing-segment") {
				expect(segErr.timelineTitle).toBe("(untitled)");
			}
		}
	});
});

// ---- applyMetaDefaults ----

describe("applyMetaDefaults", () => {
	it("apply_meta_defaults_fills_missing", () => {
		const timeline: Timeline = {
			meta: { title: "My Video" },
			segments: [],
		};

		const config: Config = {
			projectStructure: "v1",
			defaults: {
				resolution: [3840, 2160],
				fps: 30,
				aspectRatio: "4:3",
			},
		};

		const result = applyMetaDefaults(timeline, config);
		expect(result.meta.resolution).toEqual([3840, 2160]);
		expect(result.meta.fps).toBe(30);
		expect(result.meta.aspectRatio).toBe("4:3");
		expect(result.meta.title).toBe("My Video");
		// Original not mutated
		expect(timeline.meta.resolution).toBeUndefined();
	});

	it("apply_meta_defaults_keeps_present", () => {
		const timeline: Timeline = {
			meta: {
				title: "Test",
				resolution: [1280, 720],
				fps: 24,
				aspectRatio: "21:9",
			},
			segments: [],
		};

		const config: Config = {
			projectStructure: "v1",
			defaults: {
				resolution: [3840, 2160],
				fps: 60,
				aspectRatio: "16:9",
			},
		};

		const result = applyMetaDefaults(timeline, config);
		expect(result.meta.resolution).toEqual([1280, 720]);
		expect(result.meta.fps).toBe(24);
		expect(result.meta.aspectRatio).toBe("21:9");
	});

	it("apply_meta_defaults_falls_back_to_lib_default", () => {
		const timeline: Timeline = {
			meta: { title: "Test" },
			segments: [],
		};

		const config: Config = { projectStructure: "v1" };

		const result = applyMetaDefaults(timeline, config);
		expect(result.meta.resolution).toEqual([1920, 1080]);
		expect(result.meta.fps).toBe(60);
		expect(result.meta.aspectRatio).toBe("16:9");
	});
});
