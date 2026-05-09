---
status: complete
---

# Phase 1: `record` cleanup

## Overview

Strip the Playwright + ffmpeg screenshot pipeline from `record`, turning it into a browser-based auto-advance playback mode for visual review and external screen capture. After this phase, `record` boots the dev server, opens a browser URL, and produces no mp4. Users wanting mp4 output use `render`. This is a prerequisite for later phases that add audio integration -- separating the rendering and playback paths makes audio easier to wire.

## Steps

1. **Rewrite `packages/lib/src/cli/record.ts`**
   - Remove all imports: `findFfmpeg`, `spawnFfmpeg`, `writeWithBackpressure`, `ensurePlaywright`, `validateSegmentAdvances`, `loadModule`.
   - Remove `RecordResult` type (no output path, frames, duration).
   - New `RecordOptions`: drop `width`, `height`, `fps`, `output`; keep `cwd`, `positional`, `verbose`.
   - New `RecordResult`: `{ url: string; close: () => Promise<void> }`.
   - `runRecord` implementation:
     - Call `discoverProject(cwd, positional, "record")` to find config + timeline.
     - Call `runDev({ cwd, positional, port: 0, verbose })` to boot the dev server on an auto-assigned port.
     - Append `?recordMode=1` to the URL.
     - Print the URL for the user.
     - Return `{ url, close }` -- the caller in `index.ts` keeps the process alive (same pattern as `dev`).

2. **Update `packages/lib/src/cli/index.ts`**
   - Remove `width`, `height`, `fps`, `output` from the `record` call site.
   - Change the post-record console.log from frame/duration output to the new URL message.
   - Keep the process alive via SIGINT/SIGTERM handler (same pattern as `dev`).
   - Update `HELP_TEXT`: change record description to "Auto-advance playback for visual review or external screen capture. No mp4 output -- use render for export."
   - Remove record-specific flags (`--width`, `--height`, `--fps`, `--output`) from record's help description. These flags remain for render only.

3. **Handle `?recordMode=1` in `packages/lib/src/cli/entry/entry_client.ts`**
   - Detect `recordMode` query param.
   - When present, pass `{ hud: 'record' }` (or equivalent) to the Player constructor so the HUD can render in reduced mode later (Phase 3 adds the play button). For now, `recordMode=1` is equivalent to hiding the full HUD but keeping the page otherwise functional. Simply re-use `hideHud` behavior for now -- Phase 3 will differentiate.

4. **Update `packages/lib/skill/references/export.md`**
   - Remove the `videowright record` section that describes screenshot-based capture.
   - Add a note at top that `record` is for auto-advance playback / external screen capture, not mp4 production.
   - Simplify: record is now "boot dev server with `?recordMode=1`" for visual review. For mp4, use `render`.

5. **Update other skill references that mention record for mp4**
   - `authoring_segment.md`: Change "render/record mode" and "render/record" mentions to just describe both commands accurately (record for playback, render for export).
   - `dev_server.md`: Update `?hideHud=1` note to also mention `?recordMode=1`.
   - `testing.md`: Update parenthetical "(record/render pipeline and advances validation)" to reflect that record no longer has a pipeline.

6. **Update `packages/lib/test/unit/record_render_argv.test.ts`**
   - Remove record argv tests for `--output`, `--width`, `--height`, `--fps` (these flags no longer apply to record).
   - Keep: `argv_record_no_args`, `argv_record_with_path`, basic verbose test.
   - Record with `--output` should now throw (unknown flag via strict parseArgs).

7. **Update `packages/lib/test/unit/cli_record_render.test.ts`**
   - `main_record_missing_config_exits_1`: remove mocks for `ffmpeg.js` and `playwright_check.js` (record no longer uses them). Keep the config-missing assertion.
   - `main_help_shows_record_and_render`: keep as-is; help text still lists both commands.

8. **Verify no other tests exercise record's old ffmpeg path**
   - `test/unit/ffmpeg.test.ts` tests ffmpeg helpers directly -- keep unchanged.
   - `test/unit/playwright_check.test.ts` -- keep unchanged.

## Tests

- `argv_record_no_args`: record with no args parses correctly, no output/width/height/fps flags.
- `argv_record_with_path`: positional argument still works.
- `argv_record_rejects_output_flag`: `record --output foo.mp4` throws ArgvError (strict parse rejects unknown flags).
- `main_record_missing_config_exits_1`: record without config exits 1 with appropriate error.
- `main_help_shows_record_and_render`: help text mentions both commands.
