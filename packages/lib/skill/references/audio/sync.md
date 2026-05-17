# Sync Video to Audio Track

## When this is loaded

An audio track has been built and approved, and you need to compute per-segment timing that syncs the video to the audio. This reference extends the VO-level sync algorithm in [voiceover/sync_algorithm.md](voiceover/sync_algorithm.md) to handle multi-source audio tracks (VO + SFX + music). For VO-only tracks, the VO-only shortcut at the bottom of this file applies -- it delegates to the existing sync algorithm unchanged.

## Overview

The sync stage reads the approved track's `plan_snapshot.md` and the source VO `timing.json` files to compute a `Timing` object. This `Timing` is written into the track's `track.ts` and drives segment advance timing during playback and render.

The procedure is an agent reasoning step, not a deterministic function. You read structured data, apply mapping rules, and produce timing values that align visual beats to audio events.

## Inputs

1. **Plan snapshot**: `audio/tracks/vN/plan_snapshot.md` from the active track. Contains all cues with their Source, Slice, Place at, and Notes fields.
2. **Per-segment script**: from `PLAN.md` (the `## Script` section with subsections per segment id).
3. **VO timing data**: `timing.json` from each VO source referenced by cues in the snapshot. Located at `audio/originals/voiceovers/<slug>/timing.json`.
4. **Segment ids**: in timeline order, plus each segment's `advances` array length (tells you how many advances each segment needs).

## Output

An updated `timing` field in `audio/tracks/vN/track.ts`:

```ts
timing: {
  perSegment: {
    'intro':          [4.2],
    'feature-cards':  [2.1, 5.8, 9.3, 12.0],
    'outro':          [3.5],
  },
},
```

Each value array has the same length as the segment's `advances` array. Values are segment-relative seconds (time since the segment started playing, not since the audio started).

## The sync procedure

### Step 1: Parse VO cues from the snapshot

Read the plan snapshot. For each cue whose `Source:` points at `audio/originals/voiceovers/...`, extract:

- **Source path**: which VO folder
- **Slice**: `full file` or `<start>-<end>` (seconds within the source)
- **Place at**: where the cue starts in the track (seconds)
- **Notes**: any inline text about what the VO says

### Step 2: Load VO timing data

For each unique VO source referenced by a cue, load `timing.json` from that source folder:

```json
{
  "words": [
    { "word": "Welcome", "start": 0.0, "end": 0.45 },
    { "word": "to", "start": 0.47, "end": 0.55 },
    ...
  ]
}
```

Timestamps in timing.json are seconds from the start of the VO audio file.

### Step 3: Map VO word times to track times

For each VO cue with `Slice: a-b` (or `full file`, where a=0 and b=file length) and `Place at: p`:

> **Effective track time** of a word originally at source time `w`:
> `track_time = p + (w - a)`, valid only when `a <= w <= b`.

Words outside the slice range are excluded from this cue's mapping. If a word appears in multiple cues (overlapping slices from the same VO), it has multiple effective track times -- this is rare but valid.

Example:
- VO cue: `Slice: 1.2-5.6`, `Place at: 3.4`
- Word at source time 2.0s: `track_time = 3.4 + (2.0 - 1.2) = 4.2s`
- Word at source time 5.0s: `track_time = 3.4 + (5.0 - 1.2) = 7.2s`
- Word at source time 0.5s: excluded (outside slice range)

### Step 4: Map script text to timing words

Walk through the per-segment script from PLAN.md. For each segment's script section, find the corresponding words in the timing data by text matching.

- Match is case-insensitive and ignores punctuation.
- Provider timing may include words from pause markers or SSML annotations that were in the provider script but not the PLAN script -- skip those.
- If the provider timing has significantly different text (indicating the TTS changed wording), flag this to the user.

### Step 5: Find segment boundaries

For each segment, determine the advance times:

- **Align to the next segment's VO onset, not the current segment's VO offset.** Each segment's final advance should land just *before* the next segment's first spoken word, so the voiceover starts right after the transition.
- Find the first word of the *next* segment's script section on the track timeline. Place the segment boundary 0.1-0.3s before that word's effective track start time.
- For the **last segment** (no next segment), find the last word in the segment's script section and add 0.3-0.5s after its end time.

### Step 6: Handle multi-advance segments

Segments with multiple advances have internal beats (`waitForNext()` calls). For these:

1. **Count the advances.** The segment's `advances` array length tells you how many beats are needed.
2. **Identify beat positions.** Look for natural break points in the segment's script:
   - `[pause for animation]` markers in PLAN.md.
   - Sentence boundaries that align with visual transitions.
   - Content transition cues: "Next,...", "And now,...", "Finally,...".
3. **Place internal advances** at the effective track time of the words at these break points, converted to segment-relative time.
4. **Place the final advance** just before the next segment's first VO word (per Step 5).

### Step 7: Incorporate SFX and music anchors

Read `Notes:` fields from non-VO cues (SFX, music) in the plan snapshot. Look for time-specific hints:

- "beat drops at 5.3s" -- a music moment that could align with a visual transition
- "whoosh at 12.0s" -- a SFX that should coincide with a visual event
- "typing starts at 8.2s" -- a SFX placement that the video should sync to

