# Videowright

**Create a video with a prompt.**

Videowright creates demo videos, explainer videos, and product walkthroughs from your coding agent. Just describe what you want and it generates your video (including audio). Iterate in chat until it's perfect.

<video src="https://github.com/user-attachments/assets/236ab8d1-d5ea-4fe9-b340-e07d9dbf90a4" width="600" controls></video>

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

The agent reads the install prompt and walks you through setup.

## How Does Videowright Work?

You describe the video you want. The agent writes video segments -- self-contained web-components that each render one beat of the video. You preview in the dev player (`npx videowright dev`), give feedback in chat, and the agent iterates. Videowright will generate an AI voiceover, and sync the video to match. When you're happy, export to mp4 with `npx videowright render` or screen capture with `npx videowright record`.

## Styles

Pick one of six built-in styles, or create your own from a brand guide, reference URL, or short description.

<img width="953" height="549" alt="Built-in style packs" src="https://github.com/user-attachments/assets/3aaeecc2-7ca4-4c5a-8ed2-9adc4e226b2d" />

### Style Demo

Two demo videos: the same prompt, different styles.

<table><tr>
<td width="45%">

https://github.com/user-attachments/assets/1960c3e8-a3f2-4028-91ab-afbc79a53fca

</td>
<td width="45%">
  
https://github.com/user-attachments/assets/d2454377-9f02-4b1c-af9a-e59c9a0c8912

</td>
</tr></table>

## AI Voice-Overs

Videowright supports a full voiceover pipeline: write a narration script, generate audio with text-to-speech, get precise word-level timestamps via speech-to-text, then auto-align every video beat to your narration.

The workflow:

1. **Write the script.** Draft voiceover copy organized by segment in your video's PLAN.md (or ask videowright to). The `npx videowright script` command assembles all segments' voiceover text into a single markdown document for review or handoff.
2. **Generate audio.** Record your own audio, or use AI text-to-speech. ElevenLabs is supported out of the box.
3. **Get timestamps.** Run the audio through speech-to-text to get per-word timing data. This tells Videowright exactly when each line is spoken.
4. **Sync.** The agent computes a timing object that maps each segment's advances to the audio timestamps. Video beats land on the narration automatically.

When you change the audio -- re-record a line, change pacing, swap voices -- the agent re-syncs video timing to match. Segments don't need code changes; only the timing data updates.

## Editing

Just chat with videowright about edits you want to make, and it does the rest. It can be stylistic, content, order or pacing.

## CLI and Capture

Three CLI modes, depending on where you are in the workflow:

- **`npx videowright dev`** -- Dev server with hot reload. For building and iterating, not recording.
- **`npx videowright record`** -- Auto-advancing playback for external screen capture. Use when narrating live or controlling pacing manually.
- **`npx videowright render`** -- Deterministic frame-by-frame MP4 export via Playwright + ffmpeg. Pixel-perfect export. Will mux audio file into the output.

## Multi-Video Projects

A videowright project can contain many videos. Build up your style over time, maintaning consistency in your brand. Reuse segments across videos (intros, outros). Tell the agent "do it like we did in that video in May".

## How Videowright Was Built

Videowright is [vibe crafted](https://github.com/scosman/vibe-crafting) -- a form of agentic coding with structured specs, thorough tests, and a human driving core technical decisions. It's not perfect, but since it's designed to produce one-off videos (not run in production), that's fine.

The test suite is robust: unit tests, integration tests, and end-to-end tests that include pixel-perfect rendering checks. These verify that animations driven by `requestAnimationFrame`, `setTimeout`, CSS keyframes, and the Web Animations API all produce identical frames across runs -- the same determinism guarantee that makes `videowright render` work.

If you encounter an error, describe it to your coding agent. A good agent can quickly diagnose and repair the issue. It's usually in the project files, but if you find one in the library please submit an issue or a patch.

## License

[MIT](LICENSE)

