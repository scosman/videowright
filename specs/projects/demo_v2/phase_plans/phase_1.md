---
status: complete
---

# Phase 1: Style foundation

## Overview

Rebuild the built-in `motion-engineering` pack's foundation to a much higher visual standard, without changing how demo v1 looks. This phase lands the review tooling every later phase uses, freezes the pre-upgrade style for `demo_video`, and builds the new design system: bundled OFL fonts that actually load, a real token system plus a small set of `me-` stage primitives in `tokens.css`, the written motion system and transitions vocabulary in `STYLE.md`, the rationale in `brand.md`, and the first five samples (`title`, `section`, `kinetic`, `bullet`, `stat`). The two signature transitions are installed in the demo project as the verified copies of the `STYLE.md` recipes, so the samples can be reviewed through them. Everything is synced to the demo project and rendered.

Out of scope (Phase 2): the `feature`, `grid`, `ui-showcase`, `content`, `cta` samples, `reference/scenes.html`, `reference/animations.jsx`, the picker blurb and the README note. Those five old samples and the reference files stay untouched (never read) until Phase 2 overwrites them; they keep working because every legacy token name survives.

## Steps

1. **Review tooling** in `specs/projects/demo_v2/tools/`:
   - `env.sh` (sourced, idempotent): resolves `REPO_ROOT`, `DEMO_DIR`, `VW_BIN`, `REVIEW_ROOT=/tmp/review`; symlinks the installed `chromium_headless_shell-*` under the revision Playwright expects in `/tmp/pw-browsers` when `/opt/pw-browsers` lacks it; rebuilds `packages/lib` when `src/**/*.ts` is newer than `tsconfig.tsbuildinfo`; defines `vw()` (CLI from the demo dir) and `worktree_hash()` (tree hash incl. uncommitted files, via a temp index).
   - `render_review.sh <target> [fps=4] [out]`: target is a slug, `samples:<style>` (that style's samples, hard cuts), or `segments:<id>[@<transition>],…`. Non-slug targets go through a throwaway `videos/_review_<name>/timeline.ts` removed on exit. Writes the MP4 and 4×4 contact sheets (640×360 tiles with a timestamp), prints the duration.
   - `stills.sh <mp4> <out> <t…>`: full-res PNGs at given seconds.
   - `strip.sh <target> <center_s> [span_s=1.2]`: renders at 30fps (cached per `worktree_hash`), tiles every 2nd frame around the moment.
   - Root `.gitignore`: add `/renders/` and `examples/videowright_demo/videos/_review_*/`.

2. **Legacy snapshot and pin** (before any style edit):
   - `cp -a examples/videowright_demo/styles/motion-engineering styles/motion-engineering-legacy` (byte-for-byte, unread).
   - `videos/demo_video/timeline.ts`: CSS import → `../../styles/motion-engineering-legacy/tokens.css`; add `meta.style: "motion-engineering-legacy"`. Line-targeted edits only.
   - Non-regression: render `demo_video` at 10fps before the upgrade and again at the end; `ffmpeg -f framemd5` both and require identical frame hashes (no frames are viewed).

3. **Fonts** → `packages/lib/skill/assets/styles/motion-engineering/fonts/`:
   - `archivo-variable.woff2`: Archivo (OFL, Omnibus-Type), `wght` 100–900 + `wdth` 62–125, subset to Latin-1 + punctuation, super/subscripts, arrows, math (− × ≈ ≤ ≥ Δ μ), misc technical; all layout features kept (`tnum`, `zero`, `case`).
   - `jetbrains-mono-variable.woff2`: JetBrains Mono (OFL), `wght` 100–800, same set plus box drawing, blocks, geometric shapes, dingbats; `calt` dropped so code renders without ligatures, like a real terminal.
   - `me-symbols.woff2`: supplement subset of Noto Sans Symbols 2 + Noto Sans Symbols (OFL) for glyphs neither face has (✓ ✔ ✗ ✘ ⏺ ⏵–⏹ ⎿ ⎋ ⏎ ✢–✧ ✱–✿ ★ ☆ ❮ ❯ geometric shapes, braille spinner frames). Second in every font stack, so `✓` never falls back to a system font.
   - `OFL.txt`: every copyright notice, the source, the modification (subsetting, merge), then the OFL 1.1 text.
   - Built with `pyftsubset` (fontTools in a temp venv) from the google/fonts TTFs.

4. **`tokens.css`** (source of truth in the pack):
   - `@font-face` for `Archivo` (`font-weight: 100 900; font-stretch: 62% 125%`), `JetBrains Mono` (`100 800`), `ME Symbols` (with `unicode-range`); all `font-display: block`, relative `url("./fonts/…")`.
   - `:root` tokens. Every legacy name (`--color-bg|fg|accent|muted|border|surface`, `--font-display|body|mono`, `--space-sm|md|lg|xl`, `--duration-fast|normal|slow`, `--radius-sm|md`, `--stagger`, `--ease-out`, `--ease-in`, `--rule-weight`, `--scene-hold`, `--safe-x`, `--safe-y`, `--cyan`, `--warn`, `--grid-line`) is defined, most as aliases of the new groups:
     - color: `--surface-0..3`, `--fg-2`, `--amber`, `--amber-dim`, `--cyan-dim`, `--ok`, `--grid-major-line`, `--hairline`;
     - type: `--type-hero|display|display-sm|h1|h2|body-lg|body|mono|label` (floors: display ≥120, headings ≥72, body ≥36, mono ≥28, label ≥22), `--stretch-display|body|label`, `--track-*`, `--lh-*`;
     - light: `--glow-amber`, `--glow-cyan` (+ `-filter` drop-shadow forms), `--elev-1..3`;
     - lines: `--line-hair|thin|bold`;
     - motion: `--ease-settle|draw|sweep|exit`, `--dur-tick|fast|normal|slow|draw|sweep|exit|ambient`, `--stagger-tight`;
     - layout: `--z-grid|content|annotation|light|grain|hud|transition`, `--grid-cell: 40px`, `--grid-major: 160px`, `--hud-x|y` (chrome inset), `--grain` (data-URI static SVG noise), `--grid-marks` (data-URI registration crosses).
   - `me-` primitives (documented in `STYLE.md`): `.me-stage`, `.me-world`, `.me-grid` (minor/major lines centred on the frame origin, registration crosses, lit falloff mask), `.me-scan`, `.me-content`, `.me-light` (vignette), `.me-grain`, `.me-hud`, `.me-frame` (corner brackets), type roles `.me-hero|display|h1|h2|body-lg|body|label|readout|mono`, `.me-line` (mask), `.me-signal`, `.me-measure`, `.me-panel`, `.me-svg`.

5. **`STYLE.md`**: frontmatter (`title`, `slug: motion-engineering`, `picker_description`, `font_sources` = the Google Fonts URLs, noting the files are bundled). Body: when to use; identity; aesthetic rules (palette roles, one accent at a time, type roles and widths, legibility floor, composition and safe frame, depth and light); stage anatomy (DOM + classes + layer order + fixed grid origin); HUD vocabulary (corner frame, crosshair lock, dimension line, leader callout, readout, decode); motion system (draw → fill → annotate → breathe, easing table, duration table, stagger rules, masked line reveals, mono decode, numbers tick, enter and release choreography, living frame and its restraint); font readiness rule; transitions vocabulary with copy-pasteable recipes for `me-sweep` and `me-push`, plus hard cut and match cut technique and when to use each; scene recipes for all 10 scene types; render-safety notes; don'ts.

6. **`brand.md`**: rationale for each token group, the font choice (Archivo's width axis as one engineered family across display/body/labels; JetBrains Mono for code and readouts; the symbols supplement; all OFL; why not Space Grotesk), the grid-as-scale idea, light and grain, and motion.

7. **Samples** `sample/{title,section,kinetic,bullet,stat}.ts`, each importing only `defineSegment` from `videowright`, `id: "motion-engineering-sample-<scene>"`, with a `voiceover` line and `waitForNext()` beats. Each inlines the same small kit (no relative imports): `tok()`, `ms()`, `fontsReady()` (awaits `document.fonts.load` for all three faces, called first in `mount()`), `buildStage(el, label)` (stage DOM from the `me-` classes + HUD chrome), `startAmbient(ctx, stage)` (one rAF loop on `ctx.clock()`: camera drift, timecode, tickers; `rest()` eases the camera to identity), `revealLines`, `drawPath`, `decode` and `tickNumber` (clock-driven, seeded, no `Math.random`). Content: one fictional product ("Apogee 2.0", a build pipeline) across all samples so the reel reads as a set.
   - `title`: hero "Apogee 2.0" on the x=160 major line, registration corners and a crosshair lock on the title box, a dimension line measuring the title's real width; subtitle on the first cue.
   - `section`: huge ticking "02", vertical rule, section title, a 5-stop progress ruler whose marker travels to stop 2 and locks.
   - `kinetic`: three stacked display lines on three cues, earlier lines dim, the last word in amber gets measured.
   - `bullet`: heading + three items on a cyan spine; each arrives on a leader line with a decoding readout; the current item is the focal point.
   - `stat`: the grid is the chart scale (1 s = one 40px cell): two bars draw with ticking readouts, then "4.2×" ticks in, with a dimension line measuring the saved 29.4 s.
   - Every sample ends with a release cue: annotations retract and the camera rests, so the transition carries the content.
   - `unmount()` only stops the rAF loop; it never alters the last frame.

8. **Transitions** in the demo project (verified copies of the `STYLE.md` recipes, byte-identical to the code blocks): `examples/videowright_demo/transitions/me-sweep.ts` (amber scanline with a measurement-tick edge; incoming revealed behind it by `clip-path`; direction-aware) and `me-push.ts` (outgoing pushes past camera while the incoming settles in from 0.88 scale). Register both in `videowright.config.ts` `transitions`. Each sets slot `z-index` for its duration and removes everything it adds.

9. **Sync**: copy `STYLE.md`, `brand.md`, `tokens.css`, `fonts/`, and the five new samples into `examples/videowright_demo/styles/motion-engineering/`; copy each new sample to `segments/motion-engineering-sample-<scene>/index.ts`. `reference/` and the five untouched samples are not copied (the demo `animations.jsx` is Biome-formatted and differs from the pack's).

10. **Render, look, iterate**: `render_review.sh segments:…` over the five samples joined by `me-sweep`, `me-push` and `cut` at 10fps → contact sheets + stills at each beat; `strip.sh` at 30fps across each transition and each entrance; fix what is seen; self-critique and act on the top items. Final: samples reel, `demo_video` render + framemd5 comparison.

11. **Checks**: `./checks.sh` clean (Biome formatting on all new TS/CSS).

## Tests

New `packages/lib/test/unit/motion_engineering_pack.test.ts`:

- `defines every legacy token name`: each of the 27 old token names appears as a `--name:` declaration in the pack's `tokens.css`.
- `every @font-face url resolves to a bundled woff2`: each `url("./fonts/…")` in `tokens.css` exists, is `.woff2`, and `fonts/OFL.txt` exists and names each bundled family.
- `font stacks put the bundled faces first`: `--font-display|body|mono` start with a bundled family and include `"ME Symbols"`.
- `no font size below the 22px legibility floor`: every `font-size: Npx` and every `--type-*` value in `tokens.css` and the new samples is ≥ 22.
- `samples await font readiness in mount`: each new sample calls `document.fonts.load` and awaits it inside `mount`.
- `samples avoid unseeded randomness and SMIL`: no `Math.random`, no `<animate`.
- `demo copy is in sync with the pack`: `STYLE.md`, `brand.md`, `tokens.css`, every `fonts/*` and every `sample/*` are byte-identical between the pack and `examples/videowright_demo/styles/motion-engineering/`, and each `segments/motion-engineering-sample-<scene>/index.ts` equals its sample.
- `STYLE.md transition recipes are the verified demo transitions`: the `me-sweep` and `me-push` code blocks in `STYLE.md` equal `examples/videowright_demo/transitions/me-*.ts`, and both are registered in the demo config.
- Existing `skill_files.test.ts` style-pack checks keep passing (frontmatter, recommended tokens, sample shape, `videowright`-only imports).
