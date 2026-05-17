# Audio Plan Format

## When this is loaded

You are authoring or editing an `audio_plan.md` file for a video. This reference specifies the format, the two-section structure, and the conventions the build and sync stages depend on.

## Overview

Every video with audio gets one `audio_plan.md` at `videos/<video-slug>/audio/audio_plan.md`. It describes the complete audio composition: which source assets are used, how they are sliced and placed in time, their volume curves and fades, and the ffmpeg command that renders the final mix.

The file has two sections:

1. **Plan** (top) -- the current intended audio composition. Overwritten as the mix evolves.
2. **Log** (bottom) -- append-only history of edits and renders. Never delete entries.

The build stage reads the Plan section to produce a rendered track. The sync stage reads the rendered track's snapshot to compute per-segment timing. The Log section is for human and agent reference only.

## Plan section

### Structure

```markdown
# Audio Plan

## Plan

<prose summary>

### Cue 1 -- <short name>
<labeled fields + ffmpeg snippet>

### Cue 2 -- <short name>
<labeled fields + ffmpeg snippet>

...

### Final mix command

<single ffmpeg invocation>

## Log

<append-only entries>
```

### Prose summary

A 1-3 sentence description of the audio composition. It anchors what the mix is trying to achieve and helps when reviewing cue-level detail.

Examples:

> Music bed throughout. VO carries the demo (4.5-22s). Keyboard SFX over the terminal segment, brief whoosh on transitions.

> VO-only track. Single full-file voiceover placed at 0s.

### Cues

Cues are listed in playback order. Each cue uses the labeled-field template defined in [cue_template.md](cue_template.md). Every cue ends with an ffmpeg snippet that produces a labeled audio stream.

Number cues sequentially starting at 1. When cues are added or removed, renumber.

### Final mix command

After all cues, the plan includes a single complete ffmpeg invocation that:

1. Takes every input file referenced by the cues
2. Applies the per-cue filter fragments
3. Mixes them with `amix` (or equivalent)
4. Writes output to `{TRACK_OUT}`

The `{TRACK_OUT}` placeholder is replaced at build time with the actual output path (e.g., `audio/tracks/v3/track.mp3`).

The final mix command must be a **self-contained, runnable ffmpeg command** -- not a fragment. It should include all inputs, the complete filter graph, and the output path placeholder.

Example (VO-only, simplest case):

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -c:a libmp3lame -q:a 2 \
  {TRACK_OUT}
```

Example (VO + music with ducking):

```bash
ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -i audio/originals/music/uplift_piano/audio.mp3 \
  -filter_complex "
    [0:a] atrim=0:22.5, asetpts=PTS-STARTPTS [vo];
    [1:a] atrim=0:30, asetpts=PTS-STARTPTS,
          volume='if(between(t,4.5,22),0.15,1)':eval=frame,
          afade=t=in:st=0:d=0.5, afade=t=out:st=28:d=2 [music];
    [vo][music] amix=inputs=2:duration=longest:normalize=0 [mix];
    [mix] loudnorm=I=-14:TP=-1:LRA=11 [out]
  " -map "[out]" -c:a libmp3lame -q:a 2 {TRACK_OUT}
```

### Paths in the plan

All paths in the plan are **relative to the video folder** (the parent of `audio/`). This matches the working directory when the agent runs ffmpeg from the video folder.

Example: `audio/originals/voiceovers/v1/audio.mp3`, not an absolute path.

## Log section

The Log section is below the Plan section, separated by `## Log`. Entries are newest-first (most recent at the top, matching PLAN.md convention). Each entry records one discrete event.

### Render entry

```markdown
## YYYY-MM-DD HH:MM -- <summary of what changed>
**Change:** <what was modified in the plan>
**Why:** <user feedback or reason>
**Render:** ffmpeg ... -> audio/tracks/vN/track.mp3
```

### Activation entry

Written when the user approves a track and it becomes the default:

```markdown
## YYYY-MM-DD HH:MM -- Adopted vN as active track
```

### Discard entry

Written when the user discards a rendered track:

```markdown
## YYYY-MM-DD HH:MM -- Discarded vN
**Why:** <user feedback>
```

### Edit entry

For plan-only changes (no render):

```markdown
## YYYY-MM-DD HH:MM -- <what changed>
**Change:** <description>
**Why:** <reason>
```

Free-text body below the structured fields is welcome for longer notes.

## VO-only shortcut

For videos with only a voiceover and no SFX or music, the audio plan is minimal:

```markdown
# Audio Plan

## Plan

VO-only track. Single full-file voiceover placed at 0s.

### Cue 1 -- VO (full file)
Source: audio/originals/voiceovers/v1/
Slice: full file
Place at: 0s
Volume: 100%
Fades: none
Notes: Full voiceover, see timing.json for word timings.

ffmpeg snippet:
[0:a] acopy [vo1]

### Final mix command

ffmpeg -y \
  -i audio/originals/voiceovers/v1/audio.mp3 \
  -c:a libmp3lame -q:a 2 \
  {TRACK_OUT}

## Log

(No entries yet.)
```

For VO-only videos, the plan is auto-emitted by the skill. The user does not need to understand the plan format -- it is created as part of the voiceover flow and consumed transparently by build and sync.

## Editing the plan

When the user requests changes to the audio mix:

1. Update the relevant cues in the Plan section (add, remove, or modify cues).
2. Update the final mix command to match the new cue set.
3. Renumber cues if needed.
4. Do **not** modify the Log section when editing the plan. Log entries are appended only at build time or when significant plan changes are recorded.

## Relationship to other files

- **`cue_template.md`** -- defines the per-cue field format
- **`build.md`** -- reads the plan to produce a rendered track
- **`sync.md`** -- reads the track's plan snapshot to compute timing
- **`ffmpeg_cookbook.md`** -- recipes for common ffmpeg operations used in cue snippets
- **`styles.md`** -- guidance on volume levels, ducking, and mix aesthetics
