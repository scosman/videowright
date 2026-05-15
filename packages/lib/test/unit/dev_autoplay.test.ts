/**
 * @vitest-environment jsdom
 *
 * Regression tests for two dev-mode autoplay bugs:
 *
 * Bug 1: Segments whose play() uses ctx.waitForNext() freeze on their last
 *         advance because handleNext() returns after draining the resolver
 *         without transitioning to the next segment.
 *
 * Bug 2: Mid-segment advances cause an audio stutter because autoAdvanceTick
 *         seeks audioEl.currentTime for drift correction instead of adjusting
 *         the next scheduled tick delay.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "../../src/player/index.js";
import type { SegmentLoaderMap, TransitionLoaderMap } from "../../src/timeline/index.js";
import { SEGMENT_BRAND, type Segment, type SegmentSpec, type Transition } from "../../src/types.js";

// ---- Helpers (reused from player.test.ts / render_advance.test.ts) ----

function makeSegment(overrides: Partial<SegmentSpec> & { id: string }): Segment {
	return Object.freeze({
		advances: [1],
		async play() {},
		[SEGMENT_BRAND]: true as const,
		...overrides,
	});
}

function makeLoader(segments: Segment[]): SegmentLoaderMap {
	const map: SegmentLoaderMap = new Map();
	for (const seg of segments) {
		map.set(seg.id, () => Promise.resolve({ default: seg }));
	}
	return map;
}

function makeTransitionLoaders(): TransitionLoaderMap {
	const cutTransition: Transition = async (outgoing, incoming) => {
		outgoing.style.visibility = "hidden";
		incoming.style.visibility = "visible";
	};
	const map: TransitionLoaderMap = new Map();
	map.set("cut", () => Promise.resolve({ default: cutTransition }));
	return map;
}

function makeTimeline(segmentIds: string[]) {
	return {
		meta: { title: "Test Timeline" },
		segments: segmentIds.map((id) => ({ id })),
	};
}

async function flush(count = 10): Promise<void> {
	for (let i = 0; i < count; i++) {
		await Promise.resolve();
	}
}

function pressKey(key: string): void {
	window.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

// ---- Setup ----

let host: HTMLDivElement;

beforeEach(() => {
	vi.useFakeTimers();
	host = document.createElement("div");
	document.body.appendChild(host);
	history.replaceState(null, "", location.pathname);
});

afterEach(() => {
	host.remove();
	history.replaceState(null, "", location.pathname);
	vi.useRealTimers();
});

// ---- Bug 1: waitForNext freeze ----

describe("Bug 1: dev autoplay transitions on last advance with waitForNext", () => {
	it("single advance + waitForNext transitions to next segment", async () => {
		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			advances: [3],
			mount() {
				mountCalls.push("seg-0");
			},
			async play(ctx) {
				await ctx.hold(1000);
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({
			id: "seg-1",
			mount() {
				mountCalls.push("seg-1");
			},
			async play() {},
		});

		const player = new Player(host, {
			resolvedTiming: { "seg-0": [3], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(player.currentSegmentId).toBe("seg-0");

		// Enter playing mode
		player.togglePlayback();
		await flush(20);
		expect(player.playbackMode).toBe("playing");

		// Advance past the hold so play() parks on waitForNext
		vi.advanceTimersByTime(1100);
		await flush(20);

		// Fire the scheduled advance at 3s
		vi.advanceTimersByTime(3000);
		await flush(20);

		// The player should have transitioned to seg-1 (not frozen on seg-0)
		expect(player.currentSegmentId).toBe("seg-1");
		expect(mountCalls).toContain("seg-1");

		player.destroy();
	});

	it("multiple advances + multiple waitForNext: all beats fire then transitions", async () => {
		const beatLog: number[] = [];
		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			advances: [1, 2, 3],
			mount() {
				mountCalls.push("seg-0");
			},
			async play(ctx) {
				await ctx.waitForNext();
				beatLog.push(1);
				await ctx.waitForNext();
				beatLog.push(2);
				await ctx.waitForNext();
				beatLog.push(3);
			},
		});
		const seg1 = makeSegment({
			id: "seg-1",
			mount() {
				mountCalls.push("seg-1");
			},
			async play() {},
		});

		const player = new Player(host, {
			resolvedTiming: { "seg-0": [1, 2, 3], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		player.togglePlayback();
		await flush(20);
		expect(player.playbackMode).toBe("playing");

		// First advance at 1s (mid-segment)
		vi.advanceTimersByTime(1000);
		await flush(20);
		expect(player.currentSegmentId).toBe("seg-0");
		expect(beatLog).toContain(1);

		// Second advance at 2s (mid-segment)
		vi.advanceTimersByTime(1000);
		await flush(20);
		expect(player.currentSegmentId).toBe("seg-0");
		expect(beatLog).toContain(2);

		// Third advance at 3s (last advance - should transition)
		vi.advanceTimersByTime(1000);
		await flush(20);
		expect(beatLog).toContain(3);
		expect(player.currentSegmentId).toBe("seg-1");
		expect(mountCalls).toContain("seg-1");

		player.destroy();
	});
});

// ---- Bug 2: audio stutter ----

describe("Bug 2: mid-segment advances do not seek audio", () => {
	it("audioEl.currentTime is NOT written during mid-segment autoplay ticks", async () => {
		// Track all writes to audioEl.currentTime via a spy on the setter.
		// The only write should come from enterPlaying (the initial sync).
		const currentTimeWrites: number[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			advances: [1, 2, 3],
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.waitForNext();
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({ id: "seg-1", async play() {} });

		const player = new Player(host, {
			audioFile: "test.mp3",
			resolvedTiming: { "seg-0": [1, 2, 3], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		// Intercept the audio element and spy on currentTime setter.
		// The audio element is created during construction; find it in the DOM.
		const audioEl = host.querySelector("audio") as HTMLAudioElement;
		expect(audioEl).toBeTruthy();

		// Mock .play() to avoid jsdom errors
		audioEl.play = vi.fn().mockResolvedValue(undefined);

		// Spy on currentTime setter
		const originalDescriptor = Object.getOwnPropertyDescriptor(
			HTMLMediaElement.prototype,
			"currentTime",
		);
		let realCurrentTime = 0;
		Object.defineProperty(audioEl, "currentTime", {
			get() {
				return realCurrentTime;
			},
			set(v: number) {
				currentTimeWrites.push(v);
				realCurrentTime = v;
			},
			configurable: true,
		});

		// Enter playing mode - this should write currentTime once (enterPlaying sync)
		player.togglePlayback();
		await flush(20);
		expect(player.playbackMode).toBe("playing");

		const writesAfterPlay = currentTimeWrites.length;
		expect(writesAfterPlay).toBe(1); // enterPlaying sync

		// Fire first mid-segment advance
		vi.advanceTimersByTime(1000);
		await flush(20);

		// Fire second mid-segment advance
		vi.advanceTimersByTime(1000);
		await flush(20);

		// No additional currentTime writes should have occurred
		expect(currentTimeWrites.length).toBe(writesAfterPlay);

		// Restore
		if (originalDescriptor) {
			Object.defineProperty(audioEl, "currentTime", originalDescriptor);
		}

		player.destroy();
	});

	it("drift correction adjusts next tick delay instead of seeking audio", async () => {
		const seg0 = makeSegment({
			id: "seg-0",
			advances: [1, 3],
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({ id: "seg-1", async play() {} });

		const player = new Player(host, {
			audioFile: "test.mp3",
			resolvedTiming: { "seg-0": [1, 3], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		const audioEl = host.querySelector("audio") as HTMLAudioElement;
		expect(audioEl).toBeTruthy();
		audioEl.play = vi.fn().mockResolvedValue(undefined);

		// Track currentTime writes and simulate drift
		const currentTimeWrites: number[] = [];
		let fakeCurrentTime = 0;
		Object.defineProperty(audioEl, "currentTime", {
			get() {
				return fakeCurrentTime;
			},
			set(v: number) {
				currentTimeWrites.push(v);
				fakeCurrentTime = v;
			},
			configurable: true,
		});

		player.togglePlayback();
		await flush(20);
		const writesAfterPlay = currentTimeWrites.length;

		// Spy on setTimeout to capture the scheduled delay
		const scheduledDelays: number[] = [];
		const origSetTimeout = globalThis.setTimeout;
		const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((
			fn: (...args: unknown[]) => void,
			delay?: number,
			...args: unknown[]
		) => {
			if (delay !== undefined) {
				scheduledDelays.push(delay);
			}
			return origSetTimeout(fn, delay, ...args);
		}) as typeof globalThis.setTimeout);

		// Simulate audio being 0.5s behind expected (drift > 200ms tolerance).
		// After the first advance (at 1s), expected audio time = 1s.
		// But we'll set audio to 0.5s -> drift of 0.5s.
		fakeCurrentTime = 0.5;

		// Fire first advance at 1s (mid-segment)
		scheduledDelays.length = 0;
		vi.advanceTimersByTime(1000);
		await flush(20);

		// No audio seek should have happened
		expect(currentTimeWrites.length).toBe(writesAfterPlay);

		// The next scheduled delay should be adjusted for drift.
		// Normal delay for beat 1->2 = (3-1)*1000 = 2000ms
		// Drift = expected(1) - actual(0.5) = 0.5s = 500ms (schedule is ahead)
		// Adjusted delay = 2000 + 500 = 2500ms
		const nextDelay = scheduledDelays[scheduledDelays.length - 1];
		expect(nextDelay).toBe(2500);

		setTimeoutSpy.mockRestore();
		player.destroy();
	});
});

// ---- Render mode unchanged ----

describe("Render mode unchanged", () => {
	it("renderAdvance isLast=true still transitions correctly", async () => {
		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({
			id: "seg-1",
			mount() {
				mountCalls.push("seg-1");
			},
			async play() {},
		});

		const player = new Player(host, { renderMode: true });
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(mountCalls).toEqual(["seg-0"]);

		const result = await player.renderAdvance(true);
		await flush(20);

		expect(result).toBe(true);
		expect(mountCalls).toContain("seg-1");
		expect(player.currentSegmentId).toBe("seg-1");

		player.destroy();
	});
});

// ---- Manual nav unchanged ----

describe("Manual nav unchanged", () => {
	it("keyboard next mid-segment drains waitForNext and stays in segment", async () => {
		const beatLog: number[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			advances: [1, 2, 3],
			async play(ctx) {
				await ctx.waitForNext();
				beatLog.push(1);
				await ctx.waitForNext();
				beatLog.push(2);
				await ctx.waitForNext();
				beatLog.push(3);
			},
		});
		const seg1 = makeSegment({ id: "seg-1", async play() {} });

		const player = new Player(host);
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(player.currentSegmentId).toBe("seg-0");

		// Manual ArrowRight should drain the first waitForNext and stay
		pressKey("ArrowRight");
		await flush();
		expect(beatLog).toEqual([1]);
		expect(player.currentSegmentId).toBe("seg-0");
		expect(location.hash).toBe("#/seg-0/1");

		// Second ArrowRight: drain second waitForNext, still stay
		pressKey("ArrowRight");
		await flush();
		expect(beatLog).toEqual([1, 2]);
		expect(player.currentSegmentId).toBe("seg-0");
		expect(location.hash).toBe("#/seg-0/2");

		// Third ArrowRight: drain third waitForNext, still stay
		pressKey("ArrowRight");
		await flush();
		expect(beatLog).toEqual([1, 2, 3]);
		expect(player.currentSegmentId).toBe("seg-0");
		expect(location.hash).toBe("#/seg-0/3");

		// Fourth ArrowRight: no more resolvers, transitions to seg-1
		pressKey("ArrowRight");
		await flush(20);
		expect(player.currentSegmentId).toBe("seg-1");

		player.destroy();
	});
});
