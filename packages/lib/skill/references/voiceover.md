# Voiceover

## When this is loaded

You were routed here from the intent dispatch table or from another workflow that needs to work with voiceover content. This is the top-level reference for all voiceover functionality.

## Overview

Videowright supports voiceover audio integrated into video playback. A voiceover consists of an audio file (mp3 or wav), a `Timing` that syncs segment advances to the audio, and metadata stored in a typed `voiceover.ts` file. Audio plays in the dev server via an HTML `<audio>` element and is muxed into MP4 output by `render` via ffmpeg.

Two production flows are supported:

- **AI-generated** -- write a script, transform it with v2-targeted provider annotations, generate audio via ElevenLabs (API key or web portal), and import the audio and per-word timing JSON.
- **Manual** -- user provides their own audio file, then runs it through ElevenLabs Speech-to-Text to get per-word timing data for sync.

Both flows produce the same output: a `voiceover.ts` file with a `Voiceover` object that includes the audio path and a `Timing` object.

## Flow entry point

When the user asks to "add a voiceover" or "generate a voiceover", ask:

> Do you have an audio file already, or would you like to generate one with AI text-to-speech?

- **AI generation** -- follow Flow A below.
- **User-provided audio** -- follow Flow B below.

### Flow A: AI generation (ElevenLabs)

