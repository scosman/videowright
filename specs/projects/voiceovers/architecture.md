---
status: complete
---

# Architecture: Voiceovers

## Overview

This doc covers the technical design for the voiceovers project. The functional spec (`functional_spec.md`) defines the behavior; this doc defines the code.

Scope of changes:
- New types: `Timing`, `Voiceover`. New optional `Timeline` fields: `default_timing`, `default_voiceover`.
- New shared helpers: `resolveTiming`, `validateTiming`.
- Player gains an `<audio>` element, a play/pause state machine, and a HUD play button.
- `record` CLI is rewritten (Phase 1) to drop ffmpeg/screenshots and become an auto-advancing dev-mode variant gated on user "play."
- `render` CLI gains audio support via a single-pass ffmpeg invocation with two inputs.
- Skill files: `references/voiceover.md` is expanded; provider sub-references added.

The implementation phases are listed in `implementation_plan.md`.

## Data Model

### `Timing`

Top-level type expressing per-segment advance schedules independently of segment definitions. Lives in `packages/lib/src/types.ts`.

```ts
export type Timing = {
  perSegment: Partial<Record<string, number[]>>;
};
```

- Key = segment id; value = list of advance times (seconds, segment-relative — same units as `SegmentSpec.advances`).
- **`Partial<...>`**: a `Timing` may declare overrides for any subset of segments. Unspecified segments fall back to `SegmentSpec.advances`.
- A `Timing` is never required to cover all segments. It's an override layer.

### `Voiceover`

```ts
export type Voiceover = {
  audio_file: string;             // path relative to the voiceover.ts file
  provider: "elevenlabs" | "manual";
  provider_timing_file?: string;  // path relative to the voiceover.ts file
  timing: Timing;
  notes?: string;
};
```

- `audio_file` is resolved relative to the directory containing the `voiceover.ts` file (`videos/<video>/voiceovers/<slug>/`).
- `provider_timing_file` is the raw provider output (e.g., ElevenLabs per-word JSON). Stored for reference and for re-running sync if the user wants to regenerate `Timing`. Not loaded at runtime.
- `provider: "elevenlabs"` covers both AI generation and manual flows that ran through ElevenLabs Speech-to-Text. `provider: "manual"` is reserved for future flows that don't pass through any provider portal; it's not used in V1 but kept in the union for forward compatibility.

### `Timeline` extensions

Existing `Timeline` type gets two optional fields:

```ts
export type Timeline = {
  meta: { /* unchanged */ };
  segments: TimelineEntry[];
  default_timing?: Timing;
  default_voiceover?: Voiceover;
};
```

Both are optional. A timeline with neither behaves exactly as today.

### `SegmentSpec` (unchanged)

`SegmentSpec.advances: number[]` and `SegmentSpec.voiceover?: string` are unchanged. The voiceover string field continues to feed the HUD hint.

## Schedule Resolution

A shared pure function lives at `packages/lib/src/timeline/resolveTiming.ts`:

```ts
export type ResolvedTiming = {
  source: "voiceover" | "default_timing" | "segments";
  voiceover?: Voiceover;            // present iff source === "voiceover"
  perSegment: Record<string, number[]>;  // fully resolved (every segment has an entry)
};

export function resolveTiming(args: {
  segments: SegmentSpec[];
  defaultTiming?: Timing;
  defaultVoiceover?: Voiceover;
  cliVoiceoverSlug?: string | "none";
  cliVoiceoverModule?: Voiceover;   // pre-loaded by CLI when slug provided
}): ResolvedTiming;
```

**Precedence (highest first):**
1. `cliVoiceoverModule` if provided and `cliVoiceoverSlug !== "none"`.
2. `defaultVoiceover` if `cliVoiceoverSlug !== "none"`.
3. `defaultTiming`.
4. Segment-level `advances`.

**`cliVoiceoverSlug === "none"`** explicitly suppresses voiceovers and `default_timing` is still respected. (This matches the functional spec: `--voiceover none` falls back to "no audio" but keeps any `default_timing`.) *Edit me if you want `none` to skip default_timing too.*

