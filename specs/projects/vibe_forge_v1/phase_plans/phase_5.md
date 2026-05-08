---
status: complete
---

# Phase 5: CLI

## Overview

Implement the `videowright` CLI binary with two subcommands: `videowright dev` (Vite dev server) and `videowright script` (VO script output). This phase adds the argv parser, config/timeline discovery, tsx-based TS module loading, the dev server flow, the script flow, the internal entry HTML for the dev server, and unit/integration tests.

## Steps

1. **Install dependencies.** Add `tsx` and `vite` as runtime dependencies in `packages/lib/package.json` (vite is already a devDependency; promote to a dependency since the CLI needs it at runtime).

2. **Create `src/cli/argv.ts`.** Thin wrapper around `node:util` `parseArgs`. Extracts subcommand from `process.argv[2]`, then calls `parseArgs` with the flag schema. Returns `{ command, positional, flags }` or throws on unknown commands / double positionals.

3. **Create `src/cli/discover.ts`.** Two functions: `findConfig(cwd)` checks for `videowright.config.ts`; `findTimeline(cwd, hint?)` resolves an explicit path or globs `videos/*/timeline.ts` sorted by mtime desc.

4. **Create `src/cli/ts_loader.ts`.** Uses `tsImport` from `tsx/esm/api` to load `.ts` modules at runtime in Node. Exports `loadModule<T>(path, referrer)`.

5. **Create `src/cli/dev.ts`.** The `videowright dev` flow: discover config + timeline, load config, build Vite `InlineConfig` with internal entry HTML, `@consumer` alias, fs.allow, define `__VW_TIMELINE_PATH__`, boot `createServer().listen()`, print URL.

6. **Create `src/cli/script_cmd.ts`.** The `videowright script` flow: discover config + timeline, load both via tsx, walk `segments/` dir to build a Node-side `SegmentLoaderMap`, call `script()`, print or write to file.

7. **Create `src/cli/entry.html` and `src/cli/entry_client.ts`.** The internal HTML and client script served by the dev server. The entry client imports the player, uses `import.meta.glob` for segments, and mounts everything.

8. **Update `src/cli/index.ts` (bin entry).** Parse argv, dispatch to dev/script/help/version. Format errors per spec. Add shebang.

9. **Write unit tests.** `test/unit/argv.test.ts` (parser cases per spec test plan). `test/unit/discover.test.ts` (config/timeline discovery with temp dirs).

10. **Write integration tests.** `test/integration/cli_script.test.ts` (script command against fixture dir). `test/integration/cli_errors.test.ts` (missing config/timeline exit codes).

## Tests

- `argv_dev_no_args`: `dev` -> command='dev', no positional, default flags.
- `argv_dev_with_path`: `dev videos/foo/timeline.ts` -> positional set.
- `argv_script_with_write`: `script --write` -> flags.write = true.
- `argv_help`: `--help` -> command='help'.
- `argv_version`: `--version` -> command='version'.
- `argv_unknown_command`: `frob` -> error.
- `argv_double_positional_rejected`: `dev a b` -> error.
- `discover_config_present`: cwd with `videowright.config.ts` -> returns absolute path.
- `discover_config_absent`: empty cwd -> null.
- `discover_timeline_explicit_hint`: explicit path resolves and validates existence.
- `discover_timeline_picks_most_recent`: cwd with three videos -> returns the one with newest mtime.
- `discover_timeline_no_videos`: empty `videos/` -> null.
- `cli_script_against_fixture`: temp dir with config + timeline + 2 segments -> script exits 0, stdout matches expected Markdown.
- `cli_script_write_creates_file`: same but `--write` -> file created at expected path.
- `cli_dev_missing_config_exits_1`: empty cwd -> dev exits 1 with expected message.
- `cli_dev_missing_timeline_exits_1`: cwd with config but no `videos/` -> exits 1.
