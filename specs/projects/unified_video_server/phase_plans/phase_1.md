---
status: complete
---

# Phase 1: Project discovery + routing foundation

## Overview

Establish the multi-video server foundation. Add `findAllTimelines` and `discoverAllVideos` for project-wide video enumeration, create a Vite plugin virtual module (`virtual:videowright/project`) and SPA history fallback, rewrite `entry_client.ts` as a tiny router, add design-token CSS, and migrate the existing player to mount under `/[slug]/`. The `dev` command no longer takes a video arg. Unknown paths show a 404 page. No homepage UI beyond a placeholder.

## Steps

1. **Add `VideoSummary` and `ProjectInfo` types to `types.ts`.**

2. **Add `findAllTimelines(root)` to `discover.ts`** -- synchronous scan of `videos/*/timeline.ts`, returns absolute paths.

3. **Add `discoverAllVideos(root, viteServer?)` to `discover_project.ts`** -- for each timeline path, stat mtime, load via `ssrLoadModule` (if viteServer provided) or dynamic import, extract `meta.title` and `meta.style`, resolve style fallback, sort by mtime desc, return `ProjectInfo`.

4. **Extend `vite_helpers.ts`**:
   - Add `projectVirtualModulePlugin(projectInfo)` -- serves `virtual:videowright/project` as a JSON-exporting ES module.
   - Add `spaFallbackPlugin()` -- middleware that rewrites non-asset, non-Vite-internal GETs to `/` so index.html is served for all SPA routes. Excludes `/render.html`, `/@vite/`, `/@fs/`, `/@id/`, `/node_modules/`, `/__vite_*`, and paths with file extensions.
   - On timeline.ts change, re-run `discoverAllVideos` and invalidate the virtual module.

5. **Refactor `dev.ts` / `runDev()`** -- remove `positional` param, call `discoverAllVideos(root, server)` at boot, pass `ProjectInfo` to the new virtual module plugin, add SPA fallback plugin.

6. **Update `bin.ts` / `index.ts` (CLI)** -- stop passing positional to `runDev`. Update help text to remove the `[path]` from `dev`. For now keep `record` command working (Phase 3 removes it).

7. **Add `virtual.d.ts` declaration for `virtual:videowright/project`.**

8. **Create `entry/router.ts`** -- `parseRoute(pathname, slugs)`, `navigate(path)`, `onRouteChange(cb)`.

9. **Create `entry/views/not_found.ts`** -- `renderNotFound(attemptedPath)` returning an `HTMLElement`.

10. **Create `entry/views/video_view.ts`** -- `renderVideoView(projectInfo, slug)` that mounts the existing player/HUD/dev-frame logic into a container. Wraps the same boot sequence from the old `entry_client.ts`.

11. **Create `entry/views/homepage.ts`** -- placeholder: simple "Videos" heading + list of slugs as links. Full design comes in Phase 2.

12. **Create `entry/styles/tokens.css`** -- design tokens from `ui_design.md`.

13. **Create `entry/styles/base.css`** -- reset + typography + body background.

14. **Rewrite `entry_client.ts`** -- import `virtual:videowright/project`, parse route, mount the correct view, handle `popstate`.

15. **Simplify `index.html`** -- body becomes `<div id="app"></div>` + script tag. Player-related DOM moves into `video_view.ts`.

16. **Update `record.ts`** -- it currently calls `runDev` with a positional. Adjust to work with the new `runDev` signature (pass timeline path differently or keep a compatibility shim until Phase 3 deletes it).

## Tests

- **`findAllTimelines_empty_videos`**: returns empty array when `videos/` is empty or absent.
- **`findAllTimelines_single_video`**: returns one path.
- **`findAllTimelines_multiple_videos`**: returns all paths, ignores non-timeline dirs.
- **`findAllTimelines_ignores_files_not_dirs`**: files directly in `videos/` are skipped.
- **`parseRoute_home`**: `/` and empty → `{ kind: "home" }`.
- **`parseRoute_video`**: `/demo_video/` → `{ kind: "video", slug: "demo_video" }`.
- **`parseRoute_video_no_trailing_slash`**: `/demo_video` → same.
- **`parseRoute_unknown_slug`**: `/nonexistent/` → `{ kind: "not_found" }`.
- **`parseRoute_deep_path`**: `/a/b/c` → `{ kind: "not_found" }`.
- **`not_found_renders_attempted_path`**: DOM contains the bad path and a back link.
