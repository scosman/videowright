import type { Config, Segment, Timeline, Transition } from "../types.js";

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

/**
 * Apply config defaults to timeline meta. Returns a new Timeline without mutating.
 * Priority: timeline meta > config.defaults > hardcoded fallbacks.
 */
export function applyMetaDefaults(timeline: Timeline, config: Config): Timeline {
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