**Resolution mechanics:**
- Build `perSegment` by starting from `segments` (each segment id maps to its `SegmentSpec.advances`).
- If a higher-precedence `Timing` is in play, overlay its `perSegment` entries — segment ids present in the `Timing` win; segment ids absent fall back.
- Return the fully resolved `perSegment` plus the `source` and (if applicable) the active `Voiceover`.

This single function is used by all three CLI modes (`dev`, `record`, `render`), guaranteeing identical resolution semantics.

## Validation

`packages/lib/src/timeline/validateTiming.ts` exports `validateTiming(timing, segmentIds): ValidationResult`. Called at CLI startup after loading timeline / voiceover modules.

Checks:
- All keys in `timing.perSegment` are valid segment ids (warn on unknown — could be a typo or a segment that was renamed).
- All values are arrays of positive finite numbers.
- For voiceovers: `audio_file` path exists on disk; `provider_timing_file` (if specified) exists.

Errors are printed to stderr with file paths and exit nonzero. Warnings print but do not block.

## Voiceover Loading

CLI helper at `packages/lib/src/timeline/loadVoiceover.ts`:

```ts
export async function loadVoiceover(args: {
  videoFolder: string;     // absolute path
  slug: string;            // e.g., "narrator-warm" or "v3"
}): Promise<{
  voiceover: Voiceover;
  voiceoverFolder: string;
  audioFilePath: string;   // absolute, resolved
}>;
```

- Resolves `<videoFolder>/voiceovers/<slug>/voiceover.ts` via the existing `loadModule` ts-loader.
- Resolves `audio_file` and `provider_timing_file` relative to the voiceover folder.
- Throws on missing files.
- For `default_voiceover` from `timeline.ts`, the timeline already imported the module — no separate load needed.

## Player and HUD Changes

### Audio element

The player (`packages/lib/src/player/index.ts`) gains an optional `<audio>` element.

