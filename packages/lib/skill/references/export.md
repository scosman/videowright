# Export

## When this is loaded

You were routed here from the intent dispatch table because the user wants to export a video to MP4.

Videowright has two commands for producing video output:

- **`render`** -- deterministic frame-by-frame MP4 export via Playwright + ffmpeg. This is the only command that produces an MP4 file.
- **`record`** -- auto-advance browser playback for visual review or external screen capture. No MP4 is produced. The user runs their own screen-capture software over the browser window.

## `videowright render`

Deterministic frame-by-frame export. The player runs in render mode with no wall-clock dependence.

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

- **Mode**: render (`ctx.mode === 'render'`). All timer primitives are virtualized; `clock()` returns deterministic time based on frame count.
- **Default fps**: 60.
- **Determinism**: Fully deterministic -- frames are byte-identical across runs.
- **Best for**: Final exports, CI pipelines, videos where reproducibility matters.

## Screen Recording

For screen recording, use `videowright dev` and open the video view in a browser. The download modal (accessible via the download icon in the top bar or on homepage cards) provides instructions for screen recording:

1. Open the video in the dev server.
2. Press **H** or click the hide-HUD tab to hide the HUD.
3. Use **← →** keys to advance manually and **Space** to play/pause.
4. Run your screen-capture software over the browser window.

The `videowright record` command has been removed. The hide-HUD tab in the video view replaces the old reduced-HUD record mode.

## Render options

| Flag | Default | Purpose |
|---|---|---|
| `--width <n>` | `1920` | Video width in pixels. |
| `--height <n>` | `1080` | Video height in pixels. |
| `--fps <n>` | `60` | Frames per second. |
| `--output <path>` | `output.mp4` | Output file path (relative to cwd). |
| `--voiceover <slug>` | | Use voiceover from `voiceovers/<slug>/`. |
| `--voiceover none` | | Disable voiceover (ignore `default_voiceover`). |
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

## Audio

When a voiceover is active, `render` muxes the audio file into the output MP4 via ffmpeg:

- The audio file is added as a second input to ffmpeg alongside the frame pipe.
- Audio is encoded as AAC at 192kbps.
- The `-shortest` flag bounds output to the shorter of video and audio.
- The voiceover's `Timing` object drives segment advances, so video and audio durations should match.

### Voiceover selection

```bash
# Use a specific voiceover
npx videowright render --voiceover v1

# Suppress voiceover (ignore default_voiceover)
npx videowright render --voiceover none

# No flag: use default_voiceover from timeline.ts if set, otherwise silent
npx videowright render
```

If no voiceover is active (no `--voiceover` flag and no `default_voiceover`), the output is silent.

### Record mode voiceover

`record` also accepts `--voiceover`:

```bash
npx videowright record --voiceover v1
```

Audio plays through the browser's `<audio>` element during record mode. The play button starts auto-advance with synced audio.

## Output

The default output path is `output.mp4` in the current working directory. A suggested convention is to place exports inside the video's folder at `videos/<name>/exports/`:

```bash
npx videowright render --output videos/demo/exports/final.mp4
```

The output is an H.264-encoded MP4 with `yuv420p` pixel format (widely compatible).

## Advances validation

`render` validates every segment's `advances` array before starting capture:

- Every segment referenced in the timeline must have a non-empty `advances` array.
- Values must be positive and monotonically increasing.

If validation fails, the command errors with a message identifying which segment has the problem.

### Coherence checks during capture

During rendering, the driver checks for coherence issues:

- **Segment transitioned too early**: A segment moved to the next segment before all its advances were fired. Fix: remove unused entries from the `advances` array.
- **Segment parked after all advances**: All advances fired but the segment is still waiting (stuck on `waitForNext`). Fix: add more entries to the `advances` array.

## Common gotchas

| Issue | Explanation |
|---|---|
| Video looks different from dev mode | `render` uses render mode where all timing is driven by the deterministic virtual clock. If a segment branches on `ctx.mode`, its behavior may differ. Test in both modes. |
| ffmpeg not found | Install ffmpeg and ensure it is on your PATH. |
| Chromium not installed | Run `npx playwright install chromium`. |
| Export takes a long time | `render` at 60fps captures every frame individually. A 30-second video = 1800 frames. Use `--verbose` to see progress. |
| `advances` validation error | Check that every segment has a valid `advances` array. See [authoring_segment.md](authoring_segment.md) for how advances maps to `waitForNext`/`hold` calls. |
| Output file already exists | `render` overwrites the output file (`-y` flag to ffmpeg). |
