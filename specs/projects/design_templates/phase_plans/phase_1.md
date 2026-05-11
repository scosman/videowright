---
status: complete
---

# Phase 1: Foundation + Editorial Mono

## Overview

Delete the 5 old style packs (modern, retro, bauhaus, animated-explainer, placeholder). Set up the new folder shape for editorial-mono: STYLE.md with extended YAML frontmatter (subsuming meta.json), tokens.css, brand.md, reference/, and 10 sample/<scene>.ts files. Update hello_world to point at editorial-mono. Rewrite the test file to parameterize over STYLE_PACKS x SAMPLE_SCENES with ["editorial-mono"]. Update all skill docs (styles.md, project_structure.md, setup_new_style.md, new_video.md, create_or_edit_video.md, voiceover.md, voiceover/style_intake.md) to reflect the new conventions and use editorial-mono as the example slug. Mode 4 hardcoded message lists only Editorial Mono at end of phase.

## Steps

1. **Delete old packs.** Remove `packages/lib/skill/assets/styles/modern/`, `retro/`, `bauhaus/`, `animated-explainer/`, `placeholder/` entirely.

2. **Create editorial-mono pack folder.** Build `packages/lib/skill/assets/styles/editorial-mono/` with the new folder shape:
   - `STYLE.md` — copy body verbatim from `videowright_design/templates/editorial-mono/STYLE.md`, prepend YAML frontmatter (title, slug, picker_description, font_sources, mood, good_for, bad_for, tags, references) derived from `meta.json`.
   - `tokens.css` — copy verbatim from `videowright_design/templates/editorial-mono/tokens.css`.
   - `brand.md` — copy verbatim from `videowright_design/templates/editorial-mono/brand.md`.
   - `reference/scenes.html` — copy verbatim from `videowright_design/templates/editorial-mono/reference/scenes.html`.
   - `reference/animations.jsx` — copy verbatim from `videowright_design/templates/editorial-mono/reference/animations.jsx`.

3. **Author 10 sample segments.** Create `sample/title.ts`, `sample/section.ts`, `sample/kinetic.ts`, `sample/bullet.ts`, `sample/stat.ts`, `sample/feature.ts`, `sample/grid.ts`, `sample/ui-showcase.ts`, `sample/content.ts`, `sample/cta.ts`. Each follows the canonical skeleton from architecture.md §4.1, uses editorial-mono tokens, has id `editorial-mono-sample-<scene>`, voiceover, waitForNext, and references at least one of the 6 recommended core CSS vars.

4. **Update hello_world.** 
   - `timeline.ts`: import path to `editorial-mono/tokens.css`, replace `placeholder-sample` segment id with `editorial-mono-sample-kinetic`.
   - `PLAN.md`: style = editorial-mono, notes updated, segment outline updated.
   - `README.md`: replace placeholder-sample references.
   - `voiceover/script.md`: replace `## placeholder-sample` heading and VO line with `## editorial-mono-sample-kinetic` and appropriate VO.

5. **Rewrite test file** (`packages/lib/test/unit/skill_files.test.ts`):
   - `STYLE_PACKS = ["editorial-mono"]`
   - Add `SAMPLE_SCENES` constant.
   - Update folder-shape assertion to check brand.md, reference/scenes.html, reference/animations.jsx, and all 10 sample/*.ts.
   - Update per-sample assertions: defineSegment, voiceover, waitForNext, recommended token usage, id matching, import containment.
   - Update hello_world tests to expect editorial-mono.

6. **Update skill docs:**
   - `references/styles.md` — folder structure, example slugs, sample/ shape.
   - `references/setup_new_style.md` — Mode 4 list (only Editorial Mono), copy behavior, sample/ paths.
   - `references/project_structure.md` — styles/ tree, defaultStyle example, naming examples.
   - `references/new_video.md` — generic phrasing for default style.
   - `references/create_or_edit_video.md` — sweep for hardcoded slugs.
   - `references/voiceover.md` — replace `modern` in example code.
   - `references/voiceover/style_intake.md` — sweep (no slug refs found).

## Tests

- All existing tests in skill_files.test.ts pass with the new STYLE_PACKS and SAMPLE_SCENES.
- "pack folder exists with required files" asserts brand.md, reference/, and all 10 sample files.
- Per-sample tests assert defineSegment, voiceover, waitForNext, recommended token reference, id format, import containment.
- hello_world tests assert editorial-mono import path and segment ids.
- STYLE.md frontmatter assertions continue for title, slug, picker_description, font_sources.
- tokens.css 6-recommended-token assertion continues.
- Lint/format/typecheck pass.
