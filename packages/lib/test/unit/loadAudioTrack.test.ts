import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserError } from "../../src/cli/errors.js";
import { loadAudioTrack } from "../../src/timeline/loadAudioTrack.js";

const tmpDir = resolve(import.meta.dirname ?? __dirname, "../../.tmp-test-loadAudioTrack");

function setupFixture(opts?: {
	skipAudio?: boolean;
	invalidModule?: boolean;
	moduleContent?: string;
}) {
	const videoFolder = resolve(tmpDir, "test-video");
	const trackFolder = resolve(videoFolder, "audio", "tracks", "v1");
	mkdirSync(trackFolder, { recursive: true });

	if (!opts?.skipAudio) {
		writeFileSync(resolve(trackFolder, "track.mp3"), "fake-audio");
	}

	if (opts?.moduleContent) {
		writeFileSync(resolve(trackFolder, "track.ts"), opts.moduleContent);
	} else if (opts?.invalidModule) {
		writeFileSync(resolve(trackFolder, "track.ts"), "export default 42;");
	} else {
		writeFileSync(
			resolve(trackFolder, "track.ts"),
			`export default {
				audio_file: "./track.mp3",
				length_s: 10.5,
				timing: { perSegment: { intro: [2, 4] } },
			};`,
		);
	}

	return videoFolder;
}

describe("loadAudioTrack", () => {
	beforeEach(() => {
		mkdirSync(tmpDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("happy_path_loads_module_and_resolves_paths", async () => {
		const videoFolder = setupFixture();
		const result = await loadAudioTrack({ videoFolder, trackId: "v1" });

		const expectedAudioPath = resolve(videoFolder, "audio", "tracks", "v1", "track.mp3");
		expect(result.audioTrack.audio_file).toBe(expectedAudioPath);
		expect(result.audioTrack.length_s).toBe(10.5);
		expect(result.audioTrack.timing.perSegment.intro).toEqual([2, 4]);
		expect(result.trackFolder).toBe(resolve(videoFolder, "audio", "tracks", "v1"));
		expect(result.audioFilePath).toBe(expectedAudioPath);
	});

	it("missing_track_ts_throws_UserError", async () => {
		const videoFolder = resolve(tmpDir, "no-track");
		mkdirSync(videoFolder, { recursive: true });

		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(UserError);
		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(
			"Audio track not found",
		);
	});

	it("invalid_module_shape_throws_UserError", async () => {
		const videoFolder = setupFixture({ invalidModule: true });

		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(UserError);
		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(
			"Invalid audio track module",
		);
	});

	it("missing_length_s_throws_UserError", async () => {
		const videoFolder = setupFixture({
			moduleContent: `export default {
				audio_file: "./track.mp3",
				timing: { perSegment: {} },
			};`,
		});

		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(UserError);
		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(
			"missing valid length_s",
		);
	});

	it("missing_timing_throws_UserError", async () => {
		const videoFolder = setupFixture({
			moduleContent: `export default {
				audio_file: "./track.mp3",
				length_s: 5.0,
			};`,
		});

		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(UserError);
		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(
			"missing valid timing",
		);
	});

	it("missing_perSegment_throws_UserError", async () => {
		const videoFolder = setupFixture({
			moduleContent: `export default {
				audio_file: "./track.mp3",
				length_s: 5.0,
				timing: {},
			};`,
		});

		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(UserError);
		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(
			"missing valid timing",
		);
	});

	it("missing_audio_file_throws_UserError", async () => {
		const videoFolder = setupFixture({ skipAudio: true });

		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(UserError);
		await expect(loadAudioTrack({ videoFolder, trackId: "v1" })).rejects.toThrow(
			"Audio track file not found",
		);
	});
});
