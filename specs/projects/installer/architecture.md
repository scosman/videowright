---
status: complete
---

# Architecture: Installer

## Overview

The installer is unusual: most of the "code" is a Markdown script (`INSTALL.md`) executed by a coding agent. There are four deliverables:

1. **`INSTALL.md`** — the agent-executable install script (Markdown). The bulk of the work.
2. **`create-videowright`** — small npm initializer for `npm init videowright`. ~100 LOC of Node.
3. **README update** — adds the paste-prompt block.
4. **`setup.md` update** — prepends a "Verify install" step to the existing skill's setup reference.

No data model. No persistent state. The "runtime" is the user's coding agent following Markdown instructions.

---

## Repository Layout

```
videowright/
├── README.md                                       # update: paste prompt
├── packages/
│   ├── lib/                                        # existing videowright package
│   │   ├── package.json                            # no changes (files: ["skill"] already covers INSTALL.md)
│   │   └── skill/
│   │       ├── SKILL.md                            # no changes
│   │       ├── install/
│   │       │   └── INSTALL.md                      # NEW — agent-executable install script
│   │       └── references/
│   │           └── setup.md                        # update: prepend verify-install step
│   └── create-videowright/                         # NEW package
│       ├── package.json
│       ├── bin/
│       │   ├── cli.js                              # shebang entry point
│       │   └── index.js                            # library (all exports)
│       └── test/
│           └── *.test.js
```

Monorepo workspace already includes `packages/lib`. Add `packages/create-videowright` to root `package.json` `workspaces`.

---

## Distribution

### `INSTALL.md` location

- **In repo**: `packages/lib/skill/install/INSTALL.md`.
- **Stable GitHub URL** (used in Readme + initializer): `https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md`.
- **Bundled in npm package**: yes, automatically — `packages/lib/package.json` already has `files: ["skill"]`, which includes `skill/install/INSTALL.md` as a transitive consequence.
- **Versioning**: the GitHub URL always points to `main`. Re-installing via the GitHub URL fetches whatever's on `main`, regardless of the user's installed `videowright` version. Acceptable for pre-1.0; document the tradeoff in `INSTALL.md` itself.

### `create-videowright` publishing

- Published to npm as `create-videowright`. npm convention: `npm init videowright` resolves to `npx create-videowright`.
- Initial `package.json` has `bin: { "create-videowright": "./bin/cli.js" }`.
- Two-file split: `bin/cli.js` is the thin shebang entry point (`#!/usr/bin/env node`) that imports and calls `main()` from `bin/index.js`. `bin/index.js` is a pure library with all exports — no auto-execution. This keeps `index.js` cleanly importable by tests without triggering `main()`.
- No build step needed (plain Node, ESM, no TypeScript for this package — keep it tiny and dependency-free).

---

## `INSTALL.md` Structure

The functional spec already nails down the user-facing flow. Architecture-level details:

- **Format**: GitHub-flavored Markdown. Top-level `# Install Videowright` heading; numbered `## Step N` sub-headings (matches functional spec ordering).
- **Voice**: written *to the agent*. "You will detect the package manager. If both are installed, ask the user: '…'."
- **Embedded user-facing strings**: in fenced code blocks so the agent quotes them verbatim. Example:
  ```markdown
  Ask the user, exactly:
  > Which package manager do you want to use? [npm] or [pnpm]?
  ```
- **Algorithms described as prose**: marked-region writer, symlink creator, agent detection. The agent executes them; we don't ship code for any of these.
- **No links to sibling files**: single-file as agreed. All content inline.

### Sections in `INSTALL.md` (matches functional spec steps)

1. Preamble: "You are installing Videowright. Follow these steps in order."
2. Folder check.
3. Agent detection (`which claude`, `which codex`, `which opencode`; multi-agent question).
4. Package-manager detection (lockfile → `which` → ask if both → fail if neither).
5. Package install (videowright + dev toolchain, mirrored from core repo).
6. Skill installation (two symlinks, always both).
7. Instruction file (CLAUDE.md / AGENTS.md, marked-region writer).
8. Final summary to user.

A short appendix at the end describes the **marked-region writer algorithm** and **symlink creation algorithm** in prose, so the agent has unambiguous reference logic for steps 6 and 7.

---

## `create-videowright` Module

### Module breakdown (~100 LOC across two files)

```js
// bin/cli.js — shebang entry point (imports and calls main())
// bin/index.js — all logic, cleanly importable by tests

main()
  ├── detectAgents()              → Promise<{ claude: bool, codex: bool, opencode: bool }>
  ├── chooseAgent(detected)       → 'claude' | 'codex' | 'opencode' | null
  │      ├── 0 detected → null (caller prints fallback)
  │      ├── 1 detected → that one
  │      └── 2+ detected → readline prompt, return choice
  ├── handoffCommand(agent, url)  → { cmd: string, args: string[] }
  └── spawnAgent(cmd, args)       → child_process.spawn(..., { stdio: 'inherit' })
```

