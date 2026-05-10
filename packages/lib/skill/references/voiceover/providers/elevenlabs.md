# ElevenLabs

## When this is loaded

You need to guide the user through ElevenLabs to generate voiceover audio and per-word timing data. This reference covers both the API-key flow (automated) and the portal flow (manual web UI).

This reference also covers Speech-to-Text for the manual voiceover flow (Flow B).

## Mode selection

Before starting audio generation, present the user with two options:

> Two ways to generate the voiceover with ElevenLabs:
>
> 1. **API key (recommended for repeated use)** -- set up once in `.env`, then the agent generates audio and timings via curl.
> 2. **Portal (web UI, no setup)** -- the agent walks you through TTS in the ElevenLabs web portal, then STT to extract timings.
>
> API key is faster and reusable across projects. Portal needs no setup but takes more clicks per video.
>
> If you don't have an account: open https://elevenlabs.io and sign up first.

After the user picks, dispatch into the appropriate sub-flow below.

---

## Flow 1: API Key

### Step 1: Credit / cost warning

Before generating audio, warn the user about costs:

> **Cost notice:** ElevenLabs charges credits for TTS generation. On paid plans, a 60-second voiceover (~900 characters) costs roughly 900-1,000 credits, which is a small fraction of most plan quotas. Free-tier accounts get a limited monthly character allowance.
>
> Check your plan's remaining quota at https://elevenlabs.io/app/subscription before generating.

<!-- TODO: Verify current pricing tiers -- ElevenLabs pricing may have changed. The rough estimate above is based on ~1 credit per character for standard voices. -->

### Step 2: Get the API key

Guide the user:

> 1. Go to https://elevenlabs.io/app/settings/api-keys (sign in if prompted).
> 2. Click **Create API Key**.
> 3. Give it a name (e.g., "videowright") and create it.
> 4. Copy the key.

**Storage rules -- do NOT paste the key into chat:**

> **Important:** Do not paste your API key into this chat -- it would be sent to the LLM provider.
>
> Instead:
> 1. Create a `.env` file at your project root (if it doesn't already exist).
> 2. Add this line: `ELEVENLABS_API_KEY=your-key-here`
> 3. Make sure `.env` is in your `.gitignore` (add it if not).

The agent reads the key via `process.env.ELEVENLABS_API_KEY` when running curl commands.

### Step 3: Choose a voice

The user needs a voice ID. Guide them:

> 1. Browse voices at https://elevenlabs.io/app/voice-library or https://elevenlabs.io/app/voice-lab
> 2. Preview voices and pick one that matches your preferred tone.
> 3. Copy the **Voice ID** from the voice's settings panel.
> 4. Add it to your `.env`: `ELEVENLABS_VOICE_ID=your-voice-id-here`

### Step 4: Generate audio with timestamps

Use the text-to-speech-with-timestamps endpoint. This returns both the audio and per-word timing in a single request.

**Endpoint:** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps`

The agent constructs and runs a curl command like this:

```bash
# Read the provider script (everything below the --- line)
SCRIPT_TEXT=$(sed '1,/^---$/d' "videos/<video>/voiceovers/<slug>/provider_script.md")

curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/with-timestamps" \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg text "$SCRIPT_TEXT" \
    --arg model "eleven_multilingual_v2" \
    '{
      text: $text,
      model_id: $model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    }'
  )" \
  -o "$TMPDIR/elevenlabs_response.json"
```

<!-- TODO: Verify the exact response shape of the with-timestamps endpoint. The format below is based on known ElevenLabs API behavior -- confirm against current docs. -->

**Processing the response:**

The response JSON contains base64-encoded audio and word-level alignment data. The agent must:

1. **Extract the audio.** The response includes an `audio_base64` field. Decode and save it:

```bash
jq -r '.audio_base64' "$TMPDIR/elevenlabs_response.json" | base64 --decode > "videos/<video>/voiceovers/<slug>/narration.mp3"
```

2. **Extract the timing data.** The response includes an `alignment` field with per-character or per-word timing. Transform it into the standard timing JSON format and save:

```bash
jq '{
  words: [.alignment.words[] | {word: .word, start: .start, end: .end}]
}' "$TMPDIR/elevenlabs_response.json" > "videos/<video>/voiceovers/<slug>/provider_timing.json"
```

If the response uses character-level alignment instead of word-level, aggregate characters into words by grouping on whitespace boundaries and using the start of the first character and end of the last character for each word.

3. **Clean up** the temporary response file.

### API flow output

After a successful API call, the voiceover folder should contain:

```
voiceovers/<slug>/
  provider_script.md       # already created in prior step
  narration.mp3            # decoded from API response
  provider_timing.json     # extracted from API response
