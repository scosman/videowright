/**
 * Player runtime.
 * Orchestrates segment lifecycle, transitions, input, hash routing, and HUD.
 */

import { SegmentRunner } from "../segment/SegmentRunner.js";
import type { SegmentLoaderMap, TransitionLoaderMap } from "../timeline/index.js";
import type { Timeline, TimelineEntry, Transition } from "../types.js";
import * as hashRouter from "./hash_router.js";
import type { HashState } from "./hash_router.js";
import { type Hud, type HudState, createHud } from "./hud.js";
import { type PlayerCommand, attachInput } from "./input.js";
import { clearSlotAnimations, createSlot, getSlotContent } from "./slot.js";

export interface PlayerOptions {
	hud?: boolean; // default: true
	/** Enable render mode: deterministic frame-by-frame advance, no interactive input. */
	renderMode?: boolean;
	/** Frames per second for render mode clock. Default 60. */
	fps?: number;
	/** Vite-served audio file URL for voiceover playback (dev only). */
	audioFile?: string;
	/**
	 * Fully resolved per-segment timing for auto-advance.
	 * Keys are segment ids; values are advance times in seconds (segment-relative).
	 */
	resolvedTiming?: Record<string, number[]>;
}

type PlayerState = "idle" | "loading" | "playing" | "transitioning" | "ended" | "errored";

interface SlotEntry {
	el: HTMLDivElement;
	runner: SegmentRunner | null;
	timelineIndex: number;
}

export class Player {
	private host: HTMLElement;
	private hostWrapper: HTMLDivElement;
	private options: {
		hud: boolean;
		renderMode: boolean;
		fps: number;
		audioFile?: string;
		resolvedTiming?: Record<string, number[]>;
	};
	private state: PlayerState = "idle";

	private timeline: Timeline | null = null;
	private segmentLoaders: SegmentLoaderMap | null = null;
	private transitionLoaders: TransitionLoaderMap | null = null;

	private slotA: SlotEntry;
	private slotB: SlotEntry;
	private currentSlot: "a" | "b" = "a";

	private hud: Hud;
	private cleanupInput: (() => void) | null = null;
	private cleanupHashChange: (() => void) | null = null;

	private startedAt = 0;
	private started = false;
	private transitioning = false;

	// Audio and playback mode state
	private audioEl: HTMLAudioElement | null = null;
	private _playbackMode: "idle" | "playing" = "idle";
	private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
	/** Drift tolerance in ms: snap audio if it drifts beyond this threshold. */
	private static readonly DRIFT_TOLERANCE_MS = 200;

	constructor(host: HTMLElement, options?: PlayerOptions) {
		this.host = host;
		this.options = {
			hud: options?.hud ?? !options?.renderMode,
			renderMode: options?.renderMode ?? false,
			fps: options?.fps ?? 60,
			audioFile: options?.audioFile,
			resolvedTiming: options?.resolvedTiming,
		};

		this.hostWrapper = document.createElement("div");
		this.hostWrapper.className = "vw-host";
		this.hostWrapper.setAttribute(
			"style",
			"position:relative;width:100%;height:100%;overflow:hidden;",
		);

		const slotElA = createSlot("a");
		const slotElB = createSlot("b");
		slotElB.style.visibility = "hidden";

		this.slotA = { el: slotElA, runner: null, timelineIndex: -1 };
		this.slotB = { el: slotElB, runner: null, timelineIndex: -1 };

		this.hostWrapper.appendChild(slotElA);
		this.hostWrapper.appendChild(slotElB);

		// Create audio element if an audio file is provided (not in render mode)
		if (this.options.audioFile && !this.options.renderMode) {
			this.audioEl = document.createElement("audio");
			this.audioEl.preload = "auto";
			this.audioEl.src = this.options.audioFile;
			// Keep the element in the DOM but hidden
			this.audioEl.style.display = "none";
			this.hostWrapper.appendChild(this.audioEl);
		}

		this.hud = createHud({ onPlayToggle: () => this.togglePlayback() });
		this.hostWrapper.appendChild(this.hud.el);

		this.host.appendChild(this.hostWrapper);

		if (!this.options.hud) {
			this.hud.hide();
		}

		// In render mode, suppress all interactive input
		if (!this.options.renderMode) {
			this.cleanupInput = attachInput(this.hostWrapper, (cmd) => this.handleCommand(cmd));
		}
	}

