---
status: complete
---

# Phase 3: Neon Terminal

## Overview

Adapt the Neon Terminal template into the skill assets folder as a fully compliant style pack. This is the dark-mode CRT terminal aesthetic with monospace-only typography, phosphor-green on near-black, stepped motion (`steps(8, end)`), and phosphor-glow text-shadow on accent text. All 10 sample segments, reference files, brand.md, tokens.css, and STYLE.md frontmatter are authored. The test list and Mode 4 message are updated.

## Steps

1. Create `packages/lib/skill/assets/styles/neon-terminal/` directory structure.
2. Author `STYLE.md` with YAML frontmatter (title, slug, picker_description, font_sources, mood, good_for, bad_for, tags, references) prepended to the verbatim STYLE.md body from `videowright_design/templates/neon-terminal/STYLE.md`.
3. Copy `tokens.css` verbatim from `videowright_design/templates/neon-terminal/tokens.css`.
4. Copy `brand.md` verbatim from `videowright_design/templates/neon-terminal/brand.md`.
5. Copy `reference/scenes.html` and `reference/animations.jsx` verbatim from `videowright_design/templates/neon-terminal/reference/`.
6. Author 10 sample segments in `sample/`:
   - `title.ts` — Boot sequence: prompt types, ASCII logo block, tagline. Stepped easing.
   - `section.ts` — ASCII rule types in, then section name in large mono. Stepped reveal.
   - `kinetic.ts` — Statement appears word-by-word stepped. Last word gets phosphor glow. Cursor blinks via CSS keyframes.
   - `bullet.ts` — Numbered rows `[01]`..`[05]` with status badges `[OK]`/`[··]`/`[!!]`. Stepped stagger.
   - `stat.ts` — Big number counts up digit-by-digit (stepped). Caption below in muted.
   - `feature.ts` — CLI prompt types, then feature name + description stream below. Params box.
   - `grid.ts` — Three terminal panes side-by-side, each a mini-terminal with prompt/content.
   - `ui-showcase.ts` — TUI mock with sidebar, main pane, status bar. Complex layout.
   - `content.ts` — Long text block with `> ` quote prefixes. Memo/manifesto style.
   - `cta.ts` — Install command types, large glowing headline, URL + logo mark.
7. Add `"neon-terminal"` to `STYLE_PACKS` in `packages/lib/test/unit/skill_files.test.ts`.
8. Add Neon Terminal to the Mode 4 hardcoded message in `packages/lib/skill/references/setup_new_style.md`.

## Key design decisions

- **Stepped easing everywhere**: All WAAPI animations use `steps(8, end)` easing, matching the token `--ease-out`. No smooth cubic-bezier fades.
- **Phosphor glow on accent**: `text-shadow: var(--glow)` applied to accent-colored text elements.
- **Scan lines via CSS pseudo-element**: Applied as a `::before` overlay on the scene container using `repeating-linear-gradient`. This is pure CSS, not a per-frame mutation.
- **Cursor blink via CSS @keyframes**: A `<style>` tag injected in mount() defines a `nt-blink` keyframe animation. The cursor element uses `animation: nt-blink 1s steps(2, end) infinite`. No JS mutation loop.
- **Render-safe**: All motion is WAAPI + CSS animations. No `setTimeout`, no hold-driven mutation loops (except the stat counter which uses `ctx.hold()` for discrete text changes — the accepted pattern from swiss-console).

## Tests

- Existing parameterized tests automatically cover neon-terminal once added to STYLE_PACKS:
  - pack folder exists with required files (STYLE.md, tokens.css, brand.md, reference/, sample/)
  - STYLE.md has required frontmatter fields
  - tokens.css defines the 6 recommended tokens
  - Each sample uses defineSegment, voiceover, waitForNext, references recommended tokens
  - Each sample has id matching neon-terminal-sample-<scene>
  - Each sample imports nothing from outside its own pack folder
