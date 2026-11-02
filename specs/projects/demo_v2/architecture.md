---
status: complete
---

# Architecture: Demo v2

This is a content project, not a framework project. All new code is segments, components, transitions, and style assets written against the existing public API (`defineSegment`, `Timeline`, `Transition`, `Voiceover`, `AudioTrack`). Read the skill references for the API (`packages/lib/skill/references/authoring_segment.md`, `types.md`, `audio/**`). The **clean-room rule** in the functional spec governs what you may read.

## File layout

```
packages/lib/skill/assets/styles/motion-engineering/     # SOURCE OF TRUTH (ships in npm)
  STYLE.md  brand.md  tokens.css
  fonts/*.woff2  fonts/OFL.txt                            # new: bundled, latin subset
  reference/scenes.html  reference/animations.jsx
  sample/{title,section,kinetic,bullet,stat,feature,grid,ui-showcase,content,cta}.ts

examples/videowright_demo/
  videowright.config.ts                                   # + transitions map
  package.json                                            # + echarts
  styles/motion-engineering/                              # byte-identical copy of the pack
  styles/motion-engineering-legacy/                       # frozen pre-upgrade snapshot (demo_video only)
  segments/motion-engineering-sample-*/index.ts           # re-copied from the new samples
  components/v2/                                          # demo_v2 kit (not part of the style pack)
    fonts.ts          awaitFonts(): document.fonts.load() for every face used; awaited in mount()
    stage.ts          createStage(el, opts): world root, grid plane, light/vignette/grain, HUD chrome, camera
    hud.ts            decode (mono readouts), tickTo (ticking numbers), release; showHud/hideHud (persistent HUD chrome)
    motion.ts         easing/duration constants (mirroring tokens), small WAAPI helpers
    logo.ts           Videowright mark (inline SVG) + wordmark; drawIn(); sizes
    title-lockup.ts   the beat-2 title composition as a component: mount at any scale, reveal(), showFinal()
    terminal.ts       terminal window + Claude Code TUI: typeLine, streamLine, spinner, paste chip
    browser.ts        browser window chrome (URL bar, HMR badge slot)
    assets/videowright-mark.svg
    assets/fonts/outfit-*.woff2 (+ OFL.txt)               # wordmark face, only if the style doesn't already ship it
  transitions/
    me-sweep.ts       signature wipe: amber scanline sweeps, incoming revealed behind it
    me-push.ts        camera push-through
    (others as the design needs; each registered in config)
  segments/v2-{cold-open,title-card,web-tech-gallery,interactive-dev,
               pixel-perfect-export,voiceover-sync,any-coding-agent,install-cta}/index.ts
  segments/v2-any-coding-agent/icons/{claude,codex,opencode}.svg   # copied assets
  segments/v2-web-tech-gallery/rocket-launch.json                  # copied asset
  videos/demo_v2/
    PLAN.md  timeline.ts  voiceover_script/script.md
    audio/audio_plan.md
    audio/originals/voiceovers/v1/
      provider_script.md  generate.sh  HANDOFF.md        # written during speccing
      raw.mp3  raw_stt.json                              # supplied by the user (portal)
      audio.mp3  timing.json  voiceover.ts               # produced in Phase 3 (retime apply + sync)
    audio/originals/voiceovers/placeholder/...           # ONLY if the v1 take is missing at Phase 3
    audio/originals/sfx/laptop_typing/{audio.mp3,sfx.ts}
    audio/tracks/v1/{track.ts,track.mp3,plan_snapshot.md}

specs/projects/demo_v2/tools/      # review tooling (not shipped)
  env.sh  render_review.sh  stills.sh  strip.sh
renders/                           # gitignored; final MP4s
```

Why components live in `components/v2/` rather than in the style pack: pack samples must be self-contained, because they get copied into consumer repos. The kit is this project's own toolkit, built *on* the style's tokens. The samples may inline simplified versions of the same primitives.

## Style pack technical design

- **Fonts.** Each `@font-face` uses `src: url("./fonts/<file>.woff2") format("woff2")` and `font-display: block`. Vite resolves relative `url()` inside the CSS that `timeline.ts` imports, in both dev and render. Get the files from `@fontsource/*` npm packages (latin subset) or the Google Fonts CSS API. Both are reachable here. Weights: only those the system uses.
- **Font readiness.** Each sample's `mount()` does `await document.fonts.load('<weight> 64px "<Family>"')` for each face it uses, before building DOM that depends on metrics. (`components/v2/fonts.ts` does the same for demo_v2.)
- **Tokens.** All legacy names are kept (see the functional spec, Part A item 2). New groups are additive: `--type-*` (scale), `--surface-*` / `--elev-*`, `--glow-amber`, `--glow-cyan`, `--line-hair|thin|bold`, `--ease-settle|draw|sweep`, `--dur-*`, `--z-*`, `--grid-cell`, `--grain` (data-URI static noise).
- **Grain and grid** are static CSS (repeating gradients plus a data-URI noise PNG or SVG). No SMIL and no animated GIFs, per the render-safety rules.

