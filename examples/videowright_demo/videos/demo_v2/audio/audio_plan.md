# Audio Plan

## Plan

Voiceover plus one typing SFX, no music. The cold open opens on keys: the prompt types for
0.66s before the voice starts, so the VO is placed at 0.6s. The typing SFX sits exactly under the
visual typing — burst 1 is the whole file, burst 2 adds a slice of the file's first run of keys,
and single keys mark the paste and the Enter — on the same schedule the cold open types with
(`components/v2/typing.ts`, `COLD_OPEN`). Mastered to -14 LUFS with a -1.5 dBTP ceiling (the
MP4's AAC encode adds about half a dB of true peak).

### Cue 1 -- Typing, bursts 1-2
Source: audio/originals/sfx/laptop_typing/
Slice: full file
Place at: 0.3s
Volume: 55%
Fades: fade in 0.30-0.31s, fade out 2.75-2.95s
Notes: Keys from 0.322s (first character) to 2.677s; the file's breath at 1.83-2.07s falls after "video,". The 10ms fade-in (under the usual 0.1s) keeps the first key, 22ms into the file; the file is silent from 2.45s, so the fade-out only closes the tail.

ffmpeg snippet:
[t1] volume=0.55, afade=t=in:st=0:d=0.01, afade=t=out:st=2.45:d=0.2, adelay=300:all=1 [sfx1]

### Cue 2 -- VO (full file)
Source: audio/originals/voiceovers/v1/
Slice: full file
Place at: 0.6s
Volume: 100%
Fades: none
Notes: ElevenLabs v4, Cosman-1. Word timings in audio/originals/voiceovers/v1/timing.json (track time = word time + 0.6s). First word "The" at 0.96s. Mono, panned to both channels at full level.

ffmpeg snippet:
[1:a] pan=stereo|c0=c0|c1=c0, adelay=600:all=1 [vo2]

### Cue 3 -- Typing, end of burst 2
Source: audio/originals/sfx/laptop_typing/
Slice: 0.33-1.06
Place at: 2.729s
Volume: 55%
Fades: fade in 2.729-2.739s, fade out 3.419-3.459s
Notes: Eight more keys (2.762-3.391s) for " the script:"; the last one is the colon.

ffmpeg snippet:
[t2] atrim=start=0.33:end=1.06, asetpts=PTS-STARTPTS, volume=0.55, afade=t=in:st=0:d=0.01, afade=t=out:st=0.69:d=0.04, adelay=2729:all=1 [sfx3]

### Cue 4 -- Paste key
Source: audio/originals/sfx/laptop_typing/
Slice: 0.41-0.52
Place at: 3.605s
Volume: 60%
Fades: fade in 3.605-3.610s, fade out 3.685-3.715s
Notes: One key (its onset at 3.62s) as the [Pasted 43 lines] chip lands.

ffmpeg snippet:
[t3] atrim=start=0.41:end=0.52, asetpts=PTS-STARTPTS, volume=0.6, afade=t=in:st=0:d=0.005, afade=t=out:st=0.08:d=0.03, adelay=3605:all=1 [sfx4]

### Cue 5 -- Enter key
Source: audio/originals/sfx/laptop_typing/
Slice: 1.925-2.06
Place at: 4.087s
Volume: 65%
Fades: fade in 4.087-4.092s, fade out 4.182-4.222s
Notes: The file's loudest key (onset at 4.10s) on Enter, when the prompt is submitted.

ffmpeg snippet:
[t4] atrim=start=1.925:end=2.06, asetpts=PTS-STARTPTS, volume=0.65, afade=t=in:st=0:d=0.005, afade=t=out:st=0.095:d=0.04, adelay=4087:all=1 [sfx5]

### Final mix command

```bash
ffmpeg -y \
  -i audio/originals/sfx/laptop_typing/audio.mp3 \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -filter_complex "
    [0:a] asplit=4 [t1][t2][t3][t4];
    [t1] volume=0.55, afade=t=in:st=0:d=0.01, afade=t=out:st=2.45:d=0.2, adelay=300:all=1 [sfx1];
    [1:a] pan=stereo|c0=c0|c1=c0, adelay=600:all=1 [vo2];
    [t2] atrim=start=0.33:end=1.06, asetpts=PTS-STARTPTS, volume=0.55, afade=t=in:st=0:d=0.01, afade=t=out:st=0.69:d=0.04, adelay=2729:all=1 [sfx3];
    [t3] atrim=start=0.41:end=0.52, asetpts=PTS-STARTPTS, volume=0.6, afade=t=in:st=0:d=0.005, afade=t=out:st=0.08:d=0.03, adelay=3605:all=1 [sfx4];
    [t4] atrim=start=1.925:end=2.06, asetpts=PTS-STARTPTS, volume=0.65, afade=t=in:st=0:d=0.005, afade=t=out:st=0.095:d=0.04, adelay=4087:all=1 [sfx5];
    [sfx1][vo2][sfx3][sfx4][sfx5] amix=inputs=5:duration=longest:normalize=0 [mix];
    [mix] loudnorm=I=-14:TP=-1.5:LRA=11 [out]
  " -map "[out]" -ar 44100 -c:a libmp3lame -q:a 2 {TRACK_OUT}
```

## Log

## 2026-11-01 -- Rebuilt v1 with a -1.5 dBTP ceiling, re-synced the title card
**Change:** loudnorm TP -1 -> -1.5 (the AAC encode in the MP4 measured -0.9 dBTP); the title card gains an advance on "web" and its exit moves to 0.15s before "That" (6.27 -> 6.37).
**Why:** design review (true peak) and code review (the 0.15s anchor rule). Not yet adopted by the user, so v1 was rebuilt in place. The final master (Phase 6) should use two-pass linear loudnorm: single-pass rides the gain over the first seconds.
**Render:** audio/tracks/v1/track.mp3

## 2026-11-01 -- Synced timing to v1
**Segments:** v2-cold-open, v2-title-card (the segments built so far)
**Total duration:** 63.40s (track); the timeline so far ends at 13.70s.

## 2026-11-01 -- Adopted v1 as active track

## 2026-11-01 -- Initial build (v1)
**Change:** initial plan: typing SFX under the cold open's prompt (two bursts, paste and Enter keys), the v1 VO take placed at 0.6s, loudnorm -14 LUFS.
**Why:** first render.
**Render:** audio/tracks/v1/track.mp3
