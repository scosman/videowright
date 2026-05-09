---
status: implementing
---

# Phase 7: Demo Example

## Overview

Build a complete consumer-style demo video at `examples/demo_example/` that showcases Videowright's capabilities. The demo contains 7 segments exercising different web technologies (SVG, Three.js, Lottie, ECharts, HTML/CSS cards), a custom `logo-morph` transition, shared components, design tokens, a voiceover script, and full styling. This serves as the project's showcase and future e2e test target.

## Steps

### 1. Add workspace entry and root script

- Add `"examples/*"` to root `package.json#workspaces`.
- Add `"dev:demo"` script to root `package.json` that runs `npm run dev --workspace=examples/demo_example`.
- Add reference to `examples/demo_example` tsconfig in root `tsconfig.json`.

### 2. Scaffold `examples/demo_example/` directory structure

```
examples/demo_example/
├── package.json
├── tsconfig.json
├── videowright.config.ts
├── videos/demo/
│   ├── timeline.ts
│   ├── README.md
│   ├── PLAN.md
│   └── voiceover/script.md
├── segments/
│   ├── intro/index.ts
│   ├── feature-svg/index.ts
│   ├── feature-three/index.ts
│   ├── feature-lottie/index.ts
│   ├── feature-echarts/index.ts
│   ├── feature-cards/index.ts
│   └── outro/index.ts
├── components/
│   ├── animated-title/index.ts
│   └── feature-card/index.ts
├── transitions/
│   └── logo-morph.ts
└── styles/
    ├── tokens.css
    ├── tokens.ts
    └── STYLE.md
```

### 3. Create `package.json` for the demo workspace

- Name: `demo-example` (private)
- Dependencies: `videowright` (via `"file:../../packages/lib"`), `three`, `lottie-web`, `echarts`
- Dev dependencies: `@types/three`
- Script: `"dev": "npx videowright dev"`

### 4. Create `tsconfig.json` for the demo

- Extends `../../tsconfig.base.json`
- Target: ES2022, module: ESNext, moduleResolution: Bundler (for Vite)
- Includes `segments/`, `components/`, `transitions/`, `styles/`, `videos/`

### 5. Create design tokens (`styles/tokens.css`, `styles/tokens.ts`, `styles/STYLE.md`)

- Dark neutral background (`#0a0a0f`), accent blue (`#3b82f6`), accent green (`#10b981`)
- System font stack: Inter / system-ui fallback
- Spacing scale, border-radius, smooth easing curves
- `STYLE.md` documents the rationale

### 6. Create web components

- `components/animated-title/index.ts` — staggers letter reveals via CSS keyframes
- `components/feature-card/index.ts` — card with icon, title, description; enter animation

### 7. Create the 7 segments

Each segment follows `defineSegment(...)` with id, voiceover, mount/play/unmount.

- **intro**: CSS-animated title using `<animated-title>` component. Auto-advances after `hold(3000)`.
- **feature-svg**: Animated SVG node graph drawn with WAAPI. Auto-advances after `hold(3000)`.
- **feature-three**: Three.js rotating icosahedron. 2 beats (camera zoom, label). `ctx.signal` for rAF cleanup.
- **feature-lottie**: Real Lottie animation (`rocket-launch.json`) rendered via lottie-web. Imported as JSON via Vite.
- **feature-echarts**: ECharts bar chart. 1 beat to update data.
- **feature-cards**: Three `<feature-card>` components revealed on 3 beats.
- **outro**: Logo + "Get started" + `npm install videowright` code block. `hold(2000)`.

### 8. Create custom transition: `logo-morph`

FLIP-style animation using WAAPI. Coordinates `.logo` element across feature-cards to outro. Falls back to fade if logos not present.

### 9. Create `videowright.config.ts`

Registers the `logo-morph` custom transition. Sets default resolution/fps/aspectRatio.

### 10. Create timeline and voiceover script

- `videos/demo/timeline.ts` with all 7 segments and transitions per spec.
- `videos/demo/voiceover/script.md` with artistic VO for all segments.
- `videos/demo/README.md` and `PLAN.md`.

### 11. Install dependencies

Run `npm install` to install Three.js, lottie-web, echarts in the demo workspace.

### 12. Add integration smoke test

Add `cli_dev_against_demo_smoke` test in `packages/lib/test/integration/` that:
- Verifies the demo's timeline.ts can be loaded via tsx
- Validates segment structure
- Does not attempt to render Three.js/etc in jsdom

### 13. Verify

- `npm run lint` passes
- `npm run typecheck` passes
- `npm test` passes (all existing + new tests)
- `npm run dev:demo` boots the Vite server

## Tests

- `cli_dev_against_demo_smoke`: Loads demo timeline.ts via tsx, validates it has 7 segments with expected ids, validates meta fields, confirms the timeline is structurally valid.
