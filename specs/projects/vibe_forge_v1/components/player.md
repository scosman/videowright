---
status: complete
---

# Component: Player

The runtime that loads a timeline and renders it. The most complex component in the lib.

## Purpose and Scope

**Owns:**

- Slot lifecycle (mount, play, unmount of segments).
- Transition orchestration between segments.
- User input (keyboard + mouse) routing to segments and to player-level commands.
- URL hash routing (read on load, write on every state change).
- Hot-reload integration (Vite full-reloads; player restores from hash).
- Dev-mode HUD rendering.

**Not owned:**

- Segment authoring helpers (`defineSegment`, `PlayerContext` impl) → `segment_helper.md`.
- Timeline parsing / id resolution / config defaults → `timeline_loader.md`.
- CLI / Vite dev server / file watching → `cli.md`.

## Public Interface

```ts
// videowright/src/index.ts re-exports:
export class Player {
  constructor(host: HTMLElement, options?: PlayerOptions);
  load(timeline: Timeline, segmentLoaders: SegmentLoaderMap, transitionLoaders?: TransitionLoaderMap): Promise<void>;
  start(): Promise<void>;
  destroy(): void;
}

export interface PlayerOptions {
  hud?: boolean;                   // default: true
}

export type SegmentLoaderMap = Map<string, () => Promise<{ default: Segment }>>;
export type TransitionLoaderMap = Map<string, () => Promise<{ default: Transition }>>;
```

`load` validates the timeline against the loader maps and prepares for playback. `start` reads the URL hash (or `?to=<id>` query) and begins playback at that position; defaults to the first segment, beat 0.

`destroy` aborts all in-flight segment work, removes DOM, removes event listeners.

### Errors

| Condition | Behavior |
|---|---|
| `load` called with a timeline that references an unknown segment id | Rejects with `TimelineError`; Player renders error overlay if `hud` is on. |
| Segment's `mount()` throws | Player catches; HUD shows "segment errored" banner with id + message; halts. Does not advance. |
| Segment's `play()` throws | Same as `mount()`. |
| `start` called twice | Second call is a no-op. |

## Internal Design

### Module structure

```
src/player/
├── index.ts                # Player class
├── slot.ts                 # slot div helpers (creation, positioning)
├── runner.ts               # SegmentRunner: per-mount state + ctx implementation
├── hash_router.ts          # parse, write, listen to URL hash
├── transitions/
│   ├── index.ts            # built-in registry
│   ├── fade.ts
│   ├── slide.ts            # slideLeft/Right/Up/Down (parameterized)
│   └── cut.ts
├── hud.ts                  # HUD overlay
└── input.ts                # keyboard + mouse listener; emits player commands
```

### State machine

Player states: `idle` → `loading` → `playing` → `transitioning` → `ended` | `errored`.

Transitions:

- `idle → loading` on `load()`.
- `loading → playing` on first segment mounted + play() started.
- `playing → transitioning` on next/prev press (when not consumed by segment).
- `transitioning → playing` after transition function resolves and outgoing unmounted.
- any → `ended` on advancing past the last segment.
- any → `errored` on caught exception in segment lifecycle.

### Slot model

Two slot divs, children of the host:

```html
<div class="vw-host">
  <div class="vw-slot" data-slot="a"></div>
  <div class="vw-slot" data-slot="b"></div>
  <div class="vw-hud"></div>
</div>
```

Each slot div has inline positioning styles (`position:absolute;inset:0;overflow:hidden;`) so external CSS can't break the layout. The Player tracks which slot is `current` and which is `incoming` (alternates as segments advance — slots are reused, not destroyed).

The slot div is passed directly to the segment's `mount(el, ctx)`. Whether the segment attaches a shadow root, appends children to the div, or does anything else is the segment author's choice. The lib does not impose a hosting strategy.

### Forward-step flow

```
on next-press (not consumed by segment):
  if at last segment: play "end" indicator, no-op
  acquire incoming slot (the unused one)
  load incoming segment module (await)
  create SegmentRunner for incoming
  await runner.mount(incomingSlot.el, ctx)
  state = transitioning
  await Promise.all([
    outgoingRunner.playPromise,        // resolves when outgoing's play() resolves
    runner.startPlay(),                 // starts incoming's play()
  ])
  await runTransition(transitionConfig, outgoingSlot.el, incomingSlot.el, { direction: 'forward' })
  outgoingRunner.unmount()
  swap current ↔ incoming
  hash_router.set(newSegmentId, 0)
  state = playing
```

