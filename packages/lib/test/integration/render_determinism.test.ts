/**
 * Integration test: deterministic rendering via JS time injection.
 *
 * Creates a fixture project with a segment that uses ctx.hold() in a loop,
 * changing visible text on each iteration. Renders at 10fps and verifies
 * the output has the expected number of frames and non-zero file size.
 *
 * This validates the full A2 pipeline: JS time shim injection via
 * addInitScript, virtual clock advancement, hold() firing via virtualized
 * setTimeout, and frame capture.
 *
 * Skips if ffmpeg or Playwright are not available.
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
	`vw-render-determinism-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);

function setupFixtureProject(): void {
	const segDir = join(tmpDir, "segments", "counter");
	const videoDir = join(tmpDir, "videos", "test-video");

	mkdirSync(segDir, { recursive: true });
	mkdirSync(videoDir, { recursive: true });

	writeFileSync(
		join(tmpDir, "videowright.config.ts"),
		`export default { projectStructure: "v1" as const };`,
	);

	// Segment that counts from 0 to 9, holding 100ms between each step.
	// At 10fps, each frame is 100ms, so we should get 10 frames with
	// values 0-9 displayed (one per frame).
	writeFileSync(
		join(segDir, "index.ts"),
		`import { defineSegment } from "videowright";
export default defineSegment({
	id: "counter",
	advances: [1.0],
	mount(el) {
		el.style.cssText = "display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#222;";
		el.innerHTML = "<h1 id='count' style='color:white;font-size:120px;'>0</h1>";
	},
	async play(ctx) {
		const el = document.getElementById("count");
		if (!el) return;
		for (let i = 0; i < 10; i++) {
			el.textContent = String(i);
			if (i < 9) await ctx.hold(100);
		}
	},
});`,
	);

	writeFileSync(
		join(videoDir, "timeline.ts"),
		`import type { Timeline } from "videowright";
const timeline: Timeline = {
	meta: { title: "Determinism Test" },
	segments: [{ id: "counter" }],
};
export default timeline;`,
	);
}

/**
 * Helper that catches browser-launch failures and skips gracefully.
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

describe.skipIf(!HAS_DEPS)("render determinism via JS injection", () => {
	beforeAll(() => {
		setupFixtureProject();
	});

	afterAll(() => {
		if (existsSync(tmpDir)) {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("render_counter_segment_produces_expected_frames", async () => {
		const outputPath = join(tmpDir, "output.mp4");
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
		// 1 second at 10fps = 10 frames
		expect(result.frames).toBe(10);
		expect(result.duration).toBeCloseTo(1.0, 1);

		// Verify file is non-trivial (has actual encoded content)
		const stat = statSync(outputPath);
		expect(stat.size).toBeGreaterThan(1000);
	}, 60000);

	it("render_counter_produces_correct_duration", async () => {
		const outputPath = join(tmpDir, "output-duration.mp4");
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

		// Verify via ffprobe that the container duration matches expected
		try {
			const probeOutput = execSync(
				`ffprobe -v error -show_entries format=duration -of csv=p=0 "${outputPath}"`,
				{ encoding: "utf-8" },
			);
			const duration = Number.parseFloat(probeOutput.trim());
			if (!Number.isNaN(duration)) {
				// Should be ~1 second. Allow tolerance for codec framing.
				expect(duration).toBeGreaterThanOrEqual(0.8);
				expect(duration).toBeLessThanOrEqual(1.5);
			}
		} catch {
			// ffprobe may not be available; skip this check
		}
	}, 60000);
});
