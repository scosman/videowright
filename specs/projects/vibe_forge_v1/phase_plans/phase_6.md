---
status: complete
---

# Phase 6: Skill Content

## Overview

Create the Claude Code agent skill that ships inside the `videowright` npm package. The skill teaches Claude to use Videowright fluently: setup flows, segment authoring, video scaffolding, and style matching. Includes `SKILL.md` entry point, four reference docs, and a runnable hello_world template. Also adds a smoke test verifying the skill file structure ships correctly.

## Steps

1. **Verify `package.json#files`.** Confirm `"skill"` is already in the `files` array (it is — set in Phase 1).

2. **Create `packages/lib/skill/SKILL.md`.** Entry point with frontmatter (`name`, `description`), trigger conditions, setup check, workflow dispatch table, and core principles. References the four docs in `references/`.

3. **Create `packages/lib/skill/references/setup.md`.** The interactive setup flow: confirm intent, ask video name, ask dependencies (open-ended with examples), scaffold layout, copy hello_world templates, confirm. Includes variable substitution map and exact prompt copy.

4. **Create `packages/lib/skill/references/authoring_segment.md`.** Teaches `defineSegment`, timing rules (`waitForNext`/`hold`), `setTimeout` footgun, `ctx.signal`, idempotency, voiceover field, shadow root choice, internal beats pattern with worked example.

5. **Create `packages/lib/skill/references/authoring_video.md`.** Teaches folder structure, `timeline.ts` format with worked examples, VO-first authoring, `PLAN.md` workflow, reordering, component/transition organization.

6. **Create `packages/lib/skill/references/style_matching.md`.** Teaches reading `STYLE.md`, reading past video artifacts, reusing from top-level dirs, updating `STYLE.md`.

7. **Create `packages/lib/skill/assets/hello_world/` templates.** Five `.tmpl` files:
   - `timeline.ts.tmpl` — 2-segment timeline using actual `Timeline` type
   - `segments/hello_intro.ts.tmpl` — intro segment using `defineSegment` with `waitForNext`
   - `segments/hello_outro.ts.tmpl` — outro segment using `defineSegment` with `hold`
   - `README.md.tmpl` — video readme
   - `PLAN.md.tmpl` — initial plan
   - `voiceover/script.md.tmpl` — stub VO script

8. **Write smoke test `test/unit/skill_files.test.ts`.** Verifies:
   - `SKILL.md` exists and has frontmatter with `name: videowright`
   - `references/` contains exactly the 4 expected files
   - `assets/hello_world/` has `timeline.ts.tmpl`, two segment templates, config-related files
   - Template files contain `{{video_name}}` substitution variables

## Deviations from spec

- **Variable substitution simplified.** The spec (`components/skill.md`) listed `{{video_name}}`, `{{date_prefix}}` (YYYY-MM), `{{title}}`, and `{{video_path}}`. Implementation uses `{{video_name}}`, `{{title}}`, and `{{date}}` (YYYY-MM-DD). `{{date_prefix}}` was dropped because `{{date}}` is more useful (full date in PLAN.md log entries). `{{video_path}}` was dropped because the agent constructs the path from `{{video_name}}` directly in setup.md -- a dedicated variable adds indirection without value.
- **`styles/tokens.ts` omitted.** The skill scaffolds only `styles/tokens.css`; the optional `tokens.ts` (for typed access to design tokens) can be added by the agent if a video needs it. Avoids forcing an unused file into every project.

## Tests

- `skill_md_exists_with_frontmatter`: SKILL.md present, contains `name: videowright` in frontmatter
- `references_has_expected_files`: references/ has setup.md, authoring_segment.md, authoring_video.md, style_matching.md
- `hello_world_has_timeline`: assets/hello_world/timeline.ts.tmpl exists
- `hello_world_has_segments`: assets/hello_world/segments/ has hello_intro.ts.tmpl and hello_outro.ts.tmpl
- `hello_world_has_readme_and_plan`: README.md.tmpl and PLAN.md.tmpl exist
- `hello_world_has_voiceover_script`: voiceover/script.md.tmpl exists
- `templates_contain_substitution_vars`: at least one .tmpl file contains `{{video_name}}`
- `skill_md_references_resolve`: all reference paths mentioned in SKILL.md exist on disk
