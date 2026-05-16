/**
 * Resolve the active timing for a playback or render session.
 *
 * Implements the four-level precedence described in the architecture doc:
 *   1. CLI audio track (explicit --audio-track <id>)
 *   2. default_audio_track from timeline.ts
 *   3. default_timing from timeline.ts
 *   4. Per-segment SegmentSpec.advances
 *
 * --audio-track none suppresses levels 1 and 2 but preserves level 3.
 */

import type { AudioTrack, SegmentSpec, Timing } from "../types.js";

/** Minimal segment shape needed for timing resolution (id + advances). */
export type TimingSegment = Pick<SegmentSpec, "id" | "advances">;

export type ResolvedTiming = {
	source: "audio_track" | "default_timing" | "segments";
	audioTrack?: AudioTrack;
	perSegment: Record<string, number[]>;
};

export interface ResolveTimingArgs {
	segments: TimingSegment[];
	defaultTiming?: Timing;
	defaultAudioTrack?: AudioTrack;
	cliAudioTrackId?: string | "none";
	cliAudioTrackModule?: AudioTrack;
}

export function resolveTiming(args: ResolveTimingArgs): ResolvedTiming {
	const { segments, defaultTiming, defaultAudioTrack, cliAudioTrackId, cliAudioTrackModule } = args;

	// Build base from segment advances
	const base: Record<string, number[]> = {};
	for (const seg of segments) {
		base[seg.id] = seg.advances;
	}

	// Determine the active timing source
	const isNone = cliAudioTrackId === "none";

	// Level 1: explicit CLI audio track
	if (!isNone && cliAudioTrackModule) {
		return {
			source: "audio_track",
			audioTrack: cliAudioTrackModule,
			perSegment: overlayTiming(base, cliAudioTrackModule.timing),
		};
	}

	// Level 2: default audio track from timeline
	if (!isNone && defaultAudioTrack) {
		return {
			source: "audio_track",
			audioTrack: defaultAudioTrack,
			perSegment: overlayTiming(base, defaultAudioTrack.timing),
		};
	}

	// Level 3: default timing
	if (defaultTiming) {
		return {
			source: "default_timing",
			perSegment: overlayTiming(base, defaultTiming),
		};
	}

	// Level 4: segment advances only
	return {
		source: "segments",
		perSegment: base,
	};
}

/**
 * Overlay a Timing's perSegment entries on top of a base record.
 * Segments present in the Timing win; absent segments keep their base value.
 */
function overlayTiming(base: Record<string, number[]>, timing: Timing): Record<string, number[]> {
	const result = { ...base };
	for (const [segId, advances] of Object.entries(timing.perSegment)) {
		if (advances) {
			result[segId] = advances;
		}
	}
	return result;
}