### `detectAgents()`

Cross-platform agent detection. Don't use shell `which`. Instead, use async `child_process.spawn(<bin>, ['--version'], { stdio: 'ignore' })` wrapped in a promise, and probe all three agents in parallel via `Promise.all`. Each probe resolves to `true` if the process exits with code 0, `false` otherwise. This is non-blocking and naturally parallel, matching the "detects all three in parallel" intent — `spawnSync` in a loop would be sequential.

Falls back to `false` on any spawn error. Doesn't distinguish "not installed" from "broken install" — same effect either way.

### `chooseAgent(detected)`

- 0 detected: return `null`. `main()` prints the paste-prompt fallback and exits 0.
- 1 detected: return that one without prompting.
- 2+ detected: use Node's built-in `readline` to ask:
  ```
  Multiple coding agents detected. Which would you like to install Videowright into?
    1) Claude Code
    2) Codex
    3) opencode
  Enter 1, 2, or 3 [1]:
  ```
  Default to the first detected (in priority order: claude > codex > opencode).

No external prompt library — `readline` is built-in.

### `handoffCommand(agent, url)`

Returns the exact CLI invocation per agent (researched and confirmed):

| Agent | Command |
|---|---|
| Claude Code | `claude` `<prompt>` |
| Codex | `codex` `<prompt>` |
| opencode | `opencode` `--prompt` `<prompt>` |

The `<prompt>` is identical for all three:

```
Install Videowright using these instructions: https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md
```

(Same URL as the Readme paste; single source of truth.)

### `spawnAgent(cmd, args)`

```js
const child = child_process.spawn(cmd, args, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
```

Inherits stdio so the agent's interactive UI takes over the terminal. `npm init` exits with the agent's exit code.

### Fallback prompt

If `chooseAgent` returns `null`:

```
We couldn't find Claude Code, Codex, or opencode installed.
Install one of those, or paste this into your coding agent of choice:

  Install Videowright using these instructions: <URL>
```

Print and exit 0 (not an error — this is a successful informational outcome).

---

## Algorithms (executed by the agent per `INSTALL.md`)

These are documented in `INSTALL.md` for the agent to perform. Not implemented in code.

### Marked-region writer

Given a target file path and a `content` string:

1. If file does not exist: write a new file containing exactly:
   ```
   <!-- videowright:start -->
   <auto-managed note>
   <content>
   <!-- videowright:end -->
   ```
2. If file exists, search for the regex `/<!-- videowright:start -->[\s\S]*?<!-- videowright:end -->/`:
   - **Match found**: replace the matched substring with the new marked region (idempotent re-install).
   - **No match**: append the marked region at the end of the file. If the existing file does not end with `\n`, prepend `\n\n` to the appended block; otherwise prepend `\n`.
3. Never modify content outside the markers.

The "auto-managed note" inside the markers reads:
> *Auto-managed by Videowright installer. Edits inside this block will be overwritten on re-install. Add your own context outside the markers.*

### Symlink creator (per skill install)

Given source path (e.g., `.claude/skills/videowright`) and target path (`node_modules/videowright/skill/`):

1. Compute target as a path **relative to the source's parent directory**. Example: source `videos/.claude/skills/videowright` → relative target `../../../node_modules/videowright/skill/` (when `videos/` is the project root).
2. If source already exists:
   - If it's a symlink pointing to the correct relative target: leave it (idempotent).
   - If it's a symlink pointing elsewhere: ask the user before replacing.
   - If it's a real directory or file: ask the user before replacing.
3. If absent: create the symlink (creating intermediate directories like `.claude/skills/` first).

Same logic applies to both `.claude/skills/videowright` and `.agents/skills/videowright`.

### Verification (used in `setup.md`)

The "Verify install" step in `setup.md` performs:

