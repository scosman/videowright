---
status: complete
---

# Unified Video Server

The CLI is awkward today. Pain points:

1. **`npx videowright dev` is single-video by default.** A project can contain multiple videos, but the dev server boots into one of them — no way to switch without restarting or knowing the URL.
2. **Dev and record are separate servers.** Today users run `npx videowright dev` for hot-reload iteration and `npx videowright record` for auto-advancing playback. Two commands, two processes, two ports — the dev/record distinction is a mode, not a server, and should live in the UI.
3. **`npx videowright render` silently defaults to the last video** when no video is specified. In a multi-video project this is surprising — it should prompt for which video to render instead of guessing.

## Rough Direction

- **One server** that handles both dev and record. The mode is selected in the UI, not on the command line. The `record` command goes away entirely — v1 hasn't shipped, no back-compat needed for URLs or the command.
- **Homepage** at `/` listing all videos in the project. Each video card exposes the full set of actions (open in dev, Download). The dev HUD exposes the per-video actions too (likely as a small submenu — needs a great compact design). The HUD doesn't duplicate "open in dev" since the HUD *is* dev. The two surfaces stay consistent so users don't have to hunt for an option based on where they are.
- **Cold-start UX** when the project has zero videos: explain how to create one in the coding agent (e.g., `/videowright new video`).
- **Deterministic URLs** per video: `/[video_slug]/dev/...` and `/[video_slug]/record/...`. Replaces whatever the current addressing scheme is.
- **`render` prompts for video selection** when none is passed, instead of defaulting to the last one. Passing an explicit slug still works non-interactively.
- **README/CLI docs updated** to reflect the unified command and new render behavior.

## Per-Video Actions (homepage + dev HUD)

Both surfaces expose the same per-video actions:

- **Open in dev** — primary action on the homepage. Not present in the HUD (HUD is already dev).
- **Download** — single standard download icon. Opens a modal showing **both** capture options side-by-side:
  - **Export Video (recommended)** — "Download a pixel-perfect MP4 without screen recording. Best quality." → shows the exact `npx videowright render -- ...` command for this video, plus a short explainer about why export is CLI-only (deterministic frame-by-frame export needs ffmpeg + Playwright on the user's machine).
  - **Screen Record** — "Use screen recording software to capture this video in a live browser. You can advance manually, great for recording a live voiceover." → [Record] button navigates to the record view.

One icon, one modal, both paths — instead of two separate buttons.