	async load(
		timeline: Timeline,
		segmentLoaders: SegmentLoaderMap,
		transitionLoaders?: TransitionLoaderMap,
	): Promise<void> {
		this.state = "loading";
		this.timeline = timeline;
		this.segmentLoaders = segmentLoaders;
		this.transitionLoaders = transitionLoaders ?? new Map();

		// Validate all segment ids exist in the loader map
		for (const entry of timeline.segments) {
			if (!segmentLoaders.has(entry.id)) {
				const err = new Error(
					`Timeline "${timeline.meta.title}" references unknown segment "${entry.id}"`,
				);
				err.name = "TimelineError";
				this.setError(entry.id, err);
				throw err;
			}
		}
	}

	async start(): Promise<void> {
		if (this.started) return; // no-op on second call
		this.started = true;
		this.startedAt = performance.now();

		if (!this.timeline || !this.segmentLoaders) {
			throw new Error("Player: call load() before start()");
		}

		// Determine starting position from hash or query
		let targetIndex = 0;
		let targetBeat = 0;

		const hashState = hashRouter.read();
		if (hashState) {
			const idx = this.findSegmentIndex(hashState.segmentId);
			if (idx >= 0) {
				targetIndex = idx;
				targetBeat = hashState.beat;
			}
		} else {
			const queryId = hashRouter.readQueryFallback();
			if (queryId) {
				const idx = this.findSegmentIndex(queryId);
				if (idx >= 0) {
					targetIndex = idx;
				}
			}
		}

		this.cleanupHashChange = hashRouter.onChange((s) => this.onExternalHashChange(s));

		try {
			await this.mountSegmentAt(targetIndex, targetBeat);
			this.state = "playing";
			this.broadcastState();
		} catch (e) {
			this.handleLifecycleError(this.timeline.segments[targetIndex]?.id ?? "unknown", e);
		}
	}

	destroy(): void {
		// Stop auto-advance and audio
		this.cancelAutoAdvance();
		if (this.audioEl) {
			this.audioEl.pause();
			this.audioEl.remove();
			this.audioEl = null;
		}

		// Unmount current runner
		const current = this.getCurrentSlot();
		if (current.runner) {
			current.runner.unmount();
			current.runner = null;
		}
		const other = this.getOtherSlot();
		if (other.runner) {
			other.runner.unmount();
			other.runner = null;
		}

		if (this.cleanupInput) {
			this.cleanupInput();
			this.cleanupInput = null;
		}
		if (this.cleanupHashChange) {
			this.cleanupHashChange();
			this.cleanupHashChange = null;
		}

		this.hud.destroy();
		this.hostWrapper.remove();
		this.state = "idle";
		this.broadcastState();
	}

	// --- Accessors for testing ---

	get currentState(): PlayerState {
		return this.state;
	}

	get currentSegmentId(): string | null {
		const slot = this.getCurrentSlot();
		return slot.runner?.segment.id ?? null;
	}

	get currentTimelineIndex(): number {
		return this.getCurrentSlot().timelineIndex;
	}

	get isEnded(): boolean {
		return this.state === "ended";
	}

	get isTransitioning(): boolean {
		return this.transitioning;
	}

	get playbackMode(): "idle" | "playing" {
		return this._playbackMode;
	}

	// --- Playback mode (auto-advance with audio) ---

	togglePlayback(): void {
		if (this.options.renderMode) return;
		if (this.state === "errored") return;

		if (this._playbackMode === "idle") {
			// enterPlaying triggers a segment restart via transitionTo, which
			// sets transitioning=true. If we're already mid-transition (e.g. the
			// user presses Play during a forward nav), skip — the transition
			// will complete and the user can try again.
			if (this.transitioning) return;
			this.enterPlaying();
		} else {
			// Pausing is always safe — it just stops audio/timers. We allow it
			// even during the brief restart transition so the user can immediately
			// cancel a Play they just started.
			this.enterIdle();
		}
	}