## Demo-v2 technical design

### Stage and world (`stage.ts`)

`createStage(host, { beat: 2, total: 8, section: "TITLE" })` returns `{ world, content, hud, camera }`:

- **Layer order:** `grid` → `content` → `light` (vignette/falloff) → `grain` → `hud`. The grid and content sit inside `world`, which the camera transforms. HUD chrome is outside the camera, so it stays fixed.
- **Fixed grid origin.** The grid is drawn with the same cell size and origin in every segment, so at rest two segments' grids align pixel-for-pixel. A cut or wipe then shows "same paper, new drawing".
- **Camera.** `camera.drift(ms)` gives a slow ambient push or drift. `camera.frame(rect, ms, ease)` moves to frame a region of interest (used by the app UI and terminal pull-back). `camera.rest(ms)` eases back to identity. Implemented with WAAPI on `world` with `fill: "forwards"`.
- **Camera rule at boundaries:** a segment's first frame is at camera identity, and it must be back at identity (or masked by the transition) by its exit, so grids never visibly jump across a wipe.
- **Beat 1 exception:** `v2-cold-open` is full-bleed terminal with no stage chrome, so the hard cut reveals the stage world for the first time.

### Transitions

- These are `Transition` functions in `transitions/`, registered in `videowright.config.ts`, e.g. `transitions: { "me-sweep": () => import("./transitions/me-sweep.ts") }`. They are referenced from `timeline.ts` entries, either as a string or as `{ type, duration }`.
- **Player facts to design around** (from `packages/lib/src/player/index.ts` `transitionTo`):
  - The incoming segment is mounted and its `play()` starts *before* the transition runs, so its entrance choreography plays during the transition.
  - The outgoing segment's `unmount()` is called *before* the transition. Its DOM stays in the slot until the transition finishes.
- **Rule: `unmount()` must not change what the outgoing frame looks like.** Don't cancel visual WAAPI animations, don't clear the DOM or canvases, and don't force WebGL context loss. Only stop loops (rAF, intervals), drop listeners, and dispose GPU/Lottie resources in ways that leave the last bitmap visible. Verify each transition with a frame strip.
- Transitions run on the render clock (WAAPI). Keep them ≤700ms. Their time comes out of the incoming segment's first beat.
- `v2-title-card`'s timeline entry uses `transition: "cut"`, the mandated hard cut.

### Timing model

- **VO cues use `waitForNext()`.** Holds are only used inside a beat. Each segment's `advances` default approximates the placeholder VO, so the segment plays sensibly in dev on its own. The active voiceover's `timing.perSegment` overrides them.
- **Planned advance points.** The builder may add more, but each must map to a VO word:

| Segment | Advances (each = a `waitForNext` or the final exit) |
|---|---|
| v2-cold-open | exit (the cut). Internal choreography on holds, tuned so `Video is ready` lands before the VO ends. |
| v2-title-card | exit |
| v2-web-tech-gallery | "Any" (→charts), "Advanced" (→3D+Lottie), "Even" (→app), optional "If" (app payoff), exit |
| v2-interactive-dev | "reloads" end (HMR swap), exit |
| v2-pixel-perfect-export | "It's" (determinism visual), "Not" (optional), exit |
| v2-voiceover-sync | "The pace" (line 2), "Edit" (line 3 + edit), exit |
| v2-any-coding-agent | exit |
| v2-install-cta | exit (≈5s after the last VO word) |

- **Sync** follows `packages/lib/skill/references/audio/voiceover/sync_algorithm.md`. Anchor each advance 0.15s before its cue word. Track timing equals voiceover timing shifted by the VO's placement offset in the track (the cold-open absorbs the lead-in).
- **Sub-beat proportional timing** (e.g. app-UI phases inside one advance window) must derive from the advance window, not hard-coded absolute times, so a new VO take re-scales cleanly.

### Library integrations

- **ECharts:** add `echarts` to the demo `package.json`. Use the canvas renderer. ECharts animates through rAF and `Date`/`performance`, all virtualized by the render shim. Verify determinism once: render twice and compare frame hashes over the chart window. Dispose in `unmount()` (`chart.dispose()` clears the canvas, so defer it until after the transition, e.g. queue it for when the slot content is cleared, or skip dispose and rely on DOM removal).
- **Three.js:** a rAF loop reading `ctx.clock()`, lit scene. Same unmount caveat.
- **Lottie:** `autoplay: false`, driven by `goToAndStop(ms, false)` from `ctx.clock()`.
- **Mark SVG:** inline the SVG markup in `logo.ts` (so CSS can animate the `<line>`s). `drawIn` = `stroke-dasharray`/`stroke-dashoffset` WAAPI per line, with round caps.

### `title-lockup.ts` (prop continuity)

