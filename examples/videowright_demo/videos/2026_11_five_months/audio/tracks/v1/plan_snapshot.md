# Audio Plan

## Plan

The Cosman-1 narration (v4) from 0s, carrying the whole video. The voice beat's "Then" line (Asher, v2) sits in the narration's 9.0s gap after "timed to every word.", raised 5.3 dB so both voices are compared at the same loudness. A low music bed: its build under the title and the four pairs, out entirely for the voice beat, then its last stretch under the CTA so the outro and natural fade land on the end hold. One soft whoosh under each Then -> Now beam (five). Mastered with two passes to -14 LUFS, -1.5 dBTP.

Times below are track times (the narration is placed at 0s, so a word's time in `voiceovers/v1/timing.json` is its track time). Each beam's cue is 0.15s before its "Now" word (and before "This" in the voice beat).

### Cue 1 -- Narration (Cosman-1, v4)
Source: audio/originals/voiceovers/v1/
Slice: full file (73.33s, ending on the 5.0s end hold)
Place at: 0s
Volume: 100%
Fades: none
Notes: Mono, panned to both channels. Lines: title 0.69-6.14; pair 1 7.39-12.79; pair 2 15.59-23.45; pair 3 24.98-33.11; pair 4 34.68-39.95; voice beat Now 49.03-54.27; CTA 55.87-68.29.

ffmpeg snippet:
```
[0:a] pan=stereo|c0=c0|c1=c0 [vo]
```

### Cue 2 -- Voice beat "Then" line (Asher, v2)
Source: audio/originals/voiceovers/then_asher_v2/
Slice: full file (5.54s; words 0.12-5.24s)
Place at: 42.60s (words 42.72-47.84s; the narration's gap is 39.95-49.03s)
Volume: +5.3 dB (x1.841): loudness-matched to the line it is compared with. Whole-file integrated (-23.3 vs -19.9 LUFS) gave +3.4 dB, but the excited Cosman-1 line runs ~1.9 LU above the narration's average, so the A/B windows are matched instead (both measured in the master).
Fades: none
Notes: After the narration-sync pair's Now clip holds (beam 37.70, cut ~41.6) and the "Sound on" chip (~41.6-42.6). The voice beat's beam at 48.88 hands over to Cosman-1 at 49.03.

ffmpeg snippet:
```
[1:a] pan=stereo|c0=c0|c1=c0, volume=1.841, adelay=42600:all=1 [asher]
```

### Cue 3 -- Music bed, the build
Source: audio/originals/music/bed/
Slice: 0-42.3s
Place at: 0s
Volume: -21 dB (x0.0891) under the narration (the plateau sits about 14 LU under the voice)
Fades: fade out 41.1-42.3s (over the cut into the voice beat; silent before the Asher line)
Notes: The music's own build (silent start, rising to its plateau by ~25s) carries the title and the first pairs.

ffmpeg snippet:
```
[2:a] atrim=0:42.3, asetpts=PTS-STARTPTS, volume=0.0891, afade=t=out:st=41.1:d=1.2 [m1]
```

### Cue 4 -- Music bed, the close
Source: audio/originals/music/bed/
Slice: 127.6-146.33s (18.73s)
Place at: 54.60s (ends at 73.33s, the end of the narration file)
Volume: -21 dB (x0.0891) under the CTA, ramping to -13 dB (x0.2239) over 68.4-69.2s, after "GitHub." (ends 68.29s)
Fades: fade in 54.6-55.8s (after "excited." ends 54.27s); fade out over the last 0.6s
Notes: The music's softer outro (its 135-143s) arrives mid-CTA (track ~62s) and its natural fade (its 144s on) starts at track ~71s, so the end hold rests on the outro and the music ends with the video.

ffmpeg snippet:
```
[3:a] atrim=start=127.6:end=146.33, asetpts=PTS-STARTPTS,
      volume='if(lt(t,13.8),0.0891,if(lt(t,14.6),0.0891+0.1348*(t-13.8)/0.8,0.2239))':eval=frame,
      afade=t=in:st=0:d=1.2, afade=t=out:st=18.13:d=0.6, adelay=54600:all=1 [m2]
```

### Cue 5 -- Sweep whoosh (x5)
Source: audio/originals/sfx/sweep_whoosh/
Slice: full file (1.51s; peak at 0.35-0.40s)
Place at: 10.625s, 18.165s, 28.325s, 37.625s, 48.805s (each 0.075s before its beam's cue, so the peak lands mid-sweep)
Volume: 30% (about -10.5 dB): barely there, under the voice
Fades: none (the file starts and ends in silence)
Notes: Beams at 10.70 (pair 1), 18.24 (pair 2), 28.40 (pair 3), 37.70 (pair 4), 48.88 (voice beat).

ffmpeg snippet:
```
[4:a] aresample=44100, volume=0.3, asplit=5 [w1][w2][w3][w4][w5];
[w1] adelay=10625:all=1 [s1]; [w2] adelay=18165:all=1 [s2]; [w3] adelay=28325:all=1 [s3];
[w4] adelay=37625:all=1 [s4]; [w5] adelay=48805:all=1 [s5]
```

### Final mix command

Two passes, so the master is one linear gain to -14 LUFS (demo_v2's recipe). The unmastered mix goes through a true-peak guard first: a limiter on the 4x-oversampled signal, set from the mix's measured loudness so that the linear gain leaves the master's peaks near -2.8 dBFS before the MP3 encode (which overshoots ~0.5 dB), so the track and the MP4's AAC stay under -1.5 dBTP. Then loudnorm measures it (pass 1) and applies the gain with `linear=true` (pass 2); the build fails if loudnorm falls back to dynamic mode.

```bash
set -euo pipefail
TMP="$(mktemp -d)"
RAW="$TMP/raw.wav"; MIX="$TMP/mix.wav"
# The mix, unmastered.
ffmpeg -y -hide_banner -loglevel error \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -i audio/originals/voiceovers/then_asher_v2/audio.mp3 \
  -i audio/originals/music/bed/audio.mp3 \
  -i audio/originals/music/bed/audio.mp3 \
  -i audio/originals/sfx/sweep_whoosh/audio.mp3 \
  -filter_complex "
    [0:a] pan=stereo|c0=c0|c1=c0 [vo];
    [1:a] pan=stereo|c0=c0|c1=c0, volume=1.841, adelay=42600:all=1 [asher];
    [2:a] atrim=0:42.3, asetpts=PTS-STARTPTS, volume=0.0891, afade=t=out:st=41.1:d=1.2 [m1];
    [3:a] atrim=start=127.6:end=146.33, asetpts=PTS-STARTPTS,
          volume='if(lt(t,13.8),0.0891,if(lt(t,14.6),0.0891+0.1348*(t-13.8)/0.8,0.2239))':eval=frame,
          afade=t=in:st=0:d=1.2, afade=t=out:st=18.13:d=0.6, adelay=54600:all=1 [m2];
    [4:a] aresample=44100, volume=0.3, asplit=5 [w1][w2][w3][w4][w5];
    [w1] adelay=10625:all=1 [s1]; [w2] adelay=18165:all=1 [s2]; [w3] adelay=28325:all=1 [s3];
    [w4] adelay=37625:all=1 [s4]; [w5] adelay=48805:all=1 [s5];
    [vo][asher][m1][m2][s1][s2][s3][s4][s5] amix=inputs=9:duration=longest:normalize=0,
      atrim=0:73.33 [out]
  " -map "[out]" -ar 44100 -c:a pcm_f32le "$RAW"
# True-peak guard: limit so that the gain to -14 LUFS leaves peaks at about -2.8 dBFS (the MP3 encode overshoots ~0.5 dB).
I0="$(ffmpeg -hide_banner -nostats -i "$RAW" -af ebur128 -f null - 2>&1 | sed -n 's/^ *I: *\(-\{0,1\}[0-9.]*\) LUFS/\1/p' | tail -1)"
LIMIT="$(awk -v i="$I0" 'BEGIN { g = -14 - i; printf "%.4f", 10 ^ ((-2.8 - g) / 20) }')"
ffmpeg -y -hide_banner -loglevel error -i "$RAW" \
  -af "aresample=176400, alimiter=limit=$LIMIT:level=disabled:attack=1:release=60, aresample=44100" \
  -c:a pcm_f32le "$MIX"
# Pass 1: measure.
M="$(ffmpeg -hide_banner -nostats -i "$MIX" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')"
m() { printf '%s' "$M" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
# Pass 2: one linear gain to -14 LUFS.
P2="$(ffmpeg -y -hide_banner -nostats -i "$MIX" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I=$(m input_i):measured_TP=$(m input_tp):measured_LRA=$(m input_lra):measured_thresh=$(m input_thresh):offset=$(m target_offset):print_format=json" \
  -ar 44100 -c:a libmp3lame -q:a 2 {TRACK_OUT} 2>&1)"
rm -rf "$TMP"
printf '%s' "$P2" | grep -q '"normalization_type" : "linear"' || { echo "loudnorm fell back to dynamic mode" >&2; exit 1; }
echo "unmastered I=$I0 LUFS, limiter=$LIMIT"
```

