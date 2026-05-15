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

describe("Player playback mode", () => {
	it("starts_in_idle_mode", async () => {
		const seg = makeSegment({
			id: "seg-0",
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const player = new Player(host, {
			resolvedTiming: { "seg-0": [1] },
		});
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		expect(player.playbackMode).toBe("idle");

		player.destroy();
	});

	it("toggle_switches_idle_to_playing", async () => {
		const seg = makeSegment({
			id: "seg-0",
			advances: [2],
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const player = new Player(host, {
			resolvedTiming: { "seg-0": [2] },
		});
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		player.togglePlayback();
		expect(player.playbackMode).toBe("playing");

		player.togglePlayback();
		expect(player.playbackMode).toBe("idle");

		player.destroy();
	});

	it("manual_nav_pauses_playback", async () => {
		const seg0 = makeSegment({
			id: "seg-0",
			advances: [1, 2],
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({ id: "seg-1", async play() {} });

		const player = new Player(host, {
			resolvedTiming: { "seg-0": [1, 2], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		player.togglePlayback();
		expect(player.playbackMode).toBe("playing");

		// Play triggers an async segment restart (transitionTo). Wait for
		// the restart AND for the new play() to park on its first waitForNext.
		await flush(10);

		// Manual nav (ArrowRight) should pause playback and advance a beat
		pressKey("ArrowRight");
		await flush();
		expect(player.playbackMode).toBe("idle");
		// After restart + nav: segment restarted to beat 0, then advanced to beat 1
		expect(location.hash).toBe("#/seg-0/1");

		player.destroy();
	});

	it("end_of_timeline_stops_playback", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host, {
			resolvedTiming: { "seg-0": [0.5] },
		});
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		player.togglePlayback();
		expect(player.playbackMode).toBe("playing");

		// Play triggers an async segment restart. Wait for it to complete.
		await flush();

		// Manually advance to end (play() has no beats, so next advances to end)
		pressKey("ArrowRight");
		await flush();

		// Manual nav paused, and state should be ended
		expect(player.playbackMode).toBe("idle");
		expect(player.currentState).toBe("ended");

		player.destroy();
	});

	it("toggle_noop_in_render_mode", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host, { renderMode: true });
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		player.togglePlayback();
		expect(player.playbackMode).toBe("idle");

		player.destroy();
	});

	it("hud_shows_play_button", async () => {
		const seg = makeSegment({
			id: "seg-0",
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		const playBtn = host.querySelector(".vw-hud-play") as HTMLButtonElement;
		expect(playBtn).toBeTruthy();
		expect(playBtn.textContent).toContain("▶"); // play symbol

		player.destroy();
	});

	it("hud_play_button_click_toggles_playback", async () => {
		const seg = makeSegment({
			id: "seg-0",
			advances: [2],
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const player = new Player(host, {
			resolvedTiming: { "seg-0": [2] },
		});
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		expect(player.playbackMode).toBe("idle");

		const playBtn = host.querySelector(".vw-hud-play") as HTMLButtonElement;
		playBtn.click();
		await flush();

		expect(player.playbackMode).toBe("playing");

		player.destroy();
	});

	it("space_key_toggles_playback", async () => {
		const seg = makeSegment({
			id: "seg-0",
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const player = new Player(host, {
			resolvedTiming: { "seg-0": [2] },
		});
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		expect(player.playbackMode).toBe("idle");

		// Space should toggle to playing
		pressKey(" ");
		await flush();
		expect(player.playbackMode).toBe("playing");

		// Space again should toggle back to idle
		pressKey(" ");
		await flush();
		expect(player.playbackMode).toBe("idle");

		player.destroy();
	});

	it("space_key_does_not_advance_beat", async () => {
		// With two segments and no resolvedTiming, Space should toggle playback
		// but not manually advance to the next beat (unlike ArrowRight).
		const seg0 = makeSegment({
			id: "seg-0",
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({ id: "seg-1", async play() {} });
		const player = new Player(host, {
			resolvedTiming: { "seg-0": [1, 2], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(player.currentSegmentId).toBe("seg-0");
		expect(player.currentTimelineIndex).toBe(0);

		// ArrowRight should advance a beat
		pressKey("ArrowRight");
		await flush();
		// seg-0 has waitForNext calls, so ArrowRight consumes one

		// Space should toggle playback, not advance
		pressKey(" ");
		await flush();
		expect(player.playbackMode).toBe("playing");

		// Pause again to stop auto-advance
		pressKey(" ");
		await flush();
		expect(player.playbackMode).toBe("idle");

		// Still on seg-0 (Space didn't cause a segment transition)
		expect(player.currentSegmentId).toBe("seg-0");

		player.destroy();
	});

	it("audio_time_correct_with_empty_advances_segment", async () => {
		// Segment "gap" has no advances in resolvedTiming -- computeLogicalAudioTime
		// must still break at the current segment and not accumulate later segments.
		const segA = makeSegment({ id: "seg-a", async play() {} });
		const segGap = makeSegment({ id: "seg-gap", async play() {} });
		const segB = makeSegment({
			id: "seg-b",
			async play(ctx) {
				await ctx.waitForNext();
			},
		});

		const player = new Player(host, {
			resolvedTiming: {
				"seg-a": [1],
				// "seg-gap" intentionally missing -- empty advances
				"seg-b": [2],
			},
		});
		await player.load(
			makeTimeline(["seg-a", "seg-gap", "seg-b"]),
			makeLoader([segA, segGap, segB]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		// Advance to seg-gap
		pressKey("ArrowRight");
		await flush(20);
		expect(player.currentSegmentId).toBe("seg-gap");

		// At seg-gap (index 1), audio time should be seg-a's duration (1s)
		// and should NOT include seg-b's duration (2s).
		// We can't directly call computeLogicalAudioTime, but we can toggle
		// playback to verify it doesn't throw/misbehave at a gap segment.
		player.togglePlayback();
		expect(player.playbackMode).toBe("playing");
		player.togglePlayback();
		expect(player.playbackMode).toBe("idle");

		// Wait for the restart transition triggered by togglePlayback to complete
		await flush();

		// Now advance to seg-b
		pressKey("ArrowRight");
		await flush(20);
		expect(player.currentSegmentId).toBe("seg-b");

		// Toggle playback at seg-b -- should work correctly
		player.togglePlayback();
		expect(player.playbackMode).toBe("playing");
		player.togglePlayback();
		expect(player.playbackMode).toBe("idle");

		player.destroy();
	});

	it("destroy_stops_audio_and_auto_advance", async () => {
		const seg = makeSegment({
			id: "seg-0",
			advances: [5],
			async play(ctx) {
				await ctx.waitForNext();
			},
		});
		const player = new Player(host, {
			resolvedTiming: { "seg-0": [5] },
		});
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		player.togglePlayback();
		expect(player.playbackMode).toBe("playing");

		// Destroy should clean up without errors
		player.destroy();
		await flush();
	});

	it("play_restarts_segment_from_beat_zero", async () => {
		// Bug 2: pressing Play mid-segment should restart the segment so
		// animation and audio start aligned from beat 0.
		const mountCalls: string[] = [];
		const seg = makeSegment({
			id: "seg-0",
			advances: [1, 2, 3],
			mount() {
				mountCalls.push("seg-0");
			},
			async play(ctx) {
				await ctx.waitForNext();
				await ctx.waitForNext();
				await ctx.waitForNext();
			},
		});
		const seg1 = makeSegment({ id: "seg-1", async play() {} });

		const player = new Player(host, {
			resolvedTiming: { "seg-0": [1, 2, 3], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(mountCalls).toEqual(["seg-0"]);

		// Advance two beats manually (simulates user navigating mid-segment)
		pressKey("ArrowRight");
		await flush();
		pressKey("ArrowRight");
		await flush();
		expect(location.hash).toBe("#/seg-0/2");

		// Now press Play -- should restart the segment from beat 0
		player.togglePlayback();
		await flush(10);

		// Segment should have been remounted (restart = unmount + fresh mount)
		expect(mountCalls).toEqual(["seg-0", "seg-0"]);
		// Hash should be reset to beat 0
		expect(location.hash).toBe("#/seg-0/0");
		expect(player.playbackMode).toBe("playing");

		player.destroy();
	});

	it("play_auto_advance_works_on_first_segment", async () => {
		// Bug 1: auto-advance should fire on segment 0 just like any other segment.
		// Use fake timers so we can control the auto-advance timer precisely.
		vi.useFakeTimers();

		const mountCalls: string[] = [];
		const seg0 = makeSegment({
			id: "seg-0",
			advances: [1],
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

		const player = new Player(host, {
			resolvedTiming: { "seg-0": [0.05], "seg-1": [1] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		expect(player.currentSegmentId).toBe("seg-0");

		// Press Play -- should restart seg-0 and schedule auto-advance
		player.togglePlayback();
		await flush(10);
		expect(player.playbackMode).toBe("playing");

		// The first advance time is 50ms. Advance the fake timer past it.
		vi.advanceTimersByTime(100);
		await flush(20);

		// Auto-advance should have fired: triggerNext drains the waitForNext
		// resolver, advancing the beat.
		const hash = location.hash;
		const advanced = hash === "#/seg-0/1" || hash === "#/seg-1/0";
		expect(advanced).toBe(true);

		player.destroy();
		vi.useRealTimers();
	});

	it("same_segment_transition_handles_module_state", async () => {
		// Verify that same-segment transitionTo (used by Play restart and
		// handleRestart) correctly handles Vite-cached modules with shared
		// module-level state. The old unmount must happen BEFORE the new mount.
		let hostRef: HTMLElement | null = null;
		const seg = makeSegment({
			id: "seg-0",
			mount(el) {
				hostRef = el;
			},
			unmount() {
				hostRef = null;
			},
			async play(ctx) {
				// Use hostRef -- if unmount ran after mount, this is null
				if (hostRef) {
					// Create some DOM to prove we have a live host
					const div = document.createElement("div");
					div.className = "alive-marker";
					hostRef.appendChild(div);
				}
				await ctx.waitForNext();
			},
		});

		const player = new Player(host);
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		expect(hostRef).not.toBeNull();
		expect(host.querySelector(".alive-marker")).toBeTruthy();

		// Restart (same-segment transition)
		pressKey("R");
		await flush(10);

		// After restart, hostRef should still be valid (not null)
		// because unmount ran BEFORE the new mount
		expect(hostRef).not.toBeNull();
		expect(host.querySelector(".alive-marker")).toBeTruthy();

		player.destroy();
	});
});
