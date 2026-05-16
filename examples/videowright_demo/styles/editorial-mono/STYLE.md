---
title: Editorial Mono
slug: editorial-mono
picker_description: 'Black ink on cream paper. One red accent. Reads like a magazine.'
font_sources:
  - https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap
  - https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap
mood: [serious, considered, literary, high-contrast, calm]
good_for:
  - AI/research lab launches
  - Fintech and B2B product introductions
  - Thought-leadership essays turned to video
  - Annual reports and investor updates
  - Long-form narrative explainers
bad_for:
  - Consumer apps that need warmth or whimsy
  - Hype reels, sizzle videos, social-media shorts
  - Anything that needs to feel fast, loud, or trendy
  - Heavily data-driven dashboards (use Swiss Console)
tags: [editorial, serif, minimal, print, high-contrast, light-mode]
references: [Bloomberg Businessweek, Stripe Press, The Browser Company, The Atlantic]
---

# Editorial Mono — STYLE.md

Agent-facing guide. Read this before composing scenes.

---

## Identity

Editorial Mono is the visual register of a thoughtful long-form magazine — *Bloomberg Businessweek*, *Stripe Press*, *The Atlantic*. Black ink on warm cream paper. High-contrast serif display set against a clean grotesk body. A single red accent, used like an editor's mark. The page breathes.

**Mood:** serious, considered, literary, calm, high-contrast.

## When to use

- AI/research launches, fintech intros, B2B product announcements
- Thought-leadership essays adapted to video
- Annual reports, investor updates, founder letters
- Long-form narrative explainers

## When to avoid

- Consumer apps that need warmth or whimsy → use Risograph
- Dev tools, dashboards, data-dense products → use Swiss Console
- Anything dark-mode native → use Neon Terminal
- Sizzle reels, social-media shorts, hype videos

---

## Layout principles

- **Anchor to the left.** Most scenes left-align headlines on a 128px safe margin. Centered layouts are reserved for title cards and section headers.
- **Generous negative space.** A scene with 30% of the canvas filled is the *norm*, not minimalism. If you find yourself filling a scene, cut content.
- **One focal element per scene.** A headline, or a stat, or a quote — never two competing equals.
- **Hairline rules as structure.** A 1px rule across the top or bottom of the safe area frames the page like a magazine.
- **Small labels carry their weight.** A `VOL. 01 / CHAPTER 03` label in mono uppercase at 14px sets the editorial register before the headline does.

## Color application

- **Cream `--color-bg` everywhere.** White (`#fff`) is forbidden — it kills the paper feel.
- **Ink `--color-fg` for all primary type.** Never pure black.
- **Red `--color-accent` appears once per scene, maximum.** Use it for: a single word emphasis, an underline draw, a small symbol, an arrow tip. Never for whole headlines, never for backgrounds.
- **Muted `--color-muted` for labels, captions, and secondary type only.**
- **Surface `--color-surface` is for the rare card or callout** — almost imperceptible against the page.

## Type rules

