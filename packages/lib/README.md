# Videowright

**Compose animated explainer videos using any web technology.**

Videowright is a small library and agent skill for vibe-coding animated videos in HTML/CSS/JS. Inside each segment, use whatever the browser supports -- Three.js, Lottie, animated SVG, GSAP, React, CSS keyframes, ECharts, raw canvas. Videowright handles sequencing, transitions, and playback.

## Install

```bash
npm install videowright
```

## Quick start

Videowright is designed to work with a coding agent. Add the skill reference to your `.claude/CLAUDE.md`:

```
Read `node_modules/videowright/skill/SKILL.md` for the Videowright agent skill.
```

Then ask Claude to create a video. The skill scaffolds a project, writes segments, and guides iteration.

### Manual usage

```ts
import { defineSegment } from 'videowright';

let host: HTMLElement | null = null;

export default defineSegment({
  id: 'intro',
  voiceover: 'Welcome to our product.',

  mount(el, ctx) {
    host = el;
    el.innerHTML = '<h1 style="opacity:0">Hello</h1>';
  },

  async play(ctx) {
    host!.querySelector('h1')!.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 500, fill: 'forwards' }
    );
    await ctx.hold(600);
    await ctx.waitForNext();
  },

  unmount() {
    host = null;
  },
});
```

Preview with hot reload:

```bash
npx videowright dev
```

## API

| Export | Purpose |
|---|---|
| `defineSegment(spec)` | Author a segment with beat tracking and abort signal |
| `defineConfig(config)` | Type-safe `videowright.config.ts` |
| `script(timeline, segmentLoaders)` | Concatenate voiceover text into a Markdown document (async) |
| `Player` | The player runtime |
| `fade`, `slideLeft`, `slideRight`, `slideUp`, `slideDown`, `cut` | Built-in transitions |

### Types

`Segment`, `SegmentSpec`, `PlayerContext`, `Timeline`, `TimelineEntry`, `TimelineMeta`, `Transition`, `TransitionContext`, `Config`

## CLI

| Command | Description |
|---|---|
| `videowright dev [path]` | Open the player with hot reload |
| `videowright script [path]` | Print the concatenated voiceover script (`--write` to save) |

## Agent skill

The npm package includes a Claude Code skill at `skill/SKILL.md`. It teaches the agent to scaffold projects, author segments, maintain style guides, and iterate on videos conversationally.

## License

[MIT](../../LICENSE). All runtime dependencies are MIT, ISC, or BSD-3-Clause.

---

Full documentation, architecture, and a 7-segment demo: [github.com/scosman/video_forge](https://github.com/scosman/video_forge)
