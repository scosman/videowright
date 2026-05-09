---
title: Animated Explainer
slug: animated-explainer
picker_description: Warm, illustrative, motion-rich. Friendly typography, soft colors, and generous animation for educational and narrative content.
font_sources:
  - https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap
  - https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap
  - https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap
---

# Style: Animated Explainer

## When to use

Use for educational content, onboarding walkthroughs, narrative explainers, product tours, and anything that needs to feel approachable and human. Animated Explainer works best when you want the audience to feel guided rather than presented to -- think "a knowledgeable friend explaining something" rather than "a keynote deck."

## Aesthetic rules

- **Warm light foundation.** Background is a soft warm white (#faf7f2), never stark pure white. Surfaces use cream and light sand tones to create depth without coldness.
- **Soft, purposeful color.** The accent palette is warm coral (#e8614d) paired with supporting tones -- soft teal, golden amber, muted lavender. Colors are saturated enough to feel lively but never neon. Each color should feel like it was picked from a children's book illustration.
- **Nunito for headlines and UI.** Rounded terminals give headlines a friendly, approachable character. Use 700-800 weight for impact, 600 for subheadings. Letter-spacing stays at default or slightly positive (0.01em) -- never tighten.
- **Source Serif 4 for body copy.** A humanist serif that adds warmth and readability for longer text. Use 400 weight for body, 600 for inline emphasis. The serif/sans pairing creates a "storybook meets product" feel.
- **Fira Code for technical callouts.** When code, data, or labels appear, Fira Code keeps the friendly round feel while staying clearly monospaced.
- **Rounded everything.** Border radii are generous: 16px for cards, 24px for panels, full-round for badges and small elements. Avoid sharp corners entirely -- they break the approachable feel.
- **Illustrative shapes over photography.** Prefer SVG-style compositions: circles, rounded rectangles, organic blobs, simple iconography. Shapes should feel hand-placed, not grid-snapped. Slight rotation (1-3 degrees) and offset positioning add visual warmth.
- **Generous sizing.** Headlines run large (3-5rem). Spacing between elements is deliberately roomy. The layout should never feel cramped -- white space is a feature, not waste.

## Motion vocabulary

- **Bounce entrances are the signature.** Elements enter with a spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) that overshoots slightly and settles. This single detail distinguishes Animated Explainer from every other style. Duration 500-700ms.
- **Stagger generously.** When multiple elements appear, stagger them by 120-200ms. The stagger should feel like a cascade, not a burst. Reading-order stagger (top to bottom, left to right) is the default.
- **Scale from center.** The primary entrance transform is `scale(0) to scale(1)` for shapes and icons, combined with opacity. Text enters via `translateY(30-40px)` with opacity -- text should slide, shapes should pop.
- **Rotate into place.** Decorative shapes may rotate slightly during entrance (0 to final rotation of 3-8 degrees). Combines with scale for a playful "landing" effect.
- **Hold for comprehension.** After a group of elements enters, hold 400-600ms before the next group. Let the audience read and absorb. Pacing is slower than Modern or Bauhaus.
- **Gentle pulse for emphasis.** A slow scale oscillation (1.0 to 1.04 to 1.0, 2s loop) can draw attention to a key element after it has entered. Use sparingly -- one pulsing element per composition maximum.
- **Exit by fading.** Exits are simple: opacity to 0 over 300ms, optionally with a slight `translateY(-10px)`. No bounce on exit -- the energy is in the entrance.

## Don'ts

- Do not use sharp corners (radius < 12px) on any visible element.
- Do not use linear easing for entrances. Every entrance should have personality -- spring, ease-out, or a custom curve.
- Do not overload the color palette. Three colors per composition maximum (accent + one supporting + neutrals).
- Do not rush the pacing. If an entrance sequence feels fast, add more hold time between groups. The audience should never feel hurried.
- Do not use heavy drop shadows. If shadows are needed, keep them very soft (large blur, low opacity, warm-tinted).
- Do not use all-caps text except for very short labels (2-3 words maximum). The friendly tone is undermined by shouting.
- Do not animate font properties (size, weight, spacing). Animate position, scale, opacity, and rotation only.
- Do not place elements on a strict grid. Slight asymmetry and organic placement reinforce the illustrative feel.
