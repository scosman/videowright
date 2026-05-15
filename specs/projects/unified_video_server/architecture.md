---
status: complete
---

# Architecture: Unified Video Server

## Scope Decision: Single-File

This architecture stays in one document — the project touches a handful of existing files plus ~10 small new client-side modules, none of which warrant their own design doc. No `components/` directory.

## Overview

Three layers change:

1. **CLI / server entry** (`packages/lib/src/cli/`) — `dev` no longer takes a video arg, `record` is removed, `render` gains slug resolution + interactive prompt.
2. **Vite plugin** (`packages/lib/src/cli/vite_helpers.ts`) — discovers all videos at boot and exposes them to the browser as a virtual module; configures SPA history fallback.
3. **Browser entry** (`packages/lib/src/cli/entry/`) — `entry_client.ts` becomes a tiny router that mounts a homepage, video view, or 404 page based on `location.pathname`. New vanilla-DOM modules implement each surface.

The existing **player** code (`packages/lib/src/player/`) is reused as-is from the video view, minus the `recordMode` flag which is deleted everywhere.

The existing **render** entry point (`render.html` / `render_entry.ts`) is untouched. It's Playwright-driven and lives outside the user-facing routing.

## Data Flow

```
   CLI                                Vite plugin                          Browser
   ───                                ───────────                          ───────
videowright dev ──> runDev() ──┐
                               │   discoverAllVideos()
                               │      scans videos/*/timeline.ts
                               │      eager-imports each via Vite
                               │      builds VideoSummary[]
                               │
                               └─> vite plugin exposes:
                                     virtual:videowright/project
                                       → { videos: VideoSummary[], projectName }
                                     SPA fallback: any path → index.html
                                                                                    │
                                                                                    ▼
                                                                          entry_client.ts
                                                                          ├─ parse pathname
                                                                          ├─ "/"      → homepage(videos)
                                                                          ├─ "/[s]/"  → video_view(s)
                                                                          └─ else     → not_found()
```

## Data Model

### `VideoSummary` (new)

Lives in `packages/lib/src/types.ts`. Sent from the Vite plugin to the browser via the virtual module.

```ts
export interface VideoSummary {
  /** Directory name under videos/ — also the URL slug. */
  slug: string;
  /** Absolute path to videos/<slug>/timeline.ts. */
  timelinePath: string;
  /** meta.title from the timeline. Falls back to slug if load failed. */
  title: string;
  /** Resolved style: meta.style ?? config.defaultStyle ?? "unknown". */
  style: string;
  /** mtime of timeline.ts (epoch ms). Used for sort order. */
  mtimeMs: number;
  /** True if loading the timeline threw — UI may want to flag this card. */
  loadError?: string;
}
```

### `ProjectInfo` (new)

```ts
export interface ProjectInfo {
  /** Basename of cwd. Shown in the top bar. */
  projectName: string;
  /** Videos sorted by mtime descending. */
  videos: VideoSummary[];
}
```

This is the entire payload exposed to the browser as a virtual module. No HTTP endpoint is added — the Vite plugin emits this as a JS module the bundle imports directly.

## Server-Side Changes

### `discover.ts`

Add:

```ts
/** Discover all videos under <root>/videos/. Returns absolute paths. */
export function findAllTimelines(root: string): string[];
```

Implementation: synchronous `fs.readdirSync(<root>/videos)`, filter to directories containing `timeline.ts`. Returns an array of absolute timeline.ts paths. No mtime sorting at this layer — caller sorts.

The existing `findTimeline()` (single-video, mtime-descending) stays for the `render` command's no-arg auto-pick when there's exactly one video.

### `discover_project.ts`

Add a sibling to the existing `discoverProject()`:

```ts
/**
 * Discover the project and load summaries for every video under videos/.
 * Used by `dev` (whole project) and `render` (when prompting / auto-picking).
 */
export async function discoverAllVideos(root: string): Promise<ProjectInfo>;
```

