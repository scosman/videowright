/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "../../src/player/index.js";
import type { SegmentLoaderMap, TransitionLoaderMap } from "../../src/timeline/index.js";
import { SEGMENT_BRAND, type Segment, type SegmentSpec, type Transition } from "../../src/types.js";

// ---- Helpers ----

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

// ---- Setup ----

let host: HTMLDivElement;

beforeEach(() => {
	host = document.createElement("div");
	document.body.appendChild(host);
	history.replaceState(null, "", location.pathname);
});

afterEach(() => {
	host.remove();
	history.replaceState(null, "", location.pathname);
});

// ---- Tests ----

describe("Player.renderAdvance(isLast)", () => {
	it("throws_outside_render_mode", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		await expect(player.renderAdvance(false)).rejects.toThrow("render mode");

		player.destroy();
	});

	it("isLast_false_stays_in_segment_after_draining_waitForNext", async () => {
		const beatLog: number[] = [];

		const seg = makeSegment({
			id: "seg-0",
			async play(ctx) {
				await ctx.waitForNext();
				beatLog.push(1);
				await ctx.waitForNext();
				beatLog.push(2);
			},
		});
		const seg1 = makeSegment({ id: "seg-1", async play() {} });

		const player = new Player(host, { renderMode: true });
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		// First advance: isLast=false should drain the first waitForNext but stay
		const result = await player.renderAdvance(false);
		await flush();

		expect(result).toBe(true);
		expect(beatLog).toEqual([1]);
		expect(player.currentSegmentId).toBe("seg-0");

		player.destroy();
	});

	it("isLast_true_transitions_after_draining_waitForNext", async () => {
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

		// isLast=true should drain the waitForNext AND transition to seg-1
		const result = await player.renderAdvance(true);
		await flush(20);

		expect(result).toBe(true);
		expect(mountCalls).toContain("seg-1");
		expect(player.currentSegmentId).toBe("seg-1");

		player.destroy();
	});

	it("isLast_true_on_final_segment_returns_false_and_ends", async () => {
		const seg = makeSegment({
			id: "seg-only",
			async play(ctx) {
				await ctx.waitForNext();
			},
		});

		const player = new Player(host, { renderMode: true });
		await player.load(makeTimeline(["seg-only"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		const result = await player.renderAdvance(true);

		expect(result).toBe(false);
		expect(player.currentState).toBe("ended");

		player.destroy();
	});

	it("multi_advance_segment_non_last_beats_stay_last_beat_transitions", async () => {
		// Segment with 3 advances: the first two are internal beats (isLast=false),
		// the third transitions out (isLast=true).
		const beatLog: number[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
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

		const player = new Player(host, { renderMode: true });
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		// Beat 1: internal, stay in seg-0
		let result = await player.renderAdvance(false);
		await flush();
		expect(result).toBe(true);
		expect(beatLog).toEqual([1]);
		expect(player.currentSegmentId).toBe("seg-0");

		// Beat 2: internal, stay in seg-0
		result = await player.renderAdvance(false);
		await flush();
		expect(result).toBe(true);
		expect(beatLog).toEqual([1, 2]);
		expect(player.currentSegmentId).toBe("seg-0");

		// Beat 3: last, transition to seg-1
		result = await player.renderAdvance(true);
		await flush(20);
		expect(result).toBe(true);
		expect(beatLog).toEqual([1, 2, 3]);
		expect(player.currentSegmentId).toBe("seg-1");

		player.destroy();
	});

	it("isLast_true_transitions_when_segment_play_ended_without_waitForNext", async () => {
		// Segment whose play() ends without a trailing waitForNext (e.g. uses hold).
		// When isLast=true fires, triggerNext returns false (no resolvers), and the
		// method should still transition.
		vi.useFakeTimers();

		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			async play(ctx) {
				await ctx.hold(1000);
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

		// Advance virtual time so hold() resolves
		vi.advanceTimersByTime(1000);
		await flush();

		// Now play() has finished; triggerNext will return false.
		// isLast=true should still transition to seg-1.
		const result = await player.renderAdvance(true);
		await flush(20);

		expect(result).toBe(true);
		expect(mountCalls).toContain("seg-1");
		expect(player.currentSegmentId).toBe("seg-1");

		player.destroy();
		vi.useRealTimers();
	});

	it("returns_false_when_already_ended", async () => {
		const seg = makeSegment({
			id: "seg-only",
			async play(ctx) {
				await ctx.waitForNext();
			},
		});

		const player = new Player(host, { renderMode: true });
		await player.load(makeTimeline(["seg-only"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		// End the timeline
		const first = await player.renderAdvance(true);
		expect(first).toBe(false);
		expect(player.currentState).toBe("ended");

		// Subsequent calls should return false
		const second = await player.renderAdvance(false);
		expect(second).toBe(false);

		const third = await player.renderAdvance(true);
		expect(third).toBe(false);

		player.destroy();
	});

	it("two_segment_timeline_transitions_at_correct_boundary", async () => {
		// End-to-end scenario: two segments, each with advances: [1.0].
		// Simulates the render driver calling renderAdvance with correct isLast flags.
		const mountCalls: string[] = [];
		const unmountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			unmount() {
				unmountCalls.push("seg-0");
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
			unmount() {
				unmountCalls.push("seg-1");
			},
			async play(ctx) {
				await ctx.waitForNext();
			},
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

		// Seg-0's only advance: isLast=true -> should transition to seg-1
		let result = await player.renderAdvance(true);
		await flush(20);
		expect(result).toBe(true);
		expect(mountCalls).toEqual(["seg-0", "seg-1"]);
		expect(unmountCalls).toEqual(["seg-0"]);
		expect(player.currentSegmentId).toBe("seg-1");

		// Seg-1's only advance: isLast=true -> last segment, should end
		result = await player.renderAdvance(true);
		await flush(20);
		expect(result).toBe(false);
		expect(player.currentState).toBe("ended");

		player.destroy();
	});
});
