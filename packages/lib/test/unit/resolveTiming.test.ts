import { describe, expect, it } from "vitest";
import type { TimingSegment } from "../../src/timeline/resolveTiming.js";
import { resolveTiming } from "../../src/timeline/resolveTiming.js";
import type { AudioTrack, Timing } from "../../src/types.js";

function makeSegment(id: string, advances: number[]): TimingSegment {
	return { id, advances };
}

function makeTiming(perSegment: Record<string, number[]>): Timing {
	return { perSegment };
}

function makeAudioTrack(timing: Timing): AudioTrack {
	return {
		audio_file: "track.mp3",
		length_s: 10,
		timing,
	};
}

describe("resolveTiming", () => {
	const segA = makeSegment("intro", [2, 4]);
	const segB = makeSegment("body", [3, 6, 9]);
	const segments = [segA, segB];

	it("falls_back_to_segment_advances_when_nothing_else_provided", () => {
		const result = resolveTiming({ segments });
		expect(result.source).toBe("segments");
		expect(result.audioTrack).toBeUndefined();
		expect(result.perSegment).toEqual({
			intro: [2, 4],
			body: [3, 6, 9],
		});
	});

	it("uses_default_timing_when_no_audio_track", () => {
		const defaultTiming = makeTiming({ intro: [1, 3] });
		const result = resolveTiming({ segments, defaultTiming });
		expect(result.source).toBe("default_timing");
		expect(result.audioTrack).toBeUndefined();
		expect(result.perSegment.intro).toEqual([1, 3]);
		// Body not in the Timing overlay => falls back to segment advances
		expect(result.perSegment.body).toEqual([3, 6, 9]);
	});

	it("uses_default_audio_track_over_default_timing", () => {
		const defaultTiming = makeTiming({ intro: [10, 20] });
		const trackTiming = makeTiming({ intro: [5, 8] });
		const defaultAudioTrack = makeAudioTrack(trackTiming);

		const result = resolveTiming({ segments, defaultTiming, defaultAudioTrack });
		expect(result.source).toBe("audio_track");
		expect(result.audioTrack).toBe(defaultAudioTrack);
		expect(result.perSegment.intro).toEqual([5, 8]);
		expect(result.perSegment.body).toEqual([3, 6, 9]);
	});

	it("uses_cli_audio_track_over_default_audio_track", () => {
		const defaultTrack = makeAudioTrack(makeTiming({ intro: [10, 20] }));
		const cliTrack = makeAudioTrack(makeTiming({ body: [1, 2, 3] }));

		const result = resolveTiming({
			segments,
			defaultAudioTrack: defaultTrack,
			cliAudioTrackId: "v2",
			cliAudioTrackModule: cliTrack,
		});
		expect(result.source).toBe("audio_track");
		expect(result.audioTrack).toBe(cliTrack);
		expect(result.perSegment.intro).toEqual([2, 4]); // not overridden by cliTrack
		expect(result.perSegment.body).toEqual([1, 2, 3]);
	});

	it("none_suppresses_audio_tracks_but_keeps_default_timing", () => {
		const defaultTiming = makeTiming({ intro: [7, 14] });
		const defaultTrack = makeAudioTrack(makeTiming({ intro: [99, 99] }));

		const result = resolveTiming({
			segments,
			defaultTiming,
			defaultAudioTrack: defaultTrack,
			cliAudioTrackId: "none",
		});
		expect(result.source).toBe("default_timing");
		expect(result.audioTrack).toBeUndefined();
		expect(result.perSegment.intro).toEqual([7, 14]);
	});

	it("none_falls_back_to_segments_when_no_default_timing", () => {
		const defaultTrack = makeAudioTrack(makeTiming({ intro: [99, 99] }));

		const result = resolveTiming({
			segments,
			defaultAudioTrack: defaultTrack,
			cliAudioTrackId: "none",
		});
		expect(result.source).toBe("segments");
		expect(result.audioTrack).toBeUndefined();
		expect(result.perSegment.intro).toEqual([2, 4]);
	});

	it("partial_timing_overlay_only_affects_specified_segments", () => {
		const trackTiming = makeTiming({ body: [2, 4, 6] });
		const cliTrack = makeAudioTrack(trackTiming);

		const result = resolveTiming({
			segments,
			cliAudioTrackId: "v1",
			cliAudioTrackModule: cliTrack,
		});
		// intro not in trackTiming => falls back to segment advances
		expect(result.perSegment.intro).toEqual([2, 4]);
		expect(result.perSegment.body).toEqual([2, 4, 6]);
	});

	it("empty_segments_returns_empty_perSegment", () => {
		const result = resolveTiming({ segments: [] });
		expect(result.source).toBe("segments");
		expect(result.perSegment).toEqual({});
	});

	it("cli_audio_track_module_without_id_is_still_used", () => {
		// cliAudioTrackModule present but no cliAudioTrackId -- the module is
		// truthy and id is not "none", so it takes precedence.
		const cliTrack = makeAudioTrack(makeTiming({ intro: [99] }));
		const result = resolveTiming({
			segments,
			cliAudioTrackModule: cliTrack,
		});
		expect(result.source).toBe("audio_track");
		expect(result.audioTrack).toBe(cliTrack);
		expect(result.perSegment.intro).toEqual([99]);
	});
});
