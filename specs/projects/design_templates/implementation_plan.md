---
status: complete
---

# Implementation Plan: Design Templates Refresh

## Phases

- [x] **Phase 1: Foundation + Editorial Mono.** Demolish the 5 old packs. Set up the new pack folder shape (STYLE.md frontmatter schema, brand.md, reference/, sample/). Adapt Editorial Mono fully: frontmatter on STYLE.md, drop meta.json, author 10 sample/<scene>.ts. Repoint hello_world (timeline.ts, PLAN.md, README.md, voiceover/script.md) to `editorial-mono` + `editorial-mono-sample-kinetic`. Rewrite `packages/lib/test/unit/skill_files.test.ts` to parameterize over STYLE_PACKS × SAMPLE_SCENES with `["editorial-mono"]` in the list and the new folder-shape + sample assertions. Update the bulk of the docs (`references/styles.md`, `references/project_structure.md`, `references/setup_new_style.md`, `references/new_video.md`, `references/create_or_edit_video.md`, `references/voiceover/style_intake.md`) to reflect the new conventions and use `editorial-mono` as the example slug. Mode 4 hardcoded message lists only Editorial Mono at end of phase. All tests pass.

- [ ] **Phase 2: Swiss Console.** Adapt Swiss Console fully (STYLE.md frontmatter + tokens.css + brand.md + reference/ + 10 sample/<scene>.ts). Add `swiss-console` to STYLE_PACKS test list and to the Mode 4 hardcoded message. Verify Switzer font loads via Fontshare URL. All tests pass.

- [ ] **Phase 3: Neon Terminal.** Adapt fully. Append to STYLE_PACKS and Mode 4 message. Pay special attention to stepped-easing motion (`steps(8, end)`) and the phosphor-glow text-shadow on accent text — make sure samples are render-safe. All tests pass.

- [ ] **Phase 4: Motion Engineering.** Adapt fully. Append to STYLE_PACKS and Mode 4 message. The HUD style relies on SVG dimension lines and crosshair geometry — sample-segments need careful SVG authoring. All tests pass.

- [ ] **Phase 5: Iso Diagram.** Adapt fully. Append to STYLE_PACKS and Mode 4 message. Hand-drawn aesthetic + SVG stroke-dashoffset draw-on animations are the central motion vocabulary. All tests pass.

- [ ] **Phase 6: Risograph + final cleanup.** Adapt Risograph fully (last pack — stepped easing, color-channel misregistration, grain layer). Append to STYLE_PACKS and Mode 4 message. Final doc grep across `packages/lib/skill/` for any old-pack slugs — fix any stragglers. Delete `videowright_design/` source folder. Run the full test suite. Confirm Mode 4 hardcoded message lists all 6 packs in STYLE_ROSTER order.
