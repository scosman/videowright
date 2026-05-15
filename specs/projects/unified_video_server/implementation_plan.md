---
status: complete
---

# Implementation Plan: Unified Video Server

Four phases. Each is a coherent, reviewable unit. Tests written alongside each phase.

## Phases

- [x] **Phase 1: Project discovery + routing foundation.** Server-side `findAllTimelines` and `discoverAllVideos`, Vite plugin virtual module + SPA history fallback, `entry_client.ts` rewrite as a tiny router, design-token CSS files. Migrate today's player to mount under `/[slug]/`. Update `bin.ts` so `dev` no longer takes a video arg. 404 page. No homepage UI yet beyond a placeholder. End state: server boots, navigating to `/[slug]/` shows the existing player; unknown paths show 404.

- [x] **Phase 2: Homepage + video card + cold-start.** Implement `top_bar.ts`, `video_card.ts`, `empty_state.ts`, `homepage.ts`. Full visual design from `ui_design.md`. Top bar with home link in video view. End state: navigating to `/` shows the polished homepage; cards link into video view; empty `videos/` shows cold-start panel.

- [ ] **Phase 3: Download modal + hide-HUD tab + kill record.** Implement `download_modal.ts` (with `copy_button.ts`), wire it to both surfaces (homepage card icon, video view top bar icon). Implement `hide_hud_tab.ts`. Remove `recordMode` everywhere (player, hud, entry_client, record.ts file, CLI subcommand, tests). End state: download modal works from both surfaces; hide-HUD tab works; `videowright record` command is gone; `git grep -i recordmode` is empty.

- [ ] **Phase 4: Render command updates + docs.** Implement `resolveSlugOrPath`, interactive numbered-list prompt with TTY check and retry, zero/one/many-video branching in `render.ts`. Update README CLI section (kill `record`, document new `render` behavior, document homepage). Update any internal docs (`INSTALL.md`, etc.) referencing the old CLI. End state: `videowright render` (no arg, multi-video) prompts; `videowright render <slug>` works; README reflects new CLI.

## Notes for the coding agent

- Each phase ends with all tests passing and `./checks.sh` clean.
- Phase 1 is the riskiest (Vite plugin + SPA fallback + ssrLoadModule). Validate manually in the browser before moving on.
- Phase 3's `recordMode` removal is mechanical but exhaustive — final-pass `git grep -i recordmode` is the gate.
- Visual polish (motion timing, hover states, focus rings) belongs in Phase 2. Don't defer it.
- Use the existing fixture project (`examples/videowright_demo/`) for manual checks; consider adding a multi-video fixture for tests.
