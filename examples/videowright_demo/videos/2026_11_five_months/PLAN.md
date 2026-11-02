# Plan: 5 months of progress in Claude video generation

## Purpose
- Audience: developers and AI-curious people scrolling Reddit, X and LinkedIn. The post's title carries the headline ("5 months of progress in Claude video generation").
- Takeaway: the same demo video, made by Claude twice from the same script and the same brief, five months apart, is dramatically better. Videowright is how both were made.
- The comparison: `demo_video` ("Then", made 2026-05-15/16) vs `demo_v2` ("Now", made 2026-10-31 to 11-02). 171 days. Same script, same brief; the style rebuild for v2 was also briefed as "rebuild the style with the new model making the decisions", so the model is the variable.
- Constraints / hard guidelines:
  - **Sound off by default.** Every social site autoplays muted. Every spoken line has an on-screen equivalent (the rail captions, the title, the CTA text); the voice beat shows word-timed captions and a "Sound on" chip.
  - **Then/Now must be unmistakable**, and the Then → Now transition and the position of both are the most important thing in the video (see Comparison rig).
  - Legibility at phone size (a 1920 frame shown ~390pt wide is a 0.2 scale): THEN/NOW labels ~96-110px, captions ~64px, voice-beat captions 72px+.
  - Fairness: the Then footage is shown as rendered. No desaturation, no VHS or "old" effects, no softening.
  - 1920×1080, 60fps, 16:9. About 75s including a ~5s end hold (138 spoken words, ~52s, plus the pauses; pauses can be tightened after the take).
  - CTA: the Videowright logo, "Videowright", "Build videos in Claude Code", `github.com/scosman/videowright`.

## Style
- Active style: `motion-engineering` (project default; the v2-upgraded pack).
- Notes: reuse the `components/v2/` kit (fonts, motion, stage, logo, title-lockup, sweep). No v2 HUD readouts in the comparison beats: the rail is this video's instrument. The cyan sweep is the Then → Now gesture.

