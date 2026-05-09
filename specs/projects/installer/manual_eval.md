---
status: complete
---

# Manual Eval: Installer

Evaluation of `INSTALL.md`, `create-videowright`, and `setup.md` verification against the test matrix from architecture.md.

The **Claude Code** column is fully evaluated. The **Codex** and **opencode** columns are templates for the user to fill in during a future manual run -- those agents cannot be driven programmatically from Claude Code. Rows marked "Pending" do not block phase completion; they are ready-to-use checklists for the next manual pass.

**Eval date:** 2026-05-09
**Evaluator:** Claude Code (automated where possible)
**Environment:** macOS (Darwin 24.6.0), Node v24, npm + pnpm available, all three agents installed (claude, codex, opencode)

---

## INSTALL.md Eval Matrix

### Scenario 1: Empty folder

| Step | Claude Code | Codex | opencode |
|---|---|---|---|
| Step 1 (Folder check) | PASS -- rule 1 fires, proceeds without asking | Pending | Pending |
| Step 2 (Agent detection) | PASS -- all three agents detected; multi-agent prompt wording is correct | Pending | Pending |
| Step 3 (Package manager) | PASS -- both npm and pnpm detected; prompt fires correctly | Pending | Pending |
| Step 4 (Package install) | PASS -- `npm init -y` creates package.json; `npm install videowright` succeeds (tested with local install; npm registry install blocked pre-publish); version pinning from core devDependencies works | Pending | Pending |
| Step 5 (Symlinks) | PASS -- both `.claude/skills/videowright` and `.agents/skills/videowright` created with correct relative path `../../node_modules/videowright/skill/`; symlinks resolve to actual files | Pending | Pending |
| Step 6 (Instruction file) | PASS -- CLAUDE.md created with correct marked-region content | Pending | Pending |
| Step 7 (Final report) | PASS -- wording matches spec | Pending | Pending |

### Scenario 2: Folder with README + .gitignore (innocent files)

| Step | Claude Code | Codex | opencode |
|---|---|---|---|
| Step 1 (Folder check) | PASS -- README.md and .gitignore are explicitly listed as innocent files in rule 1; proceeds without asking | Pending | Pending |
| Steps 2-7 | PASS -- identical to empty folder scenario | Pending | Pending |

### Scenario 3: Folder with another project (sub-folder fallback)

| Step | Claude Code | Codex | opencode |
|---|---|---|---|
| Step 1 (Folder check) | PASS -- populated package.json with express/react deps triggers rule 3; exact prompt shown; sub-folder `videos/` created | Pending | Pending |
| Step 5 (Symlinks) | PASS -- relative path `../../node_modules/videowright/skill/` from `videos/.claude/skills/videowright` resolves correctly | Pending | Pending |
| Step 6 (Instruction file) | PASS -- instruction file written to parent directory (repo root, not sub-folder); sub-folder content template used with `<subfolder>/` prefix on key paths | Pending | Pending |

**Note:** When `<subfolder>` is the default `videos/`, the key path for per-video folders becomes `videos/videos/` which is technically correct but potentially confusing to users. This is a naming collision, not a bug -- users can choose a different subfolder name.

### Scenario 4: Already-installed Videowright project (idempotent re-install)

| Step | Claude Code | Codex | opencode |
|---|---|---|---|
| Step 1 (Folder check) | PASS -- `videowright` in package.json deps triggers rule 2; proceeds without asking (re-install path) | Pending | Pending |
| Step 5 (Symlinks) | PASS -- existing symlinks with correct targets are left alone (idempotent) | Pending | Pending |
| Step 6 (Instruction file) | PASS -- existing marked region detected and replaced (idempotent); content outside markers untouched | Pending | Pending |

---

## create-videowright Eval Matrix

### Scenario: No agents installed (fallback message)

| Check | Result |
|---|---|
| Fallback message printed | PASS (verified via automated test: `prints_fallback_when_no_agents_detected`) |
| Message contains install URL | PASS |
| Exit code 0 | PASS |

### Scenario: 1 agent installed

| Agent | Result |
|---|---|
| Claude Code only | PASS (verified via automated test: `spawns_agent_when_one_detected`) -- spawns `claude <prompt>` |
| Codex only | PASS (verified via automated test: `spawns_codex_when_only_codex_detected`) -- spawns `codex <prompt>` |
| opencode only | PASS (verified via automated test: `spawns_opencode_with_prompt_flag_when_only_opencode_detected`) -- spawns `opencode --prompt <prompt>` |

### Scenario: Multiple agents installed

| Check | Result |
|---|---|
| Selection prompt appears | PASS -- verified live; shows numbered list of detected agents |
| Default is first detected (Claude Code) | PASS -- empty input returns `claude` |
| Non-interactive stdin fallback | PASS (verified via automated test: `falls_back_gracefully_when_readline_rejects`) -- falls back to first detected agent |

### CLI argument verification

