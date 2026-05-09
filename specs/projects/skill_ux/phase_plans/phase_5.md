---
status: complete
---

# Phase 5: Hello-world Reference Example

## Overview

Replace `skill/assets/hello_world/` with the new shape defined in the architecture: no `.tmpl` files, plain reference files instead. The agent is the templating engine -- it reads these reference examples and writes adaptations into the consumer repo. Also create a placeholder style at `skill/assets/styles/placeholder/` so the timeline.ts top-of-file style import convention can be verified end-to-end.

The architecture (section 1) states: "No templating engine, no variable substitution map, no `.tmpl` files. The agent is the templating engine -- it reads reference examples and writes adaptations into the consumer repo."

## Steps

1. **Create a placeholder style pack** at `skill/assets/styles/placeholder/` with:
   - `STYLE.md` -- frontmatter with `title`, `slug`, `picker_description`, `font_sources`, plus body with aesthetic rules, motion vocabulary, and don'ts. Uses the 6 recommended tokens.
   - `tokens.css` -- `:root` custom properties for the 6 recommended tokens (--color-bg, --color-fg, --color-accent, --font-display, --font-body, --font-mono) plus a few extras.
   - `sample-segment/index.ts` -- a working segment that uses `defineSegment`, has a `voiceover` field, uses `ctx.waitForNext()` for at least one beat, and references tokens via `var(--color-accent)` etc. This serves as both a style showcase and a teaching example.

2. **Rewrite `skill/assets/hello_world/timeline.ts`** (was `.tmpl`): Remove `.tmpl` extension. Convert from template with `{{placeholders}}` to a concrete reference example. Add the top-of-file style import (`import '../../styles/placeholder/tokens.css';`). Set concrete meta values (title, style slug). Include the placeholder-sample segment plus hello-intro and hello-outro in the segments array.

3. **Rewrite `skill/assets/hello_world/PLAN.md`** (was `.tmpl`): Remove `.tmpl` extension. Convert from template to a concrete reference plan with populated Purpose, Style, Audio intent, Segment outline, and Log sections.

4. **Rewrite `skill/assets/hello_world/README.md`** (was `.tmpl`): Remove `.tmpl` extension. Convert from template to a concrete reference README.

5. **Rewrite `skill/assets/hello_world/voiceover/script.md`** (was `.tmpl`): Remove `.tmpl` extension. Convert from template to a concrete reference VO script.

6. **Rewrite `skill/assets/hello_world/segments/hello_intro.ts`** (was `.tmpl`): Remove `.tmpl` extension. Convert from template to a concrete reference segment that uses style tokens via CSS variables instead of hardcoded colors.

7. **Rewrite `skill/assets/hello_world/segments/hello_outro.ts`** (was `.tmpl`): Remove `.tmpl` extension. Same token-based styling approach.

8. **Delete all `.tmpl` files** that were replaced by the new plain files.

9. **Update `references/setup.md`** to reflect that `skill/assets/hello_world/` now contains plain reference files (not `.tmpl` templates). The agent reads these as guidance and writes adapted versions, rather than performing variable substitution.

10. **Verify end-to-end**: Run typecheck and lint to confirm the new `.ts` files are valid TypeScript that imports correctly, the style import convention works, and no regressions.

## Tests

- No automated tests for skill content (markdown and reference assets). These are reference files the agent reads.
- Typecheck and lint confirm the new TypeScript files are syntactically valid.
- Manual verification: the timeline.ts imports `tokens.css` from the placeholder style, segments use CSS variables, and the overall structure matches what `setup.md` and `create_or_edit_video.md` describe.
