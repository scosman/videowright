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
	private options: Required<PlayerOptions>;
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

	constructor(host: HTMLElement, options?: PlayerOptions) {
		this.host = host;
		this.options = { hud: options?.hud ?? true };

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

		this.hud = createHud();
		this.hostWrapper.appendChild(this.hud.el);

		this.host.appendChild(this.hostWrapper);

		if (!this.options.hud) {
			this.hud.hide();
		}

		this.cleanupInput = attachInput(this.hostWrapper, (cmd) => this.handleCommand(cmd));
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
		} catch (e) {
			this.handleLifecycleError(this.timeline.segments[targetIndex]?.id ?? "unknown", e);
		}
	}

	destroy(): void {
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

	// --- Private: navigation ---

	private async handleCommand(cmd: PlayerCommand): Promise<void> {
		if (this.state === "errored") return;

		if (typeof cmd === "string") {
			switch (cmd) {
				case "next":
					await this.handleNext();
					break;
				case "prev":
					await this.handlePrev();
					break;
				case "restart":
					await this.handleRestart();
					break;
				case "toggleHud":
					this.hud.toggle();
					break;
			}
		} else if (cmd.kind === "jumpTo") {
			await this.jumpToIndex(cmd.index);
		}
	}

	private async handleNext(): Promise<void> {
		if (this.state !== "playing" || this.transitioning) return;

		const slot = this.getCurrentSlot();
		if (!slot.runner) return;

		// Let the segment handle the press first
		const consumed = slot.runner.triggerNext();
		if (consumed) {
			hashRouter.write({
				segmentId: slot.runner.segment.id,
				beat: slot.runner.currentBeat,
			});
			this.updateHud();
			return;
		}

		// Segment didn't consume -> advance to next segment
		const nextIndex = slot.timelineIndex + 1;
		if (!this.timeline || nextIndex >= this.timeline.segments.length) {
			this.state = "ended";
			this.updateHud();
			return;
		}

		await this.transitionTo(nextIndex, "forward");
	}

	private async handlePrev(): Promise<void> {
		if (this.state !== "playing" || this.transitioning) return;

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

		const outgoingSlot = this.getCurrentSlot();
		const incomingSlot = this.getOtherSlot();
		const entry = this.timeline.segments[targetIndex];

		try {
			// Load segment module
			const loader = this.segmentLoaders.get(entry.id);
			if (!loader) throw new Error(`No loader for segment "${entry.id}"`);
			const mod = await loader();
			const segment = mod.default;

			// Create runner and mount
			const runner = new SegmentRunner(segment, { mode: "interactive" });
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

			// Unmount outgoing before awaiting its play promise.
			// Unmount drains pending waitForNext resolvers, so play() will resolve
			// even if the outgoing segment was parked on waitForNext.
			const outgoingRunner = outgoingSlot.runner;
			if (outgoingRunner) {
				outgoingRunner.unmount();
				outgoingSlot.runner = null;
				if (outgoingRunner.playPromise) {
					await outgoingRunner.playPromise;
				}
			}

			// Run transition
			const transitionFn = await this.resolveTransition(entry, direction);
			if (transitionFn && outgoingRunner) {
				await transitionFn(outgoingSlot.el, incomingSlot.el, {
					direction,
					duration: this.getTransitionDuration(entry),
				});
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

		const runner = new SegmentRunner(segment, {
			mode: "interactive",
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

		const entry = this.timeline.segments[index];
		const outgoingSlot = this.getCurrentSlot();
		const incomingSlot = this.getOtherSlot();

		try {
			const loader = this.segmentLoaders.get(entry.id);
			if (!loader) throw new Error(`No loader for segment "${entry.id}"`);
			const mod = await loader();
			const segment = mod.default;

			const runner = new SegmentRunner(segment, {
				mode: "interactive",
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
	}

	private setError(segmentId: string, error: Error): void {
		this.state = "errored";
		this.hud.update({
			segmentId,
			beat: 0,
			segmentTime: 0,
			totalTime: this.totalElapsed(),
			mode: "interactive",
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
			mode: "interactive",
			ended: this.state === "ended",
		};

		this.hud.update(hudState);
	}

	private totalElapsed(): number {
		return this.started ? performance.now() - this.startedAt : 0;
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
