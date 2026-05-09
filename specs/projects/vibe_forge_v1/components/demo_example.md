---
status: complete
---

# Component: Demo Example

The stylish showcase video at `examples/demo_example/`. Exercises the lib's surface, demonstrates "any web tech inside segments," and provides the canonical "good Claude output" reference. Also generates the MP4 embedded in the project README.

## Purpose and Scope

**Owns:**

- A complete consumer-style repo nested under `examples/demo_example/` that builds a 60–90s video.
- 7 segments + 1 custom transition + design tokens + voiceover script. The segment count is intentional: the demo is the showcase, and showing breadth of "any web tech inside segments" needs multiple distinct technologies.
- README in the demo folder explaining what's being demonstrated.
- Acts as the e2e test target.

**Not owned:**

- Hello-world templates (those live in `skill/assets/hello_world/`, simpler scope).
- The MP4 rendering pipeline itself — render is a later phase. v1 records manually via screen-record.

## Public Interface

Runs as: `videowright dev examples/demo_example/timeline.ts` (or via root `package.json` script `npm run dev:demo`).

E2E test: `npm run test:e2e` (Playwright; loads built demo and walks it).

## Internal Design

### Folder layout (mirrors the consumer-repo convention)

```
examples/demo_example/
├── package.json              # local deps (three, lottie-web, echarts)
├── videowright.config.ts     # registers the custom transition
├── tsconfig.json             # extends repo base
├── README.md                 # what's being demonstrated; links to MP4
│
├── videos/
│   └── demo/
│       ├── timeline.ts
│       ├── README.md
│       ├── PLAN.md           # the agent's working memory; written during implementation
│       └── voiceover/
│           └── script.md     # generated via `videowright script --write`
│
├── segments/                 # 7 segments
│   ├── intro/index.ts
│   ├── feature-svg/index.ts
│   ├── feature-three/index.ts
│   ├── feature-lottie/index.ts
│   ├── feature-echarts/index.ts
│   ├── feature-cards/index.ts
│   └── outro/index.ts
│
├── components/               # web components used by segments
│   ├── animated-title/       # used by intro
│   └── feature-card/         # used by feature-cards
│
├── transitions/
│   └── logo-morph.ts         # custom transition between feature-cards and outro
│
└── styles/
    ├── tokens.css
    ├── tokens.ts
    └── STYLE.md
```

The example does **not** have its own top-level `assets/` for v1; assets used inline (svg, fonts) are inlined or in components. Add when needed.

### The timeline

```ts
export default {
  meta: {
    title: 'Videowright — Demo',
    aspectRatio: '16:9',
    resolution: [1920, 1080],
    fps: 60,
  },
  segments: [
    { id: 'intro',            transition: 'fade' },
    { id: 'feature-svg',      transition: 'slideLeft' },
    { id: 'feature-three',    transition: 'slideLeft' },
    { id: 'feature-lottie',   transition: 'slideLeft' },
    { id: 'feature-echarts',  transition: 'slideLeft' },
    { id: 'feature-cards',    transition: 'logo-morph' },   // custom transition
    { id: 'outro' },
  ],
};
```

The intent of having four "feature-*" segments back-to-back is breadth, not narrative. Each one demonstrates a different web technology working inside a segment. The voiceover is short on each — this is a tour, not a tutorial.

### Segment 1: `intro`

CSS-animated title. Uses an `<animated-title>` web component (in `components/animated-title/`) that staggers letter reveals using CSS keyframes.

- Voiceover: "Videowright — videos in the same HTML and CSS you build apps in."
- Internal beats: 0 (auto-advances after a 3s `hold()`).
- Timing: ~3 seconds (gives the staggered letter animation time to complete).

### Segment 2: `feature-svg`

Animated SVG illustration — e.g. a node graph that draws itself, lines stroke-dashing in, nodes scaling up. Pure SVG `<animate>` and `<animateTransform>` plus CSS.

- Voiceover: "Animated SVG."
- Internal beats: 0.
- Demonstrates: zero-dependency animation using web standards.

### Segment 3: `feature-three`

Three.js scene with a slowly rotating geometric shape. Camera zooms out on `next`, label appears on `next`.

- Voiceover: "Three.js for 3D."
- Internal beats: 2 (camera zoom, label appear).
- Demonstrates: `ctx.signal` plumbing (cancel rAF loop on unmount); arbitrary npm dep (`three`).

### Segment 4: `feature-lottie`

A Lottie animation playing — e.g. an animated logo or illustration loaded from a JSON file in the demo's `assets/`.

- Voiceover: "Lottie for designer-made motion."
- Internal beats: 0.
- Demonstrates: integrating a third-party animation library inside a segment; `lottie-web` npm dep.

### Segment 5: `feature-echarts`

An animated bar chart or line chart driven by echarts. Numbers count up; chart elements animate in.

- Voiceover: "Real product data — echarts, your charting library, your component library, your UI."
- Internal beats: 1 (advance triggers chart re-render with new data).
- Demonstrates: data viz inside a segment, the "I want my product UI in the video" use case; `echarts` npm dep.

### Segment 6: `feature-cards`

Three cards revealed sequentially on `next` presses. Each card highlights a Videowright property:

