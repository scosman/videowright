/**
 * `videowright record` -- Playwright drives the player in interactive mode while
 * ffmpeg captures screenshots piped as raw frames.
 *
 * Timing is driven by each segment's `advances` array: segment-relative seconds
 * at which the driver fires a triggerNext(). The driver waits until wall-clock
 * reaches `segmentMountTime + advances[i]` before each advance, then waits for
 * `document.body.dataset.vwState === "playing"` after each press to ensure
 * transitions complete before capturing frames.
 *
 * The driver validates segment coherence at runtime:
 * - If a segment parks on waitForNext after all advances fired: error.
 * - If a segment transitions before all advances fired: error.
 */

import { resolve } from "node:path";
import { validateSegmentAdvances } from "../timeline/index.js";
import type { Timeline } from "../types.js";
import { discoverProject } from "./discover_project.js";
import { UserError } from "./errors.js";
import { findFfmpeg, spawnFfmpeg, writeWithBackpressure } from "./ffmpeg.js";
import { ensurePlaywright } from "./playwright_check.js";
import { loadModule } from "./ts_loader.js";

export interface RecordOptions {
	cwd: string;
	positional?: string;
	width?: number;
	height?: number;
	fps?: number;
	output?: string;
	verbose?: boolean;
}

export interface RecordResult {
	outputPath: string;
	frames: number;
	duration: number;
}

