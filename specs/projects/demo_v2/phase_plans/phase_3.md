---
status: complete
---

# Phase 3: demo_v2 foundation + the hook

## Overview

Start the `demo_v2` video: its folder (PLAN.md, script, timeline), the `components/v2/` kit every beat builds on, the audio (the ElevenLabs v4 / Cosman-1 take synced, the typing SFX, the audio plan and the first track), and the first two beats — `v2-cold-open` (a real-looking Claude Code session) and `v2-title-card` (the Videowright lockup measured by the HUD) — joined by the mandated hard cut.

Builds on Phases 1–2 (94da1bd, 9fd55b5): the upgraded `styles/motion-engineering/` is the design system and `transitions/me-sweep.ts` / `me-push.ts` are reused as they are (this phase only needs `cut`). Clean room: no v1 segment, video, component or render is opened; the typing SFX is the only v1 asset used, copied byte for byte.

## Steps

1. **Kit: `examples/videowright_demo/components/v2/`** (imports `videowright` and relative paths only; lifted from the sample kit where it fits):
   - `assets/fonts/outfit-semibold.woff2` (Outfit 600, latin, from `@fontsource/outfit` 5.3.0) + `assets/fonts/OFL.txt`; `assets/videowright-mark.svg` (copy of the spec asset).
   - `v2.css`: the Outfit `@font-face` (`font-display: block`, relative URL) and the kit's classes (`.v2-wordmark`, `.v2-term-*`), all sizes ≥ the legibility floor.
   - `motion.ts` (no imports, so it is unit-testable): `css`, `ms`, `clamp01`, `tidy`, `expoOut`, `sineInOut`, `drawEase`, `svg()`, `draw()` (dash draw; `1 2` dash pattern so round caps never leave a dot), `riseIn()`, `createTicker(clock, signal)` (one rAF loop running `Tick`s on a clock), and the camera: `type CameraKey = { t, x, y, z, ease? }`, `cameraAt(keys, t)` (eased interpolation of focus point and zoom) and `cameraTransform(cam)` (`translate(960 - z·x, 540 - z·y) scale(z)`, origin 0 0; identity at `{960, 540, 1}`).
   - `fonts.ts`: `fontsReady()` for Archivo, JetBrains Mono, ME Symbols and Outfit (awaits only when a face is not loaded yet; the first segment loads all four, so later mounts never await mid-render).
   - `stage.ts`: `createStage(el, { key, scanPhase })` (the `me-*` layer stack without HUD chrome), `startAmbient(ctx, stage)` (drift, `nudge`, `rest`, tickers), `setOrigin`, `boxOf`, `flare`.
   - `hud.ts`: the HUD vocabulary (`decode`, `tickTo`, `lockOn`, `registerOn`, `dimension` (witness lines, centre-out dimension, ticking chip), `release`) and the **persistent HUD chrome**: one `.me-hud` overlay appended once to the player's `.vw-host` (above both slots and any transition layer, below the dev HUD), shared by every v2 segment: `showHud(el, { beat, total, section, delay? })`, `hudProbe(text)`, `hideHud(el)`. Its frame and slots never re-enter; when a new segment shows it, only the readouts whose text changed decode in place; the `tr` timecode runs continuously from the moment the HUD comes online (the hard cut), on its own rAF loop. Segments never remove it in `unmount()` (it outlives segments by design; the cold open hides it).
   - `logo.ts`: the mark from `assets/videowright-mark.svg?raw`, re-id'd per instance (two copies can coexist during a transition), with its visual bounds; `drawMark(mark, delay)` (strokes draw down, up, down, staggered, `--ease-draw`); `wordmark()` (Outfit 600, lowercase, near-white). The mark's own gradients are never recoloured.
   - `title-lockup.ts`: the beat-2 composition as a component on a 1920 × 1080 design canvas: `createTitleLockup(host, { scale })` → `{ root, reveal(ticker), showFinal(), release(ticker) }`. Horizontal lockup on the safe frame (mark x 160–590, wordmark to x ≈ 1760, tagline "Build videos in Claude Code" under the wordmark) with its own annotation SVG: crosshair on the mark's vertex, registration corners on the lockup, a width dimension under it whose chip ticks to the measured px. Labels are drawn only at `scale ≥ 1` (below that they would fall under 22px; strokes still draw).
   - `terminal.ts`: a neutral-dark, full-bleed terminal window running a Claude Code TUI at 1× legible scale (JetBrains Mono 32px, 46px rows): title bar, header (pixel mascot drawn in SVG from the block-character art, `Claude Code`, model, cwd), transcript rows, rounded input box with caret, `[Pasted 43 lines]` chip, `⏺` bullets, `⎿` results, the `✻` spinner. Claude orange `#D97757` only on the mascot, prompt chevron, message bullets and spinner pip. Rows are positioned on a fixed row grid so any line's box is known for camera framing.

