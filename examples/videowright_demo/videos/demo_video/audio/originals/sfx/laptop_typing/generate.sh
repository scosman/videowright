#!/bin/bash
# Generated SFX: Laptop typing
# Prompt: Laptop keyboard typing, soft chiclet keys, proficient typist at fast steady cadence, close-mic, dry no reverb, clean and crisp
# Duration: 3.0s
# Prompt influence: 0.4

set -euo pipefail

# Walk up from CWD to find a .env (repo may be nested under a workspace root)
DIR="$PWD"
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$DIR/.env"
    set +a
    break
  fi
  DIR=$(dirname "$DIR")
done

if [ -z "${ELEVENLABS_API_KEY:-}" ]; then
  echo "Error: ELEVENLABS_API_KEY not set. Add it to .env" >&2
  exit 1
fi

SLUG="laptop_typing"
OUTPUT_DIR="audio/originals/sfx/${SLUG}"
mkdir -p "${OUTPUT_DIR}"

curl -sS -X POST "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Laptop keyboard typing, soft chiclet keys, proficient typist at fast steady cadence, close-mic, dry no reverb, clean and crisp",
    "duration_seconds": 3.0,
    "prompt_influence": 0.4
  }' \
  --output "${OUTPUT_DIR}/audio.mp3"

echo "SFX saved to ${OUTPUT_DIR}/audio.mp3"
