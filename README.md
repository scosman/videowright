# Videowright

**Compose animated explainer videos using any web technology.**

https://github.com/user-attachments/assets/236ab8d1-d5ea-4fe9-b340-e07d9dbf90a4


Videowright is a small library and agent skill for vibe-coding high-quality animated videos in HTML/CSS/JS. Describe what you want, the agent writes segments, you review in the player, you iterate.

There is no custom animation DSL. Inside a segment you can use whatever the browser supports:

- **Your real app UI** -- animate the actual shadcn/React components from your product
- **Three.js** for 3D scenes
- **Lottie** for designer-authored animations
- **Animated SVG**, including SMIL
- **GSAP** for timeline-based motion
- **CSS keyframes**, Web Animations API
- **D3, ECharts, Chart.js** for data viz
- **Canvas, WebGL shaders** -- whatever

Videowright operates at the **composition** layer -- sequencing segments, handling transitions, driving playback. You bring the animation tools you already know.

## What it looks like

<!-- TODO: Screen-record the demo example (npm run dev:demo) and save as docs/demo.mp4 -->
<!-- After recording, drag the MP4 into the GitHub PR/issue UI and paste the generated -->
<!-- github.com/user-attachments URL here, or reference the relative path docs/demo.mp4. -->

> **Demo placeholder.** Run `npm run dev:demo` to see the 7-segment showcase locally. It exercises CSS keyframes, SVG animation, Three.js (WebGL), lottie-web, ECharts, and HTML/CSS cards with a custom FLIP transition between segments. Screen-record and embed a demo video at `docs/demo.mp4`.

## Quick start

### Install

Paste this into your coding agent (Claude Code, Codex, or opencode):

> Install Videowright using these instructions:
> https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md

The agent reads the install script and walks you through setup -- package install, skill symlinks, and project scaffolding.

### Manual install

If you prefer to set things up by hand, the paste-driven install above is still recommended -- it handles skill symlinks, instruction files, and dev toolchain setup automatically. But for the package alone:

```bash
npm install videowright
```

You will also need to set up the [skill symlinks and instruction files](https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md) (Steps 5-6) for your coding agent to use Videowright's skill.

### Preview

```bash
npx videowright dev
```

Navigate with arrow keys (`->` next, `<-` back), `R` to restart, `H` to toggle the dev HUD, `1`-`9` to jump to a segment.

## Styles

Placeholder section for future style section with real assets

6 styles to choose from (or create your own):

<img width="953" height="549" alt="styles-3-2" src="https://github.com/user-attachments/assets/3aaeecc2-7ca4-4c5a-8ed2-9adc4e226b2d" />



Same video script as above, with two different styles applied. Both generated in 1 prompt.

https://github.com/user-attachments/assets/5df0bde1-b759-4ba8-aeef-4dddc8e60c24

https://github.com/user-attachments/assets/1960c3e8-a3f2-4028-91ab-afbc79a53fca




## How it works

Four abstractions, each small enough to hold in your head.

### Segment

One beat of the video. A segment owns its DOM, voiceover text, and lifecycle. The only timing mechanism is a `play()` function with two primitives:

```ts
import { defineSegment } from 'videowright';

let host: HTMLElement | null = null;

// Illustrative helper -- your segment's rendering logic goes here
function showCard(host: HTMLElement, name: string) {
  const card = host.querySelector(`[data-card="${name}"]`) as HTMLElement;
  card.style.opacity = '1';
  card.style.transform = 'translateY(0)';
}

export default defineSegment({
  id: 'feature-walkthrough',
  voiceover: 'Three features in one place.',

  mount(el, ctx) {
    host = el;
    el.innerHTML = '<h1>Features</h1>';
  },

  async play(ctx) {
    showCard(host!, 'evals');
    await ctx.waitForNext();   // wait for user advance

    showCard(host!, 'rag');
    await ctx.waitForNext();

    showCard(host!, 'fine-tuning');
    await ctx.hold(1500);      // wait fixed video-time
    // play() returns -> transition out begins
  },

  unmount() { host = null; },
});
```

No `duration` field. The code *is* the timing. Reading `play()` tells you what the segment does and how long it takes.

