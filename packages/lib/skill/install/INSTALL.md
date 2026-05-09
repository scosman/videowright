# Install Videowright

*This file is an install script for coding agents (Claude Code, Codex, opencode). Read it top-to-bottom and execute each step.*

You are installing Videowright -- a library for composing animated explainer videos in HTML/CSS/JS. Follow these steps in order. Do not skip steps. Do not reorder.

Each step includes exact prompts to show the user. Use them verbatim -- do not rephrase.

---

## Step 1: Folder check

Videowright expects to own its folder. It can live in a sub-folder of a larger repo, but it should not share a folder with another project.

Inspect the current working directory. Apply these rules in order:

1. **Empty folder, or only innocent files** (`README.md`, `LICENSE`, `.gitignore`, `.git/`, an empty or near-empty `package.json` with no meaningful dependencies): proceed without asking. This is the happy path.

2. **Already a Videowright project** (`videowright.config.ts` exists, or `package.json` has `videowright` in `dependencies` or `devDependencies`): proceed without asking. This is a re-install or repair.

3. **Has other project content** (source code, populated `package.json` with unrelated dependencies, framework config files, etc.): stop and ask the user exactly:

   > This folder already contains another project. Videowright should own its own folder. Options:
   > 1. Cancel and `cd` into a clean folder.
   > 2. Install into a sub-folder of this project (recommended sub-folder name: `videos/`).
   >
   > Which would you like?

   - If they pick **1**: stop the install. Tell the user to `cd` into a clean folder and re-run.
   - If they pick **2**: confirm or adjust the sub-folder name (default `videos/`). Create the directory if it does not exist. `cd` into it for the remainder of the install. Remember: the instruction file (Step 6) is written to the **root** of the larger project, not the sub-folder.

---

## Step 2: Agent detection

Detect which supported coding agents are installed. Run these commands separately (since `&&` short-circuits on failure). On macOS/Linux use `which`; on Windows use `where`:

```bash
# macOS / Linux
which claude
which codex
which opencode

# Windows (if not using WSL)
where claude
where codex
where opencode
```

The agent you are running in is implicitly installed -- include it in the detected set even if `which` fails (e.g., it may not be on `PATH` inside the sandbox).

**Decision:**

- **Only one supported agent installed** (the current one): proceed without asking. You will install the skill and instruction file for this agent only.

- **Multiple supported agents installed**: ask the user exactly:

  > I see you have [list of detected agents] installed. Should I set up Videowright for all of them, or just [current agent]?
  > 1. Just [current agent].
  > 2. All installed agents.
  >
  > Which?

  Default suggestion is **1** (just the current agent). The user can re-run install in another agent later.

Record the chosen set of agents for Step 6.

---

## Step 3: Package manager detection

Detect the package manager. Apply these rules in order:

1. **Lockfile exists**: `package-lock.json` -> use `npm`. `pnpm-lock.yaml` -> use `pnpm`. If `yarn.lock` or `bun.lockb` exists (but no npm/pnpm lockfile), warn the user:
   > This project uses yarn/bun, which Videowright does not support. Would you like to proceed with npm or pnpm instead?
   If they agree, continue to step 2 to pick npm or pnpm. If not, stop.

2. **No lockfile -- check availability** (use `which` on macOS/Linux, `where` on Windows):
   ```bash
   # macOS / Linux
   which npm
   which pnpm

   # Windows (if not using WSL)
   where npm
   where pnpm
   ```
   - Only one installed: use it without asking.
   - Both installed: ask the user exactly:
     > Which package manager do you want to use? [npm] or [pnpm]?
     >
     > Default: npm.
   - Neither installed: stop with this exact message:
     > Videowright requires npm or pnpm. Install one and try again.

Record the chosen package manager as `<pm>` for the remaining steps.

---

## Step 4: Package install

### 4a: Ensure package.json exists

If `package.json` does not exist in the current directory, initialize one:

```bash
<pm> init -y
```

### 4b: Install Videowright

```bash
<pm> install videowright
```

### 4c: Install dev toolchain

Install the dev tools that Videowright projects use. These mirror the core Videowright repo's own toolchain.

