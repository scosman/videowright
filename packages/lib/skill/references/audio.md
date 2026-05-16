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

SFX sourcing will be available in a later phase.

### Background music

Music sourcing will be available in a later phase.

### Audio plan, build, and sync

The audio plan/build/sync workflow (authoring `audio_plan.md`, running ffmpeg to produce a track, syncing video timing to the track) will be available in a later phase. For VO-only videos, the track build is handled automatically during the voiceover flow.

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
      sfx/                             # slug-named subfolders (future)
      music/                           # slug-named subfolders (future)
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
