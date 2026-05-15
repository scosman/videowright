---
status: complete
---

# Functional Spec: Unified Video Server

Replaces the current dev/record/render CLI UX with a single multi-video server, a homepage, deterministic per-video URLs, and a render command that no longer silently picks the most recent video.

## Goals

1. A user with multiple videos in one project can switch between them without restarting the server or memorizing URLs.
2. There is one player view per video — no separate "record" surface. Screen recording works against the live dev view directly.
3. `videowright render` never picks a video for the user when ambiguity exists.

## Features

### 1. Homepage (`/`)

Lists every video discovered under `videos/*/timeline.ts`.

**Per-video card:**

- Directory name (the slug)
- `meta.title` from `timeline.ts`
- `meta.style` (or, if unset, the config-level `defaultStyle`)

Cards show only structured data that already exists on `TimelineMeta`. No thumbnails, no duration, no voiceover indicator — keep it minimal.

**Sort order:** most recently modified first (mtime of `timeline.ts`). This matches today's auto-pick behavior so the "default" video stays on top.

**Per-card actions:**

- **Open** (primary, the whole card is clickable) — navigates to `/[slug]/`.
- **Download** — opens the Download modal (see below). Single standard download icon, separate from the card click target.

**Cold-start state (zero videos):**

When `videos/` is empty or absent, the homepage shows an empty-state panel instead of a video list, explaining how to create a video via the user's coding agent. The exact wording is a UI-design decision; the functional requirement is that the user knows what to type next (e.g., `/videowright new video` or equivalent guidance) without leaving the browser.

### 2. Video View (`/[slug]/`)

Single per-video view. Replaces today's dev *and* record views (record is killed entirely — see below).

Includes:

- The player (existing behavior, hot-reload preserved).
- The HUD (existing controls — play/pause, segment info, keyboard shortcuts, error overlay).
- A **Download icon** in the HUD that opens the Download modal for the current video.
- A way to return to the homepage. Exact affordance is a UI-design decision (logo link, back button, etc.).
- A **Hide HUD / Show HUD** toggle in the UI — a small "tab" affordance that:
  - When the HUD is shown: lets the user collapse it.
  - When the HUD is collapsed: remains visible as a small tab sticking up from where the HUD was, so the user can re-show it.
  - The existing `H` keyboard shortcut continues to toggle this state.
  - This is *not* load-bearing for screen recording — users can screen-capture a partial window that excludes the HUD strip. The tab is a convenience for users who want to record the whole browser window without HUD clutter.

### 3. Download Modal

Triggered from the homepage card's download icon and from the video view's download icon. Same modal in both places.

Shows two side-by-side options for the current video:

- **Export Video (recommended)** — "Download a pixel-perfect MP4 without screen recording. Best quality."
  - Shows the exact CLI command for this video: `npx videowright render <slug>`
  - Copy-to-clipboard affordance.
  - Short explainer: export is CLI-only because deterministic frame-by-frame export needs ffmpeg and Playwright on the user's machine.

- **Screen Record** — "Use screen recording software to capture this video in a live browser. Great for recording a live voiceover with manual pacing."
  - This is *instructions only*, no button or navigation. Tells the user: open your screen recorder, hide the HUD (via the tab affordance or `H` key), and advance manually with arrow keys / spacebar / play button.
  - The user is already in the video view when they open this modal (or one click away from it via the homepage), so no separate destination is needed.

## CLI Changes

### `videowright dev` — new behavior

- Boots the server once for the whole project.
- No longer requires or accepts a video argument.
- After boot, prints the homepage URL: `http://localhost:5173/`.
- Port behavior unchanged (5173 default, configurable).

### `videowright record` — removed

The `record` subcommand is removed from the CLI entirely. v1 hasn't shipped, so no deprecation period or alias is needed.

Rationale: investigation showed `?recordMode=1` was a purely cosmetic flag — it only changed the HUD to a minimal play/pause-only state, with zero playback, keyboard, advance, or voiceover differences. The "minimal HUD for clean recording" need is now served by the in-UI hide-HUD tab in the video view.

### `videowright render` — prompt when ambiguous

- **One video in project, no arg:** renders that video. (No prompt needed when there's no choice to make.)
- **Multiple videos, no arg:** prints a numbered list and reads a number from stdin. Example:

  ```
  Pick a video to render:
    1. demo_video — "Demo Title" — motion-engineering
    2. landing_page_explainer — "How It Works" — minimal
    3. onboarding_flow — "Welcome" — motion-engineering

  Enter number [1-3]:
  ```

  User types `2`, render begins. List order matches homepage sort (mtime descending).

- **Zero videos in project, no arg:** errors with a message pointing the user to create a video in their coding agent.
- **Non-interactive stdin (CI, piped):** if stdin is not a TTY and no slug/path is passed in a multi-video project, exit with a non-zero status and print a helpful error rather than hang or guess.
- **Explicit arg form accepts both slug and path:**
  - `videowright render demo_video` — slug (resolves to `videos/demo_video/timeline.ts`).
  - `videowright render videos/demo_video/timeline.ts` — explicit path (today's form, still works).
  - Disambiguation rule: if the arg matches an existing slug AND an existing path, treat as slug. If it matches neither, error.

All other `render` flags (`--voiceover`, resolution overrides, etc.) unchanged.

## URL & Routing Contract

| Path | Behavior |
|---|---|
| `/` | Homepage. Lists videos, or shows cold-start panel. |
| `/[slug]/` | Video view for `videos/[slug]/timeline.ts`. |
| `/[invalid-slug]/` | 404 page with a link back to the homepage. |
| any other path | 404 with link back to homepage. |

No user-facing query-param surface (`?recordMode=1` is gone, `?hideHud=1` may persist internally if the render entry point still uses it — architecture-level call).

## Edge Cases

- **Video added/removed at runtime:** the homepage list reflects the current state on each page load. No live-update requirement (filesystem watching for video discovery is out of scope).
- **Duplicate slugs:** impossible at the filesystem level (directory names are unique within `videos/`).
- **Slug with characters that need URL encoding:** the directory name is the slug verbatim. If a video directory contains a space or special char, the URL is percent-encoded as usual. No new slug-sanitization layer is added.
- **`timeline.ts` fails to load (syntax error, missing default export):** the video still appears on the homepage (we discover by file presence), but clicking it leads to a video view that shows the existing error overlay. The homepage itself does not need to validate every timeline at list time.
- **Symlinks under `videos/`:** out of scope; whatever the filesystem reports is what we list.

## Out of Scope

- Filesystem watching to live-update the homepage when videos are created/deleted.
- Thumbnails or auto-generated previews.
- Project-level dashboards (style preview, segment library, voiceover library).
- Migration tooling for users on a prior version (no prior shipped version exists).
- Multi-project switching (one server per project, as today).
- Any separate "record" view — killed entirely.

## Open Items for UI Design Step

- Exact wording and visual of the cold-start panel.
- Download icon placement in the HUD.
- Hide-HUD tab affordance — visual design and exact placement.
- Homepage navigation affordance from the video view.
- Download modal layout (side-by-side cards vs stacked, button labels, code-block styling for the CLI command).
- 404 page design.