	private enterPlaying(): void {
		if (this.state === "ended") return;
		this._playbackMode = "playing";
		this.updateHud();

		// Restart the current segment from beat 0 so animation and audio are
		// aligned from the beginning. Uses transitionTo which handles the
		// dual-slot swap cleanly (including same-segment unmount-first ordering).
		const currentIndex = this.getCurrentSlot().timelineIndex;
		this.transitionTo(currentIndex, "forward")
			.then(() => {
				// After restart, only proceed if we're still in playing mode
				// (user may have toggled back to idle during the await).
				if (this._playbackMode !== "playing") return;

				// Sync audio to the start of the current segment and play
				if (this.audioEl) {
					const logicalTime = this.computeLogicalAudioTime();
					this.audioEl.currentTime = logicalTime;
					this.audioEl.play().catch(() => {
						// Browser may block autoplay; the user clicked play so it should work.
						// If it fails, we still auto-advance silently.
					});
				}

				this.scheduleNextAutoAdvance();
			})
			.catch((e) => {
				const segId = this.timeline?.segments[currentIndex]?.id ?? "unknown";
				this.handleLifecycleError(segId, e);
			});
	}

	private enterIdle(): void {
		this._playbackMode = "idle";
		this.cancelAutoAdvance();

		if (this.audioEl) {
			this.audioEl.pause();
		}

		this.updateHud();
	}

	private cancelAutoAdvance(): void {
		if (this.autoAdvanceTimer !== null) {
			clearTimeout(this.autoAdvanceTimer);
			this.autoAdvanceTimer = null;
		}
	}

	/**
	 * Compute the logical audio time based on where we are in the timeline.
	 * Walks the resolved timing from segment 0 up to the current segment + beat.
	 */
	private computeLogicalAudioTime(): number {
		if (!this.timeline || !this.options.resolvedTiming) return 0;

		const currentIndex = this.getCurrentSlot().timelineIndex;
		const currentBeat = this.getCurrentSlot().runner?.currentBeat ?? 0;
		let elapsed = 0;

		for (let i = 0; i < this.timeline.segments.length; i++) {
			const segId = this.timeline.segments[i].id;
			const advances = this.options.resolvedTiming[segId];

			if (i < currentIndex) {
				if (advances && advances.length > 0) {
					elapsed += advances[advances.length - 1];
				}
			} else if (i === currentIndex) {
				if (advances && currentBeat > 0 && currentBeat <= advances.length) {
					elapsed += advances[currentBeat - 1];
				}
				break;
			}
		}

		return elapsed;
	}

	/**
	 * Compute the time until the next advance in the current segment, then schedule it.
	 *
	 * @param driftCorrectionMs - Signed milliseconds to add to the delay.
	 *   Positive = schedule is ahead of audio, so delay is lengthened.
	 *   Negative = schedule is behind audio, so delay is shortened.
	 *   Passed from autoAdvanceTick when drift exceeds DRIFT_TOLERANCE_MS.
	 */
	private scheduleNextAutoAdvance(driftCorrectionMs = 0): void {
		if (this._playbackMode !== "playing") return;
		if (this.state === "ended" || this.state === "errored") return;
		if (!this.timeline || !this.options.resolvedTiming) return;

		const slot = this.getCurrentSlot();
		if (!slot.runner) return;

		const segId = this.timeline.segments[slot.timelineIndex]?.id;
		if (!segId) return;

		const advances = this.options.resolvedTiming[segId];
		if (!advances || advances.length === 0) return;

		const currentBeat = slot.runner.currentBeat;

		// Next advance index = currentBeat (0-based: beat 0 means advance[0] fires next)
		if (currentBeat >= advances.length) {
			// Segment exhausted -- this shouldn't happen if handleNext transitions properly
			return;
		}

		// Time of the current beat (start of this beat) and the next advance
		const currentBeatTime = currentBeat > 0 ? advances[currentBeat - 1] : 0;
		const nextAdvanceTime = advances[currentBeat];
		const delayMs = (nextAdvanceTime - currentBeatTime) * 1000 + driftCorrectionMs;

		if (delayMs <= 0) {
			// Fire immediately
			this.autoAdvanceTick();
			return;
		}

		this.autoAdvanceTimer = setTimeout(() => {
			this.autoAdvanceTick();
		}, delayMs);
	}

