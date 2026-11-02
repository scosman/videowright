# Audio Plan

## Plan

Voiceover plus one typing SFX, no music. The cold open opens on keys: the prompt types for
0.66s before the voice starts, so the VO is placed at 0.6s. The typing SFX sits exactly under the
visual typing — burst 1 is the whole file, burst 2 adds a slice of the file's first run of keys,
and single keys mark the paste and the Enter — on the same schedule the cold open types with
(`components/v2/typing.ts`, `COLD_OPEN`). The VO file ends with the 5.0s end hold (its
`[[pause 5.0s]]` tail), so the track runs to the video's last frame. Mastered in two passes to
-14 LUFS integrated with one linear gain, under a -1.5 dBTP ceiling (a true-peak guard ahead of
the gain leaves room for the MP4's AAC encode, which adds about 0.4 dB).

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
Notes: ElevenLabs v4, Cosman-1. Word timings in audio/originals/voiceovers/v1/timing.json (track time = word time + 0.6s). First word "The" at 0.96s; last word "cold." ends at 64.96s, then the file's 5.0s tail (the end hold). Mono, panned to both channels at full level.

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

Two passes, so the master is one linear gain to -14 LUFS (single-pass loudnorm rides the gain
and lands short of the target). The unmastered mix first goes through a true-peak guard: a
limiter at -5.6 dBFS on the 4x-oversampled signal, so the linear gain (about +3.2 dB) leaves the
master near -2.2 dBTP, and the MP4's AAC encode (which adds about 0.4 dB) stays under -1.5 dBTP.
Then loudnorm measures it (pass 1) and applies the gain with the measured values and
`linear=true` (pass 2). The mix itself (cues, volumes, fades) is unchanged.

```bash
MIX="$(mktemp -d)/mix.wav"
# The mix, unmastered, with the true-peak guard.
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
    [mix] aresample=176400, alimiter=limit=0.525:level=disabled:attack=1:release=60, aresample=44100 [out]
  " -map "[out]" -c:a pcm_f32le "$MIX"
# Pass 1: measure.
M="$(ffmpeg -hide_banner -nostats -i "$MIX" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')"
m() { printf '%s' "$M" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
# Pass 2: one linear gain to -14 LUFS. loudnorm silently falls back to dynamic mode when the
# gain would break the ceiling, so the build fails unless it reports linear.
P2="$(ffmpeg -y -hide_banner -nostats -i "$MIX" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I=$(m input_i):measured_TP=$(m input_tp):measured_LRA=$(m input_lra):measured_thresh=$(m input_thresh):offset=$(m target_offset):print_format=json" \
  -ar 44100 -c:a libmp3lame -q:a 2 {TRACK_OUT} 2>&1)"
rm -rf "$(dirname "$MIX")"
printf '%s' "$P2" | grep -q '"normalization_type" : "linear"' || { echo "loudnorm fell back to dynamic mode" >&2; exit 1; }
```

## Log

## 2026-11-02 -- Synced timing to v1 (round 3), frame-exact
**Segments:** all eight.
**Total duration:** 69.98s (track); the video is 69.98s, 4,199 frames at 60fps, ending on the track's last frame.

## 2026-11-02 -- Lengthened five pauses (owner's request); rebuilt v1
**Change:** the cut's breath after "…a single prompt." 1.0 -> 1.5s, the gallery's tail 0.8 -> 1.8s, the live-dev hold 1.4 -> 1.9s, the export's tail 0.9 -> 1.6s, the agents beat's tail 1.1 -> 2.3s; `retime apply` on the same take; the mix and the two-pass master unchanged (pass 2 linear).
**Why:** the owner watched the round-2 cut and wanted these breaths.
**Render:** audio/tracks/v1/track.mp3 (69.98s; -14.0 LUFS integrated, -2.1 dBTP)

## 2026-11-02 -- Synced timing to v1 (re-timed take, round 2), frame-exact
**Segments:** all eight. The title card's second cue is now "video" (the tagline), the gallery drops its "Three.js" and "If" cues (send moves to "Videowright"), and the export drops "It's" (no hash section).
**Total duration:** 66.09s (track); the video is 66.08s, 3,965 frames at 60fps, ending on the track's last frame.

## 2026-11-02 -- Re-timed the take's pauses (round 2); rebuilt v1
**Change:** after the owner's removals: the title card's tail 1.2 -> 0.8s, the gallery's tail 1.2 -> 0.8s, the live-dev hold 1.8 -> 1.4s, the agents beat's tail 1.3 -> 1.1s; `retime apply` on the same take. The final mix command now uses a portable temp dir and fails the build unless pass 2 reports linear normalization (it did).
**Why:** the locks and annotations that those holds were sized for are gone; no beat now ends on a static hold.
**Render:** audio/tracks/v1/track.mp3 (66.09s; -14.0 LUFS integrated, -2.1 dBTP)

## 2026-11-01 -- Synced timing to v1 (re-timed take), frame-exact
**Segments:** all eight (v2-cold-open … v2-install-cta)
**Total duration:** 67.50s (track) = the video, 4,050 frames at 60fps. Every cued advance fires on the frame 9 frames (0.150s) before its word's frame (specs/projects/demo_v2/tools/sync_advances.mjs); the final advance is the track's last frame, 5.0s after "cold.".

## 2026-11-01 -- Re-timed the take's pauses; rebuilt v1 with a two-pass master
**Change:** pauses in voiceovers/v1/provider_script.md re-tuned to the built animation and `retime apply` re-run on the same raw take (live-dev hold 2.2 -> 1.8s, export tail 1.2 -> 0.9s, agents tail 1.0 -> 1.3s for the match cut, the end hold 0.5 -> 5.0s in the file itself; a marker after "agent," was refused: 0.18s of natural silence). The final mix command now masters in two passes: a true-peak guard (limiter at -5.6 dBFS, 4x oversampled), a loudnorm measurement, then one linear gain. The mix (cues, volumes, fades) is unchanged.
**Why:** Phase 6: the pauses fit the animation as built; the track holds the end hold, so nothing is padded at render; single-pass loudnorm rode the gain and landed at -14.6 LUFS. Not yet adopted by the user, so v1 was rebuilt in place.
**Render:** audio/tracks/v1/track.mp3 (67.50s; -14.0 LUFS integrated, -2.1 dBTP)

## 2026-11-01 -- Synced timing for the remaining beats (v1)
**Segments:** v2-pixel-perfect-export, v2-voiceover-sync, v2-any-coding-agent, v2-install-cta (the full 8-segment timeline)
**Total duration:** 63.40s (track); the timeline ends at 67.858s, 5.0s after the last VO word ("cold." ends at 62.858s track), and the render pads the track's tail with silence. Every cued advance sits 0.150s before its word; the track is unchanged (no rebuild).

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
