# Animation Sync

## When this is loaded

A voiceover is being set as the default for a video, and you need to perform a one-time sync pass to adjust in-segment animations to align with audio beats.

## What this is

When a voiceover is set as the default (`default_voiceover` in `timeline.ts`), the agent performs a one-time manual pass over segment code to align fully automated animations with the voiceover's timing. This is a planning-time agent action, not a runtime mechanism.

## What to sync

Look for **fully automated animations** -- animations that run on a fixed clock inside a segment, not gated on user interaction (`waitForNext()`). Examples:

### Animations to consider

- **`ctx.hold(ms)` calls** -- if a hold duration no longer matches the voiceover timing, adjust it.
- **CSS transitions with explicit durations** -- `transition: transform 2s ease` where the duration should match an audio beat.
- **CSS animation durations** -- `animation: fadeIn 1.5s forwards`.
- **GSAP timelines** -- `.to(el, { duration: 2, ... })` where the duration should align with narration.
- **Lottie playback speed** -- if a Lottie animation's duration needs to match a segment beat.
- **Element appearance delays** -- `setTimeout` (should not exist per coding rules, but if found) or chained holds that stage element reveals.

### Animations to leave alone

- **Transition animations** between segments (handled by the transition system, not segment code).
- **Infinite/looping animations** that run as backgrounds (e.g., a subtle pulsing gradient).
- **User-gated animations** that only trigger on `waitForNext()` -- these are already controlled by the `Timing`.

## The sync procedure

### Step 1: Read the voiceover's Timing

Get the `perSegment` timing from the voiceover object. Each segment's advance times tell you when visual beats should land.

### Step 2: Walk each segment

For each segment in the timeline:

1. Read the segment's code (`segments/<id>/index.ts`).
2. Identify fully automated animations (see "What to sync" above).
3. Compare the animation's current duration/timing with the voiceover's advance schedule for that segment.

### Step 3: Adjust durations

Where an automated animation's duration should align with an audio beat, adjust it:

**Example: hold duration adjustment**

Before:
```ts
async play(ctx) {
  // Title animation
  el.classList.add('visible');
  await ctx.hold(3000);  // original: 3 seconds
}
// advances: [3.0]
```

After (voiceover timing says the intro narration ends at 4.2s):
```ts
async play(ctx) {
  // Title animation
  el.classList.add('visible');
  await ctx.hold(4200);  // adjusted to match voiceover timing
}
// advances are now driven by the Timing object, not this array
```

**Example: CSS animation adjustment**

Before:
```ts
mount(el) {
  el.innerHTML = `
    <style>
      .title { animation: slideIn 1.5s ease-out forwards; }
    </style>
    <h1 class="title">Hello</h1>
  `;
}
```

After (narration starts 0.5s in, so title should be visible by then):
```ts
mount(el) {
  el.innerHTML = `
    <style>
      .title { animation: slideIn 0.4s ease-out forwards; }
    </style>
    <h1 class="title">Hello</h1>
  `;
}
```

### Step 4: Add timing comments

When adjusting a duration to match voiceover timing, add a brief comment noting why:

```ts
await ctx.hold(4200);  // synced to voiceover: intro narration ends at 4.2s
```

This helps future editors understand the magic number.

## Tradeoffs

- **Sync is to the default voiceover only.** If the user later switches to a different voiceover via `--voiceover <other-slug>`, advance timing updates automatically (driven by the new voiceover's `Timing`), but in-segment animation durations remain tuned to the original default.
- **No runtime re-sync.** The sync is a one-time manual edit. There is no mechanism to dynamically adjust animation durations at playback time based on the active voiceover.
- **Re-sync is available.** If the user changes the default voiceover, they can ask the agent to re-run the animation sync pass. The agent reads the new `Timing` and adjusts durations again.

## When to skip animation sync

- The video has no fully automated animations (all timing is `waitForNext`-driven).
- The user explicitly says they do not want animation adjustments.
- The voiceover is not being set as the default (it is an alternate take that will be used via `--voiceover <slug>` only).

In these cases, set `default_voiceover` in `timeline.ts` without modifying segment code.

## Presenting changes to the user

After the sync pass, summarize the changes:

```
Animation sync for default voiceover "v1":

  intro:
    - ctx.hold(3000) -> ctx.hold(4200) -- match intro narration end
    - CSS .title animation: 1.5s -> 0.4s -- title visible before narration starts

  feature-cards:
    - No automated animations found (all waitForNext-driven)

  outro:
    - ctx.hold(2000) -> ctx.hold(3500) -- match outro narration end
```

Let the user review before committing the changes.
