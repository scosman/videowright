---
status: complete
---

# Functional Spec: Audio Tracks

Extends videowright from a single voice-over per video to a full multi-source **audio track**: voice-over, sound effects, and music combined into one rendered audio file via an iterable plan. Videos point at an audio track (not a voice-over); video sync consumes the whole track, not just spoken words.

See [project_overview.md](./project_overview.md) for motivation and high-level concepts.

## Directory Structure

Each video gets a new top-level `audio/` directory. The existing `voiceovers/` and `voiceover/` directories are removed.

```
videos/<video_name>/
  voiceover_script/            # renamed from voiceover/ (script-only)
    script.md
  audio/
    audio_plan.md              # the current audio plan + append-only log
    originals/                 # source files — never edited after import
      voiceovers/              # moved from /voiceovers
        v1/
          audio.mp3
          voiceover.ts         # unchanged: name, length, provider, script, etc.
          timing.json          # unchanged: word-by-word timings
          provider_script.md
          generate.sh
        v2/ ...
      sfx/                     # one slug-named subfolder per sound effect
        keyboard_typing/
          audio.mp3
          sfx.ts               # { name, description, length_s, source, notes }
          generate.sh          # only present for elevenlabs-sourced sfx
        whoosh_swipe/ ...
      music/                   # one slug-named subfolder per music track
        uplift_piano/
          audio.mp3
          music.ts             # { name, description, length_s, source, notes }
          generate.sh
        tense_synth/ ...
    tracks/                    # muxed audio tracks we produce
      v1/
        track.mp3              # rendered output (or track.wav)
        track.ts               # { audio_file, length_s, timing, audio_plan_path, created_at, ... }
        plan_snapshot.md       # point-in-time copy of audio_plan.md (top section only, no log)
      v2/ ...
  timeline.ts                  # now references audio_track_id, not voiceover_id
  PLAN.md
```

### Notes on naming

- **`audio/originals/`** keeps the "never edited" semantics in the path name.
- **`audio/tracks/`** holds the output mixes; accept loose use of "track" (industry would call these "mixes" or "masters" but "track" reads better for general use).
- **`audio_plan.md`** parallels `PLAN.md` so its dual-section pattern is familiar.
- **VO folders** stay numbered (`v1`, `v2`, ...): versions of the same script.
- **SFX and music folders** use semantic slugs (`keyboard_typing`, `uplift_piano`): they're distinct assets, often many per video.

## Originals

Originals are immutable source files. Once a track has been built using an original, the original must not be modified or deleted (renaming or removal would break snapshots). Pre-use deletion is allowed (see SFX/Music Approval Flow below).

### Voice-overs

Largely unchanged from today — relocated to `audio/originals/voiceovers/`. Files: `audio.mp3`, `voiceover.ts`, `timing.json`, `provider_script.md`, `generate.sh`.

The root script folder (formerly `voiceover/`) is renamed to **`voiceover_script/`** to make its role unambiguous; it contains `script.md` only.

### Sound effects (SFX)

Each SFX is a slug-named subfolder under `audio/originals/sfx/`. Slug is short, semantic, kebab-or-snake case (`keyboard_typing`, `door_close`). Required contents:

- `audio.mp3` (or `audio.wav`)
- `sfx.ts` with typed metadata:

  ```ts
  export const sfx = {
    name: "Keyboard typing",
    description: "Mechanical keyboard, fast typing, ~4 second loop",
    length_s: 4.4,
    source: "elevenlabs" as "elevenlabs" | "user",
    notes: "Crisp clicks at start, softens after 2s. Loops cleanly.",
  };
  ```

- `generate.sh` (only for ElevenLabs-sourced SFX; records the prompt and API call for reproducibility, mirroring voiceover convention)

### Music

Each music asset is a slug-named subfolder under `audio/originals/music/`. Same shape as SFX: `audio.mp3` (or `.wav`), `music.ts`, optional `generate.sh`.

`music.ts` uses the same shape as `sfx.ts`. `notes` is the place for any musical detail — subjective or technical, mix freely:

```ts
export const music = {
  name: "Uplift piano",
  description: "Solo piano, gentle build to optimistic resolution",
  length_s: 64.2,
  source: "elevenlabs",
  notes: `
    BPM: 95
    Key: C major
    Mood: hopeful, restrained
    Structure: ambient intro 0–8s, theme enters 8s, build 22–34s, beat drops at 34.2s, gentle outro 50s+
    Loops: cleanly at the bar boundary (every ~10.1s after 8s)
  `,
};
```