1. **Approach and voice selection.** Ask API key vs. portal, then (API only) which voice from the curated catalog. See [voiceover/providers/elevenlabs.md](voiceover/providers/elevenlabs.md) for the mode selection prompt and [voice catalog](#curated-voice-catalog).
2. **Style intake.** Ask the user about tone and emotional arc preferences. See [voiceover/style_intake.md](voiceover/style_intake.md).
3. **Script.** Write or integrate the VO script into PLAN.md. See [voiceover/script_writing.md](voiceover/script_writing.md).
4. **Provider script.** Transform the PLAN script into `provider_script.md` with v2-targeted annotations (SSML `<break>` tags, punctuation-driven prosody -- no v3 emotion tags). See [voiceover/provider_script.md](voiceover/provider_script.md).
5. **Audio generation.** Follow the sub-flow for the approach chosen in step 1. See [voiceover/providers/elevenlabs.md](voiceover/providers/elevenlabs.md).
6. **Sync timing.** Read the provider timing JSON and compute a `Timing` object. See [voiceover/sync_algorithm.md](voiceover/sync_algorithm.md).
7. **Default voiceover?** Ask whether to set this as the default. If yes, update `timeline.ts` and run a one-time animation sync. See [voiceover/animation_sync.md](voiceover/animation_sync.md).
8. **Write `voiceover.ts`.** Create the typed module exporting a `Voiceover` object.

### Curated voice catalog

When the user picks the **API key** approach in step 1, immediately present this catalog (default is **Asher** if no preference):

| # | Voice | Description |
|---|---|---|
| 1 | **Asher** (`tMvyQtpCVQ0DkixuYm6J`) | Warm, conversational male voice with confident, grounded delivery. Good default for explainers, narration, and commercial reads. |
| 2 | **Cecily** (`Uc7anshoV8mdBhDnEZEX`) | Warm middle-aged African-American female voice, West Coast. Engaging for ads, social, and brand storytelling. |
| 3 | **Don** (`8IbUB2LiiCZ85IJAHNnZ`) | Young American male voice, casual and approachable. Great for social, storytelling, and audiobook-style narration. |
| 4 | **Hanna** (`Hh0rE70WfnSFN80K8uJC`) | Professional American female voice. Best for informative narration, e-learning, and corporate voiceover. |
| 5 | **Other** | User provides their own ElevenLabs voice ID (browse at https://elevenlabs.io/app/voice-library). |

If the user does not pick, default to **Asher**. Add the selected voice ID to `.env` as `ELEVENLABS_VOICE_ID`.

Portal users skip this catalog -- they pick a voice visually in the ElevenLabs UI during audio generation (step 5).

### Flow B: Manual (user-provided audio)

1. **Get the audio.** Ask the user to provide or drop an audio file into `voiceovers/<slug>/`.
2. **Generate transcript and timing.** Walk the user through ElevenLabs Speech-to-Text to get per-word timing data. See [voiceover/providers/manual.md](voiceover/providers/manual.md).
3. **Sync timing.** Same as Flow A step 6.
4. **Default voiceover?** Same as Flow A step 7.
5. **Write `voiceover.ts`.** Same as Flow A step 8.

## File and folder conventions

Voiceovers live per-video under the video folder:

```
videos/<video-slug>/
  timeline.ts
  PLAN.md
  voiceovers/
    <vo-slug>/
      voiceover.ts             # typed Voiceover object (default export)
      <audio-file>.mp3|wav     # any name, referenced from voiceover.ts
      provider_timing.json     # provider-supplied per-word timings (optional)
      provider_script.md       # provider-annotated script (AI flow only)
```

**Slug naming.** Both auto-versioned (`v1`, `v2`) and user-named (`narrator-warm`, `take-3`) are valid. The slug is the folder name and is what the user passes to `--voiceover <slug>`.

**Multiple voiceovers.** Stored as separate sibling folders under `voiceovers/`. Each is independent and self-contained. Only one can be active at a time (via CLI flag or `default_voiceover`).

## Types

### `Voiceover`

```ts
type Voiceover = {
  audio_file: string;             // path relative to the voiceover.ts file
  provider: "elevenlabs" | "manual";
  provider_timing_file?: string;  // path relative to the voiceover.ts file
  timing: Timing;
  notes?: string;
};
```

### `Timing`

```ts
type Timing = {
  perSegment: Partial<Record<string, number[]>>;
};
```

A `Timing` overrides segment `advances` for any segments it lists. Segments not listed fall back to their own `advances` array.

### `Timeline` extensions

```ts
interface Timeline {
  meta: TimelineMeta;
  segments: TimelineEntry[];
  default_timing?: Timing;       // standalone timing overrides
  default_voiceover?: Voiceover; // default voiceover for this video
}
```

## Writing `voiceover.ts`

A voiceover module default-exports a `Voiceover` object:

```ts
import type { Voiceover } from 'videowright';

const voiceover: Voiceover = {
  audio_file: './narration.mp3',
  provider: 'elevenlabs',
  provider_timing_file: './provider_timing.json',
  timing: {
    perSegment: {
      'intro':          [4.2],
      'feature-cards':  [2.1, 5.8, 9.3, 12.0],
      'outro':          [3.5],
    },
  },
  notes: 'Warm male voice, conversational tone',
};

export default voiceover;
```

## Setting a default voiceover

When a voiceover is set as default, update `timeline.ts` to import and assign it:

```ts
import '../../styles/editorial-mono/tokens.css';
import type { Timeline } from 'videowright';
import defaultVoiceover from './voiceovers/v1/voiceover.js';

const timeline: Timeline = {
  meta: { title: 'My Video' },
  segments: [
    { id: 'intro' },
    { id: 'feature-cards', transition: 'fade' },
    { id: 'outro', transition: 'fade' },
  ],
  default_voiceover: defaultVoiceover,
};

export default timeline;
```

When using `default_voiceover`, the `audio_file` and `provider_timing_file` paths in the voiceover object are relative to the video folder (the directory containing `timeline.ts`), not the voiceover.ts directory. Adjust paths accordingly -- typically `./voiceovers/<slug>/narration.mp3`.

## CLI usage

`render` accepts `--voiceover`:

```bash
# Use a specific voiceover
npx videowright render --voiceover v1

# Suppress voiceover (ignore default_voiceover, use default_timing or segment advances)
npx videowright render --voiceover none

# No flag: use default_voiceover from timeline.ts if set, otherwise no audio
npx videowright render
```

`dev` does not accept `--voiceover`. It uses `default_voiceover` from `timeline.ts` if set, otherwise no audio.

## Audio playback by mode

| Mode | Audio mechanism | Behavior |
|---|---|---|
| `dev` | HTML `<audio>` element | Play button in HUD starts auto-advance with synced audio. Manual nav pauses audio. |
| `render` | ffmpeg audio mux | Audio file is muxed into the output MP4 as a second input to ffmpeg. No `<audio>` element. |

## Timing precedence

When determining advance schedules:

1. **Active voiceover's `timing`** -- if a voiceover is active (via `--voiceover <slug>` or `default_voiceover`).
2. **`default_timing`** on `timeline.ts` -- if no voiceover is active.
3. **`SegmentSpec.advances`** -- per-segment fallback.

`--voiceover none` suppresses voiceovers (skips levels 1 and 2 for voiceover) but still respects `default_timing`.

## The `voiceover` field on segments

Each segment can declare a `voiceover` string in `defineSegment`:

```ts
export default defineSegment({
  id: 'intro',
  advances: [3.0],
  voiceover: 'Welcome to the product demo.',
  async play(ctx) { await ctx.hold(3000); },
});
```

This field is:

- **Shown in the HUD** during dev mode.
- **Collected by `videowright script`** into a single markdown document.
- **Used by the agent** to understand the segment's narrative purpose when editing.

It is a display hint, not the canonical voiceover audio source. The canonical audio comes from the `Voiceover` object in `voiceover.ts`.

## VO-first authoring

The default authoring pattern for new videos with voiceover intent:

1. **Write the script first.** Draft the full VO copy organized by segment in PLAN.md.
2. **Scaffold segments from the script.** Each segment's content and timing follow from its VO text. A 30-word section suggests ~12s; a 100-word section suggests ~40s (based on ~150 WPM).
3. **Use `waitForNext()` for every VO-aligned beat.** Each content reveal that a voiceover line should cue must be gated by `waitForNext()`, not `hold()`. This is what makes voiceover-swapping possible — different voiceovers supply different advance timings, and segments respond by advancing at the right moment without code changes. Use `hold()` only for animation lead-in or fixed internal pauses within a beat.
4. **Set `voiceover` on each segment** to its section of the script.
5. **Generate the audio** using one of the two flows above.
6. **Sync timing** to align segment advances with the audio.

## `videowright script` CLI

The `script` command reads segments' `voiceover` fields and assembles them into markdown:

```bash
npx videowright script              # print to stdout
npx videowright script --write      # write to voiceover/script.md
```

See the `videowright script` section below for output format and `--write` behavior.

### Output format

```markdown
# Video Title

## segment-id-1
Voiceover text for the first segment.

## segment-id-2
Voiceover text for the second segment.

---

*No voiceover: segment-id-3, segment-id-4*
```

### `--write` flag

With `--write`, the script is written to `videos/<name>/voiceover/script.md`. Without `--write`, it prints to stdout.

## Keeping things in sync

The `voiceover` field on each segment and `voiceover/script.md` are two representations of the same content:

- **After editing `voiceover` fields** on segments, run `npx videowright script --write` to regenerate `script.md`.
- **After editing `script.md`** directly, update each segment's `voiceover` field to match.

## Edge cases

| Situation | Behavior |
|---|---|
| User wants VO but has no script yet | Draft one during the build phase based on the video's purpose and segment outline. |
| User changes audio intent from silent to voiceover mid-project | Add `voiceover` fields to existing segments. Run `videowright script --write`. Follow the voiceover flow to generate audio and timing. |
| Audio file missing on disk | CLI errors before playback or render starts with a clear message and path. |
| `--voiceover <slug>` with non-existent slug | CLI errors with a hint to check the voiceovers folder. |
| Browser autoplay blocked | Audio is silent until the user clicks the play button (which counts as a user gesture). |
| Default voiceover set but user switches via `--voiceover <other-slug>` | Advance timing updates automatically. In-segment animations remain tuned to the original default -- the user can re-run the animation sync pass if needed. |