- Card 1: "Reorder segments — move array entries"
- Card 2: "Reuse anything from anywhere — flat folder layout"
- Card 3: "Compounding style — keep building on past videos"

- Voiceover: "Videos compound. Segments, components, transitions, styles — all top-level, all reusable."
- Internal beats: 3.
- Demonstrates: HTML/CSS authoring; `<feature-card>` web component reused 3×; the cards segment is also where the upcoming `logo-morph` originates.

### Segment 7: `outro`

Logo + "Get started" + `npm install videowright` in a styled code block. Logo morphs in from the previous segment via the custom transition. Auto-advances after a 2s `hold()`.

- Voiceover: "Get started: install Videowright and ask the agent."
- Internal beats: 0.

### Custom transition: `logo-morph`

Located at `transitions/logo-morph.ts`. Coordinates a logo element across the boundary of `feature-cards` → `outro`. v1 uses WAAPI (the View Transitions API is documented as v2).

```ts
import type { Transition } from 'videowright';

const logoMorph: Transition = async (outgoing, incoming, ctx) => {
  const outLogo = outgoing.querySelector('.logo');
  const inLogo = incoming.querySelector('.logo');
  if (!outLogo || !inLogo) {
    // Fall back to fade if logos aren't present
    await fade(outgoing, incoming, ctx);
    return;
  }
  // Compute FLIP-style transform from outLogo's box to inLogo's box;
  // animate outLogo with WAAPI; fade outgoing's non-logo content out, fade incoming in.
  // ~30 lines.
};

export default logoMorph;
```

Registered in `videowright.config.ts`:

```ts
import { defineConfig } from 'videowright';
export default defineConfig({
  projectStructure: 'v1',
  transitions: {
    'logo-morph': () => import('./transitions/logo-morph'),
  },
});
```

### Styles

`styles/tokens.css`:
- Brand-ish palette (TBD — pick during implementation by someone with an eye).
- Font family (a clean modern sans, system or via Google Font).
- Spacing scale.

`styles/tokens.ts` exports the same tokens as TS constants for use inside Three.js / canvas / dynamically computed styles.

`styles/STYLE.md` documents the rationale: "Videowright demo style: clean, neutral background, accent color for CTA, generous spacing, sans-serif." Written so future videos can reference and match.

### Voiceover script

The full script lives in `videos/demo/voiceover/script.md`, generated via `videowright script --write` from the segment voiceovers. Manually edited for flow if needed.

### README in the demo folder

Explains:
- What this demo demonstrates.
- How to run it (`npm install && npx videowright dev`).
- What each segment shows.
- Pointer to the project README's embedded MP4.

### MP4 in the project README

The root `README.md` of the repo embeds an MP4 (or animated GIF for compatibility) of this demo at the top. Generated:
- v1: manually screen-record via QuickTime (or similar) while running `videowright dev`.
- Later phase: automated via `videowright record` (when shipped).

Quality bar: the MP4 is the project's first impression. It must look stylish; spend the time.

## Dependencies

**Depends on:**
- Full lib (player, defineSegment, defineConfig, transitions, types).
- npm `three` (for feature-three).
- npm `lottie-web` (for feature-lottie).
- npm `echarts` (for feature-echarts).

**Depended on by:**
- Playwright e2e (asserts the demo plays without errors).
- Project README (embeds the MP4).
- Skill quality eval (manual: agent should be able to author segments of this style).

## Test Plan

### E2E (Playwright, separate workflow per architecture §15)

`test/e2e/demo_walkthrough.spec.ts`:

- `demo_loads`: navigate to dev URL; assert page title, no console errors.
- `intro_renders`: assert the animated-title element exists and contains the demo title text.
- `advance_to_svg`: press `→`; assert SVG element with animation present.
- `advance_to_three`: press `→`; assert canvas element appears (Three.js renderer attached).
- `three_internal_beats`: press `→` → `→`; assert "label appeared" data attribute.
- `advance_to_lottie`: press `→`; assert Lottie container has rendered SVG/canvas children.
- `advance_to_echarts`: press `→`; assert echarts container has rendered chart elements.
- `echarts_beat_advances_data`: press `→`; assert chart data attribute or content has updated.
- `advance_to_cards`: press `→`; assert first card visible.
- `cards_reveal_each_beat`: press `→` two more times; assert all three cards visible.
- `logo_morph_transition`: press `→`; assert the `.logo` element persists across the transition (not reflowed/destroyed). After transition, outro segment is mounted.
- `outro_renders`: assert outro text, npm install code block.
- `end_of_timeline`: press `→`; assert HUD shows "end of timeline" indicator.
- `prev_jumps_back`: press `←`; assert outro unmounted, feature-cards remounted.
- `no_console_errors_throughout`: capture all console messages; assert zero errors across the full walk.

### Visual regression (optional, later)

Screenshot key beats and snapshot-compare. Out of scope for v1; revisit if regressions become a problem.

## Notes

- "Stylish" is a hard requirement here. This is the showcase. Final design choices (colors, typography, motion details) should involve a designer eye. The structure is locked; aesthetics will be refined during implementation.
- The MP4 in the README is non-negotiable; without it, the project doesn't communicate what it is on first read.