Inside `play()`, use any web technology. Three.js, animated SVG, React, GSAP, Lottie, raw CSS -- the segment owns its `<div>` and can do whatever it wants with it.

### Timeline

A file that composes segments and transitions in order:

```ts
export default {
  meta: { title: 'Launch Video' },
  segments: [
    { id: 'intro',         transition: 'fade' },
    { id: 'problem',       transition: 'slideLeft' },
    { id: 'product-demo',  transition: 'fade' },
    { id: 'outro' },
  ],
};
```

Reordering a beat is a one-line change. Segments configure themselves; the timeline just sequences them.

### Player

A runtime that loads a timeline, mounts segments, handles transitions, and listens for keyboard input. Two modes:

- **Interactive** -- for review and iteration. Keyboard-driven, real-time.
- **Render** (future) -- for export. A controlled clock drives playback frame-by-frame for deterministic MP4 output.

The player includes a dev-mode HUD (press `H`) showing the current segment, elapsed time, voiceover text, and keyboard hints.

### Script

The `videowright script` CLI command walks the timeline, loads each segment, and concatenates all `voiceover` fields into a single Markdown document -- ready for review or TTS handoff.

```bash
npx videowright script --write
```

Under the hood this uses the `script(timeline, segmentLoaders)` library function, but most consumers should use the CLI.

## The agent skill

Videowright is **skill-first**. The bundled Claude Code skill is the primary interface. It teaches the agent:

- **Setup**: scaffold a consumer repo with `videowright.config.ts`, directory structure, and a hello-world video
- **Video authoring**: create `timeline.ts`, `PLAN.md`, and segments from a voiceover script
- **Segment authoring**: use `defineSegment` with `waitForNext`/`hold` -- never `setTimeout`
- **Style matching**: read `STYLE.md` and past videos to produce on-brand content
- **PLAN.md as working memory**: the agent reads it before iterating, appends after meaningful changes

The skill ships inside the npm package at `node_modules/videowright/skill/SKILL.md`.

## CLI commands

| Command | Description |
|---|---|
| `videowright dev [timeline-path]` | Open the player with hot reload. Defaults to the most recent video by mtime. |
| `videowright script [timeline-path]` | Print the concatenated voiceover script. `--write` saves to `voiceover/script.md`. |

## Configuration

Projects use a typed config file at the repo root:

```ts
import { defineConfig } from 'videowright';

export default defineConfig({
  projectStructure: 'v1',
  defaults: {
    resolution: [1920, 1080],
    fps: 60,
    aspectRatio: '16:9',
  },
});
```

## Consumer repo layout

The skill scaffolds this on first setup:

```
my-videos/
  videowright.config.ts       # config + setup marker
  segments/                   # all segments -- any video can use any
  videos/                     # one folder per video (timeline, PLAN.md, voiceover)
  components/                 # reusable web components
  transitions/                # custom transition functions
  styles/                     # design tokens (CSS + TS) + STYLE.md
  assets/                     # fonts, icons, footage
```

Segments are shared by default. Every video can reference any segment by id.

## Built-in transitions

`fade`, `slideLeft`, `slideRight`, `slideUp`, `slideDown`, `cut` -- each using the Web Animations API. Custom transitions are functions in `transitions/`, registered in `videowright.config.ts`.

## Status

**v1 -- interactive authoring is complete.** The library, CLI, agent skill, and a 7-segment demo are in place with comprehensive unit, integration, and end-to-end tests.

### Roadmap

- **Screen-record export** -- Playwright drives full-screen playback while ffmpeg captures the window
- **Deterministic render** -- CDP-driven frame export for pixel-perfect MP4 at any resolution
- **Audio playback** -- TTS integration with per-segment voiceover
- **View Transitions API** -- shared-element morphs between segments

## License

[MIT](LICENSE)

All runtime dependencies are MIT, ISC, or BSD-3-Clause. No copyleft, no BUSL.

---

For deeper reading:

- [Functional spec](specs/projects/vibe_forge_v1/functional_spec.md)
- [Architecture](specs/projects/vibe_forge_v1/architecture.md)
- [Demo example README](examples/demo_example/README.md)