**Pin versions from the core package:** after step 4b, read `node_modules/videowright/package.json` and note the version ranges in its `devDependencies` for `vitest` and `@playwright/test`. Use those same version ranges when installing:

```bash
<pm> install --save-dev vitest@<version-from-core> @playwright/test@<version-from-core>
```

**Install latest for tools not in core:** `typescript` and `@biomejs/biome` are not listed in the core `videowright` package's `package.json`. Install the latest version of each:

```bash
<pm> install --save-dev typescript @biomejs/biome
```

| Tool | Version source | Purpose |
|---|---|---|
| `vitest` | Pin from core package.json | Unit tests for segment helpers |
| `@playwright/test` | Pin from core package.json | E2e/browser tests for video output |
| `typescript` | Latest | Type-checking for segments and config |
| `@biomejs/biome` | Latest | Lint + format (single tool) |

If a dev dependency is already present at a compatible version, skip it. If present at an incompatible version, warn the user and let them decide whether to upgrade.

### 4d: Install Playwright browsers

```bash
npx playwright install
```

This downloads the browser binaries Playwright needs for e2e testing and video export.

### 4e: Verify install

Confirm that `node_modules/videowright/` exists after installation. If it does not, surface the error to the user and stop.

---

## Step 5: Skill installation (symlinks)

Create **both** of these symlinks at the install root (the Videowright project folder), regardless of which agent(s) the user chose in Step 2. This keeps the install idempotent and future-proof.

**Symlinks to create:**

| Symlink path | Target |
|---|---|
| `.claude/skills/videowright` | `node_modules/videowright/skill/` |
| `.agents/skills/videowright` | `node_modules/videowright/skill/` |

**Coverage:**

| Agent | Reads from |
|---|---|
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| opencode | both `.claude/skills/` and `.agents/skills/` |

**How to create each symlink:**

Follow the symlink creation algorithm in Appendix B. In summary:

1. Create intermediate directories if they do not exist (e.g., `.claude/skills/`).
2. Compute the target as a **relative path** from the symlink's parent directory to `node_modules/videowright/skill/`. See Appendix B for examples.
3. If the symlink already exists and points to the correct target: leave it alone.
4. If the symlink exists but points elsewhere: ask the user before replacing.
5. If a real file or directory exists at the symlink path: ask the user before replacing.
6. Create the symlink:
   - macOS/Linux: `ln -s <relative-target> <symlink-path>`
   - Windows: `mklink /D <symlink-path> <relative-target>`

**Windows note:** If symlink creation fails on Windows, tell the user exactly:

> Symlink creation failed. On Windows, this usually means Developer Mode is off. Either enable Developer Mode (Settings > Privacy & security > For developers > Developer Mode) and re-run, or create the link manually with `mklink /D .claude\skills\videowright node_modules\videowright\skill` (run from an admin terminal). Then verify by running setup again.

---

## Step 6: Instruction file

Write or update the instruction file for each agent the user opted to install for in Step 2.

**File mapping:**

| Agent | Instruction file |
|---|---|
| Claude Code | `CLAUDE.md` |
| Codex | `AGENTS.md` |
| opencode | `AGENTS.md` |

If installing for multiple agents that need different files (e.g., Claude Code + Codex), write the **same content** into each file. Do not symlink between them.

