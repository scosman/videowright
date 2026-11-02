---
title: Motion Engineering
slug: motion-engineering
picker_description: 'Aerospace HUD on a blueprint grid. Dimension lines, crosshairs, leader-lined callouts.'
font_sources:
  - https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap
mood: [technical, precise, industrial, mechanical, methodical]
good_for:
  - Hardware launches (robotics, drones, sensors, devices)
  - Industrial / B2B technical products
  - Explainers where annotation is the point (parts callouts, measurements)
  - AI infrastructure that wants to feel engineered
bad_for:
  - Soft consumer apps
  - Lifestyle / brand launches
  - Anything where the script doesn't have specifics to annotate
tags: [hud, blueprint, technical, annotation, dark-mode, industrial]
references: [SpaceX webcast graphics, Linear annotations, For All Mankind UI, CAD documentation]
---

# Motion Engineering — STYLE.md

## Identity

An engineering-document aesthetic — half aerospace HUD, half CAD blueprint. Charcoal canvas with a faint grid; cyan-white type; an amber HUD accent. Elements *measure themselves in*: dimension lines draw, crosshairs sweep, callouts arrive on leader lines. Every scene looks like it was extracted from a technical drawing.

**Mood:** technical, precise, industrial, mechanical, methodical.

## When to use

- Hardware launches (robotics, drones, sensors, devices)
- Industrial / B2B technical products
- Explainers where annotation is the point (parts callouts, measurements)
- AI infrastructure that wants to feel engineered

## When to avoid

- Soft consumer apps
- Lifestyle / brand launches
- Anything where the script doesn't have specifics to annotate

## Layout principles

- **Faint grid is always visible.** 8% opacity, 32px or 64px cells. The scene sits on a drawing.
- **Crosshairs and corner ticks frame the content area.** Top-left `+`, top-right `+`, bottom corners likewise. They sweep in on enter.
- **Leader lines connect labels to things.** Never float a label — connect it with a 1px line to its referent.
- **Tabular numerals everywhere.** All metrics in mono with `tnum`.
- **Coordinate readouts.** Bottom strip shows `X 1240.00 Y 360.00` ticking subtly.

## Color application

- Charcoal bg, cyan-white fg.
- **Amber accent (`--color-accent`) is the HUD signal.** Used for primary highlights, callouts, target marks, the active reading.
- Cyan (`--cyan`) for measurement lines and secondary highlights.
- Warning amber (`--warn`) for transitions / in-progress.
- Muted slate for grid labels, axes, secondary type.

## Type rules

- **Display: Space Grotesk.** Geometric, slightly mechanical. Medium weight (500). Sizes 56–200.
- **Body: Space Grotesk.** Regular (400), 20–32px.
- **Mono: JetBrains Mono.** For all numerals, coordinates, units, identifiers.
- Numerals always tabular. Units always set apart in mono at smaller size (`84` big, `mm` mono small below).

## Motion principles

- **Things draw in.** Lines extend, dimension arrows arrive at their endpoints, crosshairs sweep to position.
- **Numbers tick.** Counter-style updates, not smooth interpolation — each digit flips.
- **Stagger 50ms.** Many small staged events build up a frame.
- **Scene transitions:** crosshair-sweep wipe (a thin amber line sweeps L→R, content updates as it passes).
- **Ambient layer:** coordinate readout ticks; grid lines pulse very subtly; one crosshair on the canvas marks the camera origin.
- **Forbidden:** bounce, spring, ease-in-out for entries, fade-only without geometry.

## Pacing

Methodical. 3.5–4s per scene. Multiple measurement reveals per scene — let each one land before the next starts.

## Per-scene recipes

| Scene | Recipe |
|---|---|
| **Title** | Crosshair tracks to center on the title; dimension lines bracket it left/right showing total width; small coordinate label below. |
| **Section** | `CHAPTER 02 · SECTION TITLE` with a sweeping amber line under it. Grid intensifies briefly. |
| **Kinetic** | Sentence reveals word-by-word. Each word is bracketed top and bottom with tiny tick marks. Last word boxed in amber. |
| **Bullet** | Each item has an `[ITEM 01]` mono prefix; rows separated by hairlines; right column shows a tiny measurement (`Δ = 12.4 ms`). |
| **Stat** | Big number with dimension lines drawing above and below it showing its "size." Caption in mono with unit. |
| **Feature** | Two columns: left has a wireframe schematic with crosshair callouts; right has feature name and prose. |
| **Grid** | 3 cards, each framed with corner ticks. Inside each: small wireframe diagram + name + metric. |
| **UI showcase** | A wireframe of the product UI with amber leader-lined callouts pointing to parts. The mock looks like a blueprint of the app. |
| **Content** | Title with crosshair marker; body in two columns; one block has an inline annotation with leader line. |
| **CTA** | Target reticle centered on the CTA text; corner ticks; coordinate readout shows the URL as a coordinate. |

### Connective elements

- **Lower third:** measured bracket at bottom — `├── narration · t = 00:24 ──┤`
- **Scene transition:** crosshair-sweep wipe
- **Ambient:** coordinate ticker, grid pulse, one persistent canvas crosshair

## Pitfalls

- **Don't drop the grid.** The grid is the canvas of this style.
- **Don't float a label without a leader line.** Connect everything.
- **Don't use serifs.** Or any non-Grotesk/Mono.
- **Don't smooth-number.** Numbers tick / flip.
- **Don't use red.** Amber and cyan only.
