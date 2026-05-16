# ElevenLabs Music Generation

## When this is loaded

The user chose ElevenLabs to generate background music. This reference covers the Music Generation API endpoint, prompt-writing tips, and the `generate.sh` template.

## Prerequisites

- `ELEVENLABS_API_KEY` set in `.env` at the project root. The key must have **Music Generation** permission enabled.
- If the user does not have an API key, guide them through setup: see [../../voiceover/providers/elevenlabs.md](../../voiceover/providers/elevenlabs.md) (Step 2: Get the API key). The same key works for TTS, STT, SFX, and Music.

## Cost notice

> **Cost notice:** ElevenLabs charges credits for music generation. Longer tracks cost more credits. A 60-second track typically costs 2,000-5,000 credits depending on complexity. Check your remaining quota at https://elevenlabs.io/app/subscription before generating.

## API endpoint

**Endpoint:** `POST https://api.elevenlabs.io/v1/music-generation`

**Request body:**

```json
{
  "text": "<prompt describing the desired music>",
  "duration_seconds": 60,
  "prompt_influence": 0.5
}
```

| Field | Required | Description |
|---|---|---|
| `text` | Yes | Natural-language description of the music. See prompt-writing tips below. |
| `duration_seconds` | No | Target duration in seconds. If omitted, the API chooses (usually 30s). Recommended: specify to match your video length. |
| `prompt_influence` | No | 0.0-1.0. Higher values follow the prompt more literally; lower values give more creative freedom. 0.5 is a good starting point for music. |

**Response:** The API returns raw audio bytes (mp3) directly in the response body.

## `generate.sh` template

Write this script to `audio/originals/music/<slug>/generate.sh` for reproducibility:

```bash
#!/bin/bash
# Generated Music: <name>
# Prompt: <the exact prompt used>
# Duration: <duration_seconds>s
# Prompt influence: <prompt_influence>

set -euo pipefail

# Load API key from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "${ELEVENLABS_API_KEY:-}" ]; then
  echo "Error: ELEVENLABS_API_KEY not set. Add it to .env" >&2
  exit 1
fi

SLUG="<slug>"
OUTPUT_DIR="audio/originals/music/${SLUG}"
mkdir -p "${OUTPUT_DIR}"

curl -X POST "https://api.elevenlabs.io/v1/music-generation" \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "<prompt>",
    "duration_seconds": <duration>,
    "prompt_influence": <influence>
  }' \
  --output "${OUTPUT_DIR}/audio.mp3"

echo "Music saved to ${OUTPUT_DIR}/audio.mp3"
```

Make the script executable: `chmod +x generate.sh`.

**Important:** Run `generate.sh` from the **video folder** (the directory containing `timeline.ts`) so that relative paths resolve correctly.

## Prompt-writing tips

Music generation prompts benefit from structure. Include these dimensions:

### Specify genre and instruments
- Good: "Ambient electronic with soft piano chords and warm synth pads"
- Bad: "Background music"

### Describe mood and energy arc
- Good: "Starts minimal and hopeful, builds gradually, reaches an optimistic peak at 30s, then settles into a gentle outro"
- Bad: "Happy music"

### Mention tempo and rhythm
- Good: "Moderate tempo around 90-100 BPM, light percussion, no heavy drums"
- Bad: "Not too fast"

### Describe the use case
- Good: "Background music for a product demo video. Needs to sit behind voiceover without competing. Should feel professional and modern."
- Bad: "Music for a video"

### Useful descriptors for product/demo videos

| Dimension | Good choices |
|---|---|
| Genre | ambient, corporate, indie electronic, lo-fi, minimal, cinematic |
| Instruments | piano, synth pads, soft guitar, muted percussion, strings, bells |
| Mood | professional, optimistic, calm, confident, innovative, warm |
| Energy | low-energy, mid-energy, building, steady, dynamic |
| Avoid | aggressive drums, heavy bass drops, distorted guitars, vocals |

### Duration guidance

Match the music duration to your video:
- Request slightly longer than needed (add 5-10s buffer). You can slice in the audio plan.
- For videos with intro + content + outro: request the full duration so you get a natural arc.
- For looping backgrounds: request at least one full musical phrase (usually 16-32s at standard tempos) so the loop point sounds clean.

## Post-generation workflow

After the curl command succeeds:

1. **Verify the file exists and is non-empty:**
   ```bash
   ls -la audio/originals/music/<slug>/audio.mp3
   ```

2. **Measure duration via ffprobe:**
   ```bash
   ffprobe -v error -show_entries format=duration \
     -of default=noprint_wrappers=1:nokey=1 \
     audio/originals/music/<slug>/audio.mp3
   ```

3. **Listen and analyze the track.** Before writing metadata, play the track and note:
   - BPM (count beats over 10s, multiply by 6)
   - Key (if discernible)
   - Structure (where sections change, where the energy peaks)
   - Any notable moments (beat drops, transitions, loop points)

4. **Write `music.ts`** with rich metadata (see [../music.md](../music.md) for the shape). Set `source: "elevenlabs"`. Include all observed musical details in the `notes` field.

5. **Trigger the approval UX** (see [../music.md](../music.md) -- Approval UX section).

## Iteration on discard

If the user discards and requests changes:

1. Delete the folder: `rm -rf audio/originals/music/<slug>/`
2. Ask what should change about the music.
3. Adjust the prompt based on feedback. Common adjustments:
   - "Too energetic" -- add "calm", "minimal", "ambient", reduce tempo
   - "Too boring" -- add "building", "dynamic", increase tempo, add percussion
   - "Wrong mood" -- change mood descriptors entirely
   - "Too short" -- increase `duration_seconds`
   - "Instruments are wrong" -- specify desired instruments, explicitly exclude unwanted ones ("no drums", "no vocals")
   - "Needs a stronger ending" -- describe the outro in the prompt ("resolves to a clear final chord")
4. Re-run with the updated prompt. Write a new `generate.sh` reflecting the new parameters.

## Troubleshooting

| Issue | Resolution |
|---|---|
| 401 Unauthorized | Check `ELEVENLABS_API_KEY` in `.env`. Ensure the key has Music Generation permission. |
| 422 Unprocessable Entity | Prompt may be problematic. Keep prompts 20-500 characters. Avoid special characters. |
| Empty or 0-byte response | API may have failed silently. Retry. If persistent, try a shorter duration or different prompt. |
| Generated music does not match prompt | Increase `prompt_influence` (try 0.6-0.8). Be more specific about instruments and mood. |
| Music has vocals/singing | Add "instrumental only, no vocals, no singing" to the prompt. |
| Rate limited (429) | Wait and retry. Check quota at https://elevenlabs.io/app/subscription. |
| Track is shorter than requested | The API may cap duration. Try requesting in smaller segments or accept the shorter track. |
