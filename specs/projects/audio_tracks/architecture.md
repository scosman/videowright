---
status: complete
---

# Architecture: Audio Tracks

This project is roughly 80% skill work and 20% library code. The skill teaches the agent to author audio plans, source assets, run ffmpeg, snapshot, and approve. The library code is just enough to make the timeline reference an audio track instead of a voice-over, so render and timing resolution have something to load.

Single-doc architecture (no `components/` step). Estimated ~450 lines.

## Deliverable summary

### Code changes (small, scoped to `packages/lib/src`)

| File | Change |
|---|---|
| `types.ts` | Add `AudioTrack` type; replace `default_voiceover` on `Timeline` with `default_audio_track`; keep `Voiceover` type for source VO files |
| `timeline/loadAudioTrack.ts` | **New.** Mirrors `loadVoiceover.ts`: loads `audio/tracks/<id>/track.ts`, resolves `audio_file` to absolute path |
| `timeline/loadVoiceover.ts` | **Path update.** Reads from `audio/originals/voiceovers/<slug>/` instead of `voiceovers/<slug>/`. Still exported (the agent and skill workflows still need to load source VOs to compute timings) |
| `timeline/resolveTiming.ts` | Swap `Voiceover`-shaped inputs for `AudioTrack`-shaped; update the `source` discriminator |
| `cli/render.ts` | Replace voiceover loading with audio-track loading; the audio file path comes from `audioTrack.audio_file` |
| `cli/argv.ts` | Rename `--voiceover` flag to `--audio-track`; `none` semantics preserved |
| `cli/vite_helpers.ts` | Rename `voiceoverNone` browser global to `audioTrackNone` |
| `cli/script_cmd.ts` | Write to `voiceover_script/script.md` instead of `voiceover/script.md` |
| `skill/assets/hello_world/` | Restructure to the new `audio/` layout; include a pre-built single-VO track so render works out of the box |

### Skill work (the bulk — all in `packages/lib/skill/`)

- New top-level audio entry point and progressive-disclosure subtree
- New plan-format and ffmpeg-cookbook references
- New SFX and music sourcing references (BYO + ElevenLabs)
- New build / sync / approve workflows (all agent-driven via bash + ffmpeg + file ops)
- Reorganize existing voiceover references under the audio umbrella

### Out-of-band deliverable

- One-off migration of `/examples/videowright_demo/` (three videos) to the new layout. Not committed as a reusable skill.

## Data model

### `AudioTrack` (new type in `types.ts`)

The shape of `audio/tracks/<id>/track.ts`:

```ts
export type AudioTrack = {
  /**
   * Path to the rendered audio file. On disk in track.ts, relative to the
   * track.ts file's directory. After loadAudioTrack(), rewritten to absolute.
   * When inlined as `default_audio_track` in timeline.ts, relative to the
   * video folder.
   */
  audio_file: string;

  /** Length of the rendered audio in seconds. */
  length_s: number;

  /**
   * Per-segment advance timing synced to this audio track. Computed by the
   * sync-to-audio skill from the plan_snapshot + per-cue VO timing.json files.
   * Same shape and semantics as today's `Voiceover.timing`.
   */
  timing: Timing;

  /** Path to the audio plan that produced this track (relative to track.ts). */
  audio_plan_path?: string;

  /** Path to the point-in-time plan snapshot for this track (relative to track.ts). */
  plan_snapshot_path?: string;

  /** ISO timestamp when this track was rendered. */
  created_at?: string;

  /** Freeform notes about this track. */
  notes?: string;
};
```

### `Timeline` update

```ts
export interface Timeline {
  meta: TimelineMeta;
  segments: TimelineEntry[];
  default_timing?: Timing;
  default_audio_track?: AudioTrack;   // was: default_voiceover?: Voiceover
}
```

No backwards compatibility. `default_voiceover` is removed entirely (pre-v1).

### `Voiceover` (existing type, unchanged shape, narrower scope)

The `Voiceover` type stays — `audio/originals/voiceovers/<slug>/voiceover.ts` files still default-export `Voiceover`. But these objects are no longer referenced by `timeline.ts`. They serve as **source data** that:

1. The agent reads when authoring VO cues in the audio plan
2. The sync-to-audio skill reads (along with `provider_timing_file` / `timing.json`) to compute the audio track's per-segment advances

