---
status: complete
---

# Functional Spec: Installer

## Goal

An "agent-native" installer for Videowright. The user pastes a single line into their coding agent; the agent reads a Markdown installation script and walks the user through a CLI-installer-style flow to bring up a working Videowright project.

Two entry points:

1. **Readme paste** (primary): the user copies a one-line prompt from the Readme into their coding agent. The prompt links to the install Markdown file.
2. **`npm init videowright`** (secondary, P2 if hard): the user runs the npm initializer, picks a target agent, and the initializer hands off to that agent with the same paste prompt.

Both paths lead to the same install Markdown file and the same install flow.

## Non-Goals (Out of Scope)

- Uninstall flow.
- Updating `videowright` to a new version in an existing project (just `npm install videowright@latest` is the user's responsibility).
- CI configuration.
- Agents other than Claude Code, Codex, and opencode (e.g., Cursor, Cline). The Markdown lists supported agents; non-supported agents are explicitly unsupported.
- Validating that the Videowright skill itself is loaded (the skill loader's own gate already implies this — re-checking is pointless).

---

## Entry Point 1: Readme paste

The Readme has an "Install" section near the top with a copy-paste block:

```
Paste this into your coding agent:

> Install Videowright using these instructions:
> https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md
```

The link always points to `main` on GitHub. Versioned/tagged URLs are out of scope until releases exist.

The exact path of the install Markdown inside the repo is determined in architecture. The functional contract is: the file is fetchable from a stable URL on `main`, **and** is also bundled into the published `videowright` npm package (so the install flow can reference local copies after step "package install" completes; offline re-runs after install also work).

## Entry Point 2: `npm init videowright`

A lightweight npm initializer. Flow:

1. Detect installed agents (see *Agent detection*).
2. If 0 supported agents installed: print a warning and the paste prompt:
   > We couldn't find Claude Code, Codex, or opencode installed. Paste this into your coding agent of choice:
   > `Install Videowright using these instructions: <URL>`
3. If 1 supported agent installed: hand off directly to that agent (e.g., `claude -p "Install Videowright using these instructions: <URL>"`). No questions asked.
4. If 2+ supported agents installed: ask the user which to install into. Hand off to their choice.

The initializer itself does no install work. It only routes to the right agent. All install logic lives in the install Markdown.

P2 caveat: if implementing the initializer turns out to be hard (e.g., npm init quirks, CLI handoff edge cases), defer it. The Readme paste flow is the v1 must-have.

---

## Install Flow (the script the agent follows)

The install Markdown is a single file (no splits, no references to sibling files). The agent reads it top-to-bottom and executes each step. The Markdown is written as a prescriptive script — exact wording for prompts, exact order of operations — so the install feels consistent across different agent/model combinations.

### Step 1: Folder check

Goal: ensure Videowright owns this folder. It can be a sub-folder of a larger repo, but it should not coexist in the same folder with another project.

The agent inspects the current working directory and uses judgment:

- **Empty folder, or only "innocent" files** (e.g., `README.md`, `LICENSE`, `.gitignore`, `.git/`, an empty `package.json`): proceed without asking. This is the happy path.
- **Already a Videowright project** (presence of `videowright.config.ts` and/or `videowright` in `package.json` deps): proceed; this is a re-install / repair.
- **Has other project content** (source code from another framework, populated `package.json` with unrelated deps, etc.): stop and ask the user:

  > This folder already contains another project. Videowright should own its own folder. Options:
  > 1. Cancel and `cd` into a clean folder.
  > 2. Install into a sub-folder of this project (recommended sub-folder name: `videos/`).
  >
  > Which would you like?

  If they pick (2), confirm/adjust the sub-folder name (default `videos/`), `mkdir` it, and `cd` into it for the rest of the install. The instruction file (CLAUDE.md/AGENTS.md) is still written to the **root** of the larger project (see *Instruction file*) — only the Videowright project tree lives in the sub-folder.

  If they pick (1), stop the install.

The agent should not install in parallel with another project at the same folder level.

### Step 2: Agent detection

Run:

```bash
which claude && which codex && which opencode
```

(or the equivalent. The agent may need to run them separately because `&&` short-circuits.)

Record which agents are installed. The "current agent" is whichever the user pasted the install prompt into; that one is implicitly installed.

Decision:

- **Only one supported agent installed (the current one)**: proceed without asking. Install the skill+instruction-file for that one agent only.
- **Multiple supported agents installed**: ask the user:
  > I see you have Claude Code, Codex, and opencode installed. Should I set up Videowright for all of them, or just <current agent>?
  > 1. Just <current agent>.
  > 2. All installed agents.
  >
  > Which?

  Default suggestion is (1) — just the current agent. The user can re-run install in another agent later if they change their mind.

### Step 3: Package manager detection and selection

Detection priority:

1. **Lockfile**: if `package-lock.json` exists → npm. If `pnpm-lock.yaml` exists → pnpm. Use it without asking.
2. **`which` check**: if no lockfile, run `which npm` and `which pnpm`.
   - If only one is installed, use it without asking.
   - If both installed, ask:
     > Which package manager do you want to use? [npm] or [pnpm]?
     >
     > Default: npm.
   - If neither, stop with a clear error: "Videowright requires npm or pnpm. Install one and try again."

Yarn and Bun are not supported in v1. If the user has only yarn/bun and no npm/pnpm, the install errors out with the same message.

### Step 4: Package install

Install Videowright and its toolchain:

```
<pm> install videowright
<pm> install --save-dev <toolchain>
```

The toolchain mirrors the **core Videowright repo's own setup**: TypeScript, Biome (lint+format), Vitest (unit tests), Playwright (e2e/browser tests). Same package versions where reasonable. Architecture pins exact versions and resolves any platform-specific install steps (e.g., `npx playwright install` for browser binaries).

Rationale: this is opinionated. Videowright projects assume the agent will write tests, type-check, and lint as part of producing video segments — and using the same toolchain as the core repo means the skill's guidance ("run the project's checks") works consistently. The user can remove anything they don't want afterward.

Run `<pm> install` (or equivalent) to materialize `node_modules/`.

If a needed dev dependency is already present at a compatible version, skip re-installing it. If present at an incompatible version, warn the user and let them decide whether to upgrade.

### Step 5: Skill installation (symlinks)

Always create both of these symlinks at the install root (the Videowright project root, which is the sub-folder if Step 1 chose sub-folder mode):

- `.claude/skills/videowright` → `node_modules/videowright/skill/` (relative)
- `.agents/skills/videowright` → `node_modules/videowright/skill/` (relative)

Together these cover all three agents:

| Agent | Reads from |
|---|---|
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` (also `.codex/skills/`, but `.agents/` is sufficient) |
| opencode | both `.claude/skills/` and `.agents/skills/` |

Always install both symlinks regardless of which agent(s) the user is installing for. This keeps install idempotent and future-proof: if the user later installs another supported agent, the skill is already discoverable.

If the symlinks already exist and point to the right target, leave them. If they exist but point elsewhere, ask the user before replacing.

The directories `.claude/skills/` and `.agents/skills/` are created if missing.

### Step 6: Instruction file (CLAUDE.md and/or AGENTS.md)

For each agent the user opted to install for, write/update its instruction file at the **root of the project** (the larger repo's root if Step 1 chose sub-folder mode, otherwise the install root):

| Agent | Instruction file |
|---|---|
| Claude Code | `CLAUDE.md` |
| Codex | `AGENTS.md` |
| opencode | `AGENTS.md` (opencode also reads `CLAUDE.md` as fallback) |

**Multi-agent rule**: if the user installs for multiple agents, write the **same content** into each required file (i.e., possibly both `CLAUDE.md` and `AGENTS.md` end up with identical Videowright sections). We do not symlink between these files — we don't own them, and symlinking is invasive.

**Marked region**: the Videowright content lives inside an explicitly delimited region:

```
<!-- videowright:start -->
... auto-managed Videowright content ...
<!-- videowright:end -->
```

Write rules:

- File doesn't exist → create it with just the marked region.
- File exists, no marked region → **append** the marked region at the end.
- File exists, marked region present → **replace** the contents between the markers (idempotent re-install).
- Content **outside** the marked region is never touched.

Users are expected to add their own project context outside the markers. Anything inside the markers is auto-managed and may be overwritten on re-install.

### Step 6a: Instruction file content

The marked-region content is concise. Sections:

1. **What this project is** — one line, parameterized for sub-folder mode.

   Root-install:
   > This project is a [Videowright](https://github.com/scosman/videowright) project — a library for composing animated explainer videos in HTML/CSS/JS.

   Sub-folder install (the instruction file is at the parent repo's root, but Videowright lives in `<subfolder>/`):
   > The folder `<subfolder>/` in this project is a [Videowright](https://github.com/scosman/videowright) project — a library for composing animated explainer videos in HTML/CSS/JS.

2. **Skill pointer** — explicit reference even though all three agents auto-discover skills (auto-discovery works, but an explicit pointer reinforces priority and serves as documentation):

   > For any video-related work, use the `videowright` skill (loaded automatically from `.claude/skills/videowright` or `.agents/skills/videowright`). It has full guidance on segments, voiceovers, styles, and the dev server.

3. **Key paths** — quick orientation:

   > - `videowright.config.ts` — project config and default style.
   > - `videos/` — one folder per video.
   > - `styles/` — design tokens and shared styling.
   > - `segments/`, `components/`, `transitions/` — shared building blocks.

The exact wording is finalized once and lives in the install Markdown verbatim (no agent-side rewriting). This keeps behavior consistent across agents/models.

### Step 7: Continue to setup

The agent reports a terse confirmation and chains directly into setup:

> Videowright installed. Now configuring the project.

The agent then immediately loads `references/setup.md` and continues without waiting for user input. Install → setup → new_video is a single unbroken chain.

---

## Style and tone of the install Markdown

The install Markdown should read like a top-tier CLI installer's transcript — but written for an agent to perform.

- Prompts to the user are **exact strings**, not "ask the user something like…". Example: `Which package manager do you want to use? [npm] or [pnpm]?` is the literal prompt the agent says.
- Defaults are explicit (`[npm]` indicates default).
- Steps are numbered and short.
- Where the agent has to make judgment (e.g., what counts as an "innocent" file in Step 1), the Markdown gives criteria, not just freedom.

This is to maximize consistency across different agents and models. The Markdown is the script; the agent is the actor.

---

## Setup.md integration (existing skill change)

Add a new **first** step to `packages/lib/skill/references/setup.md`:

### "Verify install" step

Before any other setup work, verify these signals:

1. `videowright` is in the project's `package.json` `dependencies` (or `devDependencies`).
2. `node_modules/videowright/` exists (i.e., `<pm> install` was actually run after the package was added to `package.json`).
3. The instruction file (`CLAUDE.md` or `AGENTS.md`, whichever exists) contains a `<!-- videowright:start -->` marked region.

If any of those checks fail, stop the setup and tell the user:

> Videowright is not fully installed in this project. Visit https://github.com/scosman/videowright for install instructions.

Do **not** check for the skill symlinks themselves. The setup file is loaded *via* the skill, so by definition the skill is reachable — re-checking is pointless.

The verification step doesn't attempt repair. It points the user at the homepage and stops; the user re-runs the install (paste prompt or `npm init videowright`).

---

## Edge cases

| Case | Behavior |
|---|---|
| Re-install over an existing Videowright project | Idempotent. Symlinks left alone if correct. Instruction file marked-region replaced. Package install becomes a no-op or a version bump. |
| `package.json` doesn't exist | Run `<pm> init -y` (or equivalent) before installing. |
| Existing `CLAUDE.md`/`AGENTS.md` with no marked region | Append at the end. |
| Existing marked region with content the user added inside | Replaced. (We document in the marked region itself: "Auto-managed by Videowright. Add your own context outside this block.") |
| User has only yarn or bun | Stop with clear error: "Videowright requires npm or pnpm." |
| User has none of the supported agents (npm init flow) | Print warning + paste prompt; do not abort silently. |
| Symlink exists pointing to wrong target | Ask before replacing. |
| Sub-folder install: instruction file is at parent root | Symlinks and `node_modules/` are in the sub-folder; instruction file is at the parent root with adjusted path text. |
| User cancels mid-install | Leave whatever was already done in place. Re-running the install picks up where it left off (idempotent). |

---

## Constraints

- **Cross-agent consistency**: the install Markdown must produce equivalent results regardless of which agent the user pastes into. Same questions, same defaults, same files written.
- **Idempotency**: re-running the install is safe.
- **Minimal magic**: no shell scripts, no curl-piping, no auto-detection that surprises the user. The agent does the work, the user sees each step.
- **No edits to user-owned files outside the marked region**: the installer never touches arbitrary content in `CLAUDE.md`, `AGENTS.md`, or `package.json` (beyond standard `<pm> install` behavior on the deps).

---

## Open questions deferred to architecture

- Exact path of the install Markdown inside the repo / npm package.
- Exact dev-dependency versions and any post-install steps (e.g., `npx playwright install` for browser binaries). Toolchain choices (TypeScript, Biome, Vitest, Playwright) are fixed by mirroring the core repo.
- How the marked-region writer handles edge cases like Windows line endings, BOMs, etc. (low-priority — most users on macOS/Linux).
- `npm init videowright` implementation details (initializer package layout, CLI handoff command per agent).
