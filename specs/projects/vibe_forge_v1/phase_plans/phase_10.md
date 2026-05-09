---
status: draft
---

# Phase 10: Export Commands (record + render)

## Overview

Add `videowright record` and `videowright render` CLI commands for exporting videos to MP4. `record` is the simpler approach: Playwright opens the player full-screen, ffmpeg screen-captures the window. `render` is deterministic: the player runs in render mode with a controlled clock, CDP captures each frame as a screenshot, ffmpeg stitches frames into video. Both require ffmpeg on PATH and Playwright at runtime; both fail with clear error messages if either is missing.

The player gains a real render-mode implementation (replacing the phase-4 stub): a `__VW_RENDER__` global-based contract where the render driver controls frame advancement, and the player suppresses all interactive input.

## Steps

### 1. Add ffmpeg detection utility

Create `src/cli/ffmpeg.ts`:
- `findFfmpeg(): string` -- checks `ffmpeg` on PATH via `which` / `where` depending on platform. Returns path or throws `UserError` with install instructions.
- `runFfmpeg(args: string[]): Promise<{ code: number; stderr: string }>` -- spawns ffmpeg with given args, captures stderr for diagnostics.

### 2. Add Playwright detection utility

Create `src/cli/playwright_check.ts`:
- `async ensurePlaywright(): Promise<typeof import('playwright')>` -- dynamic `import('playwright')` wrapped in try/catch. On ImportError, throw `UserError` with `hint: "npm install playwright"`.
- Playwright stays as a devDependency; record/render commands fail gracefully if it's not installed.

### 3. Extend argv parser

Update `src/cli/argv.ts`:
- Add `"record"` and `"render"` to `KNOWN_COMMANDS`.
- Add flags: `--width`, `--height`, `--fps` (all `type: 'string'`, parsed to numbers), `--output` (`type: 'string'`).
- Update `Command` type to include `'record' | 'render'`.

### 4. Implement render mode in the player

Update `src/segment/SegmentRunner.ts`:
- When `mode === 'render'`, `hold(ms)` resolves immediately (no wall-clock delay). This makes the player deterministic.
- `clock()` in render mode returns a value derived from beat count rather than `performance.now()`.

Update `src/player/index.ts`:
- Add a `renderMode` option to `PlayerOptions`.
- In render mode: suppress all interactive input (don't attach input listeners), disable HUD by default.
- Expose `async renderAdvance(): Promise<boolean>` method -- advances to next beat/segment. Returns false when timeline is exhausted.
- Expose `currentSegmentId` and `currentTimelineIndex` (already exist).
- Render-mode `renderBeats` validation: if `renderBeats` is specified on a timeline entry, validate that the segment's `waitForNext()` call count matches `renderBeats.length`. Error with segment id and count mismatch.

### 5. Create render-mode entry HTML

Create `src/cli/entry/render_entry.ts`:
- Similar to `entry_client.ts` but boots the player in render mode.
- Sets `window.__VW_RENDER__` global to signal render mode.
- Exposes `window.__VW_RENDER_ADVANCE__` and `window.__VW_RENDER_READY__` for CDP control.

### 6. Implement `videowright record` command

Create `src/cli/record.ts`:
- `runRecord(opts)`:
  1. Validate ffmpeg on PATH.
  2. Dynamic-import playwright.
  3. Find config + timeline (same discovery as dev).
  4. Boot Vite dev server programmatically (reuse `runDev` or extracted helper from dev.ts).
  5. Launch Playwright chromium browser, navigate to dev server URL.
  6. Set viewport to requested resolution (default 1920x1080).
  7. Start ffmpeg process to capture via x11grab/avfoundation/gdigrab depending on OS -- OR, simpler and cross-platform: use Playwright's `page.screenshot()` in a loop piped to ffmpeg stdin as raw frames.
  8. Use a Playwright-driven approach: take screenshots at the configured fps, pipe raw RGBA frames to ffmpeg stdin which encodes to MP4.
  9. Advance the player by injecting keyboard events (Space key) at timed intervals based on a simple auto-advance or let the user manually control.
  10. For v1 record: the user interacts manually; record captures what happens. OR auto-advance using renderBeats if present.
  11. Stop on "end of timeline" detection.
  12. Close ffmpeg, browser, dev server.

Actually, re-reading the spec: `record` is Playwright drives full-screen player, ffmpeg captures the window. The simpler model is: Playwright opens the page, we use CDP screencast or screenshot-per-frame, pipe to ffmpeg. Let the player run in interactive mode but auto-advance using renderBeats timings.

Revised approach for `record`:
1. Boot dev server.
2. Launch headless Chromium via Playwright.
3. Navigate to player URL.
4. Start ffmpeg encoding process (stdin pipe, raw frames).
5. Use CDP to start a screencast session, forward frames to ffmpeg.
6. Auto-advance the player using keyboard injection at renderBeats intervals.
7. Detect end-of-timeline, stop.

### 7. Implement `videowright render` command

Create `src/cli/render.ts`:
- `runRender(opts)`:
  1. Validate ffmpeg on PATH.
  2. Dynamic-import playwright.
  3. Find config + timeline.
  4. Boot Vite dev server with render-mode entry.
  5. Launch headless Chromium via Playwright.
  6. Navigate to render entry URL.
  7. Wait for `__VW_RENDER_READY__` signal via `page.evaluate`.
  8. Frame-by-frame loop:
     a. Call `page.evaluate(() => window.__VW_RENDER_ADVANCE__())` to advance one frame.
     b. Use CDP `Page.captureScreenshot` for a deterministic PNG frame.
     c. Pipe frame to ffmpeg stdin (or write to temp dir, stitch at end).
     d. Repeat until advance returns false (timeline exhausted).
  9. Finalize ffmpeg encoding.
  10. Close browser, dev server.
  11. Report output path.

### 8. Wire record/render into CLI main

Update `src/cli/index.ts`:
- Add `record` and `render` cases to the command dispatch.
- Update help text with new commands.

### 9. Write tests

Unit tests in `test/unit/`:
- `record_render_argv.test.ts`: argv parsing for record/render commands with their flags.
- `ffmpeg.test.ts`: ffmpeg detection (mock child_process).

Integration tests in `test/integration/`:
- `record_render_cli.test.ts`:
  - Missing ffmpeg error message test (mock the detection).
  - Missing playwright error message test (mock the import).
  - Basic CLI dispatch test (ensure record/render commands are recognized).

### 10. Update spec docs

- `components/cli.md`: Add record and render subcommands.
- `components/player.md`: Document render-mode contract.
- `notes_for_readme.md`: Add export commands note.

## Tests

- `argv_record_no_args`: `record` -> command='record', default flags.
- `argv_record_with_output`: `record --output out.mp4` -> flags.output set.
- `argv_record_with_resolution`: `record --width 1280 --height 720` -> flags parsed.
- `argv_render_no_args`: `render` -> command='render', default flags.
- `argv_render_with_fps`: `render --fps 30` -> flags.fps set.
- `ffmpeg_not_found_error`: when ffmpeg is not on PATH, throws UserError with clear message.
- `playwright_not_installed_error`: when playwright can't be imported, throws UserError with hint.
- `record_command_dispatches`: main(['record']) dispatches without crashing (with mocked deps).
- `render_command_dispatches`: main(['render']) dispatches without crashing (with mocked deps).
- `render_mode_hold_resolves_immediately`: SegmentRunner in render mode, hold() resolves without delay.
- `render_mode_clock_deterministic`: SegmentRunner in render mode, clock() is not wall-clock.