The voiceover's `timing.perSegment` field is now used by the agent as a *starting hint* for sync computations — not consumed directly by render.

## Library code changes

### `timeline/loadAudioTrack.ts` (new)

Direct mirror of `loadVoiceover.ts`. Signature:

```ts
export interface LoadAudioTrackArgs {
  videoFolder: string;
  trackId: string;       // e.g. "v3"
}

export interface LoadAudioTrackResult {
  audioTrack: AudioTrack;        // with audio_file rewritten to absolute path
  trackFolder: string;            // absolute path to audio/tracks/<id>/
  audioFilePath: string;          // absolute
}

export async function loadAudioTrack(args: LoadAudioTrackArgs): Promise<LoadAudioTrackResult>;
```

Resolution path: `<videoFolder>/audio/tracks/<trackId>/track.ts`.

Error cases (all `UserError` with helpful hints):
- track.ts missing → "Audio track not found: ... Check audio/tracks/<id>/track.ts"
- Invalid module shape → "track.ts must default-export an AudioTrack with at least audio_file"
- Referenced audio file missing → "Audio file not found: ..."

### `timeline/loadVoiceover.ts` (path update only)

Change one line:

```ts
const voiceoverPath = resolve(videoFolder, "audio/originals/voiceovers", slug, "voiceover.ts");
```

