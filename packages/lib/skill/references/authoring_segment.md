# Authoring a Segment

## What a segment is

A segment is a self-contained TypeScript module that owns a DOM element and animates it. Segments are the building blocks of Videowright videos. Each segment lives in `segments/<id>/index.ts` and default-exports the result of `defineSegment()`.

Segments are shared across all videos. Any video's timeline can reference any segment. Do not duplicate a segment for a different video — parameterize it or extract shared parts into a component.

## `defineSegment`

Every segment is authored via `defineSegment()`. It validates the spec at runtime, brands the object, and returns a frozen `Segment`.

```ts
import { defineSegment } from 'videowright';

export default defineSegment({
  id: 'intro',
  advances: [3.0],
  voiceover: 'Welcome to the demo.',

  mount(el, ctx) {
    // Called when the player gives the segment its host element.
    // Set up DOM, attach components, register event listeners.
  },

  async play(ctx) {
    // Main animation/content logic. Required.
    // The segment decides when it is done via awaits on ctx methods.
    await ctx.hold(3000);
  },

  unmount() {
    // Called when the segment is removed. Clean up resources.
  },
});
```

## SegmentSpec fields

| Field | Required | Purpose |
|---|---|---|
| `id` | Yes | Unique identifier. Must match the folder name under `segments/`. |
| `advances` | Yes | Timing array for automated playback (render export and record auto-advance; see below). |
| `voiceover` | No | VO text for this segment. Used by `videowright script` and shown in the HUD. |
| `notes` | No | Freeform notes. Not rendered anywhere. |
| `mount(el, ctx)` | No | Called when the player gives the segment its host `HTMLElement`. Set up DOM here. |
| `play(ctx)` | Yes | Main animation logic. Must return a `Promise<void>`. The segment ends when play resolves. |
| `unmount()` | No | Called when the segment is removed from the player. Clean up listeners, timers, WebGL contexts, etc. |
| `next()` | No | Override default next-press behavior. Return `true` to consume the press (internal beat), or `false` to let the player handle it normally. Omit the function entirely to use default behavior. |
| `prev()` | No | Override default prev-press behavior. Return `true` to consume the press, or `false` to let the player handle it normally. Omit the function entirely to use default behavior. |

## Lifecycle

1. **`mount(el, ctx)`** — The player creates a host `<div>` and passes it to the segment. The segment populates `el` with its DOM. This runs once per segment instance. `mount` is optional — if the segment only needs `play`, skip it.

2. **`play(ctx)`** — Runs after mount completes. This is where animation and timing happen. The segment controls its duration by awaiting `ctx.waitForNext()` and `ctx.hold(ms)`. When `play()` resolves, the segment is done and the player transitions to the next segment.

3. **`unmount()`** — Called when the player removes the segment (transition to next, or restart). Clean up any resources: event listeners, animation frames, WebGL contexts, audio nodes.

The `ctx.signal` (`AbortSignal`) is aborted when the segment is unmounted. Use it to cancel in-flight work (fetch requests, long-running loops) so they do not leak after the segment is gone.

## PlayerContext

The `ctx` object passed to `mount` and `play`:

| Method/Property | Purpose |
|---|---|
| `ctx.waitForNext()` | Pauses `play()` until the next user advance (interactive mode) or scheduled beat (render mode). Returns a `Promise<void>`. |
| `ctx.hold(ms)` | Pauses `play()` for the given duration in milliseconds. In render mode, resolves immediately (no wall-clock delay — the deterministic clock handles timing). Returns a `Promise<void>`. |
| `ctx.signal` | `AbortSignal` — aborted when the segment is unmounted. Wire this to fetch calls, animation loops, or anything that should stop when the segment leaves. |
| `ctx.mode` | `'interactive'` (dev server) or `'render'` (export pipeline). Segments can branch on this if needed. |
| `ctx.clock()` | Milliseconds since this segment was mounted. In render mode, returns deterministic time based on frame count. In interactive mode, returns wall-clock elapsed. |

### Timing: `waitForNext` vs. `hold`

Use **`ctx.waitForNext()`** for interactive beats — points where the user (or the export driver) advances the video. This creates a pause that the user steps through with Space / Right Arrow in dev mode, and the export pipeline drives with the `advances` timing.

Use **`ctx.hold(ms)`** for timed pauses that gate control flow — waiting before a `waitForNext()`, or inserting a gap between logical phases of a segment. In dev mode, `hold` waits real time. In render mode, `hold` resolves immediately; the deterministic clock in render mode handles time via frame counting.

**`ctx.hold(ms)` is NOT an animation primitive.** Because `hold` resolves immediately in render mode, any pattern that mutates DOM state in a `hold`-driven loop (e.g., typing out characters one by one) will run all iterations on the first render frame and show only the final state. Use WAAPI or CSS animations for visual motion — see "Render-safe animation patterns" below.

**Never use `setTimeout` or `setInterval` in segments.** They break render-mode clock control because render mode does not use wall-clock time.

### Render-safe animation patterns