	private async autoAdvanceTick(): Promise<void> {
		this.autoAdvanceTimer = null;
		if (this._playbackMode !== "playing") return;
		if (this.state === "ended" || this.state === "errored") return;

		// Determine whether this tick is the segment's final advance BEFORE
		// calling handleNext, so we can force a transition even when
		// triggerNext() drains a pending waitForNext resolver.
		const slot = this.getCurrentSlot();
		const segId = this.timeline?.segments[slot.timelineIndex]?.id;
		const advances = segId ? this.options.resolvedTiming?.[segId] : undefined;
		const beatBefore = slot.runner?.currentBeat ?? 0;
		const isLastAdvance = advances != null && beatBefore + 1 >= advances.length;

		await this.handleNext(isLastAdvance);

		// Compute signed drift between audio element and expected timeline
		// position. Instead of seeking the audio (which causes an audible
		// click/stutter), we adjust the next scheduled tick delay so the
		// scheduler realigns with the audio clock.
		let driftCorrectionMs = 0;
		if (this.audioEl && this.options.resolvedTiming) {
			const expectedTime = this.computeLogicalAudioTime();
			const actualTime = this.audioEl.currentTime;
			const drift = expectedTime - actualTime; // positive = schedule ahead of audio
			if (Math.abs(drift) > Player.DRIFT_TOLERANCE_MS / 1000) {
				driftCorrectionMs = drift * 1000;
			}
		}

		// If still playing, schedule the next one.
		// Cast needed: TS narrows this.state from the early guard, but
		// handleNext() can mutate it to "ended" at runtime.
		if (this._playbackMode === "playing" && (this.state as PlayerState) !== "ended") {
			this.scheduleNextAutoAdvance(driftCorrectionMs);
		}
	}

	/**
	 * Advance one beat in render mode. Returns false when the timeline is exhausted.
	 * Only valid when the player was constructed with renderMode: true.
	 *
	 * @param isLast - true when this is the final scheduled advance for the
	 *   current segment. On the last beat the method always transitions to the
	 *   next segment (after draining any pending waitForNext resolver).
	 *
	 * Transitions are NOT awaited — WAAPI animations are driven by the JS time
	 * shim's virtual clock, so they complete as the render driver advances time.
	 * Awaiting transition completion here would deadlock because the transition's
	 * `.finished` promises only resolve when the shim advances the clock.
	 */
	async renderAdvance(isLast: boolean): Promise<boolean> {
		if (!this.options.renderMode) {
			throw new Error("renderAdvance() is only valid in render mode");
		}
		if (this.state === "ended" || this.state === "errored") {
			return false;
		}

		const slot = this.getCurrentSlot();
		if (!slot.runner) return false;

		// Always drain any pending waitForNext resolver for this beat.
		const drained = slot.runner.triggerNext();

		if (!isLast) {
			if (!drained) {
				const segId = this.timeline?.segments[slot.timelineIndex]?.id ?? "unknown";
				console.debug(
					`[renderAdvance] triggerNext() had no pending resolver for segment "${segId}" — advances may exceed waitForNext calls`,
				);
			}
			// Internal beat — stay in this segment.
			return true;
		}

		// Last beat for this segment — transition out.
		const nextIndex = slot.timelineIndex + 1;
		if (!this.timeline || nextIndex >= this.timeline.segments.length) {
			this.state = "ended";
			this.broadcastState();
			return false;
		}

		// Start the transition but do NOT await it. WAAPI animations are driven
		// by the virtual clock shim — awaiting here would deadlock because the
		// transition's .finished promises only resolve when __VW_ADVANCE_CLOCK__
		// is called by the render driver.
		this.transitionTo(nextIndex, "forward").catch((e) => {
			const segId = this.timeline?.segments[nextIndex]?.id ?? "unknown";
			this.handleLifecycleError(segId, e);
		});
		return true;
	}