## Audio intent
- Voiceover: yes. ElevenLabs v4, voice Cosman-1 (the owner's instant voice clone), for all narration. One line in ElevenLabs v2 (`eleven_multilingual_v2`, stock voice Asher, the May settings) for the voice beat's "Then".
- Sound effects: yes, light. One soft whoosh under each Then → Now sweep, low under the VO. Nothing else.
- Background music: yes. A low instrumental bed under the VO; out entirely for the voice beat (so the two voices compare cleanly), back for the CTA, resolving on the end hold.
- Notes: the comparison clips are muted (their own audio is never heard). The voice beat's narration is the example: the old voice describes itself, then the new voice answers.

## Comparison rig
One fixed layout for every Then/Now pair. Nothing moves between Then and Now except the beam.

```
┌──────────────────────────────────────────────────────────────┐
│       ┌──────────────────────────────────────────────┐       │
│       │                                              │       │
│       │        footage window · 1440×810 (75%)       │       │
│       │      THEN clip  ── beam ──▶  NOW clip        │       │
│       │                                              │       │
│       └──────────────────────────────────────────────┘       │
│       THEN  ●━━━━┿━━━━┿━━━━┿━━━━┿━━━━┿━━━━━━━━━━━━━○  NOW     │
│                    <caption: Then line / Now line>           │
└──────────────────────────────────────────────────────────────┘
```

- Footage window: 1440×810 (exactly 0.75× of the 1080p source), centred, thin border. Then and Now play in the same rect.
- Rail: THEN (left, aligned to the window's left edge) and NOW (right, aligned to its right edge), both always visible. The active one is lit (Then fg, Now amber); the other is dimmed to ~30%. Between them, the ruler from the title card: one tick per month, May to Nov, with a marker at the active end.
- Caption row: centred under the rail, ~64px. The Then line in fg-2, the Now line in fg. It swaps when the beam reaches the middle of the window.
- Then → Now: one gesture. The cyan beam sweeps left → right across the window; behind it is Now (like a progress bar). The rail marker travels THEN → NOW in lockstep, the window border turns from grey to amber behind the beam, and the caption swaps at the midpoint. ~0.6s.
- Next pair: hard cut to the next Then clip; the marker snaps back to THEN (~0.3s).
- Holds: Then at least 3s, Now at least 4s, so a muted viewer reads the caption, then looks.
- Build the rig first (on the 3D pair) and get the owner's sign-off on a render before the other beats.

## Segment outline
1. `fm-title` — "5 months of progress" / "in Claude video generation" / "Same script. Same brief. New model." The ruler draws `MAY 15` → `NOV 2` with a `171 DAYS` dimension, then slides down to become the rail as the footage window opens.
2. `fm-pair-title-card` — the two Videowright title cards. Caption: "text on a grid" → "a logo that draws itself".
3. `fm-pair-3d` — 3D + Lottie. Caption: "a spinning polygon" → "a GPU-shaded planet".
4. `fm-pair-product-ui` — the Acme app. Caption: "a dashboard that plays itself" → "an app someone's using".
5. `fm-pair-narration-sync` — the voiceover-sync beats. Caption: "synced by line" → "timed to every word" (the Now caption's words light as they're spoken).
6. `fm-voice` — no footage: a "Sound on for this one" chip, then a large waveform of the line being spoken with a playhead and 72px+ word-timed captions; emotion tags show as small amber chips (`WARMLY`, `EXCITED`). Caption: "ElevenLabs v2 · stock voice" → "ElevenLabs v4 · my cloned voice". The Asher line plays under THEN, the Cosman-1 line under NOW.
7. `fm-cta` — the v2 title lockup draws (mark + "videowright"), "Build videos in Claude Code", feature chips lighting with the VO (Animation · Styles · Voiceovers · Sound effects · Music · & more), "Free & open source", `github.com/scosman/videowright` in amber. ~5s end hold.

## Footage
- Approach: render both videos, cut short clips, play them in `<video>` driven by the segment clock. Chosen over mounting the original segments in divs (they can only play from their own start, their style tokens collide, v2's HUD binds to the nearest player host, and it would be May's code on today's library) and over iframes (the render clock only drives the top-level page).
- Needs a small library feature: a per-frame readiness barrier in the render loop (segments register pending work, e.g. a video seek, and the screenshot waits for it), plus a clip component that seeks `currentTime` from `ctx.clock()` in render mode and plays natively in dev. Document it in the skill's render-safety section.
- Clips: VP9 WebM (Playwright's Chromium has no H.264), short GOP for exact seeks, no audio. Then from the original May MP4 if the owner has it, else a fresh render of `demo_video` (pinned to the frozen `motion-engineering-legacy` style).
- Approximate source windows (final in/out points chosen in the build):

| Pair | Then (`demo_video`) | Now (`demo_v2`) |
|---|---|---|
| Title card | ≈ 9.1–14.5s | ≈ 7.8–13.8s (from the hard cut) |
| 3D + Lottie | ≈ 19.2–22.9s | ≈ 19.2–23.3s |
| Product UI | ≈ 22.9–31.8s (include the tab switch) | ≈ 24.6–29.5s (cursor → Customers → camera) |
| Narration sync | ≈ 44.4–53.7s (the edit and re-sync) | ≈ 50.2–54.3s (edit → block 06 grows) |

## Script
See `voiceover_script/script.md` (one section per segment). Provider scripts: `audio/originals/voiceovers/v1/provider_script.md` (Cosman-1, v4) and `audio/originals/voiceovers/then_asher_v2/provider_script.md` (Asher, v2).

---

## Log

### 2026-11-02 — Plan confirmed, audio handoff
- Script and comparison rig confirmed with the owner after two rounds:
  - Designed for sound off: the rail captions carry every comparison; the voice beat gets word-timed captions and a "Sound on" chip.
  - Then/Now labels and the Then → Now gesture are the priority; the rig is built and reviewed first.
  - Copy edits from the owner: "a spinning polygon" (not "icosahedron"), "a panning camera", narration sync "by line" → "timed to every word", the voice beat's narration is itself the example (old voice describes itself, new voice answers), and the CTA pitches Videowright as the open-source framework that made both videos.
  - Title card first (it is the thumbnail, and it teaches the rail: left = May = Then, right = Nov = Now).
  - Music bed: yes. SFX: light (one whoosh per sweep).
- Audio is generated by the owner in the ElevenLabs portal (no API key in the build environment). Handoffs written: `audio/originals/voiceovers/v1/HANDOFF.md`, `audio/originals/voiceovers/then_asher_v2/HANDOFF.md`, `audio/originals/music/bed/HANDOFF.md`, `audio/originals/sfx/sweep_whoosh/HANDOFF.md`.
