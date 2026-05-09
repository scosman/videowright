# Authoring a Segment

A segment is a self-contained piece of a video. It owns a DOM element and animates it. This reference covers everything needed to write one well.

## The `defineSegment` helper

Always use `defineSegment` from the `videowright` package. It handles beat tracking, abort signal wiring, and type safety.

```ts
import { defineSegment } from 'videowright';

let host: HTMLElement | null = null;

export default defineSegment({
  id: 'feature-overview',
  advances: [0.6, 2.0, 4.0],
  voiceover: 'Here we showcase the three main features of the product.',

  mount(el, ctx) {
    // Optional: set up initial DOM. The element is a plain <div>.
    host = el;
    el.innerHTML = `<h1 style="opacity: 0">Features</h1>`;
  },

  async play(ctx) {
    // Animate, wait for beats, hold for timed pauses
    // Use host (stored from mount) to query within this segment's DOM.
    const h1 = host!.querySelector('h1')!;
    h1.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' });

    await ctx.hold(600);       // Wait 600ms for the animation to settle
    await ctx.waitForNext();   // Beat 1: user presses next

    // Show feature list
    // ... more animation ...

    await ctx.waitForNext();   // Beat 2: user presses next

    // Final state -- play() resolves, signaling the player
    // that the transition to the next segment can begin.
  },

  unmount() {
    // Optional: cleanup (cancel fetches, dispose WebGL, etc.)
    host = null;
  },
});
```

### Required fields

- **`id`** -- must match the folder name under `segments/` (e.g., `segments/feature-overview/index.ts` has `id: 'feature-overview'`).
- **`play(ctx)`** -- the main animation/content logic. Must return a Promise.
- **`advances`** -- array of segment-relative seconds at which to fire each 'next' advance during render/record. Must be monotonically increasing positive numbers. REQUIRED on every segment. See "The `advances` array" below.

### Optional fields

- **`voiceover`** -- text displayed in the HUD and used by the `script()` helper.
- **`notes`** -- freeform notes, not rendered anywhere.
- **`mount(el, ctx)`** -- called before `play()`. Use for initial DOM setup.
- **`unmount()`** -- called when the segment is removed. Cleanup point.
- **`next()`** -- override default next behavior. Return `true` to consume the press.
- **`prev()`** -- override default prev behavior. Return `true` to consume the press.

## Timing: the single rule

**Use only `ctx.waitForNext()` and `ctx.hold(ms)` for timing.**

| Method | Purpose |
|---|---|
| `ctx.waitForNext()` | Pause until the user presses next (interactive) or the scheduled beat fires (render mode). Creates an "internal beat". |
| `ctx.hold(ms)` | Pause for a fixed duration in milliseconds. Not fast-forwarded during seek. |

### The `setTimeout` / `setInterval` footgun

**Never use `setTimeout`, `setInterval`, or `new Promise(r => setTimeout(r, ms))` in segments.**

These work in interactive mode but break render-mode clock control (a later feature). The player cannot control the JavaScript event loop timer. Code using these timers will desync when render mode drives the video forward at its own pace.

**What to use instead:**

| Need | Solution |
|---|---|
| Timed pause | `ctx.hold(ms)` |
| Wait for user | `ctx.waitForNext()` |
| CSS animation | CSS `@keyframes` or `element.animate()` (Web Animations API) -- these are fine |
| Complex timeline | GSAP with `ctx.signal` to abort on unmount |
| Frame-synced loop | `requestAnimationFrame` -- fine for visual updates |

## The `advances` array

Every segment must declare an `advances` array. This tells the render/record driver when to fire each "next" press. In interactive (dev) mode, `advances` is ignored -- the user presses keys manually.

**The press-counting rule:** each entry in `advances` corresponds to one `triggerNext()` call. Count the total number of presses needed to traverse the segment AND transition out.

| `play()` body | Total presses | `advances` |
|---|---|---|
| `await ctx.hold(3000)` | 1 (transition out) | `[3.0]` |
| `await ctx.waitForNext()` | 2 (resolve wait + transition out) | `[2.0, 4.0]` |
| `await ctx.waitForNext(); await ctx.waitForNext()` | 3 | `[1.5, 3.0, 5.0]` |
| Three `waitForNext()` calls | 4 | `[1.5, 3.0, 4.5, 6.0]` |

The last entry's value is the total segment duration in seconds. The values must be monotonically increasing.

For the last segment in the timeline, the final advance ends the video.

```ts
export default defineSegment({
  id: 'feature-overview',
  advances: [2.0, 4.0, 6.0],  // 3 presses at 2s, 4s, 6s
  voiceover: 'Here we showcase the three main features.',

  async play(ctx) {
    showFeature1();
    await ctx.waitForNext();  // press 1 at 2s
    showFeature2();
    await ctx.waitForNext();  // press 2 at 4s
    showFeature3();
    // play() resolves -> press 3 at 6s transitions out
  },
});
```

**Runtime validation:** the render/record driver detects mismatches between the `advances` array and the segment's actual behavior:
- If the segment parks on `waitForNext` after all advances fired, the driver errors: "Add more entries to the advances array."
- If the segment transitions before all advances fired, the driver errors: "Remove unused entries from the advances array."

## The `ctx.signal` abort signal

`ctx.signal` is an `AbortSignal` that fires when the segment is unmounted. Use it for:

- **Fetch calls**: `fetch(url, { signal: ctx.signal })`
- **GSAP timelines**: `ctx.signal.addEventListener('abort', () => timeline.kill())`
- **Any long-running work** that should stop when the segment leaves

