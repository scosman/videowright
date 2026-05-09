---
status: complete
---

# Architecture: skill_ux

The functional spec defines what the skill does. This document defines how it's built — file conventions, the small lib touch, style application mechanics, schemas, and the workflow files' internal shape. Single-file architecture (no per-component docs) given the project is content-heavy with limited code surface.

---

## 1. Principles

- **Player stays style-agnostic.** The lib's runtime never reads style metadata. Style application is content-driven (timeline.ts imports tokens), not lib-orchestrated.
- **Skill content is plain markdown + reference assets.** No templating engine, no variable substitution map, no `.tmpl` files. The agent is the templating engine — it reads reference examples and writes adaptations into the consumer repo.
- **Reference, don't repeat.** Each skill file owns a content domain. Cross-linking replaces duplication. When two callers need the same prose, they both link to one file.
- **Validation is skill-side, runtime is permissive.** The skill checks slugs and structure at write-time. The lib treats `defaultStyle` and `meta.style` as opaque informational fields and never errors on them.
- **Agents are the runtime.** Skill content gives flows + context, not rigid scripts. The agent reasons from primitives.

---

## 2. Lib touch (minimal)

Two type-only additions in `packages/lib/src/`. The lib runtime ignores both fields.

### `Config.defaultStyle?: string`

Optional. Stored in `videowright.config.ts`. The skill writes it during setup. The lib does not read it at runtime.

```ts
// packages/lib/src/config.ts (existing file, add field)
export interface Config {
  projectStructure: 'v1';
  defaultStyle?: string;            // NEW — skill metadata
  defaults?: { ... };
  transitions?: { ... };
}
```

### `TimelineMeta.style?: string`

Optional. Stored in `timeline.ts` `meta` block. The skill resolves the active style for a video as `meta.style ?? config.defaultStyle`. The lib does not read it at runtime.

```ts
// packages/lib/src/timeline.ts (existing file, add field on TimelineMeta)
export interface TimelineMeta {
  title: string;
  style?: string;                   // NEW — skill metadata
  aspectRatio?: ...;
  resolution?: ...;
  fps?: ...;
}
```

### Why types not runtime

These give IDE autocomplete and typecheck on user-authored config + timelines. The skill is the only enforcer; nothing in the player, dev server, or render pipeline reads them. Total lib code change: 4 lines across two existing interface files.

---

## 3. Style application

### Loading mechanism

The active style's `tokens.css` is loaded via a **top-of-file import in `timeline.ts`**:

```ts
import '../styles/modern/tokens.css';
import type { Timeline } from 'videowright';

const timeline: Timeline = { ... };
export default timeline;
```

Vite (the dev server) and any bundler resolves the CSS import natively. The CSS is injected into the page; `:root` custom properties cascade through the player's DOM. No player code is involved in style loading.

### Why timeline.ts

It is the per-video content file. Putting the import there makes the style choice transparent and per-video local. The player loads `timeline.ts` to render the video; that load happens to also load the CSS. No coupling between player runtime and styles.

### Segments

Segments use `var(--color-accent)`, `var(--font-display)`, etc. directly. They do **not** import tokens themselves — the timeline-level import provides the variables. This avoids duplicating imports across segments and lets one segment be reused across videos with different styles (CSS variables are inherited at runtime).

Segments may freely import additional CSS / TS / assets from any style folder if they want to mix styles or pull in supplementary fonts. This is "off-book" and welcomed.

### Style swap workflows

| User intent | Action |
|---|---|
| Change `defaultStyle` for the project | Agent edits `videowright.config.ts`. Asks user whether to update existing videos. If yes, agent updates each `timeline.ts`'s top import. |
| Override style for one video | Agent sets `meta.style: '<slug>'` in that timeline AND updates the top-of-file import to match. |
| Swap a video's style | Agent edits the timeline's import + (if present) `meta.style`. Segments unchanged. |

The agent always keeps the top import in sync with `meta.style ?? config.defaultStyle`. This is documented in `references/styles.md`.

### Resolution validation

When the agent writes `defaultStyle: 'foo'` or `meta.style: 'foo'`, it verifies `styles/foo/tokens.css` exists. If not, the agent flags and either creates the style folder (via `setup_new_style.md`) or asks the user to pick an existing one. The lib does not validate.

---

## 4. Style pack schema

