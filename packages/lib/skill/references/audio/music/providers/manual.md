# Manual Music (Bring Your Own)

## When this is loaded

The user has their own music audio file and wants to add it to the project. This is the BYO path from [../music.md](../music.md).

## Overview

The manual flow takes a user-provided music file, places it in the correct folder, gathers rich metadata, and presents it for approval. No API calls needed.

## Step 1: Set up the folder

Choose a slug name for this music track. The slug should describe the track's character in short snake_case:

- `uplift_piano`
- `calm_ambient`
- `energetic_corporate`
- `dark_synth_intro`

Create the directory:

```bash
mkdir -p audio/originals/music/<slug>/
```

## Step 2: Get the audio file

Ask the user for the file. Two options:

1. **File path.** The user provides a path to an existing file. Copy it into the folder:
   ```bash
   cp /path/to/their/file.mp3 audio/originals/music/<slug>/audio.mp3
   ```

2. **Drop-in.** Ask the user to place the file directly:
   > Place your music file at `audio/originals/music/<slug>/audio.mp3` (or `audio.wav`).

### Supported formats

- MP3 and WAV are standard. Both work with ffmpeg.
- Other formats (M4A, OGG, FLAC, AIFF) are also accepted by ffmpeg.
- No specific sample rate or bitrate requirements.

## Step 3: Gather metadata

Music metadata should be richer than SFX. Ask the user:

> I need details about this music track. Please share as much as you know:
>
> 1. **Name** -- a short descriptive name (e.g., "Uplift piano")
> 2. **Description** -- one sentence summary (e.g., "Solo piano, gentle build to optimistic resolution")
> 3. **Notes** -- any musical detail you know. Helpful things to include:
>    - BPM (tempo)
>    - Key (e.g., C major, A minor)
>    - Mood (e.g., hopeful, tense, calm)
>    - Structure (e.g., "intro 0-8s, main theme 8-30s, outro 30-40s")
>    - Loop points (where it loops cleanly, if applicable)
>    - Instrument palette
>    - Licensing info (if relevant)
>
> Even partial info is useful -- I will ask follow-up questions if needed.

### Agent-observed details

After the user provides their info, the agent should also note any additional observations in `notes`:

- If BPM was not provided, ask the user to estimate or measure it after listening
- Ask the user about any structural transitions (energy changes, instrument entrances)
- Ask whether the track has a clean ending or fades out
- Ask whether it loops well

Combine user-provided info and agent observations into the `notes` field.

## Step 4: Measure duration

Use ffprobe to get the exact length:

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  audio/originals/music/<slug>/audio.mp3
```

Round to 1 decimal place for `length_s`.

## Step 5: Write `music.ts`

Create `audio/originals/music/<slug>/music.ts`:

```ts
import type { MusicAsset } from "videowright";

export const music: MusicAsset = {
  name: "<name from user>",
  description: "<description from user>",
  length_s: <measured duration>,
  source: "user",
  notes: `
    <combined notes from user + agent observations>
  `,
};

export default music;
```

Set `source: "user"` to record that this was a BYO asset.

There is no `generate.sh` for BYO assets.

## Step 6: Trigger approval UX

Follow the approval flow from [../music.md](../music.md):

1. Print the clickable `file://` link to the audio file.
2. Prompt: Approve or Discard and request changes.
3. On Approve: asset is locked, ready for use in the audio plan.
4. On Discard: delete the folder, ask what to change, loop back.

For BYO assets, "discard and request changes" means the user needs to provide a different file. Ask them to supply a different track.

## Expected folder state after approval

```
audio/originals/music/<slug>/
  audio.mp3    # user-provided audio (immutable after approval)
  music.ts     # typed metadata with rich notes
```

No `generate.sh` for BYO assets.

## Edge cases

| Situation | Behavior |
|---|---|
| Track has vocals | Warn that vocals may conflict with voiceover. Suggest an instrumental version if available, or note that heavy ducking will be needed. |
| Track is very short (< 10s) | May need looping. Note loop-ability in `notes`. See [../../ffmpeg_cookbook.md](../../ffmpeg_cookbook.md) for `aloop`. |
| Track is very long (> 5min) | Fine -- the audio plan will use `Slice:` to take only the needed portion. |
| User does not know BPM/key | That is fine. BPM is optional -- ask the user to estimate if needed. Key is optional. Write what is known. |
| User mentions licensing/attribution | Record in `notes` (e.g., "Licensed via Artlist, attribution required in credits"). The agent does not enforce licensing. |
| User wants to replace after approval | Cannot edit in place. Source a new version in a new slug folder and update audio plan cues. |
