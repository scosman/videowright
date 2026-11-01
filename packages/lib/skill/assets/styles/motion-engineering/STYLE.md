---
title: Motion Engineering
slug: motion-engineering
picker_description: Aerospace HUD on a blueprint grid. Charcoal canvas, cyan-white type, amber signal, cyan measurement. Elements measure themselves in.
# Provenance only: the faces are bundled in fonts/ and loaded by tokens.css (@font-face).
font_sources:
  - https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800
  - https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols+2
  - https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols
mood: [technical, precise, engineered, alive, cinematic]
good_for:
  - Developer tools, SDKs and CLIs
  - Infrastructure, performance and reliability stories
  - Benchmarks and before/after numbers
  - Data, telemetry and observability products
  - Hardware, robotics and aerospace launches
bad_for:
  - Consumer apps that need warmth or whimsy
  - Lifestyle, food, fashion or editorial brands
  - Long-form narrative with little to measure (use Editorial Mono)
  - Light-mode brand systems
tags: [hud, blueprint, grid, technical, dark-mode, data, motion]
references: [Territory Studio film HUDs, SpaceX launch telemetry, Apollo DSKY, Teenage Engineering]
---

# Style: Motion Engineering

## When to use

Developer tools, infrastructure, performance and data stories: anything where "precise, engineered, alive" is the point. Every frame should look like a live engineering instrument reading out the story. Not for warm, playful or editorial brands.

## Identity

Aerospace HUD on a blueprint grid. A cool charcoal canvas carries a 40px grid plane. Type is cyan-white. **Amber** is the HUD signal: the one thing that matters right now. **Cyan** is measurement: dimension lines, rulers, readouts. Elements *measure themselves in*: lines draw, crosshairs lock on, callouts arrive on leader lines, numbers tick. Then the frame keeps breathing.

## Aesthetic rules

### Color roles

| Role | Token | Use |
|---|---|---|
| Canvas | `--color-bg` (`--surface-0`) | The page. Never pure black. |
| Surfaces | `--surface-1..3`, `.me-panel` | Panels, windows, chips. Lift in small steps; hairline border plus a top edge highlight. |
| Type | `--color-fg`, `--fg-2`, `--color-muted` | Primary, secondary, tertiary. Earlier items recede down this ladder. |
| Signal | `--amber` (`--color-accent`) | The focal element: a lock, the key number, the current step. **One at a time.** |
| Measurement | `--cyan` | Dimension lines, rulers, scales, readouts. Never decoration. |
| Status | `--ok`, `--warn` | Pass/fail states only. |