- Created at player init iff a `Voiceover` is active (passed in via the player's existing init config — adds an `audioFile?: string` field).
- Source: the resolved absolute `audioFile` path served by Vite.
- Properties: `preload="auto"`, no controls visible in the DOM, no `autoplay`.
- **Render mode does not create an audio element.** Audio is muxed by ffmpeg only.

### Play/pause state machine

The player has a new `mode` state: `"idle" | "playing"`.

- **`"idle"`** (default on load): no auto-advance. Manual nav (prev/next/click/swipe) works as today. Audio paused. Current time shown in HUD.
- **`"playing"`**: auto-advance loop runs against the resolved `Timing`. Audio plays. Manual nav transitions back to `"idle"` and pauses both video and audio.
- Play button toggles between modes. Space key behavior is preserved (advance in idle), but pressing play overrides into playing mode.

Audio sync: when transitioning idle → playing, the audio element's `currentTime` is set to match the player's logical timeline position (computed from the `Timing` and current segment + beat). The auto-advance loop uses `setTimeout` (or `requestAnimationFrame` for finer granularity if needed) — same general approach as the existing dev mode timer logic.

**Tolerance for audio drift:** if measured drift between audio.currentTime and the expected logical time exceeds 200ms, snap audio.currentTime back to the expected value. (Conservative threshold; audio should generally be in sync.)

### HUD play button

`packages/lib/src/player/hud.ts` (vanilla DOM) gets a new button rendered alongside the existing chrome.

- Visible in `dev` and `record` modes.
- Hidden in `render` mode (existing `?hideHud=1` already hides everything).
- Click toggles the player's mode. Shows ▶ in idle, ⏸ in playing.

The existing HUD elements (segment ID, beat counters, voiceover hint, error overlay, end-of-timeline badge, H-key toggle) are preserved.

## CLI Changes

### Phase 1: `record` cleanup

The post-cleanup `record` command becomes an auto-advance-capable dev variant.

**Deletions** (from `packages/lib/src/cli/record.ts`):
- The Playwright launch and screenshot loop.
- The ffmpeg invocation.
- The wall-clock advance timer.
- The synthetic Space keydown driver.

**New behavior:**
- Boots the existing dev server (via `runDev` from `dev.ts`).
- Resolves the active voiceover (via `--voiceover` flag) and `Timing` (via `resolveTiming`).
- Injects the resolved `Timing` and audio file path into the browser via window globals (or query params on the dev URL).
- Browser-side: page loads in **idle mode** with the play button visible. User starts screen capture software, then clicks play. Player auto-advances using the injected schedule and plays audio.
- HUD chrome is reduced via a query param `?recordMode=1`: shows only the play button and end-of-timeline indicator. Manual nav still works in idle (but pressing play disables nav until the user manually exits play).

**Important:** the new `record` does **not** produce an mp4. Users wanting an mp4 use `render`. This is a documented breaking change.

### `render` audio mux (single-pass)

`packages/lib/src/cli/ffmpeg.ts` exposes the existing helpers (`spawnFfmpeg`, `writeWithBackpressure`). We modify the helper to accept an optional `audioFilePath` parameter.

When `audioFilePath` is provided, the ffmpeg argument array gains:
- `-i <audioFilePath>` as a second input (after the image2pipe input).
- `-c:a aac -b:a 192k` for audio encoding.
- `-map 0:v:0 -map 1:a:0` to be explicit about stream mapping.
- `-shortest` to bound output to the shorter of (rendered video, audio) — defensive; in practice `Timing` ensures they match.

The image2pipe input remains pipe-fed; the audio file is read directly from disk by ffmpeg. One ffmpeg process, one output file.

When `audioFilePath` is not provided, the existing video-only invocation is used unchanged.

### `--voiceover` flag

Added to both `record` and `render` (in `packages/lib/src/cli/index.ts`):
- `--voiceover <slug>`: load `voiceovers/<slug>/voiceover.ts`. Pass to `resolveTiming`.
- `--voiceover none`: pass `cliVoiceoverSlug: "none"` to `resolveTiming`.
- absent: `resolveTiming` falls back to `default_voiceover` then `default_timing` then segments.

`dev` does **not** get the `--voiceover` flag. It always uses `default_voiceover` from `timeline.ts` if set, otherwise no audio.

### Help text & docs

`index.ts` help text for `record` is rewritten: "Auto-advance playback for visual review or external screen capture. No mp4 output — use `render` for export." Existing examples in `examples/` and skill files that invoke `record` for mp4 production are updated to use `render`.

## Skill Files

The skill at `packages/lib/skill/` is reorganized for voiceovers. The existing `references/voiceover.md` (currently a stub) is replaced.

**File map:**

```
packages/lib/skill/
  SKILL.md                        # light updates: voiceover capability awareness, file convention pointer
  references/
    voiceover.md                  # core voiceover reference (rewritten)
    voiceover/
      style_intake.md             # questions to ask user about voice/tone/style up front
      script_writing.md           # writing per-segment script in PLAN.md, sanity checks
      provider_script.md          # transforming PLAN script into provider_script.md
      sync_algorithm.md           # agent reasoning for going from word-timings → Timing
      animation_sync.md           # one-time pass over segment code when default voiceover set
      providers/
        elevenlabs.md             # v3 TTS tag conventions, pause mechanisms, portal walkthrough; also STT portal walkthrough
        manual.md                 # manual flow (user-provided audio) using ElevenLabs STT
```

The decision to nest under `references/voiceover/` keeps `references/` from becoming flat. Existing references (e.g., `setup.md`, `styles.md`) stay at the top level.

**Content guidance** for each file is detailed in the respective skill file when written; the architecture's job is to lock in the file structure.

## Sync Algorithm (Agent-Driven)

The functional spec specifies this is agent reasoning, not deterministic code. The architecture's job is to define the agent's inputs and outputs precisely so the skill file can guide it.

**Inputs to the agent:**
1. The video's `PLAN.md` with per-segment script division.
2. The provider timing JSON (path stored in `voiceover.ts`'s `provider_timing_file`).
3. The list of segment ids in timeline order, plus each segment's `notes` and `voiceover` hint string.

**Output:** a `Timing` object written into the new `voiceover.ts` file.

**Skill instructions for the agent (`sync_algorithm.md`)** specify:
- How to parse ElevenLabs and ElevenLabs-STT timing JSON (schema documented).
- How to walk the per-segment script and find the timestamp at the end of each scripted chunk.
- How to handle multi-advance segments by looking for content cues ("and now X" → transition).
- How to present the proposed `Timing` to the user with annotations ("advance 2 of segment foo lands at 0:14.3 — '...and the chart appears'").
- How to iterate based on user feedback.

The agent edits `voiceover.ts` directly to write the `Timing`. There is no programmatic generator.

## Animation Sync (Agent-Driven)

When a voiceover is set as default, the agent (per `animation_sync.md`):

1. Reads the active voiceover's `Timing`.
2. Greps segment code for fully automated animations (e.g., CSS transitions with explicit durations, JavaScript animation libraries with explicit timing).
3. Adjusts those durations to align with audio beats where appropriate.
4. Adds `default_voiceover` import to `timeline.ts`.

The skill file provides heuristics; the architecture provides no runtime mechanism. This is purely planning-time agent work.

## Testing Strategy

### Unit tests

Per the existing project convention (Vitest), unit tests live alongside source under `packages/lib/test/unit/`.

**New tests:**
- `resolveTiming.test.ts` — covers all four precedence cases, partial Timing fallback, "none" semantics, and error inputs.
- `validateTiming.test.ts` — unknown segment ids, malformed values, missing audio file, missing provider timing file.
- `loadVoiceover.test.ts` — happy path, missing voiceover.ts, missing audio file, broken module.
- `cli_voiceover_argv.test.ts` — `--voiceover slug`, `--voiceover none`, no flag; for both `record` and `render`.

**Updated tests:**
- `record_render_argv.test.ts` — record's argv shape changes (no `--output` for record post-cleanup); render's stays the same plus voiceover flag.
- `render_mode.test.ts` — unchanged; render mode behavior is unchanged for the player.
- Any existing test that invokes `record` expecting mp4 output → migrated to `render` or deleted.

### Browser-side tests

The project uses Playwright for higher-fidelity tests in some areas. For the player audio integration, **manual eval** is more reliable than headless tests for:
- Audio actually plays in dev/record.
- Play button toggles correctly.
- Manual nav pauses audio.
- Audio sync stays within tolerance during a full timeline run.

Documented in the `manual_eval.md` companion file (created during Phase N).

### Render audio mux

Integration test: a short fixture timeline + a tiny fixture mp3 → run `render --voiceover fixture` → verify output mp4 has an audio stream (via `ffprobe`). Lives under `test/integration/render_audio.test.ts`.

### Skill content

No automated tests for skill markdown files. **Manual eval matrix** (in `manual_eval.md`) covers:
- AI generation flow end-to-end with a real ElevenLabs portal session.
- Manual flow end-to-end with a user-provided wav and ElevenLabs STT.
- Sync iteration: user requests a change, agent re-emits Timing.
- Default voiceover + animation sync: agent edits a real segment's animations.
- Multiple voiceovers: switching via `--voiceover` flag.

## Error Handling

| Condition | Behavior |
|---|---|
| `--voiceover slug` with missing folder | `loadVoiceover` throws; CLI prints path and exits nonzero before launching browser/ffmpeg. |
| `audio_file` missing on disk | `validateTiming` flags during CLI startup; exit nonzero. |
| `provider_timing_file` missing | Warning only — runtime doesn't load it. Sync regeneration would fail later. |
| `Timing.perSegment` references unknown segment id | Warning to stderr; resolution falls back for that segment. |
| Audio shorter than total scheduled video time | ffmpeg `-shortest` truncates output to audio length. (Should not occur if the agent did sync correctly.) |
| Audio longer than total scheduled video time | Final advance lands at audio end; no extra video frames. (Sync algorithm's responsibility.) |
| Browser autoplay blocked | Audio is silent until user clicks play button (which counts as user gesture). Documented in skill content. |

## Backwards Compatibility

- **Videos without voiceovers**: zero changes required. `default_timing` and `default_voiceover` are optional. `SegmentSpec.advances` is still the source of truth when no `Timing` is active.
- **`record` ffmpeg path is removed** in Phase 1. Documented breaking change. Existing examples and skill files migrated to `render` in the same phase.
- **`SegmentSpec.voiceover: string`** is repurposed semantically (HUD hint, not canonical script) but the field shape is unchanged. No code migration.

## Resolved Open Questions (from Functional Spec)

1. **Type shapes**: `Timing.perSegment` is `Partial<Record<string, number[]>>`; missing segments fall back. ✅
2. **ElevenLabs v3 pause mechanism**: deferred to skill content (`elevenlabs.md`) — out of scope for code architecture. The skill file documents whatever ElevenLabs v3 supports at the time of writing. ✅
3. **`record` shares with `render`'s schedule logic**: both go through `resolveTiming`. The driver loops differ (real timers vs. frame counts). The schedule data structure is the same. ✅
4. **ffmpeg audio mux**: single-pass with two `-i` inputs. ✅
5. **`record` schedule location**: computed CLI-side, injected into browser via window globals. ✅

## File Map (Net Changes)

**New files:**
- `packages/lib/src/timeline/resolveTiming.ts`
- `packages/lib/src/timeline/validateTiming.ts`
- `packages/lib/src/timeline/loadVoiceover.ts`
- `packages/lib/test/unit/resolveTiming.test.ts`
- `packages/lib/test/unit/validateTiming.test.ts`
- `packages/lib/test/unit/loadVoiceover.test.ts`
- `packages/lib/test/unit/cli_voiceover_argv.test.ts`
- `packages/lib/test/integration/render_audio.test.ts`
- `packages/lib/skill/references/voiceover/style_intake.md`
- `packages/lib/skill/references/voiceover/script_writing.md`
- `packages/lib/skill/references/voiceover/provider_script.md`
- `packages/lib/skill/references/voiceover/sync_algorithm.md`
- `packages/lib/skill/references/voiceover/animation_sync.md`
- `packages/lib/skill/references/voiceover/providers/elevenlabs.md`
- `packages/lib/skill/references/voiceover/providers/manual.md`

**Modified files:**
- `packages/lib/src/types.ts` — add `Timing`, `Voiceover`; extend `Timeline`.
- `packages/lib/src/cli/record.ts` — full rewrite (Phase 1).
- `packages/lib/src/cli/render.ts` — voiceover flag, single-pass audio mux.
- `packages/lib/src/cli/ffmpeg.ts` — accept optional `audioFilePath`.
- `packages/lib/src/cli/index.ts` — register `--voiceover` flag for record and render; updated help text.
- `packages/lib/src/player/index.ts` — audio element ownership, play/pause state machine.
- `packages/lib/src/player/hud.ts` — play button.
- `packages/lib/src/player/entry_client.ts` — accept injected audio + Timing for record mode.
- `packages/lib/skill/SKILL.md` — light voiceover capability mention.
- `packages/lib/skill/references/voiceover.md` — full rewrite (currently a stub).
- `packages/lib/test/unit/record_render_argv.test.ts` — record argv updated.

**Deleted code (within `record.ts`):** screenshot loop, ffmpeg invocation, Playwright launch.

## Notes on Sequencing

The implementation plan (separate doc) groups these into phases. Architecture commitment: Phase 1 must complete the `record` cleanup before Phase 2 introduces audio. Phase 2 should land types + validation + resolveTiming + render audio mux as a unit (they're tightly coupled). Player and HUD changes can be a single phase. Skill content can be its own phase.
