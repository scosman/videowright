# Sound Effects (SFX)

## When this is loaded

You were routed here from [audio.md](../../audio.md) because the user wants to add sound effects to their video. This reference covers sourcing, approving, and managing SFX assets.

## Overview

Each SFX is a short audio clip stored in `audio/originals/sfx/<slug>/`. SFX assets are immutable once used in a rendered track. The agent sources them (BYO or ElevenLabs), gets user approval, then references them in the audio plan as cues.

## Sourcing decision

Ask the user how they want to source sound effects:

> How would you like to source sound effects?
>
> 1. **Bring your own** -- drop an audio file (mp3/wav) into the project and I will set it up.
> 2. **Generate with ElevenLabs** -- describe the sound you want and I will generate it via the ElevenLabs Sound Generation API. **Requires a paid plan and API key.**

Based on the answer, load the appropriate provider reference:

- **BYO** -- load [providers/manual.md](providers/manual.md)
- **ElevenLabs** -- load [providers/elevenlabs.md](providers/elevenlabs.md)

If the user wants multiple SFX, they may use different sources for each. Ask per-asset or batch as appropriate.

## Folder structure

```
audio/originals/sfx/
  keyboard_typing/
    audio.mp3          # source audio (immutable after approval)
    sfx.ts             # typed metadata
    generate.sh        # only for ElevenLabs-sourced SFX
  whoosh_swipe/
    audio.mp3
    sfx.ts
```

## Slug naming

SFX folders use short, semantic, snake_case names that describe the sound:

- `keyboard_typing`
- `door_close`
- `whoosh_swipe`
- `notification_chime`
- `paper_shuffle`

The slug should be recognizable at a glance in the audio plan. Avoid generic names like `sfx_1` or `sound_effect_a`.

## `sfx.ts` metadata

Each SFX asset has a typed metadata file:

```ts
import type { SfxAsset } from "videowright";

export const sfx: SfxAsset = {
  name: "Keyboard typing",
  description: "Mechanical keyboard, fast typing, ~4 second loop",
  length_s: 4.4,
  source: "elevenlabs",
  notes: "Crisp clicks at start, softens after 2s. Loops cleanly.",
};

export default sfx;
```

Fields:

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Human-readable name for display and reference. |
| `description` | Yes | One-line summary of what the sound is. Used by the agent when selecting SFX for cues. |
| `length_s` | Yes | Duration in seconds, measured via ffprobe. Round to 1 decimal place. |
| `source` | Yes | `"elevenlabs"` or `"user"`. Records provenance. |
| `notes` | No | Free-text observations about the sound. Useful detail: loop points, transient positions, frequency character, anything that helps place it in a mix. |

If the `SfxAsset` type is not yet exported from videowright, use an inline type annotation or `any` -- the shape is what matters.

## Approval UX

After an SFX asset is sourced (file in place, `sfx.ts` written), present it for approval:

1. **Print a clickable absolute `file://` link** to the audio file so the user can listen:

   ```
   Listen to the sound effect:
   file:///absolute/path/to/audio/originals/sfx/keyboard_typing/audio.mp3
   ```

2. **Prompt with exactly two options:**

   > 1. **Approve** -- lock this asset for use in the audio plan.
   > 2. **Discard and request changes** -- delete this asset and try again.

3. **On Approve:**
   - The asset is now locked. Its folder and contents must not be modified or deleted.
   - Proceed to integrate it into the audio plan (see "Integration into audio plan" below).

4. **On Discard:**
   - Delete the entire asset folder:
     ```bash
     rm -rf audio/originals/sfx/<slug>/
     ```
   - Ask: "What should change about this sound effect?"
   - Take feedback and re-source (loop back to the provider flow).

### Pre-use deletion only

An SFX folder can only be deleted if it has **never been used** in a rendered track. Once a track references it (via a plan snapshot), deletion would corrupt the snapshot. If the user asks to delete a used asset, refuse and explain which track(s) reference it.

## Integration into audio plan

After approval, the SFX is ready to be referenced in `audio/audio_plan.md` as a cue. See [../cue_template.md](../cue_template.md) for the cue format.

Typical SFX cue:

```
### Cue 3 -- Keyboard typing
Source: audio/originals/sfx/keyboard_typing/
Slice: full file
Place at: 5.2
Volume: 50%
Fades: fade in 0-0.1s, fade out 4.2-4.4s
Notes: Typing sound during terminal demo segment. Subtle backdrop.
```

Key points:
- `Source:` points to the SFX folder (the build step finds `audio.mp3` within it).
- `Volume:` for SFX is typically 40-70% of VO level. See [../styles.md](../styles.md) for guidance.
- Brief fades (0.1-0.3s) prevent clicks. Always add at least a 0.1s fade-in and fade-out.
- Use `Slice:` if you only need part of the SFX (`Slice: 0.5-2.0` for a 1.5s excerpt).

## Multiple SFX per video

Videos commonly have 2-5 sound effects. Source and approve them one at a time (or batch if the user prefers), then arrange them as cues in the audio plan. Each SFX gets its own folder under `audio/originals/sfx/`.

## Edge cases

| Situation | Behavior |
|---|---|
| User wants to preview before committing to a source | Fine -- generate or import, play via file:// link, then decide. The approval UX handles this. |
| SFX is too long (> 10s) | Not an error, but unusual. Confirm with the user that they want a long ambient texture rather than a punctual effect. |
| User wants to edit an approved SFX | Cannot modify in place (immutable). Source a new version in a new slug folder, approve it, and update the audio plan cues to reference the new slug. |
| Format is .wav instead of .mp3 | Both are valid. Use whatever the source provides. Reference `audio.wav` instead of `audio.mp3` in the folder. |
