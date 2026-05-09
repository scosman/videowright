/**
 * Public types for the Videowright library.
 */

// ---- Segment brand ----

export const SEGMENT_BRAND: unique symbol = Symbol.for("videowright.segment");

// ---- PlayerContext ----

/** Runtime context passed to segment lifecycle methods. */
export interface PlayerContext {
	/** Pauses play() until the next user advance (interactive) or scheduled beat (render). */
	waitForNext(): Promise<void>;
	/** Pauses play() for the given duration in milliseconds. */
	hold(ms: number): Promise<void>;
	/** Aborted when the segment is unmounted. */
	signal: AbortSignal;
	/** Current player mode. */
	mode: "interactive" | "render";
	/** Milliseconds since this segment instance was mounted. */
	clock(): number;
}

// ---- Segment ----

/** User-facing spec passed to defineSegment. */
export interface SegmentSpec {
	/** Unique id matching the segment's folder name under segments/. */
	id: string;
	/**
	 * Segment-relative seconds at which to fire each 'next' advance during render/record.
	 * Must be monotonically increasing. All values must be positive numbers.
	 *
	 * Length = number of triggerNext() calls required to traverse this segment, INCLUDING
	 * the final press that transitions to the next segment.
	 *
	 * Examples:
	 * - `play() { await ctx.hold(3000); }` -> 1 press total -> `advances: [3.0]`
	 * - `play() { await ctx.waitForNext(); }` -> 2 presses -> `advances: [t1, t2]`
	 * - `play() { await ctx.waitForNext(); await ctx.waitForNext(); }` -> 3 presses -> `advances: [t1, t2, t3]`
	 *
	 * Ignored in dev (interactive) mode -- interactive presses drive timing.
	 * REQUIRED on every segment.
	 */
	advances: number[];
	/** Voiceover text for this segment (used by script() helper and HUD). */
	voiceover?: string;
	/** Freeform notes (not rendered). */
	notes?: string;
	/** Called when the player gives the segment its host element. Optional. */
	mount?(el: HTMLElement, ctx: PlayerContext): void | Promise<void>;
	/** Main animation/content logic. Required. */
	play(ctx: PlayerContext): Promise<void>;
	/** Called when the segment is removed. Optional. */
	unmount?(): void;
	/** Override default next behavior. Return true to consume the press. */
	next?(): boolean;
	/** Override default prev behavior. Return true to consume the press. */
	prev?(): boolean;
}

/** A validated segment object returned by defineSegment. */
export interface Segment extends SegmentSpec {
	readonly [SEGMENT_BRAND]: true;
}

// ---- Timeline ----

/** A single entry in a timeline's segments array. */
export interface TimelineEntry {
	/** Segment id to resolve (maps to segments/<id>/index.ts). */
	id: string;
	/** Transition to use when entering this segment. String name or configured object. */
	transition?: string | { type: string; [k: string]: unknown };
}

/** Timeline-level metadata. */
export interface TimelineMeta {
	/** Video title (required). */
	title: string;
	/** Style slug for this video. Falls back to config defaultStyle. */
	style?: string;
	/** Aspect ratio string, e.g. '16:9'. Falls back to config default. */
	aspectRatio?: string;
	/** Resolution as [width, height]. Falls back to config default. */
	resolution?: [number, number];
	/** Frames per second. Falls back to config default. */
	fps?: number;
}

/** A complete timeline definition (default export of a timeline.ts file). */
export interface Timeline {
	meta: TimelineMeta;
	segments: TimelineEntry[];
}

// ---- Transition ----

/** Context passed to transition functions. */
export interface TransitionContext {
	direction: "forward" | "backward";
	duration?: number;
}

/** A transition function that animates between two slot elements. */
export type Transition = (
	outgoing: HTMLElement,
	incoming: HTMLElement,
	ctx: TransitionContext,
) => Promise<void>;

// ---- Config ----

/** Repo-wide configuration from videowright.config.ts. */
export interface Config {
	/** Setup marker; bumped when layout changes. */
	projectStructure: "v1";
	/** Slug of the default style in styles/<slug>/. Required after setup. */
	defaultStyle?: string;
	/** Default values for timeline meta fields. */
	defaults?: {
		resolution?: [number, number];
		fps?: number;
		aspectRatio?: string;
	};
	/** Custom transition loaders keyed by name. */
	transitions?: Record<string, () => Promise<{ default: Transition }>>;
}
