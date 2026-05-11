---
status: draft
---

# Phase 4: Motion Engineering

## Overview

Adapt the Motion Engineering template into the skill assets folder as a fully compliant style pack. This is the aerospace HUD / blueprint aesthetic with charcoal canvas, cyan-white type, amber accent, SVG dimension lines, crosshairs, and leader-line callouts. All 10 sample segments, reference files, brand.md, tokens.css, and STYLE.md frontmatter are authored. The test list and Mode 4 message are updated.

## Steps

1. Create `packages/lib/skill/assets/styles/motion-engineering/` directory structure.
2. Author `STYLE.md` with YAML frontmatter (title, slug, picker_description, font_sources, mood, good_for, bad_for, tags, references) prepended to the verbatim STYLE.md body from `videowright_design/templates/motion-engineering/STYLE.md`.
3. Copy `tokens.css` verbatim from `videowright_design/templates/motion-engineering/tokens.css`.
4. Copy `brand.md` verbatim from `videowright_design/templates/motion-engineering/brand.md`.
5. Copy `reference/scenes.html` and `reference/animations.jsx` verbatim from `videowright_design/templates/motion-engineering/reference/`.
6. Author 10 sample segments in `sample/`:
   - `title.ts` — Crosshair tracks to center; dimension lines bracket the title L/R showing width; coordinate label below. SVG overlays for dimension lines + crosshair.
   - `section.ts` — `CHAPTER 02 · SECTION TITLE` with amber line sweeping under. Grid intensifies briefly via opacity animation.
   - `kinetic.ts` — Words reveal one-by-one. Each word bracketed top with tick marks. Last word boxed in amber.
   - `bullet.ts` — `[ITEM 01]` mono prefix per row; hairline separators; right column shows `Δ = 12.4 ms` measurements in cyan.
   - `stat.ts` — Big number with SVG dimension lines drawing above and below. Caption in mono with unit. Number ticks up via ctx.hold.
   - `feature.ts` — Two columns: left has SVG wireframe schematic with crosshair callouts; right has feature name and prose.
   - `grid.ts` — 3 cards, each framed with corner ticks. Inside each: wireframe SVG diagram + name + metric.
   - `ui-showcase.ts` — Wireframe blueprint of app UI with amber leader-lined callouts. SVG callout lines + dots.
   - `content.ts` — Title with crosshair marker; body in two columns; one block has an inline annotation with leader line.
   - `cta.ts` — Target reticle (concentric circles via SVG); corner ticks; coordinate readout shows URL as coordinate.
7. Add `"motion-engineering"` to `STYLE_PACKS` in `packages/lib/test/unit/skill_files.test.ts`.
8. Add Motion Engineering to the Mode 4 hardcoded message in `packages/lib/skill/references/setup_new_style.md`.

## Key design decisions

- **Background grid always present**: Every scene has a faint 64px grid at 6% opacity via CSS `linear-gradient` on a pseudo-element or inline div overlay. This is the "canvas" of the style.
- **Corner ticks on framed elements**: Amber corner marks (L-shaped) on key containers, implemented as absolutely positioned `<div>` elements with CSS borders (matching the reference HTML pattern).
- **SVG dimension lines and crosshairs**: Dimension lines (horizontal/vertical with end ticks) are inline `<svg>` elements in mount HTML. Animation is WAAPI-driven via `opacity` and `transform` (e.g., `scaleX(0)` to `scaleX(1)` for line draw). No React `DrawLine` — we replicate the visual using WAAPI on SVG `<line>`/`<rect>` elements.
- **Crosshairs via SVG**: Crosshair elements use SVG `<line>` and `<circle>`. Sweep-in via WAAPI `scaleX`/`scaleY` from 0.
- **Number ticker**: The stat scene uses `ctx.hold()` loop for discrete text changes (same pattern as swiss-console and neon-terminal).
- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` matching the token `--ease-out`. No bounce or spring.
- **50ms stagger**: Multiple elements staged with 50ms delay increments matching the template's stagger token.
- **Render-safe**: All motion is WAAPI + CSS. No `setTimeout`, no hold-driven mutation loops except the stat counter.

## Tests

- Existing parameterized tests automatically cover motion-engineering once added to STYLE_PACKS:
  - pack folder exists with required files (STYLE.md, tokens.css, brand.md, reference/, sample/)
  - STYLE.md has required frontmatter fields
  - tokens.css defines the 6 recommended tokens
  - Each sample uses defineSegment, voiceover, waitForNext, references recommended tokens
  - Each sample has id matching motion-engineering-sample-<scene>
  - Each sample imports nothing from outside its own pack folder