Each pack lives at `skill/assets/styles/<slug>/`. Slug is `kebab-case`, matches the folder name, matches the value written into `defaultStyle` / `meta.style` when the pack is installed.

### Files

```
skill/assets/styles/<slug>/
├── STYLE.md
├── tokens.css
└── sample-segment/
    └── index.ts
```

### `STYLE.md`

```markdown
---
title: Modern
slug: modern
picker_description: Clean, tech-product polish. Restrained motion, generous whitespace.
font_sources:
  - https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap
---

# Style: Modern

## When to use
[1–2 sentences on intent]

## Aesthetic rules
- [Bullet rules the agent should honor when authoring segments — typography, color, motion, density]

## Motion vocabulary
- [Description of how things should move in this style]

## Don'ts
- [Things to avoid]
```

Frontmatter fields:

- `title` — display name in the picker.
- `slug` — must match folder name. Redundant but explicit.
- `picker_description` — one-liner shown in the Mode 3 picker.
- `font_sources` — array of stylesheet URLs (Google Fonts URLs in v1).

### `tokens.css`

Plain CSS with `:root { --token-name: value; }` rules. No preprocessor.

The 4 built-in packs use this **recommended** token set (not enforced — pure convention for cross-pack consistency):

| Token | Purpose |
|---|---|
| `--color-bg` | Page background |
| `--color-fg` | Default text |
| `--color-accent` | Primary accent / call-out |
| `--font-display` | Headlines |
| `--font-body` | Body copy |
| `--font-mono` | Code / monospace |

Packs may define additional tokens (e.g., a Bauhaus pack may declare `--color-primary-red`, `--color-primary-yellow`, `--color-primary-blue`). User-authored styles may use any tokens they want — there is **no required set**.

### `sample-segment/index.ts`

A complete, ~50–100 line working segment that demonstrates the style. Contract:

- Default-exports a segment via `defineSegment`.
- Has a `voiceover` field (also teaches VO authoring).
- Uses `ctx.waitForNext()` for at least one beat (also teaches beats).
- References its pack's tokens via `var(--color-accent)` etc.
- Visually showcases the style's typography, color, and motion idioms.
- Imports nothing from outside its own pack folder (so it copies cleanly into the consumer repo).

When the user picks the pack via Mode 3 (or installs it via `setup_new_style.md`), the agent optionally copies the sample into `segments/<slug>-sample/index.ts` (default: yes during initial setup, no when adding mid-project). The user's hello-world video can also use this sample as a starter.

### Slug = folder = config string

Slug is locked across folder name, frontmatter `slug`, and the value written into config / meta. No renames. The skill enforces.

---

## 5. SKILL.md technical shape

Target: ≤ 150 lines so it loads cheaply on every invocation.

### Section order

1. **What Videowright is** — one paragraph.
2. **When to trigger** — bullet list.
3. **Setup gate** — pseudo-instruction (see below).
4. **Intent dispatch table** — markdown table from functional spec §4.
5. **Core principles** — locked do-and-don't list (existing SKILL.md content; carry forward).

### Setup gate (pseudo-instruction)

```markdown
## Setup gate

Before doing any work, check `videowright.config.ts` at the repo root:

- If the file does not exist, OR `defaultStyle` is missing / empty:
  load `references/setup.md` and follow it.
- Otherwise: don't load `setup.md`. Proceed with intent dispatch.
```

This is the only branching the SKILL.md does. The actual condition check is performed by the agent at runtime (it reads the config, evaluates).

---

## 6. Workflow file shape (a pattern, not a schema)

Each workflow reference file follows roughly this shape:

```markdown
# Workflow: <name>

## When this is called
[Who dispatches here, what state the project is in.]

## What you have to know
[Context the agent needs. Cross-links to other reference files for shared content.]

## Flow
[Steps in user-facing language. Lists key questions. Notes one-shot vs. iterative defaults.]

## Output
[What gets written; where; what state the project is in afterward.]

## Edge cases
[Concrete situations and the right behavior.]
```

This isn't enforced rigidly — `authoring_segment.md` is more reference-style, `setup_new_style.md` is more flow-style. The pattern just keeps the files predictable.

### `new_video.md` content (key technical bits)

