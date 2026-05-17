# Manual SFX (Bring Your Own)

## When this is loaded

The user has their own sound effect audio file and wants to add it to the project. This is the BYO path from [../sfx.md](../sfx.md).

## Overview

The manual flow takes a user-provided audio file, places it in the correct folder, gathers metadata, and presents it for approval. No API calls needed.

## Step 1: Set up the folder

Choose a slug name for this SFX. The slug should describe the sound in short snake_case:

- `keyboard_typing`
- `glass_break`
- `subtle_chime`

Create the directory:

```bash
mkdir -p audio/originals/sfx/<slug>/
```

## Step 2: Get the audio file

Ask the user for the file. Two options:

1. **File path.** The user provides a path to an existing file. Copy it into the folder:
   ```bash
   cp /path/to/their/file.mp3 audio/originals/sfx/<slug>/audio.mp3
   ```

2. **Drop-in.** Ask the user to place the file directly:
   > Place your audio file at `audio/originals/sfx/<slug>/audio.mp3` (or `audio.wav`).

### Supported formats

- MP3 and WAV are standard. Both work with ffmpeg.
- Other formats (M4A, OGG, FLAC) are also accepted by ffmpeg. Note the actual extension in the folder.
- No specific sample rate or bitrate requirements.

## Step 3: Gather metadata

Ask the user for:

> I need a few details about this sound effect:
>
> 1. **Name** -- a short human-readable name (e.g., "Keyboard typing")
> 2. **Description** -- one sentence describing the sound (e.g., "Mechanical keyboard, fast typing, ~4 second loop")
> 3. **Notes** (optional) -- any extra detail that might help when mixing (loop points, transient positions, frequency character)

If the user does not provide notes, omit the field or leave it empty.

## Step 4: Measure duration

Use ffprobe to get the exact length:

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  audio/originals/sfx/<slug>/audio.mp3
```

Round to 1 decimal place for `length_s`.

## Step 5: Write `sfx.ts`

Create `audio/originals/sfx/<slug>/sfx.ts`:

```ts
import type { SfxAsset } from "videowright";

export const sfx: SfxAsset = {
  name: "<name from user>",
  description: "<description from user>",
  length_s: <measured duration>,
  source: "user",
  notes: "<notes from user, or omit>",
};

export default sfx;
```

Set `source: "user"` to record that this was a BYO asset.

There is no `generate.sh` for BYO assets (nothing to reproduce).

## Step 6: Trigger approval UX

Follow the approval flow from [../sfx.md](../sfx.md):

1. Print the clickable `file://` link to the audio file.
2. Prompt: Approve or Discard and request changes.
3. On Approve: asset is locked, ready for use in the audio plan.
4. On Discard: delete the folder, ask what to change, loop back.

For BYO assets, "discard and request changes" means the user needs to provide a different file. Ask them to supply a new recording or file.

## Expected folder state after approval

```
audio/originals/sfx/<slug>/
  audio.mp3    # user-provided audio (immutable after approval)
  sfx.ts       # typed metadata
```

No `generate.sh` for BYO assets.

## Edge cases

| Situation | Behavior |
|---|---|
| User provides a stereo file | Fine. ffmpeg handles stereo. Note in `notes` if relevant to mixing. |
| File is very short (< 0.1s) | Warn that the SFX may be too short to be audible in the mix. Proceed if user confirms. |
| File is very long (> 30s) | Not typical for SFX. Confirm the user wants a long ambient texture, not a music track. Suggest using [../music/music.md](../music/music.md) for longer audio if appropriate. |
| User wants to replace after approval | Cannot edit in place. Source a new version in a new slug folder and update audio plan cues. |
