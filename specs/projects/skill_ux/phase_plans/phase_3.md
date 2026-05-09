---
status: complete
---

# Phase 3: Core workflow references

## Overview

Write the three core workflow reference files that make the full new-user flow run end-to-end: `references/setup.md` (gate semantics, scaffold steps, dispatch to setup_new_style for first style), `references/new_video.md` (intent capture, PLAN.md skeleton, one-shot heuristic, dispatch to create_or_edit_video), and `references/create_or_edit_video.md` (translate PLAN.md to segments + timeline, edit-mode for existing videos, verify with `videowright dev`).

## Steps

1. **Write `references/setup.md`** replacing the stub. Content per functional spec section 5 and architecture doc sections 5-6:
   - "When this is loaded" — routed from SKILL.md setup gate.
   - Gate semantics table: file missing → full setup; file exists but no defaultStyle → resume at style step; defaultStyle set → gate closed (should not be here).
   - Preconditions: `videowright` must be in `package.json`. If not, tell user to install and stop.
   - Steps: confirm intent, pick video name (default `demo_video`), pick first style (dispatch to setup_new_style.md with setAsDefault=true, copySample=true), scaffold consumer repo directories, write videowright.config.ts, copy hello-world templates, confirm.
   - Edge cases: partial setup resume, videowright not installed.

2. **Write `references/new_video.md`** replacing the stub. Content per functional spec section 7 and architecture doc section 6:
   - "When this is loaded" — routed from SKILL.md intent dispatch for "New video".
   - Inputs to capture: video name, purpose, style, audio intent, hard guidelines, script, segment outline.
   - One-shot vs. iterate heuristic: if user input already has multi-paragraph script + style/audio signals, one-shot the PLAN.md and confirm. If sparse, ask only missing questions in a single grouped round.
   - "Propose, don't interrogate" posture.
   - PLAN.md skeleton embedded as a code block (from architecture section 7).
   - Output: confirmed PLAN.md written to `videos/<name>/PLAN.md`.
   - Dispatch to create_or_edit_video.md with new-video flag after PLAN.md is confirmed.
   - Audio intent capture: voiceover/music/silent. Always ask. Explicit note that audio playback is not implemented.
   - Cross-link to setup_new_style.md when user wants a per-video style.

3. **Write `references/create_or_edit_video.md`** replacing the stub. Content per functional spec section 8 and architecture doc section 6:
   - "When this is loaded" — dispatched from new_video.md (create mode) or SKILL.md intent dispatch (edit mode).
   - Two entry modes: create (scaffold from PLAN.md) and edit (read existing PLAN.md, make change, append log).
   - Cross-links to authoring_segment.md, voiceover.md, styles.md, project_structure.md, types.md.
   - Timeline.ts top-of-file style import convention.
   - How to translate PLAN.md segment outline into segment files + timeline composition.
   - Reuse rule: top-level segments/ is shared. Don't duplicate.
   - VO field integration: voiceover field on segments, videowright script.
   - Edit-mode rules: respect existing segment ids, keep idempotency, append to PLAN.md log after changes.
   - Shared components/transitions guidance.
   - Verification step: run `npx videowright dev` and confirm video plays end-to-end.

## Tests

- No automated tests for this phase (markdown content only; no code changes).
- Typecheck still passes (no code modifications).
- Lint still passes.
