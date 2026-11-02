---
status: complete
---

# Phase 4: Gallery + live dev

## Overview

Add beats 3 and 4 to `demo_v2`:

- `v2-web-tech-gallery`: four real web technologies under one persistent claim, each switching on its VO cue with the style's signature sweep: a self-drawing SVG gear train, real ECharts (canvas), a lit Three.js scene with the real Lottie rocket, and a shadcn-style Acme app driven by a camera and a cursor.
- `v2-interactive-dev`: Claude Code on the left (~40%) and a browser on the dev server on the right (~60%). The prompt types in, the agent edits files, and on "reloads" the off-brand card hot-reloads into the real title card. That card is the same `title-lockup` component as beat 2, playing its reveal.

Also in this phase: the Phase 3 code-review carry-over (a cut-off HUD decode leaves scrambled text), a new `me-split` transition into the split screen, the timing for both beats, their tests, and the PLAN.md log.

This phase builds on Phases 1–3 (94da1bd, 9fd55b5, 37f1126). Clean room: no v1 segment, video, component or render is opened. `rocket-launch.json` is the only v1-era asset used, copied byte for byte.

## Steps

1. **HUD fix** (`components/v2/hud.ts`):
   - In `decode()`, the abort check becomes `if (opts.signal?.aborted && !claimed) return false;`. An aborted signal drops only a decode that has not started writing. A decode that has started always finishes, so the persistent HUD never freezes on scrambled characters.
   - Update the `DecodeOptions.signal` and `HudState.signal` docs to match.

