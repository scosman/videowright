---
title: Risograph
slug: risograph
picker_description: 'Two-color screen-print on warm paper. Pink + ink-blue, visible grain, stop-motion cadence.'
font_sources:
  - https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap
  - https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap
mood: [playful, tactile, indie, energetic, warm]
good_for:
  - Creative tools, design products
  - Indie launches with personality
  - Brand-forward consumer products
  - Anything that wants charm without going corny
bad_for:
  - Enterprise / serious B2B
  - Fintech, security, infra
  - Anything technically dense
tags: [print, two-color, grain, indie, playful, type-led]
references: [It's Nice That, riso zines, modern indie design studios]
---

# Risograph — STYLE.md

## Identity

A two-color screen-print aesthetic on warm uncoated paper. Fluorescent pink and ink blue, with paper showing through. Visible grain. Slight color-channel misregistration on display type. Motion has a stop-motion cadence — stepped easing, 6–8 frames per move, like flipping through a riso-printed zine.

This is the *personality* template. Type-led, opinionated, alive. It's the right choice when a script wants to feel like a small studio made it on a Saturday.

**Mood:** playful, tactile, indie, energetic, warm.

## When to use

- Creative tools, design products
- Indie launches with personality
- Brand-forward consumer products
- "We're not corporate" launches

## When to avoid

- Enterprise / serious B2B
- Fintech, security, infrastructure
- Anything technically dense or specification-heavy

## Layout principles

- **Big type, asymmetric.** Display type is the protagonist. Lines wrap dramatically. Some lines are intentionally angled (-2° to -6°).
- **Type bleeds.** Display type runs into the edge of the safe area or off-canvas.
- **Layering.** Type on top of duotone color shapes, or two type elements overlapping with one in pink, one in blue. Don't fear overlap.
- **Paper grain everywhere.** A subtle noise/grain layer is permanent.
- **Misregistration on heavy display type only.** Pink ghost 3px offset to the right; blue layer on top. Not on body. Not on icons.

## Color application

- Cream paper bg, ink-blue fg.
- **Pink accent** for kinetic emphasis, key words, large shapes.
- **Yellow** (`--color-second`) sparingly — for a third punctuation note on at most one scene per video.
- Solid fills only. No gradients. No glow.

## Type rules

- **Display: Archivo Black** (heavy display sans, free, similar to Druk Wide). For everything large. Sizes 64–280.
- **Body: Archivo** (regular & medium). 22–34px.
- **Mono: JetBrains Mono.** For numbers and labels only.
- Lowercase headlines are fair game (alongside Title Case). Lean expressive.
- Misregistered display: render the text twice in absolute-positioned siblings — pink layer offset by `--misreg`, blue on top.

## Motion principles

- **Stop-motion stepped.** `steps(6, end)` or `steps(8, end)` easing. Things jump-cut into position.
- **Color flashes.** A frame of pure pink may flash for 80ms between scenes.
- **Type bounces in chunks.** A whole word "stamps" into position in 4–6 frames.
- **Grain breathes.** The grain layer shifts subtly every 200ms (re-randomized).
- **Scene transitions:** **stamp-cut** — old scene flashes pink, new scene snaps in.
- **Ambient layer:** grain noise drift; a small repeating motif (asterisk, star, arrow) ticks in a corner.
- **Forbidden:** smooth easing, gradients, glow, blur, drop shadows, anything "pro."

## Pacing

Brisk. 3.5–4s per scene. Stop-motion cadence keeps energy up.

## Per-scene recipes

| Scene | Recipe |
|---|---|
| **Title** | Huge misregistered display title (one word per line). Pink star/asterisk stamps in. |
| **Section** | Big chapter number (pink) overlapping the section title (blue). Tilted -3°. |
| **Kinetic** | Sentence stamps in word-by-word. Last word in pink at 1.5× size. |
| **Bullet** | Each item is its own riso row: pink number, blue text, optional yellow tag chip. Hand-stamped feel. |
| **Stat** | Huge pink stat number; misregistered. Caption in blue body underneath in a slim column. |
| **Feature** | Left: a riso-style cut-paper illustration (blob shape + pink overlap). Right: heavy display name + body. |
| **Grid** | 3 cards, each with a duotone shape on top and display name beneath. Different shape per card. |
| **UI showcase** | Product UI redrawn flat in two colors — solid fills, no gradients, slightly misregistered. |
| **Content** | A short paragraph in body. One phrase highlighter-marked (pink rectangle behind text). |
| **CTA** | Massive CTA in misregistered display. Pink star stamps. URL in mono beneath. |

### Connective elements

- **Lower third:** `★ scene 4 ★` in pink, stop-motion ticking
- **Scene transition:** pink flash → snap
- **Ambient:** grain drift, small repeating ★ motif in corner

## Pitfalls

- **Don't overdo misregistration.** Display type only. Body, icons, labels stay clean.
- **Don't use more than 3 colors per scene.** Even with yellow available, two is usually right.
- **Don't smooth-fade.** Stamp-cut everything.
- **Don't use rounded corners.** Print doesn't have them.
- **No emoji.** Riso glyph set: ★ ◆ ● ► ▲ ✱ ➜
