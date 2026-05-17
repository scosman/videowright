# Audio Plan

## Plan

Voice-over only. Single VO cue covering the full file, placed at the start of the track.

### Cue 1 — VO full narration
Source: audio/originals/voiceovers/v4/
Slice: full file
Place at: 0.0
Volume: 100%
Fades: none
Notes: Full narration by ElevenLabs (voice Asher). See timing.json for word-by-word timing.

ffmpeg snippet:
```
ffmpeg -i audio/originals/voiceovers/v4/audio.mp3 -c copy {TRACK_OUT}
```