- Embeds the **PLAN.md skeleton** (per §8 below) inline as a markdown code block. The agent reads it and writes a populated PLAN.md into the consumer repo.
- States the questions to ask (purpose, style, audio, hard guidelines, script).
- States the one-shot detection heuristic: if the user's invocation already contains a multi-paragraph script + style/audio cues, draft PLAN.md and confirm; do not interrogate.
- Dispatches to `setup_new_style.md` when the user wants a per-video style other than `defaultStyle`.
- Dispatches to `create_or_edit_video.md` once PLAN.md is confirmed.

### `create_or_edit_video.md` content

- Single file, two entry conditions (new video → scaffold; existing video → edit).
- Cross-links to `authoring_segment.md`, `voiceover.md`, `styles.md`, `project_structure.md`, `types.md`.
- Spells out the timeline.ts top-of-file style import convention (agent writes import to match `meta.style ?? defaultStyle`).
- Spells out the verify step: run `npx videowright dev` (or have the user run it) before declaring done.

### `setup_new_style.md` content

- Three modes: ingest (Mode 1), describe (Mode 2), pick built-in (Mode 3).
- Mode 1 ingest behavior: prompt user to paste in chat OR provide a folder path on disk for large inputs.
- Mode 2 describe behavior: agent drafts STYLE.md + tokens.css from the prompt; reads back as a brief overview; iterates.
- Mode 3 pick behavior: read `skill/assets/styles/*/STYLE.md` frontmatter; present the 4 packs with `picker_description`; copy the chosen pack into `styles/<slug>/`.
- Caller-passed flags: `setAsDefault: boolean` (setup → true; new_video override → false; user-explicit "change default" → true), `copySample: boolean` (setup → true; mid-project → false unless user asks).

---

## 7. PLAN.md skeleton

Embedded in `references/new_video.md` and reproduced into `videos/<name>/PLAN.md`.

```markdown
# Plan: <video title>

## Purpose
- Audience: <who>
- Takeaway: <what they should leave with>
- Constraints / hard guidelines: <must-haves, must-avoids>

## Style
- Active style: <slug>
- Notes: <any per-video deviation>

## Audio intent
- Mode: voiceover | music | silent
- Notes: <pacing implications, music vibe, etc.>

## Segment outline
1. <id> — <one-line purpose>
2. <id> — <one-line purpose>
...

## Script (if applicable)
<full VO script, or "see voiceover/script.md">

---

## Log

### YYYY-MM-DD — Initial scaffold
- <what was built>

### YYYY-MM-DD — User feedback
- <change + reason>
```

Rules (from functional spec §12):

- The `# Plan` block is mutable — overwritten as the design evolves.
- The `## Log` block is append-only. Never delete entries.

---

## 8. Reference file contents (technical scope per file)

The functional spec §13 lists ownership boundaries. Adding technical detail per file:

### `authoring_segment.md`

Reproduces the core segment contract (`mount`/`play`/`unmount`, `defineSegment`, `ctx.waitForNext`/`hold`, `ctx.signal`, idempotency rules) with worked examples. Lifts content from the existing file where it lands cleanly. Adds a "tokens" sub-section pointing to `styles.md`.

### `voiceover.md`

VO field on segments, `videowright script` CLI, VO-first authoring sequence, where script.md lives. ~80–120 lines.

### `styles.md`

Style folder structure in consumer repo, the timeline.ts top-of-file import convention, switching `defaultStyle`, per-video override via `meta.style`, "match a past video's style" workflow (read past `STYLE.md` + `PLAN.md` + a representative segment). Cross-links to `setup_new_style.md` for creation flows.

### `export.md`

`videowright record` and `videowright render` invocations. Output paths (`videos/<name>/exports/`). Common gotchas: window focus, full-screen, ffmpeg dependencies. Audio is silent (per §11 of functional spec).

### `testing.md`

What's worth testing in a Videowright project — non-prescriptive examples:

- Timeline `advances` count matches `ctx.waitForNext()` calls per segment (render-mode coherence).
- Snapshot of rendered DOM at key beats (Playwright + screenshot).
- Type-check passes on segments after edits.

The file teaches *what's worth testing*, not "write this exact test."

### `dev_server.md`

`videowright dev` invocation, default discovery (most-recent video by mtime), URL hash for position (`#/segment-id/beat`), hot reload behavior, HUD toggle (`H`), keyboard shortcuts table.

### `project_structure.md`

The consumer repo layout from functional spec §9 + functional spec §2 of the parent project. File-ownership rules: anything in a top-level dir is shared; per-video files live inside `videos/<name>/`.

### `types.md`

