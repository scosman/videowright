---
status: complete
---

# Phase 2: `create-videowright` initializer (P2)

## Overview

Add the `create-videowright` npm package so users can run `npm init videowright` to detect installed coding agents, pick one, and hand off the install prompt to that agent. The package is plain ESM Node with zero dependencies, ~100 LOC, and lives in `packages/create-videowright/`.

## Steps

1. **Add `packages/create-videowright` to monorepo workspaces** -- update root `package.json` `workspaces` array to include `"packages/create-videowright"`.

2. **Create `packages/create-videowright/package.json`** -- name `create-videowright`, `type: "module"`, `bin: { "create-videowright": "./bin/cli.js" }`, no runtime dependencies. Add `vitest` as a devDependency for tests.

3. **Create `packages/create-videowright/bin/cli.js`** -- thin shebang entry point (`#!/usr/bin/env node`) that imports and calls `main()` from `index.js`.

4. **Create `packages/create-videowright/bin/index.js`** -- pure library (~100 LOC) containing:
   - `INSTALL_URL` constant pointing to the GitHub INSTALL.md URL.
   - `INSTALL_PROMPT` constant with the install prompt string.
   - `detectAgents()` -- uses async `child_process.spawn(<bin>, ['--version'], { stdio: 'ignore' })` via `Promise.all` to probe `claude`, `codex`, `opencode` in parallel. Returns `Promise<{ claude: bool, codex: bool, opencode: bool }>`.
   - `chooseAgent(detected)` -- 0 detected returns `null`; 1 detected returns that agent; 2+ detected prompts via `readline` with numbered list, default to first in priority order (claude > codex > opencode).
   - `handoffCommand(agent)` -- returns `{ cmd, args }` per architecture spec:
     - claude: `['claude', [prompt]]`
     - codex: `['codex', [prompt]]`
     - opencode: `['opencode', ['--prompt', prompt]]`
   - `spawnAgent(cmd, args)` -- `child_process.spawn(cmd, args, { stdio: 'inherit' })`, exits with child's exit code.
   - `main()` -- orchestrates: detect -> choose -> handoff or fallback message.

5. **Create `packages/create-videowright/vitest.config.js`** -- minimal vitest config for the package.

6. **Create `packages/create-videowright/test/detect-agents.test.js`** -- unit tests for `detectAgents`:
   - Mock `child_process.spawn`. Test all combos: none installed, all installed, only claude, only codex, only opencode, spawn error fallback, parallel execution.

7. **Create `packages/create-videowright/test/choose-agent.test.js`** -- unit tests for `chooseAgent`:
   - 0 detected -> returns null.
   - 1 detected (each agent) -> returns that agent key.
   - 2+ detected -> mock readline, verify correct agent returned for each user input; verify default handling.

8. **Create `packages/create-videowright/test/handoff-command.test.js`** -- parametrized tests for `handoffCommand`:
   - For each of claude, codex, opencode: assert exact `cmd` and `args` strings match the architecture spec.

9. **Create `packages/create-videowright/test/main.test.js`** -- integration-style tests for `main()`:
   - No agents: captures stdout, verifies fallback message contains the URL.
   - One agent: verifies spawn called with correct command.
   - Spawn failure: verifies error handling and exit code.
   - Non-interactive stdin: verifies graceful fallback to first detected agent.

10. **Update root `package.json` test script** -- ensure `npm test` at root also runs the create-videowright tests (extend workspaces test coverage).

## Tests

- `detect-agents.test.js`: All combinations of installed/missing agents via spawn mocking, parallel execution verification
- `choose-agent.test.js`: Zero/one/multiple detected agents, readline prompt mocking for multi-agent case
- `handoff-command.test.js`: Parametrized verification of exact CLI commands per agent
- `main.test.js`: End-to-end flow for no-agent fallback, single-agent auto-handoff, and spawn error handling
