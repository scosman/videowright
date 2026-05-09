# Testing

## When this is loaded

You were routed here from the intent dispatch table because the user wants to write tests for their Videowright project.

## What is worth testing

Videowright projects are content-heavy. Not everything needs automated tests. Focus testing effort on things that break silently and are hard to catch by eye.

The examples below are suggestions — pick what fits the project. Do not prescribe a rigid test suite. For context on the tools these tests exercise, see [dev_server.md](dev_server.md) (interactive preview) and [export.md](export.md) (record/render pipeline and advances validation).

## Advances coherence

The most common source of export failures is a mismatch between a segment's `advances` array and its actual `waitForNext()`/`hold()` calls.

**What to test:** For each segment, verify that `advances.length` matches the expected number of triggerNext presses.

```ts
import { expect, test } from 'vitest';

test('intro segment has correct advances count', async () => {
  const mod = await import('../segments/intro/index.js');
  const segment = mod.default;
  // intro: hold(3000) -> 1 press to move past
  expect(segment.advances).toHaveLength(1);
});

test('feature-list segment advances match beat count', async () => {
  const mod = await import('../segments/feature-list/index.js');
  const segment = mod.default;
  // 3 waitForNext calls + 1 final press = 4 advances
  expect(segment.advances).toHaveLength(4);
});
```

This catches the case where someone adds a `waitForNext()` call but forgets to add an entry to `advances` (or vice versa). The export pipeline validates this at runtime, but catching it in tests is faster.

## Typecheck

Run the TypeScript compiler as part of CI to catch type errors in segments, timelines, and config:

```bash
npx tsc --noEmit
```

This verifies that:

- All segment specs match the `SegmentSpec` type.
- Timeline entries reference valid types.
- Config uses correct field types.

Type errors in segments are common after refactoring shared components or updating the lib version.

## Playwright screenshot tests

For visual-heavy segments, capture a screenshot at key beats and compare against a baseline:

```ts
import { expect, test } from '@playwright/test';

test('intro segment renders correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/#/intro/0');
  // Wait for segment to mount and settle
  await page.waitForFunction('document.body.dataset.vwState === "playing"');
  await expect(page).toHaveScreenshot('intro-beat-0.png');
});

test('feature-cards shows all cards after advances', async ({ page }) => {
  await page.goto('http://localhost:5173/#/feature-cards/0');
  await page.waitForFunction('document.body.dataset.vwState === "playing"');
  // Advance twice to reveal cards, waiting for player to settle after each press
  await page.keyboard.press('Space');
  await page.waitForFunction('document.body.dataset.vwState === "playing"');
  await page.keyboard.press('Space');
  await page.waitForFunction('document.body.dataset.vwState === "playing"');
  await expect(page).toHaveScreenshot('feature-cards-revealed.png');
});
```

This requires a running dev server. In CI, start the dev server before tests:

```bash
npx videowright dev --port 5173 &
npx playwright test
```

Screenshot tests are heavyweight — use them selectively for segments where visual correctness is important (branded content, data visualizations, precise layouts).

## Timeline structure

Verify that a timeline references valid segments and has expected properties:

```ts
import { expect, test } from 'vitest';

test('demo timeline has expected segments', async () => {
  const mod = await import('../videos/demo/timeline.js');
  const timeline = mod.default;
  
  expect(timeline.meta.title).toBeTruthy();
  expect(timeline.segments.length).toBeGreaterThan(0);
  
  const ids = timeline.segments.map(s => s.id);
  expect(ids).toContain('intro');
  expect(ids).toContain('outro');
});
```

## What not to test

- **Visual aesthetics.** Whether a segment "looks good" is a design judgment, not a test assertion.
- **Voiceover text content.** VO copy changes frequently. Testing exact strings creates maintenance burden.
- **Transition behavior.** Built-in transitions are tested in the lib's own test suite. Custom transitions may warrant tests if they have complex logic.
- **The lib itself.** Videowright's internal tests cover the player, runner, CLI, and export pipeline. Consumer projects do not need to re-test lib behavior.
