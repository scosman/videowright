# Videowright Demo

The official showcase video for Videowright. Demonstrates the breadth of web technologies that work inside segments.

## Running

```bash
# From the repo root:
npm run dev:demo

# Or from this directory:
npm install
npx videowright dev
```

Navigate with arrow keys: `->` advances (next beat or next segment), `<-` goes back. Press `R` to restart, `H` to toggle the HUD.

## What each segment demonstrates

| # | Segment | Technology | What it shows |
|---|---------|-----------|---------------|
| 1 | **intro** | CSS keyframes, `<animated-title>` web component | Staggered letter reveals with shadow DOM |
| 2 | **feature-svg** | Pure SVG + WAAPI | Lines stroke in, nodes scale up -- zero dependencies |
| 3 | **feature-three** | Three.js (WebGL) | Rotating icosahedron, 2 beats, `ctx.signal` for rAF cleanup |
| 4 | **feature-lottie** | lottie-web | Real After Effects export (`rocket-launch.json`) |
| 5 | **feature-echarts** | ECharts | Animated bar chart, 1 beat updates data + colors |
| 6 | **feature-cards** | HTML/CSS, `<feature-card>` web component | 3 cards revealed on 3 beats |
| 7 | **outro** | CSS + WAAPI | Logo, code block, staggered fade-ins, `hold(2000)` |

## Custom transition

`logo-morph` -- a FLIP-style WAAPI animation that morphs the "Videowright" logo from `feature-cards` into `outro`. Falls back to crossfade if `.logo` elements are missing.

## Design tokens

Shared palette, typography, spacing, and motion curves live in `styles/`. The CSS custom properties are in `tokens.css`; TypeScript constants (for Three.js, ECharts, and computed styles) are in `tokens.ts`.

## Project structure

```
segments/           7 segments, one per web technology
components/         <animated-title>, <feature-card> web components
transitions/        logo-morph custom transition
styles/             Design tokens (CSS + TS) and STYLE.md rationale
videos/demo/        Timeline, voiceover script, README
```
