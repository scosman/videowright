---
status: complete
---

# Architecture: Dev Mode MPA Conversion

## Overview

Split the current single-entry Vite dev setup into a multi-page Vite setup with two HTML entries:

- `index.html` → loads `entry_index.ts` → renders the video list
- `video.html` → loads `entry_video.ts` → renders one video, slug parsed from URL

A small Vite middleware maps `/video/<slug>` to `video.html` and 404s unknown slugs. `render.html` (Playwright export) is unchanged.

The client-side router (`router.ts`), the SPA fallback plugin, and `not_found.ts` are deleted. All in-app links become plain `<a href>` anchors.

## File Layout

### New files

- `packages/lib/src/cli/entry/video.html` — Vite entry for the video page. Loads `entry_video.ts`. Minimal `<body><div id="app"></div></body>`, same chrome as `index.html`.
- `packages/lib/src/cli/entry/entry_index.ts` — entry for the index page.
- `packages/lib/src/cli/entry/entry_video.ts` — entry for the video page.

### Modified files

- `packages/lib/src/cli/entry/index.html` — keep, but `<script>` swaps from `entry_client.ts` to `entry_index.ts`.
- `packages/lib/src/cli/dev.ts` — Vite config gets multi-page `rollupOptions.input` and the new middleware plugin replaces `spaFallbackPlugin`.
- `packages/lib/src/cli/vite_helpers.ts` — remove `spaFallbackPlugin`. Add `videoRouteMiddlewarePlugin` (see below).
- `packages/lib/src/cli/entry/views/homepage.ts` — video cards rendered as `<a href="/video/<slug>">` (no `onOpen` prop, no `navigate` import).
- `packages/lib/src/cli/entry/components/top_bar.ts` — back link rendered as `<a href="/">`. Drop `navigate` import.
- `packages/lib/src/cli/entry/components/video_card.ts` — card root is `<a href>`; remove click/keydown navigate handlers (anchor handles both natively).
- `packages/lib/src/cli/entry/views/video_view.ts` — keep most logic; just reachable from `entry_video.ts` directly, no router. Drop SPA-cleanup comments/code (see "Cleanup" below).

### Deleted files

- `packages/lib/src/cli/entry/entry_client.ts` — replaced by `entry_index.ts` and `entry_video.ts`.
- `packages/lib/src/cli/entry/router.ts` — no router.
- `packages/lib/src/cli/entry/views/not_found.ts` — 404 served by middleware (minimal HTML response).
- `packages/lib/test/unit/router.test.ts` — router gone.
- `packages/lib/test/unit/video_view_cleanup.test.ts` — listener-leak scenario impossible in MPA.

## Vite Multi-Page Config

In `dev.ts`, replace the implicit single-page config with explicit multi-page input. For dev mode this is mostly cosmetic (Vite serves any HTML under root), but it's needed for production builds and for clarity. In dev, the middleware below is what actually drives routing.

```ts
// in dev.ts createServer call
rollupOptions: {
  input: {
    index: path.join(entryDir, "index.html"),
    video: path.join(entryDir, "video.html"),
    render: path.join(entryDir, "render.html"),
  },
},
```

## Routing Middleware

Replace `spaFallbackPlugin` with `videoRouteMiddlewarePlugin(getKnownSlugs)`. Signature:

```ts
function videoRouteMiddlewarePlugin(getKnownSlugs: () => string[]): Plugin
```

The factory takes a getter so the middleware can re-read the slug list every request (videos can be added/removed during the dev session — `discover_project.ts` already re-runs on file changes).

Behavior, applied via `configureServer` → `server.middlewares.use(...)`:

