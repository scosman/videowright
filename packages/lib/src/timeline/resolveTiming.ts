/**
 * Resolve the active timing for a playback or render session.
 *
 * Implements the four-level precedence described in the architecture doc:
 *   1. CLI voiceover (explicit --voiceover <slug>)
 *   2. default_voiceover from timeline.ts
 *   3. default_timing from timeline.ts
 *   4. Per-segment SegmentSpec.advances
 *
 * --voiceover none suppresses levels 1 and 2 but preserves level 3.
 */

import type { SegmentSpec, Timing, Voiceover } from "../types.js";

/** Minimal segment shape needed for timing resolution (id + advances). */
export type TimingSegment = Pick<SegmentSpec, "id" | "advances">;

export type ResolvedTiming = {
	source: "voiceover" | "default_timing" | "segments";
	voiceover?: Voiceover;
	perSegment: Record<string, number[]>;
};

export interface ResolveTimingArgs {
	segments: TimingSegment[];
	defaultTiming?: Timing;
	defaultVoiceover?: Voiceover;
	cliVoiceoverSlug?: string | "none";
	cliVoiceoverModule?: Voiceover;
}

export function resolveTiming(args: ResolveTimingArgs): ResolvedTiming {
	const { segments, defaultTiming, defaultVoiceover, cliVoiceoverSlug, cliVoiceoverModule } = args;

	// Build base from segment advances
	const base: Record<string, number[]> = {};
	for (const seg of segments) {
		base[seg.id] = seg.advances;
	}

	// Determine the active timing source
	const isNone = cliVoiceoverSlug === "none";

	// Level 1: explicit CLI voiceover
	if (!isNone && cliVoiceoverModule) {
		return {
			source: "voiceover",
			voiceover: cliVoiceoverModule,
			perSegment: overlayTiming(base, cliVoiceoverModule.timing),
		};
	}

	// Level 2: default voiceover from timeline
	if (!isNone && defaultVoiceover) {
		return {
			source: "voiceover",
			voiceover: defaultVoiceover,
			perSegment: overlayTiming(base, defaultVoiceover.timing),
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
