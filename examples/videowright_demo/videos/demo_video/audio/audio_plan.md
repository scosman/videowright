# Audio Plan

## Plan

Typing-SFX intro under the cold-open's keyboard animation, followed by full-file VO. The first 0.5s is silent (lead-in); typing SFX plays 0.5-2.0s (truncated to 1.5s); VO begins at 2.0s and runs to the end of the track.

### Cue 1 — Laptop typing SFX
Source: audio/originals/sfx/laptop_typing/
Slice: 0-1.5
Place at: 0.5
Volume: 70%
Fades: fade in 0.5-0.6s, fade out 1.9-2.0s
Notes: Truncated to 1.5s to reduce keystroke count. Synced with the cold-open typing animation (visual typing also runs 0.5-2.0s).

ffmpeg snippet:
```
[1:a] atrim=0:1.5, asetpts=PTS-STARTPTS,
      adelay=500|500,
      volume=0.7,
      afade=t=in:st=0.5:d=0.1,
      afade=t=out:st=1.9:d=0.1 [sfx]
```

### Cue 2 — VO full narration
Source: audio/originals/voiceovers/v4/
Slice: full file
Place at: 2.0
Volume: 100%
Fades: none
Notes: Full narration by ElevenLabs (voice Asher). See timing.json for word-by-word timing. Delayed by 2.0s so the typing intro has space before VO begins.

ffmpeg snippet:
```
[0:a] adelay=2000|2000 [vo]
```

### Final mix command

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v4/audio.mp3 \
  -i audio/originals/sfx/laptop_typing/audio.mp3 \
  -filter_complex "
    [0:a] adelay=2000|2000 [vo];
    [1:a] atrim=0:1.5, asetpts=PTS-STARTPTS,
          adelay=500|500,
          volume=0.7,
          afade=t=in:st=0.5:d=0.1,
          afade=t=out:st=1.9:d=0.1 [sfx];
    [vo][sfx] amix=inputs=2:duration=longest:normalize=0 [mix];
    [mix] loudnorm=I=-14:TP=-1:LRA=11 [out]
  " -map "[out]" -c:a libmp3lame -q:a 2 {TRACK_OUT}
```

## Log

## 2026-05-16 09:21 — Adopted v3 as active track

## 2026-05-16 09:20 — Rendered v3
**Change:** Truncated typing SFX to 1.5s (slice 0-1.5) and pulled VO start from 3.5s to 2.0s.
**Why:** User feedback — v2 had too many clicks per visual letter; intro felt too long.
**Render:** audio/tracks/v3/track.mp3 (64.18s, mastered to -14 LUFS)

## 2026-05-16 09:20 — Plan edit: truncate typing SFX to 1.5s
**Change:** Cue 1 Slice changed from `full file` to `0-1.5`; Cue 2 Place at changed from 3.5 to 2.0; final mix command updated to match.
**Why:** User asked to shorten the typing intro and reduce keystroke count.

## 2026-05-16 09:07 — Adopted v2 as active track

## 2026-05-16 09:06 — Rendered v2
**Change:** Built v2 from the typing-SFX + delayed-VO plan.
**Why:** New mix per the plan edit above.
**Render:** audio/tracks/v2/track.mp3 (65.68s, mastered to -14 LUFS)

## 2026-05-16 09:05 — Added typing SFX intro, delayed VO by 3.5s
**Change:** Added Cue 1 (laptop_typing SFX, 0.5-3.5s, 70% with 0.1s fades). Shifted VO cue from Place at: 0.0 to Place at: 3.5. Rewrote final mix command to mix VO + SFX with loudnorm mastering.
**Why:** User asked to extend the intro with a 3s typing SFX before VO comes in (500ms pre-roll, then 3s typing, then VO).

## 2026-05-16 00:00 — Initial VO-only track
**Change:** migrated from legacy voiceover layout to audio track
**Why:** audio-track migration (Phase 4)
**Render:** cp audio/originals/voiceovers/v4/audio.mp3 → audio/tracks/v1/track.mp3
