---
status: complete
---

# Phase 3: Manual eval pass and fixes

## Overview

Execute the manual eval matrix from architecture.md Testing Strategy against INSTALL.md, create-videowright, and setup.md. Record results. Fix any bugs found.

## Steps

1. **Set up scratch directories** under `$TMPDIR/videowright_eval/` for each scenario: empty, innocent, subfolder, reinstall.

2. **Execute INSTALL.md against each scratch dir** by following the steps as a Claude Code agent would. Record observations per step.

3. **Test create-videowright CLI** by running `node packages/create-videowright/bin/cli.js` directly:
   - Verify fallback message when no agents on PATH.
   - Verify single-agent auto-handoff behavior.
   - Verify multi-agent readline prompt appears.

4. **Test setup.md verification logic** against three project states:
   - (a) Fully installed project (should pass).
   - (b) Project missing node_modules/ (should fail).
   - (c) Project missing marked region in instruction file (should fail).

5. **Record all results** in `specs/projects/installer/manual_eval.md` with clear pass/fail for each cell. Mark Codex and opencode columns as pending for user manual run.

6. **Fix any bugs** found in INSTALL.md or other files.

7. **Clean up** scratch directories.

## Tests

- No automated tests; this phase is itself the manual eval.
- Results recorded in manual_eval.md checklist format.
