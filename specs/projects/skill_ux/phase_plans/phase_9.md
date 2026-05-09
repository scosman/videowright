---
status: in-review
---

# Phase 9: Style Pack -- Animated Explainer

## Overview

Design and ship the Animated Explainer built-in style pack at `skill/assets/styles/animated-explainer/`. This is the fourth and final built-in style pack. Animated Explainer is described as "illustrative, generous motion, friendly typography" -- think Duolingo, Headspace, Apple lifestyle videos. Warm, inviting, slightly playful, clear narrative. The pack should lean heavily into motion (staggered entrances, gentle bounce/spring, animated shapes) while keeping a professional tone.

The pack consists of three files: STYLE.md (frontmatter + aesthetic rules), tokens.css (CSS custom properties), and sample-segment/index.ts (a working segment showcasing the style). The sample segment must demonstrate the style's illustrative character and generous motion vocabulary -- animated SVG-style shapes, spring/bounce easings, staggered choreography, and warm friendly typography.

## Steps

1. **Create `skill/assets/styles/animated-explainer/STYLE.md`** -- write the style guide with frontmatter (title, slug, picker_description, font_sources for Nunito + Source Serif 4 from Google Fonts) and body sections (When to use, Aesthetic rules, Motion vocabulary, Don'ts). The aesthetic should define a warm, approachable visual language with rounded shapes, soft colors, and personality-driven typography.

2. **Create `skill/assets/styles/animated-explainer/tokens.css`** -- define CSS custom properties on `:root`. Include the 6 recommended tokens (--color-bg, --color-fg, --color-accent, --font-display, --font-body, --font-mono) plus extended tokens for the full palette: warm surface tones, soft accent variations, illustration colors, generous spacing scale, large rounded radii, spring/bounce motion easings and durations.

3. **Create `skill/assets/styles/animated-explainer/sample-segment/index.ts`** -- a working segment that demonstrates the Animated Explainer style's illustrative character, warm palette, generous motion, and friendly typography. Must:
   - Default-export via `defineSegment`
   - Have a `voiceover` field
   - Use `ctx.waitForNext()` for at least one beat
   - Reference tokens via `var(--color-accent)` etc.
   - Show animated SVG-style shape compositions (circles, rounded rectangles, organic blobs)
   - Include generous motion: staggered entrances with bounce/spring easings
   - Use the Nunito + Source Serif 4 font pairing
   - Import nothing from outside its own pack folder

4. **Run automated checks** -- typecheck, lint. Fix any issues.

## Tests

- Typecheck passes with the new TypeScript files included in the project.
- Lint passes (biome check).
- No automated unit tests needed for style content (per architecture section 11). The consolidation step will handle test updates.