For the very first segment, there's no outgoing — skip the transition step.

### Backward-step flow

```
on prev-press (not consumed by segment, default behavior):
  if at first segment AND beat 0: no-op
  determine target: previous segment (or current segment, beat 0 — see below)
  acquire incoming slot
  load segment module (already cached from forward pass; cheap)
  create new SegmentRunner (fresh state)
  await runner.mount(incomingSlot.el, ctx)
  state = transitioning
  await runTransition('cut', ...)        // backward defaults to cut
  outgoingRunner.unmount()
  swap
  hash_router.set(targetId, 0)
  state = playing
```

**Note**: by default, prev jumps to the previous segment regardless of where in the current segment we are. The author can override with `prev()` returning `true` to handle internal back-navigation, but the default is simple. (Question: should default prev at beat > 0 jump to beat 0 of the same segment first? See "Open question A" below.)

### Hash routing

`hash_router.ts`:

```ts
interface HashState { segmentId: string; beat: number; }

function read(): HashState | null;          // parses location.hash; null if absent/malformed
function write(state: HashState): void;     // history.replaceState, no history entry
function readQueryFallback(): string | null; // reads ?to=<id>, returns id, removes query, replaces history
function onChange(handler: (s: HashState) => void): () => void; // hashchange listener; returns unsubscribe
```

Parse format: `#/<segmentId>/<beat>` — strict regex. Malformed hash → null, player ignores and starts at default.

Player calls `write` on:
- segment change (set beat to 0)
- internal beat advance (received from SegmentRunner)

Player listens to `onChange` and reacts: if user manually edits URL to a different segment/beat, jump there (full forward/backward seek).

### Seek-to-beat-N on load

When `start()` reads hash `#/<id>/<n>` with n > 0:

1. Find segment in timeline.
2. Mount it as the first segment (no transition).
3. Tell SegmentRunner to seek N beats: `runner.seekBeats = n`. The runner's `waitForNext()` resolves immediately for the first N calls (synchronously), incrementing the counter without yielding to user input. After N, normal interactive behavior.
4. `play()` proceeds; from the user's perspective, the segment renders at "beat N state" instantly.

`hold(ms)` is **not** fast-forwarded during seek — it runs at normal speed. Authors who want `hold` to skip on seek should restructure as `waitForNext()` instead.

### Hot reload

Vite's dev server watches consumer files. On change, Vite triggers a full page reload (we don't use Vite's HMR API for in-place updates; full reload is simpler and the hash preserves position).

The Player has no special hot-reload logic — it just reads the hash on `start()`.

### HUD

`hud.ts` renders as a positioned-absolute `.vw-hud` div inside the host. CSS scoped via class names. Subscribes to player state changes via a small event emitter. Shows the fields listed in functional spec §3.

Keyboard `H` toggles visibility.

HUD also surfaces error state (segment errored banner with id + message + stack toggle).

### Input

`input.ts` attaches listeners to the host element:

- `keydown`: arrow keys, space, R, H, 1-9.
- `click` on host (excluding HUD): forward.

Emits player commands. The player's command handler asks the current segment first (`segment.next()` / `segment.prev()`); if not consumed, handles as player-level navigation.

Pause is not implemented (per functional spec).

### Render mode

Render mode is activated via `PlayerOptions.renderMode: true`. In render mode:

