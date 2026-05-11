# Neon Terminal — Brand

## Color

**`--color-bg` `#0A0E0B`** — near-black with a faint green tint. Not pure black; warmer toward phosphor.

**`--color-fg` `#D8F3D8`** — mint-green-tinted white. The "rest" character color on a phosphor display.

**`--color-accent` `#4ADE80`** — phosphor green. Glowing accent for prompts, highlights, cursors, completion.

**`--amber` `#F59E0B`** — secondary accent. Warnings, in-progress, transitions between done and pending.

**`--color-muted` `#5A6F5C`** — desaturated moss, for ASCII chrome and secondary text.

**`--color-border` `#1F2A21`** — for terminal-window frames.

## Typography

**JetBrains Mono** everywhere. The character cell is the unit of layout.

## Motion

Stepped easing (`steps(8, end)`) gives the typing/redraw cadence of an actual terminal. Smooth cubic-beziers are forbidden.

## Glow

`text-shadow: 0 0 12px rgba(74, 222, 128, 0.45)` on accent text only. Subtle, present.