- One accent at a time: amber marks one subject. Several amber marks may point at the same thing (the current step's number, marker and label), never at two different things. Amber and cyan share frames freely because they mean different things.
- Glow (`--glow-amber`, `--glow-cyan`, the `-filter` forms for SVG) is for strokes, bars and marks only. Type never glows, display type included; `.me-signal` colors type amber without a glow.

### Type

| Role | Class | Size | Notes |
|---|---|---|---|
| Numeral | `.me-numeral` | `--type-numeral` 420px | Section numbers. Tabular. |
| Hero | `.me-hero` | `--type-hero` 256px | Title cards, kinetic statements, the one big number. |
| Display | `.me-display`, `.me-display-sm` | 200 / 150px | Section titles, large statements. |
| Heading | `.me-h1`, `.me-h2` | 96 / 72px | Scene headings, list items. |
| Readout (large) | `.me-readout-lg` | `--type-readout-lg` 56px | A measured value that carries the story. |
| Body | `.me-body-lg`, `.me-body` | 48 / 36px | Sentences. `--fg-2` by default. |
| Mono | `.me-mono` | `--type-mono` 28px | Code, terminals, values. Values that carry the story are at least this size. |
| Label | `.me-label` | `--type-label` 22px | Expanded, tracked caps (Archivo at 125% width). |
| Readout | `.me-readout` | `--type-label` 22px | Mono caps, tabular, cyan. HUD values. |

- Use the classes; don't hard-code font sizes. If a composition needs a size the scale lacks, add a token.
- **Legibility floor at 1080p:** display 120px+, headings 72px+, body 36px+, mono UI/code 28px+, labels and readouts 22px minimum. Nothing smaller, ever. A label too small to read at phone size is removed, not shrunk.
- Archivo's width axis is the system: display at `--stretch-display` (112%), body at 100%, labels at 125%. Don't mix in other sans faces.
- Numbers that change use tabular figures (`.me-num`, `.me-readout`, `.me-mono`) so they don't jitter.
- Mono has no coding ligatures (removed from the bundled file), so code reads like a real terminal.
- Symbols (✓ ✗ ⏺ ⎿ ✻ ★ ▶ …) come from the bundled `ME Symbols` face, second in every stack. Glyphs outside the bundled ranges fall back to system fonts: check renders for them.

### Composition

- One focal point per frame. Everything else is quieter (fg-2, muted, cyan hairlines).
- Content fills the frame: primary content spans 80–90%+ of the width. The content safe area is `--safe-x` × `--safe-y` (x 160–1760, y 140–940).
- HUD chrome lives in the band between the frame edge and the safe area: `.me-frame` corner brackets at `--hud-x`/`--hud-y` (80, 60) and four `.me-hud-slot`s (`tl`, `tr`, `bl`, `br`) just inside them. Chrome never collides with content; keep its text to 22px labels and readouts.
- Align to the grid. Left edges sit on the x = 160 major line; rows sit on 40px lines; scales use the grid itself (1 cell = 1 unit) wherever the data allows.

### Depth and light

Scenes are layered, never flat. All of it is static or clock-driven, so it is render-safe.

1. **Grid plane** (`.me-grid`): 40px cells, 160px majors, registration crosses at major intersections, a lit falloff mask toward the edges. It follows the camera at 60% (parallax).
2. **Scan** (`.me-scan`, inside the grid): a brighter copy of the lines seen through a band that crosses the plane every 7s. Phase it per scene so consecutive scenes don't scan in step.
3. **Flare** (`.me-flare`, inside the grid): when a lock lands, the registration crosses within ~320px brighten and decay over ~600ms. This is the grid answering the content.
4. **Key light** (`.me-key`): a soft cyan pool on the plane behind the focal point; set `--key-x` / `--key-y` per scene.
5. **Vignette** (`.me-light`): corners fall to about half brightness. It sits under the content, so it shades the plane and never the type.
6. **World** (`.me-world`): content (`.me-content`) and annotation (`.me-svg`, a 1920×1080 viewBox in stage pixels). The camera moves it.
7. **Grain** (`.me-grain`): a static white speckle in 3px blocks that lifts the canvas 0–6 levels and survives H.264.
8. **HUD** (`.me-hud`): frame and slots. Outside the camera.

The vignette, key light and grain are pre-baked PNGs (`textures/`), not CSS gradients or SVG noise. Render frames are captured as PNG screenshots, and a dithered gradient or per-pixel noise over the whole frame makes every frame several times slower to encode.

Surfaces (`.me-panel`): `--surface-1` with a faint top-lit gradient, a 1px `--color-border` hairline, `--edge-light` highlight and an `--elev-*` shadow. Panels measure themselves in like everything else (the samples' `panelIn`): a `--hairline-strong` outline draws around the box, the surface fills top-down behind it, and the drawn outline hands over to the panel's own border. Nested surfaces (cards, nodes, popovers) step up to `--surface-2` and `--surface-3`.

## Stage anatomy

```html
<div class="me-stage" style="--key-x: 900px; --key-y: 500px">
	<div class="me-grid">              <!-- camera at 60% -->
		<div class="me-scan"></div>
		<div class="me-flare"></div>
	</div>
	<div class="me-key"></div>
	<div class="me-light"></div>       <!-- vignette, under the content -->
	<div class="me-world">             <!-- the camera -->
		<div class="me-content">…</div>
		<svg class="me-svg" viewBox="0 0 1920 1080">…</svg>
	</div>
	<div class="me-grain"></div>
	<div class="me-hud">
		<div class="me-frame"></div>
		<div class="me-hud-slot" data-at="tl">…</div>   <!-- tl, tr, bl, br -->
	</div>
</div>
```

- **Fixed grid origin.** The grid has a major and a minor line through the frame centre on both axes and is overscanned by one major cell. At camera identity every scene's grid lands on the same pixels, so a wipe or cut reads as one instrument changing readouts.
- **Camera.** Transform `.me-world`, and `.me-grid` by 60% of the same move (the samples' `startAmbient` does both). A scene starts at identity and is back at identity (or masked by the transition) by its exit. Pivot on the left margin (`setOrigin(160, 540)`) when type is left-aligned, so a push never shoves it into the HUD band. With a left pivot, everything to the right swells toward the frame edge as the camera leans in (about 3.5% at peak): right-anchored content must end at x ≤ ~1700, or be anchored to the content it measures instead.
- **Region framing.** To show a region of a window or app at legible scale, move the camera instead of shrinking the content. Animate the individual `translate` and `scale` properties of `.me-world` (and 60% of the same move on `.me-grid`): they compose with the ambient `transform` the rAF loop writes, so drift and framing never fight. Fit the region into the safe area (zoom ≤ 1.4). While framed, a focus mask covers all four bands outside the safe frame with `--color-bg`, fading in over ~52–64px (fixed, above the world and below the grain, so the bands keep their texture), so zoomed content never fights the HUD readouts, and the move is clamped so the window's own edges stay at or beyond the mask's inner edges: anything past the window falls under the mask. Rest to identity before the exit (the `ui-showcase` sample does all of this in its scene section).
- Measure layout with `offsetLeft/Top/Width/Height`, not `getBoundingClientRect()`: offsets ignore the camera and the dev player's scaling. The samples' `boxOf(el)` walks the offset chain up to `.me-content` and returns the box in stage px.

## HUD vocabulary

- **Corner frame and slot labels**: present and static from frame 1 in every scene; they are chrome, not content. Don't decode or animate them on entry.
- **Registration corners**: four amber L-brackets that lock onto a subject's box like autofocus: they close in from outside, settle, blink twice.
- **Crosshair lock**: an amber reticle drops in at 2.4× and 45°, settles on target, blinks twice. Each shape has a canvas-colored knockout stroke under it so it reads over amber. Use on a point (a bar tip, a data point), never over type.
- **Crosshair pointer**: in a product UI, a smaller amber crosshair (four ticks and a dot, same knockout) travels to the interaction point with `--ease-settle` and clicks with a ring that expands and fades. It is the viewer's cursor: one at a time, on a control or a data mark, never over type.
- **Dimension line**: cyan, 2px. Witness lines drop from the subject's edges first, then the dimension draws from its centre outward, then a value in a background-filled chip ticks to the real measurement. The chip and its value appear together, at `--type-mono` (28px) when the value carries the story.
- **Ruler**: a baseline with 40px minor and 160px major ticks, ticks appearing as the baseline passes them.
- **Leader callout**: a node locks on, a leader draws, the label rises or decodes at the end of it. Dotted leaders carry a value to the right edge.
- **Readouts**: mono caps, `--cyan` or `--color-muted`. The `tr` slot runs the scene timecode (`T+00:03.42`); `bl` reports what the HUD is doing or adds a fact the frame doesn't already show (`LOCK X 0160 Y 0389`, `UP NEXT · 03 TELEMETRY`); `br` the scale (`GRID 40 PX`).

## Motion system

### Order: draw → fill → annotate → breathe

1. **Draw** (0–800ms): structure first. Rules, axes, spines, witness lines, frames draw with `--ease-draw`.
2. **Fill** (200–1200ms): content arrives. Type rises out of masks, labels decode, bars grow, surfaces fill.
3. **Annotate** (800–1800ms): the HUD acts on the content. Locks, dimension lines, callouts, ticking values.
4. **Breathe** (always): the camera drifts, the timecode runs, the scan crosses the grid, readouts update.

On a later cue the same order repeats at a smaller scale for the new element only, one step at a time: lock, then measure, then the value, then the words.

**Frame 1 rule.** A scene that may be entered by a hard cut shows its structure on frame 1: axes and frames already drawn, the first type already rising. Draw-first openings are for scenes entered under a sweep or a push, which cover the empty frames.

### Easing and duration

| Token | Value | Use |
|---|---|---|
| `--ease-settle` | `cubic-bezier(0.16, 1, 0.3, 1)` | Every arrival: expo-out settle. |
| `--ease-draw` | `cubic-bezier(0.65, 0, 0.35, 1)` | Strokes and growing bars. |
| `--ease-sweep` | `cubic-bezier(0.45, 0, 0.55, 1)` | Wipes and the sweep transition. A gentle in-out: peak speed is about 1.8× the average (~90 px per frame at 60 fps across 1920 px), so the beam glides rather than jumps. |
| `--ease-exit` | `cubic-bezier(0.7, 0, 0.84, 0)` | Retractions, push-outs. |
| `--dur-tick` | 50ms | Step of a ticking number. |
| `--dur-fast` / `--dur-normal` / `--dur-slow` | 220 / 520 / 900ms | Micro, standard, hero arrivals. |
| `--dur-draw` | 760ms | A stroke across the frame. |
| `--dur-sweep` | 640ms | The sweep transition. |
| `--dur-exit` | 420ms | The release. |
| `--dur-ambient` | 16s | One camera drift. |
| `--stagger` / `--stagger-tight` | 80 / 40ms | Between siblings / between characters or ticks. |

- No bounce, no spring, no overshoot. No fade-only entrances: every arrival moves (rises, draws, locks, grows); opacity may ride along.
- **Text reveals** are masked line reveals (`.me-line` mask, child rises from `translateY(112%)` with `--ease-settle`, `--stagger` between lines or words) or a **mono decode** (characters resolve left to right through seeded noise, ~26ms apart, each settling after ~170ms). Decode is for mono readouts and short labels, never for sentences.
- **Numbers tick; they don't tween.** Values step on the `--dur-tick` grid with an expo-out progress, so they count fast and decelerate into the final value, like an instrument. Format with fixed decimals and tabular figures.
- **Stagger rules:** siblings `--stagger` apart in reading order; characters and ticks `--stagger-tight`; never more than ~6 staggered items in one burst (group the rest). The exception is lines of code or terminal output, which may cascade line by line at `--stagger-tight`: they read as one block arriving.
- **Focus shifts:** when a new item lands, the previous one recedes one step down the type ladder (fg → fg-2 → muted) or to ~50% opacity, and its amber marks turn cyan.
- **Release (exit half):** on the scene's last cue the HUD lets go: annotation strokes retract toward their origin (`--ease-exit`), locks and chips fade (`--dur-exit`), and the camera eases back to identity (sine in-out over 1.4 × `--dur-exit`). The content, and any mark that is the scene's payoff, stays; the transition carries it out.

### Living frame

Nothing is fully static for more than ~1s, and nothing ambient competes with the focal point.

- Camera: a slow push over `--dur-ambient` (≈2.4% scale, a few px of pan, sine in-out), plus small `nudge`s (≈1% over ~1.2s) when a new beat lands.
- The timecode readout runs every frame; other readouts change only when the HUD does something. When two tickers write the same element, the newest wins.
- The scan band crosses the grid every 7s at very low contrast, phased per scene. The grid answers locks with a flare.
- Restraint: ambient motion is slower, smaller and lower-contrast than any content motion. If you notice it before the content, turn it down.

### Render safety

- Drive everything from WAAPI (`el.animate`) or one rAF loop that reads `ctx.clock()`. Never `Math.random()`: use seeded noise. No SMIL.
- Await fonts first in `mount()`: `document.fonts.load('600 64px "Archivo"')`, `'500 64px "JetBrains Mono"'`, and `('400 64px "ME Symbols"', "✓")`. The faces use `font-display: block`, so this guarantees no frame shows a fallback face. Skip the await when `document.fonts.check()` says the faces are already loaded (the samples' `fontsReady()` does): `document.fonts.load()` always resumes on a later task, which in a render can land mid-frame, start `play()` off the frame grid, and make frames differ between runs.
- `play()` must not await anything that outlives the scene (e.g. a long animation's `finished`); use `ctx.hold()`.
- `unmount()` only stops loops and drops listeners. Never change what the last frame looks like: the transition is still showing it.

## Transitions

Choose every cut for its cut. No default fades. Vary the rhythm across a video: hard cut, sweep, push, match cut. All of these keep the grid continuous at rest.

| Transition | When | Feel |
|---|---|---|
| `me-sweep` (signature) | Between scenes of the same story: the instrument redraws its readout. | A cyan scanline with a bright core crosses left to right (right to left going back); the new scene is revealed behind it while the old one dims slightly. 640ms. Cyan, not amber: the sweep is the instrument measuring, and amber stays free for the content's signal. |
| `me-push` | Into a deeper level: a detail, a zoom into a section, out of a section divider. | The camera drives forward through the content: the old content accelerates past the lens and clears, the new content arrives from further down the axis and settles, while the grid, vignette and grain stay put (the grid leans in slightly). The key light glides to the new focal point, and the HUD readouts switch at the moment the new content arrives. 700ms. |
| `cut` (built-in) | Hooks, resets, a reveal that should hit. | Instant. Land it on a breath or a beat. |
| Match cut | Continuity of an object across scenes. | End the outgoing scene with a shape (a reticle, a frame, a bar) exactly where the incoming scene's first element appears, then hard `cut`. |

Scenes pair with them: **enter halves** start with draw left to right, so they read under a sweep, and settle from slightly small, so they read under a push; **exit halves** are the release (above). Transitions run on the render clock and their time comes out of the incoming scene's first beat; keep them ≤ 700ms.

### Recipe: `me-sweep`

Save as `transitions/me-sweep.ts` and register it in `videowright.config.ts`:

```ts
transitions: {
	"me-sweep": () => import("./transitions/me-sweep.js"),
	"me-push": () => import("./transitions/me-push.js"),
},
```

Then use it from a timeline entry: `{ id: "my-scene", transition: "me-sweep" }` (or `transition: { type: "me-sweep", duration: 560 }`).

```ts
import type { Transition } from "videowright";

// Motion Engineering signature sweep: a cyan scanline crosses the frame and the incoming
// scene is revealed behind it, as if the instrument redraws its readout. The tick ruler on
// the beam's leading edge lands on the 40px grid. Reverses for backward navigation.
const meSweep: Transition = async (outgoing, incoming, ctx) => {
	const root = getComputedStyle(document.documentElement);
	const token = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;
	const duration = ctx.duration ?? (Number.parseFloat(token("--dur-sweep", "640ms")) || 640);
	const easing = token("--ease-sweep", "cubic-bezier(0.45, 0, 0.55, 1)");
	const host = incoming.parentElement ?? incoming;
	const width = host.clientWidth;
	const forward = ctx.direction !== "backward";
	const hidden = forward ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
	// Hide the incoming scene before anything can paint it unclipped.
	incoming.style.clipPath = hidden;

	const cyan = "var(--cyan, #5bd8f5)";
	const tint = (pct: number) => `color-mix(in srgb, ${cyan} ${pct}%, transparent)`;
	const beam = document.createElement("div");
	beam.style.cssText =
		"position:absolute;top:0;bottom:0;left:0;width:0;z-index:3;pointer-events:none";
	const trail = forward
		? "right:0;background:linear-gradient(to left,"
		: "left:0;background:linear-gradient(to right,";
	const ticks = forward ? "left:6px" : "right:6px";
	beam.innerHTML = `
		<div style="position:absolute;top:0;bottom:0;${trail}${tint(14)},transparent);width:240px"></div>
		<div style="position:absolute;top:0;bottom:0;${ticks};width:16px;background:repeating-linear-gradient(to bottom,${tint(70)} 0 2px,transparent 2px 40px);background-position:0 20px"></div>
		<div style="position:absolute;top:0;bottom:0;left:-2px;width:4px;background:${cyan};box-shadow:0 0 16px 2px ${tint(50)},0 0 56px 8px ${tint(18)}"></div>
		<div style="position:absolute;top:0;bottom:0;left:-1px;width:2px;background:var(--color-fg, #e6f5fa)"></div>`;
	host.appendChild(beam);

	outgoing.style.zIndex = "1";
	incoming.style.zIndex = "2";
	const timing = { duration, easing, fill: "forwards" as const };
	const [x0, x1] = forward ? [0, width] : [width, 0];

	try {
		await Promise.all([
			incoming.animate([{ clipPath: hidden }, { clipPath: "inset(0 0 0 0)" }], timing).finished,
			beam.animate(
				[{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1}px)` }],
				timing,
			).finished,
			// Fade the beam in and out at the frame edges so it never pops.
			beam.animate(
				[{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }],
				{ duration, fill: "forwards" },
			).finished,
			outgoing.animate([{ filter: "brightness(1)" }, { filter: "brightness(0.75)" }], timing)
				.finished,
		]);
	} finally {
		beam.remove();
		incoming.style.clipPath = "";
		outgoing.style.zIndex = "";
		incoming.style.zIndex = "";
	}
};

