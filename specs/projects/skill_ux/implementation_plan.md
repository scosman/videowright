---
status: complete
---

# Implementation Plan: skill_ux

Ten phases. Phases 1–5 build the skill structure and reference content; phases 6–9 design the four built-in style packs (any order); phase 10 runs evals and ships. See `architecture.md` §14 for context.

## Phases

- [x] **Phase 1: Skill skeleton + lib type additions.** Rewrite `skill/SKILL.md` (entry, when-to-trigger, setup gate, intent dispatch table, core principles). Stub `references/*.md` files empty. Add `Config.defaultStyle?: string` and `TimelineMeta.style?: string` to lib types in `packages/lib/src/`. Confirm typecheck passes.

- [x] **Phase 2: Style architecture references.** Write `references/styles.md` (folder layout, timeline.ts import convention, swap workflow, style-matching) and `references/setup_new_style.md` (modes 1–3, caller flags). Mode 3 picker reads `skill/assets/styles/*/STYLE.md` frontmatter — the picker mechanic is wired even though the 4 packs come later.

- [x] **Phase 3: Core workflow references.** Write `references/setup.md` (gate semantics, scaffold steps, dispatch to setup_new_style for first style), `references/new_video.md` (intent capture, PLAN.md skeleton embedded inline, one-shot heuristic, dispatch to create_or_edit_video), `references/create_or_edit_video.md` (translate PLAN.md → segments + timeline, edit-mode for existing videos, verify with `videowright dev`).

- [x] **Phase 4: Supporting references.** Write `references/authoring_segment.md`, `voiceover.md`, `project_structure.md`, `types.md`, `dev_server.md`, `export.md`, `testing.md`. Salvage existing prose where it fits; rewrite where it doesn't.

- [ ] **Phase 5: Hello-world reference example.** Replace `skill/assets/hello_world/` with the new shape (no `.tmpl`, plain reference files). Verify the timeline.ts top-of-file style import convention works end-to-end against a placeholder style.

- [ ] **Phase 6: Style pack — Modern.** Design and ship `skill/assets/styles/modern/` (STYLE.md + tokens.css + sample-segment). Visual design polish to 2026 standards.

- [ ] **Phase 7: Style pack — Retro.** Same shape; 80s/90s warmth, bolder color, typographic personality.

- [ ] **Phase 8: Style pack — Bauhaus.** Same shape; geometric, primary palette, strict grid.

- [ ] **Phase 9: Style pack — Animated Explainer.** Same shape; illustrative, generous motion, friendly typography.

- [ ] **Phase 10: Manual evals + polish + release readiness.** Run the architecture §11 evals (cold-start, hero use case, style swap, Mode 1 ingest, Mode 1 at scale). Fix surfaced issues. Final pass over cross-links and prose. Ship.