One component renders the beat-2 composition: mark, wordmark and tagline, with no HUD annotations. It takes a `host` and an optional `scale`, and exposes `reveal()` (the full animation, also as its parts: `revealMark()`, `revealWords()`, `revealTagline()`) and `showFinal()` (the static end state).

- `v2-title-card` uses it full-frame.
- `v2-interactive-dev` mounts it inside the browser viewport and calls `reveal()` on hot-reload.
- `v2-pixel-perfect-export` mounts it in the player surface with `showFinal()`.

Viewers see the same title card three times.

### Audio

- **VO take (v1):** the user supplies `raw.mp3` + `raw_stt.json` (ElevenLabs Scribe JSON export) in `voiceovers/v1/`. Then, from `examples/videowright_demo`:

  ```bash
  retime() { node ../../packages/lib/skill/scripts/retime.mjs "$@"; }
  VO=videos/demo_v2/audio/originals/voiceovers/v1
  retime check "$VO/provider_script.md" "$VO/raw_stt.json"      # exit 1 = bad take -> ask user to regenerate
  retime apply "$VO/provider_script.md" "$VO/raw.mp3" "$VO/raw_stt.json" "$VO/audio.mp3" "$VO/timing.json"
  ```

  Then sync (`sync_algorithm.md`) and write `voiceovers/v1/voiceover.ts`.
- **Pause re-tune (Phase 6):** edit the `[[pause Xs]]` values in `provider_script.md`, then re-run `apply`, re-sync, and rebuild the track. The `[[pause]]` *positions* are fixed by the take: a pause can only be retimed where a `[pause]` tag was sent. Lengths are free.
- **Placeholder (only if the v1 take is missing at Phase 3):** demo v1's `voiceovers/v4/audio.mp3` + `timing.json`, copied to `voiceovers/placeholder/`, with a `voiceover.ts` that flags it as a placeholder (`eleven_multilingual_v2`).
- **Typing SFX** is copied with its `sfx.ts`. `audio_plan.md` places it under the visual typing window, with the VO offset after it. Built with the flow in `audio/build.md` (ffmpeg, -14 LUFS) into `tracks/vN/`.
- **API route:** `voiceovers/v1/generate.sh` (eleven_v4 + Cosman-1 via `COSMAN_VOICE_ID`, then Scribe STT, check, apply) exists for when an `ELEVENLABS_API_KEY` is available. It is not used in this environment. The v4 API model id is unverified.
- **Portal STT export:** if the user re-exports STT from the portal, convert it with `node specs/projects/demo_v2/tools/portal_to_canonical.mjs <export.json> <raw_stt.json>`.

## Review tooling (`specs/projects/demo_v2/tools/`)

The environment has quirks. `env.sh` handles them idempotently, and the other scripts source it:

- **Playwright/Chromium version mismatch.** If `/opt/pw-browsers` exists and lacks the revision the project's Playwright wants, create `/tmp/pw-browsers/<expected>` as a symlink to the installed headless shell, and export `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers`.
- **Missing bin link.** The `videowright` bin may not be linked. Run the CLI as `node packages/lib/dist/cli/bin.js` from `examples/videowright_demo`, after `npm run build -w packages/lib`.

Scripts:

- `render_review.sh <slug> [fps=4] [out=/tmp/review/<slug>]`: renders with the default audio track (needed for VO timing), then writes `sheet_NN.png` contact sheets (4×4, 640×360 tiles) and prints the duration.
- `stills.sh <mp4> <out> <t1> <t2> …`: full-res PNG stills at the given seconds (VO cue times, transition midpoints).
- `strip.sh <slug> <center_s> [span_s=1.2]`: renders at 30fps (cached per git tree hash) and tiles the frames around `center_s`, to judge transition motion.
- Final render: `node …/bin.js render demo_v2 --output ../../renders/demo_v2.mp4` at 60fps. Add `/renders/` to the root `.gitignore`.

## Testing and verification

- `./checks.sh` at the repo root covers Biome lint (tabs, double quotes; it covers segments, components, transitions, and samples), `tsc` (including the demo tsconfig, which covers `styles/**` samples), and the unit tests. It must pass every phase.
- **Render smoke:** each phase renders every video it could affect. Phase 1: `demo_video` and the samples. Later phases: `demo_v2` and `demo_video`. Renders must complete with no advance or coherence errors. At the end, all videos are rendered once.
- No new unit tests are needed for content code. If a framework fix is unavoidable, it gets a test.

## Conventions

- **Segment ids** are `v2-<beat>`. The folder name equals the id.
- **Biome style:** tabs, double quotes, semicolons.
- **Imports:** segments and components import from `videowright`, the libraries the demo's `package.json` declares (`echarts`, `three`, `lottie-web`), and relative paths. The style pack's samples import only from `videowright`.
- **Logging:** `videos/demo_v2/PLAN.md` gets a dated log entry per phase, recording design decisions and any departure from the spec's Direction, with the reason.
- **Commits:** one per phase on `claude/brave-heisenberg-0ypj2b`, pushed after each phase. **No pull request** (user decision).
