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

		// Manual nav (ArrowRight) should pause playback and advance a beat
		pressKey("ArrowRight");
		await flush();
		expect(player.playbackMode).toBe("idle");
		// Verify the nav actually happened (beat advanced from 0 to 1)
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

	it("record_mode_hud_shows_only_play_button", async () => {
		const seg = makeSegment({ id: "seg-0", async play() {} });
		const player = new Player(host, { recordMode: true });
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		// Should have play button
		const playBtn = host.querySelector(".vw-hud-play");
		expect(playBtn).toBeTruthy();

		// Should not have segment info items
		const items = host.querySelectorAll(".vw-hud-item");
		expect(items.length).toBe(0);

		// Should not have keyboard shortcut ref
		const keys = host.querySelectorAll(".vw-hud-keys");
		expect(keys.length).toBe(0);

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
		// When the user presses play, the current segment should restart
		// from beat 0 so animation and audio are synchronized.
		const mountCalls: string[] = [];

		const seg = makeSegment({
			id: "seg-0",
			advances: [2],
			mount() {
				mountCalls.push("seg-0");
			},
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

		expect(mountCalls).toEqual(["seg-0"]);

		// Manually advance one beat
		pressKey("ArrowRight");
		await flush();
		expect(location.hash).toBe("#/seg-0/1");

		// Press play -- should restart from beat 0
		player.togglePlayback();
		await flush(20);

		// Segment should have been remounted (mounted a second time)
		expect(mountCalls).toEqual(["seg-0", "seg-0"]);
		// Hash should be back at beat 0
		expect(location.hash).toBe("#/seg-0/0");
		expect(player.playbackMode).toBe("playing");

		player.destroy();
	});

	it("play_restarts_first_segment_and_auto_advances", async () => {
		// Regression test: play on the first segment should start auto-advance.
		// Previously, pressing play on the first segment did not start auto-play.
		vi.useFakeTimers();

		try {
			const seg0 = makeSegment({
				id: "seg-0",
				advances: [0.5],
				async play(ctx) {
					await ctx.waitForNext();
				},
			});
			const seg1 = makeSegment({
				id: "seg-1",
				async play() {},
			});

			const player = new Player(host, {
				resolvedTiming: { "seg-0": [0.5], "seg-1": [1] },
			});
			await player.load(
				makeTimeline(["seg-0", "seg-1"]),
				makeLoader([seg0, seg1]),
				makeTransitionLoaders(),
			);
			await player.start();
			await flush();

			expect(player.currentSegmentId).toBe("seg-0");

			// Press play on the first segment
			player.togglePlayback();
			// Wait for the async restart to complete
			await flush(20);
			expect(player.playbackMode).toBe("playing");

			// After restart, seg-0 is at beat 0. The auto-advance timer
			// should fire after 0.5s and advance the beat.
			vi.advanceTimersByTime(600);
			await flush(20);

			// The auto-advance should have resolved waitForNext, advancing beat to 1
			expect(location.hash).toBe("#/seg-0/1");

			player.destroy();
		} finally {
			vi.useRealTimers();
		}
	});

	it("play_pause_leaves_segment_navigable", async () => {
		// When play is toggled on then off (with enough time for restart to
		// complete), the segment should remain functional for manual navigation.
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

		// Toggle play on
		player.togglePlayback();
		// Let the restart complete before pausing
		await flush(20);
		expect(player.playbackMode).toBe("playing");

		// Now pause
		player.togglePlayback();
		await flush(20);

		expect(player.playbackMode).toBe("idle");
		expect(player.currentSegmentId).toBe("seg-0");
		// After restart, hash should be at beat 0
		expect(location.hash).toBe("#/seg-0/0");

		// Manual nav should still work -- advance a beat
		pressKey("ArrowRight");
		await flush();
		expect(location.hash).toBe("#/seg-0/1");

		player.destroy();
	});

	it("play_on_second_segment_restarts_that_segment", async () => {
		// When the user navigates to the second segment and presses play,
		// the second segment should restart from beat 0.
		const mountCalls: string[] = [];

		const seg0 = makeSegment({
			id: "seg-0",
			async play() {},
		});
		const seg1 = makeSegment({
			id: "seg-1",
			advances: [2],
			mount() {
				mountCalls.push("seg-1");
			},
			async play(ctx) {
				await ctx.waitForNext();
			},
		});

		const player = new Player(host, {
			resolvedTiming: { "seg-0": [1], "seg-1": [2] },
		});
		await player.load(
			makeTimeline(["seg-0", "seg-1"]),
			makeLoader([seg0, seg1]),
			makeTransitionLoaders(),
		);
		await player.start();
		await flush();

		// Navigate to seg-1
		pressKey("ArrowRight");
		await flush(20);
		expect(player.currentSegmentId).toBe("seg-1");
		expect(mountCalls).toEqual(["seg-1"]);

		// Press play -- should restart seg-1 from beat 0 (remount)
		player.togglePlayback();
		await flush(20);

		expect(mountCalls).toEqual(["seg-1", "seg-1"]);
		expect(location.hash).toBe("#/seg-1/0");
		expect(player.playbackMode).toBe("playing");

		player.destroy();
	});

	it("auto_advance_transitions_to_next_segment", async () => {
		// Regression test: when playing, auto-advance should transition to
		// the next segment after exhausting all beats in the current one.
		// Previously, scheduleNextAutoAdvance() returned early when
		// currentBeat >= advances.length, leaving the player stuck on the
		// finished segment while audio continued.
		vi.useFakeTimers();

		try {
			const mountCalls: string[] = [];
			const unmountCalls: string[] = [];

			const seg0 = makeSegment({
				id: "seg-0",
				advances: [0.5],
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
				advances: [1],
				mount() {
					mountCalls.push("seg-1");
				},
				async play(ctx) {
					await ctx.waitForNext();
				},
			});

			const player = new Player(host, {
				resolvedTiming: { "seg-0": [0.5], "seg-1": [1] },
			});
			await player.load(
				makeTimeline(["seg-0", "seg-1"]),
				makeLoader([seg0, seg1]),
				makeTransitionLoaders(),
			);
			await player.start();
			await flush();

			expect(player.currentSegmentId).toBe("seg-0");
			expect(mountCalls).toEqual(["seg-0"]);

			// Press play -- restarts seg-0 from beat 0
			player.togglePlayback();
			await flush(20);
			expect(player.playbackMode).toBe("playing");
			expect(player.currentSegmentId).toBe("seg-0");

			// Advance past seg-0's duration (0.5s). The first auto-advance
			// fires and resolves waitForNext (beat 0 -> 1). Then a follow-up
			// tick detects that all beats are consumed and transitions to seg-1.
			vi.advanceTimersByTime(600);
			await flush(20);

			// Give the segment-end transition tick time to fire
			vi.advanceTimersByTime(100);
			await flush(20);

			// seg-0 should be unmounted and seg-1 should be mounted and playing
			expect(unmountCalls).toContain("seg-0");
			expect(mountCalls).toContain("seg-1");
			expect(player.currentSegmentId).toBe("seg-1");
			expect(player.playbackMode).toBe("playing");

			player.destroy();
		} finally {
			vi.useRealTimers();
		}
	});

	it("rapid_play_pause_bails_out_before_mount", async () => {
		// Exercise the pre-mount bail-out path: togglePlayback() on then
		// immediately off is synchronous, so the gen counter is already
		// stale by the time await loader() resolves. The restart bails
		// before unmounting the old runner or mounting a new one, leaving
		// the original runner intact.
		const mountCalls: string[] = [];
		const unmountCalls: string[] = [];

		const seg = makeSegment({
			id: "seg-0",
			advances: [2],
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

		const player = new Player(host, {
			resolvedTiming: { "seg-0": [2] },
		});
		await player.load(makeTimeline(["seg-0"]), makeLoader([seg]), makeTransitionLoaders());
		await player.start();
		await flush();

		expect(mountCalls).toEqual(["seg-0"]);
		expect(unmountCalls).toEqual([]);

		// Toggle play on then immediately off before the restart can complete.
		// Both calls are synchronous, so by the time the async restart's
		// first await (loader()) resolves, the gen counter is already stale.
		player.togglePlayback();
		player.togglePlayback();
		expect(player.playbackMode).toBe("idle");

		// Let all pending microtasks drain
		await flush(20);

		// Pre-mount bail-out: the restart never reached the unmount/mount
		// phase, so the original runner is untouched. Zero unmounts is the
		// correct cleanup outcome for this path.
		expect(mountCalls).toEqual(["seg-0"]);
		expect(unmountCalls).toEqual([]);

		// The player should be idle with seg-0 still current
		expect(player.currentSegmentId).toBe("seg-0");
		expect(player.currentState).toBe("playing"); // player state, not playback mode

		// Manual navigation should still work
		pressKey("ArrowRight");
		await flush();
		expect(location.hash).toBe("#/seg-0/1");

		player.destroy();
	});

	it("pause_during_mount_unmounts_orphaned_runner", async () => {
		// Exercise the post-mount bail-out path (line 349 in index.ts):
		// The loader resolves while gen is still current, so the restart
		// proceeds past the pre-mount check (line 330), unmounts the old
		// runner, creates and mounts a new one. But mount() is async and
		// the user pauses while mount is in-flight. When mount completes,
		// the gen check on line 349 fires and the orphaned runner must be
		// unmounted so it doesn't sit in "mounted but never playing" state.
		const mountCalls: string[] = [];
		const unmountCalls: string[] = [];

		// Deferred mount: the mount() call returns a promise that we
		// resolve manually, giving us control over when mount completes.
		// Wrapped in an object so TS doesn't narrow the closure variable
		// to `never` across the async boundary.
		const deferred = { resolve: null as (() => void) | null };
		let mountCallCount = 0;

		const seg = makeSegment({
			id: "seg-0",
			advances: [2],
			async mount() {
				mountCallCount++;
				mountCalls.push("seg-0");
				// Only defer the second mount (the restart's mount).
				// The first mount (player.start) resolves immediately.
				if (mountCallCount >= 2) {
					await new Promise<void>((resolve) => {
						deferred.resolve = resolve;
					});
				}
			},
			unmount() {
				unmountCalls.push("seg-0");
			},
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

		expect(mountCalls).toEqual(["seg-0"]);
		expect(unmountCalls).toEqual([]);

		// Start playback -- the restart begins its async sequence.
		player.togglePlayback();

		// Let loader() resolve and the old runner unmount. The restart
		// proceeds to mount the new runner, which defers (mountCallCount=2).
		await flush(20);

		// The old runner was unmounted, and mount of the new runner is
		// in-flight (deferred). Verify the deferred mount is pending.
		expect(mountCalls).toEqual(["seg-0", "seg-0"]);
		expect(unmountCalls).toEqual(["seg-0"]); // old runner unmounted
		expect(deferred.resolve).toBeTruthy();

		// Now pause while mount is still in-flight. This increments the
		// gen counter, making the restart stale.
		player.togglePlayback();
		expect(player.playbackMode).toBe("idle");

		// Resolve the deferred mount. The restart code resumes at the
		// post-mount gen check (line 349) and sees the stale gen.
		deferred.resolve?.();
		await flush(20);

		// The orphaned runner should have been unmounted by the post-mount
		// bail-out cleanup (runner.unmount() on line 353).
		expect(unmountCalls.length).toBe(2);

		// The player should not be in an error state
		expect(player.currentState).not.toBe("errored");

		player.destroy();
	});
});
