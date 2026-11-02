# Motion Engineering — brand rationale

Why the tokens in `tokens.css` are what they are. `STYLE.md` says how to use them.

## The idea

A live engineering instrument. The frame is a measuring device first and a page second: a grid you could take readings from, a HUD that acquires its subject, values that count like a display. Two colors do two jobs (amber signals, cyan measures) so the viewer always knows where to look and what kind of thing they are looking at.

## Palette

- **Canvas `#0a0e14`** — a cool charcoal, not black. Pure black crushes in H.264 and makes the grid look printed on nothing; a slight blue lift lets the cyan lines feel native to the surface.
- **Surfaces `--surface-1..3`** — three small lifts (≈ +5% luminance each). Depth comes from many quiet steps plus a hairline and an edge highlight, not from big contrast jumps.
- **Type `#e6f5fa` → `#a6bccb` → `#6f8798`** — cyan-white, then two receding steps. All three clear 4.5:1 on the canvas at 22px, so the receded step is still readable. The ladder is how focus moves: the newest thing is fg, what came before steps down.
- **Amber `#ffb547`** — the HUD signal. Warm against a cold field, so a single amber element wins the frame without being large. Its rarity is the point.
- **Cyan `#5bd8f5`** — measurement. Dimension lines, rulers, readouts. It reads as "data about the thing" rather than "the thing".
- **Status `--ok` / `--warn`** — for pass/fail only, so they never dilute amber.
- **Grid `rgba(91,216,245,.05/.10)`** — present at rest, never louder than a hairline. Majors are twice the minors; registration crosses at the major intersections make it an instrument grid rather than graph paper.

## Type

- **Archivo** (Omnibus-Type, OFL) for display, body and labels. Its width axis (62–125%) is the whole system in one family: expanded display (112%) has the stance of aerospace livery and instrument placards; normal width keeps sentences readable; fully expanded tracked caps (125%) make HUD labels that read at 22px. One family across three widths looks engineered; three families would look assembled. It ships tabular and lining figures, a slashed zero and case-sensitive forms. Space Grotesk was the obvious alternative and is overused for "tech"; Archivo is sturdier at 240px and far more legible small.
- **JetBrains Mono** (OFL) for code, terminals and readouts: tall x-height, open apertures and unambiguous `0O1lI` at 28px, and broad coverage (box drawing, blocks, arrows) for terminal mockups. Its coding ligatures (`calt`) are removed from the bundled file so code looks like a real terminal by default.
- **ME Symbols** — a subset of Noto Sans Symbols 2 and Noto Sans Symbols (OFL) for the glyphs neither face has: ✓ ✗ ⏺ ⎿ ✻ ★, media and geometric shapes, spinner frames. It sits second in every font stack, so writing `SYNCED ✓` never silently falls back to a system font.
- All three are bundled as subset `woff2` files with `font-display: block`, and samples await `document.fonts.load()` in `mount()`. No frame is ever captured in a fallback face.
- **Scale** — numeral 420, hero 256, display 200 / 150, headings 96 / 72, large readout 56, body 48 / 36, mono 28, labels 22px. The big steps are sized from real compositions (a 420px section number, a hero line that spans ~80% of the safe width) rather than a ratio; the small end is set by the floors (display 120, headings 72, body 36, mono 28, labels 22) for a phone-size view of a 1080p frame. There is no step below 22px on purpose.
- **Tracking** — display slightly tight (−0.02em) because expanded faces open up at size; labels wide (+0.16em) because small caps need air.

## Space and the grid

- **40px cells, 160px majors.** 1920 and 1080 are both multiples of 40, and 960 is a multiple of 160, so a major line runs through the frame centre both ways and the frame edges land on lines. The grid is anchored to the frame, never to content, so every scene's grid shares the same pixels: cuts and wipes read as one instrument changing readouts.
- **The grid is a scale.** Charts and rulers use it directly (one cell = one unit) whenever the data allows. The stat sample's bars are measured in cells.
- **Safe frame.** Content lives in 160–1760 × 140–940 (83% of the width, on major lines). The HUD frame sits at 80 / 60, on grid intersections, and its readouts live in the band between, so chrome and content can never collide.
- **Radii** are small (2 / 6 / 12px): machined, not soft.

## Depth and light

- A lit grid plane (edge falloff mask) that follows the camera at 60%, so the content floats a little above it; a cyan key light pooled behind each scene's focal point; a vignette that takes the corners to about half brightness; and static grain. Together they make the frame read as a lit surface rather than a flat fill.
- The grid answers the content: when a lock lands, the registration crosses around it brighten and decay. It is the only thing the plane does besides the slow scan.
- Grain is a white speckle in 3px blocks that lifts the canvas 0–6 levels. Coarse enough to survive H.264 (about 1.5–2 levels of visible texture), white-only so it barely touches light type.
- The vignette, key light and grain are pre-baked PNGs without dithering. Renders capture every frame as a PNG screenshot, and full-frame dithered gradients or per-pixel noise cost several times more per frame to encode for no visible gain.
- Glow is reserved for strokes, bars and marks (amber locks, the current step, the key bar): a 1px core, a 14px halo and a 42px bloom. It reads as an emissive display element rather than a drop shadow. Type never glows; glowing display type looks like a template.
- Surfaces get a top-lit gradient, a hairline border, a 1px edge highlight and a deep soft shadow (`--elev-1..3`), so panels float above the grid plane.

## Motion

- **Draw → fill → annotate → breathe** mirrors how an instrument acquires a reading: structure, then the subject, then the measurement, then the live state.
- **Expo-out settles** (`--ease-settle`) give arrivals a fast, decisive move and a long precise landing, the feel of a servo, not a spring. **Eased draws** (`--ease-draw`, in-out) make strokes feel plotted. There is no bounce anywhere: overshoot reads as imprecision.
- **Numbers tick** in 50ms steps with a decelerating progress, like a display counting, instead of a smooth tween that reads as animation.
- **The living frame** (camera drift, the running timecode, the grid scan) keeps every frame alive at a lower amplitude and contrast than any content motion, so it supports the focal point instead of competing with it.
- **Transitions**: the cyan sweep is the signature (the instrument redrawing its readout; cyan because it is the instrument measuring, which leaves amber to the content); the push moves only the content through a fixed instrument, for going deeper; hard cuts are for hooks. The grid stays continuous through all of them.