These anchors are secondary to VO timing. Use them to fine-tune advance placement when a visual beat should land on an audio event. If an anchor conflicts with VO-derived timing, VO timing wins.

### Step 8: Convert to segment-relative times

All advance values in the `Timing` are segment-relative (seconds since the segment started), not track-absolute.

```
segment_start = sum of all previous segments' final advance times
                (cumulative from the start of the track)
advance_time = absolute_track_time - segment_start
```

**Worked example** (3 segments, 1 advance each):

| Segment | Track-absolute advance | segment_start | Segment-relative advance |
|---|---|---|---|
| intro | 4.2s | 0.0s (first segment) | 4.2 - 0.0 = **4.2s** |
| feature-cards | 16.2s | 4.2s (intro's final advance) | 16.2 - 4.2 = **12.0s** |
| outro | 19.7s | 16.2s (feature-cards' final advance) | 19.7 - 16.2 = **3.5s** |

For multi-advance segments, `segment_start` is still the cumulative total of all previous segments' **final** advance values. Internal advances within a segment are converted using the same `segment_start`.

### Step 9: Apply the "audio always wins" rule

The video duration adapts to match the audio:

- If the audio for a segment is shorter than the segment's current advances suggest, compress the advances.
- If the audio is longer, stretch the advances.
- The last advance of the last segment should land at or near the end of the audio track.
- Never truncate audio. Never pad with silence.

## Writing the timing

### Update track.ts

Write the computed `timing` into the active track's `track.ts`:

```ts
timing: {
  perSegment: {
    'intro': [4.2],
    'feature-cards': [2.1, 5.8, 9.3, 12.0],
    'outro': [3.5],
  },
},
```

### Present to the user

Show the timing with annotations:

```
Proposed timing for audio track v3:

  intro (1 advance):
    [0] 4.2s -- "...set us apart." (end of intro narration)

  feature-cards (4 advances):
    [0] 2.1s -- "...across devices." (end of collaboration section)
    [1] 5.8s -- "...in one view." (end of analytics section)
    [2] 9.3s -- "...and more." (end of integrations section)
    [3] 12.0s -- transition (next VO starts at ~12.2s)

  outro (1 advance):
    [0] 3.5s -- "...Thanks for watching." (end of video)

  Total track duration: 19.7s
```

For each advance, show:
- The segment-relative time in seconds.
- A snippet of the script text the advance lands on.
- What the advance does (internal beat vs. segment transition).

### Iteration

The user may request adjustments:

- "Move the second beat in feature-cards 0.5s later" -- adjust that advance value.
- "The intro feels rushed" -- add buffer to the intro's advance.
- "Combine the first two beats" -- this changes the number of advances, which means a `waitForNext()` needs to be removed from segment code. Flag the code change.

After each adjustment, re-present the timing. When the user confirms, write it into `track.ts`.

### Append sync log entry

After the timing is finalized, append to `audio/audio_plan.md`:

```markdown
## YYYY-MM-DD HH:MM -- Synced timing to vN
**Segments:** intro, feature-cards, outro
**Total duration:** 19.7s
```

### Animation sync pass

After writing timing, consider whether in-segment animations need adjustment. Load [voiceover/animation_sync.md](voiceover/animation_sync.md) if the audio track is being set as the default and the video has fully automated animations (not all `waitForNext`-driven).

## VO-only shortcut

For VO-only tracks (single VO cue, full file, placed at 0s), the sync procedure is identical to the existing VO sync algorithm in [voiceover/sync_algorithm.md](voiceover/sync_algorithm.md). The mapping simplifies:

- `a = 0`, `p = 0`, so `track_time = w` (source time equals track time).
- No SFX/music anchors to incorporate.
- The full existing sync algorithm applies unchanged.

## Edge cases

| Situation | Behavior |
|---|---|
| Plan snapshot has no VO cues | No word-level timing data. Use SFX/music anchors if available. Otherwise, fall back to the segment's existing `advances` values. |
| VO timing.json is missing | Error. Direct the user to generate timing data (via TTS with timestamps or STT transcription). |
| VO slice out of range | Error before computing. "VO v3 is 4.0s; slice 1.2-5.6 exceeds source." |
| Multiple VO cues from the same source with overlapping slices | Valid. A word may have multiple effective track times. Use the most relevant one for the segment being synced. |
| Segment has no script (silent segment) | Use the segment's existing `advances` values. The segment passes through without VO-derived timing. |
| SFX anchor contradicts VO timing | VO timing wins. Note the conflict in the timing presentation. |
| Track has no timing.json references (SFX/music only, no VO) | Use SFX/music anchors plus segment `advances` as the base. This is unusual but valid. |

## Relationship to other files

- **[voiceover/sync_algorithm.md](voiceover/sync_algorithm.md)** -- the VO-level sync algorithm. Still the reference for parsing timing.json and matching words to script. This file extends it to audio-track-level sync.
- **[voiceover/animation_sync.md](voiceover/animation_sync.md)** -- the in-segment animation adjustment pass. Run after sync when the track is set as default.
- **[build.md](build.md)** -- the build workflow that precedes sync.
- **[audio_plan.md](audio_plan.md)** -- the plan format specification.
