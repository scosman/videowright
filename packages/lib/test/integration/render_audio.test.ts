/**
 * Integration test: render with audio track muxing.
 *
 * Creates a minimal fixture project (config, timeline, one segment, one
 * audio track with a tiny valid mp3), runs `render --audio-track <id>`, and
 * verifies the output mp4 contains an audio stream via ffprobe.
 *
 * Skips if ffmpeg or Playwright are not available.
 */

import { execFileSync, execSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runRender } from "../../src/cli/render.js";

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
		if (!chromiumPath || !existsSync(chromiumPath)) return false;
		// Actually attempt to launch to detect sandbox/permission failures
		const browser = await pw.chromium.launch({ headless: true });
		await browser.close();
		return true;
	} catch {
		return false;
	}
}

const HAS_DEPS = systemHasFfmpeg() && (await canLaunchBrowser());

// Resolve symlinks in tmpdir (macOS /var -> /private/var) so Vite's
// server.fs.allow check matches the real filesystem paths it resolves internally.
const resolvedTmp = realpathSync(tmpdir());
const tmpDir = join(
	resolvedTmp,
	`vw-render-audio-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);

function setupFixtureProject(): void {
	const segDir = join(tmpDir, "segments", "hello");
	const trackDir = join(tmpDir, "videos", "test-video", "audio", "tracks", "v1");
	const shortTrackDir = join(tmpDir, "videos", "test-video", "audio", "tracks", "short");
	const longTrackDir = join(tmpDir, "videos", "test-video", "audio", "tracks", "long");
	const videoDir = join(tmpDir, "videos", "test-video");

	mkdirSync(segDir, { recursive: true });
	mkdirSync(trackDir, { recursive: true });
	mkdirSync(shortTrackDir, { recursive: true });
	mkdirSync(longTrackDir, { recursive: true });

	writeFileSync(
		join(tmpDir, "videowright.config.ts"),
		`export default { projectStructure: "v1" as const };`,
	);

	// Export a plain segment object instead of importing defineSegment from
	// "videowright". The fixture runs inside a Vite server rooted at the tmpdir,
	// which has no node_modules — bare-module imports like "videowright" can't
	// be resolved from there. The render pipeline only reads advances/mount/play
	// from the default export, so a plain object works.
	writeFileSync(
		join(segDir, "index.ts"),
		`export default {
	id: "hello",
	advances: [2.0],
	mount(el: HTMLElement) {
		el.style.cssText = "display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#222;";
		el.innerHTML = "<h1 style='color:white;font-size:48px;'>Hello</h1>";
	},
	async play(ctx: any) {
		await ctx.hold(2000);
	},
};`,
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

	// Audio track v1 (0.5s audio, used by main test)
	writeFileSync(
		join(trackDir, "track.ts"),
		`import type { AudioTrack } from "videowright";
const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/silence.mp3",
	length_s: 0.5,
	timing: { perSegment: { hello: [0.5] } },
};
export default track;`,
	);

	const mp3 = generateSilentMp3();
	if (mp3.length > 0) {
		writeFileSync(join(trackDir, "silence.mp3"), mp3);
	}

	// Short track: 0.5s audio, shorter than 2s video
	writeFileSync(
		join(shortTrackDir, "track.ts"),
		`import type { AudioTrack } from "videowright";
const track: AudioTrack = {
	audio_file: "./audio/tracks/short/silence-short.mp3",
	length_s: 0.5,
	timing: { perSegment: { hello: [2.0] } },
};
export default track;`,
	);

	const mp3Short = generateSilentMp3(0.5);
	if (mp3Short.length > 0) {
		writeFileSync(join(shortTrackDir, "silence-short.mp3"), mp3Short);
	}

	// Long track: 5s audio, longer than 2s video
	writeFileSync(
		join(longTrackDir, "track.ts"),
		`import type { AudioTrack } from "videowright";
const track: AudioTrack = {
	audio_file: "./audio/tracks/long/silence-long.mp3",
	length_s: 5.0,
	timing: { perSegment: { hello: [2.0] } },
};
export default track;`,
	);

	const mp3Long = generateSilentMp3(5.0);
	if (mp3Long.length > 0) {
		writeFileSync(join(longTrackDir, "silence-long.mp3"), mp3Long);
	}
}

describe.skipIf(!HAS_DEPS)("render with audio track", () => {
	beforeAll(() => {
		setupFixtureProject();
	});

	afterAll(() => {
		if (existsSync(tmpDir)) {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("render_audio_track_produces_mp4_with_audio_stream", async () => {
		const mp3Path = join(tmpDir, "videos", "test-video", "audio", "tracks", "v1", "silence.mp3");
		if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
			return; // ffmpeg failed to generate silence mp3
		}

		const outputPath = join(tmpDir, "output.mp4");
		const result = await runRender({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			audioTrack: "v1",
		});

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

	it("render_without_audio_track_produces_silent_mp4", async () => {
		const outputPath = join(tmpDir, "output-silent.mp4");
		const result = await runRender({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			audioTrack: "none",
		});

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
			"audio",
			"tracks",
			"short",
			"silence-short.mp3",
		);
		if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
			return; // ffmpeg failed to generate silence mp3
		}

		const outputPath = join(tmpDir, "output-short-audio.mp4");
		const result = await runRender({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			audioTrack: "short",
		});

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
			"audio",
			"tracks",
			"long",
			"silence-long.mp3",
		);
		if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
			return; // ffmpeg failed to generate silence mp3
		}

		const outputPath = join(tmpDir, "output-long-audio.mp4");
		const result = await runRender({
			cwd: tmpDir,
			positional: "videos/test-video/timeline.ts",
			width: 320,
			height: 240,
			fps: 10,
			output: outputPath,
			audioTrack: "long",
		});

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