export default meSweep;
```

### Recipe: `me-push`

Save as `transitions/me-push.ts`:

```ts
import type { Transition } from "videowright";

// Motion Engineering camera push: the camera drives forward through the content. Only the
// content layers move. Every Motion Engineering scene has the same grid, vignette and grain
// at camera identity, so the outgoing copies are hidden at once and the incoming ones carry
// straight through: one instrument, the camera moving. The outgoing content grows past the
// lens and clears; the incoming content arrives from further down the axis and settles. The
// key light glides to the new focal point, and the HUD readouts switch when the new content
// arrives. Falls back to moving whole slots for scenes without a .me-stage. Reverses (pulls
// back) for backward navigation.
const mePush: Transition = async (outgoing, incoming, ctx) => {
	const root = getComputedStyle(document.documentElement);
	const token = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;
	const duration = ctx.duration ?? 700;
	const settle = token("--ease-settle", "cubic-bezier(0.16, 1, 0.3, 1)");
	// Ease-in cubic: the content accelerates toward the lens while it is still visible.
	const accelerate = "cubic-bezier(0.32, 0, 0.67, 0)";
	const forward = ctx.direction !== "backward";
	const [past, arrive] = forward ? [2.0, 0.8] : [0.8, 1.25];

	const outStage = outgoing.querySelector<HTMLElement>(".me-stage");
	const inStage = incoming.querySelector<HTMLElement>(".me-stage");
	const layered = Boolean(
		outStage?.querySelector(".me-world") && inStage?.querySelector(".me-world"),
	);
	const contentOf = (stage: HTMLElement | null) => [
		...(stage?.querySelectorAll<HTMLElement>(".me-world > *") ?? []),
	];
	const hiddenLayers: HTMLElement[] = [];
	if (layered && outStage) {
		outStage.style.background = "transparent";
		for (const layer of outStage.children) {
			const keep = ["me-world", "me-hud"].some((name) => layer.classList.contains(name));
			if (layer instanceof HTMLElement && !keep) {
				layer.style.opacity = "0";
				hiddenLayers.push(layer);
			}
		}
	}

	// The outgoing slot is on top: its content passes the lens over the incoming scene.
	outgoing.style.zIndex = "2";
	incoming.style.zIndex = "1";
	const animations: Animation[] = [];
	for (const el of layered ? contentOf(outStage) : [outgoing]) {
		animations.push(
			el.animate(
				[
					{ transform: "scale(1)", filter: "blur(0px)" },
					{ transform: `scale(${past})`, filter: "blur(6px)" },
				],
				{ duration: duration * 0.45, easing: accelerate, fill: "forwards" },
			),
			el.animate([{ opacity: 1 }, { opacity: 0 }], {
				duration: duration * 0.2,
				delay: duration * 0.25,
				fill: "forwards",
			}),
		);
	}
	const arriving: Animation[] = [];
	for (const el of layered ? contentOf(inStage) : [incoming]) {
		arriving.push(
			el.animate([{ transform: `scale(${arrive})` }, { transform: "none" }], {
				duration: duration * 0.6,
				delay: duration * 0.4,
				easing: settle,
				fill: "both",
			}),
			el.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: duration * 0.25,
				delay: duration * 0.4,
				fill: "both",
			}),
		);
	}
	animations.push(...arriving);
	if (layered && outStage && inStage) {
		// The key light glides from the old focal point to the new one.
		const outKey = outStage.querySelector<HTMLElement>(".me-key");
		const inKey = inStage.querySelector<HTMLElement>(".me-key");
		if (outKey && inKey) {
			const from = getComputedStyle(outKey).backgroundPosition;
			const to = getComputedStyle(inKey).backgroundPosition;
			animations.push(
				inKey.animate([{ backgroundPosition: from }, { backgroundPosition: to }], {
					duration,
					easing: settle,
				}),
			);
		}
		// The HUD readouts (scene label, timecode) switch when the new content arrives.
		const swap = { duration: 1, delay: duration * 0.4, fill: "both" as const };
		const outHud = outStage.querySelector(".me-hud");
		const inHud = inStage.querySelector(".me-hud");
		if (outHud) animations.push(outHud.animate([{ opacity: 1 }, { opacity: 0 }], swap));
		if (inHud) {
			const show = inHud.animate([{ opacity: 0 }, { opacity: 1 }], swap);
			animations.push(show);
			arriving.push(show);
		}
	}
	// Parallax: the grid plane leans in a little as the camera passes over it.
	const grid = layered ? inStage?.querySelector<HTMLElement>(".me-grid") : null;
	if (grid) {
		animations.push(
			grid.animate(
				[
					{ transform: "scale(1)" },
					{ transform: "scale(1.03)", offset: 0.45 },
					{ transform: "scale(1)" },
				],
				{ duration, easing: "ease-in-out" },
			),
		);
	}

	try {
		await Promise.all(animations.map((a) => a.finished));
	} finally {
		// The arriving layers end at rest; drop their animations so nothing lingers.
		for (const a of arriving) a.cancel();
		if (outStage) outStage.style.background = "";
		for (const layer of hiddenLayers) layer.style.opacity = "";
		outgoing.style.zIndex = "";
		incoming.style.zIndex = "";
	}
};

