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

/** Build a minimal TransitionLoaderMap with cut (instantaneous). */
function makeTransitionLoaders(): TransitionLoaderMap {
	const cutTransition: Transition = async (outgoing, incoming) => {
		outgoing.style.visibility = "hidden";
		incoming.style.visibility = "visible";
	};
	const map: TransitionLoaderMap = new Map();
	map.set("cut", () => Promise.resolve({ default: cutTransition }));
	map.set("fade", () => Promise.resolve({ default: cutTransition })); // stub fade as cut for tests
	return map;
}

function makeTimeline(segmentIds: string[]) {
	return {
		meta: { title: "Test Timeline" },
		segments: segmentIds.map((id) => ({ id })),
	};
}

/** Flush microtask queue multiple times. */
async function flush(count = 5): Promise<void> {
	for (let i = 0; i < count; i++) {
		await Promise.resolve();
	}
}

/** Simulate a keyboard event on window. */
function pressKey(key: string): void {
	window.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

// ---- Setup ----

let host: HTMLDivElement;

beforeEach(() => {
	host = document.createElement("div");
	document.body.appendChild(host);
	// Reset hash
	history.replaceState(null, "", location.pathname);
});

afterEach(() => {
	host.remove();
	history.replaceState(null, "", location.pathname);
});

// ---- Tests ----

describe("Player integration", () => {
	it("load_then_start_first_segment", async () => {
		const mountCalls: string[] = [];
		const playCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			async play(ctx) {
				playCalls.push("seg-0");
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({ id: "seg-1" });
		const seg2 = makeSegment({ id: "seg-2" });

		const player = new Player(host);
		await player.load(
			makeTimeline(["seg-0", "seg-1", "seg-2"]),
			makeLoader([seg0, seg1, seg2]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(mountCalls).toEqual(["seg-0"]);
		expect(playCalls).toEqual(["seg-0"]);
		expect(location.hash).toBe("#/seg-0/0");
		expect(player.currentSegmentId).toBe("seg-0");

		player.destroy();
	});

	it("forward_through_three", async () => {
		const mountCalls: string[] = [];
		const unmountCalls: string[] = [];

		function makeSeg(id: string): Segment {
			return makeSegment({
				id,
				mount() {
					mountCalls.push(id);
				},
				unmount() {
					unmountCalls.push(id);
				},
				async play() {
					// No internal beats - play resolves immediately
				},
			});
		}

		const segs = [makeSeg("seg-0"), makeSeg("seg-1"), makeSeg("seg-2")];
		const player = new Player(host);
		await player.load(
			makeTimeline(["seg-0", "seg-1", "seg-2"]),
			makeLoader(segs),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(mountCalls).toEqual(["seg-0"]);

		// First next: seg-0 play is done, triggerNext returns false -> advance to seg-1
		pressKey("ArrowRight");
		await flush(20);
		expect(mountCalls).toEqual(["seg-0", "seg-1"]);
		expect(unmountCalls).toEqual(["seg-0"]);
		expect(location.hash).toBe("#/seg-1/0");

		// Second next: advance to seg-2
		pressKey("ArrowRight");
		await flush(20);
		expect(mountCalls).toEqual(["seg-0", "seg-1", "seg-2"]);
		expect(unmountCalls).toEqual(["seg-0", "seg-1"]);
		expect(location.hash).toBe("#/seg-2/0");

		player.destroy();
	});

	it("internal_beats_advance_hash", async () => {
		const seg = makeSegment({
			id: "seg",
			async play(ctx) {
				await ctx.waitForNext(); // beat 1
				await ctx.waitForNext(); // beat 2
				await ctx.waitForNext(); // beat 3
			},
		});

		const player = new Player(host);
		await player.load(
			{ meta: { title: "Test" }, segments: [{ id: "seg" }, { id: "seg-end" }] },
			makeLoader([seg, makeSegment({ id: "seg-end" })]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(location.hash).toBe("#/seg/0");

		// Beat 1
		pressKey("ArrowRight");
		await flush();
		expect(location.hash).toBe("#/seg/1");

		// Beat 2
		pressKey("ArrowRight");
		await flush();
		expect(location.hash).toBe("#/seg/2");

		// Beat 3
		pressKey("ArrowRight");
		await flush();
		expect(location.hash).toBe("#/seg/3");

		// Next press: no more internal beats -> advance to next segment
		pressKey("ArrowRight");
		await flush(20);
		expect(location.hash).toBe("#/seg-end/0");

		player.destroy();
	});

	it("prev_at_beat_zero_jumps_back", async () => {
		const mountCalls: string[] = [];

		function makeSeg(id: string): Segment {
			return makeSegment({
				id,
				mount() {
					mountCalls.push(id);
				},
				async play() {},
			});
		}

		const segs = [makeSeg("seg-0"), makeSeg("seg-1"), makeSeg("seg-2")];
		const player = new Player(host);
		await player.load(
			makeTimeline(["seg-0", "seg-1", "seg-2"]),
			makeLoader(segs),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		// Forward to seg-2
		pressKey("ArrowRight");
		await flush(20);
		pressKey("ArrowRight");
		await flush(20);
		expect(location.hash).toBe("#/seg-2/0");

		// Prev -> back to seg-1
		pressKey("ArrowLeft");
		await flush(20);
		expect(location.hash).toBe("#/seg-1/0");
		expect(player.currentSegmentId).toBe("seg-1");
		// seg-1 was remounted (fresh state)
		expect(mountCalls.filter((id) => id === "seg-1")).toHaveLength(2);

		player.destroy();
	});

	it("prev_at_first_segment_first_beat_noop", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		expect(location.hash).toBe("#/seg-0/0");

		pressKey("ArrowLeft");
		await flush();

		// No change
		expect(location.hash).toBe("#/seg-0/0");
		expect(player.currentSegmentId).toBe("seg-0");

		player.destroy();
	});

	it("next_at_end_of_timeline_noop", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		// At end of single-segment timeline, play is done, next -> ended
		pressKey("ArrowRight");
		await flush();
		expect(player.currentState).toBe("ended");

		// Another next should be no-op (state is ended, not playing)
		pressKey("ArrowRight");
		await flush();
		expect(player.currentState).toBe("ended");

		// Verify HUD shows "end of timeline"
		const hudText = host.querySelector(".vw-hud")?.textContent ?? "";
		expect(hudText).toContain("End of timeline");

		player.destroy();
	});

	it("seek_on_load_to_beat_n", async () => {
		const beatLog: number[] = [];

		const seg1 = makeSegment({
			id: "seg-1",
			async play(ctx) {
				await ctx.waitForNext();
				beatLog.push(1);
				await ctx.waitForNext();
				beatLog.push(2);
				await ctx.waitForNext();
				beatLog.push(3);
			},
		});
		const seg0 = makeSegment({ id: "seg-0" });

		// Set hash to seg-1 beat 2 before starting
		history.replaceState(null, "", "#/seg-1/2");

		const player = new Player(host);
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush(10);

		// First 2 waitForNext resolved synchronously via seek
		expect(beatLog).toEqual([1, 2]);
		expect(player.currentSegmentId).toBe("seg-1");

		// Third waitForNext should be pending (awaits user input)
		pressKey("ArrowRight");
		await flush();
		expect(beatLog).toEqual([1, 2, 3]);

		player.destroy();
	});

	it("mount_throws_shows_error_overlay", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const seg = makeSegment({
			id: "bad-seg",
			mount() {
				throw new Error("mount boom");
			},
			async play() {},
		});

		const player = new Player(host);
		await player.load(makeTimeline(["bad-seg"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		expect(player.currentState).toBe("errored");

		// Error overlay should be rendered
		const overlay = host.querySelector(".vw-hud-error-overlay");
		expect(overlay).toBeTruthy();
		expect(overlay?.textContent).toContain("bad-seg");
		expect(overlay?.textContent).toContain("mount boom");

		player.destroy();
		consoleSpy.mockRestore();
	});

	it("play_throws_shows_error_overlay", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const seg = makeSegment({
			id: "bad-play",
			async play() {
				throw new Error("play boom");
			},
		});

		const player = new Player(host);
		await player.load(makeTimeline(["bad-play"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush(10);

		expect(player.currentState).toBe("errored");

		const overlay = host.querySelector(".vw-hud-error-overlay");
		expect(overlay).toBeTruthy();
		expect(overlay?.textContent).toContain("bad-play");
		expect(overlay?.textContent).toContain("play boom");

		player.destroy();
		consoleSpy.mockRestore();
	});

	it("unsubscribed_on_unmount", async () => {
		let capturedSignal: AbortSignal | undefined;

		const seg0 = makeSegment({
			id: "seg-0",
			async play(ctx) {
				capturedSignal = ctx.signal;
				await ctx.waitForNext();
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

		expect(capturedSignal).toBeDefined();
		expect(capturedSignal?.aborted).toBe(false);

		// Advance to next segment - seg-0 should be unmounted and signal aborted
		// First, the segment's play() is waiting on waitForNext. When we press next,
		// triggerNext resolves the pending wait. Then the next press advances since
		// play has no more waits.
		pressKey("ArrowRight"); // resolves waitForNext in seg-0
		await flush();
		pressKey("ArrowRight"); // now play is done, advance to seg-1
		await flush(20);

		expect(capturedSignal?.aborted).toBe(true);

		player.destroy();
	});

	it("hashchange_listener_jumps", async () => {
		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			async play() {},
		});
		const seg1 = makeSegment({
			id: "seg-1",
			mount() {
				mountCalls.push("seg-1");
			},
			async play() {},
		});

		const player = new Player(host);
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(mountCalls).toEqual(["seg-0"]);

		// Simulate user editing the hash
		history.replaceState(null, "", "#/seg-1/0");
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		await flush(20);

		expect(player.currentSegmentId).toBe("seg-1");
		expect(mountCalls).toContain("seg-1");

		player.destroy();
	});

	it("start called twice is no-op", async () => {
		const mountCalls: string[] = [];
		const seg = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			async play() {},
		});

		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await player.start();
		await flush();

		// mount should be called only once
		expect(mountCalls).toEqual(["seg-0"]);

		player.destroy();
	});

	it("destroy cleans up DOM and listeners", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		player.destroy();

		// Host wrapper should be removed
		expect(host.querySelector(".vw-host")).toBeNull();
	});

	it("load rejects for unknown segment", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const player = new Player(host);

		await expect(
			player.load(makeTimeline(["nonexistent"]), new Map(), makeTransitionLoaders()),
		).rejects.toThrow("unknown segment");

		player.destroy();
		consoleSpy.mockRestore();
	});

	it("outgoing_play_throws_during_forward_transition_shows_error", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const seg0 = makeSegment({
			id: "seg-0",
			async play() {
				throw new Error("outgoing play boom");
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
		await flush(10);

		// seg-0's play threw -- the error should be caught and surfaced
		expect(player.currentState).toBe("errored");

		const overlay = host.querySelector(".vw-hud-error-overlay");
		expect(overlay).toBeTruthy();
		expect(overlay?.textContent).toContain("seg-0");
		expect(overlay?.textContent).toContain("outgoing play boom");

		player.destroy();
		consoleSpy.mockRestore();
	});

	it("restart_at_current_segment_remounts", async () => {
		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			async play() {},
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

		expect(mountCalls).toEqual(["seg-0"]);
		expect(player.currentSegmentId).toBe("seg-0");

		// Press R to restart -- should remount seg-0 even though we're already there
		pressKey("R");
		await flush(20);

		expect(mountCalls).toEqual(["seg-0", "seg-0"]);
		expect(player.currentSegmentId).toBe("seg-0");
		expect(location.hash).toBe("#/seg-0/0");

		player.destroy();
	});

	it("transition_completes_when_outgoing_parked_on_waitForNext", async () => {
		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			mount() {
				mountCalls.push("seg-0");
			},
			async play(ctx) {
				// Park forever on waitForNext -- simulates a segment that has not
				// had its beats fully consumed before a jump occurs
				await ctx.waitForNext();
				await ctx.waitForNext();
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

		const player = new Player(host);
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(mountCalls).toEqual(["seg-0"]);
		expect(player.currentSegmentId).toBe("seg-0");

		// Jump to seg-1 via hash change while seg-0 is parked on waitForNext.
		// Before the fix, this would deadlock because transitionTo awaited
		// outgoing playPromise which was blocked on the pending waitForNext.
		history.replaceState(null, "", "#/seg-1/0");
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		await flush(20);

		// Transition should have completed
		expect(player.currentSegmentId).toBe("seg-1");
		expect(mountCalls).toContain("seg-1");
		expect(player.currentState).toBe("playing");

		player.destroy();
	});

	it("destroy cleans up HUD style element", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		// Style element should exist while player is alive
		expect(document.querySelector("style[data-vw-hud]")).toBeTruthy();

		player.destroy();

		// Style element should be cleaned up after destroy
		expect(document.querySelector("style[data-vw-hud]")).toBeNull();
	});
});
