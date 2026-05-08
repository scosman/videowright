---
status: complete
---

# VideoForge — Project Overview

> **Working name:** VideoForge (placeholder, TBD)
> **Status:** Design phase. No code yet.
> **Audience for this doc:** A coding agent picking up implementation. Read this first.

---

## What we're building

A small library + agent skill + examples that lets a developer (with a coding agent like Claude Code) **vibe-code high-quality animated explainer videos in HTML/CSS/JS**, suitable for startup launch videos, YouTube, feature explainers, etc.

The deliverable is *not* a framework you have to learn. It's a set of **utilities and conventions** that make it easy for an agent to compose a video out of segments, play it back interactively for review, and (later) render it to MP4.

The core design tension we're optimizing for:

- **Maximum freedom inside segments.** Any web tech, any library, any framework. Three.js, Lottie, animated SVG, GSAP, shadcn/React components, raw CSS — all welcome. Showing real(ish) app UI animating is a critical use case (e.g. shadcn components for a launch video).
- **Strong conventions at the seams.** A predictable segment interface, a clean timeline file, a shared player. So an agent can reorder beats, swap segments, reuse intros across videos, build a style guide that compounds.

This is explicitly a **vibe-coding tool**. People can break the rules. The library is small, the conventions are documented, the agent skill enables the workflow.

---

## Why not an existing tool

We researched the space. Briefly:

- **Remotion** — React-based, has an official Claude skill, technically excellent. But: BUSL-licensed, requires a paid Company License for any company with 4+ employees ($1000/yr minimum). Also locks you into React idioms inside compositions.
- **Motion Canvas / Revideo** — MIT, mature, but Canvas-based (no HTML/CSS, no shadcn, no arbitrary web libs). Custom imperative API the agent has to learn. Revideo's team has effectively pivoted to a commercial product (Midrender); OSS pace has slowed.
- **Hyperframes, Rendervid, MotionForge, Twick, etc.** — Too new, too small, unproven.

**The killer reason to build our own:** Claude is exceptionally strong at writing code in well-known systems (HTML/CSS/JS, Web Components, GSAP, Three.js, etc.). A custom framework with its own primitives *cripples* that strength. By staying on the platform and providing only conventions, we keep the agent operating at full power.

The cost — we wire up frame-accurate MP4 export ourselves — is a one-time engineering cost. Worth it.

---

## Goals

1. **Vibe-coding workflow.** A user describes a video; the agent scaffolds segments, iterates on visuals, takes feedback, and produces a finished video.
2. **Compounding style.** Each video sharpens a shared style guide, reusable segment library, and reusable component library that future videos draw from.
3. **Reorderable.** Moving a segment in the timeline is a one-line change, not a refactor.
4. **Interactive review.** Keyboard-driven playback (next/prev) for fast iteration on individual beats.
5. **Real videos out.** Eventually: deterministic frame-accurate MP4 export at any resolution, including for animations using Three.js, animated SVG, Lottie, etc.
6. **Team-friendly repo layout.** Designed for a team to use the same repo for years, building on past videos.

---

## Repo layout (this project)

This is the repo we're building. **Locked.**

```
videoforge/
├── packages/lib/        # the npm package: interfaces, player, transitions, helpers
├── skill/               # the agent skill: SKILL.md + reference docs + templates
└── examples/            # one or two reference videos built with the lib
```

(Skill internal structure to be designed later.)

---

## Repo layout (consumer projects)

This is what teams using VideoForge end up with. The agent skill scaffolds this on first use. Suggested layout — users can deviate; "launch-video-v3-final-final" is sacred user freedom. The skill suggests but does not enforce.

```
some-team-videos/                     # one repo, all their videos
├── package.json
├── kvideo.config.ts                  # global settings (placeholder name)
│
├── shared/                           # the moat — compounds over time
│   ├── style/
│   │   ├── tokens.css
│   │   ├── tokens.ts
│   │   └── STYLE.md                  # design notes the agent reads
│   ├── segments/                     # reusable full segments (intro, outro, etc.)
│   ├── components/                   # reusable web components used inside segments
│   ├── assets/                       # fonts, images, icons, voice configs
│   └── transitions/                  # custom transitions
│
├── videos/                           # one folder per video
│   └── 2026-01-launch/               # date-prefix suggested but not required
│       ├── timeline.ts
│       ├── README.md                 # what this video is
│       ├── PLAN.md                   # see below — agent's working memory
│       ├── segments/
│       ├── assets/
│       ├── voiceover/
│       │   ├── script.md             # generated from segments
│       │   └── audio/                # rendered VO
│       └── exports/                  # MP4s, gitignored
│
└── .claude/
    └── CLAUDE.md                     # entry point referencing VideoForge skill
```

