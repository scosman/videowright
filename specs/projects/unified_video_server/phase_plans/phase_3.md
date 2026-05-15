---
status: complete
---

# Phase 3: Download Modal + Hide-HUD Tab + Kill Record

## Overview

This phase adds the download modal (accessible from both the homepage card icon and the video view top-bar icon), implements the hide-HUD tab UI affordance, and removes the `record` command and `recordMode` flag from the entire codebase.

## Steps

1. **Create `download_modal.ts`** in `packages/lib/src/cli/entry/components/`
   - Export `renderDownloadModal({ slug, title, onClose })`.
   - Two-column layout: "Export Video" (recommended, with CLI command + copy button) and "Screen Record" (instructions only).
   - Backdrop click, Escape key, and close button all dismiss.
   - Focus trap while open.
   - Append to `document.body` as a side-effect mount.

2. **Create `hide_hud_tab.ts`** in `packages/lib/src/cli/entry/components/`
   - Export `renderHideHudTab({ onToggle })`.
   - Small 28x8px tab anchored to the top edge of the HUD, horizontally centered.
   - Chevron icon indicates direction (down when HUD visible, up when hidden).
   - Clicking toggles HUD via the existing `toggleDevHud()` function.

3. **Wire download modal to homepage card download icon** in `views/homepage.ts`
   - Replace the empty `onDownload` callback with one that mounts the download modal.

4. **Wire download modal to video view top-bar download icon** in `views/video_view.ts`
   - Set `showDownload: true` on the top bar and provide an `onDownload` callback that mounts the download modal.

5. **Mount hide-HUD tab in video view** in `views/video_view.ts`
   - Add the hide-HUD tab element positioned at the top edge of the HUD container.

6. **Add CSS styles** for the download modal and hide-HUD tab in `styles/components.css`.

7. **Remove `recordMode` from `Player`** in `packages/lib/src/player/index.ts`
   - Remove `recordMode` from `PlayerOptions` interface.
   - Remove `recordMode` from the internal options object.
   - Remove `recordMode` from the HudState passed in `updateHud()`.

8. **Remove `recordMode` from HUD** in `packages/lib/src/player/hud.ts`
   - Remove `recordMode` from `HudState` interface.
   - Remove the early-return block at lines 250-254 that short-circuits rendering in record mode.

9. **Remove `recordMode` query param handling** in `views/video_view.ts`
   - Delete the `recordMode` query-param parsing and passing to Player.

10. **Delete `record.ts`** (`packages/lib/src/cli/record.ts`).

11. **Remove `record` CLI subcommand** from `packages/lib/src/cli/index.ts`
    - Remove the `record` command handler block.
    - Update help text to remove the `record` line and `--voiceover` for record.

12. **Remove `record` from argv parser** in `packages/lib/src/cli/argv.ts`
    - Remove `"record"` from `Command` type, `KNOWN_COMMANDS`, and `VOICEOVER_COMMANDS`.
    - Update the `--voiceover` error message.

13. **Remove record-related test file** `test/unit/cli_record_render.test.ts`
    - Delete the file entirely (tests for `record` command behavior).

14. **Remove record argv tests** from `test/unit/record_render_argv.test.ts`
    - Delete the entire "argv parser: record command" describe block.

15. **Delete the record-mode HUD test** from `test/integration/player.test.ts`
    - Remove the `record_mode_hud_shows_only_play_button` test.

16. **Update skill reference docs** that mention `recordMode`
    - `packages/lib/skill/references/dev_server.md` — remove the `?recordMode=1` line.
    - `packages/lib/skill/references/export.md` — remove/rewrite the `?recordMode=1` mention.

## Tests

- **download_modal: renders two columns** — verifies export and screen-record columns exist.
- **download_modal: copy button contains correct CLI command** — verifies `npx videowright render <slug>`.
- **download_modal: close via X button** — verifies modal is removed from DOM.
- **download_modal: close via Escape key** — verifies modal is removed on Escape.
- **download_modal: close via backdrop click** — verifies modal is removed on backdrop click.
- **homepage: download icon opens modal** — verifies clicking the card download icon creates the modal.
- **video_view: top bar shows download icon** — verifies download icon is present and wired.
- **hide_hud_tab: renders tab element** — verifies the tab is created with correct structure.
- **hide_hud_tab: click toggles chevron direction** — verifies chevron swaps on toggle.
