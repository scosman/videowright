---
status: complete
---

# Component: Segment Helper

The authoring helper (`defineSegment`) and the `PlayerContext` implementation (`SegmentRunner`).

## Purpose and Scope

**Owns:**

- `defineSegment(spec)` — public authoring helper.
- `SegmentRunner` — internal class that wraps a Segment per mount, owns per-instance state (beat counter, resolver queue, abort controller), and produces the `PlayerContext` passed into the segment's lifecycle methods.
- Default `next()` / `prev()` semantics (delegated to runner state).

**Not owned:**

- Player state, slot lifecycle, transitions → `player.md`.
- Timeline parsing / id resolution → `timeline_loader.md`.

## Public Interface

```ts
// videowright/src/index.ts re-exports:

export function defineSegment(spec: SegmentSpec): Segment;

export interface SegmentSpec {
  id: string;
  /**
   * Segment-relative seconds at which to fire each 'next' advance during render/record.
   * Must be a non-empty array of monotonically increasing positive numbers.
   *
   * Length = number of triggerNext() calls required to traverse this segment,
   * INCLUDING the final press that transitions to the next segment.
   *
   * Press-counting examples:
   * - `play() { await ctx.hold(3000); }` -> 1 press total -> `advances: [3.0]`
   * - `play() { await ctx.waitForNext(); }` -> 2 presses -> `advances: [t1, t2]`
   * - `play() { await ctx.waitForNext(); await ctx.waitForNext(); }` -> 3 presses -> `advances: [t1, t2, t3]`
   *
   * Ignored in dev (interactive) mode -- interactive presses drive timing.
   */
  advances: number[];
  voiceover?: string;
  notes?: string;
  mount?(el: HTMLElement, ctx: PlayerContext): void | Promise<void>;
  play(ctx: PlayerContext): Promise<void>;
  unmount?(): void;
  next?(): boolean;               // override default; true = consumed, false = let player advance
  prev?(): boolean;               // override default (which always returns false)
}

export interface Segment extends SegmentSpec {
  readonly [SEGMENT_BRAND]: true;
}

export interface PlayerContext {
  waitForNext(): Promise<void>;
  hold(ms: number): Promise<void>;
  signal: AbortSignal;
  mode: 'interactive' | 'render';
  clock(): number;                // ms since this segment instance mounted
}
```

`SegmentRunner` is **not** exported. It's an internal player-side construct.

### `defineSegment` errors

- Missing `id`: throws `TypeError('defineSegment: id is required')`.
- Missing `play`: throws `TypeError('defineSegment: play is required')`.
- Missing or empty `advances`: throws `TypeError('defineSegment: advances is required and must be a non-empty array (segment "<id>")')`.
- Non-positive `advances` value: throws `TypeError('defineSegment: advances[i] must be a positive number (segment "<id>", got <value>)')`.
- Non-monotonic `advances`: throws `TypeError('defineSegment: advances must be monotonically increasing (segment "<id>", advances[i]=<v> <= advances[i-1]=<prev>)')`.
- (TS strict catches the `id`, `play`, and `advances` shape at compile time; the runtime throws are defenses for JS consumers.)

## Internal Design

### `defineSegment` is a thin brand

```ts
const SEGMENT_BRAND = Symbol.for('videowright.segment');

export function defineSegment(spec: SegmentSpec): Segment {
  if (!spec.id) throw new TypeError('defineSegment: id is required');
  if (!spec.play) throw new TypeError('defineSegment: play is required');
  if (!spec.advances || !Array.isArray(spec.advances) || spec.advances.length === 0) {
    throw new TypeError(`defineSegment: advances is required and must be a non-empty array (segment "${spec.id}")`);
  }
  for (let i = 0; i < spec.advances.length; i++) {
    const v = spec.advances[i];
    if (typeof v !== 'number' || v <= 0 || !Number.isFinite(v)) {
      throw new TypeError(`defineSegment: advances[${i}] must be a positive number (segment "${spec.id}", got ${v})`);
    }
    if (i > 0 && v <= spec.advances[i - 1]) {
      throw new TypeError(`defineSegment: advances must be monotonically increasing (segment "${spec.id}", advances[${i}]=${v} <= advances[${i - 1}]=${spec.advances[i - 1]})`);
    }
  }
  return Object.freeze({ ...spec, [SEGMENT_BRAND]: true as const });
}
```

