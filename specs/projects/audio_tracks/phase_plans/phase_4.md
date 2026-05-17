---
status: complete
---

# Phase 4: Migrate `/examples/videowright_demo/` + End-to-End Validation

## Overview

Migrates all three demo videos (`demo_video`, `demo_editorial_mono`, `demo_risograph`) from the old voiceover layout to the new audio-track layout. Also removes the deprecated `default_voiceover` field from the `Timeline` type (per the Phase 4 note in types.ts). Updates the demo smoke test to check for the new directory structure.

## Steps

### 1. Remove deprecated `default_voiceover` from `Timeline` type

In `packages/lib/src/types.ts`, remove the `default_voiceover?: Voiceover` field and its deprecation comment from the `Timeline` interface. The migration of examples is what enables this removal.

### 2. Fix `audio_file` path resolution consistency

The `audio_file` field on `AudioTrack` had an ambiguous contract: "relative to track.ts directory" for `loadAudioTrack`, but "relative to video folder" for `default_audio_track` in timeline.ts. Unified to always be video-folder-relative. Updated `loadAudioTrack` to resolve from `videoFolder` instead of `trackFolder`. Updated all track.ts files (demos, hello_world template, test fixtures) to use video-folder-relative paths. Updated `AudioTrack` type JSDoc to clarify the single contract.

### 3. Migrate `demo_video`

For `examples/videowright_demo/videos/demo_video/`:

a. Rename `voiceover/` to `voiceover_script/`
b. Create `audio/originals/` directory structure and move `voiceovers/` to `audio/originals/voiceovers/`
c. Create empty `audio/originals/sfx/` and `audio/originals/music/` directories (with `.gitkeep`)
d. Draft `audio/audio_plan.md` wrapping the active VO (v4) in a single full-file cue
e. Build `audio/tracks/v1/` with `track.ts`, `track.mp3` (copy of VO audio), and `plan_snapshot.md`
f. Update `timeline.ts` to import `defaultAudioTrack` from `./audio/tracks/v1/track.js` and use `default_audio_track`
g. Update voiceover.ts files: `audio_file` and `provider_timing_file` paths corrected to be relative to voiceover.ts directory

### 4. Migrate `demo_editorial_mono`

Same steps as demo_video but for v2 voiceover. The audio track inherits the em-* segment timing from the voiceover.

### 5. Migrate `demo_risograph`

Same steps as demo_editorial_mono but with rs-* segment IDs.

### 6. Update demo smoke test

Update `packages/lib/test/integration/demo_smoke.test.ts` to check for `voiceover_script/script.md` instead of `voiceover/script.md`, and verify the new audio directory structure exists.

### 7. Add migration validation test

Add a test that loads each migrated demo timeline via tsx and verifies it has `default_audio_track` (not `default_voiceover`), the audio track has valid timing, and the audio file exists on disk.

### 8. Add render pre-flight validation tests

For each demo, exercise the same code paths that `render.ts` executes before launching the browser:
- Resolve `audio_file` from the video folder and confirm the file exists with expected size
- Run `validateAudioTrack` and `validateTiming` (both must pass)
- Run `resolveTiming` and confirm it picks `audio_track` as the timing source with all 8 segments

### 9. Render validation

Actual `videowright render` could not be performed because headless Chromium cannot launch in the sandboxed agent environment (macOS Mach port rendezvous permission denied -- same root cause that skips the 23 render integration tests in the test suite). The render pre-flight tests in step 8 exercise all render.ts logic up to the browser launch, confirming the audio track loads, resolves, validates, and the frame schedule builds correctly. The only untested step is the actual frame capture + ffmpeg mux, which is orthogonal to the audio-track migration (that code path is unchanged).

## Tests

- **demo_smoke updated assertion**: verifies `voiceover_script/script.md` exists (not `voiceover/script.md`)
- **demo_video audio-track structure**: verifies new directory layout, old layout removed
- **demo_video/editorial_mono/risograph timeline checks**: loads each timeline, confirms `default_audio_track` is set with correct timing, `default_voiceover` is absent
- **render pre-flight validation (3 tests)**: exercises `validateAudioTrack`, `validateTiming`, `resolveTiming` for all three demos through the same code paths as render.ts
- **audio track file existence**: confirms track.mp3 exists for all three demos
