---
status: in-review
---

# Phase 6: Style Pack -- Modern

## Overview

Design and ship the Modern built-in style pack at `skill/assets/styles/modern/`. This is the first of the four built-in style packs. Modern is described in the functional spec as "clean, tech-product polish, sans-serif, restrained motion, plenty of whitespace." The pack must look polished by 2026 design standards and serve as the default recommendation for most projects.

The pack consists of three files: STYLE.md (frontmatter + aesthetic rules), tokens.css (CSS custom properties), and sample-segment/index.ts (a working segment showcasing the style). The sample segment must be visually distinctive -- real typography pairings, layered composition, intentional micro-interactions -- not generic placeholder design.

## Steps

1. **Create `skill/assets/styles/modern/STYLE.md`** -- write the style guide with frontmatter (title, slug, picker_description, font_sources for Inter + JetBrains Mono from Google Fonts) and body sections (When to use, Aesthetic rules, Motion vocabulary, Don'ts). The aesthetic rules should define a specific, opinionated visual language: not just "clean" but exactly how clean looks in practice.

2. **Create `skill/assets/styles/modern/tokens.css`** -- define CSS custom properties on `:root`. Include the 6 recommended tokens (--color-bg, --color-fg, --color-accent, --font-display, --font-body, --font-mono) plus extended tokens for the full palette: surface colors, muted text, border colors, spacing scale, border radii, shadows, motion easings and durations. The palette should be specific and considered -- not just black/white/blue but a carefully chosen set with personality.

3. **Create `skill/assets/styles/modern/sample-segment/index.ts`** -- a ~50-100 line working segment that demonstrates the Modern style's typography, color, layout, and motion idioms. Must:
   - Default-export via `defineSegment`
   - Have a `voiceover` field
   - Use `ctx.waitForNext()` for at least one beat
   - Reference tokens via `var(--color-accent)` etc.
   - Show layered composition (not just centered text)
   - Include micro-interactions (subtle hover-like reveals, stagger choreography)
   - Use the Inter + JetBrains Mono font pairing
   - Import nothing from outside its own pack folder

4. **Verify the sample segment works with `videowright dev`** -- wire the modern style into the hello_world timeline temporarily (or create a minimal test setup) and confirm it renders correctly in the dev server.

5. **Run automated checks** -- typecheck, lint, build. Fix any issues.

## Tests

- Typecheck passes with the new TypeScript files included in the project.
- Lint passes (biome check).
- The sample segment can be loaded and rendered in the dev server without errors.
- No automated unit tests needed for style content (per architecture section 11).