The helper does not manage state. Per-instance state lives in `SegmentRunner`, owned by the player.

### `SegmentRunner`

```ts
interface SegmentRunnerOptions {
  mode: 'interactive' | 'render';
  seekBeats?: number;
  /** In render mode, ms per frame (e.g. 1000/60 for 60fps). Used for deterministic clock. */
  frameDurationMs?: number;
}
```

Per-mount instance:

```ts
class SegmentRunner {
  readonly segment: Segment;
  readonly mode: 'interactive' | 'render';

  private resolvers: Array<() => void> = [];
  private beatCounter = 0;                    // increments on each waitForNext that resolves
  private seekBeatsRemaining = 0;             // for seek-to-beat-N on load
  private abortCtrl = new AbortController();
  private mountedAt = 0;                      // performance.now() when mount() resolved
  private playPromise: Promise<void> | null = null;
  private state: 'created' | 'mounted' | 'playing' | 'done' | 'unmounted' = 'created';
  private frameDurationMs: number;            // ms per frame for render-mode clock
  private renderFrameCount = 0;               // monotonic frame counter for render mode

  constructor(segment: Segment, opts: SegmentRunnerOptions) {
    this.segment = segment;
    this.mode = opts.mode;
    this.seekBeatsRemaining = opts.seekBeats ?? 0;
    this.frameDurationMs = opts.frameDurationMs ?? 1000 / 60;
  }

  async mount(el: HTMLElement): Promise<void> {
    if (this.state !== 'created') throw new Error('SegmentRunner: already mounted');
    if (this.segment.mount) {
      await this.segment.mount(el, this.makeContext());
    }
    this.mountedAt = performance.now();
    this.state = 'mounted';
  }

  startPlay(): Promise<void> {
    if (this.state !== 'mounted') throw new Error('SegmentRunner: not mounted');
    this.state = 'playing';
    this.playPromise = this.segment.play(this.makeContext()).finally(() => {
      this.state = 'done';
    });
    return this.playPromise;
  }

  triggerNext(): boolean {
    // Returns true if a pending waitForNext was resolved.
    if (this.segment.next) {
      const consumed = this.segment.next();
      if (consumed === true) {
        // Custom next consumed; manually bump counter (player will reflect in hash)
        this.beatCounter++;
        return true;
      }
      if (consumed === false) return false;
      // undefined → fall through to default
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
    if (this.state === 'unmounted') return;
    this.abortCtrl.abort();
    if (this.segment.unmount) {
      try { this.segment.unmount(); } catch (e) { console.error('unmount() threw', e); }
    }
    // Resolve any pending waitForNext promises so hanging awaits unblock
    while (this.resolvers.length) this.resolvers.shift()!();
    this.state = 'unmounted';
  }

  get currentBeat(): number { return this.beatCounter; }

  /** In render mode, advance the deterministic frame counter. Called by Player.renderAdvance(). */
  advanceRenderFrame(): void {
    this.renderFrameCount++;
  }

  // Internals

  private defaultNext(): boolean {
    if (this.resolvers.length === 0) return false; // segment finished, let player advance
    const r = this.resolvers.shift()!;
    this.beatCounter++;
    r();
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
          if (this.state === 'unmounted') { resolve(); return; }
          this.resolvers.push(resolve);
        });
      },
      hold: (ms: number) => {
        // In render mode, hold resolves immediately -- no wall-clock delay.
        // The deterministic clock advances based on frame count, not real time.
        if (this.mode === 'render') return Promise.resolve();
        return new Promise<void>((resolve) => {
          if (this.abortCtrl.signal.aborted) { resolve(); return; }
          const t = setTimeout(resolve, ms);
          this.abortCtrl.signal.addEventListener('abort', () => {
            clearTimeout(t);
            resolve();
          }, { once: true });
        });
      },
      signal: this.abortCtrl.signal,
      mode: this.mode,
      clock: () => {
        // In render mode, return deterministic time based on frame count
        if (this.mode === 'render') return this.renderFrameCount * this.frameDurationMs;
        return performance.now() - this.mountedAt;
      },
    };
  }
}
```

