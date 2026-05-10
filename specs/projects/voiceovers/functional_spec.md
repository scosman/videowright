---
status: complete
---

# Functional Spec: Voiceovers

## Summary

Add voice-over support to videowright. Users can attach an audio narration to a video — either AI-generated (via ElevenLabs v3) or user-supplied (manual recording). The video adapts its advance timing to the audio, so segment beats land on the right narration moments. The skill drives the end-to-end flow: script writing, provider-specific script generation, audio import, sync timing generation, and integration into the video's timeline.

This project also includes a prerequisite **CLI cleanup** (Phase 1 of implementation) that removes the redundant ffmpeg path from the `record` command. After the cleanup:

- `dev` — interactive browser playback (manual nav). Existing.
- `record` — browser-based auto-advance playback (no ffmpeg). For visual review and external screen capture.
- `render` — the **only** ffmpeg-based mp4 producer (deterministic, byte-identical).

Audio integration after cleanup:
- `dev` and `record` use an HTML `<audio>` element synced to player time.
- `render` muxes audio into the final mp4 via ffmpeg.

## In Scope (V1)

- AI-generated voice-over flow using **ElevenLabs v3** via the ElevenLabs web portal (no API integration).
- Manual voice-over flow where the user provides an audio file.
- Transcript-and-timing for the manual path uses **ElevenLabs Speech-to-Text** (web UI).
- Per-video voice-over storage with multiple voice-overs allowed (different "takes" or alternates).
- A `Voiceover` TypeScript type and a `Timing` TypeScript type.
- Default voice-over support: a video can declare one voice-over as its default, and the agent performs a one-time animation sync to that voice-over.
- CLI flag `--voiceover <slug>` and `--voiceover none` for `record` and `render`.
- HTML `<audio>` integration in `dev` and `record`; ffmpeg audio-mux integration in `render`.
- HUD play button and audio-synced playback in `dev`/`record`.
- Skill files that drive the end-to-end agent flow.

## Out of Scope (V1)

