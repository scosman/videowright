---
status: complete
---

# Component: CLI

`videowright dev` and `videowright script` commands. Lives in the same `videowright` npm package as the lib.

## Purpose and Scope

**Owns:**

- Binary entry (`bin/videowright.js`) with shebang.
- argv parser (small built-in, no dep).
- Subcommand dispatch.
- `videowright dev`: programmatic Vite dev server boot against the consumer repo.
- `videowright script`: one-shot Node-side load of timeline + `script()` helper.
- Config discovery (find `videowright.config.ts` in cwd).
- Timeline discovery (most-recent `videos/*/timeline.ts` if no path provided).
- User-friendly error messages with actionable next steps.

**Not owned:**

- Player runtime → `player.md`.
- Timeline parsing → `timeline_loader.md`.
- `record` / `render` orchestration internals (ffmpeg, Playwright) → `record.ts`, `render.ts`.

## Public Interface

The user-facing surface is the `videowright` binary. Four subcommands:

```
videowright dev [path-to-timeline] [--port <n>] [--verbose]
videowright script [path-to-timeline] [--write] [--verbose]
videowright record [path-to-timeline] [--width <n>] [--height <n>] [--fps <n>] [--output <path>] [--verbose]
videowright render [path-to-timeline] [--width <n>] [--height <n>] [--fps <n>] [--output <path>] [--verbose]
videowright --help
videowright --version
```

Exit codes:
- `0` success.
- `1` user error (missing config, missing timeline, malformed input).
- `2` internal/system error.

## Internal Design

### Module structure

```
src/cli/
├── bin.ts               # entry, parses argv, dispatches
├── argv.ts              # minimal argv parser
├── dev.ts               # `videowright dev` flow
├── script.ts            # `videowright script` flow
├── record.ts            # `videowright record` flow (Playwright + ffmpeg screenshot capture)
├── render.ts            # `videowright render` flow (CDP-driven deterministic frame export)
├── ffmpeg.ts            # ffmpeg detection and process spawning
├── playwright_check.ts  # dynamic Playwright import with user-friendly error
├── discover.ts          # config + timeline discovery
├── ts_loader.ts         # tsx-based loader for .ts config and timelines in Node
├── errors.ts            # UserError class
└── entry/
    ├── index.html       # interactive player entry
    ├── entry_client.ts  # interactive player boot script
    ├── render.html      # render-mode player entry
    └── render_entry.ts  # render-mode boot script (exposes CDP globals)
```

### argv parser (`argv.ts`)

Uses Node's built-in `parseArgs` from `node:util` (Node 18+). No third-party CLI parser, no bespoke parser to maintain.

