import { describe, expect, it } from "vitest";
import type { TimingSegment } from "../../src/timeline/resolveTiming.js";
import { resolveTiming } from "../../src/timeline/resolveTiming.js";
import type { Timing, Voiceover } from "../../src/types.js";

function makeSegment(id: string, advances: number[]): TimingSegment {
	return { id, advances };
}

function makeTiming(perSegment: Record<string, number[]>): Timing {
	return { perSegment };
}

function makeVoiceover(timing: Timing): Voiceover {
	return {
		audio_file: "audio.mp3",
		provider: "elevenlabs",
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
		expect(result.voiceover).toBeUndefined();
		expect(result.perSegment).toEqual({
			intro: [2, 4],
			body: [3, 6, 9],
		});
	});

	it("uses_default_timing_when_no_voiceover", () => {
		const defaultTiming = makeTiming({ intro: [1, 3] });
		const result = resolveTiming({ segments, defaultTiming });
		expect(result.source).toBe("default_timing");
		expect(result.voiceover).toBeUndefined();
		expect(result.perSegment.intro).toEqual([1, 3]);
		// Body not in the Timing overlay => falls back to segment advances
		expect(result.perSegment.body).toEqual([3, 6, 9]);
	});

	it("uses_default_voiceover_over_default_timing", () => {
		const defaultTiming = makeTiming({ intro: [10, 20] });
		const voTiming = makeTiming({ intro: [5, 8] });
		const defaultVoiceover = makeVoiceover(voTiming);

		const result = resolveTiming({ segments, defaultTiming, defaultVoiceover });
		expect(result.source).toBe("voiceover");
		expect(result.voiceover).toBe(defaultVoiceover);
		expect(result.perSegment.intro).toEqual([5, 8]);
		expect(result.perSegment.body).toEqual([3, 6, 9]);
	});

	it("uses_cli_voiceover_over_default_voiceover", () => {
		const defaultVo = makeVoiceover(makeTiming({ intro: [10, 20] }));
		const cliVo = makeVoiceover(makeTiming({ body: [1, 2, 3] }));

		const result = resolveTiming({
			segments,
			defaultVoiceover: defaultVo,
			cliVoiceoverSlug: "custom",
			cliVoiceoverModule: cliVo,
		});
		expect(result.source).toBe("voiceover");
		expect(result.voiceover).toBe(cliVo);
		expect(result.perSegment.intro).toEqual([2, 4]); // not overridden by cliVo
		expect(result.perSegment.body).toEqual([1, 2, 3]);
	});

	it("none_suppresses_voiceovers_but_keeps_default_timing", () => {
		const defaultTiming = makeTiming({ intro: [7, 14] });
		const defaultVo = makeVoiceover(makeTiming({ intro: [99, 99] }));

		const result = resolveTiming({
			segments,
			defaultTiming,
			defaultVoiceover: defaultVo,
			cliVoiceoverSlug: "none",
		});
		expect(result.source).toBe("default_timing");
		expect(result.voiceover).toBeUndefined();
		expect(result.perSegment.intro).toEqual([7, 14]);
	});

	it("none_falls_back_to_segments_when_no_default_timing", () => {
		const defaultVo = makeVoiceover(makeTiming({ intro: [99, 99] }));

		const result = resolveTiming({
			segments,
			defaultVoiceover: defaultVo,
			cliVoiceoverSlug: "none",
		});
		expect(result.source).toBe("segments");
		expect(result.voiceover).toBeUndefined();
		expect(result.perSegment.intro).toEqual([2, 4]);
	});

	it("partial_timing_overlay_only_affects_specified_segments", () => {
		const voTiming = makeTiming({ body: [2, 4, 6] });
		const cliVo = makeVoiceover(voTiming);

		const result = resolveTiming({
			segments,
			cliVoiceoverSlug: "test",
			cliVoiceoverModule: cliVo,
		});
		// intro not in voTiming => falls back to segment advances
		expect(result.perSegment.intro).toEqual([2, 4]);
		expect(result.perSegment.body).toEqual([2, 4, 6]);
	});

	it("empty_segments_returns_empty_perSegment", () => {
		const result = resolveTiming({ segments: [] });
		expect(result.source).toBe("segments");
		expect(result.perSegment).toEqual({});
	});

	it("cli_voiceover_module_without_slug_is_still_used", () => {
		// cliVoiceoverModule present but no cliVoiceoverSlug -- the module is
		// truthy and slug is not "none", so it takes precedence.
		const cliVo = makeVoiceover(makeTiming({ intro: [99] }));
		const result = resolveTiming({
			segments,
			cliVoiceoverModule: cliVo,
		});
		expect(result.source).toBe("voiceover");
		expect(result.voiceover).toBe(cliVo);
		expect(result.perSegment.intro).toEqual([99]);
	});
});