Three levels of reuse, each in its own folder, do not conflate them:

- **`shared/components/`** — small web components used inside segments (animated logo, counter, code-block). Not standalone.
- **`shared/segments/`** — full standalone segments. Drop into any timeline.
- **`shared/transitions/`** — custom transitions between segments.

Promotion from `videos/X/segments/` to `shared/segments/` is an explicit step ("this turned out great, let's reuse it"). MP4 outputs are gitignored.

---

## Architecture

### Three core abstractions

**Player** — root HTML page. Loads a timeline, mounts segments, handles keyboard shortcuts (next/prev), renders transitions, optionally shows a dev-mode HUD (current segment id, time, voiceover, etc.).

**Segment** — one beat of the video. Owns its own rendering, voiceover text, and lifecycle. Can have internal beats (e.g. a graph that animates through 3 states with `next` clicks before moving on).

**Timeline** — a file that composes segments and transitions in order. Reordering = moving array entries. No segment configuration lives here — segments are referenced by id and configure themselves.

### Tech stack

- **Vanilla Web Components + TypeScript (strict).** No framework required. Each segment can naturally be a custom element. The platform gives us `connectedCallback` / `disconnectedCallback` for free as mount/unmount.
- **Other frameworks/libraries are welcome inside segments.** React, Svelte, GSAP, Three.js, Lottie, animated SVG, shadcn — all fine. Document this prominently in the README and skill. Shadow DOM keeps them isolated.
- **No build step required for the simplest case.** Drop an HTML file, open it, it works.

### Segment interface (locked)

```ts
interface Segment {
  // Identity
  id: string;
  voiceover?: string;
  notes?: string;

  // Lifecycle — the only timing mechanism
  mount?(el: HTMLElement, ctx: PlayerContext): void | Promise<void>;
  play(ctx: PlayerContext): Promise<void>;
  unmount?(): void;

  // Optional: capture next/prev for internal beats
  next?(): boolean;   // true = consumed, false/undefined = let player advance
  prev?(): boolean;
}

interface PlayerContext {
  // Wait for user advance (interactive) or scripted advance (render mode)
  waitForNext(): Promise<void>;

  // Wait fixed video-time. Honors controlled clock in render mode.
  hold(ms: number): Promise<void>;

  // Escape hatches
  signal: AbortSignal;          // aborted on unmount
  mode: 'interactive' | 'render';
  clock: () => number;          // current video time in ms
}
```

### The single timing rule (locked)

> **`play()` resolves when the segment is ready for the next transition to begin. Background work (animations, intervals, watchers) keeps running until `unmount()`, which is the cleanup boundary.**

Both halves matter:

- **Resolution = "transition out can start now."** Not "I'm fully done." Crossfades work because the outgoing segment's still-running or frozen-final state crossfades against the incoming segment's `play()`-in-progress.
- **`unmount()` is the only cleanup point.** Anything fire-and-forget in `play()` lives until `unmount()`. `ctx.signal` is how segments hook into this cleanly — pass it to fetch, use it to break loops, abort GSAP timelines.

**No `duration` field anywhere.** Timing is expressed as code in `play()` using exactly two primitives:

- `await ctx.waitForNext()` — wait for user advance (interactive) or scripted beat (render mode)
- `await ctx.hold(ms)` — wait fixed video-time

Reading a segment's `play()` tells you what it does and how long it takes. The code *is* the metadata.

### Example segment

```ts
let advance: (() => void) | null = null;

export default {
  id: 'feature-walkthrough',
  voiceover: 'Kiln gives you evals, RAG, and fine-tuning in one place.',

  async play(ctx) {
    showCard('evals');
    await ctx.waitForNext();

    showCard('rag');
    await ctx.waitForNext();

    showCard('fine-tuning');
    await ctx.hold(1500);
    // play() returns → player starts the crossfade out
  },

  unmount() {
    // cleanup any background animations
  },
};
```

### Internal next/prev capture

Segments can capture `next`/`prev` keypresses for internal beats. The library provides a helper so authors don't write the resolver-closure boilerplate themselves; `ctx.waitForNext()` is that helper. Authors can override `next()` for custom logic.

`next()` returns `true` if the keypress was consumed (advanced an internal beat); `false` or `undefined` lets the player move to the next segment.

### Timeline file

