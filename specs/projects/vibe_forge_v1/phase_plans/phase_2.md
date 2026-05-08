---
status: complete
---

# Phase 2: Types + Segment Authoring

## Overview

Define all public types for the library and implement the segment authoring layer: `defineSegment`, `defineConfig`, and the internal `SegmentRunner`. This phase establishes the core contracts that all subsequent phases depend on.

## Steps

1. **Write `src/types.ts`** with all public type definitions:
   - `PlayerContext` interface: `waitForNext()`, `hold(ms)`, `signal`, `mode`, `clock()`.
   - `SegmentSpec` interface: `id`, `voiceover?`, `notes?`, `mount?`, `play`, `unmount?`, `next?`, `prev?`.
   - `SEGMENT_BRAND` symbol and `Segment` type (branded `SegmentSpec`).
   - `TimelineEntry`: `id`, `transition?`, `renderBeats?`.
   - `TimelineMeta`: `title`, `aspectRatio?`, `resolution?`, `fps?`.
   - `Timeline`: `meta`, `segments`.
   - `Transition`: function signature `(outgoing, incoming, ctx) => Promise<void>`.
   - `TransitionContext`: `direction`, `duration?`.
   - `Config`: `projectStructure`, `defaults?`, `transitions?`.

2. **Write `src/segment/defineSegment.ts`**: thin branding function that validates `id` and `play`, returns a frozen `Segment`.

3. **Write `src/segment/defineConfig.ts`**: identity function for typed config authoring.

4. **Write `src/segment/SegmentRunner.ts`**: internal class per the component spec. Owns per-mount state: beat counter, resolver queue, abort controller, seek-beats, `makeContext()`, `mount()`, `startPlay()`, `triggerNext()`, `triggerPrev()`, `unmount()`, `currentBeat`.

5. **Write `src/segment/index.ts`**: re-export `defineSegment` and `defineConfig`. Export `SegmentRunner` for internal use (not from the public barrel).

6. **Update `src/index.ts`**: re-export public surface from `segment/` and `types.ts`.

7. **Write unit tests** in `packages/lib/test/unit/` per the test plan from `segment_helper.md`.

## Tests

- `defineSegment_returns_branded_object`: returned object has SEGMENT_BRAND and all spec fields.
- `defineSegment_throws_without_id`: missing id -> TypeError.
- `defineSegment_throws_without_play`: missing play -> TypeError.
- `defineSegment_frozen`: returned object is frozen.
- `runner_mount_calls_segment_mount`: segment with mount -> called with element and ctx.
- `runner_mount_skips_if_no_mount_fn`: segment without mount -> resolves immediately.
- `runner_play_creates_fresh_ctx`: separate ctx instance per startPlay call.
- `ctx_signal_aborts_on_unmount`: signal.aborted is true after runner.unmount().
- `ctx_signal_does_not_abort_on_play_resolution`: signal not aborted just because play() resolves.
- `ctx_clock_zero_at_mount`: clock() right after mount returns ~0.
- `ctx_clock_advances`: after delay, clock() advances.
- `wait_for_next_queues_until_triggered`: waitForNext promise pending; triggerNext resolves it.
- `wait_for_next_increments_beat_counter`: triggerNext -> currentBeat increments.
- `wait_for_next_returns_false_after_play_done`: with no pending resolver, defaultNext returns false.
- `seek_beats_resolves_synchronously`: with seekBeats=2, first 2 waitForNext calls resolve in same tick.
- `seek_beats_normal_after_exhausted`: after seekBeats consumed, subsequent waits queue.
- `hold_resolves_after_ms`: hold(50) resolves after ~50ms.
- `hold_resolves_immediately_on_abort`: unmount during hold -> hold resolves.
- `unmount_drains_pending_resolvers`: pending awaits don't hang after unmount.
- `unmount_is_idempotent`: calling unmount twice is safe.
- `unmount_swallows_user_unmount_error`: user's unmount() throws -> logged, not re-thrown.
- `custom_next_returning_true_consumes`: spec.next returning true -> triggerNext returns true.
- `custom_next_returning_false_lets_player_advance`: spec.next returning false -> triggerNext returns false.
- `custom_next_returning_undefined_falls_through`: undefined -> default behavior runs.
- `prev_default_always_false`: triggerPrev with no spec.prev -> false.
- `prev_custom_consumes`: spec.prev returning true -> triggerPrev returns true.
- `defineConfig_returns_typed_config`: returns the config object unchanged.
