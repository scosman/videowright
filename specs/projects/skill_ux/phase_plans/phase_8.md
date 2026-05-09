---
status: draft
---

# Phase 8: Bauhaus Style Pack

## Overview

Create the Bauhaus style pack at `packages/lib/skill/assets/styles/bauhaus/`. The Bauhaus style draws from 1920s Bauhaus and Swiss design traditions: geometric forms, primary color palette (blue, red, yellow against off-white or black), strict grid, minimal ornamentation, and functional typography. The pack includes STYLE.md (with frontmatter + body sections), tokens.css (6 recommended tokens + extended tokens), and a sample-segment that showcases bold geometric compositions with circles, squares, and rectangles as primary visual elements.

## Steps

1. **Create `STYLE.md`** with frontmatter (title: Bauhaus, slug: bauhaus, picker_description, font_sources for Futura-adjacent Google Font — using "Jost" as the geometric sans closest to Futura on Google Fonts). Body sections: when to use, aesthetic rules, motion vocabulary, don'ts.

2. **Create `tokens.css`** defining all 6 recommended tokens:
   - `--color-bg`: off-white (#f5f0e8, warm parchment)
   - `--color-fg`: near-black (#1a1a1a)
   - `--color-accent`: Bauhaus blue (#2454a6)
   - `--font-display`: "Jost" (geometric sans, Futura lineage)
   - `--font-body`: "Jost"
   - `--font-mono`: system monospace stack
   Plus extended tokens for the primary palette (red #c93a3a, yellow #e8b828), grid spacing, and motion curves.

3. **Create `sample-segment/index.ts`** — a working segment using `defineSegment` with:
   - `voiceover` field describing the Bauhaus aesthetic
   - At least one `ctx.waitForNext()` call
   - Bold geometric composition: large circles, rectangles, and squares in primary colors arranged on a strict grid
   - Typography using Jost at display sizes with tight tracking
   - Confident use of negative space
   - Motion: precise geometric transitions — elements sliding into grid positions, shapes scaling from center, color blocks revealing

## Tests

- NA — tests are owned by a separate consolidation step per project instructions.