### `hold(ms)` behavior varies by mode

In **interactive mode**, `hold(ms)` uses `setTimeout` internally. In **render mode**, `hold(ms)` resolves immediately -- no real-time delay. This ensures frames are byte-identical across runs and the render driver controls pacing entirely through `renderAdvance()`.

The functional spec calls out `setTimeout`/`setInterval` as a footgun **for authors**, because in render mode they won't honor the controlled clock. Inside the lib, `hold`'s implementation branches on `mode` -- interactive uses `setTimeout`, render resolves immediately.

### Beat counter and the player

The runner exposes `currentBeat`. The Player polls it after each `triggerNext` call (or the runner emits an event — TBD during implementation; both work). The Player writes to the URL hash from the polled value.

### Idempotency requirement (re-iterated for implementation)

`play()` may be called multiple times across a session — once per mount. Each mount creates a **new** `SegmentRunner` with fresh state. The user's `play()` body must not assume "this is the first time."

If a segment author needs to share state between mounts (e.g. cached fetch results), they should hold module-level state outside the segment object — that survives re-mounts naturally since the segment module is loaded once.

## Dependencies

**Depends on:**
- Browser `AbortController`, `performance.now()`.
- Types module.

**Depended on by:**
- `player.md` (Player instantiates and owns SegmentRunners).
- Consumers writing segments via `defineSegment`.

## Test Plan

### Unit (Vitest, no DOM needed for most)

- `defineSegment_returns_branded_object`: returned object has `SEGMENT_BRAND` and all spec fields.
- `defineSegment_throws_without_id`: missing id → TypeError.
- `defineSegment_throws_without_play`: missing play → TypeError.
- `runner_mount_calls_segment_mount`: segment with `mount` → called with element and ctx.
- `runner_mount_skips_if_no_mount_fn`: segment without `mount` → resolves immediately.
- `runner_play_creates_fresh_ctx`: separate ctx instance per startPlay call.
- `ctx_signal_aborts_on_unmount`: signal.aborted is true after runner.unmount().
- `ctx_signal_does_not_abort_on_play_resolution`: signal not aborted just because play() resolves.
- `ctx_clock_zero_at_mount`: clock() right after mount returns ~0.
- `ctx_clock_advances`: after 50ms, clock() is ~50.
- `wait_for_next_queues_until_triggered`: waitForNext promise pending; triggerNext resolves it.
- `wait_for_next_increments_beat_counter`: triggerNext → currentBeat increments.
- `wait_for_next_returns_false_after_play_done`: with no pending resolver, defaultNext returns false.
- `seek_beats_resolves_synchronously`: with seekBeats=2, first 2 waitForNext calls resolve in same tick.
- `seek_beats_normal_after_exhausted`: after seekBeats consumed, subsequent waits queue.
- `hold_resolves_after_ms`: hold(50) resolves after ~50ms.
- `hold_resolves_immediately_on_abort`: unmount during hold → hold resolves.
- `unmount_drains_pending_resolvers`: pending awaits don't hang after unmount.
- `unmount_is_idempotent`: calling unmount twice is safe.
- `unmount_swallows_user_unmount_error`: user's unmount() throws → logged, not re-thrown.
- `custom_next_returning_true_consumes`: spec.next returning true → triggerNext returns true; default behavior bypassed.
- `custom_next_returning_false_lets_player_advance`: spec.next returning false → triggerNext returns false even with pending resolvers.
- `custom_next_returning_undefined_falls_through`: undefined → default behavior runs.
- `prev_default_always_false`: triggerPrev with no spec.prev → false.
- `prev_custom_consumes`: spec.prev returning true → triggerPrev returns true.