- **No interactive input.** Input listeners are not attached. The player is controlled entirely via `player.renderAdvance()`.
- **HUD off by default.** The HUD is hidden unless explicitly enabled.
- **Deterministic clock.** `SegmentRunner` in render mode returns `frameCount * frameDurationMs` from `clock()` instead of `performance.now()`.
- **Instant hold.** `ctx.hold(ms)` resolves immediately -- no wall-clock delay. This ensures frames are byte-identical across runs.
- **Beat advancement.** `waitForNext()` still requires explicit resolution via `triggerNext()`, which `renderAdvance()` calls.
- **Frame advancement.** `renderAdvance()` calls `slot.runner.advanceRenderFrame()` before each `triggerNext()`, ensuring the frame counter (and thus `clock()`) increments monotonically. The render driver (render.ts) does NOT call `advanceRenderFrame()` directly -- `renderAdvance()` owns that responsibility.
- **`renderAdvance()` API.** Returns `Promise<boolean>` -- `true` if more frames remain, `false` when the timeline is exhausted. Each call advances one beat (or transitions to the next segment if the current segment has no pending waits). Transitions are fully awaited before returning, so the caller never captures a mid-transition frame.
- **`clock()` is frozen between beats.** `renderAdvance()` is called only at scheduled beat boundaries (driven by the segment's `advances` array). Between beats, no `advanceRenderFrame()` occurs, so `clock()` returns the same value for every inter-beat frame. This is a deliberate consequence of "hold resolves immediately" -- segments execute to completion at each beat, the DOM is static between beats, and the render driver captures the static state. Segment authors should not expect `clock()` to drive intra-beat animation in render mode; use CSS animations or WAAPI instead.

The render-mode entry (`render_entry.ts`) exposes globals for CDP control:
- `window.__VW_RENDER__` -- boolean flag signaling render mode.
- `window.__VW_RENDER_READY__` -- set to `true` once the player is booted and ready.
- `window.__VW_RENDER_ADVANCE__()` -- calls `player.renderAdvance()`, returns the boolean result.
- `window.__VW_RENDER_ERROR__` -- set if an error occurs during boot or rendering.

### Error overlay

When `state = errored`, the HUD renders an overlay with:

- Segment id where the error occurred
- Error message
- Toggle to expand stack trace (also dumped to console)
- "Reload" button (browser reload — picks up any code fixes)

## Dependencies

**Depends on:**
- `segment_helper.md` (SegmentRunner is here per the structure above; cross-component coupling is tight)
- `timeline_loader.md` (Player accepts a validated Timeline + loader maps)
- Browser APIs: Web Animations, History API, AbortController.

**Depended on by:**
- `cli.md` (Player is what `videowright dev` boots).
- Consumer code that imports `Player` directly (rare; CLI is the typical path).

## Test Plan

### Unit (Vitest)

- `hash_router_parse_valid`: `#/intro/0` → `{segmentId: 'intro', beat: 0}`.
- `hash_router_parse_malformed`: `#garbage` → null; `#/intro` → null.
- `hash_router_query_fallback`: `?to=intro` → returns 'intro' and clears query.
- `hash_router_write_no_history_entry`: writes don't push to history.
- `slot_is_plain_div`: slot is a `<div>` with inline positioning styles; no shadow root attached by lib.
- `built_in_transitions`: each (fade, slide×4, cut) resolves; with `direction: 'backward'`, slides flip direction; cut takes <16ms.

### Integration (Vitest + jsdom)

- `load_then_start_first_segment`: 3-segment timeline; after `start()`, first segment mounted, `play()` started, hash is `#/seg-0/0`.
- `forward_through_three`: simulate 3 next-presses with no internal beats; verify mount/unmount calls in order; final hash is `#/seg-2/0`.
- `internal_beats_advance_hash`: segment with 3 `waitForNext()` calls; press next 3 times; hash steps `#/seg/0` → `/1` → `/2` → next segment.
- `prev_at_beat_zero_jumps_back`: from `seg-2` beat 0, prev → `seg-1` beat 0 (re-mount, fresh state).
- `prev_at_first_segment_first_beat_noop`: at `seg-0` beat 0, prev → no change.
- `next_at_end_of_timeline_noop`: at last segment with no pending waits, next → HUD shows "end of timeline", no advance.
- `seek_on_load_to_beat_n`: hash `#/seg-1/2`, start → seg-1 mounted, first 2 `waitForNext` resolved synchronously, 3rd waits for input.
- `mount_throws_shows_error_overlay`: segment whose mount() throws → state=errored, overlay rendered with id + message.
- `play_throws_shows_error_overlay`: same but during play().
- `unsubscribed_on_unmount`: previous segment's signal is aborted when next segment mounts.
- `hashchange_listener_jumps`: manual hash edit during playback → player jumps to new position.

### E2E (Playwright)

Covered by the demo_example test plan; not duplicated here.