For each timeline path:
1. Stat the file → `mtimeMs`.
2. Import the timeline module (`await import(pathToFileURL(p).href)`). The module is cached by Node; reloading isn't needed for boot-time enumeration since the homepage refreshes on navigation.
3. Read `default.meta.title` and `default.meta.style`.
4. If import or property access throws, set `loadError`, fall back to slug for title and `"unknown"` for style.

Resolve `style` precedence: `meta.style ?? loadedConfig.defaultStyle ?? "unknown"`.

`projectName` = `path.basename(root)`.

Sort `videos` by `mtimeMs` descending.

### `dev.ts` — `runDev()` refactor

Today's signature accepts a target timeline. Change to:

```ts
export interface RunDevOptions {
  root: string;        // project root (cwd)
  port?: number;
  open?: boolean;      // open homepage URL after boot
}
export async function runDev(opts: RunDevOptions): Promise<{ url: string; close: () => Promise<void> }>;
```

It:
1. Calls `discoverAllVideos(root)` once at boot.
2. Boots Vite with the augmented plugin (`projectInfo` injected, SPA fallback enabled).
3. Returns the homepage URL `http://localhost:<port>/`.
4. Prints the URL.

The `?recordMode=1` URL appending is **removed** (it lived in `record.ts`, which is deleted).

### `record.ts` — deleted

File goes away. Remove its export from `index.ts` and its CLI registration from `bin.ts`. Update any tests that import it.

### `render.ts` — slug resolution + interactive prompt

Add to `discover.ts` (or a new `slug_resolver.ts` — judgment call during impl):

```ts
/**
 * Resolve a positional arg to a timeline path.
 * - First tries it as a slug (videos/<arg>/timeline.ts exists).
 * - Then tries it as a literal path.
 * - Returns null if neither resolves.
 */
export function resolveSlugOrPath(arg: string, root: string): string | null;
```

In `render.ts`:

```ts
const positional = args._[0];
let targetPath: string;

if (positional) {
  const resolved = resolveSlugOrPath(positional, root);
  if (!resolved) {
    console.error(`No video matching "${positional}" — not a slug under videos/, not a valid path.`);
    process.exit(1);
  }
  targetPath = resolved;
} else {
  const project = await discoverAllVideos(root);
  if (project.videos.length === 0) {
    console.error("No videos found. Ask your coding agent to create one (e.g., /videowright new video).");
    process.exit(1);
  } else if (project.videos.length === 1) {
    targetPath = project.videos[0].timelinePath;
  } else if (!process.stdin.isTTY) {
    console.error(
      `Multiple videos found. Specify one explicitly:\n${
        project.videos.map(v => `  npx videowright render ${v.slug}`).join("\n")
      }`
    );
    process.exit(1);
  } else {
    targetPath = await promptVideoSelection(project.videos);
  }
}
```

`promptVideoSelection()` uses Node's built-in `readline` (no new dep):
1. Print the numbered list.
2. `readline.question("Enter number [1-N]: ", ...)`.
3. Parse, validate (integer in `[1, N]`), retry on bad input up to 3 times then exit 1.

### Vite plugin (`vite_helpers.ts`) extensions

Today's plugin discovers segments. Add:

1. **Virtual module `virtual:videowright/project`**:
   ```ts
   resolveId(id) { if (id === "virtual:videowright/project") return "\0" + id; }
   load(id) {
     if (id === "\0virtual:videowright/project") {
       return `export default ${JSON.stringify(projectInfo)};`;
     }
   }
   ```
   `projectInfo` is captured by the plugin factory from `runDev()`.

2. **SPA history fallback**: the plugin's `configureServer(server)` hook adds middleware that, for any GET request to a path that doesn't match a Vite asset and doesn't have a file extension, rewrites the request URL to `/` (so Vite serves `index.html`).

   This is the standard SPA fallback. Excludes:
   - Requests with an extension (`.js`, `.css`, `.svg`, etc.).
   - Requests starting with `/@vite/`, `/@fs/`, `/@id/`, `/node_modules/` (Vite internals).
   - Requests for `/render.html` (the Playwright render entry).
   - Requests for HMR endpoints (`/__vite_*`).

3. **Project info reload on dev**: when a `timeline.ts` changes, the plugin re-runs `discoverAllVideos()` and triggers an HMR full-reload. This handles "user edited a meta.title" so the next page load shows the new title. Cheap because Vite already knows when files in `videos/**/timeline.ts` change.