2. **Kit additions** (`components/v2/`, importing `videowright`, relative paths, and the demo's declared library dependencies):
   - `sweep.ts`: `sweepReveal(host, incoming, outgoing, opts: { x0, x1, y0, y1, delay?, duration? }): number`. The signature sweep, local to a region: a cyan beam with a tick ruler crosses x0 → x1, the incoming layer is revealed behind it (clip-path), and the outgoing layer dims. Used by the gallery's sub-beat switches. `sweepDown(...)` is the vertical variant, used by the browser's hot-reload refresh.
   - `browser.ts`: `createBrowser(host, { x, y, w, h, url, theme: "dark" | "light" })` returns `{ root, viewport, setUrl(url), hmrBadge(text, at) }`. This is browser window chrome (traffic dots, back/forward/reload, URL pill) around a viewport element. The HMR badge is a Vite-style pill in the viewport corner.
   - `agent.ts`: `createAgentPane(host, { x, y, w, h, cols })`. A windowed Claude Code session for split screens. It reuses `terminal.ts`'s `tui` fragments and `.v2-term` colours on a fixed row grid, plus `wrapColumns(text, cols): string[]` (word wrap, pure, unit-tested). It returns `{ root, line(r, html), clear(r), input: { setText(text), setRow(r), caret } }`. The input box grows with wrapped lines.
   - `dispose.ts`: `disposeWhenDetached(node, dispose)`. This polls on (virtualised) timers until the node leaves the document, then disposes it. A WebGL renderer or an ECharts instance is freed after the transition has cleared the slot, never in `unmount()`, so the outgoing frame never changes.
   - `assets/fonts/inter-variable.woff2` + `INTER-OFL.txt` (Inter, latin, OFL, from `@fontsource-variable/inter` 5.3.0), with an `@font-face` in `v2.css`. Inter is the Acme app's own face: a real product's UI type, not the instrument's. `fonts.ts` awaits it with the others.

3. **`transitions/me-split.ts`** (registered as `"me-split"` in `videowright.config.ts`): the signature sweep split in two. A cyan rule draws down the incoming scene's split line (read from `[data-split-x]`, default centre). Then two beams travel outward from it, revealing the incoming scene behind them, while the outgoing dims. The rule lands exactly on the incoming split screen's divider, so the transition ends as the divider. ≤ 700ms. It reverses for backward navigation, and restores everything it changes.

4. **`segments/v2-web-tech-gallery/`** (`index.ts` plus per-demo modules `gears.ts`, `charts.ts`, `space.ts`, `app.ts`, and a byte copy of `rocket-launch.json`):
   - Layout. The left rail (x 160–600) holds the claim "If the browser can render it, Videowright can animate it." on four lines, on screen from frame 1 to the exit. Below it is a 4-step progress spine whose items are the technology labels (`01 Animated SVG`, `02 ECharts`, `03 Three.js + Lottie`, `04 Product UI`): the current item is amber, done items are cyan, upcoming items are muted. The demo viewport fills x 660–1760 × y 140–940 (overflow clipped), and each demo uses all of it.
   - SVG: a procedurally drawn gear train with pitch circles, centre marks and cyan dimension callouts. The strokes draw in (staggered), the bodies fill, then the gears turn meshed (WAAPI rotations whose speeds follow the tooth ratios).
   - ECharts (canvas renderer, `devicePixelRatio: 1`, styled in the style's palette with Archivo/JetBrains Mono at ≥ 22px): a streaming area chart, a bar chart and a donut. They animate in, then live-update on a schedule driven by `ctx.clock()`.
   - Three.js: a lit, faceted planet (seeded displacement, vertex colours, key and rim lights, a Fresnel atmosphere) with an orbit ring and a satellite. A clipping-plane scan reveals the solid behind its cyan wireframe. A rAF loop renders from `ctx.clock()`.
   - Lottie: the rocket (`lottie_light`, svg renderer, `autoplay: false`), driven by `goToAndStop(ms, false)` from `ctx.clock()`. Its start is derived from the "Lottie" cue so the launch frame (f56) lands on the word.
   - App: a shadcn-style Acme Inc app in a light browser window, at legible scale (Inter). Dashboard KPIs tick up and the chart draws. The cursor clicks Customers, the table rows land, the cursor clicks "Add note" on a row, the note types in, then Send, and a toast confirms. The camera frames regions inside the viewport (translate/scale on the demo layer, zoom ≤ 1.3) and rests before the payoff.
   - Advances (each 0.15s before its word): "any" (→ charts), "advanced" (→ 3D + Lottie), "Three.js" (lock on the planet), "Lottie" (lock on the rocket), "even" (→ app), "rendered" (→ Customers), "If" (Send + toast), "Videowright" (the claim lock: corners on the claim and the HUD reports), exit before "Request". Sub-beat choreography between cues uses fixed micro-timings. A cue arriving early completes any pending step first. Timing that must fit a window is derived from the segment's own advances.
   - HUD: `showHud({ beat: 3, total: 8, section: "Web tech" })`, delayed to land with the push's arrival. The probe reports each technology (e.g. `ECHARTS 6.1 · CANVAS 2D`).
   - `unmount()` only lets loops stop. The WebGL renderer and the ECharts instances are disposed via `disposeWhenDetached`.

5. **`segments/v2-interactive-dev/index.ts`**:
   - The stage plus the HUD (`04 / 08`, "Live preview"). The agent pane is on the left (x 120–780, `data-split-x` on its right edge) and the browser on the right (x 812–1800, URL `localhost:5173/video/demo#/title-card/0`). The browser's 16:9 viewport holds a nested, scaled stage that shows the off-brand draft ("VideoRight" / "Video Agent Tool", in a generic system sans, plain) from frame 1.
   - The prompt `update the title card to our latest branding (name, tagline, design guide, colors), and add some motion` types from the start ("Request"), wrapping in a growing input box.
   - Cue "and": Enter. The prompt echoes into the transcript and the agent streams `⏺ Updating segments/title-card.ts, styles/tokens.css…` with a spinner.
   - Cue "reloads": `✓ Done. Hot-reloaded.` The HMR badge pops, a refresh sweep runs down the viewport, and the viewport shows the real title card (`createTitleLockup` at the viewport's scale, on a mini stage) playing `reveal()`.
   - It holds on the result (~2.5s) to the exit before "One". A gentle camera moves the eye from the input to the browser and back to identity by the exit.

6. **Timeline and audio timing**:
   - `timeline.ts` appends `{ id: "v2-web-tech-gallery", transition: "me-push" }` and `{ id: "v2-interactive-dev", transition: "me-split" }`.
   - `voiceovers/v1/voiceover.ts` and `tracks/v1/track.ts` gain both segments. Every cued advance sits 0.15s before its cue word in `timing.json` (3-decimal values, so each lead is exactly 0.150s). The track timing equals the VO timing for both, since only the cold open absorbs the VO's placement. Each segment's own `advances` equal the track's.
   - Add `echarts` (^6.1.0) to the demo's `package.json`.

7. **PLAN.md**: a dated Phase 4 log entry (design decisions, departures from the Direction and why).

8. **Render, look, iterate** into `/tmp/review/phase4/`:
   - a low-fps render of the timeline so far, with contact sheets;
   - full-res stills at each VO cue in the two new beats;
   - 60fps strips across title→gallery, each gallery sub-beat switch, gallery→interactive-dev, and the hot-reload swap;
   - a 60fps mp4 with audio of the new beats;
   - a determinism check: render twice, losslessly, and compare raw gallery frames.

   Fix what is seen. Then write the self-critique (in the return summary) and act on its top items.

9. **Checks**: `source specs/projects/demo_v2/tools/env.sh && ./checks.sh`.

## Tests

`packages/lib/test/unit/demo_v2_kit.test.ts`:
- `HUD decode finishes a decode its segment aborted mid-way`: start, run partway, abort, run on, expect the full text.
- `HUD decode drops a decode aborted before it starts`: the existing "stops once its segment's signal aborts" test, kept as is.
- `wrapColumns wraps at word boundaries within the column count` (long words split, no line over `cols`, round-trips the text).
- `gear train meshes`: adjacent gears' centre distance equals the sum of their pitch radii, angular speeds follow the inverse tooth ratio with alternating direction, and each driven gear's phase puts a gap on the line of centres where its neighbour has a tooth.
- `v2 sources ...`: the source rules (22px floor, no `Math.random` / SMIL) now cover every `.ts` file under `segments/v2-*/` and `transitions/me-split.ts`. Imports allow `videowright`, relative paths and the demo's declared dependencies (`echarts`, `three`, `lottie-web`) only.

`packages/lib/test/integration/demo_v2.test.ts`:
- `loads with the built v2 segments in order`: the four ids, the cut into the title card, `me-push` into the gallery, `me-split` into live dev; `me-split` is registered in the config and its file exists.
- `render pre-flight`: covers all four segments.
- `track timing is the voiceover timing shifted by the VO's placement`: unchanged rule, over four segments.
- `advances land on their VO cues`: extended. The gallery's nine advances and live dev's three are each anchored 0.15s before their words ("any", "advanced", "Three.js", "Lottie", "even", "rendered", "If", "Videowright", "Request"; "and", "reloads", "One"), from `timing.json` and the snapshot's VO placement.
- `the gallery's Lottie is the byte-identical allowed asset`, and `the demo declares echarts`.
