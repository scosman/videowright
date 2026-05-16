#!/usr/bin/env bash
# Generates ElevenLabs voiceover for demo_video v4 using the Asher voice.
# Voice ID is passed as an API parameter (hardcoded here), not via env var.
# API key is read from .env at project root.

set -euo pipefail

VOICE_ID="tMvyQtpCVQ0DkixuYm6J"  # Asher
MODEL_ID="eleven_multilingual_v2"
VO_DIR="videos/demo_video/voiceovers/v4"
SCRIPT_FILE="$VO_DIR/provider_script.md"
RESP_FILE="${TMPDIR:-/tmp}/vw_eleven_resp.$$.json"
AUDIO_OUT="$VO_DIR/audio.mp3"
TIMING_OUT="$VO_DIR/timing.json"

# Load API key from .env (must be run from project root)
if [ ! -f .env ]; then
  echo "ERROR: .env not found in current directory." >&2
  exit 1
fi
set -a
. ./.env
set +a

if [ -z "${ELEVENLABS_API_KEY:-}" ]; then
  echo "ERROR: ELEVENLABS_API_KEY not set in .env" >&2
  exit 1
fi

# Extract script body (everything below the first --- line)
SCRIPT_TEXT=$(sed -n '/^---$/,$p' "$SCRIPT_FILE" | sed '1d')
if [ -z "$SCRIPT_TEXT" ]; then
  echo "ERROR: provider_script.md body is empty (no content after ---)" >&2
  exit 1
fi
CHAR_COUNT=${#SCRIPT_TEXT}
echo "→ Posting ${CHAR_COUNT} chars to ElevenLabs (voice: Asher, model: ${MODEL_ID})..."

# POST to the with-timestamps endpoint
HTTP_CODE=$(curl -sS -w "%{http_code}" -o "$RESP_FILE" \
  -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps" \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -H "Content-Type: application/json" \
  --data "$(jq -n \
    --arg text "$SCRIPT_TEXT" \
    --arg model "$MODEL_ID" \
    '{
      text: $text,
      model_id: $model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    }')")

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: ElevenLabs returned HTTP ${HTTP_CODE}" >&2
  echo "Response body (first 800 chars):" >&2
  head -c 800 "$RESP_FILE" >&2
  echo >&2
  rm -f "$RESP_FILE"
  exit 1
fi

# Detect available fields (the API has used different naming over time)
HAS_AUDIO=$(jq 'has("audio_base64")' "$RESP_FILE")
HAS_ALIGNMENT=$(jq 'has("alignment")' "$RESP_FILE")
echo "→ Response: audio_base64=${HAS_AUDIO} alignment=${HAS_ALIGNMENT}"

if [ "$HAS_AUDIO" != "true" ]; then
  echo "ERROR: response missing audio_base64. Top-level keys:" >&2
  jq 'keys' "$RESP_FILE" >&2
  exit 1
fi

# Decode audio
jq -r '.audio_base64' "$RESP_FILE" | base64 --decode > "$AUDIO_OUT"
AUDIO_BYTES=$(wc -c <"$AUDIO_OUT" | tr -d ' ')
echo "→ Wrote ${AUDIO_OUT} (${AUDIO_BYTES} bytes)"

# Extract timing. The with-timestamps response has CHARACTER-level alignment.
# We aggregate characters into whitespace-delimited words.
jq '{
  words: (
    .alignment as $a
    | reduce range(0; ($a.characters | length)) as $i (
        {acc: [], curWord: "", curStart: null, curEnd: null};
        ($a.characters[$i]) as $c
        | ($a.character_start_times_seconds[$i]) as $s
        | ($a.character_end_times_seconds[$i]) as $e
        | if ($c | test("\\s|\\n|\\r")) then
            if .curWord == "" then
              .
            else
              .acc += [{word: .curWord, start: .curStart, end: .curEnd}]
              | .curWord = "" | .curStart = null | .curEnd = null
            end
          else
            .curWord += $c
            | if .curStart == null then .curStart = $s else . end
            | .curEnd = $e
          end
      )
    | if .curWord != "" then .acc + [{word: .curWord, start: .curStart, end: .curEnd}] else .acc end
  )
}' "$RESP_FILE" > "$TIMING_OUT"

WORD_COUNT=$(jq '.words | length' "$TIMING_OUT")
LAST_END=$(jq '.words[-1].end' "$TIMING_OUT")
echo "→ Wrote ${TIMING_OUT} (${WORD_COUNT} words, audio duration ~${LAST_END}s)"

rm -f "$RESP_FILE"

echo
echo "✓ Generation complete."
echo "  Audio:  ${AUDIO_OUT}"
echo "  Timing: ${TIMING_OUT}"
