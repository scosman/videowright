# ElevenLabs

## When this is loaded

You need to guide the user through the ElevenLabs portal for text-to-speech generation or speech-to-text transcription.

This reference covers both directions:

- **Text-to-Speech (TTS)** -- AI generation flow. Paste the provider script, generate audio, download audio and timing data.
- **Speech-to-Text (STT)** -- used in the manual flow. Upload user-provided audio, download transcript and timing data.

## Text-to-Speech: ElevenLabs v3

### Tag conventions

ElevenLabs v3 supports inline delivery tags in the script text. Use these in `provider_script.md`:

#### Audio tags (delivery direction)

Wrap sections of text with tags to change the delivery style:

```
[excited] This is amazing! [/excited]
[serious] This requires careful attention. [/serious]
[whispering] Just between us... [/whispering]
[calm] Take a deep breath. Everything is fine. [/calm]
```

Available tags: `[excited]`, `[serious]`, `[whispering]`, `[calm]`, `[angry]`, `[sad]`, `[surprised]`.

Use tags sparingly. Most narration should use the natural voice without tags. Tags work best for emphasis at key moments -- a launch announcement, a cautionary note, a dramatic reveal.

#### Pause mechanisms

For pauses between narration sections (where the video needs time for animation):

| Pause type | Syntax | Approximate duration |
|---|---|---|
| Natural micro-pause | `...` (ellipsis) | ~0.3-0.5s |
| Breath pause | `--` (em-dash) | ~0.2-0.4s |
| Sentence break | Period + new sentence | ~0.5-0.8s |
| Medium pause | `... ...` (double ellipsis) | ~0.8-1.2s |
| Longer pause | `<break time="2s" />` | Specified duration |

The `<break>` SSML tag is the most reliable for precise pauses. Use it for pauses of 1 second or more where the video needs time for a visual transition. If `<break>` is not supported by the current ElevenLabs v3 endpoint, fall back to combining multiple ellipses and sentence breaks.

Test pause rendering: pauses may be shorter or longer than expected. Advise the user to listen to the generated audio and adjust the provider script if pauses need tuning.

#### Pronunciation

- **Spell out letters:** "A P I" (with spaces) for letter-by-letter pronunciation.
- **Phonetic hint:** For unusual names, spell them phonetically: "Kubernetes" works fine, but "Istio" might need "is-tee-oh" in parentheses nearby.
- **URLs:** Write as speech: "acme dot com" instead of "acme.com".
- **Numbers:** "one hundred twenty three" instead of "123" if the TTS reads it oddly. Test first -- ElevenLabs generally handles numbers well.

### Portal walkthrough: TTS generation

Guide the user through these steps:

> **Generating voiceover audio with ElevenLabs:**
>
> 1. Open [elevenlabs.io](https://elevenlabs.io) and sign in (or create a free account).
> 2. Navigate to **Text to Speech** (or **Speech Synthesis**) in the sidebar.
> 3. Select a voice. Based on your style preferences: [include voice selection guidance from style intake].
> 4. Paste the content from `provider_script.md` (everything below the horizontal rule) into the text area.
> 5. Click **Generate**.
> 6. Listen to the preview. If pauses or delivery need adjustment, update the script and regenerate.
> 7. **Download the audio file.** Click the download button on the generated audio. Save as MP3 or WAV.
> 8. **Download the timing data.** Look for a "Download timestamps" or "Word timing" option. Save as JSON.
>    - If per-word timing is not available directly, check the API response or the "Projects" feature which may offer word-level timestamps.
> 9. Place both files in `voiceovers/<slug>/`:
>    - The audio file: any name (e.g., `narration.mp3`)
>    - The timing JSON: name it `provider_timing.json`

### Expected output files

After TTS generation, the voiceover folder should contain:

```
voiceovers/<slug>/
  provider_script.md       # already created
  narration.mp3            # downloaded from ElevenLabs
  provider_timing.json     # downloaded from ElevenLabs
```

### Timing JSON format (TTS)

ElevenLabs TTS timing data contains per-word timestamps:

```json
{
  "words": [
    {
      "word": "Welcome",
      "start": 0.0,
      "end": 0.45
    },
    {
      "word": "to",
      "start": 0.47,
      "end": 0.55
    }
  ]
}
```

Fields:
- `word`: the spoken word
- `start`: seconds from audio start when the word begins
- `end`: seconds from audio start when the word ends

The exact JSON structure may vary by ElevenLabs endpoint or version. Adapt by looking for word-level entries with start/end timestamps. The sync algorithm needs: word text, start time, end time.

## Speech-to-Text: ElevenLabs STT

Used in the manual voiceover flow when the user provides their own audio file and needs transcript + timing data.

### Portal walkthrough: STT transcription

Guide the user through these steps:

> **Transcribing audio with ElevenLabs Speech-to-Text:**
>
> 1. Open [elevenlabs.io](https://elevenlabs.io) and sign in.
> 2. Navigate to **Speech to Text** in the sidebar.
> 3. Upload the audio file (mp3 or wav).
> 4. Wait for transcription to complete.
> 5. **Download the timing data.** Look for a "Download" or "Export" option that includes per-word timestamps. Save as JSON.
> 6. Place the JSON file in `voiceovers/<slug>/` as `provider_timing.json`.

### Timing JSON format (STT)

ElevenLabs STT output has a similar structure to TTS timing:

```json
{
  "words": [
    {
      "word": "Welcome",
      "start": 0.12,
      "end": 0.58,
      "confidence": 0.98
    }
  ]
}
```

Additional fields like `confidence` can be ignored for sync purposes. The sync algorithm uses only `word`, `start`, and `end`.

### STT accuracy notes

- STT may not perfectly transcribe the audio. Minor differences (filler words, slight wording changes) are normal.
- When the STT transcript differs from the PLAN.md script, use the STT timestamps for timing but the PLAN.md script text for the canonical record.
- Flag significant discrepancies to the user -- they may want to update PLAN.md to match what was actually spoken.

## Troubleshooting

| Issue | Resolution |
|---|---|
| No per-word timing download option | Check ElevenLabs Projects feature or API endpoints. The portal UI may not expose timing directly -- the user may need to use the API. Provide the API curl example if needed. |
| Audio quality is poor | Re-generate with a different voice or adjusted settings. ElevenLabs allows unlimited regeneration on most plans. |
| Pauses are too short/long | Adjust the `provider_script.md` pause annotations and regenerate. |
| TTS mispronounces a word | Add phonetic spelling to the provider script and regenerate. |
| STT misses words or adds extra words | Use the best-match approach in the sync algorithm. Flag mismatches to the user. |
