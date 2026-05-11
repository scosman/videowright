---
status: complete
---

# Phase 2: Swiss Console

## Overview

Adapt the Swiss Console template fully into `packages/lib/skill/assets/styles/swiss-console/`. This includes STYLE.md with frontmatter (subsuming meta.json), tokens.css, brand.md, reference/ files, and 10 sample/<scene>.ts files. Add `swiss-console` to the STYLE_PACKS test list and to the Mode 4 hardcoded message. Verify Switzer font loads via Fontshare URL.

## Steps

1. **Create swiss-console pack folder.** Build `packages/lib/skill/assets/styles/swiss-console/` with the canonical folder shape:
   - `STYLE.md` -- copy body verbatim from `videowright_design/templates/swiss-console/STYLE.md`, prepend YAML frontmatter (title, slug, picker_description, font_sources, mood, good_for, bad_for, tags, references) derived from `meta.json`.
   - `tokens.css` -- copy verbatim from `videowright_design/templates/swiss-console/tokens.css`.
   - `brand.md` -- copy verbatim from `videowright_design/templates/swiss-console/brand.md`.
   - `reference/scenes.html` -- copy verbatim from `videowright_design/templates/swiss-console/reference/scenes.html`.
   - `reference/animations.jsx` -- copy verbatim from `videowright_design/templates/swiss-console/reference/animations.jsx`.

2. **Author 10 sample segments.** Create `sample/title.ts`, `sample/section.ts`, `sample/kinetic.ts`, `sample/bullet.ts`, `sample/stat.ts`, `sample/feature.ts`, `sample/grid.ts`, `sample/ui-showcase.ts`, `sample/content.ts`, `sample/cta.ts`. Each follows the canonical skeleton from architecture.md section 4.1, uses Swiss Console's design language (strict 12-column grid, hairline rules, micro-labels, Switzer grotesk, JetBrains Mono labels, signal-red accent, slide-on-grid-rail motion with 60ms stagger, 360ms duration, no fades or serifs). IDs follow `swiss-console-sample-<scene>` convention.

3. **Add swiss-console to STYLE_PACKS.** Update `packages/lib/test/unit/skill_files.test.ts`: add `"swiss-console"` to the `STYLE_PACKS` array.

4. **Add Swiss Console to Mode 4 message.** Update `packages/lib/skill/references/setup_new_style.md`: add the Swiss Console entry to the Mode 4 built-in pack list.

## Tests

- All existing tests pass with `STYLE_PACKS = ["editorial-mono", "swiss-console"]`.
- "pack folder exists with required files" asserts brand.md, reference/, and all 10 sample files for swiss-console.
- Per-sample tests assert defineSegment, voiceover, waitForNext, recommended token reference, id format `swiss-console-sample-<scene>`, import containment.
- STYLE.md frontmatter assertions pass for title, slug, picker_description, font_sources.
- tokens.css 6-recommended-token assertion passes.
- Lint/format/typecheck pass.
