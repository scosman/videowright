---
status: complete
---

# Phase 3: Timeline Loader, Transitions, Script Helper

## Overview

This phase implements three modules: the timeline loader (segment/transition loader maps, validation, meta defaults), the built-in transition functions (cut, fade, slide variants using WAAPI), and the script() VO concatenation helper. These are prerequisite for the Player (Phase 4).

## Steps

1. **`src/timeline/index.ts`** -- Implement the four timeline-loader functions:
   - `buildSegmentLoaderMap(globResult)`: parse Vite glob paths via regex, build `Map<string, () => Promise<{default: Segment}>>`, warn on malformed paths.
   - `buildTransitionLoaderMap(config)`: populate map with 6 built-ins (cut, fade, slideLeft/Right/Up/Down), then overlay user transitions from config with console.warn on shadowing.
   - `validateTimeline(timeline, segmentLoaders, transitionLoaders)`: check meta.title, validate each segment id exists, validate each transition name exists. Return `{ok, errors}` or `{ok, timeline}`.
   - `applyMetaDefaults(timeline, config)`: immutable merge -- timeline meta wins, then config.defaults, then hardcoded fallbacks (1920x1080, 60fps, 16:9).
   - Export `SegmentLoaderMap`, `TransitionLoaderMap`, `TimelineError`, `TimelineValidationResult` types.

2. **`src/player/transitions/cut.ts`** -- Instantaneous: hide outgoing, show incoming. No animation.

3. **`src/player/transitions/fade.ts`** -- Crossfade via `Element.animate()`: outgoing opacity 1->0, incoming opacity 0->1, default 400ms, fill:'forwards'.

4. **`src/player/transitions/slide.ts`** -- Four named exports: `slideLeft`, `slideRight`, `slideUp`, `slideDown`. Each uses `Element.animate()` with translate transforms. Default 500ms. Respects `ctx.direction` to flip on backward. Parameterized factory to avoid code duplication.

5. **`src/player/transitions/index.ts`** -- Re-export all transitions for convenient import.

6. **`src/script/script.ts`** -- `script(timeline, segmentLoaders)`: async function that walks timeline.segments, loads each segment module, reads `voiceover` field, emits Markdown with title header + per-segment sections. Segments without voiceover listed under "no VO" note.

7. **`src/script/index.ts`** -- Re-export script function.

8. **`src/index.ts`** -- Add exports for timeline loader functions/types, transitions, and script helper.

9. **Tests: `test/unit/timelineLoader.test.ts`** -- All 16 test cases from `timeline_loader.md` test plan.

10. **Tests: `test/unit/transitions.test.ts`** -- Test each built-in transition resolves; test slide direction flipping on backward; test cut completes near-instantly. Mock `Element.animate()` since jsdom does not implement WAAPI.

11. **Tests: `test/unit/script.test.ts`** -- Test script() walks segments in order, handles missing VO, produces correct Markdown.

## Tests

- `build_segment_map_simple`: glob with 3 paths -> 3-entry map keyed by id.
- `build_segment_map_skips_malformed`: nonconforming path warned, rest still in map.
- `build_segment_map_throws_on_duplicate_id`: two entries for same id -> throws.
- `build_transition_map_has_builtins`: result contains 'cut', 'fade', 'slideLeft' through 'slideDown'.
- `build_transition_map_user_overrides_warn`: user transition named 'fade' -> console warning, user wins.
- `build_transition_map_no_user_transitions`: empty config -> only built-ins.
- `validate_passes_for_valid_timeline`: clean timeline -> ok=true.
- `validate_missing_segment`: timeline with id 'foo' but no loader -> missing-segment error with id 'foo' and timeline title.
- `validate_missing_transition_string`: transition 'morph' not registered -> missing-transition error.
- `validate_missing_transition_object`: `{ type: 'morph' }` not registered -> same error.
- `validate_missing_title`: meta without title -> missing-title error.
- `validate_aggregates_multiple_errors`: timeline with multiple bad entries -> all errors returned.
- `apply_meta_defaults_fills_missing`: timeline meta `{title}` only -> result has resolution/fps/aspectRatio from config.
- `apply_meta_defaults_keeps_present`: timeline with explicit resolution -> not overwritten.
- `apply_meta_defaults_falls_back_to_lib_default`: config without defaults -> 1920x1080, 60fps, 16:9.
- `define_config_returns_input`: defineConfig is identity (already tested in phase 2, skip here).
- `built_in_transitions_fade`: fade transition resolves, animates outgoing and incoming.
- `built_in_transitions_cut`: cut takes <16ms.
- `built_in_transitions_slide`: slideLeft/Right/Up/Down resolve; with direction backward, slides flip.
- `script_walks_segments_in_order`: produces correct Markdown with title + VO per segment.
- `script_handles_missing_vo`: segments without voiceover noted.
- `script_empty_timeline`: empty segments array -> just the title header.
