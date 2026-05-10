/**
 * `videowright render` -- deterministic CDP-driven frame export.
 *
 * The player runs in render mode: no wall-clock dependence, controlled
 * frame-by-frame advancement via CDP. Each frame is captured as a PNG
 * screenshot and piped to ffmpeg for encoding.
 *
 * Timing is driven by each segment's `advances` array (segment-relative seconds).
 * The render driver converts advances to frame counts and fires triggerNext()
 * at the correct frame boundaries.
 *
 * Frames are byte-identical across runs because:
 * - hold() resolves immediately (no real timers)
 * - clock() returns deterministic values based on frame count
 * - The render driver controls advancement, not real time
 * - renderAdvance() is fully async -- it awaits transition completion
 *   before returning, so the caller never captures a mid-transition frame
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { validateSegmentAdvances } from "../timeline/index.js";
import { loadVoiceover } from "../timeline/loadVoiceover.js";
import type { ResolvedTiming, TimingSegment } from "../timeline/resolveTiming.js";
import { resolveTiming } from "../timeline/resolveTiming.js";
import { validateTiming, validateVoiceover } from "../timeline/validateTiming.js";
import type { Timeline, Voiceover } from "../types.js";
import { discoverProject } from "./discover_project.js";
import { UserError } from "./errors.js";
import { buildFfmpegArgs, findFfmpeg, spawnFfmpeg, writeWithBackpressure } from "./ffmpeg.js";
import { ensurePlaywright } from "./playwright_check.js";
import { loadModule } from "./ts_loader.js";

export interface RenderOptions {
	cwd: string;
	positional?: string;
	width?: number;
	height?: number;
	fps?: number;
	output?: string;
	verbose?: boolean;
	voiceover?: string;
}

export interface RenderResult {
	outputPath: string;
	frames: number;
	duration: number;
}

/**
 * Build a flat schedule of frame indices at which to fire triggerNext().
 * Each entry is { globalFrame, segmentId, advanceIndex }.
 */
function buildFrameSchedule(
	timeline: Timeline,
	segmentAdvances: Map<string, number[]>,
	fps: number,
): Array<{ globalFrame: number; segmentId: string; advanceIndex: number; isLast: boolean }> {
	const schedule: Array<{
		globalFrame: number;
		segmentId: string;
		advanceIndex: number;
		isLast: boolean;
	}> = [];
	let cumulativeFrames = 0;

	for (const entry of timeline.segments) {
		const advances = segmentAdvances.get(entry.id);
		if (!advances) continue;

		for (let i = 0; i < advances.length; i++) {
			const advanceFrame = cumulativeFrames + Math.round(advances[i] * fps);
			schedule.push({
				globalFrame: advanceFrame,
				segmentId: entry.id,
				advanceIndex: i,
				isLast: i === advances.length - 1,
			});
		}

		// Advance cumulative by the last advance value (total segment duration)
		cumulativeFrames += Math.round(advances[advances.length - 1] * fps);
	}

	return schedule;
}

