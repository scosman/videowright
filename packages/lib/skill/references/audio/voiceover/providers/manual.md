# Manual Voiceover

## When this is loaded

The user has their own audio file and wants to add it as a voiceover. This is Flow B from the main voiceover reference.

## Overview

The manual flow takes a user-provided audio file and generates the transcript and timing data needed for sync. The user provides the audio; the agent guides them through ElevenLabs Speech-to-Text to get per-word timing, then runs the sync algorithm to produce a `Timing` object.

## Step 1: Get the audio file

Ask the user for the audio file. Two options:

1. **File path.** The user provides a path to an existing file on disk. Copy or move it into the voiceover folder.
2. **Drop-in.** Create the voiceover folder and ask the user to place the file there.

```
audio/originals/voiceovers/<slug>/
  audio.mp3    # or .wav
```

Slug naming:
- Ask the user for a slug, or suggest one based on context: `v1`, `narrator`, `take-1`.
- Create the directory: `videos/<video>/audio/originals/voiceovers/<slug>/`.

### Audio format requirements

- MP3 or WAV are the standard formats. Both work with ElevenLabs and ffmpeg.
- If the user provides a different format (M4A, OGG, FLAC), note that ffmpeg can handle most formats. ElevenLabs STT also accepts most common formats.
- No specific sample rate or bitrate requirements -- ElevenLabs and ffmpeg handle resampling.

## Step 2: Generate transcript and timing

The user needs per-word timing data for the sync algorithm. Guide them through ElevenLabs Speech-to-Text:

> **To generate the timing data, we need to transcribe your audio with per-word timestamps.**
>
> Follow these steps:
>
> 1. Open https://elevenlabs.io/app and sign in (or create a free account).
> 2. Navigate to **Speech to Text** in the sidebar.
> 3. Upload your audio file (`<filename>`).
> 4. Wait for transcription to complete.
> 5. **Export as JSON.** Select the JSON export option -- **do not use plain text export**, which does not include per-word timing data.
> 6. Save the JSON file as `timing.json` in `audio/originals/voiceovers/<slug>/`.

See [elevenlabs.md](elevenlabs.md) for the detailed STT portal walkthrough and expected JSON format.

## Step 3: Verify the transcript

After the user downloads the timing JSON:

1. Read `timing.json` and extract the full transcript text.
2. Present it to the user for review: "Here's what ElevenLabs heard. Does this match your recording?"
3. If the transcript is significantly wrong (wrong words, missing sections), the timing data may be unreliable. Ask the user to:
   - Re-record with clearer audio, or
   - Manually correct the timing JSON (rare -- usually re-recording is easier).
4. If the transcript has minor differences (filler words, slight variations), proceed -- the sync algorithm handles this.

## Step 4: Update PLAN.md script

If the video does not already have a script in PLAN.md:

1. Use the STT transcript as the basis for the script.
2. Divide it by segment, matching content to segment ids using the timeline's segment outline and each segment's `notes`/`voiceover` hints.
3. Write the script section into PLAN.md.
4. Update each segment's `voiceover` field to match.

If the video already has a script in PLAN.md:

1. Compare the STT transcript with the existing script.
2. Flag significant differences.
3. The existing PLAN.md script is the canonical version -- use it for segment boundary alignment in the sync algorithm, but use the STT timestamps for timing.

## Step 5: Proceed to sync

With the audio file and `timing.json` in place, proceed to the sync algorithm: [../sync_algorithm.md](../sync_algorithm.md).

The sync algorithm uses the provider timing JSON to compute a `Timing` object. The rest of the flow (default voiceover question, animation sync, writing `voiceover.ts`) is identical to the AI-generated flow.

## Expected folder state after manual flow

```
audio/originals/voiceovers/<slug>/
  voiceover.ts             # created at the end of the flow
  audio.mp3                # user-provided audio
  timing.json              # from ElevenLabs STT
```

Note: there is no `provider_script.md` in the manual flow since the user recorded the audio themselves.

## Edge cases

| Situation | Behavior |
|---|---|
| Audio has background music or noise | STT accuracy may suffer. Warn the user that timing data could be less precise. Suggest clean audio for best results. |
| Audio has multiple speakers | Videowright supports only single-narrator voiceovers. Ask the user to provide a single-speaker recording. |
| Audio is very short (< 5 seconds) | Proceed normally, but the resulting timing may be too sparse for meaningful sync. |
| User does not want to use ElevenLabs STT | There is no alternative STT integration in V1. The user would need to manually create `timing.json` with per-word timestamps, which is impractical. Recommend ElevenLabs STT (free tier available). |