**File location:** the instruction file is written at the **root** of the project. If Step 1 chose sub-folder mode, the instruction file goes in the parent (the larger repo's root), not in the sub-folder.

**Content:** use a marked region so re-installs are idempotent. Follow the marked-region writer algorithm in Appendix A.

The content to place inside the marked region depends on whether this is a root install or sub-folder install:

### Root install content:

```
<!-- videowright:start -->
*Auto-managed by Videowright installer. Edits inside this block will be overwritten on re-install. Add your own context outside the markers.*

This project is a [Videowright](https://github.com/scosman/videowright) project -- a library for composing animated explainer videos in HTML/CSS/JS.

For any video-related work, use the `videowright` skill (loaded automatically from `.claude/skills/videowright` or `.agents/skills/videowright`). It has full guidance on segments, voiceovers, styles, and the dev server.

Key paths:
- `videowright.config.ts` -- project config and default style.
- `videos/` -- one folder per video.
- `styles/` -- design tokens and shared styling.
- `segments/`, `components/`, `transitions/` -- shared building blocks.
<!-- videowright:end -->
```

### Sub-folder install content:

When Step 1 chose sub-folder mode (e.g., sub-folder `videos/`), use this complete block instead:

```
<!-- videowright:start -->
*Auto-managed by Videowright installer. Edits inside this block will be overwritten on re-install. Add your own context outside the markers.*

The folder `<subfolder>/` in this project is a [Videowright](https://github.com/scosman/videowright) project -- a library for composing animated explainer videos in HTML/CSS/JS.

For any video-related work, use the `videowright` skill (loaded automatically from `.claude/skills/videowright` or `.agents/skills/videowright`). It has full guidance on segments, voiceovers, styles, and the dev server.

Key paths:
- `<subfolder>/videowright.config.ts` -- project config and default style.
- `<subfolder>/videos/` -- one folder per video.
- `<subfolder>/styles/` -- design tokens and shared styling.
- `<subfolder>/segments/`, `<subfolder>/components/`, `<subfolder>/transitions/` -- shared building blocks.
<!-- videowright:end -->
```

Replace `<subfolder>` with the actual sub-folder name chosen in Step 1.

---

## Step 7: Final report

Tell the user exactly:

> Done. Installed Videowright for [list of agents]. Try:
> - "Make me a 30-second project intro video" -- to scaffold a video.
> - `npx videowright dev` -- to preview.

---

## Appendix A: Marked-region writer algorithm

Given a target file path and the content string to place inside the markers:

1. **File does not exist**: create a new file containing exactly the full marked region as shown in Step 6 (including the start/end markers, the auto-managed note, and the content). For example:
   ```
   <!-- videowright:start -->
   *Auto-managed by Videowright installer. Edits inside this block will be overwritten on re-install. Add your own context outside the markers.*

   ... rest of content ...
   <!-- videowright:end -->
   ```

2. **File exists**: read its contents and search for the pattern `<!-- videowright:start -->` ... `<!-- videowright:end -->`:
   - **Match found**: replace everything from `<!-- videowright:start -->` through `<!-- videowright:end -->` (inclusive) with the new marked region. This is an idempotent re-install.
   - **No match**: append the full marked region (start marker, auto-managed note, content, end marker -- exactly as shown in point 1) at the end of the file. If the file does not end with a newline, add two blank lines before the region; otherwise add one blank line.

3. **Never modify content outside the markers.**

## Appendix B: Symlink creation algorithm

Given a symlink path (e.g., `.claude/skills/videowright`) and a target directory (`node_modules/videowright/skill/`):

1. **Create intermediate directories**: ensure the parent directory of the symlink exists (e.g., `.claude/skills/`). Create with `mkdir -p` if needed.

2. **Compute relative target**: the symlink target must be a relative path from the symlink's parent directory to the target. Compute this dynamically based on the actual directory depth. Examples:
   - **Root install**: symlink at `.claude/skills/videowright`, target at `node_modules/videowright/skill/` -- relative target is `../../node_modules/videowright/skill/`
   - **Sub-folder install** (e.g., project in `videos/`): symlink at `videos/.claude/skills/videowright`, target at `videos/node_modules/videowright/skill/` -- relative target is `../../node_modules/videowright/skill/` (same, because both are relative to the sub-folder root)

3. **Check existing state**:
   - If the path is a symlink pointing to the correct relative target: do nothing (idempotent).
   - If the path is a symlink pointing to a different target: ask the user before replacing:
     > `.claude/skills/videowright` currently points to `<old-target>`. Replace it with a link to `node_modules/videowright/skill/`?
   - If the path is a real file or directory (not a symlink): ask the user before replacing.
   - If the path does not exist: proceed to create.

4. **Create the symlink**:
   - macOS/Linux: `ln -s <relative-target> <symlink-path>`
   - Windows: `mklink /D <symlink-path> <relative-target>`

Apply this algorithm identically for both `.claude/skills/videowright` and `.agents/skills/videowright`.
