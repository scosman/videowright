---
status: complete
---

# Phase 4: Supporting References

## Overview

Write the 7 remaining stub reference files that support the core workflows completed in Phase 3. These files document Videowright's primitives and tooling so the agent can reason from them when authoring segments, managing projects, exporting videos, and testing. Content is derived from the lib source code (types, CLI commands, player behavior) and the spec's ownership boundaries.

## Steps

1. **`references/authoring_segment.md`** — Full segment lifecycle reference. Cover `defineSegment`, `SegmentSpec` fields (`id`, `advances`, `voiceover`, `notes`, `mount`, `play`, `unmount`, `next`, `prev`), `PlayerContext` methods (`waitForNext`, `hold`, `signal`, `mode`, `clock`), the `setTimeout`/`setInterval` footgun, idempotency rules, the "any web tech welcome" guidance, and internal beats. Include a worked example showing `advances` mapping to `waitForNext`/`hold` calls. Cross-link to `styles.md` for token usage and `create_or_edit_video.md` for timeline composition.

2. **`references/voiceover.md`** — VO field on segments, VO-first authoring pattern, `videowright script` CLI usage (stdout by default, `--write` to write `voiceover/script.md`), where `script.md` lives (`videos/<name>/voiceover/script.md`), keeping `voiceover` fields and `script.md` in sync. Note that audio playback is not implemented — VO is for review and external TTS. Cross-link to `create_or_edit_video.md` and `new_video.md` for workflow context.

3. **`references/project_structure.md`** — Consumer repo layout diagram. Top-level directories (`segments/`, `components/`, `transitions/`, `styles/`, `videos/`), per-video folder contents (`timeline.ts`, `PLAN.md`, `voiceover/script.md`), config file at root. File-ownership rules: top-level dirs are shared across videos, per-video files live in `videos/<name>/`. Naming guidance for segments and videos.

4. **`references/types.md`** — Quick TS reference for all public types: `Segment`, `SegmentSpec`, `PlayerContext`, `Timeline`, `TimelineMeta`, `TimelineEntry`, `Transition`, `TransitionContext`, `Config`. Type signatures + one-line purpose. Include the new `defaultStyle?` and `style?` fields.

5. **`references/dev_server.md`** — `videowright dev` invocation and options (`--port`, `--verbose`, positional timeline path). Default discovery (most-recent video by mtime). URL hash for position (`#/<segmentId>/<beat>`). `?to=<id>` query fallback. Hot reload via Vite. HUD toggle and display fields. Keyboard shortcuts table. The `?hideHud=1` query param used by record.

6. **`references/export.md`** — `videowright record` and `videowright render` invocations with flags (`--width`, `--height`, `--fps`, `--output`, `--verbose`). Differences between record (interactive-mode, screenshot-based, 30fps default) and render (deterministic CDP-driven, frame-by-frame, 60fps default). Output paths (default `output.mp4`). Dependencies (ffmpeg, Playwright/Chromium). Common gotchas: headless browser, window focus not needed, audio is silent. Advances validation at export time.

7. **`references/testing.md`** — What's worth testing in a Videowright project. Non-prescriptive examples: advances count matches `waitForNext`/`hold` calls per segment, Playwright screenshot tests at key beats, typecheck passes on segments. Mention existing lib tests are separate. Cross-link to `dev_server.md` and `export.md`.

## Tests

- No automated tests — these are markdown content files. The project has no test infrastructure for skill content.
- Verify typecheck and lint pass (markdown files should not affect these, but confirm no regressions).
