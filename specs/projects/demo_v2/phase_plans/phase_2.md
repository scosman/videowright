---
status: complete
---

# Phase 2: Style completion

## Overview

Finish the upgraded `motion-engineering` pack on top of Phase 1's foundation (commit 94da1bd): the last five samples (`feature`, `grid`, `ui-showcase`, `content`, `cta`), fresh `reference/scenes.html` and `reference/animations.jsx`, the picker blurb and README note, and the Phase 1 review carry-over (`setup_new_style.md` Mode 2 leaves `fonts/` and `textures/` behind). Everything is synced to the demo project, the full 10-sample reel is rendered through the transitions, and the user gets a 10-sample contact sheet (FYI).

Clean room: the five pre-upgrade samples (pack, demo copy, `segments/motion-engineering-sample-{feature,grid,ui-showcase,content,cta}`) and both pre-upgrade `reference/` files are overwritten without being read. `styles/motion-engineering-legacy/` is never opened.

The new samples keep Phase 1's world: the same inlined kit (identical in all ten files), the same fictional product (Apogee 2.0, a build pipeline), the same HUD chrome (`S0N / 10`, scene label, timecode, probe, `GRID 40 PX`), the same motion grammar (draw → fill → annotate → breathe, release on the last cue), each scene with its own scan phase and key-light focal point.

## Steps

