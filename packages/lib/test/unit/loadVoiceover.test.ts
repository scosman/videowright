import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserError } from "../../src/cli/errors.js";
import { loadVoiceover } from "../../src/timeline/loadVoiceover.js";

const tmpDir = resolve(import.meta.dirname ?? __dirname, "../../.tmp-test-loadVoiceover");

function setupFixture(opts?: { skipAudio?: boolean; invalidModule?: boolean }) {
	const videoFolder = resolve(tmpDir, "test-video");
	const voFolder = resolve(videoFolder, "voiceovers", "narrator");
	mkdirSync(voFolder, { recursive: true });

	if (!opts?.skipAudio) {
		// Create a tiny dummy audio file
		writeFileSync(resolve(voFolder, "narration.mp3"), "fake-audio");
	}

	if (opts?.invalidModule) {
		writeFileSync(resolve(voFolder, "voiceover.ts"), "export default 42;");
	} else {
		writeFileSync(
			resolve(voFolder, "voiceover.ts"),
			`export default {
				audio_file: "narration.mp3",
				provider: "elevenlabs" as const,
				timing: { perSegment: { intro: [2, 4] } },
			};`,
		);
	}

	return videoFolder;
}

describe("loadVoiceover", () => {
	beforeEach(() => {
		mkdirSync(tmpDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("happy_path_loads_module_and_resolves_paths", async () => {
		const videoFolder = setupFixture();
		const result = await loadVoiceover({ videoFolder, slug: "narrator" });

		const expectedAudioPath = resolve(videoFolder, "voiceovers", "narrator", "narration.mp3");
		// loadVoiceover rewrites audio_file to an absolute path
		expect(result.voiceover.audio_file).toBe(expectedAudioPath);
		expect(result.voiceover.provider).toBe("elevenlabs");
		expect(result.voiceover.timing.perSegment.intro).toEqual([2, 4]);
		expect(result.voiceoverFolder).toBe(resolve(videoFolder, "voiceovers", "narrator"));
		expect(result.audioFilePath).toBe(expectedAudioPath);
	});

	it("missing_voiceover_ts_throws_UserError", async () => {
		const videoFolder = resolve(tmpDir, "no-voiceover");
		mkdirSync(videoFolder, { recursive: true });

		await expect(loadVoiceover({ videoFolder, slug: "missing" })).rejects.toThrow(UserError);
		await expect(loadVoiceover({ videoFolder, slug: "missing" })).rejects.toThrow(
			"Voiceover not found",
		);
	});

	it("missing_audio_file_throws_UserError", async () => {
		const videoFolder = setupFixture({ skipAudio: true });

		await expect(loadVoiceover({ videoFolder, slug: "narrator" })).rejects.toThrow(UserError);
		await expect(loadVoiceover({ videoFolder, slug: "narrator" })).rejects.toThrow(
			"audio file not found",
		);
	});
});
