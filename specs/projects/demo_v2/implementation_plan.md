---
status: draft
---

# Implementation Plan: Demo v2

Every phase follows the clean-room rule, runs the render→look→iterate loop before code review, passes `./checks.sh`, and ends with a manager design review of the renders.

## Phases

- [ ] **Phase 1: Style foundation.**
  - Write the review tooling (`tools/`).
  - Snapshot the legacy style and pin `demo_video` to it.
  - New design system: bundled fonts, `tokens.css`, `STYLE.md` (including transitions vocabulary and recipes), `brand.md`.
  - Samples: `title`, `section`, `kinetic`, `bullet`, `stat`.
  - Sync to the demo project. Render the samples and `demo_video`.
- [ ] **Phase 2: Style completion.**
  - Samples: `feature`, `grid`, `ui-showcase`, `content`, `cta`.
  - Rewrite `reference/scenes.html` and `animations.jsx`.
  - Update the picker blurb in `setup_new_style.md` and the README note.
  - Final sync. Show the user a 10-sample contact sheet.
- [ ] **Phase 3: demo_v2 foundation + the hook.**
  - `videos/demo_v2/` (PLAN.md, script.md, timeline).
  - `components/v2/` kit (fonts, stage, hud, motion, logo, title-lockup, terminal) and `transitions/` registered in config.
  - Audio: placeholder VO + sync, typing SFX, `audio_plan.md`, track v1.
  - Segments `v2-cold-open` and `v2-title-card`, including the hard cut.
- [ ] **Phase 4: Gallery + live dev.**
  - `v2-web-tech-gallery`: SVG, real ECharts, Three.js + Lottie, app UI with camera and cursor.
  - `v2-interactive-dev`: browser kit, hot-reload into the shared title lockup.
- [ ] **Phase 5: Remaining beats.** `v2-pixel-perfect-export`, `v2-voiceover-sync`, `v2-any-coding-agent`, `v2-install-cta` (5s end hold). The full 8-segment timeline.
- [ ] **Phase 6: Whole-video polish + handoff.**
  - Polish pass: every transition checked with frame strips, plus pacing, continuity, and the legibility audit.
  - Write `voiceovers/v1/provider_script.md` (pauses tuned to the built animation) and `generate.sh`, and prepare the portal text for the user.
  - Render every video (non-regression), then the final 60fps `renders/demo_v2.mp4` with audio, and send it to the user.
- [ ] **Phase 7: New voiceover (blocked on the user's take).**
  - Ingest `raw.mp3` (+ STT JSON) → `retime check` / `apply` → sync → track v2 → switch the timeline.
  - Re-fit any segment whose beat length changed. Final re-render, and send it.
