# Demo Video

The Videowright showcase video. Demonstrates the breadth of web technologies that work inside segments.

## Segments

| # | Segment | Technology | Beats |
|---|---------|-----------|-------|
| 1 | intro | CSS keyframes, `<animated-title>` web component | 0 |
| 2 | feature-svg | Pure SVG + WAAPI (stroke-dashoffset, radius, opacity) | 0 |
| 3 | feature-three | Three.js (WebGL, `IcosahedronGeometry`) | 2 |
| 4 | feature-lottie | lottie-web (`rocket-launch.json` Vite JSON import) | 0 |
| 5 | feature-echarts | ECharts (animated bar chart) | 1 |
| 6 | feature-cards | HTML/CSS, `<feature-card>` web component | 3 |
| 7 | outro | CSS + WAAPI animations | 0 |

## Custom Transition

`logo-morph` — FLIP-style animation that morphs the "Videowright" logo from the cards segment into the outro. Falls back to crossfade if `.logo` elements are missing.

## Running

```bash
npm install
npx videowright dev
```

Or from the repo root:

```bash
npm run dev:demo
```
