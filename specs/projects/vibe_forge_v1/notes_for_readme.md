# Notes for README

> Running list of points the eventual README needs to make. Not a draft of the README itself — just the substance that has to land. Add to this as we go.

---

## Positioning points

### Any web technology works

This is the **defining feature**, not a footnote. Lead with it.

The point: VideoForge doesn't have its own animation primitives. Inside a segment you can use:

- **Your real app UI.** Animate the actual shadcn/React components from your product. A launch video showing the real interface, not a recreation, is uniquely powerful.
- **Three.js** for 3D scenes.
- **Lottie** for designer-authored animations.
- **Hand-coded SVG**, including SMIL animation. Let the agent generate it directly.
- **GSAP** for timeline-based motion.
- **Raw CSS keyframes**, Web Animations API, anything the browser supports.
- **D3, Recharts, Chart.js** for data viz that animates.
- **Embedded video, canvas, WebGL shaders** — whatever.

We don't gate any of this. We don't reimplement any of this. We don't ask you to learn a custom DSL.

The level we operate at is **composition** — sequencing segments, handling transitions, driving playback, exporting to video. Not pixel-by-pixel animation. Pick whatever tool you want for the pixels.

This is the explicit reason we're not Remotion (locks you into React idioms) or Motion Canvas (locks you into a Canvas-based imperative API). You bring the tools you already know; we handle the seams between segments.

### Designed for agents first

VideoForge is **skill-first**. The agent skill is the primary interface. The library is a small supporting layer that exists to reduce boilerplate and enable reuse.

This is not an app. There's no GUI editor. There's no timeline you drag clips around in. You tell an agent what you want, the agent writes segments, you review in the player, you iterate.

Concretely:

- **Tell it what you want, get it.** "Make a 60-second launch video, opening with our logo, then three feature highlights, ending with a CTA." The skill knows the conventions, the library provides the primitives, the agent writes the code.
- **The conventions matter more than the code.** A predictable segment interface, a clean timeline file, a place for shared style — so the agent can reorder, swap, and reuse without giant diffs.
- **Style and reusable segments compound.** Every video you ship sharpens `shared/STYLE.md` and adds to `shared/segments/`. After a few videos, the agent produces output that looks distinctly *yours*.
- **PLAN.md per video is the agent's working memory.** Decisions, feedback, design notes — captured so the next session picks up where the last one left off.

If you're not using a coding agent, you can still use this — but the design center is "agent + human reviewing in the player," not "human writing every segment by hand."

---

## How it works

A tight explanation of the four core abstractions. The README needs this section to land before anything else.

### Segment

One beat of the video. A custom element that owns its own rendering, voiceover text, and lifecycle.

A segment exposes a single timing primitive — a `play()` method that resolves when it's ready to transition out. Inside `play()`, two helpers cover all timing needs:

- `await ctx.waitForNext()` — wait for the user to advance (or, in render mode, for a scripted beat)
- `await ctx.hold(ms)` — wait fixed video-time

That's it. No duration fields, no timing config. The code in `play()` *is* the timing. Reading the segment tells you exactly what happens and how long.

Inside `play()`, you can do anything: spin up a Three.js scene, mount a React component tree, animate an SVG, fire off a GSAP timeline, fetch data and render a chart. Background animations stay running until `unmount()` cleans them up.

Segments can also capture next/prev keypresses for internal beats — a chart that animates through three states before moving on, for example.

### Timeline

A file that composes segments and transitions in order.

```ts
export default {
  meta: { resolution: [1920, 1080], fps: 60 },
  segments: [
    { id: 'intro',         transition: 'fade' },
    { id: 'problem',       transition: 'slideLeft' },
    { id: 'product-demo',  transition: 'fade' },
    { id: 'outro' },
  ],
};
```

Reordering a beat is a one-line change. No giant diffs, no timing recalculations. Segments are referenced by id and resolved from your `segments/` folder; configuration lives with the segment, not in the timeline.

### Transition

How one segment hands off to the next. Built-ins: `fade`, `slideLeft`, `slideRight`, `slideUp`, `cut`. Each is ~20 lines using the Web Animations API.

During a transition both segments are mounted simultaneously, so crossfades, slides, and morphs work naturally. Custom transitions are easy to write — they're just functions that get refs to the outgoing and incoming elements and animate between them.

For shared-element morphs (a logo that morphs between segments, for example), the View Transitions API gives you that natively.

Transitions happen *between* segments, not during. In-segment animation lives inside the segment.

### Player

A single HTML page that loads a timeline, mounts segments, handles transitions, and listens for keyboard input.

- **Arrow keys** advance / go back. Segments can capture these for internal beats.
- **Dev-mode HUD** shows current segment, time, voiceover, mode — toggleable.
- **Two playback modes:**
  - **Interactive** — for review and iteration. Real-time, keyboard-driven.
  - **Render** — for export. A controlled clock drives playback frame-by-frame, screenshots get stitched into MP4 by ffmpeg. Three.js, animated SVG, CSS animations, Lottie all work because the browser's animation clock itself is being puppeted via Chrome DevTools Protocol.

The player is the same in both modes; only the clock and input source differ.

---

## Other points worth covering (less prominently)

- **Repo layout for consumers.** `shared/` (style, components, segments, transitions, assets) + `videos/` (one folder per video, with its own segments and PLAN.md). The skill scaffolds this; layout is a suggestion, not a cage.
- **VO-first authoring.** Hand the agent a voiceover script; it scaffolds segments to match. The timeline can emit the concatenated script back out for review or TTS.
- **One footgun for deterministic export:** `setTimeout` and `setInterval` don't respect the controlled clock. Prefer `requestAnimationFrame`, CSS animations, Web Animations API, GSAP, or `ctx.hold()`. The skill teaches the agent this default; in practice it rarely comes up.
- **No build step required for the simple case.** Drop an HTML file, open it, it works. TypeScript and bundling are available if you want them.
- **License** — TBD, but the intent is permissive (MIT-style). Building this so the open-source-license-in-a-startup question doesn't bite anyone.
