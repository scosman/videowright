---
status: complete
---

# Phase 5: Iso Diagram

## Overview

Adapt the Iso Diagram template into the skill assets folder as a fully compliant style pack. This is the pencil-and-paper explainer aesthetic with paper background, graphite lines, pastel fills, handwritten display (Caveat), and SVG `stroke-dashoffset` draw-on animations as the central motion vocabulary. All 10 sample segments, reference files, brand.md, tokens.css, and STYLE.md frontmatter are authored. The test list and Mode 4 message are updated.

## Steps

1. Create `packages/lib/skill/assets/styles/iso-diagram/` directory structure with `sample/` and `reference/` subdirectories.
2. Author `STYLE.md` with YAML frontmatter (title, slug, picker_description, font_sources, mood, good_for, bad_for, tags, references) prepended to the verbatim STYLE.md body from `videowright_design/templates/iso-diagram/STYLE.md`.
3. Copy `tokens.css` verbatim from `videowright_design/templates/iso-diagram/tokens.css`.
4. Copy `brand.md` verbatim from `videowright_design/templates/iso-diagram/brand.md`.
5. Copy `reference/scenes.html` and `reference/animations.jsx` verbatim from `videowright_design/templates/iso-diagram/reference/`.
6. Author 10 sample segments in `sample/`:
   - `title.ts` — Handwritten title with SVG stroke draw-on. Wavy underline draws below. Small iso cube in corner with faces filling after outline.
   - `section.ts` — Big handwritten chapter number "02" with section title below. Curly underline draws on via SVG stroke-dashoffset.
   - `kinetic.ts` — Sentence in handwriting, words appearing one at a time with slight rotation. Last word circled with a hand-drawn ellipse (SVG stroke draw-on).
   - `bullet.ts` — Each item has a hand-drawn checkbox (SVG rect + check draw-on). Underline scribbles beneath each item.
   - `stat.ts` — Big handwritten number with concentric hand-drawn circles (SVG stroke draw-on). Arrow leader line to caption. Number ticks up via ctx.hold.
   - `feature.ts` — Left: isometric drawing (stacked blocks with SVG outlines drawing on, then pastel fills flooding). Right: handwritten feature name + body description. Curly leader line with label.
   - `grid.ts` — 3 iso mini-diagrams in a row, each with a hand-drawn SVG box frame. Labels underneath. Each cube draws outline then fills.
   - `ui-showcase.ts` — Exploded isometric view: 4 flat diamond layers stacked vertically, outlines draw on then fills flood. Labels appear on leader lines.
   - `content.ts` — Body paragraph with one phrase underlined via SVG draw-on. Small iso cube cluster to the right with curly leader line.
   - `cta.ts` — Hand-drawn rectangle draws itself via SVG stroke-dashoffset. CTA text fades inside. Small iso icon below.
7. Add `"iso-diagram"` to `STYLE_PACKS` in `packages/lib/test/unit/skill_files.test.ts`.
8. Add Iso Diagram to the Mode 4 hardcoded message in `packages/lib/skill/references/setup_new_style.md`.

## Key design decisions

- **SVG stroke-dashoffset draw-on is the signature motion.** Every scene uses at least one SVG element whose outline draws itself on using WAAPI on `stroke-dashoffset` (from total path length to 0). This is render-safe because it uses the Web Animations API, not per-frame JS mutation.
- **Fills flood in after outlines.** Pastel fill elements are initially transparent and animate opacity via WAAPI with a delay after their outline stroke completes.
- **Labels swing in.** Text labels animate with slight rotation + opacity + translateY via WAAPI — matching the `LabelIn` pattern from the reference.
- **Paper canvas with dot grid.** Every scene has a `--color-bg` background with a faint radial-gradient dot grid at ~10% opacity.
- **Isometric drawing convention.** 30-degree projection iso cubes/shapes are inline SVG with separate top/left/right face polygons. Outlines draw on first via `stroke-dashoffset`, then fills fade in.
- **Handwritten display font.** Caveat for all display text, Nunito for body, JetBrains Mono sparingly for measurements.
- **Easing.** `cubic-bezier(0.34, 1.2, 0.64, 1)` (soft overshoot) matching `--ease-out` from tokens.
- **Number ticker.** The stat scene uses `ctx.hold()` loop for discrete text changes (same justified pattern as other packs).
- **Render-safe.** All motion is WAAPI + CSS. No `setTimeout`, no hold-driven mutation loops except the stat counter.

## Tests

- Existing parameterized tests automatically cover iso-diagram once added to STYLE_PACKS:
  - pack folder exists with required files (STYLE.md, tokens.css, brand.md, reference/, sample/)
  - STYLE.md has required frontmatter fields
  - tokens.css defines the 6 recommended tokens
  - Each sample uses defineSegment, voiceover, waitForNext, references recommended tokens
  - Each sample has id matching iso-diagram-sample-<scene>
  - Each sample imports nothing from outside its own pack folder