Everything else (the loader's contract, error messages updated) stays as-is.

### `timeline/resolveTiming.ts`

Rename the voiceover-shaped fields to audio-track-shaped:

```ts
export type ResolvedTiming = {
  source: "audio_track" | "default_timing" | "segments";
  audioTrack?: AudioTrack;
  perSegment: Record<string, number[]>;
};

export interface ResolveTimingArgs {
  segments: TimingSegment[];
  defaultTiming?: Timing;
  defaultAudioTrack?: AudioTrack;
  cliAudioTrackId?: string | "none";
  cliAudioTrackModule?: AudioTrack;
}
```

Precedence (unchanged in spirit):

1. CLI `--audio-track <id>` (loaded module)
2. `timeline.default_audio_track`
3. `timeline.default_timing`
4. Per-segment `SegmentSpec.advances`

`--audio-track none` suppresses 1 and 2; preserves 3.

### `cli/render.ts`

The audio file path resolution shifts from voiceover-centric to audio-track-centric. Replace the existing block (lines ~239–270 today) with the parallel `loadAudioTrack` flow:

```ts
let audioFilePath: string | undefined;
let cliAudioTrackModule: AudioTrack | undefined;

if (cliAudioTrackSlug && cliAudioTrackSlug !== "none") {
  const result = await loadAudioTrack({ videoFolder, trackId: cliAudioTrackSlug });
  cliAudioTrackModule = result.audioTrack;
  audioFilePath = result.audioFilePath;
} else if (!audioTrackSuppressed && timeline.default_audio_track) {
  const defaultAudioPath = resolve(videoFolder, timeline.default_audio_track.audio_file);
  if (!existsSync(defaultAudioPath)) {
    throw new UserError(
      `Audio file not found: ${defaultAudioPath}`,
      "Check the audio_file path in your timeline's default_audio_track.",
    );
  }
  audioFilePath = defaultAudioPath;
}
```

Pass `audioFilePath` to `buildFfmpegArgs` exactly as today. `ffmpeg.ts` itself is **unchanged** — the audio file is just an MP3 like before, even though it's now muxed from multiple sources upstream.

If `audio_track_id` is missing (or `--audio-track none`), render proceeds with no audio (matches today's no-voiceover behavior). Loud console warning at render start ("Rendering with no audio track. Set default_audio_track in timeline.ts or pass --audio-track.").

### `cli/argv.ts`

Rename flag and constant:

- `--voiceover <slug>` → `--audio-track <id>`
- `VOICEOVER_COMMANDS` set → `AUDIO_TRACK_COMMANDS` (same content: `render` only)
- Error messages updated

### `cli/vite_helpers.ts`

Browser-side virtual global `voiceoverNone` → `audioTrackNone`. Same semantics (suppresses audio playback in the dev player).

### `cli/script_cmd.ts`

Writes the VO script to `voiceover_script/script.md` (renamed from `voiceover/`). Creates the directory if missing.

## Skill structure

The skill tree gets a new top-level audio entry point. Existing voiceover references are moved under `references/audio/voiceover/` to make the umbrella explicit.

### New tree under `packages/lib/skill/references/`

```
audio.md                          # NEW — top-level audio orchestration. Asks the user: VO? SFX? Music? Loads sub-refs based on answers
audio/
  audio_plan.md                   # NEW — full spec of the audio_plan.md format
  cue_template.md                 # NEW — per-cue labeled-field template + ffmpeg snippet shape
  build.md                        # NEW — how to mux a track: snapshot, run ffmpeg, write track.ts, approve flow
  sync.md                         # NEW — updated sync-to-audio: read snapshot + per-cue timing.json, compute Timing.perSegment, update track.ts
  ffmpeg_cookbook.md              # NEW — copy-pasteable ffmpeg recipes (atrim, adelay, volume curves, afade, acrossfade, aloop, amix, loudnorm)
  styles.md                       # NEW — editing style guidance (music levels under speech, SFX punch-and-fade, ducking ramps, headroom)
  voiceover.md                    # MOVED from references/voiceover.md, paths updated
  voiceover/                      # MOVED from references/voiceover/
    style_intake.md
    script_writing.md
    animation_sync.md
    provider_script.md
    sync_algorithm.md             # superseded by audio/sync.md for sync; kept for legacy reference if useful, or removed
    providers/
      elevenlabs.md
      manual.md
  sfx/
    sfx.md                        # NEW — BYO vs ElevenLabs decision, sfx.ts metadata authoring
    providers/
      elevenlabs.md               # NEW — ElevenLabs SFX API; generate.sh template
      manual.md                   # NEW — BYO via portal/filesystem
  music/
    music.md                      # NEW — BYO vs ElevenLabs decision, music.ts metadata authoring (rich free-text notes for BPM/key/mood)
    providers/
      elevenlabs.md               # NEW — ElevenLabs Music API; generate.sh template
      manual.md                   # NEW — BYO via portal/filesystem
```

### Progressive disclosure design

`SKILL.md` is updated to ask the user upfront (still terse, decision-driven):

> Will this video have a voice-over? (yes / no)
> Will it have sound effects? (yes / no)
> Will it have background music? (yes / no)

Based on answers, load only the relevant sub-trees. The dependency graph:

- VO yes → `audio/voiceover.md` → conditionally `audio/voiceover/providers/elevenlabs.md` or `manual.md`
- SFX yes → `audio/sfx/sfx.md` → conditionally providers/{elevenlabs,manual}.md
- Music yes → `audio/music/music.md` → conditionally providers/{elevenlabs,manual}.md
- Any of {SFX, music} yes OR `Multi-VO cue` desired → load `audio/audio_plan.md`, `audio/cue_template.md`, `audio/ffmpeg_cookbook.md`, `audio/styles.md`, `audio/build.md`
- VO-only with single cue (today's flow) → minimal plan auto-emitted by skill; user doesn't see plan complexity
- Sync stage → always load `audio/sync.md` when timing the video to audio

The skill MUST avoid loading provider-specific references the user didn't ask for. ElevenLabs SFX docs should not be in context when the user picked BYO.

### `SKILL.md` changes

- Top-level questions broadened (VO/SFX/music)
- Voiceover section becomes "Audio" section, pointing at `references/audio.md`
- Build/sync stages updated to reference new audio-aware variants

## Audio plan format (recap from functional spec)

Just to anchor the architecture — the format is specified in detail in `audio/audio_plan.md` (skill ref) and `functional_spec.md`. Key points relevant to the library:

- Single file per video at `audio/audio_plan.md`
- Two sections delimited by markdown headers: **Plan** (current) and **Log** (append-only history)
- Plan section ends with a final ffmpeg command using `{TRACK_OUT}` as the output path placeholder
- Snapshot = verbatim copy of the Plan section (Log excluded). Split is text-based on the `## Log` heading.

The library never parses the plan. The agent does, via bash + ffmpeg.

## Build / mux workflow (skill-driven)

`audio/build.md` teaches the agent this sequence:

1. **Determine the next track ID**: list `audio/tracks/`, pick `v<n+1>` where `n` is the highest existing.
2. **Create the folder**: `mkdir -p audio/tracks/v<n+1>/`
3. **Snapshot the plan**: copy `audio/audio_plan.md` content up to (but not including) the `## Log` heading into `audio/tracks/v<n+1>/plan_snapshot.md`
4. **Substitute and run ffmpeg**: extract the final ffmpeg command from the plan, replace `{TRACK_OUT}` with `audio/tracks/v<n+1>/track.mp3` (or `.wav` per plan), run it
5. **Write `track.ts`**: emit the typed metadata module; length measured from the rendered file via `ffprobe`. `timing` carries over from the previously active track (or stub `{ perSegment: {} }` if first track); sync-to-audio updates it later.
6. **Append a render Log entry to `audio_plan.md`**: timestamp, summary, ffmpeg command, output path. (No "active" flag — that's `timeline.ts`'s job.)
7. **Print clickable `file://` link** to the rendered file
8. **Prompt user**: "Approve / Discard and request changes"
   - **Approve**: update `timeline.ts` to import the new track as `default_audio_track` (replace the prior `import defaultAudioTrack from ".../track.js"` line). Append an activation Log entry to `audio_plan.md`.
   - **Discard**: delete the `vN/` folder. Take feedback. Iterate the plan. Loop back to step 1.

All operations are bash + ffmpeg + file edits. No new library code.

## Sync-to-audio workflow (skill-driven)

`audio/sync.md` supersedes today's `voiceover/sync_algorithm.md` for sync purposes. The agent's algorithm:

1. **Read the default track**: find `audio/tracks/*/track.ts` with `is_default: true`. Read `plan_snapshot.md` from the same folder.
2. **Parse VO cues from the snapshot**: agent reads markdown, extracts each `### Cue N` block whose `Source:` points at `audio/originals/voiceovers/...`, parses `Slice:` and `Place at:` from the labeled fields.
3. **Load each referenced VO's `timing.json`**: from the source folder.
4. **Compute effective word times on the track**: for each word at original time `w`, in cue with `Slice: a–b` and `Place at: p`, effective time = `p + (w − a)` if `a ≤ w ≤ b`.
5. **Augment with SFX/music anchors**: agent reads `Notes:` fields for free-text hints like "beat drops at 5.3s in track" and treats those as sync candidates.
6. **Map to per-segment advances**: same algorithm as today's voiceover sync — match script words to segment advance points, emit `Timing.perSegment`.
7. **Update `track.ts`**: write the new `timing` field. Append a sync Log entry to `audio_plan.md`.

The library exposes nothing for steps 2–6. The agent's existing capabilities (file reads, regex, arithmetic) are sufficient.

## Sourcing workflow (skill-driven)

For each asset kind (SFX, music), the skill flow is symmetric:

1. Ask BYO vs ElevenLabs
2. If BYO: instruct the user to drop the file into the appropriate `audio/originals/<kind>/<slug>/` folder. Agent prompts for `name`, `description`, free-text `notes`. Writes the `.ts` file. Measures `length_s` via `ffprobe`.
3. If ElevenLabs: agent calls the API, writes the audio file + `generate.sh` (records the prompt + curl command), then the same metadata flow.
4. **Approval**: print clickable `file://` link → prompt "Approve / Discard and request changes" → on Discard, delete the asset folder (allowed pre-use) and iterate.

Provider-specific skill refs (`audio/sfx/providers/elevenlabs.md`, `audio/music/providers/elevenlabs.md`) document each ElevenLabs endpoint, request shape, prompt-writing tips, `generate.sh` template.

## Hello-world template

Located at `packages/lib/skill/assets/hello_world/`. Restructured to the new layout:

```
hello_world/
  voiceover_script/script.md
  audio/
    audio_plan.md                          # minimal single-VO cue
    originals/
      voiceovers/v1/
        voiceover.ts
        audio.mp3
        timing.json
        provider_script.md
    tracks/
      v1/
        track.mp3                          # initially a copy of the VO audio
        plan_snapshot.md
        track.ts                           # points at track.mp3, has timing
  segments/...
  timeline.ts                              # imports default_audio_track from audio/tracks/v1/track.js (this import IS the active track)
```

`hello_world` ships render-ready so users can run `videowright render` immediately after `create-videowright`.

## Migration (one-off, scoped to `/examples/videowright_demo/`)

Three videos under `examples/videowright_demo/videos/` (`demo_video`, `demo_editorial_mono`, `demo_risograph`). For each:

1. `mv voiceover voiceover_script`
2. `mkdir -p audio/originals audio/tracks`
3. `mv voiceovers audio/originals/voiceovers`
4. Create `audio/originals/sfx/` and `audio/originals/music/` (empty)
5. Draft a minimal `audio/audio_plan.md` wrapping the existing default VO in one full-file cue, with an ffmpeg command that copies the VO MP3 to `{TRACK_OUT}` (or runs through ffmpeg for re-encode consistency)
6. Build `audio/tracks/v1/` per the build workflow above.
7. Update `timeline.ts`: replace `import defaultVoiceover from "./voiceovers/v4/voiceover.js"` and `default_voiceover: defaultVoiceover` with `import defaultAudioTrack from "./audio/tracks/v1/track.js"` and `default_audio_track: defaultAudioTrack`.
8. `videowright render --video <slug>` to spot-check.

Once all three videos are migrated and rendering, the migration is complete. No reusable artifact.

## Testing strategy

### Unit tests (`packages/lib/test/unit/`)

- **`loadAudioTrack.test.ts`** (new):
  - Loads a valid `track.ts` from a fixture, returns absolute paths
  - Throws `UserError` with the expected hint when track.ts is missing
  - Throws when default export shape is invalid
  - Throws when referenced audio file is missing
- **`resolveTiming.test.ts`** (update existing):
  - Update test fixtures from `Voiceover` to `AudioTrack`
  - Verify precedence: CLI override > default_audio_track > default_timing > segments
  - `--audio-track none` suppresses level 1 and 2 but preserves level 3
- **`loadVoiceover.test.ts`** (update existing):
  - Path fixtures updated to `audio/originals/voiceovers/`

### Integration tests (`packages/lib/test/integration/`)

- **`render_audio_track.test.ts`** (new):
  - Render a fixture video with a `default_audio_track`; verify the resulting MP4 has the expected audio file muxed in
- **`render_no_audio_track.test.ts`** (new):
  - Render with `--audio-track none` or no default; verify silent video output and the warning is logged
- **`script_cmd.test.ts`** (update existing):
  - Verify output goes to `voiceover_script/script.md`

### Manual test plan (skill work — no automated coverage)

- Run through the hello-world template end-to-end (`create-videowright` → render)
- For the migrated `/examples/videowright_demo/`: render all three videos, confirm audio matches the pre-migration version
- Author a simple multi-cue plan (VO + 1 music + 1 SFX), build, sync, render. Confirm audio sounds right and visuals are still aligned.

## Error handling

| Situation | Behavior |
|---|---|
| `timeline.default_audio_track` missing AND no `--audio-track` | Render warns "no audio track set", proceeds with silent video |
| `--audio-track <id>` references missing track | `UserError` with hint to check `audio/tracks/<id>/track.ts` |
| `track.ts` references missing audio file | `UserError` with hint to re-run audio build |
| `track.ts` malformed (no default export, missing `audio_file`) | `UserError` with the expected shape |
| Plan ffmpeg command fails during build | (Skill responsibility — agent surfaces stderr to user, doesn't write `track.ts`) |
| `Source:` path in plan references a deleted original | (Skill responsibility — agent validates before running ffmpeg) |

## Design decisions (resolved)

1. **No `is_default` flag on `track.ts`.** `timeline.ts`'s `default_audio_track` import is the single source of truth for which track is active. No invariant to enforce, no flag to keep in sync. Activation = updating the import.
2. **`length_s` derivation** — agent runs `ffprobe` from bash. No library helper.
3. **`track.ts`'s `audio_file` field** — relative to the track.ts folder on disk (e.g. `./track.mp3`), rewritten to absolute by `loadAudioTrack`. Mirrors existing voiceover.ts behavior.
4. **`voiceover/sync_algorithm.md`** — removed/migrated into `audio/sync.md`. No backwards compatibility.
5. **`generate.sh` for SFX/music** — same shape as VO `generate.sh` (shell script recording the curl command + prompt). Predictable for the agent.

## Out of scope

- Portal-based review of SFX/music (terminal-only for v1)
- Per-asset structured metadata for music (BPM/key/mood as fields)
- A new `videowright audio build` CLI command (build is skill-driven)
- Auto-mastering / loudness normalization as a separate library feature
- Multi-language audio tracks (one default track per video)
- Backwards-compat shims for `default_voiceover`, `--voiceover`, `voiceovers/`, `voiceover/`