```ts
export default {
  meta: {
    title: 'Kiln Launch Video',
    aspectRatio: '16:9',
    resolution: [1920, 1080],
    fps: 60,
  },
  segments: [
    { id: 'intro',         transition: 'fade' },
    { id: 'problem',       transition: 'slideLeft' },
    { id: 'product-demo',  transition: { type: 'morph', shared: 'logo' } },
    { id: 'pricing',       transition: 'fade' },
    { id: 'outro' },
  ],
};
```

Segments referenced by id, resolved from a `segments/` folder. Reordering = moving lines. Transitions are strings (built-in) or objects (configured/custom).

For render mode, beat timings live on timeline entries (e.g. `renderBeats: [2000, 2000, 2000]`), not segments. If a segment has 3 `waitForNext()` calls and `renderBeats` has the wrong length, error out at render time. Interactive mode ignores `renderBeats` entirely.

### Transitions

**v1 (build now): Player-orchestrated, two-slot model.**

Player has two segment slots (`current`, `incoming`). For a transition, both are mounted. The transition function gets refs to both elements and animates between them.

```ts
type Transition = (
  outgoing: HTMLElement,
  incoming: HTMLElement,
  ctx: { duration: number; direction: 'forward' | 'backward' }
) => Promise<void>;
```

Built-ins: `fade`, `slideLeft`, `slideRight`, `slideUp`, `cut`. Each ~20 lines using Web Animations API.

**v2 (document now, build later): View Transitions API for shared-element morphs.**

Browser-native (Chrome). Both segments mark a shared element with the same `view-transition-name` and the browser handles the morph. Document this as the escape hatch for fancy transitions like a logo morphing between segments.

The two mechanisms are different problems — don't try to unify them.

Transitions happen *between* segments, not *during*. In-segment animation goes inside the segment. Don't blur the line.

### Voiceover

- **Lives on segments** as a `voiceover` field. Tightly coupled to what's on screen, so it stays with the segment.
- **Timeline file has a `script()` helper** that walks segments and concatenates VO into one document for review/editing/handoff to TTS (e.g. ElevenLabs).
- **TTS generation (later):** walk segments, generate audio per segment, player plays them in sequence.

### Export to video

**The constraint:** we want any tool to be usable inside segments — Three.js, animated SVG, Lottie, CSS keyframes, GSAP, anything. Forcing a constrained animation API (rAF-only, no setTimeout) defeats the whole point of using HTML.

**The solution:** Chrome DevTools Protocol clock control. Headless Chrome (via Playwright) puppets the *browser's* internal animation clock using `Animation.setPlaybackRate` and time-control APIs. This means:

