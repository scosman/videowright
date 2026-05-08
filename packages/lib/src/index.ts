// Public API barrel -- exports added as modules are implemented.

// Types
export type {
	PlayerContext,
	SegmentSpec,
	Segment,
	TimelineEntry,
	TimelineMeta,
	Timeline,
	Transition,
	TransitionContext,
	Config,
} from "./types.js";
export { SEGMENT_BRAND } from "./types.js";

// Segment authoring
export { defineSegment } from "./segment/index.js";
export { defineConfig } from "./segment/index.js";
