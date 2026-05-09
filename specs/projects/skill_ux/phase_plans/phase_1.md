---
status: in-review
---

# Phase 1: Skill skeleton + lib type additions

## Overview

Foundation phase. Rewrites `skill/SKILL.md` with the new structure (entry, when-to-trigger, setup gate, intent dispatch table, core principles). Stubs all `references/*.md` files empty. Adds `Config.defaultStyle?: string` and `TimelineMeta.style?: string` to lib types. Confirms typecheck passes.

## Steps

1. **Add `defaultStyle?: string` to `Config` interface** in `packages/lib/src/types.ts`. One line addition inside the existing `Config` interface.

2. **Add `style?: string` to `TimelineMeta` interface** in `packages/lib/src/types.ts`. One line addition inside the existing `TimelineMeta` interface.

3. **Rewrite `skill/SKILL.md`** with the new structure per architecture doc section 5 and functional spec section 4:
   - Section 1: What Videowright is (one paragraph)
   - Section 2: When to trigger (bullet list, expanded from current)
   - Section 3: Setup gate (pseudo-instruction checking `videowright.config.ts` for `defaultStyle`)
   - Section 4: Intent dispatch table (10-row table from functional spec section 4)
   - Section 5: Core principles (carry forward + tighten from current SKILL.md)
   - Target: under 150 lines

4. **Remove old reference files** that are being replaced:
   - Delete `skill/references/authoring_video.md`
   - Delete `skill/references/style_matching.md`

5. **Create stub reference files** (empty with a header comment only):
   - `skill/references/setup.md` (overwrite existing)
   - `skill/references/setup_new_style.md` (new)
   - `skill/references/new_video.md` (new)
   - `skill/references/create_or_edit_video.md` (new)
   - `skill/references/authoring_segment.md` (overwrite existing)
   - `skill/references/voiceover.md` (new)
   - `skill/references/styles.md` (new)
   - `skill/references/export.md` (new)
   - `skill/references/testing.md` (new)
   - `skill/references/dev_server.md` (new)
   - `skill/references/project_structure.md` (new)
   - `skill/references/types.md` (new)

6. **Run typecheck** (`npm run typecheck`) and fix any issues.

7. **Run lint** (`npm run lint`) and fix any issues.

## Tests

- Typecheck passes: the two new optional fields on `Config` and `TimelineMeta` are accepted by the existing type system without breaking any existing code.
- No new unit tests needed for this phase (type-only additions with no runtime behavior; stub markdown files).