| Agent | Command format | Verified |
|---|---|---|
| Claude Code | `claude <prompt>` (positional arg) | PASS -- `claude --help` confirms `[prompt]` positional argument |
| Codex | `codex <prompt>` (positional arg) | PASS -- `codex --help` confirms `[PROMPT]` positional argument |
| opencode | `opencode --prompt <prompt>` | PASS -- `opencode --help` confirms `--prompt` flag |

### Automated test suite

- **36 tests, all passing** across 4 test files (detect-agents, choose-agent, handoff-command, main)

---

## setup.md Verification Eval

### State (a): Fully-installed project

| Check | Result |
|---|---|
| `videowright` in package.json | PASS |
| `node_modules/videowright/` exists | PASS |
| CLAUDE.md contains `<!-- videowright:start -->` | PASS |
| Overall: verification passes | PASS |

### State (b): Project missing node_modules/

| Check | Result |
|---|---|
| `videowright` in package.json | PASS |
| `node_modules/videowright/` exists | FAIL (expected) |
| Overall: verification correctly fails | PASS |
| Error message matches spec | PASS |

### State (c): Project missing marked region in instruction file

| Check | Result |
|---|---|
| `videowright` in package.json | PASS |
| `node_modules/videowright/` exists | N/A (checked before this) |
| CLAUDE.md contains `<!-- videowright:start -->` | FAIL (expected -- CLAUDE.md exists but has no markers) |
| Overall: verification correctly fails | PASS |
| Error message matches spec | PASS |

---

## Pending: Codex and opencode Manual Runs

The following scenarios require manual testing by a user in each agent's native environment. Claude Code cannot drive Codex or opencode directly.

### Codex checklist

- [ ] **Empty folder**: Paste install prompt into Codex in an empty directory. Verify all steps complete correctly.
- [ ] **Innocent files**: Paste install prompt into Codex in a directory with just README.md and .gitignore. Verify Step 1 proceeds without asking.
- [ ] **Sub-folder fallback**: Paste install prompt into Codex in a directory with another project's package.json. Verify it prompts for sub-folder install.
- [ ] **Re-install**: Run install a second time in an already-installed project. Verify idempotency -- symlinks unchanged, marked region replaced, no errors.
- [ ] **AGENTS.md written**: Verify Codex install creates/updates AGENTS.md (not CLAUDE.md).

### opencode checklist

- [ ] **Empty folder**: Paste install prompt into opencode in an empty directory. Verify all steps complete correctly.
- [ ] **Innocent files**: Paste install prompt into opencode in a directory with just README.md and .gitignore. Verify Step 1 proceeds without asking.
- [ ] **Sub-folder fallback**: Paste install prompt into opencode in a directory with another project's package.json. Verify it prompts for sub-folder install.
- [ ] **Re-install**: Run install a second time in an already-installed project. Verify idempotency.
- [ ] **AGENTS.md written**: Verify opencode install creates/updates AGENTS.md.

### Agent-specific concerns noticed during Claude Code eval

- **Codex `which` behavior**: INSTALL.md uses `which` on macOS/Linux and `where` on Windows. Codex runs in a sandbox -- verify `which` is available in the Codex sandbox.
- **opencode `which` behavior**: Same concern -- verify `which` is available in opencode's execution environment.
- **pnpm init -y**: The `-y` flag may not be recognized by all pnpm versions. Agents should interpret `<pm> init -y` correctly for the chosen package manager. `pnpm init` works without flags in modern versions.
- **Playwright browser download**: `npx playwright install` downloads large binaries (~200-400 MB). Verify this works within each agent's timeout and sandbox constraints.

---

## Issues Found

No bugs found in INSTALL.md, create-videowright, or setup.md verification during this eval pass.

### Minor observations (not bugs)

1. **Confusing path with default subfolder name**: When using the default subfolder name `videos/`, the key path for per-video folders in the instruction file becomes `videos/videos/`. This is technically correct but reads awkwardly. Users who choose a different subfolder name (e.g., `video-content/`) avoid this. No action needed.

2. **Pre-publish state**: `npm install videowright` fails with a 404 because the package is not yet published to npm. This is expected for pre-release. The INSTALL.md flow works correctly when tested with a local install.

---

## Summary

| Area | Claude Code | Codex | opencode |
|---|---|---|---|
| INSTALL.md (empty folder) | PASS | Pending | Pending |
| INSTALL.md (innocent files) | PASS | Pending | Pending |
| INSTALL.md (sub-folder) | PASS | Pending | Pending |
| INSTALL.md (re-install) | PASS | Pending | Pending |
| create-videowright (no agents) | PASS | -- | -- |
| create-videowright (1 agent) | PASS | -- | -- |
| create-videowright (multi agent) | PASS | -- | -- |
| setup.md verify (installed) | PASS | Pending | Pending |
| setup.md verify (no node_modules) | PASS | Pending | Pending |
| setup.md verify (no markers) | PASS | Pending | Pending |
