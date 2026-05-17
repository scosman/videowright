# ffmpeg Cookbook

## When this is loaded

You are building or editing an audio plan and need ffmpeg filter recipes. This is a reference of copy-pasteable ffmpeg patterns for common audio operations.

All examples assume audio inputs. Adjust input indices (`[0:a]`, `[1:a]`, ...) to match your `-i` order.

## Trim and place a clip at a time offset

Extract a slice of audio and place it at a specific point in the output track.

```
[0:a] atrim=start=1.2:end=5.6, asetpts=PTS-STARTPTS, adelay=3400|3400 [out]
```

- `atrim=start=1.2:end=5.6` -- extract seconds 1.2 to 5.6 from the source
- `asetpts=PTS-STARTPTS` -- reset timestamps to start at 0 (required after trim)
- `adelay=3400|3400` -- delay by 3400ms (place at 3.4s in track). The `|`-separated format repeats the delay per channel. For any number of channels, use `adelay=3400:all=1` (ffmpeg 4.4+).

For a full file placed at an offset (no trim):

```
[0:a] adelay=5000|5000 [out]
```

For a full file placed at 0s (passthrough):

```
[0:a] acopy [out]
```

## Constant volume scaling

Scale volume by a fixed factor:

```
[0:a] volume=0.5 [out]       # 50% volume
[0:a] volume=0.15 [out]      # 15% volume
[0:a] volume=1.5 [out]       # 150% volume (boost)
[0:a] volume=-6dB [out]      # -6 dB attenuation
```

## Time-varying volume (ducking)

### Simple duck: quiet during a time range

```
[0:a] volume='if(between(t,4.5,22),0.15,1)':eval=frame [out]
```

This sets volume to 15% between 4.5s and 22s, 100% elsewhere. The transition is instantaneous -- for smooth ramps, use the ramped version below.

### Ramped duck: smooth transitions

```
[0:a] volume='if(lt(t,4.5),1, if(between(t,4.5,4.7),1-0.85*(t-4.5)/0.2, if(between(t,4.7,22),0.15, if(between(t,22,22.2),0.15+0.85*(t-22)/0.2, 1))))':eval=frame [out]
```

Breakdown:
- Before 4.5s: volume = 1.0
- 4.5s to 4.7s: linear ramp from 1.0 down to 0.15 (over 0.2s)
- 4.7s to 22.0s: volume = 0.15
- 22.0s to 22.2s: linear ramp from 0.15 back to 1.0 (over 0.2s)
- After 22.2s: volume = 1.0

### Multiple duck zones

For ducking under multiple VO segments, chain conditions:

```
volume='if(between(t,4.5,12),0.15, if(between(t,18,25),0.15, 1))':eval=frame
```

Add ramps at each transition for smoothness. See [styles.md](styles.md) for recommended ramp durations (~0.2s).

### Expression syntax notes

- `eval=frame` is required for time-varying expressions (evaluates per audio frame, not once).
- `t` is the timestamp in seconds within the filtered stream.
- `between(t,a,b)` returns 1 if `a <= t <= b`, else 0.
- `lt(t,a)` returns 1 if `t < a`.
- `gt(t,a)` returns 1 if `t > a`.
- Arithmetic operators: `+`, `-`, `*`, `/`.
- Nest `if()` calls for multi-range curves.

## Fade in / fade out

```
[0:a] afade=t=in:st=0:d=0.5 [out]           # fade in over 0.5s starting at 0s
[0:a] afade=t=out:st=28:d=2 [out]            # fade out over 2s starting at 28s
```

Combine both:

```
[0:a] afade=t=in:st=0:d=0.5, afade=t=out:st=28:d=2 [out]
```

Parameters:
- `t=in` or `t=out` -- fade type
- `st` -- start time in seconds (within the stream, after any trim/delay)
- `d` -- duration of the fade in seconds

### Fade curves

Default is linear. For smoother curves:

```
afade=t=in:st=0:d=0.5:curve=tri    # triangular
afade=t=in:st=0:d=0.5:curve=qsin   # quarter sine (smooth)
afade=t=in:st=0:d=0.5:curve=esin   # exponential sine
afade=t=in:st=0:d=0.5:curve=log    # logarithmic
```

For most video audio, the default linear fade is fine. Use `curve=qsin` when a smoother onset is desired.

## Crossfade between two clips

```
[0:a][1:a] acrossfade=d=1:c1=tri:c2=tri [out]
```

- `d=1` -- crossfade duration of 1 second
- `c1`, `c2` -- fade curves for the outgoing and incoming clips

The crossfade overlaps the end of clip 0 with the start of clip 1. The output duration is `len(clip0) + len(clip1) - d`.

This is useful for music transitions but rarely needed for VO or SFX.

## Loop a clip to fill a duration

Loop a short clip to fill a longer time span:

```
[0:a] aloop=loop=-1:size=2000000, atrim=0:28, asetpts=PTS-STARTPTS [out]
```

