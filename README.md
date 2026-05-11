# Videowright

**Turn a coding agent into a video team.**

Videowright creates demo videos, explainer videos, and product walkthroughs end-to-end. Describe what you want to a coding agent, and it builds, previews, and exports a finished video.

https://github.com/user-attachments/assets/236ab8d1-d5ea-4fe9-b340-e07d9dbf90a4

- **Video from prompt** -- generate an animated video, simply from a prompt
- **AI voice-overs** -- generate narration from a script, then auto-sync video timing to the audio
- **Six built-in visual styles** -- or create your own from a brand guide or description
- **Pixel-perfect MP4 export** -- deterministic frame-by-frame rendering, no dropped frames
- **Hot-reloading dev server** -- iterate on segments in chat, see changes instantly
- **Works in any major coding agent** -- Claude Code, Codex, opencode, etc

## Install

Paste this into your coding agent (Claude Code, Codex, or opencode):

> Install Videowright using these instructions:
> https://github.com/scosman/videowright/raw/refs/heads/main/packages/lib/skill/install/INSTALL.md

The agent reads the install prompt and walks you through setup -- package install, skill files, and project scaffolding.

## How Does Videowright Work?

You describe the video you want. The agent writes segments -- self-contained TypeScript modules that each render one beat of the video. You preview in the dev player (`npx videowright dev`), give feedback in chat, and the agent iterates. Videowright will generate an AI voiceover, and sync the video to match. When you're happy, export with `npx videowright render` or capture with `npx videowright record`.

## Styles

Pick one of six built-in styles, or create your own from a brand guide, reference URL, or short description.

<img width="953" height="549" alt="Built-in style packs" src="https://github.com/user-attachments/assets/3aaeecc2-7ca4-4c5a-8ed2-9adc4e226b2d" />

Same video script, two different styles -- both generated in a single prompt:

<table><tr>
<td width="45%">

https://github.com/user-attachments/assets/5df0bde1-b759-4ba8-aeef-4dddc8e60c24

</td>
<td width="45%">

https://github.com/user-attachments/assets/1960c3e8-a3f2-4028-91ab-afbc79a53fca

</td>
</tr></table>

## AI Voice-Overs

Videowright supports a full voiceover pipeline: write a narration script, generate audio with text-to-speech, get precise word-level timestamps via speech-to-text, then auto-align every video beat to your narration.

The workflow:

1. **Write the script.** Draft voiceover copy organized by segment in your video's plan. The `npx videowright script` command assembles all segments' voiceover text into a single markdown document for review or handoff.
2. **Generate audio.** Use AI text-to-speech (ElevenLabs is supported out of the box) or record your own narration -- both flows produce the same output.
3. **Get timestamps.** Run the audio through speech-to-text to get per-word timing data. This tells Videowright exactly when each line is spoken.
4. **Sync.** The agent computes a timing object that maps each segment's advances to the audio timestamps. Video beats land on the narration automatically.

When you update the audio -- re-record a line, change pacing, swap voices -- the video re-syncs to match. Segments don't need code changes; only the timing data updates.

**Reordering sections** is just a conversation. Ask the agent to move a segment and it uses ffmpeg to splice the audio files, updates the timing data, and reorders the timeline. Script, audio, and video stay in sync.

## CLI and Capture

Three modes, depending on where you are in the workflow:

- **`npx videowright dev`** -- Dev server with hot reload. For building and iterating, not recording.
- **`npx videowright record`** -- Auto-advancing playback for external screen capture. Use when narrating live or controlling pacing manually.
- **`npx videowright render`** -- Deterministic frame-by-frame MP4 export via Playwright + ffmpeg. Pixel-perfect, byte-identical across runs. Pass `--voiceover <slug>` to mux audio into the output.

## How Videowright Was Built

Videowright is [vibe crafted](https://github.com/scosman/vibe-crafting) -- a form of vibe coding with structured specs, thorough tests, and a human in the loop for technical decisions. It's not perfect, but since it's designed to produce one-off videos (not run in production), that's fine.

The test suite is robust: unit tests, integration tests, and end-to-end tests that include pixel-perfect rendering checks. These verify that animations driven by `requestAnimationFrame`, `setTimeout`, CSS keyframes, and the Web Animations API all produce identical frames across runs -- the same determinism guarantee that makes `videowright render` work.

If you encounter an error, describe it to your coding agent. A good agent can quickly diagnose and repair the issue.

## License

[MIT](LICENSE)

All runtime dependencies are MIT, ISC, or BSD-3-Clause. No copyleft, no BUSL.
