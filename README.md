
# Videowright 
### Create a video with a prompt

Videowright creates demo videos, explainer videos, and product walkthroughs from your coding agent. Just describe what you want and it generates your video (including audio). Iterate in chat until it's perfect.

## Demo - Sound on!

<video src="https://github.com/user-attachments/assets/ba106686-3ff5-4d57-8fbb-141ad40c8c86" width="600" controls></video>

## Overview

- **Video from prompt** -- generate an animated video, simply from a prompt
- **AI voice-overs** -- generate narration from a script, then auto-sync video timing to the audio
- **Sound Effects and Music** -- source and mix many audio sources
- **Six built-in visual styles** -- or create your own from a brand guide or description
- **Pixel-perfect MP4 export** -- deterministic frame-by-frame rendering, no dropped frames
- **Hot-reloading dev server** -- iterate in chat, see changes instantly
- **Works in any major coding agent** -- Claude Code, Codex, opencode, etc

## Install

Paste this into your coding agent (Claude Code, Codex, or opencode):

```
Install Videowright using these instructions:
https://github.com/scosman/videowright/raw/refs/heads/main/packages/lib/skill/install/INSTALL.md
```

The agent reads the install prompt and walks you through setup.

## How Does Videowright Work?

You describe the video you want. The agent writes video segments -- self-contained web-components that each render one beat of the video. You preview in the dev server (`npx videowright dev`), give feedback in chat, and the agent iterates. Videowright will generate an AI voiceover, and sync the video to match. When you're happy, export with `npx videowright render`.

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

## Audio Mixing, Sound Effects and Music

Videowright can mix audio tracks, fading in music, timing sound effects, remixing voice-overs, and more.

The agent can source sound effects and music. Both free downloads from Openverse, or AI generated sounds with ElevenLabs.

## Editing

Just chat with videowright about edits you want to make, and it does the rest. It can be stylistic, content, order or pacing.

## CLI

Three CLI commands:

- **`npx videowright dev`** -- Dev server with a homepage listing all videos in the project. Click a video to open the player with hot reload. Hide the HUD for a clean screen-recording surface.
- **`npx videowright render [slug]`** -- Deterministic frame-by-frame MP4 export via Playwright + ffmpeg. Pixel-perfect output.

## Multi-Video Projects

A videowright project can contain many videos. Build up your style over time, maintaning consistency in your brand. Reuse segments across videos (intros, outros, transitions, CTAs).

## Development

Run all checks (lint, typecheck, tests) locally:

```bash
./checks.sh
```

Install the pre-commit hook (once per clone). This will replace any existing pre-commit hook:

```bash
ln -sf ../../checks.sh .git/hooks/pre-commit
```

## License

[MIT](LICENSE)

