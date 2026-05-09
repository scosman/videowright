---
title: Modern
slug: modern
picker_description: Clean, tech-product polish. Restrained motion, generous whitespace, Inter + JetBrains Mono.
font_sources:
  - https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap
---

# Style: Modern

## When to use

Use for product demos, developer-facing content, SaaS walkthroughs, technical explainers, and anything that should feel polished but not flashy. Modern is the safe-default -- it works for most subjects and looks professional without demanding attention from the content.

## Aesthetic rules

- **Dark foundation.** Background is a deep charcoal-ink (#0a0a0f), not pure black. Surfaces lift in subtle steps (#12121a, #1a1a26) to create depth without visible borders.
- **Near-white text.** Primary text is #ededf0 -- warm enough to avoid the sterile feel of pure white on dark backgrounds.
- **Single accent color.** Electric indigo (#6366f1) for highlights, interactive elements, and emphasis. One accent per composition -- never two competing colors.
- **Inter for everything readable.** Headlines at 600-700 weight, body at 400. Letter-spacing tightened slightly (-0.01em) on headlines, default on body.
- **JetBrains Mono for code and data.** Used sparingly for technical labels, code snippets, and numeric displays. Never for body text.
- **Generous whitespace.** Minimum 2rem between content blocks. Headlines get 3-4rem above. Let content breathe -- cramped layouts break the style.
- **Subtle surface elevation.** Cards and panels lift via background color change + faint border (1px rgba(255,255,255,0.06)), not drop shadows. Shadows reserved for floating elements only.
- **8px grid.** All spacing, sizing, and positioning snaps to multiples of 8px. Exceptions allowed for optical alignment (1-2px nudges).
- **Content hierarchy through weight and size.** Headlines are large (2.5-4rem) and semi-bold. Subtext is small (0.875-1rem) and muted. The size gap between headline and body should be dramatic enough to read from a distance.

## Motion vocabulary

- **Ease-out for entrances.** Elements enter with `cubic-bezier(0.16, 1, 0.3, 1)` -- fast start, gentle landing. Duration 400-600ms.
- **Fade + slight translate.** The standard entrance is opacity 0 to 1 combined with translateY(12-20px) to 0. Keep the translate distance short -- just enough to show direction.
- **Stagger for groups.** When multiple elements appear, stagger them by 80-120ms. The stagger direction should match reading order (top to bottom, left to right).
- **No bounce, no spring.** Motion is precise and confident. Overshoot animations feel playful, which clashes with the restrained aesthetic.
- **Scale for emphasis only.** Scale animations (0.95 to 1.0) are reserved for key moments -- a title reveal, a final CTA. Never scale body text or secondary elements.
- **Opacity transitions are quick.** Pure opacity changes (no transform) should be 200-300ms. Paired with transform, match the transform duration.

## Don'ts

- Do not use gradients on text.
- Do not use more than one accent color per composition.
- Do not add decorative borders, dividers, or ornamental elements.
- Do not use rounded corners larger than 12px (--radius-lg). Keep shapes crisp.
- Do not animate font-size, letter-spacing, or font-weight.
- Do not use background images or patterns. Depth comes from layered solid surfaces.
- Do not center-align body text longer than two lines. Left-align or use a constrained max-width.