	// --- Private: navigation ---

	private async handleCommand(cmd: PlayerCommand): Promise<void> {
		if (this.state === "errored") return;

		if (typeof cmd === "string") {
			switch (cmd) {
				case "next":
					// Manual nav pauses playback
					if (this._playbackMode === "playing") {
						this.enterIdle();
					}
					await this.handleNext();
					break;
				case "prev":
					// Manual nav pauses playback
					if (this._playbackMode === "playing") {
						this.enterIdle();
					}
					await this.handlePrev();
					break;
				case "restart":
					if (this._playbackMode === "playing") {
						this.enterIdle();
					}
					await this.handleRestart();
					break;
				case "toggleHud":
					this.hud.toggle();
					break;
				case "togglePlay":
					this.togglePlayback();
					break;
			}
		} else if (cmd.kind === "jumpTo") {
			if (this._playbackMode === "playing") {
				this.enterIdle();
			}
			await this.jumpToIndex(cmd.index);
		}
	}

	/**
	 * Advance one beat. In manual-nav mode (isLastAdvance omitted / false),
	 * draining a pending waitForNext resolver counts as consuming the press
	 * and the player stays on the current segment. When called from
	 * autoAdvanceTick with isLastAdvance=true, the method forces a segment
	 * transition after draining the resolver -- otherwise the last scheduled
	 * advance would be consumed without ever transitioning out.
	 */
	private async handleNext(isLastAdvance = false): Promise<void> {
		if (this.state !== "playing" || this.transitioning) return;

		const slot = this.getCurrentSlot();
		if (!slot.runner) return;

		// Let the segment handle the press first
		const consumed = slot.runner.triggerNext();
		if (consumed && !isLastAdvance) {
			hashRouter.write({
				segmentId: slot.runner.segment.id,
				beat: slot.runner.currentBeat,
			});
			this.updateHud();
			return;
		}

		// Segment didn't consume, or this was the last scheduled advance
		// for the segment -- transition to next segment.
		const nextIndex = slot.timelineIndex + 1;
		if (!this.timeline || nextIndex >= this.timeline.segments.length) {
			this.state = "ended";
			// Stop audio and playback on end
			if (this._playbackMode === "playing") {
				this.enterIdle();
			}
			this.updateHud();
			this.broadcastState();
			return;
		}

		await this.transitionTo(nextIndex, "forward");
	}

	private async handlePrev(): Promise<void> {
		if (this.state !== "playing" && this.state !== "ended") return;
		if (this.transitioning) return;

		if (this.state === "ended") {
			this.state = "playing";
		}

		const slot = this.getCurrentSlot();
		if (!slot.runner) return;

		// Let segment handle prev first
		const consumed = slot.runner.triggerPrev();
		if (consumed) {
			this.updateHud();
			return;
		}

		// If at first segment, no-op
		if (slot.timelineIndex <= 0) return;

		await this.transitionTo(slot.timelineIndex - 1, "backward");
	}

	private async handleRestart(): Promise<void> {
		if (this.transitioning) return;
		if (!this.timeline || this.timeline.segments.length === 0) return;

		if (this.state === "ended") {
			this.state = "playing";
		}

		// Always remount segment 0, even if already there
		await this.transitionTo(0, "forward");
	}

	private async jumpToIndex(index: number): Promise<void> {
		if (!this.timeline) return;
		if (index < 0 || index >= this.timeline.segments.length) return;
		if (this.transitioning) return;

		const currentSlot = this.getCurrentSlot();

		// Number keys at the same index are a no-op (use R to restart)
		if (currentSlot.timelineIndex === index && this.state !== "ended") {
			return;
		}

		if (this.state === "ended") {
			this.state = "playing";
		}

		await this.transitionTo(index, "forward");
	}

