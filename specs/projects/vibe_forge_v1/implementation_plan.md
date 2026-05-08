---
status: complete
---

# Implementation Plan: Videowright

Phased build order. Each phase is one coherent CR. Test, lint, and typecheck stay green at the end of every phase. A `notes_for_readme.md` accumulates highlights across phases for the final README write-up.

## Phases

- [ ] **Phase 1: Repo bootstrap & tooling.** npm workspaces, `tsconfig.base.json` (strict), `packages/lib/` package skeleton with `bin: videowright`, ESLint + Prettier (or Biome — pick during this phase), Vitest config, root scripts (`typecheck`, `lint`, `test`), empty `src/` skeleton, `LICENSE` (MIT), `notes_for_readme.md`. No runtime code yet.

- [ ] **Phase 2: Types + segment authoring.** `src/types.ts` (`Segment`, `SegmentSpec`, `PlayerContext`, `Timeline`, `TimelineEntry`, `TimelineMeta`, `Config`, `Transition`). `src/segment/`: `defineSegment`, `defineConfig`, internal `SegmentRunner` with ctx-creation, beat counter, abort signal, seek-beats. Unit tests per `components/segment_helper.md` test plan.

- [ ] **Phase 3: Timeline loader, transitions, script helper.** `src/timeline/`: `buildSegmentLoaderMap`, `buildTransitionLoaderMap`, `validateTimeline`, `applyMetaDefaults`. `src/player/transitions/`: `cut`, `fade`, `slideLeft/Right/Up/Down` (WAAPI). `src/script/script.ts`: VO concat helper. Unit tests per `components/timeline_loader.md` plus transition tests from `components/player.md`.

- [ ] **Phase 4: Player.** `src/player/`: `<vw-slot>` custom element, hash router, input handling, HUD, forward/backward step, two-slot transition orchestration, seek-to-beat-N, error overlay, render-mode stub. Unit + integration tests per `components/player.md` test plan (jsdom-based).

- [ ] **Phase 5: CLI.** `src/cli/`: argv parser, config + timeline discovery, `tsx`-based TS module loader for Node, `videowright dev` (programmatic Vite boot with internal entry HTML and `@consumer` alias), `videowright script` with `--write`. Per `components/cli.md` test plan.

- [ ] **Phase 6: Skill content.** `packages/lib/skill/`: `SKILL.md`, four references (`setup.md`, `authoring_segment.md`, `authoring_video.md`, `style_matching.md`), `assets/hello_world/` templates. Wire `package.json#files` to include `skill/`. Manual eval: a fresh agent with only the skill scaffolds a working video.

- [ ] **Phase 7: Demo example.** `examples/demo_example/` complete consumer-style repo: 7 segments (`intro`, `feature-svg`, `feature-three`, `feature-lottie`, `feature-echarts`, `feature-cards`, `outro`), `logo-morph` custom transition, components, design tokens, `STYLE.md`, voiceover script. Stylish — spend the time. `npm run dev:demo` works end-to-end.

- [ ] **Phase 8: CI.** `.github/workflows/ci.yml` (typecheck, lint, unit + integration). `.github/workflows/e2e.yml` (Playwright against built demo). Both run on push/PR. Verify on a test branch before merging.

- [ ] **Phase 9: README + project polish.** Write the project README from `notes_for_readme.md`, the specs, and the now-complete code. Manually screen-record the demo and embed the MP4 in the README. Pre-publish checks (`npm pack` smoke). License-bundling sanity (no copyleft / BUSL transitively).

- [ ] **Phase 10 (may not ship): Export commands.** `videowright record` (Playwright drives full-screen player, ffmpeg captures the window). Then `videowright render` (CDP-driven deterministic frame export, ffmpeg stitches). Audio plumbing if scope permits. May be split into two separate phases during execution. May be skipped entirely if v1 ships before reaching here — that's intentional.