Quick TS reference: `Segment`, `PlayerContext`, `Timeline`, `TimelineMeta`, `Transition`, `Config`. Type signature + one-line purpose. Includes the new `defaultStyle?` and `style?` fields.

---

## 9. Distribution

The skill ships inside the `videowright` npm package at `packages/lib/skill/`. `packages/lib/package.json#files` already includes `"skill"` (set up in earlier project). No distribution changes needed.

The skill versions in lockstep with the lib — one `npm install videowright` updates both.

---

## 10. Migration

None required. The functional spec is a clean rewrite. Existing skill content is salvaged where it lands; otherwise overwritten.

No consumer repos exist using the prior skill in production, so the schema additions (`defaultStyle`, `meta.style`) do not need a migration story. Any consumer set up under v1 of the project structure who somehow lacks `defaultStyle` triggers the setup gate (per functional spec §5) and resumes setup at the style step.

---

## 11. Testing strategy

The skill is content. There are no automated tests for the markdown files.

### Manual evals (run before release)

- **Cold-start eval.** Fresh consumer repo, agent given only the skill (no lib source). Run setup, scaffold a video, verify `npx videowright dev` works.
- **Hero use case eval.** Paste a complete brief in chat. Verify the agent one-shots PLAN.md, scaffolds segments, single confirmation round.
- **Style swap eval.** Build a video with style A. Ask agent to swap to style B. Verify timeline import + meta.style updated; segments unchanged; visual differs.
- **Mode 1 ingest eval.** Provide a small style guide via chat paste; verify resulting `styles/<slug>/` looks reasonable.
- **Mode 1 ingest at scale.** Provide a folder path with multiple files; verify agent reads from the path and does not create a new top-level dir.

### Programmatic checks

None for this project. Existing typecheck (already in CI) covers the small lib type additions.

Cross-link integrity linter is **not** in scope (per design opens E). Broken links surface during the manual evals.

---

## 12. CI changes

None. Existing CI (typecheck + lint + Playwright e2e) covers the lib type additions. Skill content is markdown, not subject to existing checks.

---

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| User edits `defaultStyle` to a slug whose folder doesn't exist | Lib is permissive; segments degrade visually (CSS variables undefined → fallback). Skill instructs agent to verify on every config edit. Manual eval catches the case. |
| Mode 1/2 user-authored styles miss the suggested 6 tokens | Agent in `setup_new_style.md` always emits the 6 default tokens; if the user's source doesn't define them, the agent picks reasonable defaults and flags. |
| Hello-world relies on the chosen style having the suggested 6 tokens | Built-in packs all define them (locked at pack design time, per pack-implementation phase). Mode 1/2 styles include them per above. |
| Style swap mid-project misses a video file | Agent scans `videos/*/timeline.ts` and updates each. Manual eval verifies. |
| The 4 packs need real visual design polish | One implementation phase per pack (per design open F1). Each phase reviewable on its own merits. |
| Skill content drift vs. lib API | Lockstep distribution. Implementation plan ends with a release-readiness phase that checks for drift. |

---

## 14. Implementation phasing hooks

Phase shape (formalized in `implementation_plan.md`):

1. **Skill skeleton + lib type additions.** Foundation. New SKILL.md with intent dispatch + setup gate, empty references stubbed, `Config.defaultStyle?: string` and `TimelineMeta.style?: string` added to lib types. Bundling types in here so downstream phases can reference them in prose without a forward-reference gap.
2. **Style architecture references (`styles.md`, `setup_new_style.md`).** Documents the import convention, modes 1–3 of style creation. Mode 3 picker is wired but the 4 packs aren't designed yet.
3. **Workflow references — setup + new_video + create_or_edit_video.** The full new-user flow runs end-to-end on Mode 2-style placeholders.
4. **Authoring + voiceover + project_structure + types + dev_server + export + testing references.** Reference content rewrites.
5. **Hello-world reference example.** New `assets/hello_world/` reference shape (no .tmpl). Verifies the timeline import convention.
6. **Style pack: Modern.** Full design.
7. **Style pack: Retro.** Full design.
8. **Style pack: Bauhaus.** Full design.
9. **Style pack: Animated Explainer.** Full design.
10. **Manual evals + polish + release readiness.** Run the §11 evals, fix surfaced issues, ship.

Phases 6–9 can be done in any order; the rest are sequential. Implementation plan refines this.
