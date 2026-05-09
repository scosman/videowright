---
status: complete
---

# Phase 1: Markdown deliverables (paste-driven install)

## Overview

This phase creates the core paste-driven install experience. The user copies a one-line prompt from the README into their coding agent, the agent fetches INSTALL.md, and follows the prescriptive script to set up a complete Videowright project. We also integrate with the existing skill by adding a "Verify install" gate to setup.md.

## Steps

1. **Create `packages/lib/skill/install/INSTALL.md`** -- the full agent-executable install script covering all 7 steps from the functional spec:
   - Preamble with context for the agent
   - Step 1: Folder check (empty/innocent files, existing Videowright, other project)
   - Step 2: Agent detection (which claude/codex/opencode, multi-agent question)
   - Step 3: Package manager detection (lockfile priority, which check, ask if both, error if neither)
   - Step 4: Package install (videowright + dev toolchain with pinned versions from core repo)
   - Step 5: Skill installation (two symlinks, always both, relative paths)
   - Step 6: Instruction file (CLAUDE.md / AGENTS.md with marked region)
   - Step 7: Final state report
   - Appendix: Marked-region writer algorithm and symlink creation algorithm

2. **Update `packages/lib/skill/references/setup.md`** -- prepend a "Verify install" step before the existing Step 1:
   - Check `videowright` in package.json dependencies or devDependencies
   - Check `node_modules/videowright/` exists
   - Check CLAUDE.md or AGENTS.md contains `<!-- videowright:start -->` marker
   - On failure: print redirect message and stop

3. **Update root `README.md`** -- replace the existing Quick Start / Install section with the paste-prompt block:
   - Add "Paste this into your coding agent" with the exact prompt and GitHub URL
   - Keep manual install path as a secondary option

## Tests

- No automated tests for Phase 1 (all deliverables are Markdown). The phase is validated by manual eval in Phase 3.
- Verify the INSTALL.md is syntactically valid Markdown (no broken links, consistent formatting).
- Verify the setup.md changes integrate correctly with the existing step numbering.
- Verify the README paste-prompt URL points to the correct path.