```

Proceed to the sync algorithm: [../sync_algorithm.md](../sync_algorithm.md).

---

## Flow 2: Portal (Web UI)

The portal flow has two steps: TTS to generate audio, then STT to extract per-word timing.

### Step 1 -- Generate the audio (TTS)

Guide the user:

> **Generating voiceover audio with ElevenLabs:**
>
> 1. Open https://elevenlabs.io/app and sign in.
> 2. Navigate to **Text to Speech** in the sidebar.
> 3. **Important: Select the v2 model in the model dropdown.** Look for **"Eleven Multilingual v2"** (or **"Multilingual v2"**). Do NOT use the default v3 model -- v3 does not honor exact pause timing via `<break>` tags.
> 4. Select a voice that matches your tone preferences. You can preview voices before generating.
> 5. Paste the content from `voiceovers/<slug>/provider_script.md` (everything below the horizontal rule) into the text area.
> 6. Click **Generate**.
> 7. Listen to the preview. If pauses or delivery need adjustment, update the provider script and regenerate.
> 8. **Download the audio file.** Click the download button on the generated audio. Save as `narration.mp3`.
> 9. Place the file in `voiceovers/<slug>/narration.mp3`.

### Step 2 -- Extract timings (STT)

The TTS portal does not export per-word timing data. To get timings, run the generated audio through Speech-to-Text:

> **Extracting word-level timing via Speech-to-Text:**
>
> 1. In the ElevenLabs portal, switch to **Speech to Text** in the sidebar.
> 2. Upload the audio file you just saved (`voiceovers/<slug>/narration.mp3`).
> 3. Wait for transcription to complete.
> 4. **Export the result as JSON.** Look for an "Export" or "Download" option and select **JSON** format. **Do not use plain text export** -- plain text does not include per-word timing data.
> 5. Save the JSON file as `voiceovers/<slug>/provider_timing.json`.

### Portal flow output

After both steps, the voiceover folder should contain:

```
voiceovers/<slug>/
  provider_script.md       # already created in prior step
  narration.mp3            # downloaded from TTS in step 1
  provider_timing.json     # exported from STT in step 2
```

Proceed to the sync algorithm: [../sync_algorithm.md](../sync_algorithm.md).

---

## Speech-to-Text (for manual flow / Flow B)

Used when the user provides their own audio and needs per-word timing data. This is the same STT process as portal step 2 above.

### Portal walkthrough: STT transcription

> **Transcribing audio with ElevenLabs Speech-to-Text:**
>
> 1. Open https://elevenlabs.io/app and sign in.
> 2. Navigate to **Speech to Text** in the sidebar.
> 3. Upload the audio file (mp3 or wav).
> 4. Wait for transcription to complete.
> 5. **Export as JSON.** Select the JSON export option -- plain text export does not include word timing data.
> 6. Save the JSON file in `voiceovers/<slug>/` as `provider_timing.json`.

### Timing JSON format (STT)

ElevenLabs STT output contains word-level timestamps:

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

---

## Timing JSON format (canonical)

Both flows produce the same timing JSON format at `voiceovers/<slug>/provider_timing.json`:

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

The exact JSON structure may vary by ElevenLabs endpoint or export version. Adapt by looking for word-level entries with start/end timestamps. The sync algorithm needs: word text, start time, end time.

## Troubleshooting

| Issue | Resolution |
|---|---|
| API returns 401 | Check that `ELEVENLABS_API_KEY` is set correctly in `.env` and the key is valid. |
| API returns 429 | Rate limited. Wait a moment and retry, or check your plan's quota. |
| Audio quality is poor | Re-generate with a different voice or adjusted settings. Try adjusting `stability` (higher = more consistent) and `similarity_boost` in the API call. |
| Pauses are too short/long | Adjust the `provider_script.md` pause annotations and regenerate. For `<break>` tags, adjust the `time` value. |
| TTS mispronounces a word | Add phonetic spelling to the provider script and regenerate. |
| STT misses words or adds extra words | Use the best-match approach in the sync algorithm. Flag mismatches to the user. |
| Portal does not show v2 model option | The model may be listed as "Eleven Multilingual v2" or similar. Check the model dropdown carefully. If v2 is not available, the `<break>` tags for exact pause timing will not work reliably in v3 -- note this to the user. |
| STT JSON export option not visible | Look for a download/export button after transcription completes. The option may be labeled "Export", "Download", or appear as a dropdown with format choices. Select JSON specifically. |