Thin wrapper that:
- Pulls the subcommand off `process.argv[2]` before calling `parseArgs` (parseArgs doesn't have a subcommand concept).
- Calls `parseArgs` with our flag schema: `port: { type: 'string' }`, `write: { type: 'boolean' }`, `verbose: { type: 'boolean' }`, `help: { type: 'boolean' }`, `version: { type: 'boolean' }`.
- Maps the result to `{ command: 'dev' | 'script' | 'help' | 'version' | null; positional?: string; flags }`.

`--help` / `--version` work as the command itself (no subcommand needed). No short flags in v1.

### Discovery (`discover.ts`)

```ts
function findConfig(cwd: string): string | null;       // looks for videowright.config.ts at cwd
function findTimeline(cwd: string, hint?: string): string | null;
```

`findTimeline`:
- If `hint` is provided: resolve relative to cwd. If file exists, return its absolute path. Else error.
- If no `hint`: glob `cwd/videos/*/timeline.ts`. If none, return null. Else sort by mtime desc, return the most recent.

### TS module loader (`ts_loader.ts`)

The CLI runs in Node. `videowright.config.ts` and `videos/X/timeline.ts` are TypeScript files. We need to import them at runtime without a build step.

Use **tsx**'s programmatic API (`tsx/esm` or `tsImport` from `tsx`). Pinned in package.json. Load via:

```ts
import { tsImport } from 'tsx/esm/api';

async function loadConfig(path: string): Promise<Config> {
  const mod = await tsImport(path, import.meta.url);
  return mod.default as Config;
}
```

The CLI process is short-lived in `script` mode; in `dev` mode, Vite handles HMR for source files but the config is loaded once at boot.

### `videowright dev` flow (`dev.ts`)

1. Find config. Missing → print "no `videowright.config.ts` found at <cwd>; the Videowright skill can scaffold one. Run setup first." Exit 1.
2. Find timeline. Missing → "no videos found at <cwd>/videos/. Create one or pass a path." Exit 1.
3. Load config via tsImport.
4. Build a Vite config programmatically:
   ```ts
   const viteConfig: InlineConfig = {
     root: <our internal entry dir, packaged inside the lib>,
     server: {
       port: flags.port ?? 5173,
       fs: { allow: [cwd, libRoot] },     // allow Vite to serve consumer files
     },
     resolve: {
       alias: {
         '@consumer': cwd,                 // virtual alias for consumer repo root
       },
     },
     define: {
       __VW_TIMELINE_PATH__: JSON.stringify(timelinePath),
     },
   };
   ```
5. Our internal entry HTML imports the player, the timeline, and the consumer repo's segments via `import.meta.glob('@consumer/segments/*/index.ts')`.
6. Boot the Vite dev server: `await createServer(viteConfig).listen()`. Print URL.
7. Stay alive until Ctrl-C. Vite handles file watching + HMR (we configure full-reload on any change for v1).

### `videowright script` flow (`script.ts`)

1. Find config. Missing → same error as dev. Exit 1.
2. Find timeline. Missing → same.
3. Load config via tsImport.
4. Load timeline via tsImport.
5. **Load all segments referenced by the timeline.** This is the trickier step in Node — we don't have `import.meta.glob`. Instead, walk `cwd/segments/` directory, build a path map, lazy-import each.
6. Run `script(timeline)` from the lib (which uses the loaded segments to read `voiceover` fields).
7. With `--write`: write to `<cwd>/videos/<inferred>/voiceover/script.md`. The "inferred" video folder is the parent dir of the timeline path.
8. Without `--write`: print to stdout.

The Node-side segment loader is a different code path from the browser's Vite glob. Both need to produce the same `SegmentLoaderMap` shape so `script()` and `validateTimeline` work identically.

### `videowright record` flow (`record.ts`)

Screenshot-based capture. The player runs in interactive mode, auto-advancing using each segment's `advances` array.

1. Validate ffmpeg on PATH. Missing → UserError with platform-specific install instructions.
2. Dynamic-import Playwright. Missing → UserError with `npm install playwright` hint.
3. Find config + timeline (same discovery as dev/script).
4. Load all segment modules to extract their `advances` arrays. Validate monotonicity and positivity.
5. Boot Vite dev server (reuses `runDev` from dev.ts) with `?hideHud=1` to suppress HUD overlay.
6. Launch headless Chromium via Playwright with configured viewport.
7. Start ffmpeg process (image2pipe format, PNG on stdin, libx264 output).
8. Per-segment loop: for each advance time in the segment's `advances` array, capture frames until wall-clock reaches `segmentMountTime + advances[i]`, then fire a keyboard Space press. Wait for `document.body.dataset.vwState === "playing"` after each press.
9. Runtime coherence checks: if the segment transitions before all advances fired, or parks on waitForNext after all advances fired, error with actionable message.
10. Close ffmpeg stdin, wait for encoding to finish.
11. Report output path, frame count, duration.

### `videowright render` flow (`render.ts`)

Deterministic frame-by-frame export. The player runs in render mode with a controlled clock.

1. Same dependency checks as record.
2. Find config + timeline.
3. Load all segment modules to extract `advances` arrays. Build a frame schedule mapping each advance to a global frame number.
4. Boot Vite dev server using `render.html` entry (render-mode player).
5. Launch headless Chromium, navigate to render URL.
6. Wait for `window.__VW_RENDER_READY__` signal via CDP.
7. Start ffmpeg process (same image2pipe approach).
8. Frame-by-frame loop driven by the advances schedule: at each scheduled frame, call `window.__VW_RENDER_ADVANCE__()`, then capture screenshot and pipe to ffmpeg. Total frame count is computed from the sum of each segment's last advance value.
9. Runtime coherence checks via `document.body.dataset.vwSegment`.
10. Finalize ffmpeg, report results.

Determinism guarantees: `hold()` resolves immediately (no real timers), `clock()` returns values based on frame count rather than wall time, the render driver controls advancement not real time.

### Error formatting

All user errors printed as a single line:
```
videowright: <message>
hint: <actionable next step>
```

Stack traces only with `--verbose`. System errors (unexpected exceptions) always print stack.

## Dependencies

**Depends on:**
- `vite` (programmatic API)
- `tsx` (TS module loader for Node)
- Lib's exports: `Player`, `script`, `validateTimeline`, `buildSegmentLoaderMap` (or a Node-equivalent), `applyMetaDefaults`, types.

**Depended on by:**
- End users via `npx videowright` or `npm run dev`.

## Test Plan

### Unit (Vitest)

- `argv_dev_no_args`: `dev` → command='dev', no positional, default flags.
- `argv_dev_with_path`: `dev videos/foo/timeline.ts` → positional set.
- `argv_script_with_write`: `script --write` → flags.write = true.
- `argv_help`: `--help` → command='help'.
- `argv_unknown_command`: `frob` → error.
- `argv_double_positional_rejected`: `dev a b` → error (only one positional supported).
- `discover_config_present`: cwd with `videowright.config.ts` → returns absolute path.
- `discover_config_absent`: empty cwd → null.
- `discover_timeline_explicit_hint`: explicit path resolves and validates existence.
- `discover_timeline_picks_most_recent`: cwd with three videos → returns the one with newest mtime.
- `discover_timeline_no_videos`: empty `videos/` → null.

### Integration (Vitest + filesystem fixtures)

- `cli_script_against_fixture`: temp dir with config + timeline + 2 segments → `videowright script` exits 0, stdout matches expected Markdown.
- `cli_script_write_creates_file`: same but `--write` → file created at expected path.
- `cli_dev_missing_config_exits_1`: empty cwd → `dev` exits 1 with the expected message.
- `cli_dev_missing_timeline_exits_1`: cwd with config but no `videos/` → exits 1.

`videowright dev` is hard to fully unit-test (it boots a server). The Playwright e2e (against demo_example) covers the dev-server-and-player path end-to-end.

### Manual smoke

- `videowright --help` prints usage.
- `videowright --version` prints package version.
