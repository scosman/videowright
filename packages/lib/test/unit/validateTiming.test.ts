import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateTiming, validateVoiceover } from "../../src/timeline/validateTiming.js";
import type { Timing, Voiceover } from "../../src/types.js";

const tmpDir = resolve(import.meta.dirname ?? __dirname, "../../.tmp-test-validateTiming");

describe("validateTiming", () => {
	const segmentIds = ["intro", "body", "outro"];

	it("valid_timing_passes", () => {
		const timing: Timing = { perSegment: { intro: [2, 4], body: [3] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.warnings).toHaveLength(0);
		}
	});

	it("unknown_segment_id_warns", () => {
		const timing: Timing = { perSegment: { intro: [2], nonexistent: [3] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.warnings).toHaveLength(1);
			expect(result.warnings[0]).toContain("nonexistent");
		}
	});

	it("non_positive_value_errors", () => {
		const timing: Timing = { perSegment: { intro: [0] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0]).toContain("positive");
		}
	});

	it("negative_value_errors", () => {
		const timing: Timing = { perSegment: { intro: [-1] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(false);
	});

	it("non_finite_value_errors", () => {
		const timing: Timing = { perSegment: { intro: [Number.POSITIVE_INFINITY] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0]).toContain("finite");
		}
	});

	it("NaN_value_errors", () => {
		const timing: Timing = { perSegment: { intro: [Number.NaN] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(false);
	});

	it("empty_advances_array_errors", () => {
		const timing: Timing = { perSegment: { intro: [] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0]).toContain("empty");
		}
	});

	it("empty_perSegment_passes", () => {
		const timing: Timing = { perSegment: {} };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(true);
	});

	it("errors_and_warnings_can_coexist", () => {
		const timing: Timing = { perSegment: { unknown_seg: [0] } };
		const result = validateTiming(timing, segmentIds);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.errors.length).toBeGreaterThan(0);
		}
	});
});

describe("validateVoiceover", () => {
	beforeEach(() => {
		mkdirSync(tmpDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("missing_audio_file_errors", () => {
		const vo: Voiceover = {
			audio_file: "nonexistent.mp3",
			provider: "elevenlabs",
			timing: { perSegment: {} },
		};
		const result = validateVoiceover(vo, tmpDir);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0]).toContain("audio file not found");
		}
	});

	it("missing_provider_timing_file_warns", () => {
		writeFileSync(resolve(tmpDir, "narration.mp3"), "fake-audio");
		const vo: Voiceover = {
			audio_file: "narration.mp3",
			provider: "elevenlabs",
			provider_timing_file: "nonexistent_timing.json",
			timing: { perSegment: {} },
		};
		const result = validateVoiceover(vo, tmpDir);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings[0]).toContain("provider timing file not found");
		}
	});

	it("valid_voiceover_with_no_provider_timing_passes", () => {
		writeFileSync(resolve(tmpDir, "narration.mp3"), "fake-audio");
		const vo: Voiceover = {
			audio_file: "narration.mp3",
			provider: "manual",
			timing: { perSegment: {} },
		};
		const result = validateVoiceover(vo, tmpDir);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.warnings).toHaveLength(0);
		}
	});
});
