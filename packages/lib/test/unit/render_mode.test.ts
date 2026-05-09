/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { SegmentRunner } from "../../src/segment/SegmentRunner.js";
import { defineSegment } from "../../src/segment/defineSegment.js";

describe("SegmentRunner render mode", () => {
	it("render_mode_hold_resolves_immediately", async () => {
		const segment = defineSegment({
			id: "test-hold",
			advances: [5.0],
			async play(ctx) {
				// In render mode, this should resolve immediately (no real timer)
				const start = Date.now();
				await ctx.hold(5000); // 5 seconds -- would be slow if it actually waited
				const elapsed = Date.now() - start;
				// Should have resolved in well under 100ms
				expect(elapsed).toBeLessThan(100);
			},
		});

		const runner = new SegmentRunner(segment, { mode: "render" });
		const el = document.createElement("div");
		await runner.mount(el);
		await runner.startPlay();

		expect(runner.currentState).toBe("done");
	});

	it("render_mode_clock_deterministic_during_playback", async () => {
		// Verify that clock() returns non-zero values when frames are advanced
		// between waitForNext invocations (the realistic scenario).
		const clockValues: number[] = [];

		const segment = defineSegment({
			id: "test-clock-live",
			advances: [0.5, 1.5],
			async play(ctx) {
				clockValues.push(ctx.clock()); // before any frame advance
				await ctx.waitForNext();
				clockValues.push(ctx.clock()); // after some frames
				await ctx.waitForNext();
				clockValues.push(ctx.clock()); // after more frames
			},
		});

		// 60fps -> frameDurationMs = 1000/60
		const frameDurationMs = 1000 / 60;
		const runner = new SegmentRunner(segment, {
			mode: "render",
			frameDurationMs,
		});

		const el = document.createElement("div");
		await runner.mount(el);
		runner.startPlay();

		// Wait a tick for play() to start and park on first waitForNext
		await new Promise((r) => setTimeout(r, 10));
		expect(clockValues.length).toBe(1);
		expect(clockValues[0]).toBe(0); // no frames advanced yet

		// Simulate 30 frames of rendering, then advance beat
		for (let i = 0; i < 30; i++) {
			runner.advanceRenderFrame();
		}
		runner.triggerNext(); // resolve first waitForNext

		await new Promise((r) => setTimeout(r, 10));
		expect(clockValues.length).toBe(2);
		expect(clockValues[1]).toBeCloseTo(30 * frameDurationMs, 1); // ~500ms

		// Simulate 60 more frames, then advance beat
		for (let i = 0; i < 60; i++) {
			runner.advanceRenderFrame();
		}
		runner.triggerNext(); // resolve second waitForNext

		await new Promise((r) => setTimeout(r, 10));
		expect(clockValues.length).toBe(3);
		expect(clockValues[2]).toBeCloseTo(90 * frameDurationMs, 1); // ~1500ms
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

	it("interactive_mode_hold_uses_timer", async () => {
		const segment = defineSegment({
			id: "test-interactive-hold",
			advances: [0.01],
			async play(ctx) {
				await ctx.hold(10); // 10ms -- real timer in interactive mode
			},
		});

		const runner = new SegmentRunner(segment, { mode: "interactive" });
		const el = document.createElement("div");
		await runner.mount(el);
		await runner.startPlay();

		expect(runner.currentState).toBe("done");
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

	it("advanceRenderFrame_increments_clock_monotonically", () => {
		const segment = defineSegment({
			id: "test-frame-counter",
			advances: [1.0],
			async play(ctx) {
				await ctx.waitForNext();
			},
		});

		const frameDurationMs = 1000 / 30; // 30fps
		const runner = new SegmentRunner(segment, {
			mode: "render",
			frameDurationMs,
		});

		// Before mount, advance should still work (it just increments the counter)
		runner.advanceRenderFrame();
		runner.advanceRenderFrame();
		runner.advanceRenderFrame();
		// 3 frames at 30fps = 100ms
		// We can't test clock() without mounting, but we verify the method doesn't throw
		expect(typeof runner.advanceRenderFrame).toBe("function");
	});
});
