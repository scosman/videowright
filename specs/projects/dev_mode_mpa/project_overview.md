---
status: complete
---

# Dev Mode: SPA → MPA Conversion

## What

Convert the dev-mode video preview server from a single-page app to a multi-page app. Every navigation between videos (and between the index page and a video) becomes a real browser navigation — a full page load — instead of in-app routing that swaps DOM in place.

## Why

The current SPA leaks state across video switches. Investigation found the root cause is architectural, not a single bug:

- Each video's `timeline.ts` imports its own CSS tokens (`--color-bg`, `--color-fg`, etc. on `:root`). Vite injects these as `<style>` tags into `<head>` with no teardown hook — both videos' styles accumulate and the last-parsed wins. This causes the background/scene color bleed.
- Segments use module-level state (`let host`). Vite caches modules, so the cleanup contract extends to every user-authored segment — unenforceable as the segment library grows.
- Multiple `document`/`window` listeners (player keydown, download modal keydown, dev-frame resize) and DOM appended outside `#app` (modal backdrop, HUD style tag) all required explicit teardown that was missed in places.

MPA gives correct teardown for free: the browser releases all listeners, styles, module caches, and audio elements on every page load. The cleanup contract disappears entirely, which matters because video authors will keep adding new styles and segments — every one of which would otherwise be a new potential leak.

## Scope

- Dev mode only. Production builds / exports are unaffected.
- Both the index/listing page and individual video pages.
- Vite config changes to support multi-page input.
- Remove SPA router / client-side navigation code.
- Audit and remove now-unnecessary teardown code (player keydown listener removal, generation counters, etc.) — let the browser handle it.

## Out of Scope

- Any change to the video player runtime, segment authoring API, or timeline format.
- Production/export pipeline.
- Performance optimizations beyond what MPA naturally provides.

## Constraints

- Dev-mode navigation will now incur a full page reload — acceptable trade for correctness.
- HMR / Vite dev server behavior for the video pages should keep working.
