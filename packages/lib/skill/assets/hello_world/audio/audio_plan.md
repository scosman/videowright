# Audio Plan

## Plan

No audio configured. The hello-world template ships silent — `videowright
render` produces a video-only MP4 when `default_audio_track` is unset on the
timeline. To add audio, ask videowright to generate a voiceover script from
your segments' `voiceover` fields, send it to your TTS provider (or use
ElevenLabs via the skill), then place the result in
`audio/originals/voiceovers/v1/` and build a track under `audio/tracks/v1/`.

## Log

(No entries yet.)
