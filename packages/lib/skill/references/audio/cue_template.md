# Cue Template

## When this is loaded

You are authoring or editing cues in an `audio_plan.md` file. This reference defines the per-cue labeled-field format and the ffmpeg snippet convention.

## Cue format

Each cue is a markdown H3 heading followed by labeled fields and an ffmpeg snippet:

```
### Cue N -- <short name>
Source: <relative path to originals folder>
Slice: <start>-<end> in source  (or "full file")
Place at: <start> in track
Volume: <prose curve>
Fades: <fade description>
Notes: <optional context>

ffmpeg snippet:
<filter graph fragment that produces a labeled stream>
```

### Field reference

| Field | Required | Description |
|---|---|---|
| **Source** | Yes | Relative path from the video folder to the originals subfolder. E.g., `audio/originals/voiceovers/v1/` or `audio/originals/sfx/keyboard_typing/`. Points at the folder, not the audio file -- the build step knows to use `audio.mp3` (or `audio.wav`) within. |
| **Slice** | Yes | Time range within the source file. Either `full file` or `<start>-<end>` in seconds (e.g., `1.2-5.6`). Start and end are timestamps in the source audio, not the output track. |
| **Place at** | Yes | Where this cue starts in the output track, in seconds (e.g., `3.4s` or `0s`). |
| **Volume** | Yes | Volume curve for this cue. Can be a simple constant (`100%`, `15%`) or a prose description of changes over time. See volume curves below. |
| **Fades** | Yes | Fade descriptions. Either `none` or a comma-separated list like `fade in 0-0.2s, fade out 7.4-7.6s`. Times are relative to the cue's placement in the track. |
| **Notes** | No | Free-text context about what this cue does musically or narratively. Also used by the sync stage as anchor hints for SFX/music timing. |

### ffmpeg snippet

Each cue ends with a labeled ffmpeg filter graph fragment. The snippet:

- Takes one input stream (referenced by input index, e.g., `[0:a]`, `[1:a]`)
- Applies trim, delay, volume, and fade filters
- Produces a single labeled output stream (e.g., `[vo1]`, `[sfx1]`, `[music1]`)

The final mix command in the audio plan chains all these labeled streams together.

## Volume curves

Volume is expressed as prose that maps directly to ffmpeg volume expressions. The Volume field is the human-readable version; the ffmpeg snippet is the machine-executable version.

### Constant volume

```
Volume: 100%
Volume: 15%
Volume: -6dB
```

### Time-varying volume (ducking)

```
Volume: 100% from 0s, ramps to 15% over 4.5-4.7s, holds 15% until 22.0s, ramps to 100% over 22.0-22.2s
```

This describes ducking under a voiceover that runs from 4.5s to 22.0s. The ffmpeg implementation uses a `volume` expression with `if(between(...))` or a sidechain compressor -- either is acceptable as long as the snippet matches the described curve.

### Why prose, not raw ffmpeg

The Volume field is prose because:

1. It is auditable -- anyone reading the plan sees the actual level changes.
2. It is feedback-friendly -- "make cue 3 a bit quieter" maps to a Volume field edit.
3. The ffmpeg snippet below it is the implementation -- the Volume field is the intent.

## Voiceover cues

### Single VO, full file

```
### Cue 1 -- VO (full file)
Source: audio/originals/voiceovers/v1/
Slice: full file
Place at: 0s
Volume: 100%
Fades: none
Notes: Full voiceover, see timing.json for word timings.

ffmpeg snippet:
[0:a] acopy [vo1]
```

### VO slice

A single VO file can supply multiple cues. Each specifies a slice of the source and a placement in the track.

```
### Cue 2 -- VO catchphrase
Source: audio/originals/voiceovers/v3/
Slice: 1.2-2.4
Place at: 3.4s
Volume: 100%
Fades: none
Notes: VO says "How now brown cow"

ffmpeg snippet:
[0:a] atrim=start=1.2:end=2.4, asetpts=PTS-STARTPTS, adelay=3400|3400 [vo2]
(adelay: repeat the delay value per channel with `|`, or use `adelay=3400:all=1` to apply to all channels — ffmpeg 4.4+)
```

```
### Cue 5 -- VO outro
Source: audio/originals/voiceovers/v3/
Slice: full file
Place at: 9.4s
Volume: 100%
Fades: none
Notes: See word-by-word timing in audio/originals/voiceovers/v3/timing.json

ffmpeg snippet:
[0:a] adelay=9400|9400 [vo5]
```

Both inline text in Notes and pointers to timing.json are fine. Inline text is convenient for short slices; for long VOs, pointing at timing.json keeps the plan readable.