export default mePush;
```

Both set the slots' `z-index` for their duration and remove or restore everything they change. `me-push` moves only the `.me-world` layers of Motion Engineering stages and falls back to whole slots for anything else.

## Scene recipes

Each sample in `sample/` is a working, self-contained template. It imports only `videowright` and inlines the same small kit in every file, above the `// ── Scene` line: `buildStage`, `startAmbient`, `decode`, `tickTo`, `draw`, `riseIn`, `dottedLeader`, `flare`, `lockOn`, `release`, `boxOf`, `registerOn` (registration corners) and `panelIn`. Scene-only helpers (camera framing, typing, signal paths) live below that line. Copy the closest sample and change the content. All ten share one fictional product (Apogee 2.0, a build pipeline), so the set reads as one video.

- **title** — The hero title rises from frame 1 on the x = 160 line while the kicker decodes; registration corners lock onto it and the grid flares; a dimension line measures its real width (`1,481 PX`, 28px); the subtitle rises on the next cue.
- **section** — A 420px amber section numeral rises; a vertical rule divides it from a two-line title; a five-stop ruler draws along the bottom; the marker travels to the current stop and its segment fills amber. Say each fact once: the HUD reports what comes next, not the section number again.
- **kinetic** — Three hero lines land on three cues, word by word; the camera leans in on each, pivoting on the left margin; earlier lines step back; the last word is amber, a ruler measures it, and its reading follows the ruler's end.
- **bullet** — Heading plus up to three items on a cyan spine. Each item's node locks on, a leader draws, the title and note rise, and a dotted leader carries its result to a readout at the right edge. The newest item is the focal point.
- **stat** — The grid is the scale (1 cell = 1 s) and the axis is there from frame 1. Bars grow with readouts riding their tips; on the cue, one step at a time, a reticle locks onto the result, a dimension line measures the difference, its value ticks, then the headline ratio ticks in at hero size under the bars with its caption beside it.
- **feature** — One capability, shown working. The claim (kicker, three-line h1, body) sits on the left; on the right a `.me-panel` measures itself in and its diagram draws top-down: a task graph whose nodes are small panels and whose edges draw row by row. On the first cue registration corners lock onto the changed input, an amber leader callout names it, and the signal travels the dependent path one node at a time (edge draws, node outline turns amber, a braille spinner resolves to ✓); a second callout reports the result with a ticking value. On the second cue the untouched nodes resolve fast in quieter cyan. Amber stays on the subject's path throughout.
- **grid** — Three to six peers in a grid of panels whose edges sit on the grid's own lines (480 × 240 cells, 80px column and 40px row gutters). The heading rises on frame 1 while the frames draw in reading order and name their targets; on the first cue each cell measures itself (the value ticks, a cyan bar grows on a shared scale where 1 cell = 1 unit, the status decodes); on the second, one cell becomes the signal: corners lock on, its measurement turns amber, a tag decodes, and its peers recede to 50%.
- **ui-showcase** — A product window at legible scale (labels 22px, mono 28px, headings 72px), never shrunk to fit. It measures itself in and its data fills: chrome decodes, the header rises, waterfall bars grow in start order (cached work hatched cyan, executed work neutral), KPIs tick. On each cue the camera frames one region (see Region framing) and the crosshair pointer travels to the interaction and clicks: the critical bar turns amber and a popover rises; then the camera pans to the cache card and its meter and value tick in amber. The release rests the camera to identity.
- **content** — A code sample (or short paragraph) in a panel with a title bar and a line-number gutter, revealed line by line out of masks at `--stagger-tight`; restrained syntax tones (keywords and punctuation muted, keys fg, values fg-2). Its headline sits beside it. On each cue one line becomes the subject: an amber gutter mark and band, its value turns amber, a node locks at the line's end, an elbowed leader carries it across the panel edge, and a margin note (22px label, 36px body) rises at the end. The previous line, leader and note recede to cyan at ~50%.
- **cta** — The title's lockup returns at the title's exact position (a match with the title scene) and registration corners lock onto it. On the first cue the corners travel to an input-style panel (amber `❯` prompt, 56px mono, a `⏎ RETURN` key chip) and the one command types in on a seeded rhythm while the caret blinks on a `steps()` loop. On the second the key presses, `✓ READY` decodes and the closing line rises. The release lets the corners go; only the ambient layer (timecode, scan, caret) keeps moving: the calm final state.

## Reference files

- `reference/scenes.html` — a static sheet you can open in a browser (it links `../tokens.css`, so the fonts and textures load): the palette, the type scale, the HUD vocabulary, and the settled frame of each of the ten samples, each a real 1920 × 1080 stage scaled to fit.
- `reference/animations.jsx` — the motion vocabulary as small React components (`RiseLines`, `Decode`, `TickNumber`, `DrawStroke`, `CrosshairLock`, `RegistrationCorners`, `DimensionLine`, `LeaderCallout`, `Release`) and a `MotionVocabulary` board. Every value is a function of one clock and every duration reads the tokens. A reference for prototyping; segments use the samples' DOM kit.

## Don'ts

- Don't use amber for more than one thing at a time, or cyan as decoration.
- Don't fade things in without motion, and don't bounce, spring or overshoot.
- Don't tween numbers smoothly or let their width jitter.
- Don't put text below the legibility floor, or let HUD chrome touch content.
- Don't shrink a window, terminal or app to fit the frame: frame a region with the camera.
- Don't let ambient motion (drift, scan, readouts) out-move the focal point.
- Don't use `Math.random()`, SMIL, autoplaying video or animated GIFs.
- Don't add another sans face; Archivo's widths cover display, body and labels.
