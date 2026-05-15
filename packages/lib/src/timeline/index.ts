import type { Config, ResolvedTimelineMeta, Segment, Timeline, Transition } from "../types.js";

// Re-export browser-safe helpers only.
// Node-only helpers (loadVoiceover, validateTiming, validateVoiceover) are
// imported directly from their own modules by CLI code to avoid pulling
// node:fs into browser bundles.
export { resolveTiming } from "./resolveTiming.js";
export type { ResolvedTiming, ResolveTimingArgs, TimingSegment } from "./resolveTiming.js";

// ---- Loader map types ----

export type SegmentLoaderMap = Map<string, () => Promise<{ default: Segment }>>;
export type TransitionLoaderMap = Map<string, () => Promise<{ default: Transition }>>;

// ---- Error types ----

export type TimelineError =
	| { kind: "missing-segment"; segmentId: string; timelineTitle: string }
	| { kind: "missing-transition"; transitionName: string; segmentId: string }
	| { kind: "missing-title" }
	| { kind: "malformed-segment-path"; path: string };

export type TimelineValidationResult =
	| { ok: true; timeline: Timeline }
	| { ok: false; errors: TimelineError[] };

// ---- Segment path regex ----

const SEGMENT_PATH_RE = /^\/segments\/([^/]+)\/index\.ts$/;

// ---- Functions ----

/**
 * Build a segment id -> loader map from a Vite glob result.
 * Input: Record<string, () => Promise<unknown>> from import.meta.glob('/segments/* /index.ts').
 */
export function buildSegmentLoaderMap(
	globResult: Record<string, () => Promise<unknown>>,
): SegmentLoaderMap {
	const map: SegmentLoaderMap = new Map();
	const warnings: TimelineError[] = [];

	for (const path of Object.keys(globResult)) {
		const m = path.match(SEGMENT_PATH_RE);
		if (!m) {
			warnings.push({ kind: "malformed-segment-path", path });
			continue;
		}
		const id = m[1];
		if (map.has(id)) {
			throw new Error(`Duplicate segment id: ${id} (path: ${path})`);
		}
		map.set(id, globResult[path] as () => Promise<{ default: Segment }>);
	}

	if (warnings.length) {
		console.warn("buildSegmentLoaderMap: some paths skipped", warnings);
	}

	return map;
}

/**
 * Build a transition name -> loader map, combining built-ins with user-registered transitions.
 */
export function buildTransitionLoaderMap(config: Config): TransitionLoaderMap {
	const map: TransitionLoaderMap = new Map();

	// Built-ins
	map.set("cut", () => import("../player/transitions/cut.js"));
	map.set("fade", () => import("../player/transitions/fade.js"));
	map.set("slideLeft", () =>
		import("../player/transitions/slide.js").then((m) => ({ default: m.slideLeft })),
	);
	map.set("slideRight", () =>
		import("../player/transitions/slide.js").then((m) => ({ default: m.slideRight })),
	);
	map.set("slideUp", () =>
		import("../player/transitions/slide.js").then((m) => ({ default: m.slideUp })),
	);
	map.set("slideDown", () =>
		import("../player/transitions/slide.js").then((m) => ({ default: m.slideDown })),
	);

	// User-registered
	for (const [name, loader] of Object.entries(config.transitions ?? {})) {
		if (map.has(name)) {
			console.warn(`Custom transition "${name}" shadows a built-in.`);
		}
		map.set(name, loader);
	}

	return map;
}

/**
 * Validate a timeline against segment and transition loader maps.
 * Returns ok:true with the timeline, or ok:false with accumulated errors.
 */
export function validateTimeline(
	timeline: Timeline,
	segmentLoaders: SegmentLoaderMap,
	transitionLoaders: TransitionLoaderMap,
): TimelineValidationResult {
	const errors: TimelineError[] = [];

	if (!timeline.meta.title || timeline.meta.title.trim() === "") {
		errors.push({ kind: "missing-title" });
	}

	const titleForErrors =
		timeline.meta.title && timeline.meta.title.trim() !== "" ? timeline.meta.title : "(untitled)";

	for (const entry of timeline.segments) {
		if (!segmentLoaders.has(entry.id)) {
			errors.push({
				kind: "missing-segment",
				segmentId: entry.id,
				timelineTitle: titleForErrors,
			});
		}

		if (entry.transition) {
			const transitionName =
				typeof entry.transition === "string" ? entry.transition : entry.transition.type;
			if (!transitionLoaders.has(transitionName)) {
				errors.push({
					kind: "missing-transition",
					transitionName,
					segmentId: entry.id,
				});
			}
		}
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}
	return { ok: true, timeline };
}

// ---- Segment advances validation ----

export type AdvancesValidationResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Validate that all segments referenced by a timeline have valid `advances` arrays.
 *
 * Accepts a `Record<string, number[]>` mapping segment id to its advances array.
 * This map is produced in the browser context (entry_client.ts / render_entry.ts)
 * where segment modules are loaded via Vite and can import browser-only assets
 * (CSS, JSON, images) that Node's tsImport cannot handle.
 *
 * Checks per segment:
 * - `advances` is defined and non-empty.
 * - `advances` is monotonically increasing.
 * - All entries are positive numbers.
 */
export function validateSegmentAdvances(
	timeline: Timeline,
	advancesMap: Record<string, number[]>,
): AdvancesValidationResult {
	const errors: string[] = [];

	for (const entry of timeline.segments) {
		const advances = advancesMap[entry.id];

		if (!advances || !Array.isArray(advances) || advances.length === 0) {
			errors.push(
				`Segment "${entry.id}": missing or empty 'advances' array. Every segment must declare advances for render timing.`,
			);
			continue;
		}

		for (let i = 0; i < advances.length; i++) {
			const v = advances[i];
			if (typeof v !== "number" || v <= 0 || !Number.isFinite(v)) {
				errors.push(`Segment "${entry.id}": advances[${i}] must be a positive number (got ${v})`);
			}
			if (i > 0 && v <= advances[i - 1]) {
				errors.push(
					`Segment "${entry.id}": advances must be monotonically increasing ` +
						`(advances[${i}]=${v} <= advances[${i - 1}]=${advances[i - 1]})`,
				);
			}
		}
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}
	return { ok: true };
}

/**
 * Apply config defaults to timeline meta. Returns a new Timeline without mutating.
 * Priority: timeline meta > config.defaults > hardcoded fallbacks.
 * The returned meta is guaranteed to have resolution, fps, and aspectRatio set.
 */
export function applyMetaDefaults(
	timeline: Timeline,
	config: Config,
): Timeline & { meta: ResolvedTimelineMeta } {
	const d = config.defaults ?? {};
	return {
		...timeline,
		meta: {
			...timeline.meta,
			resolution: timeline.meta.resolution ?? d.resolution ?? [1920, 1080],
			fps: timeline.meta.fps ?? d.fps ?? 60,
			aspectRatio: timeline.meta.aspectRatio ?? d.aspectRatio ?? "16:9",
		},
	};
}