```ts
async play(ctx) {
  const response = await fetch('/api/data', { signal: ctx.signal });
  const data = await response.json();
  // render data...
  await ctx.waitForNext();
}
```

## Idempotency

`play()` may run multiple times across mounts. The segment can be unmounted (via backward navigation, jump-to, or hot reload) and remounted fresh. Do not assume `play()` runs exactly once. Reset state in `mount()` or at the top of `play()`.

## The host element

`mount(el, ctx)` receives a plain `<div>` sized to fill the player viewport. You own this element completely:

- **Direct DOM**: `el.innerHTML = '...'` or `el.appendChild(...)`.
- **Shadow root for isolation**: `const shadow = el.attachShadow({ mode: 'open' })` to prevent global CSS leaking in.
- **Framework mounting**: `ReactDOM.createRoot(el).render(<App />)` or any other framework.
- **Canvas/WebGL**: `el.appendChild(canvas)` for Three.js, PixiJS, etc.

The library does not impose a hosting strategy. Choose what fits the segment.

## Internal beats pattern

Use multiple `waitForNext()` calls to create a multi-beat segment. Each call is one "beat" -- one user advance press.

### Worked example: feature cards that appear one by one

```ts
import { defineSegment } from 'videowright';

let host: HTMLElement | null = null;

export default defineSegment({
  id: 'feature-cards',
  advances: [1.5, 3.0, 4.5, 6.0],
  voiceover: 'Let me walk you through our three key features.',

  mount(el) {
    host = el;
    el.innerHTML = `
      <div style="display:flex; gap:2rem; justify-content:center; align-items:center; height:100%; padding:2rem;">
        <div class="card" style="opacity:0; transform:translateY(20px); transition:all 0.4s ease">
          <h2>Speed</h2>
          <p>10x faster builds</p>
        </div>
        <div class="card" style="opacity:0; transform:translateY(20px); transition:all 0.4s ease">
          <h2>Safety</h2>
          <p>Type-safe by default</p>
        </div>
        <div class="card" style="opacity:0; transform:translateY(20px); transition:all 0.4s ease">
          <h2>Scale</h2>
          <p>Zero-config clustering</p>
        </div>
      </div>
    `;
  },

  async play(ctx) {
    // Query within the host element, not the global document,
    // to avoid selecting elements from another slot during transitions.
    const cards = host!.querySelectorAll('.card') as NodeListOf<HTMLElement>;

    // Beat 1: reveal first card
    cards[0].style.opacity = '1';
    cards[0].style.transform = 'translateY(0)';
    await ctx.waitForNext();

    // Beat 2: reveal second card
    cards[1].style.opacity = '1';
    cards[1].style.transform = 'translateY(0)';
    await ctx.waitForNext();

    // Beat 3: reveal third card
    cards[2].style.opacity = '1';
    cards[2].style.transform = 'translateY(0)';

    // play() resolves -- player can now transition to next segment
  },

  unmount() {
    host = null;
  },
});
```

This segment has 2 internal beats (2 `waitForNext()` calls). The user presses next 3 times total: once for each card reveal, then once more to advance to the next segment. The `advances` array has 4 entries (3 internal + 1 transition), firing at 1.5s, 3s, 4.5s, and 6s.

## Any web tech is welcome

Segments are just web code. Use whatever tools make sense:

- **Three.js**: create a canvas, init a scene in `mount()`, animate in `play()`, dispose in `unmount()`.
- **Animated SVG**: inline SVG with CSS animations or WAAPI.
- **React / shadcn**: mount a React root in `mount()`, render components, unmount in `unmount()`.
- **Lottie**: load a Lottie player in `mount()`, play the animation in `play()`.
- **GSAP**: build a timeline in `play()`, wire `ctx.signal` to kill it on unmount.
- **echarts**: mount a chart instance in `mount()`, animate data changes across beats.

The segment owns its DOM. The library does not restrict what runs inside.

## Common patterns

### Fade-in on mount

```ts
mount(el) {
  el.style.opacity = '0';
  el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
}
```

### Background work after play() resolves

`play()` resolving signals that the *transition out* can begin, but the segment stays mounted until the transition completes and `unmount()` is called. Background animations (e.g., a particle system) can continue running -- just clean them up in `unmount()`.

### Custom next/prev

Override `next()` and `prev()` to handle internal navigation (e.g., a carousel). Use module-scoped variables for state -- the segment object returned by `defineSegment` is frozen, so you cannot store state on `this`.

```ts
import { defineSegment } from 'videowright';

let currentSlide = 0;
const slides = ['One', 'Two', 'Three'];
let host: HTMLElement | null = null;

function render() {
  if (host) host.textContent = slides[currentSlide];
}

export default defineSegment({
  id: 'carousel',
  // next() consumes presses for internal slides; each slide = 1 press + final transition = 4 presses total
  advances: [2.0, 4.0, 6.0, 8.0],

  mount(el) {
    host = el;
    currentSlide = 0;
    render();
  },

  async play(ctx) {
    await ctx.waitForNext();
  },

  next() {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      render();
      return true;  // consumed -- player does not advance
    }
    return false;    // not consumed -- player advances to next segment
  },

  prev() {
    if (currentSlide > 0) {
      currentSlide--;
      render();
      return true;  // consumed -- player does not go back
    }
    return false;    // not consumed -- player goes to previous segment
  },

  unmount() {
    host = null;
  },
});
```
