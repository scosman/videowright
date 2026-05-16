# Risograph — Brand

## Color

**`--color-bg` `#F2EBDC`** — warm uncoated paper. Cream with a slight pink tilt. Reads as printed-on-stock.

**`--color-fg` `#1A2A6A`** — riso ink blue. Deep, slightly violet. Standard riso "Federal Blue" / "Blue."

**`--color-accent` `#FF4F8B`** — fluorescent pink. The signature riso flat color.

**`--color-second` `#FFC83D`** — riso yellow. The "use once per video" third color.

## Grain & misregistration

- **Grain layer:** SVG fractal noise at 18% opacity, on top of everything. Re-randomized every 200ms for a "breathing" feel.
- **Misregistration:** display type rendered twice — pink layer at `(+3px, +3px)`, blue layer on top. Body type stays sharp.

## Typography

**Archivo Black** is a free near-substitute for **Druk Wide** — the canonical riso display face. Set it tight (`letter-spacing: -0.02em`), heavy, expressive.

**Archivo** Regular/Medium for body.

## Motion

Stepped easing (`steps(6, end)`). Stamps and snaps, not slides and fades. Pink flash transitions between scenes for energy.
