#!/usr/bin/env bash
# ElevenLabs TTS + Scribe STT + retime for demo_v2. The actual take was made in the portal with
# Eleven v4 + the Cosman-1 voice clone (see HANDOFF.md); this API script is a fallback and its
# model_id / VOICE_ID must be set to the account's v4 model id and Cosman-1 voice id before use.
# Run from the project root
# (examples/videowright_demo). Needs ELEVENLABS_API_KEY in ./.env (paid plan), jq, ffmpeg.
#
# Portal alternative (no API key): see HANDOFF.md in this folder.
set -euo pipefail
set -a; . ./.env; set +a

VO_DIR="videos/demo_v2/audio/originals/voiceovers/v1"
VOICE_ID="${COSMAN_VOICE_ID:?set COSMAN_VOICE_ID to the Cosman-1 voice id}"  # Cosman-1 (IVC)
retime() { node node_modules/videowright/skill/scripts/retime.mjs "$@"; }

TEXT="$(retime text "$VO_DIR/provider_script.md" --pause-tag "[pause]")"
[ -n "$TEXT" ] || { echo "ERROR: no text from provider_script.md" >&2; exit 1; }

# 1. TTS -> raw.mp3
HTTP_CODE=$(curl -sS -w "%{http_code}" -o "$VO_DIR/raw.mp3" \
  -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128" \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg text "$TEXT" '{
    text: $text,
    model_id: "eleven_v4",
    voice_settings: { stability: 0.5 }
  }')")
if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: ElevenLabs TTS returned HTTP $HTTP_CODE" >&2; head -c 800 "$VO_DIR/raw.mp3" >&2; echo >&2
  rm -f "$VO_DIR/raw.mp3"; exit 1
fi
echo "Wrote $VO_DIR/raw.mp3 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VO_DIR/raw.mp3")s)"

# 2. STT (Scribe v2, word timestamps) -> raw_stt.json
curl -sS -X POST https://api.elevenlabs.io/v1/speech-to-text \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -F model_id=scribe_v2 \
  -F file=@"$VO_DIR/raw.mp3" \
  -F timestamps_granularity=word \
  -F language_code=en \
  -F tag_audio_events=false \
  -o "$VO_DIR/raw_stt.json"

# 3. Transcript check (exit 1 = bad take: regenerate), then set exact pause lengths.
retime check "$VO_DIR/provider_script.md" "$VO_DIR/raw_stt.json"
retime apply "$VO_DIR/provider_script.md" "$VO_DIR/raw.mp3" "$VO_DIR/raw_stt.json" \
  "$VO_DIR/audio.mp3" "$VO_DIR/timing.json"
