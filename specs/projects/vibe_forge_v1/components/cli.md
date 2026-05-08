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
- `record` / `render` commands → later phase, out of scope for v1.

## Public Interface

The user-facing surface is the `videowright` binary. Two subcommands:

```
videowright dev [path-to-timeline] [--port <n>] [--verbose]
videowright script [path-to-timeline] [--write] [--verbose]
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
├── discover.ts          # config + timeline discovery
└── ts_loader.ts         # tsx-based loader for .ts config and timelines in Node
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
