# Background Music

## When this is loaded

You were routed here from [audio.md](../../audio.md) because the user wants to add background music to their video. This reference covers sourcing, approving, and managing music assets.

## Overview

Each music asset is a slug-named folder under `audio/originals/music/`. Music assets are immutable once used in a rendered track. The agent sources them (BYO, ElevenLabs, or Openverse), gets user approval, then references them in the audio plan as cues with volume curves and ducking.

## Sourcing decision

Ask the user how they want to source background music. Always ask when starting a new sourcing job, even if existing music in the project used a specific source -- don't assume continuity with prior assets.

> How would you like to source background music?
>
> 1. **Bring your own** -- drop an audio file (mp3/wav) into the project and I will set it up.
> 2. **Generate with ElevenLabs** -- describe the music you want and I will generate it via the ElevenLabs Music Generation API. **Requires a paid plan and API key.**
> 3. **Search Openverse** -- search for freely-licensed music online. No API key required, free to use.

Based on the answer, load the appropriate provider reference:

- **BYO** -- load [providers/manual.md](providers/manual.md)
- **ElevenLabs** -- load [providers/elevenlabs.md](providers/elevenlabs.md)
- **Openverse** -- load [providers/openverse.md](providers/openverse.md)

## Folder structure

```
audio/originals/music/
  uplift_piano/
    audio.mp3          # source audio (immutable after approval)
    music.ts           # typed metadata with rich notes
    generate.sh        # only for ElevenLabs-sourced music
  tense_synth/
    audio.mp3
    music.ts
    generate.sh
```

## Slug naming

Music folders use short, semantic, snake_case names that describe the track's character:

- `uplift_piano`
- `tense_synth`
- `calm_ambient`
- `energetic_percussion`
- `corporate_upbeat`

The slug should convey the mood/instrument at a glance. Avoid generic names like `music_1` or `track_a`.

## `music.ts` metadata

Each music asset has a typed metadata file. The `notes` field is the key differentiator from SFX -- it should contain rich musical detail:

```ts
import type { MusicAsset } from "videowright";

export const music: MusicAsset = {
  name: "Uplift piano",
  description: "Solo piano, gentle build to optimistic resolution",
  length_s: 64.2,
  source: "elevenlabs",
  notes: `
    BPM: 95
    Key: C major
    Mood: hopeful, restrained
    Structure: ambient intro 0-8s, theme enters 8s, build 22-34s, beat drops at 34.2s, gentle outro 50s+
    Loops: cleanly at the bar boundary (every ~10.1s after 8s)
  `,
};

export default music;
```

Fields:

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Human-readable name for display and reference. |
| `description` | Yes | One-line summary of the track's character. |
| `length_s` | Yes | Duration in seconds, measured via ffprobe. Round to 1 decimal place. |
| `source` | Yes | `"elevenlabs"`, `"user"`, or `"openverse"`. Records provenance. |
| `notes` | Yes (strongly encouraged) | Free-text musical detail. See "What to capture in notes" below. |

If the `MusicAsset` type is not yet exported from videowright, use an inline type annotation or `any` -- the shape is what matters.

### What to capture in notes

The `notes` field is free text. There are no structured fields for BPM, key, or mood -- instead, mix any useful detail freely. Common things worth noting:

- **BPM** -- critical for beat-aligned visuals
- **Key** -- useful if combining with other musical elements
- **Mood** -- helps the agent choose volume curves and placement
- **Structure** -- timestamps of sections (intro, build, drop, outro). Essential for slicing and ducking.
- **Loop points** -- where the track loops cleanly, if applicable
- **Beat positions** -- where notable rhythmic events land (useful as sync anchors)
- **Instrument palette** -- what instruments are present
- **Frequency range** -- if the track is mostly low-end, high-end, or full-spectrum

Not all fields apply to every track. Write what is useful. Even brief notes ("ambient, no strong beat, loops after 8s") are better than nothing.

## Approval UX

After a music asset is sourced (file in place, `music.ts` written), present it for approval:

1. **Print a clickable absolute `file://` link** to the audio file:

   ```
   Listen to the music track:
   file:///absolute/path/to/audio/originals/music/uplift_piano/audio.mp3
   ```

2. **Prompt with exactly two options:**

   > 1. **Approve** -- lock this asset for use in the audio plan.
   > 2. **Discard and request changes** -- delete this asset and try again.

3. **On Approve:**
   - The asset is locked. Its folder and contents must not be modified or deleted.
   - Proceed to integrate it into the audio plan (see "Integration into audio plan" below).

4. **On Discard:**
   - Delete the entire asset folder:
     ```bash
     rm -rf audio/originals/music/<slug>/
     ```
   - Ask: "What should change about this music?"
   - Take feedback and re-source (loop back to the provider flow).

### Pre-use deletion only

A music folder can only be deleted if it has **never been used** in a rendered track. Once a track references it (via a plan snapshot), deletion would corrupt the snapshot. If the user asks to delete a used asset, refuse and explain which track(s) reference it.

## Integration into audio plan

After approval, the music is ready to be referenced in `audio/audio_plan.md` as a cue. See [../cue_template.md](../cue_template.md) for the cue format.

Typical music cue:

```
### Cue 1 -- Background music
Source: audio/originals/music/uplift_piano/
Slice: 0-45.0
Place at: 0.0
Volume: 100% from 0s, ramps to 15% over 2.8-3.0s (VO starts at 3.0s), 15% from 3.0-22.0s, ramps to 50% over 22.0-22.3s (animation beat), ramps to 15% over 23.5-23.7s, 15% from 23.7-40.0s, ramps to 80% over 40.0-40.2s (outro), fade out 43.0-45.0s
Fades: fade in 0-0.5s, fade out 43.0-45.0s
Notes: Music bed throughout. Ducked under all VO segments. Rises during visual-only transitions and outro.
```

Key points:
- `Source:` points to the music folder.
- `Volume:` expresses the full ducking curve explicitly. The agent writes the actual levels at each point in time -- no opaque "duck under VO" directives. See [../styles.md](../styles.md) for level guidance.
- Music typically spans most or all of the video. Use `Slice:` to trim if the track is longer than needed.
- Ducking ramps should be ~0.2s (see [../styles.md](../styles.md)).
- If the track has a strong beat, align visual transitions to beat boundaries where possible (compute from BPM in notes).

## One track or many?

For most product/demo videos (30s-3min), **one music track** is sufficient. The ducking curve provides enough variation. Multiple tracks increase complexity -- only use them if the video has distinct tonal sections requiring genuinely different music.

## Edge cases

| Situation | Behavior |
|---|---|
| Music is shorter than the video | Use `aloop` in ffmpeg to loop it. Note loop points in `music.ts` notes. See [../ffmpeg_cookbook.md](../ffmpeg_cookbook.md). |
| Music is much longer than the video | Use `Slice:` in the cue to take only the needed portion. |
| User wants music but no VO | Music plays at full level throughout. No ducking needed. Volume curve is simple: fade in, hold at 100%, fade out. |
| User wants to swap music after a track is built | Source a new music asset in a new slug folder, approve it, update the audio plan cues to reference the new slug, rebuild the track. |
| User provides a copyrighted track | Agent does not police copyright. Note in `music.ts` notes if the user mentions licensing (e.g., "Licensed via Epidemic Sound"). |
