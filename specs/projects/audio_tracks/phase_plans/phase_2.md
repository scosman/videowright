---
status: complete
---

# Phase 2: Skill tree restructure

## Overview

Move existing voiceover skill references from `references/voiceover.md` and `references/voiceover/` under a new `references/audio/voiceover/` subtree. Create a new top-level `references/audio.md` entry that asks the VO/SFX/music triage questions and routes to sub-references. Update `SKILL.md` to point at `audio.md` instead of `voiceover.md`. Update cross-references in `project_structure.md`, `new_video.md`, `create_or_edit_video.md`, and `export.md` to match the new structure. No new content is authored in this phase -- it is purely structural so later phases drop into a coherent tree.

## Steps

1. **Create `references/audio/` directory and move existing voiceover files**
   - Create `references/audio/voiceover/` directory
   - Move `references/voiceover.md` to `references/audio/voiceover.md`
   - Move `references/voiceover/style_intake.md` to `references/audio/voiceover/style_intake.md`
   - Move `references/voiceover/script_writing.md` to `references/audio/voiceover/script_writing.md`
   - Move `references/voiceover/animation_sync.md` to `references/audio/voiceover/animation_sync.md`
   - Move `references/voiceover/sync_algorithm.md` to `references/audio/voiceover/sync_algorithm.md`
   - Move `references/voiceover/provider_script.md` to `references/audio/voiceover/provider_script.md`
   - Move `references/voiceover/providers/` to `references/audio/voiceover/providers/` (elevenlabs.md, manual.md)
   - Remove the old `references/voiceover/` directory and `references/voiceover.md`

2. **Update internal links in moved voiceover files**
   - `audio/voiceover.md`: Update all relative links from `voiceover/...` to `voiceover/...` (no change within same subtree), but update any upward links to peer references (e.g., `../create_or_edit_video.md` becomes `../../create_or_edit_video.md`)
   - `audio/voiceover/style_intake.md`: Update `provider_script.md` link (stays same), update `providers/elevenlabs.md` link (stays same)
   - `audio/voiceover/script_writing.md`: Update `provider_script.md` link (stays same)
   - `audio/voiceover/provider_script.md`: Update `providers/elevenlabs.md` link (stays same)
   - `audio/voiceover/sync_algorithm.md`: No internal link changes needed
   - `audio/voiceover/animation_sync.md`: Update `../create_or_edit_video.md` to `../../create_or_edit_video.md`
   - `audio/voiceover/providers/elevenlabs.md`: Update `../voiceover.md` to `../../voiceover.md`, update `../sync_algorithm.md` to `../../sync_algorithm.md` (these are now one more level deep relative to audio)
   - `audio/voiceover/providers/manual.md`: Update `elevenlabs.md` link (stays same), update `../sync_algorithm.md` to `../../sync_algorithm.md`

3. **Create `references/audio.md`**
   - New top-level audio entry point
   - Asks the user: VO? SFX? Music?
   - Routes to `audio/voiceover.md` for voiceover work
   - Placeholder notes for SFX and music sub-refs (Phase 5)
   - Placeholder notes for audio plan/build/sync (Phase 3)
   - Always loads voiceover.md if VO is selected (preserving current behavior)

4. **Update `SKILL.md`**
   - Change voiceover-related intent dispatch rows to point at `references/audio.md` instead of `references/voiceover.md`
   - Update the "When to trigger" list to include SFX and music triggers
   - Update the "Core principles" section to use audio-track terminology where appropriate

5. **Update `references/create_or_edit_video.md`**
   - Update link from `voiceover.md` to `audio/voiceover.md`
   - Update path references for `voiceover/script.md` to `voiceover_script/script.md`
   - Update handoff text for voiceover flow to reference `audio.md`

6. **Update `references/new_video.md`**
   - Update link from `voiceover.md` to `audio/voiceover.md`
   - Update audio intent options to mention SFX and music (future phases)

7. **Update `references/project_structure.md`**
   - Update directory tree to show `voiceover_script/` instead of `voiceover/`
   - Update directory tree to show `audio/` directory layout
   - Update file descriptions table
   - Update link from `voiceover.md` to `audio/voiceover.md`

8. **Update `references/export.md`**
   - Update CLI flags from `--voiceover` to `--audio-track`
   - Update audio section to reference audio tracks instead of voiceovers
   - Update code examples

## Tests

- No automated tests for skill markdown files (they are documentation, not executable code)
- Verify all internal markdown links resolve by checking relative paths manually
- Run `npm run typecheck` and `npm run lint` to confirm no TS/lint regressions from structural changes
- Run `npm test` to confirm existing tests still pass (no code changes in this phase, only skill docs)