### Player — remove `recordMode`

Touch:
- `packages/lib/src/player/index.ts` lines 24, 48, 83, 937 — remove `recordMode` from `PlayerOptions`, stop passing it to `HudState`.
- `packages/lib/src/player/hud.ts` lines 16, 250-253 — remove the recordMode early-return and the `recordMode` field on `HudState`.
- `packages/lib/src/cli/entry/entry_client.ts` lines 122, 159 — remove query-param parsing for `recordMode`.

The `?hideHud=1` query param **stays** — it's used by `render_entry.ts` for the headless render and isn't a user-facing surface.

## Browser-Side Changes

### File layout (new files in `packages/lib/src/cli/entry/`)

```
entry/
├── index.html              # existing — minor edits
├── render.html             # existing — untouched
├── entry_client.ts         # existing — rewritten as router
├── render_entry.ts         # existing — untouched
├── router.ts               # NEW — pathname parsing + history API helpers
├── views/
│   ├── homepage.ts         # NEW
│   ├── video_view.ts       # NEW — wraps the player
│   ├── not_found.ts        # NEW
├── components/
│   ├── top_bar.ts          # NEW
│   ├── video_card.ts       # NEW
│   ├── empty_state.ts      # NEW
│   ├── download_modal.ts   # NEW
│   ├── copy_button.ts      # NEW
│   ├── hide_hud_tab.ts     # NEW
└── styles/
    ├── tokens.css          # NEW — design tokens
    ├── base.css            # NEW — reset, typography, body
    ├── components.css      # NEW — all component styles
    └── player.css          # existing player styles (may be touched lightly)
```

All new files are vanilla TypeScript exporting functions that take params and return `HTMLElement` (or strings for trivial cases). No React, no virtual DOM. Event handlers attached directly.

### Router (`router.ts`)

```ts
type Route =
  | { kind: "home" }
  | { kind: "video"; slug: string }
  | { kind: "not_found"; attemptedPath: string };

export function parseRoute(pathname: string): Route;
export function navigate(path: string): void;     // pushState + dispatch
export function onRouteChange(cb: (r: Route) => void): () => void;
```

`parseRoute()` rules:
- `/` or empty → `{ kind: "home" }`.
- `/<slug>` or `/<slug>/` → `{ kind: "video", slug: <slug> }` if `slug` matches a known video (looked up against `projectInfo.videos`), else `{ kind: "not_found", attemptedPath: pathname }`.
- Anything else → `{ kind: "not_found", attemptedPath: pathname }`.

`navigate()` does `history.pushState({}, "", path)` then re-renders.

`popstate` event listener re-renders on browser back/forward.

### `entry_client.ts` — new shape

```ts
import projectInfo from "virtual:videowright/project";
import { parseRoute, onRouteChange } from "./router";
import { renderHomepage } from "./views/homepage";
import { renderVideoView } from "./views/video_view";
import { renderNotFound } from "./views/not_found";

const app = document.getElementById("app")!;

function render() {
  const route = parseRoute(location.pathname);
  app.innerHTML = "";
  switch (route.kind) {
    case "home": app.appendChild(renderHomepage(projectInfo)); break;
    case "video": app.appendChild(renderVideoView(projectInfo, route.slug)); break;
    case "not_found": app.appendChild(renderNotFound(route.attemptedPath, projectInfo)); break;
  }
}

window.addEventListener("popstate", render);
onRouteChange(render);
render();
```

### `index.html` — minor edits

Body becomes just:

```html
<body>
  <div id="app"></div>
  <script type="module" src="./entry_client.ts"></script>
</body>
```

The existing player-related root elements move into the `video_view.ts` template.

### View modules

Each view module exports `renderXxx(...) => HTMLElement`. They're stateless w.r.t. each other — when the route changes, the previous DOM is destroyed (`app.innerHTML = ""`) and the new view mounts fresh.

**`renderHomepage(projectInfo)`:**
- Empty videos → returns the empty-state panel.
- Non-empty → top bar + grid of `renderVideoCard()` for each video.
- Wires download icon click → mount `renderDownloadModal()` into `document.body`.

