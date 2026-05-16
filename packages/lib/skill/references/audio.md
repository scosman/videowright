# Audio

## When this is loaded

You were routed here from the intent dispatch table because the user wants to work with audio -- voiceover, sound effects, or background music.

## Overview

Videowright supports multi-source audio tracks: voice-over, sound effects, and music combined into a single rendered audio file. Videos reference an audio track (not a voice-over directly); the audio track drives video timing and is muxed into the final MP4.

The audio workflow is progressive: start with what the video needs, source the assets, then build and sync the track.

## Audio intent questions

Ask these three questions upfront. Skip any whose answer is already clear from the user's input.

> 1. Will this video have a **voice-over**? (yes / no)
> 2. Will it have **sound effects**? (yes / no)
> 3. Will it have **background music**? (yes / no)

Based on answers, load only the relevant sub-references below.

## Routing

### Voice-over

If the user wants a voice-over, load [audio/voiceover.md](audio/voiceover.md). This covers:

- AI-generated (ElevenLabs) and manual (user-provided audio) flows
- Script writing, provider script transformation
- Voice selection and style intake
- Sync timing computation

### Sound effects

If the user wants sound effects, load [audio/sfx/sfx.md](audio/sfx/sfx.md). This covers:

- BYO (user-provided audio) and ElevenLabs (AI-generated) sourcing flows
- `sfx.ts` metadata authoring
- Per-asset approval UX (Approve / Discard and request changes)
- Integration into the audio plan as cues

SFX assets live in `audio/originals/sfx/<slug>/` and are referenced by cues in the audio plan.

### Background music

If the user wants background music, load [audio/music/music.md](audio/music/music.md). This covers:

- BYO (user-provided audio) and ElevenLabs (AI-generated) sourcing flows
- `music.ts` metadata authoring (rich free-text notes for BPM, key, mood, structure)
- Per-asset approval UX (Approve / Discard and request changes)
- Integration into the audio plan as cues with volume curves and ducking

Music assets live in `audio/originals/music/<slug>/` and are referenced by cues in the audio plan.

### Audio plan, build, and sync

If any audio is present (VO, SFX, or music), the audio plan/build/sync workflow applies:

1. **Audio plan** -- author `audio/audio_plan.md` describing the mix composition. See [audio/audio_plan.md](audio/audio_plan.md) for the format spec, [audio/cue_template.md](audio/cue_template.md) for the per-cue field template, and [audio/styles.md](audio/styles.md) for mix-level guidance.
2. **Build** -- render the plan into an audio track via ffmpeg. See [audio/build.md](audio/build.md). Uses recipes from [audio/ffmpeg_cookbook.md](audio/ffmpeg_cookbook.md).
3. **Sync** -- compute per-segment timing from the track. See [audio/sync.md](audio/sync.md).

For **VO-only videos** (no SFX, no music), the plan is minimal (single cue, full file, placed at 0s) and is auto-emitted during the voiceover flow. The user does not need to understand the plan format -- it is created transparently and consumed by build and sync.

For **multi-source mixes** (VO + SFX, VO + music, or all three), the plan is authored explicitly with per-cue volume curves, fades, and a full ffmpeg mix command.

## File layout

Each video has an `audio/` directory:

```
videos/<video-slug>/
  voiceover_script/
    script.md                          # assembled VO script
  audio/
    audio_plan.md                      # audio composition plan + log
    originals/                         # source files (immutable after use)
      voiceovers/
        v1/
          voiceover.ts
          audio.mp3
          timing.json
          provider_script.md
          generate.sh
      sfx/                             # slug-named subfolders
        keyboard_typing/
          audio.mp3
          sfx.ts
          generate.sh
      music/                           # slug-named subfolders
        uplift_piano/
          audio.mp3
          music.ts
          generate.sh
    tracks/                            # rendered audio tracks
      v1/
        track.ts                       # typed AudioTrack object
        track.mp3                      # rendered audio
        plan_snapshot.md               # point-in-time plan copy
```

### Active track

`timeline.ts` imports the active track via `default_audio_track`. The import is the single source of truth for which track is live. Switching tracks means updating the import.

```ts
import defaultAudioTrack from './audio/tracks/v1/track.js';

const timeline: Timeline = {
  // ...
  default_audio_track: defaultAudioTrack,
};
```

## CLI usage

```bash
# Use a specific audio track
npx videowright render --audio-track v1

# Suppress audio (use default_timing or segment advances)
npx videowright render --audio-track none

# No flag: use default_audio_track from timeline.ts if set
npx videowright render
```

## Timing precedence

1. **Active audio track's `timing`** -- via `--audio-track <id>` or `default_audio_track`
2. **`default_timing`** on `timeline.ts`
3. **`SegmentSpec.advances`** -- per-segment fallback

`--audio-track none` suppresses level 1 (audio tracks) but preserves levels 2 and 3.
