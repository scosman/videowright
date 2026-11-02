/**
 * Integration test: deterministic DOM-state verification for the time shim.
 *
 * Launches a minimal HTML page in Playwright with the time shim injected via
 * addInitScript. Tests each animation primitive by engaging virtual time,
 * advancing the clock by known deltas, and asserting DOM state.
 *
 * Primitives covered:
 * - setTimeout (raw): fires at the correct virtual time
 * - ctx.hold (implemented via setTimeout): toggles DOM marker at expected time
 * - performance.now / ctx.clock: returns virtual elapsed time
 * - ctx.clock elapsed-since-mount: tracks virtual time relative to mount
 * - WAAPI translateX (Element.prototype.animate): driven deterministically
 * - WAAPI opacity: driven deterministically
 * - setInterval: fires repeatedly at correct virtual intervals
 * - clearInterval: cancels pending virtual interval
 * - requestAnimationFrame: fires on each clock advance
 * - Date.now: advances with virtual clock
 * - clearTimeout: cancels pending virtual timer
 * - Timer ordering: multiple timers fire in chronological order
 * - Animation end time: iterations, delay/endDelay, infinite loops, timing
 *   changes after tracking, playbackRate, cancel, removed elements, and
 *   animations adopted at engagement (CSS and WAAPI)
 * - Animations started after engagement: CSS animations and transitions,
 *   new Animation(...).play(), and their start time at any real speed
 * - Author control on the virtual clock: pause/play, reverse, finish, and
 *   replay, seek, scrub and timing changes after finish
 * - Re-attached elements, and animations left to the browser (scroll timelines)
 *
 * Skips if Playwright browser is not available or cannot launch.
 */

import { existsSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { TIME_SHIM_SOURCE } from "../../src/cli/time_shim.js";

let pw: typeof import("playwright-core");
let browser: Awaited<ReturnType<typeof import("playwright-core").chromium.launch>>;
let hasBrowser = false;

async function canLaunchBrowser(): Promise<boolean> {
	try {
		pw = await import("playwright-core");
		const chromiumPath = pw.chromium.executablePath();
		if (!chromiumPath || !existsSync(chromiumPath)) return false;

		// Actually attempt to launch to detect sandbox/permission failures
		browser = await pw.chromium.launch({ headless: true });
		return true;
	} catch {
		return false;
	}
}

hasBrowser = await canLaunchBrowser();

/**
 * Create a fresh page with the time shim injected, navigate to a minimal
 * HTML document, and optionally engage virtual time. When `engage` is true
 * (the default), returns the page in driver-controlled mode ready for
 * clock-advance assertions. When false, returns the page in passthrough
 * mode so callers can schedule real timers before engaging.
 */
async function createShimmedPage(bodyHtml = "", engage = true) {
	const context = await browser.newContext({
		viewport: { width: 800, height: 600 },
		deviceScaleFactor: 1,
	});

	try {
		const page = await context.newPage();

		await page.addInitScript({ content: TIME_SHIM_SOURCE });

		// Use a data URL for a minimal page -- no server needed
		const html = `<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 800px; height: 600px; }
</style></head>
<body>${bodyHtml}</body></html>`;

		await page.goto(`data:text/html,${encodeURIComponent(html)}`, {
			waitUntil: "domcontentloaded",
		});

		if (engage) {
			// Engage virtual time (switch from passthrough to driver-controlled)
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
		}

		return { page, context };
	} catch (e) {
		await context.close();
		throw e;
	}
}

type ShimPage = Awaited<ReturnType<typeof createShimmedPage>>["page"];

declare global {
	interface Window {
		__anims?: Record<string, Animation>;
		__finishedAt?: Record<string, number>;
		__finishError?: Record<string, string>;
		__finishEvent?: Record<string, boolean>;
	}
}

// Steps in which animation tests advance the clock, like render frames.
const FRAME_MS = 50;

// Real time animation tests may wait after each frame: a render clearly
// slower than real time.
const SLOW_FRAME_REAL_MS = 80;

const BOX_STYLE = "position:absolute;left:0;width:50px;height:50px;";

/** An absolutely positioned box per id, stacked so they don't overlap. */
function boxes(...ids: string[]): string {
	return ids.map((id, i) => `<div id="${id}" style="${BOX_STYLE}top:${i * 60}px;"></div>`).join("");
}

const SLIDE_CSS = "@keyframes slide { to { transform: translateX(1000px) } }";

/** A box with a CSS `animation` running the 1000px slide keyframes. */
function cssSlideBox(id: string, animation: string): string {
	return `<style>${SLIDE_CSS}</style><div id="${id}" style="${BOX_STYLE}top:0;animation:${animation};"></div>`;
}

/**
 * Advance the virtual clock by totalMs in frameMs steps, as the render driver
 * does. With realDelayMs, waits that much real time after each step, like a
 * render slower than real time: the browser's own document timeline keeps
 * running meanwhile.
 */
async function advanceClock(
	page: ShimPage,
	totalMs: number,
	frameMs = FRAME_MS,
	realDelayMs = 0,
): Promise<void> {
	for (let advanced = 0; advanced < totalMs; advanced += frameMs) {
		await page.evaluate(`window.__VW_ADVANCE_CLOCK__(${Math.min(frameMs, totalMs - advanced)})`);
		if (realDelayMs > 0) await page.waitForTimeout(realDelayMs);
	}
}

async function virtualNow(page: ShimPage): Promise<number> {
	return page.evaluate(() => performance.now());
}

/**
 * Keep an animation on #id as window.__anims[id] and record how it ends (see
 * recordEnd). With slideOptions, starts a linear WAAPI translateX(0 ->
 * 1000px) on #id, so for a 1000ms duration the offset in px equals progress
 * through an iteration in ms. Without, watches the element's existing (CSS)
 * animation.
 */
async function watchAnimation(
	page: ShimPage,
	id: string,
	slideOptions?: KeyframeAnimationOptions,
): Promise<void> {
	await page.evaluate(
		([elId, opts]) => {
			const el = document.getElementById(elId);
			if (!el) throw new Error(`#${elId} not found`);
			const anim = opts
				? el.animate([{ transform: "translateX(0px)" }, { transform: "translateX(1000px)" }], {
						easing: "linear",
						...opts,
					})
				: el.getAnimations()[0];
			window.__anims = { ...window.__anims, [elId]: anim };
		},
		[id, slideOptions] as const,
	);
	await recordEnd(page, id);
}

/**
 * Record how window.__anims[id] ends: the virtual time its current finished
 * promise resolves (window.__finishedAt[id]), the name of the error it
 * rejects with (window.__finishError[id]), and whether its finish event
 * fired (window.__finishEvent[id]). Call again after a replay, which gives
 * the animation a new finished promise.
 */
async function recordEnd(page: ShimPage, id: string): Promise<void> {
	await page.evaluate((elId) => {
		const anim = window.__anims?.[elId];
		if (!anim) throw new Error(`no animation ${elId}`);
		anim.finished.then(
			() => {
				window.__finishedAt = { ...window.__finishedAt, [elId]: performance.now() };
			},
			(e: Error) => {
				window.__finishError = { ...window.__finishError, [elId]: e.name };
			},
		);
		anim.addEventListener("finish", () => {
			window.__finishEvent = { ...window.__finishEvent, [elId]: true };
		});
	}, id);
}

/** Run an Animation method (play, pause, ...) on window.__anims[id]. */
async function callAnimation(
	page: ShimPage,
	id: string,
	method: "play" | "pause" | "reverse" | "finish" | "cancel",
): Promise<void> {
	await page.evaluate(([elId, name]) => window.__anims?.[elId]?.[name](), [id, method] as const);
}

async function setAnimationCurrentTime(page: ShimPage, id: string, ms: number): Promise<void> {
	await page.evaluate(
		([elId, value]) => {
			const anim = window.__anims?.[elId];
			if (anim) anim.currentTime = value;
		},
		[id, ms] as const,
	);
}

async function playState(page: ShimPage, id: string): Promise<string | undefined> {
	return page.evaluate((elId) => window.__anims?.[elId]?.playState, id);
}

/** Set inline style properties on #id, between frames. */
async function setStyle(page: ShimPage, id: string, style: Record<string, string>): Promise<void> {
	await page.evaluate(
		([elId, props]) => {
			const el = document.getElementById(elId);
			if (!el) throw new Error(`#${elId} not found`);
			Object.assign(el.style, props);
		},
		[id, style] as const,
	);
}

/** Set inline style properties on #id from the next frame's rAF callback, as a segment's play() would. */
async function setStyleNextFrame(
	page: ShimPage,
	id: string,
	style: Record<string, string>,
): Promise<void> {
	await page.evaluate(
		([elId, props]) => {
			requestAnimationFrame(() => {
				const el = document.getElementById(elId);
				if (el) Object.assign(el.style, props);
			});
		},
		[id, style] as const,
	);
}

async function finishedAt(page: ShimPage, id: string): Promise<number | undefined> {
	return page.evaluate((elId) => window.__finishedAt?.[elId], id);
}

async function animationCurrentTime(page: ShimPage, id: string): Promise<number> {
	return page.evaluate((elId) => Number(window.__anims?.[elId]?.currentTime), id);
}

async function translateX(page: ShimPage, id: string): Promise<number> {
	return page.evaluate((elId) => {
		const el = document.getElementById(elId);
		if (!el) throw new Error(`#${elId} not found`);
		const transform = getComputedStyle(el).transform;
		return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41;
	}, id);
}

/** Distance between two offsets on a 1000px loop, treating its end and start as the same point. */
function loopDistance(a: number, b: number): number {
	const d = Math.abs(a - b) % 1000;
	return Math.min(d, 1000 - d);
}

describe.skipIf(!hasBrowser)("time shim: primitive-level DOM assertions", () => {
	afterAll(async () => {
		if (!browser) return;
		try {
			await browser.close();
		} catch {
			// Suppress close errors to avoid masking test failures
		}
	});

	it("setTimeout fires at the correct virtual time", async () => {
		const { page, context } = await createShimmedPage('<div id="marker">before</div>');

		try {
			// Schedule a setTimeout to fire at 500ms virtual
			await page.evaluate(() => {
				setTimeout(() => {
					const el = document.getElementById("marker");
					if (el) el.textContent = "after";
				}, 500);
			});

			// At T=0 the marker should still be "before"
			expect(await page.locator("#marker").textContent()).toBe("before");

			// Advance to T=250ms -- not yet
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(250)");
			expect(await page.locator("#marker").textContent()).toBe("before");

			// Advance to T=500ms -- should fire
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(250)");
			expect(await page.locator("#marker").textContent()).toBe("after");
		} finally {
			await context.close();
		}
	});

	it("ctx.hold pattern fires at correct virtual time", async () => {
		// ctx.hold is setTimeout under the hood. Simulate the same pattern
		// SegmentRunner uses: setTimeout(resolve, ms) wrapped in a promise.
		const { page, context } = await createShimmedPage('<div id="step">0</div>');

		try {
			// Simulate a play() function that holds between steps
			await page.evaluate(`
				(function() {
					function hold(ms) {
						return new Promise(function(resolve) { setTimeout(resolve, ms); });
					}
					(async function() {
						var el = document.getElementById("step");
						if (!el) return;
						el.textContent = "1";
						await hold(300);
						el.textContent = "2";
						await hold(200);
						el.textContent = "3";
					})();
				})()
			`);

			// Step 1 should be visible immediately (synchronous before first hold)
			expect(await page.locator("#step").textContent()).toBe("1");

			// Advance to T=200ms -- first hold not done yet
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(200)");
			expect(await page.locator("#step").textContent()).toBe("1");

			// Advance to T=300ms -- first hold fires, step 2 visible
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(100)");
			expect(await page.locator("#step").textContent()).toBe("2");

			// Advance to T=400ms -- second hold not done yet
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(100)");
			expect(await page.locator("#step").textContent()).toBe("2");

			// Advance to T=500ms -- second hold fires, step 3 visible
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(100)");
			expect(await page.locator("#step").textContent()).toBe("3");
		} finally {
			await context.close();
		}
	});

	it("performance.now returns virtual time (ctx.clock pattern)", async () => {
		const { page, context } = await createShimmedPage("");

		try {
			// Read performance.now at T=0 (relative to engage time)
			// After engaging, virtualMs was set to the elapsed time since shim
			// install. We need a baseline to measure deltas.
			const baseline = await page.evaluate(() => performance.now());

			// Advance by 750ms
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(750)");
			const afterAdvance = await page.evaluate(() => performance.now());
			expect(afterAdvance - baseline).toBeCloseTo(750, 0);

			// Advance by another 250ms (total 1000ms)
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(250)");
			const afterSecond = await page.evaluate(() => performance.now());
			expect(afterSecond - baseline).toBeCloseTo(1000, 0);
		} finally {
			await context.close();
		}
	});

	it("ctx.clock pattern returns elapsed virtual ms since mount", async () => {
		// Simulate the pattern SegmentRunner.makeContext().clock() uses:
		// performance.now() at mount time, then performance.now() - mountedAt
		const { page, context } = await createShimmedPage("");

		try {
			// Simulate mount: record mountedAt = performance.now()
			await page.evaluate("window.__mountedAt = performance.now()");

			// Advance by 400ms
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(400)");

			// clock() = performance.now() - mountedAt
			const elapsed = await page.evaluate("performance.now() - window.__mountedAt");
			expect(elapsed).toBeCloseTo(400, 0);

			// Advance by another 600ms (total 1000ms)
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(600)");
			const elapsed2 = await page.evaluate("performance.now() - window.__mountedAt");
			expect(elapsed2).toBeCloseTo(1000, 0);
		} finally {
			await context.close();
		}
	});

	it("WAAPI translateX is driven by virtual clock", async () => {
		const { page, context } = await createShimmedPage(
			'<div id="box" style="position:absolute;left:0;top:0;width:50px;height:50px;background:red;"></div>',
		);

		try {
			// Start a 1000ms WAAPI animation: translateX(0 -> 200px)
			await page.evaluate(() => {
				const box = document.getElementById("box");
				if (!box) return;
				box.animate([{ transform: "translateX(0px)" }, { transform: "translateX(200px)" }], {
					duration: 1000,
					fill: "forwards",
					easing: "linear",
				});
			});

			// Tolerance for sub-pixel rounding and layout engine differences
			const TOLERANCE = 5;

			// At T=0 the box should be near 0
			const initial = await page.evaluate(() => {
				return document.getElementById("box")?.getBoundingClientRect().x ?? 0;
			});
			expect(Math.abs(initial)).toBeLessThan(TOLERANCE);

			// Advance to T=250ms -- should be near 50px (25% of 200px)
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(250)");
			const at250 = await page.evaluate(() => {
				return document.getElementById("box")?.getBoundingClientRect().x ?? 0;
			});
			expect(Math.abs(at250 - 50)).toBeLessThan(TOLERANCE);

			// Advance to T=500ms -- should be near 100px (50% of 200px)
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(250)");
			const at500 = await page.evaluate(() => {
				return document.getElementById("box")?.getBoundingClientRect().x ?? 0;
			});
			expect(Math.abs(at500 - 100)).toBeLessThan(TOLERANCE);

			// Advance to T=750ms -- should be near 150px (75% of 200px)
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(250)");
			const at750 = await page.evaluate(() => {
				return document.getElementById("box")?.getBoundingClientRect().x ?? 0;
			});
			expect(Math.abs(at750 - 150)).toBeLessThan(TOLERANCE);

			// Advance to T=1000ms -- should be at 200px (100% of 200px)
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(250)");
			const at1000 = await page.evaluate(() => {
				return document.getElementById("box")?.getBoundingClientRect().x ?? 0;
			});
			expect(Math.abs(at1000 - 200)).toBeLessThan(TOLERANCE);
		} finally {
			await context.close();
		}
	});

	it("WAAPI opacity animation is driven by virtual clock", async () => {
		const { page, context } = await createShimmedPage(
			'<div id="fade" style="width:100px;height:100px;background:blue;opacity:1;"></div>',
		);

		try {
			// Animate opacity from 1 to 0 over 1000ms
			await page.evaluate(() => {
				const el = document.getElementById("fade");
				if (!el) return;
				el.animate([{ opacity: 1 }, { opacity: 0 }], {
					duration: 1000,
					fill: "forwards",
					easing: "linear",
				});
			});

			const TOLERANCE = 0.1;

			// Advance to T=500ms -- opacity should be near 0.5
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(500)");
			const at500 = await page.evaluate(() => {
				const el = document.getElementById("fade");
				return el ? Number(getComputedStyle(el).opacity) : 1;
			});
			expect(Math.abs(at500 - 0.5)).toBeLessThan(TOLERANCE);

			// Advance to T=1000ms -- opacity should be near 0
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(500)");
			const at1000 = await page.evaluate(() => {
				const el = document.getElementById("fade");
				return el ? Number(getComputedStyle(el).opacity) : 1;
			});
			expect(Math.abs(at1000 - 0)).toBeLessThan(TOLERANCE);
		} finally {
			await context.close();
		}
	});

	it("setInterval fires repeatedly at correct virtual intervals", async () => {
		const { page, context } = await createShimmedPage('<div id="tick-count">0</div>');

		try {
			// Set up an interval that increments a counter every 100ms
			await page.evaluate(() => {
				let count = 0;
				const el = document.getElementById("tick-count");
				if (!el) return;
				setInterval(() => {
					count++;
					el.textContent = String(count);
				}, 100);
			});

			expect(await page.locator("#tick-count").textContent()).toBe("0");

			// Advance to T=100ms -- 1 tick
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(100)");
			expect(await page.locator("#tick-count").textContent()).toBe("1");

			// Advance to T=300ms -- 3 ticks total
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(200)");
			expect(await page.locator("#tick-count").textContent()).toBe("3");

			// Advance to T=500ms -- 5 ticks total
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(200)");
			expect(await page.locator("#tick-count").textContent()).toBe("5");
		} finally {
			await context.close();
		}
	});

	it("clearInterval cancels pending virtual interval", async () => {
		const { page, context } = await createShimmedPage('<div id="ci-count">0</div>');

		try {
			// Set up an interval, let it fire twice, then cancel
			await page.evaluate(() => {
				let count = 0;
				const el = document.getElementById("ci-count");
				if (!el) return;
				const id = setInterval(() => {
					count++;
					el.textContent = String(count);
					// Cancel after 2 ticks
					if (count >= 2) clearInterval(id);
				}, 100);
			});

			expect(await page.locator("#ci-count").textContent()).toBe("0");

			// Advance to T=200ms -- 2 ticks, then interval should be cancelled
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(200)");
			expect(await page.locator("#ci-count").textContent()).toBe("2");

			// Advance to T=500ms -- should still be 2 since interval was cancelled
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(300)");
			expect(await page.locator("#ci-count").textContent()).toBe("2");
		} finally {
			await context.close();
		}
	});

	it("requestAnimationFrame fires on each clock advance", async () => {
		const { page, context } = await createShimmedPage('<div id="raf-count">0</div>');

		try {
			// Set up a RAF loop that counts frames
			await page.evaluate(`
				(function() {
					var count = 0;
					var el = document.getElementById("raf-count");
					if (!el) return;
					function loop() {
						count++;
						el.textContent = String(count);
						requestAnimationFrame(loop);
					}
					requestAnimationFrame(loop);
				})()
			`);

			expect(await page.locator("#raf-count").textContent()).toBe("0");

			// Each __VW_ADVANCE_CLOCK__ call fires queued RAF callbacks
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(16)");
			expect(await page.locator("#raf-count").textContent()).toBe("1");

			await page.evaluate("window.__VW_ADVANCE_CLOCK__(16)");
			expect(await page.locator("#raf-count").textContent()).toBe("2");

			await page.evaluate("window.__VW_ADVANCE_CLOCK__(16)");
			expect(await page.locator("#raf-count").textContent()).toBe("3");
		} finally {
			await context.close();
		}
	});

	it("Date.now advances with virtual clock", async () => {
		const { page, context } = await createShimmedPage("");

		try {
			const baseDate = await page.evaluate(() => Date.now());

			await page.evaluate("window.__VW_ADVANCE_CLOCK__(1000)");
			const after1s = await page.evaluate(() => Date.now());

			// Date.now should have advanced by ~1000ms
			expect(after1s - baseDate).toBeCloseTo(1000, -1);

			await page.evaluate("window.__VW_ADVANCE_CLOCK__(500)");
			const after1500 = await page.evaluate(() => Date.now());

			expect(after1500 - baseDate).toBeCloseTo(1500, -1);
		} finally {
			await context.close();
		}
	});

	it("clearTimeout cancels pending virtual timer", async () => {
		const { page, context } = await createShimmedPage('<div id="cleared">original</div>');

		try {
			await page.evaluate(() => {
				const id = setTimeout(() => {
					const el = document.getElementById("cleared");
					if (el) el.textContent = "changed";
				}, 200);
				// Cancel before it fires
				clearTimeout(id);
			});

			// Advance past the timer's scheduled time
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(500)");

			// Should still be "original" since we cancelled the timer
			expect(await page.locator("#cleared").textContent()).toBe("original");
		} finally {
			await context.close();
		}
	});

	it("multiple timers fire in chronological order", async () => {
		const { page, context } = await createShimmedPage('<div id="order"></div>');

		try {
			// Schedule timers out of order
			await page.evaluate(() => {
				const el = document.getElementById("order");
				if (!el) return;
				setTimeout(() => {
					el.textContent += "B";
				}, 200);
				setTimeout(() => {
					el.textContent += "A";
				}, 100);
				setTimeout(() => {
					el.textContent += "C";
				}, 300);
			});

			// Advance past all timers
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(400)");

			// Should fire in chronological order: A(100) B(200) C(300)
			expect(await page.locator("#order").textContent()).toBe("ABC");
		} finally {
			await context.close();
		}
	});

	it("chained ctx.hold does not accumulate frame-rounding drift", async () => {
		// Regression test: before the async microtask-drain fix, chained holds
		// whose durations don't align to frame boundaries would drift. Each hold
		// would cost ceil(ms / frameMs) * frameMs instead of exactly ms, because
		// awaiting code resumed at the frame boundary (target) rather than at
		// the timer's actual fireAt.
		//
		// This test simulates 10 chained hold(34) calls advanced in 16.67ms
		// frames (60fps). Without the fix, each hold(34) costs 3 frames (50ms)
		// for a total of 500ms. With the fix, total should be 340ms.
		const { page, context } = await createShimmedPage('<div id="drift-count">0</div>');

		try {
			// Launch async chain of 10 hold(34) calls, incrementing a counter after each
			await page.evaluate(`
				(function() {
					function hold(ms) {
						return new Promise(function(resolve) { setTimeout(resolve, ms); });
					}
					(async function() {
						var el = document.getElementById("drift-count");
						if (!el) return;
						for (var i = 0; i < 10; i++) {
							await hold(34);
							el.textContent = String(i + 1);
						}
					})();
				})()
			`);

			expect(await page.locator("#drift-count").textContent()).toBe("0");

			// Advance 340ms in 16.67ms frames (approx 20.4 frames).
			// With the fix, all 10 holds complete within 340ms of virtual time.
			const frameMs = 1000 / 60;
			const framesNeeded = Math.ceil(340 / frameMs); // 21 frames
			for (let i = 0; i < framesNeeded; i++) {
				await page.evaluate(`window.__VW_ADVANCE_CLOCK__(${frameMs})`);
			}

			// All 10 holds should have completed (no drift)
			expect(await page.locator("#drift-count").textContent()).toBe("10");

			// Verify that without the fix this would NOT have completed:
			// 10 holds × 3 frames × 16.67ms = 500ms would be needed.
			// We only advanced 21 frames (~350ms), proving drift is eliminated.
		} finally {
			await context.close();
		}
	});

	it("chained ctx.hold registers next timer at fireAt, not frame boundary", async () => {
		// Verifies the precise timing: a hold(34) starting at T=0 should
		// resolve at T=34, and the next hold(34) should fire at T=68, not T=50+34=84.
		const { page, context } = await createShimmedPage('<div id="fire-times"></div>');

		try {
			await page.evaluate(`
				(function() {
					function hold(ms) {
						return new Promise(function(resolve) { setTimeout(resolve, ms); });
					}
					(async function() {
						var el = document.getElementById("fire-times");
						if (!el) return;
						var times = [];
						for (var i = 0; i < 3; i++) {
							await hold(34);
							times.push(Math.round(performance.now()));
						}
						el.textContent = times.join(",");
					})();
				})()
			`);

			// We need to know the baseline (virtualMs at engage time)
			const baseline = (await page.evaluate("performance.now()")) as number;

			// Advance enough frames to complete 3 holds of 34ms = 102ms total
			const frameMs = 1000 / 60;
			const framesNeeded = Math.ceil(102 / frameMs); // 7 frames
			for (let i = 0; i < framesNeeded; i++) {
				await page.evaluate(`window.__VW_ADVANCE_CLOCK__(${frameMs})`);
			}

			const text = await page.locator("#fire-times").textContent();
			expect(text).toBeTruthy();
			const times = (text ?? "").split(",").map(Number);
			expect(times.length).toBe(3);

			// Each hold(34) should fire at baseline+34, baseline+68, baseline+102
			// (within 1ms tolerance for floating point)
			const baselineRounded = Math.round(baseline);
			expect(times[0]).toBe(baselineRounded + 34);
			expect(times[1]).toBe(baselineRounded + 68);
			expect(times[2]).toBe(baselineRounded + 102);
		} finally {
			await context.close();
		}
	});

	it("passthrough hold survives engagement and resolves on virtual clock", async () => {
		// Regression test for the first-segment hold hang: a hold() (setTimeout)
		// scheduled during passthrough mode must be converted to a virtual timer
		// at engagement time, not cancelled.
		const { page, context } = await createShimmedPage(
			'<div id="thing" style="opacity:0;"></div>',
			false,
		);

		try {
			// Start an async play()-like function while still in passthrough mode.
			// The hold(500) creates a real setTimeout whose resolve callback must
			// survive the passthrough-to-driver transition.
			await page.evaluate(`
				(function() {
					function hold(ms) {
						return new Promise(function(resolve) { setTimeout(resolve, ms); });
					}
					(async function() {
						var el = document.getElementById("thing");
						if (!el) return;
						await hold(500);
						el.animate(
							[{ opacity: 0 }, { opacity: 1 }],
							{ duration: 200, fill: 'forwards' }
						);
						await hold(1000);
						el.dataset.done = "true";
					})();
				})()
			`);

			// Engage virtual time. The pending real setTimeout(resolve, 500) must
			// be converted to a virtual timer rather than being cancelled.
			// Engagement happens within a few ms (a single page.evaluate round-trip),
			// well before the 500ms real timer fires in wall-clock time.
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");

			// Before advancing: thing should still be at opacity 0, not done
			const opacityBefore = await page.evaluate(() => {
				const el = document.getElementById("thing");
				return el ? Number(getComputedStyle(el).opacity) : -1;
			});
			expect(opacityBefore).toBe(0);

			// Advance past the first hold (500ms) and past the animation (200ms)
			// Total: 800ms should show the animation completed (opacity 1)
			const frameMs = 1000 / 60;
			const framesFor800 = Math.ceil(800 / frameMs);
			for (let i = 0; i < framesFor800; i++) {
				await page.evaluate(`window.__VW_ADVANCE_CLOCK__(${frameMs})`);
			}

			const opacityAfterAnim = await page.evaluate(() => {
				const el = document.getElementById("thing");
				return el ? Number(getComputedStyle(el).opacity) : -1;
			});
			expect(opacityAfterAnim).toBeCloseTo(1, 0);

			// Now advance past the second hold (1000ms more from the animation start)
			// Second hold(1000) starts at ~700ms (after 500ms hold + 200ms anim), resolves at ~1700ms.
			// Let's advance to 1600ms total to be safe
			const totalAdvancedSoFar = framesFor800 * frameMs;
			const remainingMs = 1600 - totalAdvancedSoFar;
			const framesRemaining = Math.ceil(remainingMs / frameMs);
			for (let i = 0; i < framesRemaining; i++) {
				await page.evaluate(`window.__VW_ADVANCE_CLOCK__(${frameMs})`);
			}

			const done = await page.evaluate(() => {
				return document.getElementById("thing")?.dataset.done;
			});
			expect(done).toBe("true");
		} finally {
			await context.close();
		}
	});

	it("passthrough setInterval is converted to virtual interval at engagement", async () => {
		const { page, context } = await createShimmedPage('<div id="interval-count">0</div>', false);

		try {
			// Start a setInterval during passthrough mode
			await page.evaluate(() => {
				let count = 0;
				const el = document.getElementById("interval-count");
				if (!el) return;
				setInterval(() => {
					count++;
					el.textContent = String(count);
				}, 100);
			});

			// Engage virtual time immediately -- the interval should be converted
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");

			expect(await page.locator("#interval-count").textContent()).toBe("0");

			// Advance 300ms -- should fire 3 times (at 100ms, 200ms, 300ms).
			// Engagement happens within ms of scheduling, so the first virtual
			// fire is at ~100ms with negligible time elapsed in passthrough.
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(300)");
			const count = await page.locator("#interval-count").textContent();
			expect(Number(count)).toBe(3);
		} finally {
			await context.close();
		}
	});

	it("passthrough rAF callback fires on first virtual clock advance", async () => {
		const { page, context } = await createShimmedPage('<div id="raf-marker">before</div>', false);

		try {
			// Schedule the rAF and engage virtual time in a single evaluate so the
			// browser cannot commit a frame between the two CDP roundtrips and fire
			// the real rAF before engagement has a chance to convert it.
			await page.evaluate(`
				requestAnimationFrame(() => {
					const el = document.getElementById("raf-marker");
					if (el) el.textContent = "after";
				});
				window.__VW_ENGAGE_VIRTUAL_TIME__();
			`);

			// Before advancing, rAF should not have fired yet
			expect(await page.locator("#raf-marker").textContent()).toBe("before");

			// Advance one frame -- the converted rAF callback should fire
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(16)");
			expect(await page.locator("#raf-marker").textContent()).toBe("after");
		} finally {
			await context.close();
		}
	});

	it("WAAPI iterations: Infinity keeps looping past its first iteration", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, iterations: Number.POSITIVE_INFINITY });

			let now = 0;
			for (const t of [250, 1500, 2750, 3900]) {
				await advanceClock(page, t - now);
				now = t;
				expect(await translateX(page, "box"), `at ${t}ms`).toBeCloseTo(t % 1000, 0);
			}
		} finally {
			await context.close();
		}
	});

	it("WAAPI iterations: Infinity never resolves finished", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, iterations: Number.POSITIVE_INFINITY });
			await advanceClock(page, 10_000, 100);

			expect(await finishedAt(page, "box")).toBeUndefined();
			expect(await translateX(page, "box")).toBeCloseTo(0, 0);
			await advanceClock(page, 400);
			expect(await translateX(page, "box")).toBeCloseTo(400, 0);
		} finally {
			await context.close();
		}
	});

	it("WAAPI iterations: 3 animates every iteration and finishes at 3x duration", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000, iterations: 3, fill: "forwards" });

			let now = 0;
			for (const t of [500, 1500, 2500]) {
				await advanceClock(page, t - now);
				now = t;
				expect(await translateX(page, "box"), `at ${t}ms`).toBeCloseTo(500, 0);
			}

			await advanceClock(page, 450);
			expect(await finishedAt(page, "box")).toBeUndefined();

			await advanceClock(page, 200);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 3000, 3);
			expect(await translateX(page, "box")).toBeCloseTo(1000, 0);
		} finally {
			await context.close();
		}
	});

	it("WAAPI end time includes delay and endDelay", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", {
				duration: 500,
				delay: 200,
				endDelay: 300,
				iterations: 2,
			});
			await advanceClock(page, 2000);

			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1500, 3);
		} finally {
			await context.close();
		}
	});

	it("end time follows updateTiming() after the animation is tracked", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000, iterations: Number.POSITIVE_INFINITY });
			await advanceClock(page, 500);
			await page.evaluate(() => window.__anims?.box.effect?.updateTiming({ iterations: 2 }));
			await advanceClock(page, 2000);

			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 2000, 3);
		} finally {
			await context.close();
		}
	});

	it("WAAPI playbackRate scales progress, including a mid-animation change", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
			await page.evaluate(() => {
				const anim = window.__anims?.box;
				if (anim) anim.playbackRate = 2;
			});

			await advanceClock(page, 250);
			expect(await translateX(page, "box")).toBeCloseTo(500, 0);

			await page.evaluate(() => window.__anims?.box.updatePlaybackRate(0.5));
			await advanceClock(page, 500);
			expect(await translateX(page, "box")).toBeCloseTo(750, 0);
			expect(await finishedAt(page, "box")).toBeUndefined();

			await advanceClock(page, 600);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1250, 3);
		} finally {
			await context.close();
		}
	});

	it("WAAPI with negative playbackRate finishes when it plays back to 0", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000 });
			await advanceClock(page, 600);
			await page.evaluate(() => {
				const anim = window.__anims?.box;
				if (anim) anim.playbackRate = -1;
			});

			await advanceClock(page, 300);
			expect(await translateX(page, "box")).toBeCloseTo(300, 0);
			expect(await finishedAt(page, "box")).toBeUndefined();

			await advanceClock(page, 400);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1200, 3);
		} finally {
			await context.close();
		}
	});

	it("cancelled infinite animation is not driven again", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, iterations: Number.POSITIVE_INFINITY });
			await advanceClock(page, 1500);
			await page.evaluate(() => window.__anims?.box.cancel());
			await advanceClock(page, 1000);

			expect(await page.evaluate(() => window.__anims?.box.playState)).toBe("idle");
			expect(await translateX(page, "box")).toBe(0);
			expect(await page.evaluate(() => window.__finishError?.box)).toBe("AbortError");
		} finally {
			await context.close();
		}
	});

	it("removed element: infinite loop stops being driven, finite animation still finishes", async () => {
		const { page, context } = await createShimmedPage(boxes("loop", "once"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "loop", { duration: 1000, iterations: Number.POSITIVE_INFINITY });
			await watchAnimation(page, "once", { duration: 1000 });
			await advanceClock(page, 300);
			await page.evaluate(() => {
				document.getElementById("loop")?.remove();
				document.getElementById("once")?.remove();
			});
			await advanceClock(page, 1200);

			expect(await animationCurrentTime(page, "loop")).toBeCloseTo(300, 3);
			expect((await finishedAt(page, "once")) ?? Number.NaN).toBeCloseTo(t0 + 1000, 3);
		} finally {
			await context.close();
		}
	});

	it("player transition pattern: fill-forwards pair resolves at its duration, cancel clears it", async () => {
		// Mirrors src/player/transitions/fade.ts plus clearSlotAnimations().
		const { page, context } = await createShimmedPage(boxes("out", "in"));

		try {
			const t0 = await virtualNow(page);
			await page.evaluate(() => {
				const out = document.getElementById("out");
				const incoming = document.getElementById("in");
				if (!out || !incoming) throw new Error("transition elements not found");
				const opts = { duration: 400, fill: "forwards" as const };
				const outAnim = out.animate([{ opacity: 1 }, { opacity: 0 }], opts);
				const inAnim = incoming.animate([{ opacity: 0 }, { opacity: 1 }], opts);
				window.__anims = { out: outAnim, in: inAnim };
				Promise.all([outAnim.finished, inAnim.finished]).then(() => {
					window.__finishedAt = { transition: performance.now() };
				});
			});
			const opacity = (id: string) =>
				page.evaluate((elId) => {
					const el = document.getElementById(elId);
					return el ? Number(getComputedStyle(el).opacity) : Number.NaN;
				}, id);

			const frameMs = 1000 / 60;
			await advanceClock(page, 500, frameMs);
			const doneAt = (await finishedAt(page, "transition")) ?? Number.NaN;
			expect(doneAt - t0).toBeGreaterThanOrEqual(400 - 1e-6);
			expect(doneAt - t0).toBeLessThan(400 + frameMs);
			expect(await opacity("out")).toBe(0);
			expect(await opacity("in")).toBe(1);

			await page.evaluate(() => {
				for (const anim of Object.values(window.__anims ?? {})) anim.cancel();
			});
			await advanceClock(page, 200, frameMs);
			expect(await opacity("out")).toBe(1);
		} finally {
			await context.close();
		}
	});

	it("finished read during boot resolves at the virtual end time and fires finish", async () => {
		// Segment 1's play() runs before engagement, so `await el.animate(...).finished`
		// holds the browser's own promise from passthrough mode.
		const { page, context } = await createShimmedPage(boxes("box"), false);

		try {
			await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			const t0 = await virtualNow(page);
			const remaining = 1000 - (await animationCurrentTime(page, "box"));

			await advanceClock(page, 1200);

			const doneAt = (await finishedAt(page, "box")) ?? Number.NaN;
			expect(doneAt - t0).toBeGreaterThanOrEqual(remaining - 1e-6);
			expect(doneAt - t0).toBeLessThan(remaining + FRAME_MS);
			expect(await page.evaluate(() => window.__anims?.box.playState)).toBe("finished");
			expect(await translateX(page, "box")).toBeCloseTo(1000, 0);
			// Finish events are dispatched on the browser's next rendered frame.
			await page.screenshot();
			expect(await page.evaluate(() => window.__finishEvent?.box)).toBe(true);
		} finally {
			await context.close();
		}
	});

	it("engagement leaves animations paused during boot paused", async () => {
		const { page, context } = await createShimmedPage(
			`${cssSlideBox("css", "slide 1s linear infinite paused")}<div id="waapi" style="${BOX_STYLE}top:60px;"></div>`,
			false,
		);

		try {
			await watchAnimation(page, "waapi", {
				duration: 1000,
				iterations: Number.POSITIVE_INFINITY,
			});
			await page.evaluate(() => {
				const anim = window.__anims?.waapi;
				if (!anim) return;
				anim.currentTime = 300;
				anim.pause();
			});
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			// Not a whole number of loops, so a driven loop can't land back in place.
			await advanceClock(page, 2250);

			expect(await translateX(page, "css")).toBe(0);
			expect(await translateX(page, "waapi")).toBeCloseTo(300, 0);
		} finally {
			await context.close();
		}
	});

	it("engagement keeps CSS and WAAPI infinite loops from boot looping", async () => {
		const { page, context } = await createShimmedPage(
			`${cssSlideBox("css", "slide 1s linear infinite")}<div id="waapi" style="${BOX_STYLE}top:60px;"></div>`,
			false,
		);

		try {
			await watchAnimation(page, "waapi", {
				duration: 1000,
				iterations: Number.POSITIVE_INFINITY,
			});
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			const start = { css: await translateX(page, "css"), waapi: await translateX(page, "waapi") };

			let now = 0;
			for (const t of [1250, 2500, 3750]) {
				await advanceClock(page, t - now);
				now = t;
				for (const id of ["css", "waapi"] as const) {
					const expected = start[id] + t;
					expect(
						loopDistance(await translateX(page, id), expected),
						`${id} at ${t}ms`,
					).toBeLessThan(1);
				}
			}
		} finally {
			await context.close();
		}
	});

	it("engagement finishes a 3-iteration CSS animation at its full end time", async () => {
		const { page, context } = await createShimmedPage(
			cssSlideBox("css", "slide 1s linear 3 forwards"),
			false,
		);

		try {
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			await watchAnimation(page, "css");
			const t0 = await virtualNow(page);
			const remaining = 3000 - (await animationCurrentTime(page, "css"));

			await advanceClock(page, remaining - 1500);
			expect(await translateX(page, "css")).toBeCloseTo(500, 0);
			expect(await finishedAt(page, "css")).toBeUndefined();

			await advanceClock(page, 1600);
			expect((await finishedAt(page, "css")) ?? Number.NaN).toBeCloseTo(t0 + remaining, 3);
			expect(await translateX(page, "css")).toBeCloseTo(1000, 0);
		} finally {
			await context.close();
		}
	});

	it("end time follows CSS changes to an adopted CSS animation", async () => {
		const { page, context } = await createShimmedPage(
			cssSlideBox("css", "slide 1s linear infinite"),
			false,
		);

		try {
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			await watchAnimation(page, "css");
			const t0 = await virtualNow(page);
			const remaining = 2000 - (await animationCurrentTime(page, "css"));
			await page.evaluate(() => {
				const el = document.getElementById("css");
				if (el) el.style.animationIterationCount = "2";
			});
			await advanceClock(page, 2500);

			const doneAt = (await finishedAt(page, "css")) ?? Number.NaN;
			expect(doneAt - t0).toBeGreaterThanOrEqual(remaining - 1e-6);
			expect(doneAt - t0).toBeLessThan(remaining + FRAME_MS);
		} finally {
			await context.close();
		}
	});

	// ----- Animations started or changed after engagement -----
	// Advances without a real delay run far faster than real time; ones with
	// SLOW_FRAME_REAL_MS run slower. Either way, an animation left on the
	// browser's real-time document timeline ends up at a wrong position.

	it("CSS animation started after engagement follows the virtual clock at any render speed", async () => {
		const { page, context } = await createShimmedPage(`<style>${SLIDE_CSS}</style>${boxes("css")}`);

		try {
			await setStyle(page, "css", { animation: "slide 1s linear infinite" });
			await watchAnimation(page, "css");
			// The browser starts it on its real-time timeline meanwhile.
			await page.waitForTimeout(150);

			// Counted from the virtual time it was created at, not its real currentTime.
			await advanceClock(page, FRAME_MS);
			expect(await translateX(page, "css")).toBeCloseTo(FRAME_MS, 0);
			await advanceClock(page, 250, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBeCloseTo(300, 0);
			await advanceClock(page, 1950);
			expect(await translateX(page, "css")).toBeCloseTo(250, 0);
			expect(await finishedAt(page, "css")).toBeUndefined();
		} finally {
			await context.close();
		}
	});

	it("CSS animation started by a frame callback's promise continuation is taken over in that frame", async () => {
		const { page, context } = await createShimmedPage(`<style>${SLIDE_CSS}</style>${boxes("css")}`);

		try {
			await advanceClock(page, 2 * FRAME_MS);
			const t0 = await virtualNow(page);
			await page.evaluate(() => {
				requestAnimationFrame(() => {
					Promise.resolve().then(() => {
						const el = document.getElementById("css");
						if (el) el.style.animation = "slide 1s linear 2 forwards";
					});
				});
			});

			// Treated as started at the previous frame: one frame of progress.
			await advanceClock(page, FRAME_MS);
			expect(await translateX(page, "css")).toBeCloseTo(FRAME_MS, 0);

			await watchAnimation(page, "css");
			await advanceClock(page, 2000);
			expect((await finishedAt(page, "css")) ?? Number.NaN).toBeCloseTo(t0 + 2000, 3);
			expect(await translateX(page, "css")).toBeCloseTo(1000, 0);
		} finally {
			await context.close();
		}
	});

	it("CSS transition started after engagement follows the virtual clock and ends at its duration", async () => {
		const { page, context } = await createShimmedPage(
			`<div id="box" style="${BOX_STYLE}top:0;transition:transform 1s linear;"></div>`,
		);

		try {
			// Computes the style the transition starts from.
			expect(await translateX(page, "box")).toBe(0);
			const t0 = await virtualNow(page);
			await setStyleNextFrame(page, "box", { transform: "translateX(1000px)" });

			await advanceClock(page, FRAME_MS);
			expect(await translateX(page, "box")).toBeCloseTo(FRAME_MS, 0);
			await watchAnimation(page, "box");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(250, 0);
			await advanceClock(page, 700);
			expect(await finishedAt(page, "box")).toBeUndefined();

			await advanceClock(page, 100);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1000, 3);
			expect(await translateX(page, "box")).toBe(1000);
		} finally {
			await context.close();
		}
	});

	it("CSS transition started after awaiting finished starts at the finish, however slow the render", async () => {
		const { page, context } = await createShimmedPage(
			`<style>.moved { transform: translateX(1000px) }</style>${boxes("lead")}<div id="box" style="${BOX_STYLE}top:60px;transition:transform 150ms linear;"></div>`,
		);

		try {
			// Computes the style the transition starts from.
			expect(await translateX(page, "box")).toBe(0);
			await page.evaluate(() => {
				const lead = document
					.getElementById("lead")
					?.animate([{ transform: "translateX(0px)" }, { transform: "translateX(1000px)" }], {
						duration: 100,
					});
				void (async () => {
					await lead?.finished;
					document.getElementById("box")?.classList.add("moved");
				})();
			});

			// Each frame takes longer in real time than the whole transition.
			const realGapMs = 250;
			await advanceClock(page, 100, FRAME_MS, realGapMs);
			expect(await translateX(page, "box")).toBeCloseTo(0, 0);
			await advanceClock(page, FRAME_MS, FRAME_MS, realGapMs);
			expect(await translateX(page, "box")).toBeCloseTo(1000 / 3, 0);
			await advanceClock(page, FRAME_MS, FRAME_MS, realGapMs);
			expect(await translateX(page, "box")).toBeCloseTo(2000 / 3, 0);
			await advanceClock(page, FRAME_MS, FRAME_MS, realGapMs);
			expect(await translateX(page, "box")).toBe(1000);
		} finally {
			await context.close();
		}
	});

	it("CSS animation cancelled during the segment is not taken over again", async () => {
		const { page, context } = await createShimmedPage(`<style>${SLIDE_CSS}</style>${boxes("css")}`);

		try {
			await setStyle(page, "css", { animation: "slide 1s linear infinite" });
			await watchAnimation(page, "css");
			await advanceClock(page, 300);
			expect(await translateX(page, "css")).toBeCloseTo(300, 0);

			await callAnimation(page, "css", "cancel");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			await advanceClock(page, 800);

			expect(await playState(page, "css")).toBe("idle");
			expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
			expect(await translateX(page, "css")).toBe(0);
			expect(await page.evaluate(() => window.__finishError?.css)).toBe("AbortError");
		} finally {
			await context.close();
		}
	});

	it("new Animation(new KeyframeEffect(...), document.timeline).play() follows the virtual clock", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await page.evaluate(() => {
				const effect = new KeyframeEffect(
					document.getElementById("box"),
					[{ transform: "translateX(0px)" }, { transform: "translateX(1000px)" }],
					{ duration: 1000, iterations: 2, easing: "linear" },
				);
				const anim = new Animation(effect, document.timeline);
				window.__anims = { box: anim };
				anim.play();
			});
			await recordEnd(page, "box");

			await advanceClock(page, 250, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(250, 0);
			await advanceClock(page, 1000);
			expect(await translateX(page, "box")).toBeCloseTo(250, 0);
			await advanceClock(page, 800);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 2000, 3);
		} finally {
			await context.close();
		}
	});

	it("play() after finish replays on the virtual clock, with a new finished promise", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
			await advanceClock(page, 1100);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1000, 3);

			await callAnimation(page, "box", "play");
			await recordEnd(page, "box");
			await advanceClock(page, 250, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(250, 0);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1000, 3);

			await advanceClock(page, 800);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 2100, 3);
			expect(await translateX(page, "box")).toBeCloseTo(1000, 0);
		} finally {
			await context.close();
		}
	});

	it("seek back after finish follows the virtual clock", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
			await advanceClock(page, 1100);

			await setAnimationCurrentTime(page, "box", 200);
			await recordEnd(page, "box");
			await advanceClock(page, 300, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(500, 0);

			await advanceClock(page, 600);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1900, 3);
		} finally {
			await context.close();
		}
	});

	it("scrub (pause, then seek every frame) holds the seeked time past the end time", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
			await advanceClock(page, 300);
			await page.evaluate(() => {
				const anim = window.__anims?.box;
				if (!anim) return;
				anim.pause();
				const scrub = () => {
					anim.currentTime = 500;
					requestAnimationFrame(scrub);
				};
				requestAnimationFrame(scrub);
			});

			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBe(500);
			await advanceClock(page, 1000);
			expect(await translateX(page, "box")).toBe(500);
			expect(await playState(page, "box")).toBe("paused");
			expect(await finishedAt(page, "box")).toBeUndefined();
		} finally {
			await context.close();
		}
	});

	it("timing extension after finish continues on the virtual clock from where it would be", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
			await advanceClock(page, 1500);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1000, 3);

			// As in a browser, the finished animation's clock kept running.
			await page.evaluate(() => window.__anims?.box.effect?.updateTiming({ duration: 3000 }));
			await advanceClock(page, FRAME_MS);
			await recordEnd(page, "box");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo((1750 / 3000) * 1000, 0);

			await advanceClock(page, 1300);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 3000, 3);
		} finally {
			await context.close();
		}
	});

	it("more iterations on a finished CSS animation continue it on the virtual clock", async () => {
		const { page, context } = await createShimmedPage(`<style>${SLIDE_CSS}</style>${boxes("css")}`);

		try {
			const t0 = await virtualNow(page);
			await setStyle(page, "css", { animation: "slide 1s linear 1 forwards" });
			await watchAnimation(page, "css");
			await advanceClock(page, 1500);
			expect((await finishedAt(page, "css")) ?? Number.NaN).toBeCloseTo(t0 + 1000, 3);

			await setStyle(page, "css", { animationIterationCount: "3" });
			await advanceClock(page, FRAME_MS);
			await recordEnd(page, "css");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBeCloseTo(750, 0);
			await advanceClock(page, 1300);
			expect((await finishedAt(page, "css")) ?? Number.NaN).toBeCloseTo(t0 + 3000, 3);
		} finally {
			await context.close();
		}
	});

	it("playbackRate flip after finish plays back from its end on the virtual clock", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, fill: "both" });
			await advanceClock(page, 1100);
			await page.evaluate(() => window.__anims?.box.updatePlaybackRate(-1));

			// Found running at the next frame, and played back from the start of that frame.
			await advanceClock(page, FRAME_MS);
			expect(await translateX(page, "box")).toBeCloseTo(1000 - FRAME_MS, 0);
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(1000 - FRAME_MS - 200, 0);
		} finally {
			await context.close();
		}
	});

	it.each([
		["alone", false],
		["followed by play()", true],
	] as const)(
		"playbackRate flip in a finished handler, %s, plays back from the finish",
		async (_, callPlay) => {
			const { page, context } = await createShimmedPage(boxes("box"));

			try {
				await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
				// A ping-pong: the handler runs after the clock advance that finished it.
				await page.evaluate((play) => {
					const anim = window.__anims?.box;
					anim?.finished.then(() => {
						anim.playbackRate = -1;
						if (play) anim.play();
					});
				}, callPlay);

				await advanceClock(page, 1000);
				await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
				expect(await translateX(page, "box")).toBeCloseTo(800, 0);
			} finally {
				await context.close();
			}
		},
	);

	it("pause() right after a playbackRate change between frames pauses where it was shown", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 4000 });
			await advanceClock(page, 500);
			await page.evaluate(() => {
				const anim = window.__anims?.box;
				if (!anim) return;
				anim.playbackRate = 2;
				anim.pause();
			});

			await advanceClock(page, 200);
			expect(await animationCurrentTime(page, "box")).toBeCloseTo(500, 3);
		} finally {
			await context.close();
		}
	});

	it("pause() holds a driven animation still, and play() resumes it from there", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, iterations: Number.POSITIVE_INFINITY });
			await advanceClock(page, 300);
			// Held paused by the shim, but playing on the virtual clock.
			expect(await playState(page, "box")).toBe("running");
			await callAnimation(page, "box", "pause");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			await advanceClock(page, 800);
			expect(await translateX(page, "box")).toBeCloseTo(300, 0);
			expect(await playState(page, "box")).toBe("paused");

			await callAnimation(page, "box", "play");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(500, 0);
		} finally {
			await context.close();
		}
	});

	it("play() on a playing animation from a frame callback is a no-op, as in a browser", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, iterations: Number.POSITIVE_INFINITY });
			await page.evaluate(() => {
				const keepPlaying = () => {
					window.__anims?.box.play();
					requestAnimationFrame(keepPlaying);
				};
				requestAnimationFrame(keepPlaying);
			});

			await advanceClock(page, 300);
			expect(await translateX(page, "box")).toBeCloseTo(300, 0);
		} finally {
			await context.close();
		}
	});

	it("reverse() plays a driven animation back on the virtual clock", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000 });
			await advanceClock(page, 600);
			await callAnimation(page, "box", "reverse");

			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(400, 0);
			expect(await finishedAt(page, "box")).toBeUndefined();

			await advanceClock(page, 500);
			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 1200, 3);
		} finally {
			await context.close();
		}
	});

	it("finish() by the author finishes at that virtual time and stays finished", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			const t0 = await virtualNow(page);
			await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
			await advanceClock(page, 300);
			await callAnimation(page, "box", "finish");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);

			expect((await finishedAt(page, "box")) ?? Number.NaN).toBeCloseTo(t0 + 300, 3);
			expect(await playState(page, "box")).toBe("finished");
			expect(await translateX(page, "box")).toBe(1000);
		} finally {
			await context.close();
		}
	});

	it.each([
		["pause", FRAME_MS],
		["play", FRAME_MS + 40],
		["reverse", FRAME_MS - 40],
	] as const)(
		"%s() on a CSS animation not taken over yet starts from its virtual time",
		async (method, afterMs) => {
			const { page, context } = await createShimmedPage(
				`<style>${SLIDE_CSS}</style>${boxes("css")}`,
			);

			try {
				await setStyle(page, "css", { animation: "slide 1s linear forwards" });
				// The browser starts it on its real-time timeline meanwhile.
				await page.waitForTimeout(150);
				await page.evaluate((name) => {
					requestAnimationFrame(() => document.getElementById("css")?.getAnimations()[0][name]());
				}, method);

				// Treated as started at the previous frame, as the scan would: one frame of progress.
				await advanceClock(page, FRAME_MS);
				expect(await translateX(page, "css")).toBeCloseTo(FRAME_MS, 0);
				await advanceClock(page, 40, 20, SLOW_FRAME_REAL_MS);
				expect(await translateX(page, "css")).toBeCloseTo(afterMs, 0);
			} finally {
				await context.close();
			}
		},
	);

	it.each([
		["pause", "animation", 0, 0],
		["reverse", "animation", 1000, 1000 - FRAME_MS],
		["pause", "transition", 0, 0],
		["reverse", "transition", 1000, 1000 - FRAME_MS],
	] as const)(
		"%s() on a CSS %s started in the same frame callback acts at its exact time, as in a browser",
		async (method, kind, shownMs, nextFrameMs) => {
			const { page, context } = await createShimmedPage(
				`<style>${SLIDE_CSS}</style><div id="css" style="${BOX_STYLE}top:0;transition:transform 1s linear;"></div>`,
			);

			try {
				// Computes the style a transition starts from.
				expect(await translateX(page, "css")).toBe(0);
				await advanceClock(page, FRAME_MS);
				await page.evaluate(
					([name, start]) => {
						requestAnimationFrame(() => {
							const el = document.getElementById("css");
							if (!el) return;
							if (start === "animation") el.style.animation = "slide 1s linear forwards";
							else el.style.transform = "translateX(1000px)";
							el.getAnimations()[0][name]();
						});
					},
					[method, kind] as const,
				);

				// Pending, at 0: paused there, or reversed from the end.
				await advanceClock(page, FRAME_MS);
				expect(await translateX(page, "css")).toBeCloseTo(shownMs, 0);
				await advanceClock(page, FRAME_MS, FRAME_MS, SLOW_FRAME_REAL_MS);
				expect(await translateX(page, "css")).toBeCloseTo(nextFrameMs, 0);
			} finally {
				await context.close();
			}
		},
	);

	it.each([
		["pause()", "pause", 1550, "paused"],
		["a startTime write", "startTime", 1750, "running"],
	] as const)(
		"%s on a finished animation revived since the previous frame uses its virtual time",
		async (_, action, expectedMs, expectedPlayState) => {
			const { page, context } = await createShimmedPage(boxes("box"));

			try {
				await watchAnimation(page, "box", { duration: 1000, fill: "forwards" });
				await advanceClock(page, 1500);
				await page.evaluate(() => window.__anims?.box.effect?.updateTiming({ duration: 3000 }));
				// Running on the real-time timeline meanwhile.
				await page.waitForTimeout(150);
				await page.evaluate((act) => {
					requestAnimationFrame(() => {
						const anim = window.__anims?.box;
						if (act === "pause") anim?.pause();
						else if (anim) anim.startTime = 0;
					});
				}, action);

				// Continued from its finish at 1000ms, as the scan would: at 1550ms
				// in that frame, then paused there or playing on.
				await advanceClock(page, FRAME_MS);
				await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
				expect(await translateX(page, "box")).toBeCloseTo((expectedMs / 3000) * 1000, 0);
				expect(await playState(page, "box")).toBe(expectedPlayState);
			} finally {
				await context.close();
			}
		},
	);

	it("infinite loop resumes when its element is put back in the document", async () => {
		const { page, context } = await createShimmedPage(boxes("box"));

		try {
			await watchAnimation(page, "box", { duration: 1000, iterations: Number.POSITIVE_INFINITY });
			await advanceClock(page, 300);
			await page.evaluate(() => {
				const el = document.getElementById("box");
				if (!el) return;
				(window as unknown as { __removed: Element }).__removed = el;
				el.remove();
			});
			await advanceClock(page, 1200);
			await page.evaluate(() => {
				document.body.append((window as unknown as { __removed: Element }).__removed);
			});

			// Its clock kept running while it was out of the document, as in a browser.
			await advanceClock(page, FRAME_MS);
			expect(await translateX(page, "box")).toBeCloseTo(550, 0);
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "box")).toBeCloseTo(750, 0);
		} finally {
			await context.close();
		}
	});

	it("infinite loop started before its element is attached plays once it is attached", async () => {
		const { page, context } = await createShimmedPage();

		try {
			await page.evaluate((style) => {
				const el = document.createElement("div");
				el.id = "late";
				el.setAttribute("style", `${style}top:0;`);
				const anim = el.animate(
					[{ transform: "translateX(0px)" }, { transform: "translateX(1000px)" }],
					{ duration: 1000, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
				);
				window.__anims = { late: anim };
				(window as unknown as { __late: Element }).__late = el;
			}, BOX_STYLE);
			await advanceClock(page, FRAME_MS);
			await page.evaluate(() => {
				document.body.append((window as unknown as { __late: Element }).__late);
			});

			await advanceClock(page, FRAME_MS);
			expect(await translateX(page, "late")).toBeCloseTo(2 * FRAME_MS, 0);
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "late")).toBeCloseTo(2 * FRAME_MS + 200, 0);
		} finally {
			await context.close();
		}
	});

	it("CSS animation resumed by animation-play-state continues from where it was paused", async () => {
		const { page, context } = await createShimmedPage(
			cssSlideBox("css", "slide 1s linear infinite"),
			false,
		);

		try {
			await page.waitForTimeout(200);
			await setStyle(page, "css", { animationPlayState: "paused" });
			await watchAnimation(page, "css");
			// The pause is pending until the browser renders a frame: read the time it holds once it has.
			await page.evaluate(async () => {
				await window.__anims?.css?.ready;
			});
			const pausedAt = await animationCurrentTime(page, "css");
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBeCloseTo(pausedAt, 0);

			// Resumed in this frame's callbacks: applies from the start of the frame.
			await setStyleNextFrame(page, "css", { animationPlayState: "running" });
			await advanceClock(page, FRAME_MS);
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			const expected = pausedAt + FRAME_MS + 200;
			expect(loopDistance(await translateX(page, "css"), expected)).toBeLessThan(1);
		} finally {
			await context.close();
		}
	});

	it("startTime writes don't move an animation, even once the render lags real time", async () => {
		// Motion sets startTime from its rAF frame time, which is virtual. On the
		// real-time timeline that puts the animation past its end once the render
		// lags real time by more than its duration.
		const { page, context } = await createShimmedPage(boxes("virtual", "real", "stopped"));

		try {
			await page.waitForTimeout(1500);
			await page.evaluate(() => {
				requestAnimationFrame(() => {
					const slide = (id: string) => {
						const el = document.getElementById(id);
						if (!el) throw new Error(`#${id} not found`);
						return el.animate(
							[{ transform: "translateX(0px)" }, { transform: "translateX(1000px)" }],
							{
								duration: 1000,
								easing: "linear",
							},
						);
					};
					const virtual = slide("virtual");
					virtual.startTime = performance.now();
					const real = slide("real");
					real.startTime = (document.timeline.currentTime as number) - 500;
					window.__anims = { virtual, real, stopped: slide("stopped") };
				});
			});
			await advanceClock(page, 100, 100);
			const startedAt = await virtualNow(page);
			for (const id of ["virtual", "real", "stopped"]) await recordEnd(page, id);
			await page.evaluate(() => {
				const stopped = window.__anims?.stopped;
				if (stopped) stopped.startTime = null;
			});

			await advanceClock(page, 100, 100, SLOW_FRAME_REAL_MS);
			for (const id of ["virtual", "real"]) {
				expect(await translateX(page, id), id).toBeCloseTo(100, 0);
				expect(await finishedAt(page, id), id).toBeUndefined();
				expect(await playState(page, id), id).toBe("running");
			}
			expect(await translateX(page, "stopped")).toBe(0);
			expect(await playState(page, "stopped")).toBe("paused");

			await advanceClock(page, 1000);
			expect((await finishedAt(page, "virtual")) ?? Number.NaN).toBeCloseTo(startedAt + 1000, 3);
			expect(await finishedAt(page, "stopped")).toBeUndefined();
		} finally {
			await context.close();
		}
	});

	it("animation-play-state pauses and resumes a CSS animation started after engagement", async () => {
		const { page, context } = await createShimmedPage(`<style>${SLIDE_CSS}</style>${boxes("css")}`);

		try {
			await setStyle(page, "css", { animation: "slide 1s linear infinite" });
			await watchAnimation(page, "css");
			await advanceClock(page, 300);
			expect(await playState(page, "css")).toBe("running");

			// Paused between frames: holds from the start of the next frame.
			await setStyle(page, "css", { animationPlayState: "paused" });
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBeCloseTo(300, 0);
			expect(await playState(page, "css")).toBe("paused");

			// Resumed in a frame callback: plays from the start of that frame.
			await setStyleNextFrame(page, "css", { animationPlayState: "running" });
			await advanceClock(page, FRAME_MS);
			expect(await translateX(page, "css")).toBeCloseTo(300 + FRAME_MS, 0);
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBeCloseTo(500 + FRAME_MS, 0);
			expect(await playState(page, "css")).toBe("running");
		} finally {
			await context.close();
		}
	});

	it("a class that sets animation-play-state pauses a CSS loop running from boot", async () => {
		const { page, context } = await createShimmedPage(
			`<style>${SLIDE_CSS}
			#css { animation: slide 1s linear infinite; }
			#css.held { animation-play-state: paused; }</style>${boxes("css")}`,
			false,
		);

		try {
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			await advanceClock(page, 100);
			const pausedAt = await translateX(page, "css");

			await page.evaluate(() => document.getElementById("css")?.classList.add("held"));
			await advanceClock(page, 400, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBeCloseTo(pausedAt, 0);

			await page.evaluate(() => document.getElementById("css")?.classList.remove("held"));
			await advanceClock(page, 250, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(loopDistance(await translateX(page, "css"), pausedAt + 250)).toBeLessThan(1);
		} finally {
			await context.close();
		}
	});

	it("CSS animation paused by CSS resumes from where it was after a frame renders in between", async () => {
		const { page, context } = await createShimmedPage(
			cssSlideBox("css", "slide 1s linear infinite"),
			false,
		);

		try {
			await page.waitForTimeout(200);
			await setStyle(page, "css", { animationPlayState: "paused" });
			await watchAnimation(page, "css");
			await page.evaluate(async () => {
				await window.__anims?.css?.ready;
			});
			const pausedAt = await animationCurrentTime(page, "css");
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			await advanceClock(page, 200);

			// Resumed between frames (e.g. after ctx.waitForNext()), and the
			// browser renders a frame before the next clock advance.
			await setStyle(page, "css", { animationPlayState: "running" });
			await page.screenshot();
			await page.waitForTimeout(100);
			await advanceClock(page, FRAME_MS);
			expect(loopDistance(await translateX(page, "css"), pausedAt + FRAME_MS)).toBeLessThan(1);
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(loopDistance(await translateX(page, "css"), pausedAt + FRAME_MS + 200)).toBeLessThan(
				1,
			);
		} finally {
			await context.close();
		}
	});

	it("play() on a CSS animation overrides animation-play-state, as in a browser", async () => {
		const { page, context } = await createShimmedPage(`<style>${SLIDE_CSS}</style>${boxes("css")}`);

		try {
			await setStyle(page, "css", { animation: "slide 1s linear infinite paused" });
			await watchAnimation(page, "css");
			await advanceClock(page, 200, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBe(0);

			await callAnimation(page, "css", "play");
			await advanceClock(page, 300, FRAME_MS, SLOW_FRAME_REAL_MS);
			expect(await translateX(page, "css")).toBeCloseTo(300, 0);
			expect(await playState(page, "css")).toBe("running");
		} finally {
			await context.close();
		}
	});

	it("animations on scroll timelines are left to the browser", async () => {
		const { page, context } = await createShimmedPage(
			`<style>${SLIDE_CSS}</style>
			<div id="css" style="${BOX_STYLE}top:0;animation:slide 1s linear;animation-timeline:scroll(root);"></div>
			<div id="waapi" style="${BOX_STYLE}top:60px;"></div>
			<div style="height:3000px;"></div>`,
			false,
		);

		try {
			await watchAnimation(page, "css");
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			await page.evaluate(() => {
				const el = document.getElementById("waapi");
				if (!el) return;
				// Not in TypeScript's DOM lib yet.
				const { ScrollTimeline } = window as unknown as {
					ScrollTimeline: new (options: { source: Element }) => AnimationTimeline;
				};
				const anim = el.animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: 1000,
					timeline: new ScrollTimeline({ source: document.documentElement }),
				});
				window.__anims = { ...window.__anims, waapi: anim };
			});
			await advanceClock(page, 200);

			for (const id of ["css", "waapi"]) {
				expect(await playState(page, id), id).toBe("running");
				const currentTimeType = await page.evaluate(
					(animId) => typeof window.__anims?.[animId]?.currentTime,
					id,
				);
				expect(currentTimeType, id).not.toBe("number");
			}
		} finally {
			await context.close();
		}
	});

	it("passthrough mode leaves author control of animations to the browser", async () => {
		const { page, context } = await createShimmedPage(boxes("box"), false);

		try {
			await watchAnimation(page, "box", { duration: 10_000 });
			await callAnimation(page, "box", "pause");
			await setAnimationCurrentTime(page, "box", 200);
			await callAnimation(page, "box", "play");
			await page.waitForTimeout(300);

			expect(await playState(page, "box")).toBe("running");
			expect(await animationCurrentTime(page, "box")).toBeGreaterThan(400);
		} finally {
			await context.close();
		}
	});
});

