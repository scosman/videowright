# Audio Plan

## Plan

Round 2. The assembled narration from 0s (`audio/assemble.mjs`: the v2 one take with the voice beat's two takes placed in it, the Asher line loudness-matched). A low music bed: its build under the title and the four pairs, out for the voice beat, then its last stretch from after the voice beat so its own fade ends the video, lifted for the end hold. One soft whoosh under each Then -> Now sweep (five). Mastered with two passes to -14 LUFS, -1.5 dBTP.

Every time comes from `audio/cues.json` (`audio/sync.mjs`, from the assembled narration's word times), so a re-timed take needs no edit here: run `node audio/assemble.mjs && node audio/sync.mjs`, then build. Values below are the current ones.

### Cue 1 -- Narration (assembled)
Source: audio/originals/voiceovers/assembled/ (audio.wav, made by audio/assemble.mjs)
Slice: full file (70.25s, ending on the 5.0s end hold)
Place at: 0s
Volume: 100% (the Asher line inside it is +1.2 dB: -13.2 vs -13.3 LUFS for the two voice-beat lines in the master)
Fades: none
Notes: Mono, panned to both channels. Pieces: v2 0-37.97s (title to "timed to every word."), voice_then at 39.85s, voice_now at 45.41s, v2's CTA from 52.73s.

### Cue 2 -- Music bed, the build
Source: audio/originals/music/bed/
Slice: 0 to the voice beat's start + 0.3s (cues.music.outAt = 39.767s)
Place at: 0s
Volume: -21 dB (x0.0891)
Fades: fade out over the last 1.2s (gone 0.3s after the cut into the voice beat, 0.3s before the Asher line)

### Cue 3 -- Music bed, the close
Source: audio/originals/music/bed/
Slice: its last stretch ending at 146.33s (the start of its own fade), as long as the video has left after cues.music.inAt (0.3s after the voice beat's last word): now 127.81-146.33s
Place at: cues.music.inAt (51.730s)
Volume: -21 dB, ramping to -13 dB over 0.8s from 0.1s after the last word ("GitHub.", cues.lastWordEnd)
Fades: fade in 1.2s; fade out over the last 0.6s

### Cue 4 -- Sweep whoosh (x5)
Source: audio/originals/sfx/sweep_whoosh/
Slice: full file (peak at 0.375s)
Place at: each sweep (cues.sweeps) minus 0.075s: now 10.258, 18.559, 26.225, 35.508, 45.792s
Volume: 30%
Fades: none

### Final mix command

```bash
node audio/mix.mjs {TRACK_OUT}
```

`audio/mix.mjs` builds the ffmpeg graph above from `audio/cues.json`, then masters with demo_v2's two-pass recipe: a 4x-oversampled limiter set from the mix's measured loudness (so the linear gain leaves peaks near -2.8 dBFS before the MP3 encode), a loudnorm measurement, and one linear gain to -14 LUFS; it fails if loudnorm falls back to dynamic mode.

