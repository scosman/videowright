# Iso Diagram — Brand

## Color

**`--color-bg` `#FAF7F2`** — warm paper. Slight cream, not pure white. Reads as "notebook page."

**`--color-fg` `#2A2620`** — soft graphite. Not black; warmer and softer.

**`--color-accent` `#1F6FB3`** — pencil blue. The default accent — the color of a Pilot G2.

**Pastel fills:**
- `--fill-blue` `#C8DEEF` — sky
- `--fill-pink` `#F4CFCB` — coral
- `--fill-yellow` `#F5E4A8` — paper-yellow
- `--fill-green` `#C9DEC6` — sage
- `--fill-lavender` `#DCD3E8` — lavender

Use 2–3 per scene. Don't mix all five at once.

## Typography

**Caveat** — Google Fonts handwriting face. Slightly irregular, readable, warm. For all display, kinetic text, and diagram labels.

**Nunito** — soft, rounded sans for body. Plays well with the handwritten display.

## Motion

The signature motion is **drawing on**: outlines extend along their path, then fills flood. Use SVG `stroke-dasharray` + `stroke-dashoffset` for the line drawing effect.

## Pencil cursor

An invisible "pencil tip" leads each stroke as it draws. Reveal-points are paced like someone is actually drawing — not too fast.