**`renderVideoView(projectInfo, slug)`:**
- Look up `VideoSummary` by slug (already validated by router but defensive check).
- Top bar with breadcrumb + download icon.
- Mount the existing player into a player container — calls the existing player's mount function with the resolved `timelinePath`. The player code is reused unchanged from today's dev server.
- Mount the HUD as today.
- Mount the hide-HUD tab.
- Wires download icon click → modal.

**`renderNotFound(path, projectInfo)`:**
- 404 panel with the attempted path and a `← Back to videos` link that calls `navigate("/")`.

**`renderDownloadModal({ slug, title })`:**
- Creates a backdrop + modal DOM and appends to `document.body`.
- Wires Escape, backdrop-click, and close-button to dismiss (remove from DOM).
- Returns nothing (side-effect mount).

### Hot-reload behavior

Vite HMR is preserved for segment/timeline files (existing behavior). For changes to client UI files (`homepage.ts`, etc.), Vite does a full reload (no HMR boundaries — these aren't React components, so full reload is the correct behavior and matches today).

## Public Interfaces (summary)

| Function | File | Purpose |
|---|---|---|
| `findAllTimelines(root)` | `discover.ts` | Enumerate video timeline paths |
| `discoverAllVideos(root)` | `discover_project.ts` | Load full `ProjectInfo` |
| `resolveSlugOrPath(arg, root)` | `discover.ts` or `slug_resolver.ts` | Render-CLI arg resolution |
| `runDev({ root, port, open })` | `dev.ts` | Boot unified server |
| `parseRoute(pathname)` | `entry/router.ts` | Pathname → route |
| `renderHomepage(projectInfo)` | `entry/views/homepage.ts` | Homepage DOM |
| `renderVideoView(projectInfo, slug)` | `entry/views/video_view.ts` | Video view DOM |
| `renderNotFound(path, projectInfo)` | `entry/views/not_found.ts` | 404 DOM |
| `renderDownloadModal({ slug, title })` | `entry/components/download_modal.ts` | Open modal |

## Design Patterns

- **Virtual modules over HTTP endpoints.** Project info is baked in as a JS module so the homepage renders synchronously, no fetch waterfall. Acceptable for a dev-time server where boot is cheap and the user is on localhost.
- **Vanilla DOM components return `HTMLElement`.** Consistent with the existing `hud.ts` style. No framework introduction.
- **Single mount point + full re-render on route change.** Simpler than a diffing strategy. Works fine for ≤ ~100 videos; if homepage ever lists thousands, revisit (it won't).
- **History API SPA, not multi-page Vite.** Vite multi-page mode requires a static set of HTML files; per-video URLs are dynamic, so SPA with server-side history fallback is the right tool.

## Technical Challenges

### Eager metadata loading at boot

Loading N `timeline.ts` files at boot via dynamic import does some work. For a typical project (1–10 videos), negligible. Concerns:

- **Cyclic import**: timeline.ts files may import segments. The Vite plugin runs in the Vite server process; doing a Node `import()` of `timeline.ts` from outside Vite's resolution graph may fail if the timeline uses Vite-specific imports (CSS, virtual modules).
- **Mitigation**: load timelines through Vite's `ssrLoadModule` API rather than raw Node import. Vite already resolves the segment plugin and other server-side transforms when called this way. `runDev()` already has a Vite server handle — pass it to `discoverAllVideos()`.
- **Fallback**: if a timeline fails to ssrLoad, treat it as `loadError` and fall back to slug/style defaults. The video still appears on the homepage, marked as broken. The user discovers the error when they click into it.

### SPA history fallback ordering

The Vite middleware that catches "no extension, not a Vite internal" must run *after* Vite's static-asset middleware but *before* the default 404 handler. Use Vite's `configureServer({ server })` with `server.middlewares.use(...)` and place it after Vite's internal middlewares (which `configureServer`'s default ordering achieves).

Confirm during implementation by testing direct browser navigation to `/some_slug/` returns `index.html`.

### Slug collisions with reserved paths

A video named `render.html` or `__vite` would be problematic. The Vite plugin's fallback explicitly excludes Vite-internal prefixes and `render.html`. If a user has a `videos/render/` directory, they'd get `/render/` — different from `/render.html`, no collision. But `videos/render.html/` (a directory literally named `render.html`) would conflict. Decision: don't enumerate this in code. If a user pulls that off, they'll see the render entry instead of their video. Document the constraint informally; don't add slug validation logic for it.

### `recordMode` removal cleanup

Removal must be exhaustive — any test, type, or doc referencing `recordMode` is stale after this project. Use `git grep -i recordmode` as a final-pass check before marking complete.

## Error Handling Strategy

| Error | Surface | Behavior |
|---|---|---|
| `timeline.ts` fails to ssrLoad at boot | Homepage card | Card renders with slug as title, "unknown" style. Clicking it loads the video view, which shows the existing error overlay (the player has its own boot-error handling). |
| Browser navigates to unknown slug | Video view | Router routes to `not_found`. Shows 404 page. |
| `render` CLI gets unresolvable arg | CLI | Exit 1 with clear error message naming the arg. |
| `render` CLI prompted on non-TTY with >1 video | CLI | Exit 1 with the list of `videowright render <slug>` commands. |
| Modal copy-to-clipboard fails (no clipboard API) | Modal | Icon doesn't swap to check. Toast not added. Acceptable on a dev tool. |
| User edits a `timeline.ts` while homepage is open | Browser | Vite triggers full reload. Homepage re-renders with updated metadata. |

No global error reporting service. Console.warn is sufficient for the dev-server context.

## Testing Strategy

### Unit (Vitest, existing setup)

- **`findAllTimelines`**: empty `videos/`, single video, multiple videos, non-video files ignored, nested directories ignored beyond depth 1.
- **`resolveSlugOrPath`**: slug-only, path-only, ambiguous (slug wins), neither, slug with special chars.
- **`discoverAllVideos`**: meta loads correctly, partial failure path (one broken timeline still returns the rest), style fallback chain.
- **`parseRoute`**: home, video with/without trailing slash, unknown path, unknown slug. (Note: slug validity needs `projectInfo` — pass via closure or argument.)
- **`promptVideoSelection`**: numbered list rendering, valid input, invalid input retry, max retries → exit, non-TTY guard.

### Integration (Vitest with happy-dom or jsdom for DOM tests)

- **Homepage rendering**: empty state, populated grid, sort order, card click navigation, download icon opens modal.
- **Video view rendering**: top bar with breadcrumb, hide-HUD tab toggle.
- **Modal**: open, close via Escape / backdrop / X button, copy-to-clipboard icon swap (mock clipboard API).
- **404**: bad path shows panel, back link calls navigate.

### E2E (Playwright, existing setup)

- **Full project nav**: boot dev server with a fixture project containing 3 videos, navigate `/` → click card → `/[slug]/` → back → `/`. Verify URL and content at each step.
- **Render flow** (existing tests): keep all current `render` e2e tests; add one for the interactive prompt path (drive stdin) and one for slug-arg resolution.

### Removed tests

- `player.test.ts:810-830` (the record-mode HUD assertion) — delete, since record mode is gone.
- Any test asserting `?recordMode=1` URL form — delete.

## Dependencies

No new runtime dependencies. Uses:
- Existing Vite for bundling + dev server.
- Existing Node `readline` (built-in) for the render prompt.
- Existing Lucide icons — already pulled in if present; otherwise add a single small icon-svg helper (Lucide icons are MIT, can paste a handful of SVGs directly into the codebase rather than depend on a package).

If Lucide isn't already a dep, paste the needed SVGs (download, copy, check, x, chevron-right) into a `components/icons.ts` file. No new npm dep.

## Out of Scope (Architecture)

- A general-purpose router. The 3-route router is simple enough to hand-roll.
- A state-management layer. Each view is stateless and re-mounted on nav.
- WebSocket/SSE live updates for the homepage. Full page reload via Vite HMR is sufficient.
- Service worker, PWA, offline support.
- Auth or multi-user concerns. Dev tool on localhost.
