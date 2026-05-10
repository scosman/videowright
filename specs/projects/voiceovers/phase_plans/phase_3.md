---
status: complete
---

# Phase 3: Player audio + HUD play button + `record` voiceover wiring

## Overview

This phase adds browser-side audio playback, an idle/playing state machine with a HUD play button, and wires the `record` command to accept `--voiceover`. After this phase, `dev` and `record` both play voiceover audio synced to playback, the play button works in both, and manual nav pauses correctly.

## Steps

1. **Extend `PlayerOptions` and `Player` with audio support (`packages/lib/src/player/index.ts`)**
   - Add `audioFile?: string` to `PlayerOptions` for the Vite-served audio file path.
   - Add `recordMode?: boolean` to `PlayerOptions` to distinguish record from dev.
   - Add `resolvedTiming?: Record<string, number[]>` to `PlayerOptions` for auto-advance schedules.
   - Create an `<audio>` element when `audioFile` is provided (not in render mode). Set `preload="auto"`, no controls.
   - Add `playbackMode: "idle" | "playing"` state (distinct from the existing `PlayerState`).
   - Expose `togglePlayback()` method: toggles idle <-> playing.
   - In `"playing"` mode, start an auto-advance loop driven by `resolvedTiming`. On each beat, `setTimeout` fires `handleNext()` at the correct inter-advance interval.
   - When entering playing: sync `audio.currentTime` to the player's logical position, then `audio.play()`.
   - When entering idle (manual nav, or toggle): `audio.pause()`, cancel pending auto-advance timer.
   - Manual nav (`handleNext`, `handlePrev`, jumps, hash changes) transitions to idle if currently playing.
   - Drift check: when auto-advancing, compute expected audio time and snap if drift > 200ms.
   - End-of-timeline stops audio and transitions to idle.
   - Destroy cleans up audio element.

2. **Add play button to HUD (`packages/lib/src/player/hud.ts`)**
   - Add `onPlayToggle?: () => void` callback to `createHud()` options.
   - Render a play/pause button in the `vw-hud-inner` bar. Show triangle (play) in idle, pause icon when playing.
   - Add `playbackMode?: "idle" | "playing"` to `HudState`.
   - Button is `pointer-events: auto` so clicks reach it even when the overlay is `pointer-events: none`.
   - Add CSS for `.vw-hud-play` button styling.
   - In `recordMode`, show only the play button and end-of-timeline badge (no segment info, no keyboard ref).

3. **Wire `entry_client.ts` to accept audio + timing for dev and record modes**
   - Read `default_voiceover` from the loaded timeline if present.
   - If a voiceover is active, resolve the audio file URL relative to the consumer root for Vite serving.
   - Use `resolveTiming` (imported from lib) to build the per-segment schedule from browser-loaded segment advances + timeline timing.
   - Pass `audioFile` and `resolvedTiming` to the Player constructor options.
   - Wire `onPlayToggle` callback from HUD to `player.togglePlayback()`.
   - For `?recordMode=1`: pass `recordMode: true` to player (shows play button, hides rest of HUD).

4. **Add window globals for record-mode voiceover injection (`entry_client.ts`)**
   - Add `__VW_AUDIO_FILE__` and `__VW_RESOLVED_TIMING__` window globals (set via Vite `define` from the record CLI).
   - When these globals are present, they override the timeline's default_voiceover (CLI voiceover takes precedence).

5. **Update `record.ts` to accept `--voiceover` and inject globals**
   - Add `voiceover?: string` to `RecordOptions`.
   - When voiceover slug is provided, call `loadVoiceover` to get the audio file path and voiceover object.
   - When voiceover is "none", suppress default_voiceover.
   - When default_voiceover exists on timeline and no CLI flag, resolve its audio path.
   - Inject `__VW_AUDIO_FILE__` and `__VW_RESOLVED_TIMING__` into Vite `define` config (passed through to `runDev`).
   - Pass resolved timing JSON as a stringified window global.

6. **Extend `runDev` to accept optional Vite `define` overrides (`dev.ts`)**
   - Add `extraDefines?: Record<string, string>` to `DevOptions`.
   - Merge `extraDefines` into the Vite `define` config.
   - `record.ts` passes audio/timing defines through this mechanism.

7. **Update argv parser to allow `--voiceover` on `record` (`argv.ts`)**
   - Add `"record"` to `VOICEOVER_COMMANDS` set.
   - Update the error message (no longer "render only").

8. **Update CLI `index.ts`**
   - Pass `flags.voiceover` to `runRecord` options.
   - Update help text to show `--voiceover` applies to record and render.

## Tests

- `cli_voiceover_argv.test.ts` update: record now accepts `--voiceover slug` and `--voiceover none` (change the existing "rejects" test to "accepts").
- `record_render_argv.test.ts`: add test for `record --voiceover slug` parsing.
- New tests in player test file for playback mode state machine (idle/playing toggle, manual nav pauses, end-of-timeline).
- HUD test: play button renders and fires callback.
