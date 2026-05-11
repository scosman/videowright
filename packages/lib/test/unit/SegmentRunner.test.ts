import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SegmentRunner, isAbortError } from "../../src/segment/SegmentRunner.js";
import {
	type PlayerContext,
	SEGMENT_BRAND,
	type Segment,
	type SegmentSpec,
} from "../../src/types.js";

function makeSegment(overrides: Partial<SegmentSpec> = {}): Segment {
	return Object.freeze({
		id: "test",
		advances: [1],
		async play() {},
		[SEGMENT_BRAND]: true as const,
		...overrides,
	});
}

function makeElement(): HTMLElement {
	// Minimal stub -- SegmentRunner only passes it through to segment.mount
	return {} as HTMLElement;
}

describe("SegmentRunner", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// ---- mount ----

	it("runner_mount_calls_segment_mount", async () => {
		const mountFn = vi.fn();
		const seg = makeSegment({ mount: mountFn });
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		const el = makeElement();

		await runner.mount(el);

		expect(mountFn).toHaveBeenCalledOnce();
		expect(mountFn.mock.calls[0][0]).toBe(el);
		// Second argument is a PlayerContext
		const ctx = mountFn.mock.calls[0][1] as PlayerContext;
		expect(typeof ctx.waitForNext).toBe("function");
		expect(typeof ctx.hold).toBe("function");
		expect(typeof ctx.clock).toBe("function");
		expect(ctx.mode).toBe("interactive");
		expect(ctx.signal).toBeInstanceOf(AbortSignal);
	});

	it("runner_mount_skips_if_no_mount_fn", async () => {
		const seg = makeSegment();
		const runner = new SegmentRunner(seg, { mode: "interactive" });

		// Should resolve without error
		await runner.mount(makeElement());
	});

	it("runner_mount_rejects_if_already_mounted", async () => {
		const seg = makeSegment();
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());

		await expect(runner.mount(makeElement())).rejects.toThrow("already mounted");
	});

	// ---- play ----

	it("runner_play_creates_fresh_ctx", async () => {
		const contexts: PlayerContext[] = [];
		const seg = makeSegment({
			async play(ctx) {
				contexts.push(ctx);
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		await runner.startPlay();

		expect(contexts).toHaveLength(1);
		expect(contexts[0].mode).toBe("interactive");
	});

	it("runner_startPlay_rejects_if_not_mounted", () => {
		const seg = makeSegment();
		const runner = new SegmentRunner(seg, { mode: "interactive" });

		expect(() => runner.startPlay()).toThrow("not mounted");
	});

	// ---- ctx.signal ----

	it("ctx_signal_aborts_on_unmount", async () => {
		let capturedSignal: AbortSignal | undefined;
		const seg = makeSegment({
			async play(ctx) {
				capturedSignal = ctx.signal;
				await ctx.waitForNext(); // park so we can unmount
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		runner.startPlay(); // don't await -- it parks on waitForNext

		expect(capturedSignal).toBeDefined();
		expect(capturedSignal?.aborted).toBe(false);

		runner.unmount();
		expect(capturedSignal?.aborted).toBe(true);
	});

	it("ctx_signal_does_not_abort_on_play_resolution", async () => {
		let capturedSignal: AbortSignal | undefined;
		const seg = makeSegment({
			async play(ctx) {
				capturedSignal = ctx.signal;
				// No waitForNext -- play resolves immediately
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		await runner.startPlay();

		expect(capturedSignal?.aborted).toBe(false);
	});

	// ---- ctx.clock ----

	it("ctx_clock_zero_at_mount", async () => {
		let mountClockValue = -1;
		const seg = makeSegment({
			mount(_el, ctx) {
				mountClockValue = ctx.clock();
			},
			async play() {},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());

		expect(mountClockValue).toBeGreaterThanOrEqual(0);
		expect(mountClockValue).toBeLessThan(50);
	});

	it("ctx_clock_advances", async () => {
		let now = 1000;
		vi.spyOn(performance, "now").mockImplementation(() => now);

		let capturedClock: (() => number) | undefined;
		const seg = makeSegment({
			async play(ctx) {
				capturedClock = ctx.clock;
				await ctx.waitForNext();
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		runner.startPlay();

		expect(capturedClock).toBeDefined();
		const clock = capturedClock as () => number;
		const t1 = clock();
		now += 100;
		const t2 = clock();

		expect(t1).toBe(0);
		expect(t2).toBe(100);

		runner.unmount();
		vi.restoreAllMocks();
	});

	// ---- waitForNext ----

	it("wait_for_next_queues_until_triggered", async () => {
		let resolved = false;
		const seg = makeSegment({
			async play(ctx) {
				await ctx.waitForNext();
				resolved = true;
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const playDone = runner.startPlay();

		// Give the microtask queue a tick
		await Promise.resolve();
		expect(resolved).toBe(false);

		runner.triggerNext();
		await Promise.resolve();
		await Promise.resolve();
		expect(resolved).toBe(true);

		await playDone;
	});

	it("wait_for_next_increments_beat_counter", async () => {
		const seg = makeSegment({
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.waitForNext();
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		runner.startPlay();
		await Promise.resolve();

		expect(runner.currentBeat).toBe(0);

		runner.triggerNext();
		await Promise.resolve();
		expect(runner.currentBeat).toBe(1);

		runner.triggerNext();
		await Promise.resolve();
		expect(runner.currentBeat).toBe(2);

		runner.unmount();
	});

	it("wait_for_next_returns_false_after_play_done", async () => {
		const seg = makeSegment({
			async play() {
				// No waitForNext -- play finishes immediately
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		await runner.startPlay();

		// No pending resolvers, so defaultNext returns false
		expect(runner.triggerNext()).toBe(false);
	});

	// ---- seekBeats ----

	it("seek_beats_resolves_synchronously", async () => {
		const beatLog: number[] = [];
		const seg = makeSegment({
			async play(ctx) {
				await ctx.waitForNext();
				beatLog.push(1);
				await ctx.waitForNext();
				beatLog.push(2);
				await ctx.waitForNext();
				beatLog.push(3);
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive", seekBeats: 2 });
		await runner.mount(makeElement());
		runner.startPlay();

		// The first 2 waitForNext calls resolve synchronously (Promise.resolve)
		// After microtask flushing, beats 1 and 2 should have logged
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		expect(beatLog).toEqual([1, 2]);
		expect(runner.currentBeat).toBe(2);

		// Third wait should queue normally
		runner.triggerNext();
		await Promise.resolve();
		await Promise.resolve();
		expect(beatLog).toEqual([1, 2, 3]);
		expect(runner.currentBeat).toBe(3);

		runner.unmount();
	});

	it("seek_beats_normal_after_exhausted", async () => {
		let secondWaitResolved = false;
		const seg = makeSegment({
			async play(ctx) {
				await ctx.waitForNext(); // seek: resolves immediately
				await ctx.waitForNext(); // queues normally
				secondWaitResolved = true;
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive", seekBeats: 1 });
		await runner.mount(makeElement());
		runner.startPlay();

		await Promise.resolve();
		await Promise.resolve();
		expect(secondWaitResolved).toBe(false);

		runner.triggerNext();
		await Promise.resolve();
		await Promise.resolve();
		expect(secondWaitResolved).toBe(true);

		runner.unmount();
	});

	// ---- hold ----

	it("hold_resolves_after_ms", async () => {
		let holdDone = false;
		const seg = makeSegment({
			async play(ctx) {
				await ctx.hold(50);
				holdDone = true;
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();

		await Promise.resolve();
		expect(holdDone).toBe(false);

		vi.advanceTimersByTime(50);
		await Promise.resolve();
		await p;
		expect(holdDone).toBe(true);
	});

	it("hold_rejects_with_abort_error_on_unmount", async () => {
		let holdDone = false;
		const seg = makeSegment({
			async play(ctx) {
				await ctx.hold(5000);
				holdDone = true;
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();

		await Promise.resolve();
		expect(holdDone).toBe(false);

		runner.unmount();
		// play() should unwind via AbortError -- code after hold never runs
		await p;
		expect(holdDone).toBe(false);
	});

	// ---- unmount ----

	it("unmount_rejects_pending_resolvers_with_abort_error", async () => {
		let playFinished = false;
		const seg = makeSegment({
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.waitForNext();
				playFinished = true;
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();
		await Promise.resolve();

		runner.unmount();
		// play() should unwind via AbortError -- code after waitForNext never runs
		await p;
		expect(playFinished).toBe(false);
	});

	it("unmount_is_idempotent", async () => {
		const unmountFn = vi.fn();
		const seg = makeSegment({ unmount: unmountFn });
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());

		runner.unmount();
		runner.unmount();

		expect(unmountFn).toHaveBeenCalledOnce();
	});

	it("unmount_swallows_user_unmount_error", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const seg = makeSegment({
			unmount() {
				throw new Error("user error");
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());

		// Should not throw
		runner.unmount();

		expect(consoleSpy).toHaveBeenCalledOnce();
		expect(consoleSpy.mock.calls[0][0]).toBe("unmount() threw");
		consoleSpy.mockRestore();
	});

	// ---- custom next/prev ----

	it("custom_next_returning_true_consumes", async () => {
		const seg = makeSegment({
			next: () => true,
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		runner.startPlay();
		await Promise.resolve();

		const result = runner.triggerNext();
		expect(result).toBe(true);
		// Beat counter incremented by custom next
		expect(runner.currentBeat).toBe(1);

		runner.unmount();
	});

	it("custom_next_returning_false_lets_player_advance", async () => {
		const seg = makeSegment({
			next: () => false,
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		runner.startPlay();
		await Promise.resolve();

		const result = runner.triggerNext();
		expect(result).toBe(false);
		// Default behavior bypassed -- resolver not drained
		expect(runner.currentBeat).toBe(0);

		runner.unmount();
	});

	it("custom_next_returning_undefined_falls_through", async () => {
		const seg = makeSegment({
			next: () => undefined as unknown as boolean,
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		runner.startPlay();
		await Promise.resolve();

		const result = runner.triggerNext();
		// undefined falls through to defaultNext, which drains the resolver
		expect(result).toBe(true);
		expect(runner.currentBeat).toBe(1);

		runner.unmount();
	});

	it("prev_default_always_false", async () => {
		const seg = makeSegment();
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());

		expect(runner.triggerPrev()).toBe(false);
	});

	it("prev_custom_consumes", async () => {
		const seg = makeSegment({ prev: () => true });
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());

		expect(runner.triggerPrev()).toBe(true);
	});

	// ---- abort behavior ----

	it("play_non_abort_errors_still_propagate", async () => {
		const seg = makeSegment({
			async play() {
				throw new Error("segment bug");
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());

		await expect(runner.startPlay()).rejects.toThrow("segment bug");
	});

	it("hold_rejects_immediately_when_already_aborted", async () => {
		let holdRejected = false;
		const seg = makeSegment({
			async play(ctx) {
				// First hold will be aborted by unmount
				try {
					await ctx.hold(5000);
				} catch {
					// Expected
				}
				// Second hold should reject immediately (signal already aborted)
				try {
					await ctx.hold(1000);
				} catch {
					holdRejected = true;
				}
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();

		await Promise.resolve();
		runner.unmount();
		await p;
		expect(holdRejected).toBe(true);
	});

	it("state_stays_unmounted_after_abort", async () => {
		const seg = makeSegment({
			async play(ctx) {
				await ctx.hold(5000);
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();

		expect(runner.currentState).toBe("playing");
		runner.unmount();
		expect(runner.currentState).toBe("unmounted");
		await p;
		// State must remain "unmounted" -- .finally() must not overwrite it to "done"
		expect(runner.currentState).toBe("unmounted");
	});

	it("play_promise_resolves_cleanly_on_unmount", async () => {
		const seg = makeSegment({
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.hold(2000);
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();
		await Promise.resolve();

		runner.unmount();
		// Should resolve (not reject) because AbortError is caught internally
		await expect(p).resolves.toBeUndefined();
	});

	// ---- nav during active play (integration-style) ----

	it("unmount_during_hold_unwinds_cleanly", async () => {
		// Simulates the exact user flow: segment is mid-play parked on hold(),
		// user presses next, framework unmounts the segment. play() should
		// unwind cleanly without crashing and state should be "unmounted".
		let holdPassed = false;
		let postHoldRan = false;
		const seg = makeSegment({
			async play(ctx) {
				await ctx.hold(3000);
				holdPassed = true;
				await ctx.waitForNext();
				postHoldRan = true;
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();
		await Promise.resolve();

		// Segment is parked on hold(3000). Simulate nav by unmounting.
		runner.unmount();
		await expect(p).resolves.toBeUndefined();

		expect(holdPassed).toBe(false);
		expect(postHoldRan).toBe(false);
		expect(runner.currentState).toBe("unmounted");
	});

	it("unmount_during_waitForNext_unwinds_cleanly", async () => {
		// Simulates user pressing next when segment is parked on waitForNext.
		let afterWait = false;
		const seg = makeSegment({
			async play(ctx) {
				await ctx.waitForNext();
				afterWait = true;
			},
		});
		const runner = new SegmentRunner(seg, { mode: "interactive" });
		await runner.mount(makeElement());
		const p = runner.startPlay();
		await Promise.resolve();

		// Segment is parked on waitForNext. Simulate nav by unmounting.
		runner.unmount();
		await expect(p).resolves.toBeUndefined();

		expect(afterWait).toBe(false);
		expect(runner.currentState).toBe("unmounted");
	});

	// ---- isAbortError ----

	it("isAbortError_identifies_abort_errors", () => {
		expect(isAbortError(new DOMException("test", "AbortError"))).toBe(true);
		expect(isAbortError(new Error("not abort"))).toBe(false);
		expect(isAbortError(new DOMException("test", "NotFoundError"))).toBe(false);
		expect(isAbortError(null)).toBe(false);
		expect(isAbortError(undefined)).toBe(false);
	});
});