2. **`segments/v2-cold-open/index.ts`** (`advances` = [ready cue, cut]):
   - `mount`: `fontsReady()`, `hideHud`, build the terminal; the camera starts tight (≈2×) on the input box.
   - One rAF script on `ctx.clock()`: the prompt `I want to build a video, here's the script:` types on character times derived from the typing SFX's keystroke onsets (two bursts around the comma, matching the two SFX cues), the camera tracking the caret; the paste chip lands; Enter; the prompt moves into the transcript and the camera pulls back to identity while Claude streams a reply, two tool calls and the spinner (verbs and counters tick).
   - Cue 1 ("with a single prompt"): the spinner resolves to `⏺ Video is ready. Preview: npm run dev`; the camera pushes slowly toward it.
   - Cue 2: the hard cut (final advance, on the breath after "prompt.").

3. **`segments/v2-title-card/index.ts`** (`advances` = [release, exit]; timeline entry `transition: "cut"`):
   - `mount`: stage + `showHud(el, { beat: 2, total: 8, section: "Title" })` (chrome on frame 1 of the cut), mount the lockup.
   - `play`: strokes draw from frame 1, the wordmark rises onto the VO's "Videowright", the tagline rises, the crosshair locks on the mark, corners bracket the lockup and the grid flares, the dimension measures it and ticks; then the hero hold breathes (drift, scan, timecode).
   - Release cue: annotations retract, the camera rests; the lockup stays.

4. **Audio** (`videos/demo_v2/audio/`):
   - `originals/sfx/laptop_typing/audio.mp3` (byte copy) + a new `sfx.ts` (measured length, provenance in notes).
   - Sync the v1 take (`sync_algorithm.md`): `originals/voiceovers/v1/voiceover.ts` (`provider: "elevenlabs"`, `model: "eleven_v4"`, `voice: "Cosman-1"`, timing for the built segments).
   - `audio_plan.md`: typing SFX cues placed under the visual typing (burst 1 = full file, burst 2 = a slice, single-key slices for paste and Enter), the VO placed after a short typing lead-in, mixed with `amix` and `loudnorm` to -14 LUFS. Build `tracks/v1/` (`plan_snapshot.md`, `track.mp3`, `track.ts` with track timing = VO timing shifted by the VO's placement in the cold open).

5. **Video folder** `videos/demo_v2/`: `PLAN.md` (brief, style, audio, outline, script, log with a dated Phase 1–2 entry and a Phase 3 entry), `voiceover_script/script.md` (the full 8-section script), `timeline.ts` (style import, `v2-cold-open`, `v2-title-card` with `cut`, `default_audio_track`).

6. **Tooling**: `strip.sh` gains `FPS` (default 30) and reads the frame count from the render's real fps, for 60fps strips around the hard cut.

7. **Render, look, iterate** into `/tmp/review/phase3/`: low-fps render + contact sheets, full-res stills at each VO cue, a 60fps strip across the cold-open → title-card cut, an mp4 with audio; fix what is seen, then self-critique and act on the top items.

8. **Checks**: `source specs/projects/demo_v2/tools/env.sh && ./checks.sh`.

## Tests

`packages/lib/test/integration/demo_v2.test.ts`:
- `timeline loads with the built v2 segments in order, entering the title card on a hard cut`.
- `every timeline segment has a segments/<id>/index.ts`.
- `render pre-flight: the default track resolves, timing validates, and covers exactly the timeline's segments`.
- `voiceover.ts names the ElevenLabs v4 Cosman-1 take and its files exist`.
- `track timing is the voiceover timing shifted by the VO's placement`: the cold open absorbs the offset read from the snapshot's VO cue; later segments are unchanged.
- `advances land on their VO cues`: from `timing.json` and the snapshot's placement, the ready cue starts ≤150ms before "with" and after "Code"; the cut falls in the breath between "prompt." and "Videowright"; the title release follows "technologies." and the title exit precedes "That".
- `typing SFX is the byte-identical allowed asset and sfx.ts records its measured length`.
- `audio plan Final mix command references every cue's source`.

`packages/lib/test/unit/demo_v2_kit.test.ts`:
- `cameraAt holds the first and last keys and eases between them`, `cameraTransform is the identity at frame centre, zoom 1`.
- `typing char times are increasing and fit the SFX bursts` (one time per prompt character, burst split at the comma).
- `v2 sources respect the legibility floor` (no `font-size` below 22px in `components/v2` and `segments/v2-*`), `use no Math.random or SMIL`, `import only videowright and relative paths`.
- `logo.ts reads the mark from the bundled asset, and the asset equals the spec's mark`.