- CSS animations: respect the controlled clock automatically
- Animated SVG (`<animate>`, SMIL): respects controlled clock
- `requestAnimationFrame`: respects controlled clock
- Web Animations API: respects controlled clock
- Lottie, Three.js: work (they use rAF internally)
- `setTimeout` / `setInterval`: do **NOT** respect the clock. The one footgun. Document it; tell the agent to prefer rAF/CSS/WAAPI/GSAP. (`ctx.hold()` uses the controlled clock so it's safe.)

This is what Remotion uses under the hood. ~100 lines of Playwright glue.

**Phasing:**

- **v1:** Screen-recording fallback (`npm run record` or similar). Plays the video full-screen, ffmpeg captures the window at 60fps. Works for any animation, no constraints, but non-deterministic, real-time, and audio sync requires care.
- **v2 (target):** Deterministic CDP-driven render. `renderFrame(t)` per frame, screenshots, ffmpeg stitches. Runs at any speed, any resolution, CI-friendly.

Both modes documented in the skill from day one.

### PLAN.md per video

Each video folder has a `PLAN.md`. The skill teaches the agent to:

- Create it on first scaffold
- Treat it as the running memory: script revisions, design decisions, user feedback ("intro felt slow," "use orange not red here"), reference videos, the original brief
- Read it before any iteration on that video
- Append to it after meaningful changes

It's a per-video changelog + decision log + scratchpad. Not code, not user-facing — agent's working memory. Without it, every new session loses the thread.

### Dev-mode HUD

Toggleable overlay on the player showing: current segment id, time within segment, total time, voiceover text, mode (interactive/render), keyboard hints. Cheap, makes iteration much faster.

---

## CLI surface (placeholder, not locked)

Likely something like:

- `videoforge new <project>` — scaffold a consumer repo
- `videoforge new-video <name>` — scaffold a video inside an existing project
- `videoforge new-segment <name>` — scaffold a segment
- `videoforge dev` — open the player against a timeline for interactive review
- `videoforge record` — v1 screen-record export
- `videoforge render` — v2 deterministic CDP render
- `videoforge script` — emit the concatenated VO script for a video

Naming TBD. Project name is also TBD ("VideoForge" is a placeholder).

CRITICAL: P0 is that we're a skill. If I want a new video, I tell the agent I want a new video. The CLI can be there to support the agent so we can add CLI options when needed (but only when really needed), but this mostly isn't for user. If it's just as easy to let the skill setup a project with mkdir and cp, then we can do that in the agent. dev/record/render/script all good to ahve (more user tools). The setup skill is a key part of the skill: the skill should alway cehck the project is setup before starting work. Generally: create project folders, then write a `.video_forge.yml` when done to signal we're setup. We can add settings to it over time, but maybe `project_structure: v1` to start, to signal the setup.

---

## Readme

A great readme is part of the project. Track things that should be in readme as we go in `./notes_for_readme.md`, and create final phase to write one from notes, specs and code.

---

## Skill

The skill is the highest-leverage piece — it's what teaches the agent how to use the library and conventions fluently.

Decided so far:

- Skill should include a **setup reference** that scaffolds a consumer repo and installs the lib.
- Skill should teach the agent the **PLAN.md workflow** per video (create, read, append).
- Skill should teach the agent to default to writing `play()` in the canonical style (`waitForNext` / `hold` / no duration field, code-as-metadata).
- Skill should teach **VO-first authoring**: take a script, scaffold segments to match.
- Skill should teach the **"match this past video's style for new content"** workflow (read `shared/STYLE.md`, read the reference video's `timeline.ts` and segments and `PLAN.md`, then produce the new video).
- Skill should document that **any web tech is welcome inside segments** — explicitly call out Three.js, animated SVG, Lottie, shadcn/React, GSAP, etc. as encouraged.
- Skill should document the **`setTimeout`/`setInterval` footgun** for deterministic export.

Internal structure of the `skill/` folder is **not yet designed**. Open below.

---

## Things explicitly killed (do not re-introduce)

- `duration` field on segments
- `finalDuration`, `holdForNext`, `auto: true`, `transitionLeadIn` — all the variants we considered before settling on `play()`
- Project-level default hold durations (e.g. `manualHoldMs`) — footgun, "why is every video's intro 1.2s?" debugging nightmare
- `steps` count / `currentStep` tracking on segments — segments manage internal state in plain JS variables
- Segment configuration in the timeline file (config lives with the segment)
- Unifying player-orchestrated transitions with View Transitions API — different problems
- Forcing a constrained animation API (rAF-only) on segments to enable export — kills the point of HTML

---

## Quality

Project should be high quality

 - write tests as we go
 - use best practices: linting, formatting, etc
 - write CI (custom phase to run tests/linter/etc on)
 - Typescript strict
 - refactor when needed, don't let mistakes drag.


---

## Open questions / next steps

Pick up here. Don't make new decisions in the locked sections above; if something there needs revisiting, raise it explicitly rather than silently changing course.

1. **Segment lifecycle in actual TS, with `defineSegment()` helper.** The shape is locked above; we need the concrete file: types, the helper that wires `ctx.waitForNext()` to the auto-generated `next()`, the abort-signal plumbing, the example segment that exercises all of it. This is the contract everything else hangs on — do this first.

2. **SKILL.md flow.** What does the agent read when, in what order, for what user intent? Specifically the path from "user gives a VO script" → "agent scaffolds segments using `play()` + `waitForNext()` + `hold()` patterns." The skill's internal folder structure is also open.

3. **Player implementation sketch.** Single HTML page, two segment slots, keyboard handling, transition orchestration, dev-mode HUD. Written against the locked segment interface.

4. **Built-in transitions.** `fade`, `slideLeft`, `slideRight`, `slideUp`, `cut`. Web Animations API, ~20 lines each.

5. **Timeline file resolution.** How does `{ id: 'intro' }` resolve to a segment file on disk? Convention: `segments/intro/index.ts` exporting default? Plus how `shared/segments/` is searched as a fallback. Lock the resolution order.

6. **`kvideo.config.ts` (or whatever it's called) shape.** What lives there. Probably: paths to `shared/`, default resolution/fps, registered custom transitions. Don't over-stuff it — config files attract bloat.

7. **Naming.** Project name, npm package name, CLI command. Working name VideoForge. Will be typed by the agent thousands of times — pick something short.

8. **CDP export prototype.** Not v1, but worth a small spike to confirm the clock-control approach actually works with animated SVG and Three.js as expected. ~half a day.

9. **Examples.** At least one reference video in `examples/` that exercises: multiple internal beats, a custom transition, an animated SVG element, an embedded charting library. Serves as the canonical "good Claude output."
