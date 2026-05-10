/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { SegmentRunner } from "../../src/segment/SegmentRunner.js";
import { defineSegment } from "../../src/segment/defineSegment.js";

describe("SegmentRunner render mode", () => {
	it("render_mode_hold_uses_setTimeout_like_interactive", async () => {
		// With the JS time shim approach, hold() uses real setTimeout in both modes.
		// In render mode in the browser, the shim virtualizes setTimeout.
		// In unit tests (jsdom), we use vi.useFakeTimers to simulate this.
		vi.useFakeTimers();

		let holdDone = false;
		const segment = defineSegment({
			id: "test-hold",
			advances: [5.0],
			async play(ctx) {
				await ctx.hold(5000);
				holdDone = true;
			},
		});

		const runner = new SegmentRunner(segment, { mode: "render" });
		const el = document.createElement("div");
		await runner.mount(el);
		const p = runner.startPlay();

		await Promise.resolve();
		expect(holdDone).toBe(false);

		// Advance fake timers to simulate the shim advancing virtual time
		vi.advanceTimersByTime(5000);
		await Promise.resolve();
		await p;
		expect(holdDone).toBe(true);
		expect(runner.currentState).toBe("done");

		vi.useRealTimers();
	});

	it("render_mode_clock_uses_performance_now", async () => {
		// Clock uses performance.now() in both modes. In render mode in the
		// browser, the shim virtualizes performance.now(). In unit tests, we
		// mock it directly.
		let now = 0;
		vi.spyOn(performance, "now").mockImplementation(() => now);

		let capturedClock: (() => number) | undefined;
		const segment = defineSegment({
			id: "test-clock",
			advances: [1.0, 2.0],
			async play(ctx) {
				capturedClock = ctx.clock;
				await ctx.waitForNext();
			},
		});

		const runner = new SegmentRunner(segment, { mode: "render" });
		const el = document.createElement("div");
		await runner.mount(el);
		runner.startPlay();

		await new Promise((r) => setTimeout(r, 10));
		expect(capturedClock).toBeDefined();
		const clock = capturedClock as () => number;

		// At mount, clock is 0
		expect(clock()).toBe(0);

		// Simulating virtual time advancing (what the shim does in the browser)
		now = 500;
		expect(clock()).toBe(500);

		now = 1500;
		expect(clock()).toBe(1500);

		runner.unmount();
		vi.restoreAllMocks();
	});

	it("render_mode_context_reports_render", async () => {
		let reportedMode = "";

		const segment = defineSegment({
			id: "test-mode",
			advances: [1.0],
			async play(ctx) {
				reportedMode = ctx.mode;
			},
		});

		const runner = new SegmentRunner(segment, { mode: "render" });
		const el = document.createElement("div");
		await runner.mount(el);
		await runner.startPlay();

		expect(reportedMode).toBe("render");
	});

	it("render_mode_hold_and_clock_behave_same_as_interactive", async () => {
		// This is the key behavioral test: both modes use the same
		// underlying APIs (setTimeout, performance.now). The difference
		// is that in render mode in the browser, the JS shim intercepts these.
		vi.useFakeTimers();

		let interactiveHoldDone = false;
		let renderHoldDone = false;

		const makeSegment = (id: string) =>
			defineSegment({
				id,
				advances: [1.0],
				async play(ctx) {
					await ctx.hold(100);
				},
			});

		// Interactive mode
		const iRunner = new SegmentRunner(makeSegment("interactive-test"), { mode: "interactive" });
		const iEl = document.createElement("div");
		await iRunner.mount(iEl);
		const iP = iRunner.startPlay().then(() => {
			interactiveHoldDone = true;
		});

		// Render mode
		const rRunner = new SegmentRunner(makeSegment("render-test"), { mode: "render" });
		const rEl = document.createElement("div");
		await rRunner.mount(rEl);
		const rP = rRunner.startPlay().then(() => {
			renderHoldDone = true;
		});

		await Promise.resolve();
		expect(interactiveHoldDone).toBe(false);
		expect(renderHoldDone).toBe(false);

		vi.advanceTimersByTime(100);
		await Promise.resolve();
		await Promise.resolve();
		await iP;
		await rP;

		expect(interactiveHoldDone).toBe(true);
		expect(renderHoldDone).toBe(true);

		vi.useRealTimers();
	});

	it("render_mode_waitForNext_still_requires_trigger", async () => {
		let waitResolved = false;

		const segment = defineSegment({
			id: "test-wait",
			advances: [1.0, 2.0],
			async play(ctx) {
				await ctx.waitForNext();
				waitResolved = true;
			},
		});

		const runner = new SegmentRunner(segment, { mode: "render" });
		const el = document.createElement("div");
		await runner.mount(el);
		runner.startPlay();

		// Wait a tick to let the promise chain run
		await new Promise((r) => setTimeout(r, 10));

		// waitForNext should NOT have resolved -- still waiting for trigger
		expect(waitResolved).toBe(false);

		// Now trigger it
		const consumed = runner.triggerNext();
		expect(consumed).toBe(true);

		await new Promise((r) => setTimeout(r, 10));
		expect(waitResolved).toBe(true);
	});
});
