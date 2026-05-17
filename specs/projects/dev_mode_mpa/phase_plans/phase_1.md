---
status: complete
---

# Phase 1: Core MPA Conversion

## Overview

Convert the dev server from a single-page application with client-side routing to a multi-page application where each page transition is a full browser navigation. This eliminates all SPA teardown complexity by relying on the browser's native page lifecycle.

## Steps

1. **Create `video.html`** at `packages/lib/src/cli/entry/video.html` — minimal HTML entry for the video page, same structure as `index.html` but with `<script src="./entry_video.ts">`.

2. **Create `entry_index.ts`** at `packages/lib/src/cli/entry/entry_index.ts` — thin entry that imports styles and calls `renderHomepage()` to mount the index page.

3. **Create `entry_video.ts`** at `packages/lib/src/cli/entry/entry_video.ts` — entry for the video page that parses the slug from `location.pathname`, looks it up in `projectInfo.videos`, and calls `renderVideoView()`. Includes the `parseSlugFromPath` utility exported for testing.

4. **Update `index.html`** — change the script src from `./entry_client.ts` to `./entry_index.ts`.

5. **Replace `spaFallbackPlugin` with `videoRouteMiddlewarePlugin`** in `vite_helpers.ts` — the new middleware rewrites `/video/<slug>` to `/video.html` for known slugs, serves 404 for unknown routes, and passes through Vite internals and assets.

6. **Update `dev.ts`** — replace `spaFallbackPlugin()` with `videoRouteMiddlewarePlugin(getKnownSlugs)`, add multi-page `rollupOptions.input`, and wire up slug getter from projectInfo.

7. **Update `homepage.ts`** — remove `navigate` import, change video card `onOpen` to use anchor-based navigation by removing it and making the card an `<a>` tag.

8. **Update `video_card.ts`** — change from `<article>` with click handlers to an `<a>` element with `href="/video/<slug>"`. Remove `onOpen` from props. Keep download button with `stopPropagation`.

9. **Update `top_bar.ts`** — remove `navigate` import, remove `click` event listener on the wordmark (let the native `<a href="/">` handle it).

10. **Update `video_view.ts`** — update signature to accept an `app` container parameter, remove SPA-cleanup comment about idempotent `installHudKeyListener`.

11. **Delete `entry_client.ts`** — replaced by the two new entry files.

12. **Delete `router.ts`** — no client-side router needed.

13. **Delete `not_found.ts`** — 404 is served by middleware now.

14. **Delete `router.test.ts`** — tests the deleted router.

15. **Delete `video_view_cleanup.test.ts`** — tests SPA cleanup scenarios impossible in MPA.

16. **Delete `not_found_view.test.ts`** — tests the deleted not_found view.

17. **Add `parseSlugFromPath` unit test** at `packages/lib/test/unit/parse_slug.test.ts`.

18. **Update `demo_dev_server.test.ts`** — rewrite integration tests to verify MPA middleware behavior (known slug 200, trailing slash 200, unknown slug 404, unknown path 404, render.html 200, Vite internals pass through).

19. **Update `homepage.test.ts`** — remove router mock, update assertions for anchor-based cards.

20. **Update `video_card.test.ts`** — test the new anchor-based card (check `href`, download stopPropagation).

21. **Update `top_bar.test.ts`** — remove router mock, verify wordmark is a plain `<a href="/">` without preventDefault.

## Tests

- `parse_slug.test.ts`: valid slug, invalid paths, encoded chars, trailing slash, null for root path
- `demo_dev_server.test.ts`: GET / -> 200, GET /video/demo_video -> 200, GET /video/demo_video/ -> 200, GET /video/nonexistent -> 404, GET /unknown -> 404, GET /render.html -> 200, GET /@vite/client -> 200
- `homepage.test.ts`: updated to verify anchor hrefs instead of navigate calls
- `video_card.test.ts`: verify `<a>` tag with correct href, download button still works
- `top_bar.test.ts`: verify wordmark is plain link without preventDefault
