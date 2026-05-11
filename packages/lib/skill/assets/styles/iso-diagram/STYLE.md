---
title: Iso Diagram
slug: iso-diagram
picker_description: 'Pencil-and-paper explainer aesthetic. Hand-drawn lines, pastel fills, isometric drawings.'
font_sources:
  - https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;700&display=swap
  - https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap
mood: [explanatory, warm, thoughtful, hand-built, approachable]
good_for:
  - Concept explainers and educational content
  - Onboarding videos
  - Technical ideas that benefit from a picture
  - Products with abstract value props that need to be visualized
bad_for:
  - Hard product launches with specific UI
  - Lifestyle / brand-led launches
  - Anything that needs to feel enterprise-serious
tags: [illustration, isometric, explainer, pastel, warm, hand-drawn]
references: [Excalidraw, "Maggie Appleton's notes", "Stripe's old illustrations", Explorable Explanations]
---

# Iso Diagram — STYLE.md

## Identity

Paper background, graphite line, pastel fills. The aesthetic of a brilliant whiteboard explanation — hand-feeling but precise. Things *draw themselves on*. Fills flood in. Labels arrive on curly leader lines.

This is the *explainer* template. It's designed for scripts that *teach a concept* rather than *announce a product*.

**Mood:** explanatory, warm, thoughtful, hand-built, approachable.

## When to use

- Concept explainers and educational content
- Onboarding videos
- Technical ideas that benefit from a picture
- Products with abstract value props that need to be visualized

## When to avoid

- Hard product launches with specific UI to showcase
- Brand/lifestyle reels
- Anything that needs to feel enterprise-serious or premium-luxury

## Layout principles

- **Paper canvas.** Slight off-white. Optional very faint dot-grid (5% opacity, 32px).
- **Isometric drawings.** 30° projection. Boxes, columns, planes. Stack 3D objects with clear faces.
- **Labels float, leader lines connect.** Curly hand-drawn leader lines (a slight curve, not straight). Each label has an underline.
- **Hand-written display, set sans body.** Display in **Caveat** (handwritten), body in **Nunito** (rounded sans).
- **Generous margins.** Drawings need air around them.

## Color application

- Paper bg, graphite fg.
- One accent color per scene (pencil blue is default).
- Pastel fills (`--fill-*`) inside iso shapes. Different objects use different fills — but only 2–3 colors per scene.
- No hard saturated colors. Everything is soft.

## Type rules

- **Display: Caveat** (handwritten). For titles, headlines, kinetic words, labels on diagrams. Sizes 56–220.
- **Body: Nunito.** Regular (400) and SemiBold (600). 22–34px.
- **Mono: JetBrains Mono.** Sparingly, for measurements/coordinates only — this style isn't mono-heavy.
- Title-case headlines. Sentence-case body. Underline key words with a hand-drawn pen line.

## Motion principles

- **Strokes draw on.** SVG `stroke-dashoffset` animation. ~400–600ms per stroke.
- **Fills flood in after strokes.** A soft fill arrives 150ms after its outline closes.
- **Labels swing in.** Slight rotate + fade. ~250ms with soft overshoot ease.
- **Numbers count up.** Tickers like Motion Engineering, but with a gentler curve.
- **Scene transitions:** the next drawing "erases" the current one — a soft white-paper wipe.
- **Ambient layer:** a thin pencil "doodle" cursor occasionally appears in margins making a stray mark.
- **Forbidden:** smooth gradients, glow, blur, hard cuts, mono motion (this isn't a terminal).

## Pacing

Patient. 4.0–4.5s per scene. The drawing itself is the content; let it finish before the label lands.

## Per-scene recipes

| Scene | Recipe |
|---|---|
| **Title** | Hand-written title draws stroke-by-stroke. Underline scribble below. Small iso icon (cube, paper stack) in corner. |
| **Section** | Big handwritten chapter number "02" with the section title written below. A curly underline draws on. |
| **Kinetic** | Sentence written word-by-word in handwriting. Key word boxed with a hand-drawn ellipse (irregular oval) in accent color. |
| **Bullet** | Each item has a hand-drawn checkbox/dot-pip on the left. Underline scribbles under each. |
| **Stat** | Big handwritten number with concentric hand-drawn circles around it. Arrow leader to a caption. |
| **Feature** | Left: an isometric drawing of the concept (e.g. stacked memory blocks). Right: handwritten feature name + sans body description. |
| **Grid** | 3 isometric mini-diagrams in a row, each with a hand-drawn box around it. Labels under. |
| **UI showcase** | Isometric "exploded view" of the product — the app surface lifted off a base, with floating layered components. Curly leader-line callouts. |
| **Content** | A short paragraph in body sans with one phrase circled/underlined; an arrow points from it to a small inline drawing. |
| **CTA** | Handwritten CTA inside a hand-drawn rectangle that "draws itself." Small iso icon below. |

### Connective elements

- **Lower third:** small notebook-margin annotation — `~ scene 4 ~` in handwriting
- **Scene transition:** paper wipe / "erase" effect
- **Ambient:** occasional pencil scribble in margin, faint dot grid breathing

## Pitfalls

- **Don't make the iso drawings actually 3D-rendered.** They must look hand-built — line drawings filled with flat pastel.
- **Don't use more than 2-3 pastel colors in one scene.** Otherwise it becomes a children's book.
- **Don't keep leader lines straight.** They should curve gently.
- **Don't go cute.** Restraint is what separates this from clipart.
- **No emoji.** Hand-drawn glyphs only.
