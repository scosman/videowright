---
status: complete
---

# Implementation Plan: Dev Mode MPA Conversion

## Phases

- [x] **Phase 1: Core MPA conversion.** Add `video.html`, split `entry_client.ts` into `entry_index.ts` + `entry_video.ts`, add `videoRouteMiddlewarePlugin`, switch `homepage.ts` / `top_bar.ts` / `video_card.ts` to anchor-based navigation, delete `router.ts` / `not_found.ts` / `spaFallbackPlugin` / `entry_client.ts`, update multi-page Vite config in `dev.ts`, update the integration test in `demo_dev_server.test.ts`, delete `router.test.ts` and `video_view_cleanup.test.ts`, add the `parseSlugFromPath` unit test. After this phase: the dev server runs in MPA mode end-to-end.
- [x] **Phase 2: SPA-cleanup pass.** Remove the now-dead SPA-only guards: `hudVisible` module state and `_resetHudVisible` in `dev_frame.ts`, the `resizeHandler` de-dup dance, the `hudKeyHandler` de-dup, the "idempotent `installHudKeyListener`" comment in `video_view.ts`, and any other code paths that exist solely because the SPA reused module scope across navigations. Light pass — no behavior changes beyond removing dead code.
