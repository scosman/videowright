---
status: complete
---

# Functional Spec: Dev Mode MPA Conversion

## Goal

Replace dev-mode client-side routing with real browser navigations. Every page transition is a full HTTP page load, so the browser handles all teardown — listeners, styles, audio elements, module caches.

## Non-Goals

- Changing the video player runtime, segment authoring API, or timeline format.
- Changing the production / export pipeline.
- Optimizing navigation latency. Page reloads are explicitly accepted.
- Persisting any client state across navigations (no `localStorage`, no `sessionStorage`).

## Pages

The dev server serves exactly two page types:

### Index page (`/`)

- Lists all available videos.
- Each video entry is a plain `<a href="/video/...">` anchor — clicking triggers a real page navigation.
- No client-side router. No `history.pushState`.

### Video page (`/video/<video_id>`)

- Renders one video player for the specified video.
- Top-left "back to index" link is a plain `<a href="/">`.
- All player interactions (play/pause, scrubbing, segment nav, HUD toggle, download modal) stay client-side within this page — no change.

### Unknown routes

- Unknown video ID → server returns a 404 page with a link back to `/`.
- Other unknown paths → 404 with link back to `/`.

## URL Scheme

- Index: `/`
- Video: `/video/<video_id>` — stable, bookmarkable, shareable.
- This is a *change* from the current scheme if it differs. No redirects from old URLs — dev mode only, no external links to break.

## Navigation Behavior

- All in-app links use plain anchor tags. No `event.preventDefault()` on link clicks for navigation.
- Browser back/forward buttons work natively (no custom popstate handlers).
- Page transitions cause a full reload. Any flash of unstyled content is acceptable for a dev tool.

## Cross-Page State

**None.** Every page load starts fresh. Specifically:

- HUD visibility resets to its default (visible) on every page load. Module-level `hudVisible` flag is removed; if any per-page state is needed within a single page load, that's fine, but nothing persists across navigations.
- No global state, no shared singletons, no caches survive a navigation.
- If a cross-page interaction is discovered during implementation (the user does not believe any exist beyond HUD), it must be either (a) eliminated or (b) explicitly called out for review — no silent state persistence.

## Dev Server Behavior

- Vite dev server configured for multi-page input.
- HMR continues to work for:
  - The video page (changes to a timeline, segment, or style hot-reload the currently-viewed video).
  - The index page (changes to the index template hot-reload the index).
- Vite's server-side middleware resolves `/video/<id>` to the video page template with the video ID available to the page.
- File watching for video assets continues to work (changes to a video's timeline/segments/styles trigger HMR on that video's page).

## Out of Scope

- Production builds.
- Any change to video authoring, player runtime, segment API, or export.
- Index page styling, download modal UX, dev frame styling — visual changes are not part of this conversion. Behaviorally they may need small adjustments (e.g., the download modal's `document` keydown listener is no longer leak-sensitive since the page goes away), but no UX redesign.

## Cleanup During Conversion

Code paths that exist *only* to support SPA-style cleanup should be removed once MPA is in place:

- The in-app router / history-pushState code in `entry_client.ts`.
- `player.destroy()`'s listener-removal code (browser teardown handles it). Player can keep `destroy()` as a no-op or for use in tests, but the lifecycle no longer requires it in dev.
- Any module-level cleanup contracts in dev-frame, HUD, download modal, and segments that exist to support in-app teardown.
- The `body.dataset.vwState` / `vwSegment` clearing logic if it exists only for SPA.

The audit should be conservative: if a cleanup exists for both SPA teardown *and* internal state transitions (e.g., switching segments within one video), keep it. Only remove cleanup that exists solely because in-app navigation needed it.
