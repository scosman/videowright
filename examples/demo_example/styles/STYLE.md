# Videowright Demo — Style Guide

## Palette

Dark cinematic base with electric accent colors. The background is near-black (#07070d) to make content pop and evoke a "theater" feel — videos are meant to be watched, not read. Surface colors step up subtly (#111119, #1a1a26) to create depth without harsh contrast.

- **Accent blue** (#3b82f6) — primary actions, highlights, the "Videowright" brand moments
- **Accent green** (#10b981) — success, code blocks, terminal-style accents
- **Accent purple** (#8b5cf6) — secondary highlights, 3D scene lighting
- **Accent amber** (#f59e0b) — data viz, chart highlights, warmth

## Typography

Inter (or system sans-serif fallback) at generous sizes. Headings are bold and large to read at video resolution. Body text stays at 1rem+ because this is presentation content, not web app UI.

Monospace uses JetBrains Mono for code blocks — the ligatures help readability at scale.

## Motion

All animation uses Web Animations API (WAAPI) or CSS keyframes. Easing favors `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out) for entrances and `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out) for sustained motion. A spring curve is available for playful moments.

Durations: 200ms for micro-interactions, 400ms for standard transitions, 700ms for dramatic reveals.

## Spacing

A 4px base grid (0.25rem increments). Generous padding throughout — the player is 1920x1080, so whitespace reads well. Cards and panels use 2rem+ padding.

## Design Principles

1. **Cinematic, not corporate.** Dark backgrounds, bold type, glowing accents. This is a showcase video.
2. **Each segment is distinct.** Different web technologies should feel different — SVG is precise and geometric, Three.js is spatial and atmospheric, charts are data-dense.
3. **Consistent chrome.** Despite distinct content, segments share the same palette, font stack, and spacing scale.
4. **Motion earns attention.** Every animation communicates something. No gratuitous parallax or bounce.