We **do not** add structured BPM/key/mood fields. The agent uses `notes` as free text — keeps the schema simple and lets the agent describe what matters per track, including rich technical detail when it has it.

## Audio Plan

The audio plan describes the audio composition for a video. One per video, at `audio/audio_plan.md`. Two sections, modeled on `PLAN.md`:

1. **Plan** (top): the current intended audio composition
2. **Log** (bottom): append-only history of edits and renders

### Plan section format

The plan section opens with a short **prose summary** ("Music bed throughout. VO carries the demo (4.5–22s). Keyboard SFX over the terminal segment, brief whoosh on transitions."), then lists **cues** in playback order.

Each cue uses a labeled-field template followed by an ffmpeg snippet for that cue. The agent writes the ffmpeg; the labeled fields make subjective feedback ("cue 3 a bit quieter") precisely actionable.

**Cue template:**

```
### Cue N — <short name>
Source: <relative path to originals folder>
Slice: <start>–<end> in source  (or "full file")
Place at: <start> in track
Volume: <prose curve, e.g. "100% from 2.0s, ramps to 15% over 6.5–6.7s, back to 100% at 12.4s">
Fades: <e.g. "fade in 0–0.2s, fade out 7.4–7.6s">
Notes: <optional — what this cue is doing musically/narratively>

ffmpeg snippet:
<filter graph fragment that produces a labeled stream, e.g. [sfxN]>
```

After all cues, the plan section ends with a **final mix command** — a single `ffmpeg` invocation that takes every input, applies the per-cue filter fragments, mixes them with `amix` (or equivalent), and writes the output to a target `audio/tracks/vN/track.mp3`. This is the command literally run by the build stage.

### Ducking

Ducking is expressed as an **explicit volume curve** on the underlying cue (typically the music cue). The agent may implement it via scripted volume, sidechain compression, or whatever ffmpeg construct they prefer — but it shows up in the plan as a volume curve on the cue, not as a separate "duck" primitive. This keeps the plan auditable: anyone reading it sees the actual level changes, not an opaque "duck under VO" directive.

### Voice-over slicing and reuse

