import type { PlayerContext, Segment } from "../types.js";

/**
 * Thrown when a segment's play() is interrupted by unmount.
 * Framework code catches this to cleanly unwind segment teardown.
 *
 * Extends DOMException so that `isAbortError` can match both this class
 * and the native AbortError raised by fetch/AbortController in browsers.
 * The `(message, name)` constructor signature is supported in all modern
 * browsers and jsdom (our test runner); Node 17+ also supports it.
 */
export class SegmentAbortError extends DOMException {
	constructor() {
		super("Segment aborted", "AbortError");
	}
}

/** Type guard: true for SegmentAbortError or any DOMException with name "AbortError". */
export function isAbortError(e: unknown): boolean {
	return e instanceof DOMException && e.name === "AbortError";
}

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

	private resolvers: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];
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
		this._playPromise = this.segment
			.play(this.makeContext())
			.catch((e) => {
				// Re-throw non-abort errors; swallow AbortError so play()
				// resolves cleanly on unmount-triggered teardown.
				if (!isAbortError(e)) throw e;
			})
			.finally(() => {
				if (this.state !== "unmounted") {
					this.state = "done";
				}
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
		// Drain pending resolvers with AbortError so play() unwinds cleanly
		const abortErr = new SegmentAbortError();
		while (this.resolvers.length) {
			const r = this.resolvers.shift();
			if (r) r.reject(abortErr);
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
			r.resolve();
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
				return new Promise<void>((resolve, reject) => {
					if (this.state === "unmounted") {
						reject(new SegmentAbortError());
						return;
					}
					this.resolvers.push({ resolve, reject });
				});
			},
			hold: (ms: number) => {
				// Both modes use real setTimeout. In render mode, the JS time shim
				// virtualizes setTimeout so it fires when the driver advances the
				// virtual clock, giving deterministic behavior.
				return new Promise<void>((resolve, reject) => {
					if (this.abortCtrl.signal.aborted) {
						reject(new SegmentAbortError());
						return;
					}
					const onAbort = () => {
						clearTimeout(t);
						reject(new SegmentAbortError());
					};
					const t = setTimeout(() => {
						this.abortCtrl.signal.removeEventListener("abort", onAbort);
						resolve();
					}, ms);
					this.abortCtrl.signal.addEventListener("abort", onAbort, {
						once: true,
					});
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