1. Read project root `package.json`. Confirm `videowright` is in `dependencies` or `devDependencies`. If not → fail.
2. Check `node_modules/videowright/` exists as a directory. If not → fail (means deps weren't installed after `package.json` was edited).
3. Read `CLAUDE.md` (if exists) or `AGENTS.md` (otherwise). Confirm it contains `<!-- videowright:start -->`. If neither file exists or no marker is found → fail.

On any failure, output:
> Videowright is not fully installed in this project. Visit https://github.com/scosman/videowright for install instructions.

Then stop further setup work.

---

## Cross-Platform Considerations

- **macOS / Linux**: full support. Symlinks just work.
- **Windows**: best-effort.
  - Symlinks require admin or developer mode. If symlink creation fails, the install Markdown instructs the agent to:
    > Symlink creation failed. On Windows, this usually means Developer Mode is off. Either enable Developer Mode (Settings → Privacy & security → For developers → Developer Mode) and re-run, or create the link manually with `mklink /D .claude\skills\videowright node_modules\videowright\skill` (run from an admin terminal). Then verify by running setup again.
  - `create-videowright` itself works fine on Windows (Node's `child_process.spawn` is cross-platform; we don't shell out to `which`).
- WSL is treated as Linux.

---

## Error Handling

| Error | Behavior |
|---|---|
| `INSTALL.md` flow: no npm/pnpm | Stop with: "Videowright requires npm or pnpm. Install one and try again." |
| `INSTALL.md` flow: package install fails | Surface the error to the user verbatim; stop. Re-running install picks up where it left off. |
| `INSTALL.md` flow: symlink creation fails | macOS/Linux: surface error and stop. Windows: see cross-platform section. |
| `create-videowright`: agent CLI exits non-zero | `npm init` exits with the same code. User sees agent's own error output. |
| `create-videowright`: spawn fails (binary not on PATH despite earlier detection) | Print the spawn error and exit 1. Suggest re-running. |
| Verification fail in `setup.md` | Stop, point to GitHub homepage. No repair attempt. |

No retries, no fallbacks beyond what's listed. The failure modes here are user-environment problems; the right move is a clear error message, not auto-magic.

---

## Testing Strategy

### `create-videowright` (automated, vitest)

Unit tests covering:

- **`detectAgents`**: mock `child_process.spawn` to simulate each combination of installed/missing agents. Verify return shape.
- **`chooseAgent`**: feed it various detection results. For 2+ detected, mock `readline` input; verify the right agent is returned for each input.
- **`handoffCommand`**: parametrized — for each of the three agents, assert `cmd` and `args` are exactly the documented strings.
- **No-agent fallback**: capture stdout, verify the fallback message contains the URL.

Test framework: vitest (matches the rest of the monorepo). Runs in CI via the existing root `npm test` script (extend `workspaces` so the new package is picked up).

### `INSTALL.md` (manual eval)

Manual eval matrix — run before each release, document results in a checklist file (e.g., `specs/projects/installer/manual_eval.md`):

| Scenario | Claude Code | Codex | opencode |
|---|---|---|---|
| Empty folder | ✓ | ✓ | ✓ |
| Folder with README + .gitignore (innocent files) | ✓ | ✓ | ✓ |
| Folder with another project (sub-folder fallback) | ✓ | ✓ | ✓ |
| Already-installed Videowright project (idempotent re-install) | ✓ | ✓ | ✓ |
| `npm init videowright` with 1 agent installed | ✓ | ✓ | ✓ |
| `npm init videowright` with multiple agents installed | ✓ | ✓ | ✓ |
| `npm init videowright` with no agents installed | (fallback message verified) |

Each row exercises agent detection, package-manager pick, symlink creation, instruction-file write, and final state.

No automated linter for `INSTALL.md` itself in v1 — over-engineering for one file.

### `setup.md` verification (manual)

Add a manual test row: run `setup.md`'s verify step against (a) a fully-installed project (passes), (b) a project missing `node_modules/`, (c) a project missing the marked region. Each fail path should print the same redirect message.

---

## Dev Dependencies in User Projects

Mirrors the core repo's `packages/lib/package.json`:

| Tool | Why |
|---|---|
| `typescript` | Type-checking for segments and config. |
| `@biomejs/biome` | Lint + format (single tool, matches repo). |
| `vitest` | Unit tests for segment helpers. |
| `@playwright/test` | E2e/browser tests for video output. |
| `vite` | Dev server (already a runtime dep of `videowright`, but listed for clarity). |

Exact versions: pin to whatever the core `videowright` package itself requires at install time. The install Markdown reads `node_modules/videowright/package.json` after Step 4's package install and uses those versions for any deps not already chosen.

Post-install: `npx playwright install` for browser binaries. Document in `INSTALL.md` as a final sub-step of Step 4.

---

## Out of Scope (Architectural)

- Auto-update mechanism for `INSTALL.md` (the user's local copy doesn't need to stay in sync with `main` — re-running install via the GitHub URL handles that).
- Telemetry on installs.
- Custom agent support beyond Claude Code / Codex / opencode.
- Automated end-to-end tests of `INSTALL.md` flow against real agents (would require running the agents in CI; not justifiable for v1).

---

## Open Questions

None at architecture level. All decisions made.