A single VO file can supply multiple cues. Each VO cue specifies a **slice** of the source (`Slice: 1.2–5.6` means seconds 1.2 to 5.6 of the source `audio.mp3`) and a **placement** in the track (`Place at: 3.4`). Slices may overlap in time across cues (with the agent's intent), and there is no limit on how many cues draw from one VO file.

Example — short slice with inline text, long slice referencing timing file:

```
### Cue 2 — VO catchphrase
Source: audio/originals/voiceovers/v3/
Slice: 1.2–2.4
Place at: 3.4
Notes: VO says "How now brown cow"

### Cue 5 — VO outro (full file)
Source: audio/originals/voiceovers/v3/
Slice: full file
Place at: 9.4
Notes: See word-by-word timing in audio/originals/voiceovers/v3/timing.json
```

Both styles are fine. Inline text in `Notes:` is convenient for short slices; for long VOs, pointing at `timing.json` keeps the plan readable. Either way, the agent can always open `timing.json` to get exact word timings within a slice — the `Notes:` line is for human readability, not the source of truth.

The mixer extracts each slice and places it; the sync-to-audio step uses the slice+placement to map original word times to track times (see Sync section below).

### Log section format

Append-only. Newest entries first (matches `PLAN.md`). Each entry records one discrete event. Two common shapes:

**Render entry:**

```
## 2026-05-15 14:22 — Reduced music level during VO
**Change:** dropped music cue volume from 40% to 16% from 12.3s to end
**Why:** user said music competed with voice-over
**Render:** ffmpeg ... → audio/tracks/v6/track.mp3
```

**Activation entry** (only if the user adopts a different track; ground truth is `timeline.ts`):

```
## 2026-05-15 14:25 — Adopted v6 as active track
```

Free-text body below for longer notes. Do not record "active" as a per-render flag — `timeline.ts`'s import is the single source of truth for which track is live.

## Audio Tracks (output)

Each rendered audio file lives in `audio/tracks/vN/`, parallel to how `voiceovers/vN/` works today.

### Contents

- **`track.mp3`** (or `track.wav`) — the rendered audio. Default format `mp3` for downloads from ElevenLabs unless the user specifies otherwise; either format allowed throughout.
- **`track.ts`** — typed metadata:

  ```ts
  export const track = {
    audio_file: "./audio/tracks/v1/track.mp3",            // relative to the video folder
    length_s: 28.74,
    timing: { perSegment: { /* ... */ } },              // per-segment advances from sync-to-audio
    audio_plan_path: "../../audio_plan.md",             // relative to track.ts
    plan_snapshot_path: "./plan_snapshot.md",
    created_at: "2026-05-15T14:22:00Z",
  };
  ```

- **`plan_snapshot.md`** — a verbatim copy of the **plan section** (no log) from `audio_plan.md` at render time. This is what sync-to-audio reads. Snapshots reference originals by path; they do **not** copy VO `timing.json` or SFX/music metadata (originals are immutable, so pointers are safe).

### Active track

`timeline.ts` imports the active track (via `default_audio_track: AudioTrack`). The import itself is the source of truth — there is no `is_default` flag on `track.ts`. Switching the active track means updating the import in `timeline.ts`. Old tracks remain in `audio/tracks/` for rollback (just re-point the import).

### Rendering

The mix is produced by running the final ffmpeg command embedded in the plan section. The build stage:

1. Allocates the next `vN/` folder
2. Snapshots the plan section into `plan_snapshot.md`
3. Runs the embedded ffmpeg, writing the output into the folder
4. Writes `track.ts`
5. Appends a log entry to `audio_plan.md`
6. Plays the file / prints a clickable `file://` link
7. Prompts the user: **Approve** (updates `timeline.ts` to import this new track as `default_audio_track`; appends an activation log entry) or **Discard and request changes** (deletes the `vN/` folder, takes feedback, agent revises the plan, build again)

## Sourcing flow (SFX & Music)

Mirrors the existing voice-over sourcing pattern: ask the user upfront whether they want SFX/music and how to source it, then guide accordingly.

### Two sources

- **Bring your own (BYO)**: user drops mp3/wav files into the appropriate `originals/` subfolder via the portal or filesystem. Agent prompts for metadata (`name`, `description`, `notes`) and writes the `.ts` file.
- **ElevenLabs APIs**: agent generates using ElevenLabs SFX endpoint (text-to-SFX) and Music endpoint. Both record `generate.sh` for reproducibility.

### Approval UX (per asset)

After an asset lands in `originals/`:

1. Agent prints a clickable absolute `file://...` link to `audio.mp3`
2. Asks the user: **Approve** or **Discard and request changes** (exactly two options)
3. **Approve** → the asset is locked; metadata becomes immutable
4. **Discard and request changes** → the asset folder is **deleted** (pre-use deletion is allowed), user describes what to change, agent regenerates. Iterate until approved.

Once an asset has been used in a rendered track, it can no longer be deleted (snapshots reference it).

For v1, this approval flow is **terminal-only**. Portal-based review of SFX/music is a follow-up project.

## Pipeline integration

Updated production flow:

```
script → voice-over → SFX/music sourcing → audio plan → audio build (mix) → sync video → render
```

Audio is locked before sync because sync now consumes the entire audio track (SFX hits, music swells, VO slicing — all of it). Re-renders of the audio track may trigger a re-sync.

## Timeline integration

`timeline.ts` no longer references a voiceover. It references an audio track via `audio_track_id` (matching the `vN` folder name under `audio/tracks/`). Any field like `voiceover_id` is **removed** — no backward-compatibility shim (pre-v1).

If the referenced track is missing or no track is marked default, the render fails with a clear error pointing at the audio plan / build step.

## Sync video to audio (updated)

Today this skill uses VO word timings only. The updated skill consumes the audio track's `plan_snapshot.md` plus each referenced VO's `timing.json`.

### Inputs

- `audio/tracks/vN/plan_snapshot.md` (where vN is the default track)
- For each VO cue in the snapshot: that VO's `timing.json` from its `originals/voiceovers/vM/` folder

### VO word time mapping

For a VO cue with `Slice: a–b` and `Place at: p`:

> Effective track time of word originally at time `w` = `p + (w − a)`, valid for `a ≤ w ≤ b`.

A single word's effective time only exists if it falls in the slice. Words may appear in multiple cues if multiple cues draw from the same VO with overlapping slices (rare but supported).

### Additional sync anchors

The sync skill also treats labeled SFX placements and notable music moments (anything the agent has captured in a cue's `Notes:` like "beat drops at 5.3s") as **anchors** for visual timing. The exact algorithm is out of scope for this spec — it lives in the sync skill — but the contract is: the snapshot exposes all cue placements, slices, and free-text notes, and sync consumes them.

## Skill updates

The producing skill (the one that today asks about voice-over) is broadened to cover audio holistically.

### Question flow (progressive disclosure)

The skill is a tree of reference files loaded conditionally. Order matters; context budget matters.

Top-level questions (always asked):

1. Will this video have a voice-over? (existing question)
2. Will this video have sound effects?
3. Will this video have background music?

Based on answers, conditionally load:

- VO sourcing reference (existing) → portal or ElevenLabs VO
- SFX sourcing reference → portal or ElevenLabs SFX
- Music sourcing reference → portal or ElevenLabs Music
- Audio plan authoring reference (always loaded if any audio is present)
- ffmpeg cookbook reference (always loaded if any non-VO audio is present)
- ElevenLabs SFX API reference (only loaded if user picks ElevenLabs SFX)
- ElevenLabs Music API reference (only loaded if user picks ElevenLabs Music)

### Style guidance encoded in the skill

The skill encodes opinions about good audio editing for product/demo videos. Rough principles to capture (refine during implementation with examples):

- **Music level**: low under speech, can rise during silences or transitions
- **SFX level**: don't compete with VO; punch in briefly, fade out
- **Ducking**: smooth ramps, not hard cuts; ~0.2s ramps feel natural
- **Headroom**: leave dynamic range, avoid clipping; aim for `-14 LUFS` mix target if measurable
- **Music selection**: match the segment's energy, not just the overall video
- **SFX selection**: enhance, don't decorate; if removing it doesn't hurt, it's noise

### ffmpeg cookbook

A reference file with copy-pasteable ffmpeg recipes for common effects:

- Trim & place a clip at a time offset (`atrim` + `adelay`)
- Constant volume scaling (`volume=0.5`)
- Time-varying volume / ducking (`volume='if(...)'` expressions, or sidechain compression)
- Fade in / fade out (`afade`)
- Crossfade between two clips (`acrossfade`)
- Loop a clip to length (`aloop` + `atrim`)
- Mix N streams (`amix` with weights)
- Final master with normalization (`loudnorm`)

### ElevenLabs API references

Two separate small reference files (loaded only when relevant): SFX API and Music API. Each documents the endpoint, request shape, prompt-writing tips, and how the agent writes `generate.sh`.

## Migration (one-off, scoped to `/examples`)

The only existing project on the new structure is `/examples/videowright_demo/`. The migration is a one-off ad-hoc task scoped exactly to that folder (not a consumer skill, not committed as a reusable guide). Steps, applied to each video under `examples/videowright_demo/videos/`:

1. Rename `voiceover/` → `voiceover_script/`
2. Move `voiceovers/` → `audio/originals/voiceovers/`
3. Create empty `audio/originals/sfx/`, `audio/originals/music/`, `audio/tracks/`
4. Draft a minimal `audio/audio_plan.md` that wraps the existing default VO into a single VO cue (full file, placed at 0s)
5. Build one initial track (just the VO) as `audio/tracks/v1/`, mark as default
6. Update `timeline.ts`: remove `voiceover_id`, add `audio_track_id: "v1"`
7. Spot-check the render

Once the three demo videos under `/examples/videowright_demo/` are migrated, the migration is complete — no further projects exist.

## Edge cases & error handling

- **Missing originals at render time**: ffmpeg fails. Build stage catches the failure, prints which path was missing, leaves the `vN/` folder untouched (or cleans it up — implementer's choice), suggests next step.
- **VO slice out of range**: validation before ffmpeg. If `Slice: 1.2–5.6` but the VO is 4.0s long, fail with a clear message ("VO v3 is 4.0s; slice 1.2–5.6 exceeds source").
- **Cue placement past end of video**: warning, not error (cues may legitimately extend past video end if the video is being timed to audio).
- **No default track at render**: render fails with a pointer to `audio_plan.md` and the build step.
- **Pre-used asset deletion attempt**: agent refuses; explains the asset is referenced by track v3 (and any others) and would corrupt their snapshots.
- **Concurrent edits to `audio_plan.md`**: not handled. Single-user assumption matches the rest of videowright.

## Configuration & defaults

- **Output format**: `mp3` default; `wav` allowed if requested
- **Loudness target**: `-14 LUFS` recommended in skill guidance, not enforced
- **Default track on new render**: `false`; user must approve to set as default

## Non-goals (v1)

- Portal-based review of SFX/music (terminal-only for v1)
- Structured per-source metadata for music (BPM/key/mood as fields) — use free-text `notes`
- Multi-user concurrent editing
- Auto-mastering / loudness normalization as a separate step (skill recommends `loudnorm`; not a system feature)
- Backward compatibility with the old `voiceover_id` field
- Stereo panning as a first-class concept (agent can do it in ffmpeg if they want)
- Multi-language audio tracks (one audio plan, one default track per video)