export async function runRecord(opts: RecordOptions): Promise<RecordResult> {
	const { cwd, positional, verbose } = opts;
	const width = opts.width ?? 1920;
	const height = opts.height ?? 1080;
	const fps = opts.fps ?? 30;
	const output = opts.output ?? "output.mp4";

	// 1. Validate dependencies
	const ffmpegPath = findFfmpeg();
	if (verbose) console.log(`ffmpeg: ${ffmpegPath}`);

	const pw = await ensurePlaywright();

	// 2. Find config + timeline
	const { timelinePath } = discoverProject(cwd, positional, "record");

	// Load timeline (only for segment id list -- advances come from the browser)
	const timelineMod = await loadModule(timelinePath);
	const timeline = timelineMod.default as Timeline;

	if (verbose) {
		console.log(`timeline: ${timelinePath}`);
		console.log(`segments: ${timeline.segments.length}`);
		console.log(`resolution: ${width}x${height} @ ${fps}fps`);
		console.log(`output: ${output}`);
	}

	// 3. Boot dev server with auto-assigned port, HUD disabled
	const { runDev } = await import("./dev.js");
	const devResult = await runDev({ cwd, positional, port: 0, verbose });
	if (verbose) console.log(`dev server: ${devResult.url}`);

	// Collect page errors for diagnostics
	const pageErrors: Error[] = [];

	// Track resources for signal cleanup (SIGINT/SIGTERM)
	let ffmpegProcRef: ReturnType<typeof spawnFfmpeg>["process"] | null = null;
	let browserRef: Awaited<ReturnType<typeof pw.chromium.launch>> | null = null;

	const signalCleanup = async () => {
		if (ffmpegProcRef?.stdin) {
			try {
				ffmpegProcRef.stdin.end();
			} catch {}
		}
		if (ffmpegProcRef) {
			try {
				ffmpegProcRef.kill();
			} catch {}
		}
		if (browserRef) {
			try {
				await browserRef.close();
			} catch {}
		}
		try {
			await devResult.close();
		} catch {}
	};

	const onSignal = () => {
		signalCleanup().finally(() => process.exit(1));
	};
	process.on("SIGINT", onSignal);
	process.on("SIGTERM", onSignal);

	try {
		// 4. Launch browser
		const browser = await pw.chromium.launch({ headless: true });
		browserRef = browser;
		const context = await browser.newContext({
			viewport: { width, height },
			deviceScaleFactor: 1,
		});
		const page = await context.newPage();

		// Surface page errors to the user -- if a segment throws at runtime,
		// we want to report it instead of silently hanging.
		page.on("pageerror", (...args: unknown[]) => {
			const err = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
			pageErrors.push(err);
			if (verbose) console.error(`[page error] ${err.message}`);
		});

		try {
			// Navigate with hideHud query param so HUD is not visible in recordings
			const recordUrl = `${devResult.url}?hideHud=1`;
			await page.goto(recordUrl, { waitUntil: "networkidle" } as Record<string, unknown>);

			// Wait for player to be fully booted and ready
			await page.waitForFunction("window.__VW_PLAYER_READY__ === true", {
				timeout: 30000,
			});

			// Retrieve advances from the browser context (segments loaded via Vite,
			// which can handle CSS/JSON/image imports that Node's tsImport cannot)
			const advancesMap = (await page.evaluate("window.__VW_SEGMENT_ADVANCES__")) as Record<
				string,
				number[]
			>;

			// Validate advances
			const advResult = validateSegmentAdvances(timeline, advancesMap ?? {});
			if (!advResult.ok) {
				throw new UserError(
					`Advances validation failed:\n${advResult.errors.join("\n")}`,
					"Check that every segment declares a valid 'advances' array.",
				);
			}

			// Build segmentAdvances Map from the validated data
			const segmentAdvances = new Map<string, number[]>();
			for (const entry of timeline.segments) {
				if (advancesMap[entry.id]) {
					segmentAdvances.set(entry.id, advancesMap[entry.id]);
				}
			}

			// Compute total duration from advances
			let totalDurationSecs = 0;
			for (const entry of timeline.segments) {
				const advances = segmentAdvances.get(entry.id);
				if (advances && advances.length > 0) {
					totalDurationSecs += advances[advances.length - 1];
				}
			}

			if (verbose) {
				console.log(`total duration: ${totalDurationSecs.toFixed(1)}s`);
			}

			// Wait for initial segment to settle (state becomes "playing")
			await page.waitForFunction('document.body.dataset.vwState === "playing"', {
				timeout: 10000,
			});

			if (verbose) console.log("player ready, starting capture...");

			// 5. Start ffmpeg process
			const outputPath = resolve(cwd, output);
			const ffmpegArgs = [
				"-y",
				"-f",
				"image2pipe",
				"-framerate",
				String(fps),
				"-i",
				"pipe:0",
				"-c:v",
				"libx264",
				"-pix_fmt",
				"yuv420p",
				"-preset",
				"fast",
				"-crf",
				"18",
				"-r",
				String(fps),
				outputPath,
			];

			const { process: ffmpegProc, done: ffmpegDone } = spawnFfmpeg(ffmpegPath, ffmpegArgs);
			ffmpegProcRef = ffmpegProc;

			// Attach error handler once outside the loop to avoid MaxListenersExceeded
			const ffmpegErrors: Error[] = [];
			ffmpegProc.stdin?.on("error", (err) => {
				ffmpegErrors.push(err);
			});

			let frameCount = 0;

			try {
				// 6. Per-segment capture using advances timing
				let totalElapsed = 0;

				for (let segIdx = 0; segIdx < timeline.segments.length; segIdx++) {
					const entry = timeline.segments[segIdx];
					const advances = segmentAdvances.get(entry.id);
					if (!advances || advances.length === 0) {
						throw new UserError(`Segment "${entry.id}" has no advances array.`);
					}

					const segmentMountTime = totalElapsed;
					const segmentEnd = segmentMountTime + advances[advances.length - 1];

					if (verbose) {
						console.log(
							`\n  segment ${segIdx + 1}/${timeline.segments.length}: "${entry.id}" (${advances.length} advances, ${advances[advances.length - 1]}s)`,
						);
					}

					for (let advIdx = 0; advIdx < advances.length; advIdx++) {
						const advanceTime = segmentMountTime + advances[advIdx];

						// Capture frames until we reach the advance time
						while (totalElapsed < advanceTime) {
							if (ffmpegErrors.length > 0) {
								throw new UserError(`ffmpeg stdin error: ${ffmpegErrors[0].message}`);
							}

							const screenshot = (await page.screenshot({
								type: "png",
							})) as Buffer;
							if (!ffmpegProc.stdin?.writable) break;
							await writeWithBackpressure(ffmpegProc.stdin, screenshot);
							frameCount++;
							totalElapsed = frameCount / fps;

							if (verbose && frameCount % fps === 0) {
								process.stdout.write(
									`\r  frames: ${frameCount} (${totalElapsed.toFixed(1)}s / ${totalDurationSecs.toFixed(1)}s)`,
								);
							}
						}

						// Check for page errors before advancing
						if (pageErrors.length > 0) {
							const lastErr = pageErrors[pageErrors.length - 1];
							throw new UserError(
								`Page error during recording of segment "${entry.id}": ${lastErr.message}`,
								"Check the segment's play() or mount() for runtime errors.",
							);
						}

						// Fire triggerNext via a synthetic Space keydown on window.
						// We dispatch on window (not page.keyboard.press) because the player's
						// input listener is attached at the window level, not on a focused element.
						await page.evaluate(() => {
							window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
						});

						// Wait for player to settle after the advance
						await page.waitForFunction(
							'document.body.dataset.vwState === "playing" || document.body.dataset.vwState === "ended"',
							{ timeout: 10000 },
						);

						// Detect segment coherence issues
						const currentState = (await page.evaluate("document.body.dataset.vwState")) as string;
						const currentSegment = (await page.evaluate(
							"document.body.dataset.vwSegment",
						)) as string;

						if (advIdx < advances.length - 1) {
							// Not the last advance -- segment should still be active
							if (currentSegment !== entry.id) {
								throw new UserError(
									`Segment "${entry.id}" transitioned at advance index ${advIdx} but advances array has ${advances.length} entries. Remove unused entries from the advances array.`,
								);
							}
						}

						if (advIdx === advances.length - 1 && segIdx < timeline.segments.length - 1) {
							// Last advance for a non-final segment -- should have transitioned
							if (currentSegment === entry.id && currentState === "playing") {
								throw new UserError(
									`Segment "${entry.id}" parked on waitForNext after all ${advances.length} advances fired. Add more entries to the advances array.`,
								);
							}
						}
					}

					// After all advances for this segment, capture remains up to segmentEnd
					while (totalElapsed < segmentEnd) {
						const screenshot = (await page.screenshot({ type: "png" })) as Buffer;
						if (!ffmpegProc.stdin?.writable) break;
						await writeWithBackpressure(ffmpegProc.stdin, screenshot);
						frameCount++;
						totalElapsed = frameCount / fps;
					}
				}

				if (verbose) console.log("");
			} finally {
				ffmpegProc.stdin?.end();
			}

			const ffmpegResult = await ffmpegDone;
			if (ffmpegResult.code !== 0 && verbose) {
				console.error(`ffmpeg stderr:\n${ffmpegResult.stderr}`);
			}

			const duration = frameCount / fps;
			return { outputPath: resolve(cwd, output), frames: frameCount, duration };
		} finally {
			await page.close();
			await browser.close();
		}
	} finally {
		process.removeListener("SIGINT", onSignal);
		process.removeListener("SIGTERM", onSignal);
		await devResult.close();
	}
}
