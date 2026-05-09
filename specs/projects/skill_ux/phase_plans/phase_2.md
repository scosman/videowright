---
status: complete
---

# Phase 2: Style architecture references

## Overview

Write the two style-related reference files: `references/styles.md` (style folder layout, timeline.ts import convention, swap workflow, style-matching) and `references/setup_new_style.md` (modes 1-3, caller flags). Mode 3 picker reads `skill/assets/styles/*/STYLE.md` frontmatter. The picker mechanic is wired even though the 4 packs come in later phases.

## Steps

1. **Write `references/styles.md`** replacing the stub. Content per architecture doc section 8 ("styles.md") and functional spec section 9 ("Style architecture"):
   - Style folder structure in consumer repo (`styles/<slug>/STYLE.md`, `tokens.css`, optional extras)
   - The timeline.ts top-of-file import convention (CSS import at top of timeline.ts)
   - How segments consume tokens (CSS variables, no TS mirror)
   - Switching `defaultStyle` (edit config, update timeline imports)
   - Per-video override via `meta.style`
   - "Match a past video's style" workflow (read past STYLE.md + PLAN.md + representative segment)
   - Cross-link to `setup_new_style.md` for creation flows
   - Recommended token set table (6 tokens: `--color-bg`, `--color-fg`, `--color-accent`, `--font-display`, `--font-body`, `--font-mono`)
   - Edge cases: missing slug folder, no per-segment style field

2. **Write `references/setup_new_style.md`** replacing the stub. Content per architecture doc section 6 and functional spec section 6:
   - "When this is called" section listing the three callers (setup.md, new_video.md, styles.md)
   - Caller-passed flags: `setAsDefault` (boolean), `copySample` (boolean)
   - Mode 1 — Ingest an existing style guide (paste or folder path)
   - Mode 2 — Describe in chat (agent drafts, reads back, iterates)
   - Mode 3 — Pick a built-in style pack (read frontmatter from `skill/assets/styles/*/STYLE.md`, present picker, copy)
   - Final actions: write STYLE.md + tokens.css, optionally copy sample segment, update config if setAsDefault
   - Edge cases: slug collision, sample already exists, large file ingest

## Tests

- No automated tests for this phase (markdown content only; no code changes).
- Typecheck still passes (no code modifications).
- Lint still passes.
