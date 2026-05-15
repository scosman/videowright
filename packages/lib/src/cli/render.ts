/**
 * `videowright render` -- deterministic JS-injection-driven frame export.
 *
 * The player runs in render mode with a JS time shim injected into the page
 * BEFORE navigation via `page.addInitScript()`. The shim virtualizes:
 * - Date, Date.now, performance.now
 * - setTimeout, setInterval, clearTimeout, clearInterval
 * - requestAnimationFrame, cancelAnimationFrame
 * - Element.prototype.animate (WAAPI)
 *
 * The render driver advances the virtual clock by `frameMs` per frame,
 * firing timers and RAF callbacks deterministically. WAAPI animations
 * are paused and driven by explicit `currentTime` updates.
 *
 * Frames are byte-identical across runs because:
 * - All time APIs return virtual time controlled by the driver
 * - hold() uses setTimeout, which is virtualized
 * - clock() uses performance.now, which is virtualized
 * - RAF callbacks fire exactly once per render frame
 * - WAAPI animations advance by exactly frameMs per frame
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { applyMetaDefaults, validateSegmentAdvances } from "../timeline/index.js";
import { loadVoiceover } from "../timeline/loadVoiceover.js";
import type { ResolvedTiming, TimingSegment } from "../timeline/resolveTiming.js";
import { resolveTiming } from "../timeline/resolveTiming.js";
import { validateTiming, validateVoiceover } from "../timeline/validateTiming.js";
import type { Config, Timeline, VideoSummary, Voiceover } from "../types.js";
import { findConfig, resolveSlugOrPath } from "./discover.js";
import { discoverAllVideos } from "./discover_project.js";
import { UserError } from "./errors.js";
import { buildFfmpegArgs, findFfmpeg, spawnFfmpeg, writeWithBackpressure } from "./ffmpeg.js";
import { ensurePlaywright } from "./playwright_check.js";
import { promptVideoSelection } from "./prompt.js";
import { TIME_SHIM_SOURCE } from "./time_shim.js";
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

/**
 * Resolve width, height, and fps using four-level precedence:
 * 1. CLI args (opts.width/height/fps)
 * 2. timeline.meta.resolution / timeline.meta.fps
 * 3. config.defaults.resolution / config.defaults.fps
 * 4. Hardcoded fallback (1920x1080 @ 60fps)
 */
export function resolveRenderParams(
	opts: Pick<RenderOptions, "width" | "height" | "fps">,
	timeline: Timeline,
	config: Config,
): { width: number; height: number; fps: number } {
	const resolvedMeta = applyMetaDefaults(timeline, config).meta;
	const [resolvedW, resolvedH] = resolvedMeta.resolution;
	return {
		width: opts.width ?? resolvedW,
		height: opts.height ?? resolvedH,
		fps: opts.fps ?? resolvedMeta.fps,
	};
}

/**
 * Resolve which timeline to render when no positional arg is given.
 * Exported for testability -- the branching logic depends on video count and TTY state.
 *
 * @returns The absolute timelinePath to render.
 */
export async function resolveRenderTarget(
	project: { videos: VideoSummary[] },
	isTTY: boolean,
): Promise<string> {
	if (project.videos.length === 0) {
		throw new UserError(
			"No videos found.",
			"Ask your coding agent to create one (e.g., /videowright new video).",
		);
	}

	if (project.videos.length === 1) {
		return project.videos[0].timelinePath;
	}

	if (!isTTY) {
		const slugList = project.videos.map((v) => `  npx videowright render ${v.slug}`).join("\n");
		throw new UserError(`Multiple videos found. Specify one explicitly:\n${slugList}`);
	}

	return promptVideoSelection(project.videos);
}

