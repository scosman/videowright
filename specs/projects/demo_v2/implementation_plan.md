---
status: complete
---

# Implementation Plan: Demo v2

Every phase follows the clean-room rule, runs the render→look→iterate loop before code review, passes `./checks.sh`, and ends with a manager design review of the renders. No PR (user decision); commit and push per phase.

**Pre-req: done.** The ElevenLabs v4 / Cosman-1 take is saved in `examples/videowright_demo/videos/demo_v2/audio/originals/voiceovers/v1/` (raw take, STT, check PASS, retimed `audio.mp3` + `timing.json`). Phase 7 is not needed unless the take is replaced.

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
  - Final sync. Send the user a 10-sample contact sheet (FYI, not a gate).
- [ ] **Phase 3: demo_v2 foundation + the hook.**
  - `videos/demo_v2/` (PLAN.md, script.md, timeline).
  - `components/v2/` kit (fonts, stage, hud, motion, logo, title-lockup, terminal) and `transitions/` registered in config.
  - Audio: ingest the v1 take (`retime check` / `apply` → sync → `voiceover.ts`), or the placeholder if it is missing. Add the typing SFX, `audio_plan.md`, and the track.
  - Segments `v2-cold-open` and `v2-title-card`, including the hard cut.
- [ ] **Phase 4: Gallery + live dev.**
  - `v2-web-tech-gallery`: SVG, real ECharts, Three.js + Lottie, app UI with camera and cursor.
  - `v2-interactive-dev`: browser kit, hot-reload into the shared title lockup.
- [ ] **Phase 5: Remaining beats.** `v2-pixel-perfect-export`, `v2-voiceover-sync`, `v2-any-coding-agent`, `v2-install-cta` (agent prompt box with `github.com/scosman/videowright`, 5s end hold). The full 8-segment timeline.
- [ ] **Phase 6: Whole-video polish + final render.**
  - Re-tune the `[[pause]]` lengths to the built animation (`retime apply` on the same take) → re-sync → rebuild the track.
  - Check every transition with frame strips, plus pacing, continuity, and the legibility audit.
  - Render every video (non-regression), then the final 60fps `renders/demo_v2.mp4` with audio, and send it to the user.
- [ ] **Phase 7: Placeholder swap (only if Phase 3 used the placeholder).** Ingest the v1 take → retime → sync → new track → switch the timeline. Re-fit any segment whose beat length changed. Re-render, and send.
