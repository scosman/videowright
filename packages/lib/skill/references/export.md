# Export

## When this is loaded

You were routed here from the intent dispatch table because the user wants to export a video to MP4.

Videowright has two commands for producing video output:

- **`render`** -- deterministic frame-by-frame MP4 export via Playwright + ffmpeg. This is the only command that produces an MP4 file.
- **`record`** -- auto-advance browser playback for visual review or external screen capture. No MP4 is produced. The user runs their own screen-capture software over the browser window.

## `videowright render`

Deterministic CDP-driven frame-by-frame export. The player runs in render mode with no wall-clock dependence.

```bash
npx videowright render
npx videowright render videos/my_video/timeline.ts
```

### How it works

1. Boots a Vite server with the render entry point.
2. Launches headless Chromium via Playwright.
3. Navigates to the render page and waits for render mode to initialize.
4. Validates all segments' `advances` arrays.
5. Builds a frame schedule from advances (converts seconds to frame indices at the target fps).
6. Captures each frame via CDP screenshot and fires `renderAdvance()` at scheduled frame boundaries.
7. Pipes frames to ffmpeg for MP4 encoding.

### Characteristics

- **Mode**: render (`ctx.mode === 'render'`). `hold()` resolves immediately; `clock()` returns deterministic time based on frame count.
- **Default fps**: 60.
- **Determinism**: Fully deterministic -- frames are byte-identical across runs.
- **Best for**: Final exports, CI pipelines, videos where reproducibility matters.

## `videowright record`

Auto-advance playback in the browser for visual review or external screen capture.

```bash
npx videowright record
npx videowright record videos/my_video/timeline.ts
```

### How it works

1. Boots the dev server on an auto-assigned port.
2. Prints a URL with `?recordMode=1` (HUD hidden for clean capture).
3. The user opens the URL in their browser.
4. The user navigates manually with keyboard/mouse (same controls as `dev`), optionally with external screen-capture software running.

Auto-advance playback via a play button is planned for a future update. Until then, the user drives timing manually.

### Characteristics

- **Mode**: interactive (same as `dev`).
- **No MP4 output.** For MP4 export, use `render`.
- **Best for**: Quick visual review, screen recording with external tools.

## Render options

| Flag | Default | Purpose |
|---|---|---|
| `--width <n>` | `1920` | Video width in pixels. |
| `--height <n>` | `1080` | Video height in pixels. |
| `--fps <n>` | `60` | Frames per second. |
| `--output <path>` | `output.mp4` | Output file path (relative to cwd). |
| `--verbose` | off | Show progress, frame counts, timing, ffmpeg output on error. |

### Positional argument

Both `render` and `record` accept an optional positional argument for the timeline path. Without it, they use the same default discovery as `videowright dev` (most recently modified `timeline.ts` under `videos/`).

## Dependencies

### ffmpeg

`render` requires `ffmpeg` installed and available on `PATH`. The CLI auto-detects it. If ffmpeg is not found, the command errors with a clear message.

Install ffmpeg:
- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt install ffmpeg`
- **Windows**: Download from https://ffmpeg.org/download.html

### Playwright / Chromium

`render` uses Playwright to launch headless Chromium. Playwright is a dev dependency of Videowright. If Chromium is not installed, Playwright will prompt to install it:

```bash
npx playwright install chromium
```

`record` does **not** require Playwright -- it uses the standard dev server and the user's own browser.

## Output

The default output path is `output.mp4` in the current working directory. A suggested convention is to place exports inside the video's folder at `videos/<name>/exports/`:

```bash
npx videowright render --output videos/demo/exports/final.mp4
```

The output is an H.264-encoded MP4 with `yuv420p` pixel format (widely compatible). Audio is not currently included -- videos are silent in the export. (Voiceover audio muxing via `--voiceover` is planned for a future update.)

## Advances validation

`render` validates every segment's `advances` array before starting capture:

- Every segment referenced in the timeline must have a non-empty `advances` array.
- Values must be positive and monotonically increasing.

If validation fails, the command errors with a message identifying which segment has the problem.

### Coherence checks during capture

During rendering, the driver checks for coherence issues:

- **Segment transitioned too early**: A segment moved to the next segment before all its advances were fired. Fix: remove unused entries from the `advances` array.
- **Segment parked after all advances**: All advances fired but the segment is still waiting (stuck on `waitForNext`). Fix: add more entries to the `advances` array.

## Audio

Exported videos are currently silent. Audio muxing via `render --voiceover <slug>` is planned for a future update. Until then, if the video has voiceover intent, the VO script exists for review and external TTS/mixing in post -- it is not rendered into the MP4.

## Common gotchas

| Issue | Explanation |
|---|---|
| Video looks different from dev mode | `render` uses render mode where `hold()` resolves immediately and `clock()` is deterministic. If a segment branches on timing or uses `ctx.mode`, its behavior may differ. Test in both modes. |
| ffmpeg not found | Install ffmpeg and ensure it is on your PATH. |
| Chromium not installed | Run `npx playwright install chromium`. |
| Export takes a long time | `render` at 60fps captures every frame individually. A 30-second video = 1800 frames. Use `--verbose` to see progress. |
| `advances` validation error | Check that every segment has a valid `advances` array. See [authoring_segment.md](authoring_segment.md) for how advances maps to `waitForNext`/`hold` calls. |
| Output file already exists | `render` overwrites the output file (`-y` flag to ffmpeg). |