1. **Exact `/`** → call `next()`; Vite serves `index.html`.
2. **`/index.html`, `/video.html`, `/render.html`** → call `next()`; Vite serves them directly.
3. **`/video/<slug>` or `/video/<slug>/`**:
   - If `<slug>` is in `getKnownSlugs()`: rewrite `req.url = "/video.html"` and `next()`. Vite serves `video.html`. The original URL is preserved in the address bar (only `req.url` is rewritten for Vite's internal resolution).
   - Otherwise: 404 response (see "404 response" below).
4. **Any path starting with Vite internals (`/@vite/`, `/@fs/`, `/@id/`, `/node_modules/`), or with a file extension other than `.html`** → call `next()`. Vite handles assets, virtual modules, and HMR.
5. **Anything else** (unknown path) → 404 response.

### 404 response

Inline minimal HTML; no separate file. Response:

```
HTTP/1.1 404 Not Found
Content-Type: text/html

<!doctype html><html><head><title>Not found</title></head>
<body><h1>Not found</h1><p><a href="/">Back to videos</a></p></body></html>
```

This is intentional: a dev-only 404 has no design requirement. Keeping it server-side avoids re-introducing a client view that depends on routing.

### Why `req.url` rewrite (not redirect)

We rewrite `req.url` inside the middleware so the browser address bar still shows `/video/<slug>`. A 301/302 redirect to `/video.html` would change the URL and break deep-linking.

## Slug Extraction (client-side)

`entry_video.ts` parses `location.pathname` to get the slug:

```ts
function parseSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/video\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
```

If parse returns null or the slug isn't in `projectInfo.videos`, the page renders a brief error and a link back to `/`. This is a defense-in-depth guard — the middleware should have already 404'd, so it's effectively dead code in practice. Justified because client code cannot assume server contract; if the middleware is bypassed (e.g., direct hit to `/video.html`), failing gracefully is better than a JS crash.

## Index Page (entry_index.ts)

Thin wrapper that calls the existing `renderHomepage()` (or its successor). Since `homepage.ts` currently uses `onOpen` callbacks to call `navigate`, we change the card rendering to use anchor tags directly. The `onOpen` prop on `VideoCardProps` is removed.

`video_card.ts` becomes:

```ts
// pseudocode
const root = document.createElement("a");
root.href = `/video/${video.slug}`;
root.className = "video-card";
// ...no click/keydown handlers; <a> handles Enter/Space and mouse natively
```

## Video Page (entry_video.ts)

```ts
import "./styles/...";  // existing global styles
import { renderVideoView } from "./views/video_view";
import projectInfo from "virtual:videowright/project";

const slug = parseSlugFromPath(location.pathname);
const video = slug && projectInfo.videos.find(v => v.slug === slug);
const app = document.getElementById("app")!;
if (!video) {
  app.innerHTML = `<p>Unknown video. <a href="/">Back</a></p>`;
} else {
  renderVideoView(projectInfo, video.slug, app);
}
```

`renderVideoView` keeps its current signature; the call no longer comes from a router callback.

## Cleanup of SPA-Only Code

Remove the following because MPA reloads obviate them:

- `dev_frame.ts`: module-level `hudVisible` state and `_resetHudVisible()` (browser reload resets it). The `hudKeyHandler` de-dup logic (registering once per page is enough — no repeat-registration risk).
- `dev_frame.ts`: `resizeHandler` removal-before-re-register dance. Page reload nukes the old listener.
- `video_view.ts`: comment + code paths describing "idempotent" `installHudKeyListener` calls.
- `Player.destroy()`: keep the method (still useful for tests and explicit shutdown), but remove any code that exists *only* because SPA `app.innerHTML = ""` orphaned players. The `activePlayer` tracking added recently (if it landed) is gone with `entry_client.ts`.

Do **not** remove:

- `Player.destroy()` itself — it's still useful.
- The full-reload Vite plugin (`fullReloadPlugin`) — file watching still needs to trigger reloads.
- Virtual modules (`virtual:videowright/project`, `virtual:vw-segments`) — used by both pages.

## Test Strategy

### Unit tests

- New: `entry/parse_slug.test.ts` (or co-located) — tests `parseSlugFromPath` with valid, invalid, encoded, trailing-slash variants.
- Delete: `router.test.ts`, `video_view_cleanup.test.ts`.

### Integration tests

Update `test/integration/demo_dev_server.test.ts` to verify the new middleware:

- `GET /` → 200, HTML mentions video list.
- `GET /video/<known_slug>` → 200, HTML is the video page (check for `video.html` marker, e.g., the script tag).
- `GET /video/<known_slug>/` → 200 (trailing slash variant).
- `GET /video/does-not-exist` → 404 with "Not found" body.
- `GET /unknown-top-level` → 404.
- `GET /render.html` → 200 (Playwright export entry still served).
- `GET /@vite/client` → 200 (internals pass through).

No new e2e tests. Existing Playwright tests should keep working since they hit `render.html`.

## Error Handling

- Server: middleware catches unknown routes and returns 404. No try/catch needed inside the middleware — it's a synchronous URL check.
- Client (video page): if `projectInfo.videos` doesn't contain the slug (should never happen in practice), render a minimal error fragment. No exceptions thrown.

## Browser History / Navigation

- All in-app links are `<a href>`. Browser back/forward buttons work natively. No `popstate` handlers.
- No `event.preventDefault()` on any link click.
- Bookmarking a video URL works because the server resolves it on every load.

## HMR

No change to HMR architecture. `fullReloadPlugin` continues to issue full reloads on any source change. Vite multi-page HMR works out of the box — when a file imported by `video.html` changes, only the video page reloads; when a file imported by `index.html` changes, only the index reloads. The current `fullReloadPlugin` forces full reloads regardless, which is the existing behavior we preserve.

## Open Questions

None at this point. All technical decisions are made above.