Render mode uses a **virtual clock** that the render driver advances frame by frame between captured screenshots. The Web Animations API (WAAPI) and CSS animations integrate with this virtual clock because they run on the document timeline, which the render driver controls. Raw `performance.now()`, `Date.now()`, `setTimeout`, and `setInterval` read wall-clock time and do **not** integrate with the virtual clock — they produce incorrect results in render mode.

#### Forbidden patterns

These patterns work in dev mode but break in render mode. **Never use them for animation.**

**1. `await ctx.hold(N)` in a mutation loop** — the hold resolves immediately in render mode, so all iterations fire on the first frame:
```ts
// BAD: typing animation that skips to end in render mode
async play(ctx) {
  const el = host!.querySelector('[data-ref="text"]') as HTMLElement;
  const text = 'Hello, world!';
  for (let i = 0; i <= text.length; i++) {
    el.textContent = text.slice(0, i);
    await ctx.hold(50); // resolves immediately in render → all chars appear at once
  }
}
```

**2. `setTimeout` / `setInterval`** — wall-clock timers, invisible to the render driver:
```ts
// BAD: animation driven by setTimeout
setTimeout(() => el.classList.add('visible'), 500);
```

**3. `performance.now()` / `Date.now()` for animation progress** — reads wall clock, not virtual clock:
```ts
// BAD: manual rAF loop with wall-clock time
const start = performance.now();
function tick() {
  const t = (performance.now() - start) / 1000;
  mesh.rotation.x = t * 0.25;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

**4. Custom `requestAnimationFrame` loops that compute their own deltaTime** — same wall-clock problem:
```ts
// BAD: deltaTime from rAF timestamps
let last = 0;
function tick(now: number) {
  const dt = now - last;
  last = now;
  position += velocity * dt; // dt is wall-clock, not virtual
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

#### Prescribed patterns

**1. WAAPI for DOM animations** (the default choice):
```ts
// GOOD: WAAPI animations run on the document timeline — render-safe
el.animate(
  [
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  { duration: 500, fill: 'forwards', easing: 'ease-out' },
);
```

Use WAAPI `delay` to stagger multiple animations instead of `ctx.hold()` between them:
```ts
// GOOD: staggered entrance using WAAPI delay — render-safe
const items = host!.querySelectorAll('.item');
items.forEach((item, i) => {
  (item as HTMLElement).animate(
    [
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 400, delay: i * 80, fill: 'forwards', easing: 'ease-out' },
  );
});
```

**2. CSS animations and transitions** declared in CSS or set via `el.style.animation`:
```ts
// GOOD: CSS animation — runs on document timeline, render-safe
el.style.animation = 'fadeIn 0.5s ease-out forwards';
```

**3. WAAPI for typing animations** — use per-character `delay` instead of a mutation loop:
```ts
// GOOD: typing animation using WAAPI delay-per-character — render-safe
mount(el) {
  const text = 'Hello, world!';
  el.innerHTML = text
    .split('')
    .map((ch) => `<span style="opacity:0">${ch === ' ' ? '&nbsp;' : ch}</span>`)
    .join('');
},

async play(ctx) {
  const chars = host!.querySelectorAll('span');
  chars.forEach((ch, i) => {
    (ch as HTMLElement).animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 1, // near-instant per character
      delay: i * 50, // 50ms between each character
      fill: 'forwards',
    });
  });
  await ctx.waitForNext();
}
```

**4. `ctx.clock()` for time-derived values** — returns deterministic milliseconds in render mode:
```ts
// GOOD: Three.js driven by ctx.clock() — render-safe
async play(ctx) {
  function tick() {
    if (ctx.signal.aborted) return;
    const t = ctx.clock() / 1000; // seconds since mount, deterministic in render
    mesh.rotation.x = t * 0.25;
    mesh.rotation.y = t * 0.15;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  await ctx.waitForNext();
}
```

**5. Lottie — drive frames manually via `ctx.clock()`** instead of letting lottie-web run its own rAF loop:
```ts
// GOOD: Lottie with manual frame drive — render-safe
async play(ctx) {
  const anim = lottie.loadAnimation({
    container: host!,
    animationData: data,
    autoplay: false, // critical: disable internal rAF loop
  });

  function tick() {
    if (ctx.signal.aborted) return;
    anim.goToAndStop(ctx.clock(), false); // ctx.clock() returns ms
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  await ctx.waitForNext();
}
```

**6. Three.js — use `ctx.clock()` instead of `performance.now()`** for all time-derived values (rotation, position, shader uniforms):
```ts
// GOOD: Three.js scene driven by deterministic clock
const t = ctx.clock() / 1000;
mesh.position.y = Math.sin(t * 2) * 0.5;
```

#### When `ctx.hold()` is still appropriate

`ctx.hold()` is fine for **control-flow pauses** that do not drive animation:
- Waiting a fixed time before calling `ctx.waitForNext()`.
- Inserting a gap between two logical phases of a segment (e.g., hold 2 seconds after all animations finish before play resolves).

In render mode, these holds resolve immediately, which is correct — the segment proceeds without waiting, and the `advances` array controls when the driver fires the next beat.

## The `advances` array

Every segment must declare an `advances` array. It tells the render export pipeline and the record auto-advance mode when to fire each advance during automated playback.

Each entry is a **segment-relative time in seconds** at which the driver fires a `triggerNext()`. The array must be **monotonically increasing** and contain only **positive numbers**.

### How `advances` maps to `waitForNext` and `hold`

The length of `advances` equals the **total number of triggerNext() presses** needed to traverse the segment, **including the final press that transitions to the next segment**.

**Example 1: hold only**

```ts
async play(ctx) {
  await ctx.hold(3000);  // 3 seconds of animation
}
// play() resolves after hold completes -> 1 press needed to move to the next segment
// advances: [3.0]
```

One advance at 3.0s. After the hold completes and `play()` resolves, the export driver fires triggerNext at t=3.0s, which causes the player to transition to the next segment. The advance does not cause the hold — the hold runs on its own clock and the advance fires afterward to move past the segment.

**Example 2: one interactive beat**

```ts
async play(ctx) {
  // Show title
  await ctx.waitForNext();  // 1 press: reveals content
  // Show content
  await ctx.hold(2000);     // 2 second animation
}
// play() resolves -> 1 more press to move to next segment
// advances: [1.5, 4.0]
```

Two advances: first press at t=1.5s reveals content, second press at t=4.0s moves to the next segment.

**Example 3: multiple interactive beats**

```ts
async play(ctx) {
  await ctx.waitForNext();  // 1: reveal point A
  await ctx.waitForNext();  // 2: reveal point B
  await ctx.hold(1000);     // 1 second hold
}
// play() resolves -> 1 more press to move to next segment
// advances: [2.0, 4.0, 6.0]
```

Three advances total. Each waitForNext consumes a press, and the final press after play resolves transitions out.

### Key rules

- `advances` is **required** on every segment. `defineSegment` throws if it is missing or empty.
- Values must be **positive** and **monotonically increasing**.
- The array length determines how many presses the export pipeline fires for this segment.
- `advances` is used in render mode (deterministic export) and record mode (auto-advance playback). In interactive dev mode, the user's key presses drive timing.

## Internal beats with `next()`

For segments that need sub-steps (e.g., a list that reveals items one by one), use the `next()` override.

Note: `defineSegment()` freezes the returned object, so you cannot store mutable state on `this`. Use closure-scoped variables instead:

```ts
let items: NodeListOf<Element>;
let revealed = 0;

export default defineSegment({
  id: 'feature-list',
  advances: [1.5, 3.0, 4.5, 6.0],

  mount(el) {
    el.innerHTML = '<div class="item">A</div><div class="item">B</div><div class="item">C</div>';
    items = el.querySelectorAll('.item');
    revealed = 0;
  },

  next() {
    if (revealed < items.length) {
      items[revealed].classList.add('visible');
      revealed++;
      return true;  // consumed — stay on this segment
    }
    return false;  // not consumed — let the player advance to next segment
  },

  async play(ctx) {
    // play can just hold while next() handles the reveals
    await ctx.hold(6000);
  },
});
```

When `next()` returns `true`, the press is consumed as an internal beat — the player does not transition. When it returns `false`, the player handles the press normally (moves to next segment or resolves a pending `waitForNext`).

## Idempotency

Segments should be safe to mount and unmount multiple times. This happens when:

- The user navigates backward and forward through the timeline.
- The player restarts.
- The dev server hot-reloads.

Rules:

- Do not assume `mount` is called only once per page load.
- Clean up everything in `unmount()` — event listeners, DOM mutations outside `el`, global state.
- Use `ctx.signal` to abort in-flight work when the segment is unmounted mid-play.

## Any web tech is welcome

Segments own their DOM. Inside a segment, use whatever fits:

- **CSS animations and transitions** for simple motion. Render-safe -- they run on the document timeline.
- **GSAP** for complex timeline-based animation. Render-safe when using its document-timeline mode.
- **Three.js / WebGL** for 3D scenes. Drive time-derived values with `ctx.clock()`, not `performance.now()`. See render-safe patterns above.
- **Lottie** for After Effects animations. Use manual frame drive with `ctx.clock()` (`autoplay: false`, `anim.goToAndStop(ctx.clock(), false)`). See render-safe patterns above.
- **Animated SVG** for vector graphics. Use WAAPI or CSS animations for SVG element animations.
- **React / shadcn** for component-driven UI (attach to `el` via `createRoot`).
- **echarts / D3** for data visualization.
- **Canvas 2D** for pixel-level control. Use `ctx.clock()` for time-derived drawing.

If you need DOM isolation (e.g., to avoid CSS conflicts), attach a shadow root to `el`:

```ts
mount(el) {
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>/* scoped styles */</style><div>...</div>`;
}
```

## Using style tokens

Segments consume the active style's design tokens via CSS custom properties: `var(--color-accent)`, `var(--font-display)`, etc. Segments do **not** import `tokens.css` themselves — the timeline-level import provides the variables at runtime via `:root` custom properties.

This means one segment can be reused across videos with different styles. The CSS variables resolve to whatever the video's timeline imported.

See [styles.md](styles.md) for the full token system and recommended token set.
