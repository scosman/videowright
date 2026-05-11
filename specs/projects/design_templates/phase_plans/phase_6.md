---
status: complete
---

# Phase 6: Risograph + Final Cleanup

## Overview

This is the final phase. It adapts the Risograph style pack into `packages/lib/skill/assets/styles/risograph/` and performs final project cleanup: removing the `videowright_design/` source folder, cleaning `.gitignore`, grepping for old-pack slugs, and confirming the Mode 4 message lists all 6 packs.

## Steps

### PART A — Risograph Pack

1. Create `packages/lib/skill/assets/styles/risograph/` directory structure with `STYLE.md`, `tokens.css`, `brand.md`, `reference/scenes.html`, `reference/animations.jsx`.
   - `STYLE.md`: Add YAML frontmatter (title, slug, picker_description, font_sources, mood, good_for, bad_for, tags, references from meta.json) then the existing STYLE.md body verbatim.
   - `tokens.css`: Copy verbatim from `videowright_design/templates/risograph/tokens.css`.
   - `brand.md`: Copy verbatim from `videowright_design/templates/risograph/brand.md`.
   - `reference/scenes.html`: Copy verbatim.
   - `reference/animations.jsx`: Copy verbatim.

2. Author 10 sample segments in `sample/`:
   - `title.ts` — Huge misregistered display, pink star stamp, stepped easing (`steps(6, end)`).
   - `section.ts` — Big pink chapter number overlapping section title, tilted.
   - `kinetic.ts` — Words stamp in one by one, last word in pink at larger size, misregistered.
   - `bullet.ts` — Pink-numbered rows with blue text, optional yellow tag chip.
   - `stat.ts` — Huge pink stat number, misregistered, with caption beneath.
   - `feature.ts` — Left blob shape + pink overlap, right display name + body.
   - `grid.ts` — 3 cards with duotone shapes, stamp-in.
   - `ui-showcase.ts` — Flat two-color product UI, misregistered.
   - `content.ts` — Body paragraph with pink highlighter on a key phrase.
   - `cta.ts` — Massive misregistered CTA, pink star stamps, URL in mono.
   All samples use `steps(6, end)` easing, grain layer, and misregistration on display type only.

3. Append `"risograph"` to `STYLE_PACKS` in `skill_files.test.ts`.

4. Append Risograph to Mode 4 hardcoded message in `setup_new_style.md`.

### PART B — Final Cleanup

5. Grep `packages/lib/skill/` for old-pack slugs (`modern`, `retro`, `bauhaus`, `animated-explainer`, `placeholder`) — fix any stragglers.

6. Delete `videowright_design/` source folder entirely.

7. Remove the `videowright_design/` line from `.gitignore`.

8. Run the full test suite, confirm all pass.

9. Confirm Mode 4 hardcoded message lists all 6 packs in STYLE_ROSTER order.

## Tests

- `skill_files.test.ts` "pack folder exists with required files" for `risograph` — asserts all expected files.
- `skill_files.test.ts` per-sample tests for all 10 risograph scenes — defineSegment, voiceover, waitForNext, recommended token refs, correct id, no escaping imports.
- `skill_files.test.ts` STYLE.md frontmatter test for `risograph` — title, slug, picker_description, font_sources.
- `skill_files.test.ts` tokens.css test for `risograph` — all 6 recommended tokens present.
- Full suite passes with all 6 packs in STYLE_PACKS.