- Background music or SFX layering.
- Multi-language voice-overs.
- Segments with native audio (e.g., screen recordings with sound).
- ElevenLabs API integration (V1 is portal copy-paste only).
- A HUD voice-over picker / dropdown for switching voice-overs at runtime. (V1 supports exactly one active voice-over per playback session, selected via CLI flag or `default_voiceover` in `timeline.ts`.)
- Voice-selection metadata stored in `voiceover.ts` (the user picks a voice in the ElevenLabs portal; we don't store voice IDs or settings).
- Auto-discovery of voice-overs by glob. (The active voice-over is fully specified by CLI flag or `default_voiceover` import.)
- Providers beyond ElevenLabs v3 (AI generation) and manual (user-provided audio).
- Local-CLI transcript-and-timing tools (e.g., `whisper-timestamped`). The manual flow uses ElevenLabs Speech-to-Text only in V1.

## File and Folder Conventions

Voice-overs live **per-video** under the existing video folder:

```
videos/<video-slug>/
  PLAN.md
  timeline.ts
  segments/
    ...
  voiceovers/
    <vo-slug>/
      voiceover.ts             # the typed Voiceover object
      <audio-file>.mp3|wav     # any name, referenced from voiceover.ts
      provider_timing.json     # provider-supplied per-word/character timings (optional)
      provider_script.md       # the script with provider-specific annotations (e.g., ElevenLabs tags)
```

**Slug naming.** Both auto-versioned (`v1`, `v2`, …) and user-named (`narrator-warm`, `take-3`) are allowed. The slug is the folder name and is what the user passes to `--voiceover <slug>`.

**Multiple voice-overs.** Stored as separate sibling folders under `voiceovers/`. Each is independent and self-contained.

**The script (human-readable narration text)** lives in the video's `PLAN.md`, divided section-by-section to align with segments. `provider_script.md` inside the voice-over folder is a transformation of the PLAN script with provider-specific annotations (pause/style tags, etc.); it is the input to the provider's text-to-speech.

## Type Definitions (Conceptual)

The exact TypeScript shapes are decided during architecture; this section captures the conceptual contract.

### `Timing`

A new top-level type that expresses per-segment advance schedules independently of segment definitions. Replaces (overrides) the `advances: number[]` field on a `SegmentSpec` when present in a higher-precedence source.

Conceptually:

```ts
type Timing = {
  perSegment: Record<string /* segment id */, number[] /* seconds per advance */>;
};
```

### `Voiceover`

A new type representing one voice-over for a video. Conceptually:

```ts
type Voiceover = {
  audio_file: string;             // path relative to the voiceover folder
  provider: "elevenlabs" | "manual";
  provider_timing_file?: string;  // path relative to the voiceover folder, if available
  timing: Timing;                 // the advance timing synced to this audio
  notes?: string;
};
```

`SegmentSpec.voiceover: string` (existing) is **kept** as a per-segment hint string used for HUD display. It is *not* the canonical script — that lives in `PLAN.md`. No migration required.

## Timing and Voice-Over Precedence

When determining what advance schedule to use during playback (`dev`, `record`, or `render`):

1. **Active voice-over's `timing`** — if an active voice-over is selected (see "CLI Behavior" below), its `Timing` is used.
2. **`default_timing`** in `timeline.ts` — if no voice-over is active but `timeline.ts` exports a `default_timing` of type `Timing`, that is used.
3. **`SegmentSpec.advances`** — fall back to per-segment defaults defined inside each segment.

A segment's `advances` always provides the fallback. A `Timing` only needs to specify segments it wants to override; segments not listed fall back to their own `advances`. (Architecture decides whether this is by partial-record or some explicit shape; the functional contract is "missing segment id ⇒ fall back.")

## User Flows

### Flow A: Generate with AI (ElevenLabs)

The skill walks the user through these steps:

1. **Script.** Check `PLAN.md` for an existing script:
   - If a per-segment script already exists in `PLAN.md`, skip ahead.
   - If not: ask the user whether they will paste a script or want one written.
     - **Paste:** the agent integrates it into `PLAN.md` divided by segment, with timing notes.
     - **Write:** the agent reads `PLAN.md`'s existing creative plan and proposes a script per segment.
   - **Sanity checks** before continuing:
     - Flag spelling/grammar issues; offer fixes.
     - Flag misalignment between script and video (script mentions content that's not on screen, or vice versa). Ask the user how to resolve: update the script, update the video, or accept.
2. **Provider script.** Generate `provider_script.md` from the PLAN script with ElevenLabs v3 conventions:
   - Use audio tags (`[whispering]`, `[excited]`, `[serious]`) for delivery direction where the user has expressed style preferences.
   - Use ellipses (`...`) and em-dashes (`—`) for short natural pauses.
   - For longer required pauses (e.g., to give an animation time to play), use the most accurate ElevenLabs v3 mechanism available. **Open question for architecture:** confirm whether `[pause N seconds]` is supported in v3 and document the fallback if not.
   - Print the `provider_script.md` for the user to copy, plus instructions: "Open the ElevenLabs portal, paste this script, generate, download both the audio file and the per-word timing JSON, drop them into `videos/<video>/voiceovers/<slug>/`."
3. **User imports.** User creates `voiceovers/<slug>/` (or the agent does) and drops in:
   - The audio file (any name; referenced from `voiceover.ts`).
   - The per-word timing JSON from ElevenLabs (`provider_timing.json`).
4. **Sync timing.** The agent reads the audio timing and the per-segment script division, then computes a `Timing` object. See "Sync Algorithm" below.
5. **Default?** Ask the user whether to set this as the default voice-over for the video. If yes:
   - Add `default_voiceover` import to `timeline.ts`.
   - Perform a one-time animation sync (see "Default Voice-Over Animation Sync" below).
6. **Write `voiceover.ts`.** Create the typed object pointing at the audio file, provider timing file, and the computed `Timing`.

### Flow B: Manual (User-Provided Audio)

1. **Get the audio.** Ask the user to either pass a file path or drop an audio file into a newly created `voiceovers/<slug>/` folder.
2. **Generate transcript and timing.** The skill instructs the user to upload the audio file to the ElevenLabs Speech-to-Text portal, download the per-word timing JSON, and drop it into the voice-over folder as `provider_timing.json`.
3. **Sync timing.** Same as Flow A step 4.
4. **Default?** Same as Flow A step 5.
5. **Write `voiceover.ts`.** Same as Flow A step 6.

### Flow Entry Point

User asks the agent to "add a voice-over." The skill's first question:

> Do you have an audio file already, or would you like to generate one with AI text-to-speech?

Routes to Flow B or Flow A respectively.

## Sync Algorithm (Script → `Timing`)

This is an **agent reasoning step**, not a deterministic function.

**Inputs:**
- The per-segment script division from `PLAN.md`.
- The per-word or per-character timing data from the provider (ElevenLabs JSON or whisper-timestamped JSON).
- The segment IDs and the `notes`/`voiceover` fields on each segment for content alignment hints.

**Output:** a `Timing` object with `perSegment` entries.

**Approach:** The agent walks the script segment-by-segment, locates the timestamp at the end of each scripted chunk in the provider's word/character timing data, and emits an advance time. Where a segment has multiple advances (mid-segment beats), the agent reasons about content alignment — looking for natural pause points or moments where the script transitions to describing the next visual beat — and places advances accordingly. Sometimes there are clear cues ("and now X" → transition to X visual); often the agent applies judgment.

**Audio always wins.** The video duration is adapted to match the audio duration. The last advance lands at the audio end. There is no truncation of audio or padding of frames.

**If the user wrote the script themselves without per-segment division**, the agent does its best to chunk by content matching segment `notes`/`voiceover` hints; the user can request changes after.

**Iteration.** After generating a `Timing`, present it to the user with an explanation of where each beat lands. The user can request adjustments by referencing the script or video. The agent re-emits the `Timing`.

## Default Voice-Over Animation Sync

When a voice-over is set as the default:

1. The agent updates `timeline.ts` to import the voice-over object and assign it to a `default_voiceover` field.
2. The agent performs a **one-time sync pass** over segment code:
   - Reads the active voice-over's `Timing`.
   - For each segment, examines any **fully automated animations** (in-segment animations not gated on `next()` — e.g., a 3-second smooth zoom). Tweaks their durations or trigger times to align with audio beats where appropriate.
   - This is a manual edit performed by the agent, not a runtime mechanism.
3. **Tradeoff acknowledged:** if the user later switches to a different voice-over (via CLI flag), in-segment animations remain tuned to the previous default. Advance timing updates automatically with the new voice-over, but animation tweaks do not. Users who want different in-segment animations per voice-over must either (a) switch the default and re-run the sync, or (b) accept the mismatch.
4. **No re-sync trigger from runtime.** The sync is purely a planning-time agent action.

## Player and Audio Integration

### `dev` mode

- HTML `<audio>` element loaded with the active voice-over's audio file.
- Audio playback follows the player's logical timeline:
  - Pressing play (new HUD button) starts the auto-advance loop and plays audio.
  - Manual nav (prev/next, arrow keys, click) **pauses** audio and the auto-advance.
  - Pressing play again resumes from current position.
- If no voice-over is active (no `default_voiceover` and no `--voiceover` flag), the play button still works — it just auto-advances silently using `default_timing` or segment `advances`.

### `record` mode (post-cleanup)

- Same as `dev` from the player's perspective, but driven non-interactively:
  - Boots the dev server (no separate `record.html`).
  - Auto-advances on a schedule derived from the active `Timing`.
  - Plays `<audio>` through the browser audio output.
- Designed for the user to run their own external screen capture (OS screen recording) over the browser window.
- **No ffmpeg pipeline. No PNG screenshots. No mp4 produced.**

### `render` mode

- Headless deterministic frame-by-frame rendering (existing behavior preserved).
- Frames captured to ffmpeg → silent intermediate mp4.
- Final ffmpeg pass muxes the active voice-over's audio file onto the silent video.
- Audio is written verbatim; no resampling beyond what ffmpeg requires for container compatibility.
- If no voice-over is active, output is silent (current behavior preserved).

## CLI Behavior

`record` and `render` accept:

- `--voiceover <slug>` — use the voice-over at `voiceovers/<slug>/voiceover.ts`. Slug must match the folder name.
- `--voiceover none` — no voice-over; ignore `default_voiceover`; use `default_timing` or segment `advances`.
- *(no `--voiceover` flag)* — use `default_voiceover` from `timeline.ts` if set; otherwise no voice-over.

`dev` does not need a `--voiceover` flag in V1: it uses `default_voiceover` from `timeline.ts` if set, else no audio. (Dropdown switching is explicitly out of scope.)

**Slug resolution.** `--voiceover foo` looks for `voiceovers/foo/voiceover.ts` relative to the resolved video folder. If missing, error and exit.

**Missing audio file.** If `voiceover.ts` references an `audio_file` that doesn't exist, error and exit before launching ffmpeg or the browser.

## HUD Updates

- **New: play/pause button.** Toggle button in the HUD. Starts auto-advance with synced audio (if any). Manual nav pauses; pressing play resumes. Works identically in `dev` and `record`.
- **Existing HUD elements preserved.** Segment ID, beat number, segment time, total time, voice-over hint string (from `SegmentSpec.voiceover`), keyboard shortcuts, error overlay, end-of-timeline badge.
- **No voice-over picker dropdown.** (Cut from V1.)
- **Hidden during render.** Existing `?hideHud=1` behavior preserved.

## Skill Structure

The skill at `packages/lib/skill/` gets a substantially updated `references/voiceover.md` (which already exists as a stub) plus new sub-references for the agent-driven flows. Conceptual outline (architecture decides exact file split):

- **Core voice-over reference** — when to attach a voice-over, the high-level flow, type/file conventions.
- **Style intake** — questions the agent asks the user about voice, tone, excitement, gender preferences before starting (used to inform `provider_script.md` annotations).
- **Script writing** — how to write a per-segment script from `PLAN.md`, how to integrate a user-provided script into `PLAN.md`, sanity checks (spelling, alignment).
- **Provider script transformation** — how to take the PLAN script and emit `provider_script.md` for a specific provider.
- **Flow management** — the ElevenLabs portal flow ("paste this, click that, save files here") and the manual import flow.
- **Sync** — the algorithm for going from per-word/character timing data to a `Timing` object.
- **Default voice-over animation sync** — the one-time pass that tweaks in-segment animations.
- **Provider references:**
  - `elevenlabs.md` — ElevenLabs specifics covering both directions: v3 text-to-speech (tag conventions, pause mechanisms, portal walkthrough, expected output files) and Speech-to-Text (portal walkthrough, expected output JSON schema).
  - `manual.md` — manual flow specifics: how to take a user-provided audio file through the ElevenLabs Speech-to-Text portal, expected output formats.

The core skill (`SKILL.md`) gets light updates so the top-level agent knows voice-over is a supported capability, can route to the voice-over flows, and knows the file conventions when reading existing videos.

## Tooling and Dependencies

- **No new runtime dependencies** in `packages/lib`. Voice-over support is built on existing primitives plus an `<audio>` element in dev/record and an ffmpeg `-i` flag in render.
- **ElevenLabs portal** — no API integration, no API key handling. Used for both AI generation (text-to-speech) and the manual flow's transcription (Speech-to-Text).

## Edge Cases and Errors

- **Audio shorter than total segment duration as defined by `SegmentSpec.advances`.** The voice-over's `Timing` reduces advance counts/durations as needed; video is compressed to match audio. (Audio always wins; this is the normal case.)
- **Audio longer than total segment duration.** Advances stretch; the last advance lands at audio end.
- **Audio file missing on disk.** Hard error before playback or render starts.
- **`provider_timing.json` missing for AI-generated voice-overs.** Hard error during sync timing generation; agent prompts user to download from the portal.
- **`--voiceover <slug>` with non-existent slug.** Hard error.
- **Voice-over set as default but file moved or deleted.** Import in `timeline.ts` fails at module load time; user gets a TS/runtime error.
- **Script-video misalignment detected during sanity checks.** Not a runtime error; the agent flags it during script writing and asks the user how to resolve.
- **User runs `record` or `dev` with browser audio blocked (autoplay policy).** Browser may require user gesture to start audio. The play button serves as that gesture; before pressing play, audio is silent. Document this expectation.

## Backwards Compatibility

- **`SegmentSpec.voiceover: string`** — kept as-is. Repurposed semantically as a HUD hint string. No migration.
- **Existing `record` command** — its **ffmpeg path is removed** as part of Phase 1 of implementation. Users who relied on `record` for mp4 production switch to `render`. Documented in the phase's release notes; existing examples and skill files updated to use `render`.
- **Existing `Timeline` and `SegmentSpec` types** — gain new optional fields (`default_voiceover`, `default_timing` on `Timeline`). No required changes for existing videos. Videos without voice-overs continue to work unchanged.

## Open Questions for Architecture

These are technical decisions to settle in the architecture step:

1. Exact TypeScript shape of `Timing` and `Voiceover` (including whether `Timing.perSegment` is partial or full, and how segments not listed are resolved).
2. ElevenLabs v3 pause mechanism: is `[pause N seconds]` supported? If not, the `provider_script.md` generation guidance needs a documented fallback (combinations of `...`, em-dashes, audio tags).
3. Whether the new `record` command shares its driver loop with `render`'s schedule builder (likely yes — both walk a `Timing` and fire advances at scheduled times; `record` does so via real timers, `render` via deterministic frame counts).
4. ffmpeg audio mux command shape — likely a second pass (`ffmpeg -i silent.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest out.mp4` or similar). Single-pass with `-i` for both is also viable; architecture picks one.
5. Where the auto-advance schedule for `record` is computed (CLI side, browser side, shared module) and how it's communicated to the running player.
