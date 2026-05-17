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
});