1. **Kit addition (all ten samples).** Add one helper to the inlined kit, used by every new scene, and re-copy the kit block into the five Phase 1 samples so all ten stay identical above `// ── Scene`:
   - `panelIn(stage, panel, delay): SVGRectElement` — a `.me-panel` measures itself in: its outline (an SVG rect on the panel's offset box, `--hairline-strong`) draws with `--ease-draw`, the surface fills behind it top-down (`clip-path` inset with `--ease-settle`, opacity riding along), then the drawn outline fades into the panel's own border. Returns the outline.
   - `boxOf(el)` — the element's box in stage px from the `offset*` chain up to `.me-content` (camera- and player-scale-independent).
   - Scene-local helpers stay in the scene section (camera framing in `ui-showcase`, typing in `cta`).

2. **`sample/feature.ts`** (`S06 / 10`, "Feature"; VO "The task graph knows what changed. Edit one file, and only its path rebuilds. Everything else replays from cache."; advances ≈ [2.4, 5.4, 7.8, 8.4]):
   - Left column: kicker decodes, h1 "Only what / changed / rebuilds." rises line by line, body rises.
   - Right: a `.me-panel` (x 840–1760, y 180–900) with a title bar (`apogee build`, `5 TASKS`) and a two-column task DAG (`cli.ts → build:cli → test:cli`, `cache.ts → build:core → test:core`, both into `bundle`). Panel draws, edges draw top-down, nodes fill.
   - Cue 1: reticle locks on `cache.ts`, a leader callout "CHANGED · 1 file" (amber), the signal travels down the changed path (edges and node outlines turn amber in order, each node's status goes running → ✓), a second callout at `bundle` ticks "REBUILT 3 of 5 · 2.1 s".
   - Cue 2: the untouched tasks replay: cyan ✓ marks land fast in sequence, the probe reads the cache hits; amber marks stay on the changed path (the subject).
   - Release cue.

3. **`sample/grid.ts`** (`S07 / 10`, "Grid"; VO "One config, six targets. Linux, macOS and Windows. And new in two point oh: WebAssembly."):
   - h1 "Six targets. One config." rises on frame 1; six `.me-panel` cells (3 × 2, 480 × 240, on major lines) draw their frames in reading order.
   - Cue 1: cells fill in reading order: target label decodes, build time ticks (h1 numerals, tabular), a cyan bar measures it on a shared 12 s scale, `✓ PASS` decodes.
   - Cue 2: the `wasm32` cell becomes the signal: registration corners lock on, its value and bar turn amber, `NEW IN 2.0` decodes, the grid flares, the other cells recede to ~50%.
   - Release cue (corners let go; the amber cell stays).

4. **`sample/ui-showcase.ts`** (`S08 / 10`, "UI showcase"; VO "Every run is a live instrument. Find the critical path in a click. Then watch the cache do the work."):
   - A product window (x 160–1760, y 160–920) at legible scale (labels ≥ 22px, mono ≥ 28px): title bar (`apogee.cloud / runs / 4182`), sidebar nav, run header (`Run #4182`, branch chip, `✓ PASSED`, wall time), a task waterfall (six rows on a time axis, cached rows hatched cyan, run rows solid) and two KPI cards (cache hits, CPU saved). Window draws, fills, bars grow.
   - Camera framing: a scene-local `frame(rect, ms)` animates the individual `translate` / `scale` properties of `.me-world` (and 60% of the move on `.me-grid`), composing with the ambient `transform`; it starts and ends at identity.
   - Cue 1: the camera frames the waterfall; a crosshair travels to `test:core`, clicks (ring pulse), the bar turns amber, a popover rises: "Critical path · 4.8 s".
   - Cue 2: the camera pans to the cache card; the crosshair follows; the hit rate ticks to 94%; the grid flares.
   - Release cue: the camera rests to identity, the crosshair and popover let go.

5. **`sample/content.ts`** (`S09 / 10`, "Content"; VO "Your whole pipeline is one typed file. Builds cache remotely. Tests shard across eight runners. And every bundle is deterministic."):
   - A code panel (x 160–860) with a title bar (`apogee.config.ts`), a line-number gutter and 14 lines of 32px mono revealed line by line (masked rises, tight stagger); restrained syntax tones (keywords muted, keys fg, values fg-2).
   - Right column: h2 "One file. / Whole pipeline." rises.
   - Cues 1–3: the line (`cache: "remote"`, `shards: 8`, `deterministic: true`) gets an amber gutter mark and band and its value turns amber; a node locks at the line end, a leader draws across the panel edge, and the margin annotation (22px label + 36px body) rises at its end. The previous annotation, line and leader recede (amber → cyan, ~50%).
   - Release cue.

6. **`sample/cta.ts`** (`S10 / 10`, "CTA"; VO "Apogee two point oh is available today. One command to start. Your first cached build, in two minutes."):
   - The title's lockup returns at the title's position ("Apogee 2.0" hero on the x = 160 line, kicker decoding): a match with `title`. Registration corners lock onto it.
   - An input-style `.me-panel` (full safe width) draws: amber prompt `❯`, a 56px mono action line, a `⏎ RETURN` key chip.
   - Cue 1: `npx apogee@2 init` types in (clock-driven, stepped, caret blinking on a steps() WAAPI loop).
   - Cue 2: `✓ READY` decodes in the panel and the closing line rises.
   - Release cue: annotations let go, the camera rests; only the ambient layer (timecode, scan, caret) keeps moving — the calm final state.

7. **`reference/scenes.html`**: a static, browsable sheet that links `../tokens.css` and uses the `me-*` classes: palette and type-scale swatches, the HUD vocabulary (corner frame, registration corners, crosshair, dimension line, ruler, leader callout, readouts), and the settled final frame of each of the ten scenes, each a 1920 × 1080 stage scaled to fit.

8. **`reference/animations.jsx`**: a React reference of the motion vocabulary, Biome-clean (so the demo copy can be byte-identical): token readers, `useClock`, and components `<RiseLines>`, `<Decode>`, `<TickNumber>`, `<DrawStroke>`, `<CrosshairLock>`, `<DimensionLine>`, `<LeaderCallout>`, `<Release>`, plus a `MotionVocabulary` board. All durations and easings read the tokens; numbers tick on `--dur-tick`; decode is seeded.

9. **`STYLE.md`**: replace the five prospective scene recipes with what the samples do; add `panelIn` / `boxOf` to the kit list; document region framing (individual `translate` / `scale` on `.me-world`, 60% on `.me-grid`) under Camera; describe the reference files.

10. **Docs**:
    - `setup_new_style.md`: Motion Engineering picker line = the pack's `picker_description`. Mode 2 copies the whole `styles/<slug>/` folder (including `fonts/`, `textures/` and any other asset folders that `tokens.css` references); Mode 4's file list names `fonts/` and `textures/`; the `font_sources` edge-case row says `font_sources` is provenance only and fonts render when bundled in `styles/<slug>/fonts/` with `@font-face` + relative URLs in `tokens.css`.
    - `styles.md` folder tree: optional `fonts/` and `textures/`.
    - README: the built-in styles note says Motion Engineering has been upgraded.

11. **Sync**: copy `STYLE.md`, `brand.md`, `tokens.css`, `fonts/`, `textures/`, all ten `sample/*.ts` and `reference/*` into `examples/videowright_demo/styles/motion-engineering/`; copy each sample to `segments/motion-engineering-sample-<scene>/index.ts`.

12. **Render, look, iterate**: each new sample alone (`render_review.sh segments:<id>`, 10fps) → sheets and stills at each cue; fix; then the ten-sample reel through `me-sweep`, `me-push` and `cut` → contact sheets, a 10-sample `samples_sheet.png`, stills, `strip.sh` across every transition. Output in `/tmp/review/phase2/`. Self-critique and act on the top items.

13. **Checks**: `source specs/projects/demo_v2/tools/env.sh && ./checks.sh` clean.

## Tests

`packages/lib/test/unit/motion_engineering_pack.test.ts`:
- The per-sample checks (font await in `mount`, no `Math.random` / SMIL) and the 22px floor scan cover all ten samples.
- `every sample inlines the same kit`: the source above `// ── Scene` is identical across the ten samples.
- `every me-* class used is defined in tokens.css`: classes used by the samples, `scenes.html` and `animations.jsx` all exist in `tokens.css`.
- `scenes.html links the pack's tokens.css` and covers all ten scenes.
- `the setup picker line matches picker_description` for Motion Engineering.
- The demo-copy sync check includes `reference/*`.

`packages/lib/test/unit/skill_files.test.ts` (`setup_new_style.md`):
- `Mode 2 copies the whole style folder, including fonts/ and textures/`.
- `Mode 4 lists fonts/ and textures/ among the copied files`.
- `the font_sources edge case does not claim fonts are unbundled`.
