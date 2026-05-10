import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { UserError } from "../../src/cli/errors.js";
import { buildFfmpegArgs, findFfmpeg, spawnFfmpeg } from "../../src/cli/ffmpeg.js";

/**
 * Check if ffmpeg is actually installed on this system.
 */
function systemHasFfmpeg(): boolean {
	try {
		execFileSync("which", ["ffmpeg"], { encoding: "utf-8", stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

describe("ffmpeg detection", () => {
	it("findFfmpeg_returns_string_or_throws_UserError", () => {
		try {
			const path = findFfmpeg();
			expect(typeof path).toBe("string");
			expect(path.length).toBeGreaterThan(0);
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			const err = e as UserError;
			expect(err.message).toBe("ffmpeg not found on PATH");
			expect(err.hint).toBeDefined();
			expect(err.hint).toContain("ffmpeg");
		}
	});

	it("findFfmpeg_consistent_with_system_state", () => {
		const hasFfmpeg = systemHasFfmpeg();
		if (hasFfmpeg) {
			const path = findFfmpeg();
			expect(path).toContain("ffmpeg");
		} else {
			expect(() => findFfmpeg()).toThrow(UserError);
		}
	});

	it("spawnFfmpeg_spawns_process_with_correct_args", () => {
		if (!systemHasFfmpeg()) return; // skip if ffmpeg not installed

		const ffmpegPath = findFfmpeg();
		// Spawn ffmpeg with --version flag -- a quick, non-destructive invocation
		const { process: proc, done } = spawnFfmpeg(ffmpegPath, ["-version"]);

		// The process object should have stdin, stdout, stderr
		expect(proc.stdin).toBeDefined();
		expect(proc.stderr).toBeDefined();

		// done should be a promise that resolves with code + stderr
		expect(done).toBeInstanceOf(Promise);

		// Wait for it to complete and verify
		return done.then((result) => {
			expect(result.code).toBe(0);
			expect(result.stderr).toBeDefined();
		});
	});

	it("ffmpeg_error_hint_is_platform_specific", () => {
		if (systemHasFfmpeg()) return; // skip if ffmpeg is installed
		try {
			findFfmpeg();
		} catch (e) {
			const err = e as UserError;
			expect(err.hint).toBeDefined();
			expect(err.hint?.length).toBeGreaterThan(10);
		}
	});
});

describe("buildFfmpegArgs", () => {
	it("video_only_args_without_audio", () => {
		const args = buildFfmpegArgs({ fps: 60, outputPath: "/tmp/out.mp4" });
		expect(args).toContain("-y");
		expect(args).toContain("image2pipe");
		expect(args).toContain("pipe:0");
		expect(args).toContain("libx264");
		expect(args).toContain("/tmp/out.mp4");
		// No audio flags
		expect(args).not.toContain("aac");
		expect(args).not.toContain("-shortest");
		expect(args).not.toContain("-map");
	});

	it("includes_audio_flags_when_audioFilePath_provided", () => {
		const args = buildFfmpegArgs({
			fps: 30,
			outputPath: "/tmp/out.mp4",
			audioFilePath: "/tmp/narration.mp3",
		});
		// Has two -i flags
		const iFlags = args.reduce((count, v, i) => (v === "-i" ? count + 1 : count), 0);
		expect(iFlags).toBe(2);
		// Audio-specific
		expect(args).toContain("aac");
		expect(args).toContain("192k");
		expect(args).toContain("-shortest");
		expect(args).toContain("0:v:0");
		expect(args).toContain("1:a:0");
		// apad filter pads audio with silence so video duration is canonical
		expect(args).toContain("-af");
		expect(args).toContain("apad");
		// Audio file path
		expect(args).toContain("/tmp/narration.mp3");
	});

	it("preserves_fps_in_framerate_and_output_rate", () => {
		const args = buildFfmpegArgs({ fps: 24, outputPath: "/tmp/out.mp4" });
		const framerateIdx = args.indexOf("-framerate");
		expect(framerateIdx).toBeGreaterThan(-1);
		expect(args[framerateIdx + 1]).toBe("24");
		const rIdx = args.indexOf("-r");
		expect(rIdx).toBeGreaterThan(-1);
		expect(args[rIdx + 1]).toBe("24");
	});
});