- `loop=-1` -- loop infinitely
- `size=N` -- loop region size in samples. ffmpeg accepts expressions, so `size=44100*3` works directly in the filter graph (evaluates to 132300 samples = 3s at 44.1 kHz). Set this to at least the source file's total sample count to loop the entire file.
- `atrim=0:28` -- trim the looped result to 28 seconds
- `asetpts=PTS-STARTPTS` -- reset timestamps

**Tip:** If you do not know the exact sample count, set `size` to a value larger than any plausible source (e.g., `size=2000000` covers ~45s at 44.1 kHz). ffmpeg loops at most the available samples, so an oversized value loops the full file. Use `ffprobe` to get the exact sample rate and duration if precision matters (see "Probe sample rate and channels" below).

For seamless loops, the source audio should be designed to loop cleanly (no click at the boundary). If there is a click, add a very short crossfade or fade at the loop point.

## Mix N streams

### amix (additive mixing)

```
[vo1][sfx1][music1] amix=inputs=3:duration=longest:normalize=0 [out]
```

- `inputs=3` -- number of input streams
- `duration=longest` -- output duration matches the longest input. Alternatives: `shortest`, `first`.
- `normalize=0` -- **important**: disables automatic per-stream normalization. Without this, amix scales each input down by 1/N, making everything quiet. Set `normalize=0` and control volume on each stream individually before mixing.

### amerge (interleave channels)

```
[0:a][1:a] amerge=inputs=2 [out]
```

`amerge` interleaves channels (e.g., two mono streams into one stereo stream). For summing audio signals (layering VO + music), use `amix`, not `amerge`.

## Final master with loudness normalization

Apply EBU R128 loudness normalization as the last step in the filter chain:

```
[mix] loudnorm=I=-14:TP=-1:LRA=11 [out]
```

- `I=-14` -- integrated loudness target: -14 LUFS (good for web/social media delivery)
- `TP=-1` -- true peak maximum: -1 dBTP (prevents clipping)
- `LRA=11` -- loudness range target: 11 LU

Apply `loudnorm` after all mixing and volume adjustments. It is the very last filter before output.

### When to use loudnorm

- **Multi-source mixes** (VO + SFX + music): always. Different sources have different levels.
- **VO-only tracks**: optional. The VO is already at a consistent level from the TTS provider. Including loudnorm is fine but not required.

### Two-pass loudnorm (higher quality)

For critical masters, run loudnorm in two-pass mode:

Pass 1 (measure):
```bash
ffmpeg -i input.mp3 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null /dev/null
```

This prints measured loudness values. Extract `input_i`, `input_tp`, `input_lra`, `input_thresh`, `target_offset`.

Pass 2 (apply with measured values):
```bash
ffmpeg -i input.mp3 -af loudnorm=I=-14:TP=-1:LRA=11:measured_I=-18.5:measured_TP=-2.3:measured_LRA=8.2:measured_thresh=-28.5:offset=-0.5:linear=true [out]
```

For most video audio, single-pass loudnorm is sufficient.

## Measure audio duration (ffprobe)

Get the duration of an audio file in seconds:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 audio.mp3
```

This outputs a single number like `28.742000`. Use this when writing `length_s` in `track.ts`.

## Probe sample rate and channels

```bash
ffprobe -v error -show_entries stream=sample_rate,channels -of default=noprint_wrappers=1 audio.mp3
```

Useful for computing the `size` parameter in `aloop`.

## Complete single-command examples

### VO-only (passthrough)

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -c:a libmp3lame -q:a 2 \
  {TRACK_OUT}
```

### VO + music with ducking

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -i audio/originals/music/uplift_piano/audio.mp3 \
  -filter_complex "
    [0:a] acopy [vo];
    [1:a] atrim=0:30, asetpts=PTS-STARTPTS,
          volume='if(between(t,4.7,22),0.15, if(between(t,4.5,4.7),1-0.85*(t-4.5)/0.2, if(between(t,22,22.2),0.15+0.85*(t-22)/0.2,1)))':eval=frame,
          afade=t=in:st=0:d=0.5, afade=t=out:st=28:d=2 [music];
    [vo][music] amix=inputs=2:duration=longest:normalize=0 [mix];
    [mix] loudnorm=I=-14:TP=-1:LRA=11 [out]
  " -map "[out]" -c:a libmp3lame -q:a 2 {TRACK_OUT}
```

### VO + SFX + music (full mix)

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -i audio/originals/sfx/keyboard_typing/audio.mp3 \
  -i audio/originals/music/uplift_piano/audio.mp3 \
  -filter_complex "
    [0:a] acopy [vo];
    [1:a] volume=0.6, afade=t=in:st=0:d=0.2, afade=t=out:st=5.8:d=0.2,
          adelay=8200|8200 [sfx];
    [2:a] atrim=0:30, asetpts=PTS-STARTPTS,
          volume='if(between(t,4.7,22),0.15,1)':eval=frame,
          afade=t=in:st=0:d=0.5, afade=t=out:st=28:d=2 [music];
    [vo][sfx][music] amix=inputs=3:duration=longest:normalize=0 [mix];
    [mix] loudnorm=I=-14:TP=-1:LRA=11 [out]
  " -map "[out]" -c:a libmp3lame -q:a 2 {TRACK_OUT}
```
