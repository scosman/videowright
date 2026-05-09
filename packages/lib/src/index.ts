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

// Timeline loader
export {
	buildSegmentLoaderMap,
	buildTransitionLoaderMap,
	validateTimeline,
	validateSegmentAdvances,
	applyMetaDefaults,
} from "./timeline/index.js";
export type {
	SegmentLoaderMap,
	TransitionLoaderMap,
	TimelineError,
	TimelineValidationResult,
	AdvancesValidationResult,
} from "./timeline/index.js";

// Built-in transitions
export {
	cut,
	fade,
	slideLeft,
	slideRight,
	slideUp,
	slideDown,
} from "./player/transitions/index.js";

// Script helper
export { script } from "./script/index.js";

// Player
export { Player } from "./player/index.js";
export type { PlayerOptions } from "./player/index.js";
