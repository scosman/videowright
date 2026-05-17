---
status: complete
---

# Phase 3: Audio plan + build + sync skill

## Overview

Write the core skill reference files that teach the agent how to author an audio plan, build (mux) a track, and sync video timing to the track. After this phase, the agent can author a VO-only audio plan, build a track from it, sync per-segment advances, and have render consume the result. Also includes the ffmpeg cookbook, cue template, and editing style guidance references.

## Steps

1. **Create `references/audio/audio_plan.md`** — the full specification of the `audio_plan.md` format: two-section structure (Plan + Log), prose summary, cue list in playback order, final mix command with `{TRACK_OUT}` placeholder, log entry shapes (render entry, activation entry). References the cue template for per-cue format.

2. **Create `references/audio/cue_template.md`** — the per-cue labeled-field template (Source, Slice, Place at, Volume, Fades, Notes) plus the ffmpeg snippet convention. Covers VO slicing/reuse (multiple cues from one VO), SFX and music cue shapes, and the final mix command structure.

3. **Create `references/audio/ffmpeg_cookbook.md`** — copy-pasteable ffmpeg recipes: trim + place (`atrim` + `adelay`), constant volume (`volume=0.5`), time-varying volume / ducking, fade in/out (`afade`), crossfade (`acrossfade`), loop to length (`aloop` + `atrim`), mix N streams (`amix`), final master with normalization (`loudnorm`).

4. **Create `references/audio/styles.md`** — editing style guidance for product/demo videos: music level under speech, SFX level guidance, ducking ramp guidance (~0.2s ramps), headroom / LUFS target, music selection principles, SFX selection principles ("enhance, don't decorate").

5. **Create `references/audio/build.md`** — the mux workflow: determine next track ID, create folder, snapshot plan section, substitute `{TRACK_OUT}` and run ffmpeg, write `track.ts` (measure length via ffprobe), append render log entry, print clickable file:// link, prompt Approve/Discard, handle each path (update timeline.ts import on approve, delete folder on discard).

6. **Create `references/audio/sync.md`** — the sync-to-audio workflow: read default track's plan_snapshot.md, parse VO cues (Source, Slice, Place at), load each VO's timing.json, compute effective word times on the track (`p + (w - a)`), augment with SFX/music anchors from Notes fields, map to per-segment advances, update track.ts timing field, append sync log entry.

7. **Update `references/audio.md`** — replace the placeholder routing entries for "Audio plan, build, and sync" with actual links to the new files. Update the SFX/music placeholders to mention that sourcing is Phase 5, but plan/build/sync are now available.

8. **Update `references/audio/voiceover.md`** — update the "Default voiceover?" step in Flow A and Flow B to reference the new build workflow (`audio/build.md`) instead of directly updating timeline.ts. The voiceover flow now feeds into the audio plan → build → sync pipeline for multi-source tracks.

## Tests

- No automated tests for skill markdown files (they are documentation, not executable code)
- Verify all internal markdown links resolve by checking relative paths
- Run `npm run typecheck` and `npm run lint` to confirm no TS/lint regressions
- Run `npm test` to confirm existing tests still pass
