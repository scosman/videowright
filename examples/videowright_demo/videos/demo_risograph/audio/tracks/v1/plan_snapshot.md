# Audio Plan

## Plan

Voice-over only. Single VO cue covering the full file, placed at the start of the track.

### Cue 1 — VO full narration
Source: audio/originals/voiceovers/v2/
Slice: full file
Place at: 0.0
Volume: 100%
Fades: none
Notes: Shared VO from demo_video/voiceovers/v2, remapped to rs-* segment IDs. See timing.json for word-by-word timing.

ffmpeg snippet:
```
ffmpeg -i audio/originals/voiceovers/v2/audio.mp3 -c copy {TRACK_OUT}
```