## SFX cues

```
### Cue 3 -- Keyboard typing
Source: audio/originals/sfx/keyboard_typing/
Slice: full file
Place at: 8.2s
Volume: 60%
Fades: fade in 8.2-8.4s, fade out 14.0-14.2s
Notes: Typing SFX under the terminal demo segment. Punchy entry, gentle fade.

ffmpeg snippet:
[2:a] volume=0.6, afade=t=in:st=0:d=0.2, afade=t=out:st=5.8:d=0.2, adelay=8200|8200 [sfx3]
```

**Note on Fades vs ffmpeg times:** The Fades field uses **track-absolute** times for human readability (e.g., `fade in 8.2-8.4s` means "at 8.2s in the track"). The ffmpeg snippet uses **stream-relative** times (e.g., `afade=t=in:st=0:d=0.2` means "0s into this stream's audio, which starts at 8.2s in the track due to `adelay`"). The Fades field is the intent; the snippet is the implementation.

## Music cues

```
### Cue 4 -- Background music
Source: audio/originals/music/uplift_piano/
Slice: 0-30
Place at: 0s
Volume: 100% from 0s, ramps to 15% over 4.5-4.7s, holds 15% until 22.0s, ramps to 100% over 22.0-22.2s
Fades: fade in 0-0.5s, fade out 28.0-30.0s
Notes: Music bed. Ducked under VO (4.5-22s). Beat drop at 5.3s aligns with feature reveal.

ffmpeg snippet:
[3:a] atrim=0:30, asetpts=PTS-STARTPTS,
      volume='if(between(t,4.7,22),0.15, if(between(t,4.5,4.7),1-0.85*(t-4.5)/0.2, if(between(t,22,22.2),0.15+0.85*(t-22)/0.2,1)))':eval=frame,
      afade=t=in:st=0:d=0.5, afade=t=out:st=28:d=2 [music4]
```

### Ducking

Ducking is expressed as a volume curve on the music (or ambient) cue -- not as a separate "duck" primitive. The Volume field describes the level changes in prose. The ffmpeg snippet implements it.

This keeps the plan auditable: anyone reading it sees the actual level changes. See [styles.md](styles.md) for ducking ramp guidance.

## Looped cues

For a short SFX or music clip that needs to fill a longer duration:

```
### Cue 6 -- Ambient hum (looped)
Source: audio/originals/sfx/server_hum/
Slice: full file
Place at: 0s
Volume: 20%
Fades: fade in 0-1s, fade out 25-28s
Notes: Looped to 28s. Low ambient texture under the entire video.

ffmpeg snippet:
[4:a] aloop=loop=-1:size=44100*3, atrim=0:28, asetpts=PTS-STARTPTS,
      volume=0.2, afade=t=in:st=0:d=1, afade=t=out:st=25:d=3 [sfx6]
```

See [ffmpeg_cookbook.md](ffmpeg_cookbook.md) for loop recipes.

## Final mix command structure

The final mix command references all input files and chains the per-cue labeled streams:

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -i audio/originals/sfx/keyboard_typing/audio.mp3 \
  -i audio/originals/music/uplift_piano/audio.mp3 \
  -filter_complex "
    [0:a] acopy [vo1];
    [1:a] volume=0.6, afade=t=in:st=0:d=0.2, afade=t=out:st=5.8:d=0.2, adelay=8200|8200 [sfx3];
    [2:a] atrim=0:30, asetpts=PTS-STARTPTS,
          volume='...' [music4];
    [vo1][sfx3][music4] amix=inputs=3:duration=longest:normalize=0 [mix];
    [mix] loudnorm=I=-14:TP=-1:LRA=11 [out]
  " -map "[out]" -c:a libmp3lame -q:a 2 {TRACK_OUT}
```

Key conventions:

- Input order matches the order inputs appear in the cue list.
- Each cue's snippet produces a named stream.
- All named streams feed into `amix` (or `amerge` for stereo mixing).
- `normalize=0` on amix prevents automatic normalization (the `loudnorm` filter handles it).
- The `loudnorm` filter at the end targets -14 LUFS (see [styles.md](styles.md)).
- Output codec is `libmp3lame -q:a 2` for mp3, or `pcm_s16le` for wav.

## Input index mapping

When the same source file appears in multiple cues, it needs only one `-i` input. Cue snippets reference the correct input index:

- Input 0: first `-i` file
- Input 1: second `-i` file
- etc.

If two cues use the same VO file with different slices, they share the input index but apply different `atrim` filters.