	private async transitionTo(
		targetIndex: number,
		direction: "forward" | "backward",
	): Promise<void> {
		if (!this.timeline || !this.segmentLoaders || this.transitioning) return;

		this.transitioning = true;
		this.state = "transitioning";
		this.broadcastState();

		const outgoingSlot = this.getCurrentSlot();
		const incomingSlot = this.getOtherSlot();
		const entry = this.timeline.segments[targetIndex];

		// Detect same-segment transition (restart). When the outgoing segment
		// module is the same object (Vite caches imports), we must unmount the
		// outgoing BEFORE mounting the incoming. Otherwise the new mount() sets
		// module-level state (e.g. `host = el`), and the subsequent unmount()
		// nulls it, leaving the new play() with torn-down state.
		const outgoingEntryId = this.timeline.segments[outgoingSlot.timelineIndex]?.id;
		const isSameSegment = outgoingSlot.runner != null && outgoingEntryId === entry.id;

		try {
			// Load segment module
			const loader = this.segmentLoaders.get(entry.id);
			if (!loader) throw new Error(`No loader for segment "${entry.id}"`);
			const mod = await loader();
			const segment = mod.default;

			const outgoingRunner = outgoingSlot.runner;

			// For same-segment transitions, unmount outgoing FIRST to avoid
			// the cached-module shared-state conflict described above.
			if (isSameSegment && outgoingRunner) {
				outgoingRunner.unmount();
				outgoingSlot.runner = null;
				if (outgoingRunner.playPromise) {
					await outgoingRunner.playPromise;
				}
			}

			// Create runner and mount
			const runnerMode = this.options.renderMode ? "render" : "interactive";
			const runner = new SegmentRunner(segment, { mode: runnerMode });
			incomingSlot.runner = runner;
			incomingSlot.timelineIndex = targetIndex;

			// Clear stale WAAPI transition animations before reuse
			clearSlotAnimations(incomingSlot.el);

			const incomingContent = getSlotContent(incomingSlot.el);
			incomingContent.innerHTML = "";
			incomingSlot.el.style.visibility = "visible";
			await runner.mount(incomingContent);

			// Start play on incoming (don't await -- it resolves when segment finishes)
			const incomingPlayPromise = runner.startPlay();

			// For different-segment transitions, unmount outgoing AFTER mounting
			// incoming (standard dual-slot crossfade ordering).
			if (!isSameSegment && outgoingRunner) {
				outgoingRunner.unmount();
				outgoingSlot.runner = null;
				if (outgoingRunner.playPromise) {
					await outgoingRunner.playPromise;
				}
			}

			// Run transition (skip for same-segment restarts -- no visual
			// transition needed when restarting the current segment)
			if (!isSameSegment) {
				const transitionFn = await this.resolveTransition(entry, direction);
				if (transitionFn && outgoingRunner) {
					await transitionFn(outgoingSlot.el, incomingSlot.el, {
						direction,
						duration: this.getTransitionDuration(entry),
					});
				}
			}

			// Clear transition animations on both slots after transition completes.
			// Slide transitions use fill:"forwards" which persists transforms.
			clearSlotAnimations(outgoingSlot.el);
			clearSlotAnimations(incomingSlot.el);

			outgoingSlot.el.style.visibility = "hidden";
			getSlotContent(outgoingSlot.el).innerHTML = "";

			// Swap slots
			this.currentSlot = this.currentSlot === "a" ? "b" : "a";

			hashRouter.write({ segmentId: entry.id, beat: 0 });
			this.state = "playing";
			this.transitioning = false;
			this.updateHud();
			this.broadcastState();

			// Monitor play promise for errors
			incomingPlayPromise.catch((e) => {
				this.handleLifecycleError(entry.id, e);
			});
		} catch (e) {
			this.transitioning = false;
			this.handleLifecycleError(entry.id, e);
		}
	}

