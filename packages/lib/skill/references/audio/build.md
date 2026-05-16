# Audio Track Build

## When this is loaded

You have an audio plan (`audio/audio_plan.md`) and are ready to render it into an audio track. This reference walks through the mux-to-approve workflow.

## Overview

Building an audio track means running the ffmpeg command from the audio plan to produce a rendered audio file, then asking the user to approve or discard the result. All operations are bash commands and file edits -- no library code is involved.

## Prerequisites

- The video has an `audio/audio_plan.md` with a complete Plan section (cues + final mix command).
- All source files referenced by the plan exist in `audio/originals/`.
- ffmpeg is installed and on PATH.

## Build workflow

Run these steps from the video folder (e.g., `videos/demo_video/`).

### Step 1: Determine the next track ID

List existing tracks and pick the next version:

```bash
ls audio/tracks/ 2>/dev/null
```

If no tracks exist, use `v1`. Otherwise, find the highest `vN` and use `v(N+1)`.

### Step 2: Create the track folder

```bash
mkdir -p audio/tracks/vN/
```

### Step 3: Snapshot the plan

Copy the Plan section of `audio/audio_plan.md` (everything from the top of the file down to but not including `## Log`) into `audio/tracks/vN/plan_snapshot.md`.

The snapshot is a verbatim copy. Do not modify it. This is what the sync stage reads.

**Splitting rule:** find the line that starts with `## Log` and take everything above it. If there is no `## Log` heading, snapshot the entire file.

### Step 4: Run ffmpeg

Extract the final mix command from the Plan section. Replace `{TRACK_OUT}` with the actual output path:

```bash
# Example: replace {TRACK_OUT} with audio/tracks/v3/track.mp3
ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -c:a libmp3lame -q:a 2 \
  audio/tracks/v3/track.mp3
```

**Run the command from the video folder** so that relative paths in the plan resolve correctly.

If ffmpeg fails:
- Print the full stderr output.
- Check for common issues: missing input files, invalid filter syntax, malformed paths.
- Do **not** write `track.ts` or append to the log.
- Present the error to the user and suggest next steps (fix the plan, check source files).

### Step 5: Measure duration

Use ffprobe to get the rendered file's duration:

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  audio/tracks/vN/track.mp3
```

This returns a number like `28.742000`. Use it for `length_s` in track.ts.

### Step 6: Write track.ts

Create `audio/tracks/vN/track.ts`:

```ts
import type { AudioTrack } from "videowright";

const track: AudioTrack = {
  audio_file: "./track.mp3",
  length_s: 28.74,
  timing: { perSegment: {} },
  audio_plan_path: "../../audio_plan.md",
  plan_snapshot_path: "./plan_snapshot.md",
  created_at: "2026-05-15T14:22:00Z",
};

export default track;
```

Notes:
- `audio_file` is relative to the track.ts file.
- `length_s` comes from ffprobe (step 5). Round to 2 decimal places.
- `timing` starts as `{ perSegment: {} }` for a new track. If a previous track exists and is active, copy its `timing` as a starting point. The sync stage will update it.
- `created_at` is the current ISO timestamp.
- `audio_plan_path` and `plan_snapshot_path` are relative to the track.ts file.

### Step 7: Append a render log entry

Append to the Log section of `audio/audio_plan.md`:

```markdown
## YYYY-MM-DD HH:MM -- <summary>
**Change:** <what was modified or "initial build">
**Why:** <user feedback or "first render">
**Render:** audio/tracks/vN/track.mp3
```

### Step 8: Present the result

Print a clickable absolute `file://` link to the rendered audio file so the user can listen:

```
Listen to the rendered track:
file:///absolute/path/to/audio/tracks/vN/track.mp3
```

Use the absolute path so the link works in any terminal.

### Step 9: Prompt for approval

Ask the user exactly two options:

> 1. **Approve** -- set this as the active audio track.
> 2. **Discard and request changes** -- delete this track and revise the plan.

Do not proceed without an explicit choice.

### On Approve

1. **Update timeline.ts** to import the new track as `default_audio_track`:

   Find and replace the existing audio track import (or add one if this is the first track):

   ```ts
   import defaultAudioTrack from './audio/tracks/vN/track.js';
   ```

   And in the timeline object:

   ```ts
   default_audio_track: defaultAudioTrack,
   ```

   Note: the import path uses `.js` extension (TypeScript ESM convention), not `.ts`.

2. **Append an activation log entry** to `audio/audio_plan.md`:

   ```markdown
   ## YYYY-MM-DD HH:MM -- Adopted vN as active track
   ```

3. **Proceed to sync** if the video has per-segment timing needs. Load [sync.md](sync.md) to compute the `Timing` from the track's plan snapshot and VO timing data.

### On Discard

1. **Delete the track folder**:

   ```bash
   rm -rf audio/tracks/vN/
   ```

2. **Append a discard log entry** to `audio/audio_plan.md` (the log is append-only -- never delete entries):

   ```markdown
   ## YYYY-MM-DD HH:MM -- Discarded vN
   **Why:** <user's feedback>
   ```

3. **Ask for feedback**: "What should change?"

4. **Revise the plan** based on feedback: edit cues, adjust volumes, change fades, etc.

5. **Loop back to Step 1** and build again.

## Rebuilding after plan changes

When the user requests mix changes after an approved track:

1. Edit the Plan section of `audio/audio_plan.md` (update cues, volumes, etc.).
2. Run the full build workflow again (Steps 1-9). The new track gets the next version number.
3. The old track remains in `audio/tracks/` for rollback. To revert, just update the timeline.ts import to point back at the old track.

## Validation before build

Before running ffmpeg, validate:

- All `Source:` paths in the plan point to existing folders.
- Each source folder contains an `audio.mp3` or `audio.wav` file.
- The final mix command references the correct number of inputs.
- `{TRACK_OUT}` is present in the final mix command.

If validation fails, report the specific issue and do not run ffmpeg.

## Error handling

| Situation | Behavior |
|---|---|
| ffmpeg not found | Error with install instructions (see [../export.md](../export.md) for ffmpeg install guidance). |
| Source file missing | Report which path is missing. Suggest checking `audio/originals/`. |
| ffmpeg filter error | Print stderr. Common causes: typo in filter name, mismatched input count, missing `asetpts` after `atrim`. |
| Output file is 0 bytes | ffmpeg ran but produced no audio. Check filter graph for dead paths (stream never reaches output). |
| Plan has no final mix command | Error: "No final mix command found in audio_plan.md. Add a `### Final mix command` section." |
