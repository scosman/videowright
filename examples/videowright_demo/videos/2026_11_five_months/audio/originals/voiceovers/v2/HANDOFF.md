# Voiceover v2 (round 2's narration, one take) — portal handoff

> Status: waiting for the take.

The whole round-2 narration in one take, except the voice beat's two lines (their own takes,
received: voice_then and voice_now). Paste `paste.txt` (ElevenLabs format, `[pause]` tags
intentional). Eleven v4, Cosman-1, speed 1.00, stability 50, similarity boost 75. Send back the MP3
and the Speech-to-Text JSON export (raw.mp3, raw_stt.json for this folder). Then:
`node audio/assemble.mjs && node audio/sync.mjs && node audio/mix.mjs` from the video folder.