	private async mountSegmentAt(index: number, seekBeat = 0): Promise<void> {
		if (!this.timeline || !this.segmentLoaders) return;

		const entry = this.timeline.segments[index];
		const loader = this.segmentLoaders.get(entry.id);
		if (!loader) throw new Error(`No loader for segment "${entry.id}"`);

		const mod = await loader();
		const segment = mod.default;

		const runnerMode = this.options.renderMode ? "render" : "interactive";
		const runner = new SegmentRunner(segment, {
			mode: runnerMode,
			seekBeats: seekBeat,
		});

		const slot = this.getCurrentSlot();
		slot.runner = runner;
		slot.timelineIndex = index;
		const slotContent = getSlotContent(slot.el);
		slotContent.innerHTML = "";
		slot.el.style.visibility = "visible";

		await runner.mount(slotContent);

		// Start play (don't await -- segment controls its own duration)
		const playPromise = runner.startPlay();
		playPromise.catch((e) => {
			this.handleLifecycleError(entry.id, e);
		});

		hashRouter.write({ segmentId: entry.id, beat: seekBeat });
		this.updateHud();
	}

	private async resolveTransition(
		entry: TimelineEntry,
		direction: "forward" | "backward",
	): Promise<Transition | null> {
		if (!this.transitionLoaders) return null;

		// Backward always uses cut
		if (direction === "backward") {
			const cutLoader = this.transitionLoaders.get("cut");
			if (cutLoader) {
				const mod = await cutLoader();
				return mod.default;
			}
			return null;
		}

		if (!entry.transition) {
			// Default: cut
			const cutLoader = this.transitionLoaders.get("cut");
			if (cutLoader) {
				const mod = await cutLoader();
				return mod.default;
			}
			return null;
		}

		const name = typeof entry.transition === "string" ? entry.transition : entry.transition.type;
		const loader = this.transitionLoaders.get(name);
		if (!loader) {
			console.warn(`Transition "${name}" not found, falling back to cut`);
			const cutLoader = this.transitionLoaders.get("cut");
			if (cutLoader) {
				const mod = await cutLoader();
				return mod.default;
			}
			return null;
		}

		const mod = await loader();
		return mod.default;
	}

	private getTransitionDuration(entry: TimelineEntry): number | undefined {
		if (!entry.transition || typeof entry.transition === "string") return undefined;
		return typeof entry.transition.duration === "number" ? entry.transition.duration : undefined;
	}

	// --- Hash change ---

	private onExternalHashChange(state: HashState): void {
		if (this.state === "errored" || this.transitioning) return;
		if (!this.timeline) return;

		const idx = this.findSegmentIndex(state.segmentId);
		if (idx < 0) return;

		const currentSlot = this.getCurrentSlot();
		const sameSegment = currentSlot.timelineIndex === idx;
		const sameBeat = sameSegment && currentSlot.runner?.currentBeat === state.beat;

		if (sameBeat) return;

		// External hash change is manual nav -- pause playback
		if (this._playbackMode === "playing") {
			this.enterIdle();
		}

		if (this.state === "ended") {
			this.state = "playing";
		}

		// Jump to the segment + beat (remount with seek)
		this.jumpToSegmentBeat(idx, state.beat).catch((e) => {
			this.handleLifecycleError(state.segmentId, e);
		});
	}

