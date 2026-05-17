# Audio Plan

## Plan

Typing-SFX intro under the cold-open's keyboard animation, followed by full-file VO. The first 0.5s is silent (lead-in); typing SFX plays 0.5-3.5s; VO begins at 3.5s and runs to the end of the track.

### Cue 1 — Laptop typing SFX
Source: audio/originals/sfx/laptop_typing/
Slice: full file
Place at: 0.5
Volume: 70%
Fades: fade in 0.5-0.6s, fade out 3.4-3.5s
Notes: Synced with the cold-open typing animation. Visual typing in the segment starts at 0.5s and runs ~3s so keystrokes line up with the audio.

ffmpeg snippet:
```
[1:a] adelay=500|500,
      volume=0.7,
      afade=t=in:st=0.5:d=0.1,
      afade=t=out:st=3.4:d=0.1,
      asetpts=PTS-STARTPTS [sfx]
```

### Cue 2 — VO full narration
Source: audio/originals/voiceovers/v4/
Slice: full file
Place at: 3.5
Volume: 100%
Fades: none
Notes: Full narration by ElevenLabs (voice Asher). See timing.json for word-by-word timing. Delayed by 3.5s so the typing intro has space before VO begins.

ffmpeg snippet:
```
[0:a] adelay=3500|3500,
      asetpts=PTS-STARTPTS [vo]
```

### Final mix command

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v4/audio.mp3 \
  -i audio/originals/sfx/laptop_typing/audio.mp3 \
  -filter_complex "
    [0:a] adelay=3500|3500, asetpts=PTS-STARTPTS [vo];
    [1:a] adelay=500|500,
          volume=0.7,
          afade=t=in:st=0.5:d=0.1,
          afade=t=out:st=3.4:d=0.1,
          asetpts=PTS-STARTPTS [sfx];
    [vo][sfx] amix=inputs=2:duration=longest:normalize=0 [mix];
    [mix] loudnorm=I=-14:TP=-1:LRA=11 [out]
  " -map "[out]" -c:a libmp3lame -q:a 2 {TRACK_OUT}
```