// ---- Deferred frame work (ctx.deferFrame) ----

/**
 * In-page helper source: `window.__realTicks(n)` resolves after n round trips through a
 * MessageChannel. Message events run on the browser's real event loop (the shim does not
 * virtualize them), so the promise settles after the clock advance would otherwise have
 * returned: it stands in for a <video> seek.
 */
const REAL_TICKS = `window.__realTicks = (n) => new Promise((resolve) => {
	const ch = new MessageChannel(); let k = 0;
	ch.port1.onmessage = () => { if (++k >= n) resolve(); else ch.port2.postMessage(0); };
	ch.port2.postMessage(0);
});`;

/** A frame callback that defers real-async work which then marks the DOM. */
function deferFromFrameCallback(page: ShimPage, ticks: number, marker = "done") {
	return page.evaluate(
		`${REAL_TICKS}
		requestAnimationFrame(() => {
			window.__VW_DEFER_FRAME__(window.__realTicks(${ticks}).then(() => {
				document.body.dataset.mark = ${JSON.stringify(marker)};
			}));
		});`,
	);
}

/**
 * A 10-frame VP9 WebM (lossless, 25fps, 16×16), frame i a solid gray of level 20 + 20·i,
 * as a data URL. Null when ffmpeg is unavailable.
 */
