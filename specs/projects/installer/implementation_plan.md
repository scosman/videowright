---
status: complete
---

# Implementation Plan: Installer

Three phases. Phase 1 ships the paste-driven install (the v1 must-have). Phase 2 adds the `npm init videowright` convenience CLI (P2). Phase 3 is the manual-eval pass that gates "done."

## Phases

- [x] **Phase 1: Markdown deliverables (paste-driven install)**
  - Write `packages/lib/skill/install/INSTALL.md` — the full agent-executable install script (functional spec steps 1–7, plus algorithm appendix).
  - Update `packages/lib/skill/references/setup.md` — prepend the "Verify install" step.
  - Update root `README.md` — add the paste-prompt block in the install section.
  - At end of phase: paste-flow installs work end-to-end in at least Claude Code (developer's primary agent).

- [ ] **Phase 2: `create-videowright` initializer (P2)**
  - Add `packages/create-videowright/` to monorepo workspaces.
  - Implement `bin/index.js`: `detectAgents`, `chooseAgent`, `handoffCommand`, `spawnAgent`, no-agent fallback.
  - Vitest unit tests for each function per architecture's testing strategy.
  - Verify `npm init videowright` resolves and hands off correctly to each agent locally.

- [ ] **Phase 3: Manual eval pass and fixes**
  - Run the manual eval matrix from architecture §Testing Strategy across all three agents and all listed scenarios.
  - Record results in `specs/projects/installer/manual_eval.md`.
  - Fix any bugs surfaced (likely small wording or flow tweaks in `INSTALL.md`).