- **Display = Instrument Serif.** Use the italic for emphasis — its italic is iconic. Display sizes range 96–220px.
- **Body = Geist.** Medium (500) for headlines that need a grotesk; Regular (400) for body. Body sizes range 24–40px.
- **Mono = JetBrains Mono.** Uppercase, tracked +0.08em, for editorial labels only (`VOL. 01`, `CHAPTER ONE`, timestamps, page numbers). Never for body copy.
- **Line breaks for rhythm, not for width.** Break a headline at a comma or a verb, not at the edge of the column.
- **Emphasis hierarchy:** italic (serif) > color (red accent) > weight. Never underline for emphasis (reserve underline for the kinetic statement's draw-on motion).
- **No ALL CAPS in body type.** Reserve uppercase for the mono labels only.

## Motion principles

- **Entries are subtle and downward-settling.** Text fades in while drifting up 16px. Duration `--duration-normal` (480ms). Easing `--ease-out` (cubic-bezier(0.16, 1, 0.3, 1)).
- **Stagger increments at `--stagger` (80ms).** A four-item bullet list reveals over ~800ms total.
- **Exits cut.** Almost never animate out — a hard cut between scenes is faster and more print-like.
- **Scene transitions are dip-to-cream.** Fade through `--color-bg` (no white flash) for 200ms between scenes.
- **The red accent draws.** Underlines, marks, and arrows draw in left-to-right or top-down over `--duration-normal`.
- **Forbidden:** bounce, spring, overshoot, elastic. Anything that feels "designed" rather than "set."
- **Camera:** none. The page does not move.

## Pacing

Editorial Mono is **slow**. Scenes hold 3.5–5s by default. A scene with one headline and no other elements can hold 6s and feel right. If a script is fast-cut, this is the wrong template.

## Per-scene recipes

Each recipe gives sizing, max element count, and motion beat. See `reference/scenes.html` for rendered examples.

| Scene | Recipe |
|---|---|
| **Title card** | Top-left mono label (`VOL. XX / YYYY`, 14px). Centered or top-left display headline at 180–220px serif. One subtitle line at 32px Geist Regular below. Optional rule above. Headline enters 480ms after label; subtitle 80ms after headline. |
| **Section header** | Top mono label (`CHAPTER ONE`). Centered display at 140px, often italic. One rule above, one below the headline. Holds 4s. |
| **Kinetic statement** | One sentence, 80–110px serif italic, left-aligned, breaks mid-line for rhythm. One word per beat enters fading-up at `--stagger` intervals. Last word may get a red underline draw on exit. |
| **Bullet reveal** | Left rail. Mono numerals (`01`, `02`, …) in muted color. Each item: numeral + em dash + 40px Geist Medium label. Stagger 120ms (slightly longer than default — list items breathe). Max 5 items. |
| **Stat card** | One number at 320px serif, left-aligned in column 1. Right column holds 40px Geist label (1–2 lines). Number counts up over `--duration-slow` (900ms). Red underline draws under the number on hold. |
| **Feature card** | Single feature. Small icon (or numeral) top-left. Display name at 80px serif. 24px Geist body description, max 2 lines. Lots of negative space below. |
| **Card grid** | 3 items in a row, gutters at `--space-lg` (64px). Each card: small label (mono), name (40px serif), one-line description (20px Geist). Cards enter in staggered sequence. |
| **UI / product showcase** | Centered product mock at ~60% of canvas. Hairline rule frame. 1–2 callouts with arrow leaders in red, label set in mono. Arrows draw in after the mock settles. |
| **Content card** | Generic catch-all. Top-left section label (mono). Headline at 80px serif. Body paragraph at 28px Geist Regular, max-width ~900px, line-height 1.4. |
| **CTA / outro** | Top mono label optional. Central headline at 100px serif italic. Below: a call-to-action line (URL or imperative) with red accent on the destination. Logo placeholder bottom-left or centered. |

### Connective elements

- **Lower third:** mono label (uppercase, tracked) over the bottom safe area, with a hairline rule above. Used when narration runs over a held visual. Enters and exits with a fade.
- **Scene transition:** dip-to-cream (200ms) between most scenes. Hard cut allowed for emphasis.
- **Ambient layer:** none. The page does not move.

## Pitfalls

- **Don't use pure white.** Cream only. White kills the identity instantly.
- **Don't use red for more than one element per scene.** It's an accent, not a color in the palette.
- **Don't fill the canvas.** If you're tempted to add a fourth element, cut one of the first three.
- **Don't center body type.** Center headlines, never paragraphs.
- **Don't use bounce or overshoot in motion.** This style does not jiggle.
- **Don't use Title Case for body labels.** Mono labels are UPPERCASE; everything else sentence case.
- **Don't add gradients, shadows, glows, or textures.** Flat ink on flat paper.
- **Don't use emoji.** Ever.
