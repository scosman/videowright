---
status: in-review
---

# Phase 7: Style Pack -- Retro

## Overview

Design and ship the Retro built-in style pack at `skill/assets/styles/retro/`. The functional spec describes Retro as "80s/90s-inspired warmth, bolder color, typographic personality." The pack should evoke VHS-era graphics, warm neon-on-dark or cream-on-warm-paper aesthetics, and expressive display fonts -- without falling into kitsch. Tasteful retro that's still 2026-quality work: distinctive, designed, and polished.

The pack consists of three files following the same structure as Modern: STYLE.md (frontmatter + aesthetic rules), tokens.css (CSS custom properties), and sample-segment/index.ts (a working segment showcasing the style).

## Steps

1. **Create `skill/assets/styles/retro/STYLE.md`** -- write the style guide with frontmatter (title: Retro, slug: retro, picker_description, font_sources for expressive display + clean body face from Google Fonts) and body sections (When to use, Aesthetic rules, Motion vocabulary, Don'ts). Font pairing: Space Grotesk (display -- geometric with personality, late-modernist warmth) + DM Sans (body -- clean, reads well at all sizes) + IBM Plex Mono (mono -- industrial, period-appropriate).

2. **Create `skill/assets/styles/retro/tokens.css`** -- define CSS custom properties on `:root`. Include the 6 recommended tokens plus extended tokens: warm surface colors, neon accent and secondary accent, gradient stops, a VHS-scan-line effect color, typography scale, spacing, radii, and retro-appropriate motion easings (slightly more energetic than Modern).

3. **Create `skill/assets/styles/retro/sample-segment/index.ts`** -- a working segment that demonstrates the Retro style's typography, color, layout, and motion idioms. Must:
   - Default-export via `defineSegment`
   - Have a `voiceover` field
   - Use `ctx.waitForNext()` for at least one beat
   - Reference tokens via `var(--color-accent)` etc.
   - Show a distinctive retro composition (neon glow headline, warm dark background, scan-line texture, bold accent bar)
   - Use the Space Grotesk + DM Sans + IBM Plex Mono font pairings
   - Import nothing from outside its own pack folder

4. **Run automated checks** -- typecheck, lint. Fix any issues.

## Tests

- Typecheck passes with the new TypeScript files included in the project.
- Lint passes (biome check).
- No automated unit tests needed for style content (per architecture section 11). The consolidation step will handle test file updates.
