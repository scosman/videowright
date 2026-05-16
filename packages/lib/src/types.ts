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
	 * Segment-relative seconds at which to fire each 'next' advance during render.
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

/** TimelineMeta after applyMetaDefaults has filled in resolution, fps, and aspectRatio. */
export type ResolvedTimelineMeta = TimelineMeta &
	Required<Pick<TimelineMeta, "resolution" | "fps" | "aspectRatio">>;

/** A complete timeline definition (default export of a timeline.ts file). */
export interface Timeline {
	meta: TimelineMeta;
	segments: TimelineEntry[];
	/** Standalone timing overrides (used when no audio track is active). */
	default_timing?: Timing;
	/** Default audio track for this video. */
	default_audio_track?: AudioTrack;
}

// ---- Timing ----

/**
 * Per-segment advance schedule overrides. Used by voiceovers and as a
 * standalone timing layer (`default_timing` on Timeline).
 *
 * Keys are segment ids; values are advance times in seconds (same units as
 * SegmentSpec.advances). A Timing only needs to specify segments it wants
 * to override -- unspecified segments fall back to their own `advances`.
 */
export type Timing = {
	perSegment: Partial<Record<string, number[]>>;
};

// ---- Voiceover ----

/**
 * A single voiceover for a video. Stored at
 * `videos/<video>/audio/originals/voiceovers/<slug>/voiceover.ts`.
 */
export type Voiceover = {
	/**
	 * Audio file path, relative to the voiceover.ts file's directory (e.g.,
	 * `"./audio.mp3"`). After loading via `loadVoiceover()`, rewritten to an
	 * absolute path.
	 *
	 * Note: this differs from `AudioTrack.audio_file` which is relative to
	 * the video folder. The difference exists because voiceover modules are
	 * loaded by `loadVoiceover()` which knows the voiceover.ts location,
	 * while audio tracks are imported into timeline.ts and resolved from the
	 * video folder by render.ts.
	 */
	audio_file: string;
	/** Provider that produced the audio. */
	provider: "elevenlabs" | "manual";
	/**
	 * Provider timing JSON path. Same resolution rules as `audio_file`:
	 * relative to voiceover.ts directory on disk, absolute after
	 * `loadVoiceover()`.
	 */
	provider_timing_file?: string;
	/** Per-segment advance timing synced to this audio. */
	timing: Timing;
	/** Freeform notes about this voiceover. */
	notes?: string;
	/**
	 * ElevenLabs voice ID for this voiceover. Used by the API flow to select
	 * the voice for TTS generation. When omitted, defaults to Asher
	 * (`tMvyQtpCVQ0DkixuYm6J`). Ignored when provider is "manual".
	 */
	eleven_labs_voice_id?: string;
};

// ---- Audio Track ----

/**
 * A rendered audio track for a video. Stored at
 * `videos/<video>/audio/tracks/<id>/track.ts`.
 *
 * Combines voice-over, SFX, and music into a single rendered audio file.
 * The timeline references the active track via `default_audio_track`.
 */
export type AudioTrack = {
	/**
	 * Path to the rendered audio file, relative to the video folder (the
	 * directory containing timeline.ts). Both loadAudioTrack() and the
	 * default_audio_track import path resolve this from the video folder.
	 * loadAudioTrack() rewrites it to an absolute path on return.
	 */
	audio_file: string;

	/** Length of the rendered audio in seconds. */
	length_s: number;

	/**
	 * Per-segment advance timing synced to this audio track. Computed by the
	 * sync-to-audio skill from the plan_snapshot + per-cue VO timing.json files.
	 * Same shape and semantics as Voiceover.timing.
	 */
	timing: Timing;

	/** Path to the audio plan that produced this track (relative to track.ts). */
	audio_plan_path?: string;

	/** Path to the point-in-time plan snapshot for this track (relative to track.ts). */
	plan_snapshot_path?: string;

	/** ISO timestamp when this track was rendered. */
	created_at?: string;

	/** Freeform notes about this track. */
	notes?: string;
};

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

// ---- Project discovery ----

/** Summary of a single video for the homepage and routing. */
export interface VideoSummary {
	/** Directory name under videos/ -- also the URL slug. */
	slug: string;
	/** Absolute path to videos/<slug>/timeline.ts. */
	timelinePath: string;
	/** meta.title from the timeline. Falls back to slug if load failed. */
	title: string;
	/** Resolved style: meta.style ?? config.defaultStyle ?? "unknown". */
	style: string;
	/** mtime of timeline.ts (epoch ms). Used for sort order. */
	mtimeMs: number;
	/** Error message if loading the timeline threw. */
	loadError?: string;
}

/** Project-level info exposed to the browser via a virtual module. */
export interface ProjectInfo {
	/** Basename of cwd. Shown in the top bar. */
	projectName: string;
	/** Videos sorted by mtime descending. */
	videos: VideoSummary[];
}

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