async function grayStepsWebm(): Promise<string | null> {
	const { execFileSync } = await import("node:child_process");
	const { mkdtempSync, readFileSync, rmSync } = await import("node:fs");
	const { join } = await import("node:path");
	const { tmpdir } = await import("node:os");
	const dir = mkdtempSync(join(tmpdir(), "vw-defer-"));
	try {
		const out = join(dir, "steps.webm");
		// geq paints each frame from its index N.
		execFileSync(
			"ffmpeg",
			[
				"-y",
				"-loglevel",
				"error",
				"-f",
				"lavfi",
				"-i",
				"color=c=black:s=16x16:r=25:d=0.4,format=gray,geq=lum='20+20*N'",
				"-c:v",
				"libvpx-vp9",
				"-lossless",
				"1",
				"-g",
				"1",
				"-pix_fmt",
				"yuv420p",
				out,
			],
			{ stdio: "ignore" },
		);
		return `data:video/webm;base64,${readFileSync(out).toString("base64")}`;
	} catch {
		return null;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

describe.skipIf(!hasBrowser)("time shim: deferred frame work", () => {
	it("the clock advance waits for work deferred in a frame callback", async () => {
		const { page, context } = await createShimmedPage();
		try {
			await deferFromFrameCallback(page, 20);
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(16)");
			// Settled before the advance returned, so a screenshot taken now would show it.
			expect(await page.evaluate("document.body.dataset.mark")).toBe("done");
		} finally {
			await context.close();
		}
	});

	it("work deferred while settling is waited for too", async () => {
		const { page, context } = await createShimmedPage();
		try {
			await page.evaluate(
				`${REAL_TICKS}
				requestAnimationFrame(() => {
					window.__VW_DEFER_FRAME__(window.__realTicks(5).then(() => {
						window.__VW_DEFER_FRAME__(window.__realTicks(5).then(() => {
							document.body.dataset.mark = "second";
						}));
					}));
				});`,
			);
			await page.evaluate("window.__VW_ADVANCE_CLOCK__(16)");
			expect(await page.evaluate("document.body.dataset.mark")).toBe("second");
		} finally {
			await context.close();
		}
	});

	it("a rejected deferral does not fail the frame", async () => {
		const { page, context } = await createShimmedPage();
		try {
			await page.evaluate(
				`requestAnimationFrame(() => { window.__VW_DEFER_FRAME__(Promise.reject(new Error("x"))); });`,
			);
			await expect(page.evaluate("window.__VW_ADVANCE_CLOCK__(16)")).resolves.toBeUndefined();
		} finally {
			await context.close();
		}
	});

	it("work still pending at the limit fails the advance", async () => {
		const { page, context } = await createShimmedPage();
		try {
			await page.evaluate(
				`window.__VW_DEFER_TIMEOUT_MS__ = 200;
				requestAnimationFrame(() => { window.__VW_DEFER_FRAME__(new Promise(() => {})); });`,
			);
			await expect(page.evaluate("window.__VW_ADVANCE_CLOCK__(16)")).rejects.toThrow(
				/ctx\.deferFrame: work deferred at .* was still pending after 200ms/,
			);
		} finally {
			await context.close();
		}
	});

	it("deferrals before engagement are ignored", async () => {
		const { page, context } = await createShimmedPage("", false);
		try {
			await page.evaluate("window.__VW_DEFER_FRAME__(new Promise(() => {}))");
			await page.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");
			await expect(page.evaluate("window.__VW_ADVANCE_CLOCK__(16)")).resolves.toBeUndefined();
		} finally {
			await context.close();
		}
	});

	it("a <video> seeked from the frame clock shows the right frame at every advance", async () => {
		const src = await grayStepsWebm();
		if (!src) return; // no ffmpeg: nothing to decode
		const { page, context } = await createShimmedPage();
		try {
			await page.evaluate(
				`new Promise((resolve, reject) => {
					const v = document.createElement("video");
					v.muted = true; v.preload = "auto"; v.src = ${JSON.stringify(src)};
					v.onloadeddata = resolve; v.onerror = () => reject(new Error("video failed to load"));
					document.body.appendChild(v);
					window.__video = v;
				})`,
			);
			// The clip pattern: each frame callback seeks to the middle of the source frame for
			// this virtual time and defers the frame until the seek lands. 40ms frames = 25fps.
			await page.evaluate(
				`const v = window.__video; const start = performance.now();
				const tick = () => {
					const n = Math.round((performance.now() - start) / 40);
					const seeked = new Promise((r) => v.addEventListener("seeked", r, { once: true }));
					v.currentTime = (n + 0.5) / 25;
					window.__VW_DEFER_FRAME__(seeked);
					requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);`,
			);
			const levels: number[] = [];
			for (let n = 0; n < 8; n++) {
				// Read the frame the moment the advance returns, as the driver's screenshot does.
				levels.push(
					(await page.evaluate(`(async () => {
						await window.__VW_ADVANCE_CLOCK__(40);
						const c = document.createElement("canvas"); c.width = 16; c.height = 16;
						const g = c.getContext("2d"); g.drawImage(window.__video, 0, 0);
						return g.getImageData(8, 8, 1, 1).data[0];
					})()`)) as number,
				);
			}
			// Advance n (from 1) shows source frame n: gray 20 + 20n, within YUV rounding.
			levels.forEach((level, i) => {
				expect(Math.abs(level - (20 + 20 * (i + 1)))).toBeLessThanOrEqual(3);
			});
		} finally {
			await context.close();
		}
	});
});