	private async jumpToSegmentBeat(index: number, beat: number): Promise<void> {
		if (!this.timeline || !this.segmentLoaders || this.transitioning) return;

		this.transitioning = true;
		this.state = "transitioning";
		this.broadcastState();

		const entry = this.timeline.segments[index];
		const outgoingSlot = this.getCurrentSlot();
		const incomingSlot = this.getOtherSlot();

		try {
			const loader = this.segmentLoaders.get(entry.id);
			if (!loader) throw new Error(`No loader for segment "${entry.id}"`);
			const mod = await loader();
			const segment = mod.default;

			const runnerMode = this.options.renderMode ? "render" : "interactive";
			const runner = new SegmentRunner(segment, {
				mode: runnerMode,
				seekBeats: beat,
			});

			// Clear stale WAAPI transition animations before reuse
			clearSlotAnimations(incomingSlot.el);

			incomingSlot.runner = runner;
			incomingSlot.timelineIndex = index;
			const incomingContent = getSlotContent(incomingSlot.el);
			incomingContent.innerHTML = "";
			incomingSlot.el.style.visibility = "visible";

			await runner.mount(incomingContent);
			const playPromise = runner.startPlay();

			// Unmount outgoing
			if (outgoingSlot.runner) {
				outgoingSlot.runner.unmount();
				outgoingSlot.runner = null;
			}
			clearSlotAnimations(outgoingSlot.el);
			outgoingSlot.el.style.visibility = "hidden";
			getSlotContent(outgoingSlot.el).innerHTML = "";

			this.currentSlot = this.currentSlot === "a" ? "b" : "a";
			this.state = "playing";
			this.transitioning = false;
			this.updateHud();
			this.broadcastState();

			playPromise.catch((e) => {
				this.handleLifecycleError(entry.id, e);
			});
		} catch (e) {
			this.transitioning = false;
			this.handleLifecycleError(entry.id, e);
		}
	}

	// --- Error handling ---

	private handleLifecycleError(segmentId: string, e: unknown): void {
		const error = e instanceof Error ? e : new Error(String(e));
		console.error(`Player: segment "${segmentId}" errored:`, error);
		this.state = "errored";
		this.transitioning = false;
		this.setError(segmentId, error);
		this.broadcastState();
	}

	private setError(segmentId: string, error: Error): void {
		this.state = "errored";
		this.hud.update({
			segmentId,
			beat: 0,
			segmentTime: 0,
			totalTime: this.totalElapsed(),
			mode: this.options.renderMode ? "render" : "interactive",
			ended: false,
			error: {
				segmentId,
				message: error.message,
				stack: error.stack,
			},
		});
		// Force HUD visible for errors
		this.hud.show();
	}

	// --- HUD ---

	private updateHud(): void {
		const slot = this.getCurrentSlot();
		const runner = slot.runner;
		const segmentId = runner?.segment.id ?? "";
		const beat = runner?.currentBeat ?? 0;
		const voiceover = runner?.segment.voiceover;

		const hudState: HudState = {
			segmentId,
			beat,
			segmentTime: runner ? runner.elapsedSinceMount : 0,
			totalTime: this.totalElapsed(),
			voiceover,
			mode: this.options.renderMode ? "render" : "interactive",
			ended: this.state === "ended",
			playbackMode: this._playbackMode,
		};

		this.hud.update(hudState);
	}

	private totalElapsed(): number {
		return this.started ? performance.now() - this.startedAt : 0;
	}

	// --- State broadcast ---

	/**
	 * Set document.body.dataset.vwState to the current player state.
	 * Used by the render driver to detect when the player is idle (not transitioning)
	 * and ready for the next action.
	 *
	 * States: "idle" | "loading" | "playing" | "transitioning" | "ended" | "errored"
	 */
	private broadcastState(): void {
		try {
			if (typeof document !== "undefined" && document.body) {
				document.body.dataset.vwState = this.state;
				// Also broadcast current segment id for driver synchronization
				const slot = this.getCurrentSlot();
				const segId = slot.runner?.segment.id ?? "";
				document.body.dataset.vwSegment = segId;
			}
		} catch {
			// Ignore in non-browser environments (jsdom may throw)
		}
	}

	// --- Slot helpers ---

	private getCurrentSlot(): SlotEntry {
		return this.currentSlot === "a" ? this.slotA : this.slotB;
	}

	private getOtherSlot(): SlotEntry {
		return this.currentSlot === "a" ? this.slotB : this.slotA;
	}

	private findSegmentIndex(id: string): number {
		if (!this.timeline) return -1;
		return this.timeline.segments.findIndex((e) => e.id === id);
	}
}
