# Sync Algorithm

## When this is loaded

You have a voiceover audio file and provider timing data, and you need to compute a `Timing` object that syncs segment advances to the audio.

## Overview

This is an agent reasoning step, not a deterministic function. You read the per-word timing data from the provider, walk the per-segment script from PLAN.md, and produce a `Timing` object with advance times for each segment.

## Inputs

1. **Per-segment script** from PLAN.md (the `## Script` section with subsections per segment id).
2. **Provider timing JSON** at `voiceovers/<slug>/provider_timing.json`. This contains per-word or per-character timestamps from the TTS provider or STT transcription.
3. **Segment ids** in timeline order, plus each segment's `notes` and `voiceover` hint string.
4. **Each segment's `advances` array** -- the current timing. You will be replacing these values in the `Timing`, but the array length tells you how many advances each segment needs.

## Output

A `Timing` object written into `voiceover.ts`:

```ts
timing: {
  perSegment: {
    'intro':          [4.2],
    'feature-cards':  [2.1, 5.8, 9.3, 12.0],
    'outro':          [3.5],
  },
},
```

Each value array has the same length as the segment's `advances` array. Values are segment-relative seconds (same units as `SegmentSpec.advances`).

## Parsing provider timing JSON

### ElevenLabs TTS timing

ElevenLabs v3 TTS can output per-word timing. The JSON format contains an array of word entries with start and end timestamps:

```json
{
  "words": [
    { "word": "Welcome", "start": 0.0, "end": 0.45 },
    { "word": "to", "start": 0.47, "end": 0.55 },
    { "word": "Acme", "start": 0.58, "end": 0.92 },
    ...
  ]
}
```

Timestamps are in seconds from the start of the audio file. The `end` of the last word in a segment's script section gives you the boundary for that segment's audio content.

### ElevenLabs Speech-to-Text timing

ElevenLabs STT output has a similar structure with word-level timestamps. The format may include additional fields like confidence scores -- ignore those. Focus on `word`, `start`, and `end`.

If the JSON structure differs from the above (ElevenLabs may update their format), adapt by looking for word-level entries with start/end time fields. The core need is: which word was spoken at which timestamp.

## The sync procedure

### Step 1: Map script text to timing words

Walk through the provider timing JSON word by word. For each segment's script section in PLAN.md, find the corresponding words in the timing data by text matching.

- Match is case-insensitive and ignores punctuation.
- Provider timing may include words from pause markers or annotations that were in the provider script but not the PLAN script -- skip those.
- If the provider timing has significantly different text (indicating the TTS changed wording), flag this to the user and ask which text to use.

### Step 2: Find segment boundaries

For each segment, identify the timestamp where its narration ends:

- Find the last word in the segment's script section.
- The `end` timestamp of that word is the segment's audio end time.
- Add a small buffer (0.3-0.5 seconds) after the last word for natural trailing silence.

### Step 3: Convert to segment-relative advances

The `Timing` uses segment-relative seconds (time since the segment started, not since the audio started). To convert:

```
segment_start = sum of all previous segments' durations
advance_time = absolute_timestamp - segment_start
```

For the last advance of each segment (the one that transitions to the next segment), set it to the segment's total duration (end of its audio content, segment-relative).

### Step 4: Handle multi-advance segments

Segments with multiple advances have internal beats (`waitForNext()` calls in their `play()` function). For these:

1. **Count the advances.** The segment's `advances` array length tells you how many beats are needed.
2. **Identify beat positions.** Look for natural break points in the segment's script:
   - `[pause for animation]` markers in the PLAN.md script.
   - Sentence boundaries that align with visual transitions (check the segment's `notes` or code).
   - Content transition cues: "Next,...", "And now,...", "Finally,...", "Moving on,...".
3. **Place advances** at the timestamps corresponding to these break points. Each advance should land at the end of the narration chunk before the next visual beat.

Example for a segment with 4 advances:

```
Script: "First feature. [pause] Second feature. [pause] Third feature."
Advances array length: 4 (3 internal beats + 1 final transition)

advance[0] = end of "First feature" + buffer   (first waitForNext resolves)
advance[1] = end of "Second feature" + buffer  (second waitForNext resolves)
advance[2] = end of "Third feature" + buffer   (third waitForNext resolves)
advance[3] = total segment duration             (transition to next segment)
```

### Step 5: Apply the "audio always wins" rule

The video duration adapts to match the audio duration:

- If the audio for a segment is shorter than the segment's current `advances` suggest, compress the advances.
- If the audio is longer, stretch the advances.
- The last advance of the last segment should land at (or very near) the end of the audio file.
- Never truncate audio. Never pad with silence.

## Presenting the timing to the user

After computing the `Timing`, present it with annotations:

```
Proposed timing:

  intro (1 advance):
    [0] 4.2s -- "...set us apart." (end of intro narration)

  feature-cards (4 advances):
    [0] 2.1s -- "...across devices." (end of collaboration section)
    [1] 5.8s -- "...in one view." (end of analytics section)
    [2] 9.3s -- "...and more." (end of integrations section)
    [3] 12.0s -- transition to next segment

  outro (1 advance):
    [0] 3.5s -- "...Thanks for watching." (end of video)

  Total audio duration: 19.7s
```

For each advance, show:

- The segment-relative time in seconds.
- A snippet of the script text that the advance lands on.
- What the advance does (internal beat vs. segment transition).

## Iteration

The user may request adjustments:

- "Move the second beat in feature-cards 0.5 seconds later" -- adjust that advance value.
- "The intro feels rushed" -- extend the intro's advance time by adding more buffer.
- "Combine the first two beats in feature-cards into one" -- this changes the number of advances, which means the segment's `play()` function needs a `waitForNext()` removed. Flag this as a code change.

After each adjustment, re-present the timing. When the user confirms, write it into `voiceover.ts`.

## Edge cases

| Situation | Behavior |
|---|---|
| Provider timing JSON is missing | Error. The user must download it from the provider portal. Direct them to the provider walkthrough. |
| Words in timing do not match the script | Likely the TTS changed wording. Flag specific mismatches, ask user whether to use TTS text or original script text for alignment. |
| Segment has no script (silent segment) | Use the segment's existing `advances` values. The segment passes through without voiceover. |
| Audio is significantly shorter/longer than expected | Apply "audio always wins" -- compress or stretch. Flag the discrepancy so the user can decide if they want to re-record or adjust the video. |
| Provider timing has character-level rather than word-level data | Aggregate characters into words by grouping on whitespace boundaries. Use the word-end timestamp. |
