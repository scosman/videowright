# Voiceover then_asher_v2 (the voice beat's "Then" line) — portal handoff

> Status (2026-11-02): received from the owner.

The old voice, generated the way May's demo was: the stock voice Asher on the v2 model. It plays in
the voice beat under THEN, and its word timings drive that beat's captions.

## Steps

1. **Text to Speech** → model **Eleven Multilingual v2** (`eleven_multilingual_v2`), voice **Asher**
   (stock library voice, id `tMvyQtpCVQ0DkixuYm6J`), speed 1.00, stability 50, similarity boost 75
   (May's settings). No tags.
2. Paste the text below exactly. Generate.
3. Download the audio → save as `raw.mp3`.
4. **Speech to Text** → upload `raw.mp3` → **Export → JSON** → save as `raw_stt.json`.
5. Put both files in this folder: `examples/videowright_demo/videos/2026_11_five_months/audio/originals/voiceovers/then_asher_v2/` on branch `claude/quirky-keller-dcn7ld`.

## Text to paste

```
Previously, the voice was slightly robotic, and lacked any emotion cues.
```
