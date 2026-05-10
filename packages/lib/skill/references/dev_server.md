# Dev Server

## When this is loaded

You were routed here from the intent dispatch table because the user wants to run, preview, or interact with the dev server.

## Starting the dev server

```bash
npx videowright dev
```

This boots a Vite dev server with the player pointed at the consumer's timeline. Open the printed URL in a browser to step through segments, review voiceover text, and iterate on content with hot reload.

### Options

| Flag | Default | Purpose |
|---|---|---|
| `--port <n>` | `5173` | Dev server port. If the port is taken, Vite picks the next available. |
| `--verbose` | off | Show extra detail (config path, timeline path). |

### Positional argument

```bash
npx videowright dev videos/my_video/timeline.ts
```

Pass a specific timeline path to preview that video. Without it, the dev server uses default discovery.

## Default discovery

When no timeline path is given, `videowright dev` finds the most recently modified `timeline.ts` under `videos/`. It scans `videos/*/timeline.ts`, sorts by file modification time (newest first), and picks the top result.

This means after editing a video, `npx videowright dev` automatically picks it up without needing to specify the path.

If no videos exist, the command errors with a hint to create one.

## URL hash navigation

The player URL supports hash-based positioning:

```
http://localhost:5173/#/<segmentId>/<beat>
```

For example, `#/feature-cards/2` jumps to the `feature-cards` segment at beat 2. This is useful for:

- Sharing a specific position with someone reviewing the video.
- Bookmarking a position during development.
- Jumping directly to a segment you are iterating on.

The player updates the hash as you navigate, so the URL always reflects the current position.

### `?to=<id>` query fallback

The URL also supports a `?to=<id>` query parameter to jump to a specific segment:

```
http://localhost:5173/?to=feature-cards
```

If present, the player jumps to that segment, removes the query parameter from the URL, and replaces the history entry. This is a one-shot jump — the query is consumed on use.

## Hot reload

The dev server uses Vite's file-watching with full page reloads. When you save changes to:

- **Segment files** (`segments/<id>/index.ts`) — the page reloads and replays from the current segment.
- **Timeline files** (`videos/<name>/timeline.ts`) — the page reloads with the updated segment order.
- **Style tokens** (`styles/<slug>/tokens.css`) — the page reloads with the updated CSS variables.
- **Components** (`components/*/index.ts`) — the page reloads.

Edits appear almost instantly. You do not need to restart the dev server when editing content.

## Audio playback

When the video has a `default_voiceover` set in `timeline.ts`, the dev server loads the voiceover audio and enables synced playback:

- The play button in the HUD starts auto-advance with audio playing through an HTML `<audio>` element.
- Audio is synced to the player's logical timeline position.
- Manual navigation (arrow keys, clicking, number keys) pauses audio and stops auto-advance.
- Pressing play again resumes from the current position.

If no `default_voiceover` is set, the play button still works — it auto-advances silently using `default_timing` or segment `advances`.

`dev` does not accept a `--voiceover` flag. It always uses `default_voiceover` from `timeline.ts`. To test a specific voiceover, set it as the default or use `record --voiceover <slug>`.

## HUD (Heads-Up Display)

The HUD is a semi-transparent overlay at the bottom of the player that shows:

| Field | Description |
|---|---|
| **play/pause button** | Toggle auto-advance with synced audio. Shows triangle (play) in idle, pause icon when playing. |
| **segment** | Current segment id. |
| **beat** | Current beat number within the segment. |
| **seg time** | Elapsed time since this segment mounted. |
| **total** | Total elapsed time since the video started. |
| **mode** | `interactive` (always, in dev). |
| **voiceover** | The current segment's `voiceover` text (if set). Shown in italics. |
| **keyboard shortcuts** | Reminder line at the bottom of the HUD. |

### Toggle

Press **H** to toggle the HUD on and off. The HUD is visible by default.

The `?hideHud=1` query parameter starts with the HUD hidden. This is used internally by `videowright render` so the HUD does not appear in exported frames.

The `?recordMode=1` query parameter is used by `videowright record` to start the player in record mode with reduced HUD chrome (only play button and end-of-timeline badge visible).

### Error display

If a segment throws during `mount()` or `play()`, the HUD displays a full-screen error overlay with:

- The segment id that errored.
- The error message.
- A "Show stack trace" button.
- A "Reload" button.

This overlay is always visible regardless of HUD toggle state.

## Keyboard shortcuts

| Key | Action |
|---|---|
| **Right Arrow** or **Space** | Advance to next beat / next segment. |
| **Left Arrow** | Go to previous segment. |
| **R** | Restart the video from the beginning. |
| **H** | Toggle HUD visibility. |
| **1-9** | Jump to segment by index (1 = first segment). |

### Mouse and touch

- **Click** anywhere on the player (outside the HUD) advances to the next beat.
- **Swipe left** advances to the next beat.
- **Swipe right** goes to the previous segment.

## Common workflows

### Iterating on a segment

1. Run `npx videowright dev`.
2. Navigate to the segment (use number keys or arrow keys).
3. The user describes what to change; the agent edits the segment file and saves. The page hot-reloads.
4. Review the change in the browser. Repeat.

### Reviewing voiceover

1. Run `npx videowright dev` with the HUD visible (default).
2. Step through segments. The HUD shows each segment's `voiceover` text.
3. Compare the VO text with the visual content to verify they match.

### Previewing a specific video

```bash
npx videowright dev videos/launch_2026/timeline.ts
```