export async function runRender(opts: RenderOptions): Promise<RenderResult> {
	const { cwd, positional, verbose } = opts;
	const width = opts.width ?? 1920;
	const height = opts.height ?? 1080;
	const fps = opts.fps ?? 60;
	const output = opts.output ?? "output.mp4";

	// 1. Validate dependencies
	const ffmpegPath = findFfmpeg();
	if (verbose) console.log(`ffmpeg: ${ffmpegPath}`);

	const pw = await ensurePlaywright();

	// 2. Find config + timeline
	const { timelinePath } = discoverProject(cwd, positional, "render");

	// Load timeline (only for segment id list -- advances come from the browser)
	const timelineMod = await loadModule(timelinePath);
	const timeline = timelineMod.default as Timeline;

	// 2b. Resolve voiceover if requested
	const videoFolder = dirname(timelinePath);
	const voiceoverSuppressed = opts.voiceover === "none";
	let audioFilePath: string | undefined;
	let cliVoiceoverModule: Voiceover | undefined;

	if (!voiceoverSuppressed && opts.voiceover) {
		// loadVoiceover rewrites audio_file to an absolute path, validates
		// file existence, so the returned voiceover object is self-contained.
		const voResult = await loadVoiceover({
			videoFolder,
			slug: opts.voiceover,
		});
		audioFilePath = voResult.audioFilePath;
		cliVoiceoverModule = voResult.voiceover;

		if (verbose) {
			console.log(`voiceover: ${opts.voiceover} (${audioFilePath})`);
		}
	} else if (!voiceoverSuppressed && timeline.default_voiceover) {
		// default_voiceover.audio_file is relative to the video folder (the
		// directory containing timeline.ts) per the Voiceover type contract.
		const defaultAudioPath = resolve(videoFolder, timeline.default_voiceover.audio_file);
		if (!existsSync(defaultAudioPath)) {
			throw new UserError(
				`Default voiceover audio file not found: ${defaultAudioPath}`,
				"Check the audio_file path in your timeline's default_voiceover.",
			);
		}
		audioFilePath = defaultAudioPath;

		if (verbose) {
			console.log(`voiceover: default (${audioFilePath})`);
		}
	}

	// Validate the active voiceover before proceeding.
	const activeVoiceover =
		cliVoiceoverModule ?? (!voiceoverSuppressed ? timeline.default_voiceover : undefined);
	if (activeVoiceover) {
		// File-existence validation: skip for CLI voiceovers because
		// loadVoiceover already checked audio_file and threw on missing.
		// Run for default_voiceover where no prior check has been done
		// (the existsSync above only checked the audio file, not
		// provider_timing_file).
		if (!cliVoiceoverModule) {
			const voValidation = validateVoiceover(activeVoiceover, videoFolder);
			if (!voValidation.ok) {
				throw new UserError(
					`Voiceover validation failed:\n${voValidation.errors.join("\n")}`,
					"Check voiceover file paths.",
				);
			}
			for (const w of voValidation.warnings) {
				console.warn(`Warning: ${w}`);
			}
		}

		const segmentIds = timeline.segments.map((s) => s.id);
		const timingValidation = validateTiming(activeVoiceover.timing, segmentIds);
		if (!timingValidation.ok) {
			throw new UserError(
				`Voiceover timing validation failed:\n${timingValidation.errors.join("\n")}`,
				"Check the timing object in your voiceover.ts file.",
			);
		}
		for (const w of timingValidation.warnings) {
			console.warn(`Warning: ${w}`);
		}
	}

	if (verbose) {
		console.log(`timeline: ${timelinePath}`);
		console.log(`segments: ${timeline.segments.length}`);
		console.log(`resolution: ${width}x${height} @ ${fps}fps`);
		console.log(`output: ${output}`);
	}

	// 3. Boot Vite dev server with render entry
	const { createServer } = await import("vite");
	const { findPackageRoot, fullReloadPlugin, segmentDiscoveryPlugin } = await import(
		"./vite_helpers.js"
	);
	const pkgRoot = findPackageRoot();
	const entryDir = resolve(pkgRoot, "src/cli/entry");

	const { globalsVirtualModulePlugin } = await import("./vite_helpers.js");

	const server = await createServer({
		configFile: false,
		root: entryDir,
		plugins: [
			fullReloadPlugin(),
			segmentDiscoveryPlugin(cwd),
			globalsVirtualModulePlugin({
				timelinePath,
				consumerRoot: cwd,
				renderFps: fps,
			}),
		],
		server: {
			port: 0,
			strictPort: false,
			fs: {
				allow: [cwd, pkgRoot],
			},
		},
		resolve: {
			alias: {
				"@consumer": cwd,
			},
		},
	});

	await server.listen();
	const serverUrl = server.resolvedUrls?.local?.[0];
	if (!serverUrl) {
		await server.close();
		throw new UserError(
			"Vite dev server started but did not report a URL",
			"This usually means the auto-assigned port failed. Try again or specify a port.",
		);
	}
	const renderUrl = serverUrl.replace(/\/$/, "/render.html");

	if (verbose) console.log(`render server: ${renderUrl}`);

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
			await server.close();
		} catch {}
	};

	const onSignal = () => {
		signalCleanup().finally(() => process.exit(1));
	};
	process.on("SIGINT", onSignal);
	process.on("SIGTERM", onSignal);

	try {
		// 4. Launch headless browser
		const browser = await pw.chromium.launch({ headless: true });
		browserRef = browser;
		const context = await browser.newContext({
			viewport: { width, height },
			deviceScaleFactor: 1,
		});
		const page = await context.newPage();

		// Surface page errors
		const pageErrors: Error[] = [];
		page.on("pageerror", (...args: unknown[]) => {
			const err = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
			pageErrors.push(err);
			if (verbose) console.error(`[page error] ${err.message}`);
		});

		try {
			await page.goto(renderUrl, { waitUntil: "networkidle" } as Record<string, unknown>);

			// Wait for render mode to be ready
			await page.waitForFunction("window.__VW_RENDER_READY__ === true", {
				timeout: 30000,
			});

			// Check for boot errors
			const bootError = (await page.evaluate("window.__VW_RENDER_ERROR__")) as string | null;
			if (bootError) {
				throw new UserError(`Render boot failed: ${bootError}`);
			}

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

			// Build minimal segment objects from browser-sourced advances
			// for resolveTiming's base layer.
			const browserSegments: TimingSegment[] = timeline.segments.map((entry) => ({
				id: entry.id,
				advances: advancesMap[entry.id] ?? [],
			}));

			// Resolve timing using the four-level precedence. Voiceover timing
			// overlays on top of segment advances from the browser.
			const resolved: ResolvedTiming = resolveTiming({
				segments: browserSegments,
				defaultTiming: timeline.default_timing,
				defaultVoiceover: timeline.default_voiceover,
				cliVoiceoverSlug: opts.voiceover,
				cliVoiceoverModule,
			});

			if (verbose && resolved.source !== "segments") {
				console.log(`timing source: ${resolved.source}`);
			}

			// Build segmentAdvances Map from the resolved data
			const segmentAdvances = new Map<string, number[]>();
			for (const entry of timeline.segments) {
				const advances = resolved.perSegment[entry.id];
				if (advances) {
					segmentAdvances.set(entry.id, advances);
				}
			}

			// Build frame schedule and compute total frames
			const schedule = buildFrameSchedule(timeline, segmentAdvances, fps);

			let totalFrames = 0;
			for (const entry of timeline.segments) {
				const advances = segmentAdvances.get(entry.id);
				if (advances && advances.length > 0) {
					totalFrames += Math.round(advances[advances.length - 1] * fps);
				}
			}

			if (verbose) {
				console.log(`total frames: ${totalFrames} (${(totalFrames / fps).toFixed(1)}s)`);
				console.log("render mode ready, capturing frames...");
			}

			// 5. Start ffmpeg process
			const outputPath = resolve(cwd, output);
			const ffmpegArgs = buildFfmpegArgs({ fps, outputPath, audioFilePath });

			const { process: ffmpegProc, done: ffmpegDone } = spawnFfmpeg(ffmpegPath, ffmpegArgs);
			ffmpegProcRef = ffmpegProc;

			// Attach error handler once outside the loop to avoid MaxListenersExceeded
			const ffmpegErrors: Error[] = [];
			ffmpegProc.stdin?.on("error", (err) => {
				ffmpegErrors.push(err);
			});

			let frameCount = 0;
			let scheduleIdx = 0;

			try {
				// 6. Frame-by-frame render loop driven by advances schedule
				while (frameCount < totalFrames) {
					if (ffmpegErrors.length > 0) {
						throw new UserError(`ffmpeg stdin error: ${ffmpegErrors[0].message}`);
					}

					// Check for page errors
					if (pageErrors.length > 0) {
						const lastErr = pageErrors[pageErrors.length - 1];
						throw new UserError(
							`Page error during rendering: ${lastErr.message}`,
							"Check segment play() or mount() for runtime errors.",
						);
					}

					// Check if we need to advance before this frame
					while (scheduleIdx < schedule.length && schedule[scheduleIdx].globalFrame <= frameCount) {
						const entry = schedule[scheduleIdx];

						// Fire renderAdvance
						const hasMore = (await page.evaluate("window.__VW_RENDER_ADVANCE__()")) as boolean;

						// Check for errors after advance
						const renderError = (await page.evaluate("window.__VW_RENDER_ERROR__")) as
							| string
							| null;
						if (renderError) {
							throw new UserError(`Render error: ${renderError}`);
						}

						// Coherence check: segment transitions
						const currentSegment = (await page.evaluate(
							"document.body.dataset.vwSegment",
						)) as string;

						if (!entry.isLast && currentSegment !== entry.segmentId) {
							throw new UserError(
								`Segment "${entry.segmentId}" transitioned at advance index ${entry.advanceIndex} but advances array has more entries. Remove unused entries from the advances array.`,
							);
						}

						if (entry.isLast && !hasMore && scheduleIdx < schedule.length - 1) {
							// Last advance for this segment but schedule has more segments
							// and renderAdvance returned false -- timeline ended too early
							// This shouldn't happen with correct advances; just log
							if (verbose) {
								console.warn(
									`Warning: renderAdvance returned false at segment "${entry.segmentId}" advance ${entry.advanceIndex}`,
								);
							}
						}

						scheduleIdx++;
					}

					// Capture frame
					const screenshot = (await page.screenshot({ type: "png" })) as Buffer;
					if (!ffmpegProc.stdin?.writable) break;
					await writeWithBackpressure(ffmpegProc.stdin, screenshot);
					frameCount++;

					if (verbose && frameCount % 10 === 0) {
						const pct = Math.min(100, Math.round((frameCount / totalFrames) * 100));
						process.stdout.write(`\r  frames: ${frameCount}/${totalFrames} (${pct}%)`);
					}
				}

				if (verbose) console.log(`\n  total frames: ${frameCount}`);
			} finally {
				ffmpegProc.stdin?.end();
			}

			const ffmpegResult = await ffmpegDone;
			if (ffmpegResult.code !== 0) {
				if (verbose) {
					console.error(`ffmpeg stderr:\n${ffmpegResult.stderr}`);
				}
				throw new UserError(
					`ffmpeg exited with code ${ffmpegResult.code}`,
					"Check ffmpeg output above for details.",
				);
			}

			const duration = frameCount / fps;
			return { outputPath, frames: frameCount, duration };
		} finally {
			await page.close();
			await browser.close();
		}
	} finally {
		process.removeListener("SIGINT", onSignal);
		process.removeListener("SIGTERM", onSignal);
		await server.close();
	}
}
