---
status: complete
---

# Phase 4: Player

## Overview

Implement the core Player runtime. This is the most complex component: it orchestrates segment lifecycle (mount/play/unmount), manages two-slot A/B transition pattern, handles hash routing for position persistence, processes user input (keyboard, click, touch), renders a dev-mode HUD, implements seek-to-beat-N on load, and surfaces errors via an overlay. Render mode is stubbed (always interactive).

## Steps

1. **Expose SegmentRunner state** -- Add public getters to `SegmentRunner`:
   - `get isDone(): boolean` -- true when play() has resolved.
   - `get getPlayPromise(): Promise<void> | null` -- the play() promise for awaiting.
   This avoids exposing the full state machine while letting the Player coordinate transitions.

2. **`src/player/hash_router.ts`** -- Parse/write/listen to URL hash:
   - `read(): HashState | null` -- parse `#/<segmentId>/<beat>`, strict regex.
   - `write(state: HashState): void` -- `history.replaceState`, no history push.
   - `readQueryFallback(): string | null` -- read `?to=<id>`, clear query, replace history.
   - `onChange(handler): () => void` -- `hashchange` listener, returns unsubscribe.
   - Type: `interface HashState { segmentId: string; beat: number; }`

3. **`src/player/slot.ts`** -- Slot div creation helpers:
   - `createSlot(label: string): HTMLDivElement` -- creates a `<div class="vw-slot" data-slot="a|b">` with inline positioning styles (`position:absolute;inset:0;overflow:hidden`).
   - No shadow root -- plain div passed to segments.

4. **`src/player/input.ts`** -- Input listener module:
   - `type PlayerCommand = 'next' | 'prev' | 'restart' | 'toggleHud' | { kind: 'jumpTo'; index: number }`
   - `attachInput(host: HTMLElement, emit: (cmd: PlayerCommand) => void): () => void` -- attaches keydown on window + click on host. Returns cleanup function.
   - Keys: ArrowRight/Space/click -> next, ArrowLeft -> prev, R -> restart, H -> toggleHud, 1-9 -> jumpTo.
   - Touch: swipe left -> next, swipe right -> prev (basic threshold).

5. **`src/player/hud.ts`** -- HUD overlay:
   - `createHud(): { el: HTMLDivElement; update(state: HudState): void; show(): void; hide(): void; toggle(): void; }`
   - `HudState`: segment id, beat, segmentTime, totalTime, voiceover, mode, ended flag, error info.
   - CSS scoped via class names. Error overlay with id, message, stack toggle, reload button.

6. **`src/player/index.ts`** -- The Player class:
   - Constructor: `new Player(host, options?)` -- creates host wrapper, two slots, HUD, attaches input.
   - `load(timeline, segmentLoaders, transitionLoaders?)`: validates timeline, stores data, state idle->loading.
   - `start()`: reads hash/query, seeks to position, mounts+plays first segment, state->playing.
   - `destroy()`: aborts all, removes DOM, removes listeners.
   - Internal: forward-step, backward-step, jumpTo, restart flows per spec.
   - State machine: idle -> loading -> playing -> transitioning -> ended | errored.
   - Two-slot A/B orchestration: on transition, mount incoming in unused slot, run transition fn, unmount outgoing, swap.
   - Error handling: catch mount/play throws, set state=errored, render error overlay.

7. **`src/index.ts`** -- Export `Player` and `PlayerOptions` from the public barrel.

8. **Unit tests: `test/unit/hash_router.test.ts`**:
   - `hash_router_parse_valid`: `#/intro/0` -> `{segmentId:'intro', beat:0}`.
   - `hash_router_parse_malformed`: `#garbage` -> null; `#/intro` -> null.
   - `hash_router_query_fallback`: `?to=intro` -> returns 'intro'.
   - `hash_router_write_no_history_entry`: writes don't push to history.

9. **Unit tests: `test/unit/slot.test.ts`**:
   - `slot_is_plain_div`: slot is a div with inline positioning styles.

10. **Integration tests: `test/integration/player.test.ts`**:
    - `load_then_start_first_segment`: 3-segment timeline; after start(), first mounted+playing, hash is `#/seg-0/0`.
    - `forward_through_three`: 3 next-presses; verify mount/unmount order; final hash `#/seg-2/0`.
    - `internal_beats_advance_hash`: segment with 3 waitForNext; press next 3 times; hash steps.
    - `prev_at_beat_zero_jumps_back`: from seg-2 beat 0, prev -> seg-1 beat 0.
    - `prev_at_first_segment_first_beat_noop`: at seg-0 beat 0, prev -> no change.
    - `next_at_end_of_timeline_noop`: at last segment, next -> HUD shows end, no advance.
    - `seek_on_load_to_beat_n`: hash `#/seg-1/2`, start -> seg-1 mounted, first 2 waitForNext resolved, 3rd waits.
    - `mount_throws_shows_error_overlay`: segment whose mount() throws -> state=errored, overlay rendered.
    - `play_throws_shows_error_overlay`: same but during play().
    - `unsubscribed_on_unmount`: previous segment's signal is aborted on next segment mount.
    - `hashchange_listener_jumps`: manual hash edit -> player jumps.

## Tests

- `hash_router_parse_valid`: parses `#/intro/0` correctly.
- `hash_router_parse_malformed`: returns null for garbage/incomplete hashes.
- `hash_router_query_fallback`: reads `?to=intro` and returns id.
- `hash_router_write_no_history_entry`: replaceState, no push.
- `slot_is_plain_div`: div with correct inline styles and data-slot attribute.
- `load_then_start_first_segment`: full lifecycle for first segment.
- `forward_through_three`: sequential forward navigation.
- `internal_beats_advance_hash`: beat-level hash tracking.
- `prev_at_beat_zero_jumps_back`: backward navigation across segments.
- `prev_at_first_segment_first_beat_noop`: no-op at start.
- `next_at_end_of_timeline_noop`: no-op at end.
- `seek_on_load_to_beat_n`: seek via hash on load.
- `mount_throws_shows_error_overlay`: error handling for mount.
- `play_throws_shows_error_overlay`: error handling for play.
- `unsubscribed_on_unmount`: signal abort on segment change.
- `hashchange_listener_jumps`: external hash change handling.