export async function runRender(opts: RenderOptions): Promise<RenderResult> {
	const { cwd, positional, verbose } = opts;
	const output = opts.output ?? "output.mp4";

	// 1. Validate dependencies
	const ffmpegPath = findFfmpeg();
	if (verbose) console.log(`ffmpeg: ${ffmpegPath}`);

	const pw = await ensurePlaywright();

	// 2. Find config + timeline
	const configPath = findConfig(cwd);
	if (!configPath) {
		throw new UserError(
			`No videowright.config.ts found at ${cwd}`,
			"The Videowright skill can scaffold one. Run setup first.",
		);
	}

	let timelinePath: string;

	if (positional) {
		const resolved = resolveSlugOrPath(positional, cwd);
		if (!resolved) {
			throw new UserError(
				`No video matching "${positional}" — not a slug under videos/, not a valid path.`,
			);
		}
		timelinePath = resolved;
	} else {
		const project = await discoverAllVideos(cwd);
		timelinePath = await resolveRenderTarget(project, !!process.stdin.isTTY);
	}

	// Load config and timeline
	const configMod = await loadModule(configPath);
	const config = configMod.default as Config | undefined;
	if (!config) {
		throw new UserError(
			"Config file has no default export",
			"Use `export default defineConfig({ ... })` in videowright.config.ts.",
		);
	}

	const timelineMod = await loadModule(timelinePath);
	const timeline = timelineMod.default as Timeline;

	// Resolve resolution and fps using four-level precedence
	const { width, height, fps } = resolveRenderParams(opts, timeline, config);
	const frameMs = 1000 / fps;

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

	console.log("Starting render... this may take a while.");

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
		// 4. Launch headless browser (no special CDP flags)
		const browser = await pw.chromium.launch({ headless: true });
		browserRef = browser;
		const context = await browser.newContext({
			viewport: { width, height },
			deviceScaleFactor: 1,
		});
		const page = await context.newPage();

		// Inject time shim BEFORE navigation so it runs before any user code
		await page.addInitScript({ content: TIME_SHIM_SOURCE });

		// Surface page errors
		const pageErrors: Error[] = [];
		page.on("pageerror", (...args: unknown[]) => {
			const err = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
			pageErrors.push(err);
			if (verbose) console.error(`[page error] ${err.message}`);
		});

		try {
			await page.goto(renderUrl, { waitUntil: "domcontentloaded" } as Record<string, unknown>);

			// Wait for render mode to be ready
			await page.waitForFunction("window.__VW_RENDER_READY__ === true", {
				timeout: 30000,
			});

			// Check for boot errors
			const bootError = (await page.evaluate("window.__VW_RENDER_ERROR__")) as string | null;
			if (bootError) {
				throw new UserError(`Render boot failed: ${bootError}`);
			}

			// Switch time shim from passthrough (real timers for boot) to
			// driver-controlled mode (virtual timers for deterministic capture).
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");

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
			const progressIntervalFrames = Math.round(1 * fps); // every 1s of video
			let lastProgressFrame = 0;

			try {
				// 6. Frame-by-frame render loop
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

						// Fire renderAdvance (starts transition, does not await completion --
						// WAAPI transitions are driven by the shim's clock advance)
						const hasMore = (await page.evaluate(
							`window.__VW_RENDER_ADVANCE__(${entry.isLast})`,
						)) as boolean;

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
							if (verbose) {
								console.warn(
									`Warning: renderAdvance returned false at segment "${entry.segmentId}" advance ${entry.advanceIndex}`,
								);
							}
						}

						scheduleIdx++;
					}

					// Advance virtual clock by one frame's worth of time.
					// This fires pending timers, RAF callbacks, and updates WAAPI animations.
					await page.evaluate(`window.__VW_ADVANCE_CLOCK__(${frameMs})`);

					// Capture frame
					const screenshot = (await page.screenshot({ type: "png" })) as Buffer;
					if (!ffmpegProc.stdin?.writable) break;
					await writeWithBackpressure(ffmpegProc.stdin, screenshot);
					frameCount++;

					// Progress output every 1s of rendered video
					if (frameCount - lastProgressFrame >= progressIntervalFrames) {
						const renderedSec = (frameCount / fps).toFixed(1);
						const totalSec = (totalFrames / fps).toFixed(1);
						console.log(`Rendered ${renderedSec}s / ${totalSec}s`);
						lastProgressFrame = frameCount;
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
