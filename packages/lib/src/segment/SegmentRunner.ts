import type { PlayerContext, Segment } from "../types.js";

type RunnerState = "created" | "mounted" | "playing" | "done" | "unmounted";

export interface SegmentRunnerOptions {
	mode: "interactive" | "render";
	seekBeats?: number;
}

/**
 * Per-mount wrapper around a Segment. Owns beat counter, resolver queue,
 * abort controller, and produces the PlayerContext for lifecycle methods.
 *
 * Internal to the library -- not exported from the public barrel.
 */
export class SegmentRunner {
	readonly segment: Segment;
	readonly mode: "interactive" | "render";

	private resolvers: Array<() => void> = [];
	private beatCounter = 0;
	private seekBeatsRemaining: number;
	private abortCtrl = new AbortController();
	private mountedAt = 0;
	private _playPromise: Promise<void> | null = null;
	private state: RunnerState = "created";

	constructor(segment: Segment, opts: SegmentRunnerOptions) {
		this.segment = segment;
		this.mode = opts.mode;
		this.seekBeatsRemaining = opts.seekBeats ?? 0;
	}

	async mount(el: HTMLElement): Promise<void> {
		if (this.state !== "created") {
			throw new Error("SegmentRunner: already mounted");
		}
		this.mountedAt = performance.now();
		if (this.segment.mount) {
			await this.segment.mount(el, this.makeContext());
		}
		this.state = "mounted";
	}

	startPlay(): Promise<void> {
		if (this.state !== "mounted") {
			throw new Error("SegmentRunner: not mounted");
		}
		this.state = "playing";
		this._playPromise = this.segment.play(this.makeContext()).finally(() => {
			this.state = "done";
		});
		return this._playPromise;
	}

	triggerNext(): boolean {
		if (this.segment.next) {
			const consumed = this.segment.next();
			if (consumed === true) {
				this.beatCounter++;
				return true;
			}
			if (consumed === false) return false;
			// undefined -> fall through to default
		}
		return this.defaultNext();
	}

	triggerPrev(): boolean {
		if (this.segment.prev) {
			const consumed = this.segment.prev();
			if (consumed === true) return true;
		}
		return false;
	}

	unmount(): void {
		if (this.state === "unmounted") return;
		this.abortCtrl.abort();
		if (this.segment.unmount) {
			try {
				this.segment.unmount();
			} catch (e) {
				console.error("unmount() threw", e);
			}
		}
		// Drain pending resolvers so hanging awaits unblock
		while (this.resolvers.length) {
			const r = this.resolvers.shift();
			if (r) r();
		}
		this.state = "unmounted";
	}

	get currentBeat(): number {
		return this.beatCounter;
	}

	get isDone(): boolean {
		return this.state === "done";
	}

	get playPromise(): Promise<void> | null {
		return this._playPromise;
	}

	get currentState(): RunnerState {
		return this.state;
	}

	get elapsedSinceMount(): number {
		return this.mountedAt > 0 ? performance.now() - this.mountedAt : 0;
	}

	// ---- Private -----

	private defaultNext(): boolean {
		if (this.resolvers.length === 0) return false;
		const r = this.resolvers.shift();
		if (r) {
			this.beatCounter++;
			r();
		}
		return true;
	}

	private makeContext(): PlayerContext {
		return {
			waitForNext: () => {
				if (this.seekBeatsRemaining > 0) {
					this.seekBeatsRemaining--;
					this.beatCounter++;
					return Promise.resolve();
				}
				return new Promise<void>((resolve) => {
					if (this.state === "unmounted") {
						resolve();
						return;
					}
					this.resolvers.push(resolve);
				});
			},
			hold: (ms: number) => {
				// Both modes use real setTimeout. In render mode, the JS time shim
				// virtualizes setTimeout so it fires when the driver advances the
				// virtual clock, giving deterministic behavior.
				return new Promise<void>((resolve) => {
					if (this.abortCtrl.signal.aborted) {
						resolve();
						return;
					}
					const t = setTimeout(resolve, ms);
					this.abortCtrl.signal.addEventListener(
						"abort",
						() => {
							clearTimeout(t);
							resolve();
						},
						{ once: true },
					);
				});
			},
			signal: this.abortCtrl.signal,
			mode: this.mode,
			clock: () => {
				// Both modes use performance.now(). In render mode, the JS time
				// shim virtualizes performance.now() so this returns deterministic
				// virtual time.
				return performance.now() - this.mountedAt;
			},
		};
	}
}
