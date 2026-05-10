---
status: complete
---

# Implementation Plan: Voiceovers

Five phases. Phase 1 is the `record` cleanup — a prerequisite that makes audio integration cleaner. Phases 2 and 3 split the audio integration into the headless ffmpeg path and the browser playback path. Phase 4 is the skill content. Phase 5 is the manual eval pass.

## Phases

- [x] **Phase 1: `record` cleanup**
  - Strip Playwright launch, screenshot loop, ffmpeg invocation, and wall-clock advance timer from `packages/lib/src/cli/record.ts`.
  - Rewire `record` to boot the existing dev server, resolve the active `Timing` (without voiceover yet — voiceover wiring lands in later phases), inject the schedule into the browser via window globals, and start in **idle mode**. User must click the existing/temporary play affordance to begin auto-advance.
  - Add `?recordMode=1` query param handling for reduced HUD chrome.
  - Update `index.ts` help text. Migrate examples and any skill files that invoke `record` for mp4 production to use `render`.
  - Update or delete tests that exercise record's old ffmpeg path. Keep argv tests for the new shape.
  - At end of phase: `record` boots a clean playback view; user can manually run external screen capture; no mp4 produced.

- [x] **Phase 2: Core types and `render` audio**
  - Add `Timing` and `Voiceover` types and extend `Timeline` with `default_timing` / `default_voiceover` in `packages/lib/src/types.ts`.
  - Implement `resolveTiming`, `validateTiming`, `loadVoiceover` in `packages/lib/src/timeline/`.
  - Modify `packages/lib/src/cli/ffmpeg.ts` to accept optional `audioFilePath` and emit single-pass two-input args.
  - Add `--voiceover <slug>` and `--voiceover none` flags to `render` in `packages/lib/src/cli/index.ts`.
  - Wire `render.ts` to call `loadVoiceover`, `validateTiming`, `resolveTiming`, then pass `audioFilePath` to ffmpeg.
  - Unit tests: `resolveTiming.test.ts`, `validateTiming.test.ts`, `loadVoiceover.test.ts`, `cli_voiceover_argv.test.ts` (render half).
  - Integration test: `render_audio.test.ts` — fixture timeline + fixture mp3 → render → ffprobe confirms audio stream.
  - At end of phase: `render --voiceover <slug>` produces an mp4 with the voiceover audio muxed in.

- [ ] **Phase 3: Player audio + HUD play button + `record` voiceover wiring**
  - Player gains `<audio>` element ownership in `packages/lib/src/player/index.ts` (created when active voiceover present).
  - Implement `idle` ↔ `playing` state machine. Auto-advance loop runs only in `playing`. Manual nav drops to `idle` and pauses audio. Drift tolerance 200ms.
  - HUD play button in `packages/lib/src/player/hud.ts`. Visible in `dev` and `record` modes; hidden under `?hideHud=1` (render).
  - `entry_client.ts` accepts injected audio file path and `Timing` for record mode.
  - Add `--voiceover` flag to `record` (mirrors render). Argv test extended to cover record half.
  - `dev` reads `default_voiceover` from `timeline.ts` and wires the player accordingly. No `--voiceover` flag for dev.
  - At end of phase: `dev` and `record` both play voiceover audio synced to playback. Play button works in both. Manual nav pauses correctly.

- [ ] **Phase 4: Skill content**
  - Rewrite `packages/lib/skill/references/voiceover.md` (currently a stub) as the core voiceover reference.
  - Create `packages/lib/skill/references/voiceover/` subfolder with: `style_intake.md`, `script_writing.md`, `provider_script.md`, `sync_algorithm.md`, `animation_sync.md`.
  - Create `packages/lib/skill/references/voiceover/providers/` with: `elevenlabs.md` (TTS tag conventions, pause mechanisms, portal walkthroughs for both TTS and STT, expected output formats), `manual.md` (user-provided audio flow through ElevenLabs STT).
  - Light updates to `SKILL.md` to register voiceover capability and pointer to the file conventions.
  - At end of phase: an agent reading the skill can drive both flows end-to-end without code changes.

- [ ] **Phase 5: Manual eval pass and fixes**
  - Run the manual eval matrix from architecture §Testing Strategy:
    - AI generation flow end-to-end with a real ElevenLabs portal session.
    - Manual flow end-to-end with a user-provided audio file via ElevenLabs STT.
    - Sync iteration: user requests a change, agent re-emits `Timing`.
    - Default voiceover + animation sync: agent edits a real segment's animations.
    - Multiple voiceovers: switching via `--voiceover` flag.
    - Audio sync stays within tolerance during a full timeline run in `dev` and `record`.
  - Record results in `specs/projects/voiceovers/manual_eval.md`.
  - Fix any bugs surfaced (likely small wording/flow tweaks in skill files; possibly minor player or sync algorithm adjustments).
