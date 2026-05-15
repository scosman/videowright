---
status: complete
---

# Phase 2: Homepage + video card + cold-start + top bar

## Overview

Replace the Phase 1 placeholder homepage with the full polished design from `ui_design.md`. Implement the top bar (shared across all pages), video card component, empty state panel, and components CSS. Replace the minimal back-link nav in video view with the polished top bar with breadcrumb. Add visual polish: motion timing, hover states, focus rings per the design tokens.

## Steps

1. **Create `entry/components/icons.ts`** -- inline SVG icon functions for download, copy, check, x, chevron-right, arrow-left. Each returns an SVG string. 16px, stroke-width 1.5, currentColor.

2. **Create `entry/components/top_bar.ts`** -- `renderTopBar({ projectName, breadcrumbTitle?, showDownload?, onDownload? })` returning an HTMLElement. 56px height, `--bg-surface` background, `--border-subtle` bottom border. Left: `videowright` wordmark (home link). Right: project name. When `breadcrumbTitle` is set, show `videowright / Title` breadcrumb. When `showDownload` is true, show download icon button on the right.

3. **Create `entry/components/video_card.ts`** -- `renderVideoCard({ slug, title, style, onOpen, onDownload })` returning an HTMLElement. Card with title, slug (mono), style badge, download icon button. Full card clickable (except download icon). Hover lift, border transition, focus styles.

4. **Create `entry/components/empty_state.ts`** -- `renderEmptyState()` returning an HTMLElement. Centered panel with "No videos yet" hero, instruction text, code block with `/videowright new video` and copy button, docs link.

5. **Create `entry/components/copy_button.ts`** -- `renderCopyButton(text: string)` returning an HTMLElement. Icon button that copies `text` to clipboard on click, swaps icon to check for 1.5s.

6. **Create `entry/styles/components.css`** -- all component styles: top bar, video card, empty state, copy button. Uses design tokens. Includes hover states, transitions, focus-visible, reduced-motion.

7. **Rewrite `entry/views/homepage.ts`** -- import and use `renderTopBar`, `renderVideoCard`, `renderEmptyState`. Full grid layout per ui_design.md. Section heading "Videos" with count subtitle. CSS Grid `repeat(auto-fill, minmax(280px, 1fr))`. Max 1200px content width.

8. **Update `entry/views/video_view.ts`** -- replace the minimal nav with `renderTopBar({ projectName, breadcrumbTitle: video.title, showDownload: false })`. (Download wiring comes in Phase 3.) Update grid template to use top bar.

9. **Update `entry/views/not_found.ts`** -- add top bar at the top (consistent with all pages).

10. **Update `entry/entry_client.ts`** -- import `components.css`.

11. **Update `entry/styles/base.css`** -- add mono font-family variable for reuse.

## Tests

- **`homepage_renders_video_cards`**: populated ProjectInfo renders cards with correct titles, slugs, and style badges.
- **`homepage_renders_empty_state`**: empty videos array shows "No videos yet" panel.
- **`homepage_card_count_subtitle`**: subtitle shows correct count (singular and plural).
- **`homepage_card_click_navigates`**: clicking a card calls onOpen/navigate.
- **`video_card_renders_title_slug_style`**: card DOM contains all expected text content.
- **`video_card_download_icon_stops_propagation`**: download icon click does not trigger card open.
- **`top_bar_renders_wordmark`**: top bar contains "videowright" text.
- **`top_bar_renders_breadcrumb`**: when breadcrumbTitle is set, shows "videowright / Title".
- **`top_bar_wordmark_links_home`**: wordmark click navigates to "/".
- **`empty_state_renders_hero_and_command`**: empty state contains "No videos yet" and "/videowright new video".
- **`copy_button_copies_to_clipboard`**: mock clipboard API, verify text is copied and icon swaps.
- **`not_found_has_top_bar`**: 404 page includes top bar.
- **`video_view_has_top_bar_with_breadcrumb`**: video view has top bar with video title in breadcrumb.
