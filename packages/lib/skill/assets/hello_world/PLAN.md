# Plan: Hello Videowright

## Purpose
- Audience: First-time Videowright users
- Takeaway: See a working video end-to-end and understand the segment + timeline model
- Constraints / hard guidelines: Keep it short (3 segments). Showcase style tokens and voiceover fields.

## Style
- Active style: editorial-mono
- Notes: Uses Editorial Mono as a clean, content-first default. Swap to any other built-in pack or create your own.

## Audio intent
- Mode: silent
- Notes: The template ships silent so first render is video-only. The `voiceover_script/script.md` and per-segment `voiceover` fields are pre-populated to demonstrate the script workflow; add audio by sourcing a VO and building a track under `audio/tracks/v1/`.

## Segment outline
1. hello-intro -- Title card with animated entrance
2. editorial-mono-sample-kinetic -- Style showcase demonstrating kinetic typography
3. hello-outro -- Closing card with call to action

## Script (if applicable)
see voiceover_script/script.md

---

## Log

### YYYY-MM-DD -- Initial scaffold
- Created via Videowright setup flow
- 3 segments: intro, style sample, outro
- Editorial Mono style applied via timeline.ts top-of-file import
