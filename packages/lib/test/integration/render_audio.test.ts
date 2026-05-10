/**
 * Integration test: render with voiceover audio muxing.
 *
 * Creates a minimal fixture project (config, timeline, one segment, one
 * voiceover with a tiny valid mp3), runs `render --voiceover <slug>`, and
 * verifies the output mp4 contains an audio stream via ffprobe.
 *
 * Skips if ffmpeg or Playwright are not available, or if the browser
 * cannot launch (e.g., sandboxed environments).
 */

import { execFileSync, execSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function generateSilentMp3(durationSeconds = 0.5): Buffer {
	try {
		const tmpPath = join(tmpdir(), `vw-test-silence-${Date.now()}.mp3`);
		execSync(
			`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${durationSeconds} -c:a libmp3lame -b:a 128k "${tmpPath}" 2>/dev/null`,
		);
		const buf = readFileSync(tmpPath);
		try {
			unlinkSync(tmpPath);
		} catch {}
		return buf;
	} catch {
		return Buffer.alloc(0);
	}
}

/**
 * Query the duration of a specific stream type (video or audio) in seconds.
 * Returns undefined if the stream is not present or ffprobe fails.
 */
function probeStreamDuration(filePath: string, streamType: "v" | "a"): number | undefined {
	try {
		const output = execSync(
			`ffprobe -v error -select_streams ${streamType} -show_entries stream=duration -of csv=p=0 "${filePath}"`,
			{ encoding: "utf-8" },
		);
		const val = Number.parseFloat(output.trim());
		return Number.isNaN(val) ? undefined : val;
	} catch {
		return undefined;
	}
}

/**
 * Query the container (format) duration in seconds.
 * More reliable than stream-level duration for some codecs.
 */
function probeFormatDuration(filePath: string): number | undefined {
	try {
		const output = execSync(
			`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
			{ encoding: "utf-8" },
		);
		const val = Number.parseFloat(output.trim());
		return Number.isNaN(val) ? undefined : val;
	} catch {
		return undefined;
	}
}

function systemHasFfmpeg(): boolean {
	try {
		execFileSync("which", ["ffmpeg"], { encoding: "utf-8", stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

async function canLaunchBrowser(): Promise<boolean> {
	try {
		const pw = await import("playwright-core");
		const chromiumPath = pw.chromium.executablePath();
		return Boolean(chromiumPath && existsSync(chromiumPath));
	} catch {
		return false;
	}
}

const HAS_DEPS = systemHasFfmpeg() && (await canLaunchBrowser());

const tmpDir = join(
	tmpdir(),
	`vw-render-audio-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);

function setupFixtureProject(): void {
	const segDir = join(tmpDir, "segments", "hello");
	const voDir = join(tmpDir, "videos", "test-video", "voiceovers", "narrator");
	const voShortDir = join(tmpDir, "videos", "test-video", "voiceovers", "short-narrator");
	const voLongDir = join(tmpDir, "videos", "test-video", "voiceovers", "long-narrator");
	const videoDir = join(tmpDir, "videos", "test-video");

	mkdirSync(segDir, { recursive: true });
	mkdirSync(voDir, { recursive: true });
	mkdirSync(voShortDir, { recursive: true });
	mkdirSync(voLongDir, { recursive: true });

	writeFileSync(
		join(tmpDir, "videowright.config.ts"),
		`export default { projectStructure: "v1" as const };`,
	);

	// Segment with 2 seconds of video (advances: [2.0])
	writeFileSync(
		join(segDir, "index.ts"),
		`import { defineSegment } from "videowright";
export default defineSegment({
	id: "hello",
	advances: [2.0],
	mount(el) {
		el.style.cssText = "display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#222;";
		el.innerHTML = "<h1 style='color:white;font-size:48px;'>Hello</h1>";
	},
	async play(ctx) {
		await ctx.hold(2000);
	},
});`,
	);

	writeFileSync(
		join(videoDir, "timeline.ts"),
		`import type { Timeline } from "videowright";
const timeline: Timeline = {
	meta: { title: "Audio Test" },
	segments: [{ id: "hello" }],
};
export default timeline;`,
	);

	// Original narrator voiceover (0.5s audio, used by existing test)
	writeFileSync(
		join(voDir, "voiceover.ts"),
		`import type { Voiceover } from "videowright";
const vo: Voiceover = {
	audio_file: "silence.mp3",
	provider: "elevenlabs",
	timing: { perSegment: { hello: [0.5] } },
};
export default vo;`,
	);

	const mp3 = generateSilentMp3();
	if (mp3.length > 0) {
		writeFileSync(join(voDir, "silence.mp3"), mp3);
	}

	// Short narrator: 0.5s audio, shorter than 2s video
	writeFileSync(
		join(voShortDir, "voiceover.ts"),
		`import type { Voiceover } from "videowright";
const vo: Voiceover = {
	audio_file: "silence-short.mp3",
	provider: "elevenlabs",
	timing: { perSegment: { hello: [2.0] } },
};
export default vo;`,
	);

	const mp3Short = generateSilentMp3(0.5);
	if (mp3Short.length > 0) {
		writeFileSync(join(voShortDir, "silence-short.mp3"), mp3Short);
	}

	// Long narrator: 5s audio, longer than 2s video
	writeFileSync(
		join(voLongDir, "voiceover.ts"),
		`import type { Voiceover } from "videowright";
const vo: Voiceover = {
	audio_file: "silence-long.mp3",
	provider: "elevenlabs",
	timing: { perSegment: { hello: [2.0] } },
};
export default vo;`,
	);

	const mp3Long = generateSilentMp3(5.0);
	if (mp3Long.length > 0) {
		writeFileSync(join(voLongDir, "silence-long.mp3"), mp3Long);
	}
}

/**
 * Helper that catches browser-launch failures (e.g., sandboxed environments
 * where Chromium's MachPort call is blocked) and skips the test gracefully
 * instead of failing.
 */
async function runRenderOrSkip(
	opts: Parameters<typeof import("../../src/cli/render.js").runRender>[0],
) {
	const { runRender } = await import("../../src/cli/render.js");
	try {
		return await runRender(opts);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.includes("browserType.launch") || msg.includes("Permission denied")) {
			console.warn("Skipping: browser cannot launch in this environment");
			return null;
		}
		throw e;
	}
}

describe.skipIf(!HAS_DEPS)("render with voiceover audio", () => {
	beforeAll(() => {
		setupFixtureProject();
	});

	afterAll(() => {
		if (existsSync(tmpDir)) {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("render_voiceover_produces_mp4_with_audio_stream", async () => {
		const mp3Path = join(tmpDir, "videos", "test-video", "voiceovers", "narrator", "silence.mp3");
		if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
			return; // ffmpeg failed to generate silence mp3
		}

		const outputPath = join(tmpDir, "output.mp4");
		const result = await runRenderOrSkip({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			voiceover: "narrator",
		});

		if (!result) return; // browser launch blocked

		expect(result.outputPath).toBe(outputPath);
		expect(existsSync(outputPath)).toBe(true);
		expect(result.frames).toBeGreaterThan(0);

		// Verify audio stream exists via ffprobe
		const probeOutput = execSync(
			`ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${outputPath}"`,
			{ encoding: "utf-8" },
		);
		expect(probeOutput.trim()).toBe("audio");
	}, 60000);

	it("render_without_voiceover_produces_silent_mp4", async () => {
		const outputPath = join(tmpDir, "output-silent.mp4");
		const result = await runRenderOrSkip({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			voiceover: "none",
		});

		if (!result) return; // browser launch blocked

		expect(result.outputPath).toBe(outputPath);
		expect(existsSync(outputPath)).toBe(true);

		// Verify no audio stream
		const probeOutput = execSync(
			`ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${outputPath}"`,
			{ encoding: "utf-8" },
		);
		expect(probeOutput.trim()).toBe("");
	}, 60000);

	it("render_audio_shorter_than_video_produces_video_duration_output", async () => {
		// Audio is 0.5s, video is 2s. Output should be ~2s (video duration).
		const mp3Path = join(
			tmpDir,
			"videos",
			"test-video",
			"voiceovers",
			"short-narrator",
			"silence-short.mp3",
		);
		if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
			return; // ffmpeg failed to generate silence mp3
		}

		const outputPath = join(tmpDir, "output-short-audio.mp4");
		const result = await runRenderOrSkip({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			voiceover: "short-narrator",
		});

		if (!result) return; // browser launch blocked

		expect(result.outputPath).toBe(outputPath);
		expect(existsSync(outputPath)).toBe(true);
		expect(result.frames).toBe(20); // 2s * 10fps

		// Verify audio stream exists
		const probeAudio = execSync(
			`ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${outputPath}"`,
			{ encoding: "utf-8" },
		);
		expect(probeAudio.trim()).toBe("audio");

		// Verify output duration is close to video duration (2s), not audio duration (0.5s).
		// Use container duration as it's most reliable across codecs.
		const formatDuration = probeFormatDuration(outputPath);
		expect(formatDuration).toBeDefined();
		if (formatDuration !== undefined) {
			// Allow 0.5s tolerance for codec padding / mp3 frame rounding
			expect(formatDuration).toBeGreaterThanOrEqual(1.5);
			expect(formatDuration).toBeLessThanOrEqual(3.0);
		}
	}, 60000);

	it("render_audio_longer_than_video_produces_video_duration_output", async () => {
		// Audio is 5s, video is 2s. Output should be ~2s (video duration, audio truncated).
		const mp3Path = join(
			tmpDir,
			"videos",
			"test-video",
			"voiceovers",
			"long-narrator",
			"silence-long.mp3",
		);
		if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
			return; // ffmpeg failed to generate silence mp3
		}

		const outputPath = join(tmpDir, "output-long-audio.mp4");
		const result = await runRenderOrSkip({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			voiceover: "long-narrator",
		});

		if (!result) return; // browser launch blocked

		expect(result.outputPath).toBe(outputPath);
		expect(existsSync(outputPath)).toBe(true);
		expect(result.frames).toBe(20); // 2s * 10fps

		// Verify audio stream exists
		const probeAudio = execSync(
			`ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${outputPath}"`,
			{ encoding: "utf-8" },
		);
		expect(probeAudio.trim()).toBe("audio");

		// Verify output duration is close to video duration (2s), not audio duration (5s).
		const formatDuration = probeFormatDuration(outputPath);
		expect(formatDuration).toBeDefined();
		if (formatDuration !== undefined) {
			// Should be around 2s, not 5s. Allow tolerance for codec padding.
			expect(formatDuration).toBeGreaterThanOrEqual(1.5);
			expect(formatDuration).toBeLessThanOrEqual(3.0);
		}
	}, 60000);
});
