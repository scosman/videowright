---
status: complete
---

# Functional Spec: skill_ux

This project refines the Videowright agent skill so that "open Claude Code, ship a kick-ass video" is the path of least resistance. It is primarily a content + structure project — the only library touch is two small type additions (`Config.defaultStyle`, `TimelineMeta.style`) detailed in §14. No CLI surface changes. No agent-instruction-file plumbing.

The product name is **Videowright**. The skill lives at `packages/lib/skill/` (referred to as `skill/` below). It is consumed via the [agent-skills.io](https://agent-skills.io) standard; the skill itself is plain markdown plus templated assets.

---

## 1. Scope

**In scope**

- Full rewrite of `skill/SKILL.md` and the `skill/references/*.md` set.
- A new built-in style system: 4 style packs shipped under `skill/assets/styles/<slug>/`, copied on demand into the consumer repo at `styles/<slug>/`.
- Updated `skill/assets/hello_world/` templates that use the user's chosen style.
- A revised `videowright.config.ts` shape with a `defaultStyle` field.
- A revised `timeline.ts` meta with an optional `style` override.
- New PLAN.md template (front-loaded design + appended log).

**Out of scope**

- Library runtime changes beyond the small type additions in §14 (no changes to `Player`, `defineSegment`, transitions, or the rendering pipeline).
- CLI changes (`videowright dev`, `script`, `record`, `render`).
- Audio playback. Audio intent is *captured* in PLAN.md; rendering audio is a separate project.
- Skill installation / agent instruction-file plumbing (CLAUDE.md / AGENTS.md) — separate "install" project.
- Multi-agent compatibility testing (Codex, opencode). Skill is plain markdown so it should work, but verification is out of this project.
- `videowright record` / `render` improvements.

**Existing skill files**

The current files (`SKILL.md`, `setup.md`, `authoring_video.md`, `authoring_segment.md`, `style_matching.md`) are rough starts. Salvage prose where it lands cleanly; rewrite the rest. Final structure is what's defined in §3, not what's there today.

---

## 2. Goals and quality bar

**Goals**

- **P0**: A user opens Claude Code in a fresh repo with `videowright` installed and the install-project's instruction-file pointer in place. With no prior Videowright knowledge, they can ship a polished video.
- **Hero use case**: User pastes a complete brief (script + style notes + intent) into chat. The agent one-shots the PLAN.md, confirms once, scaffolds the segments and timeline, and tells the user to run `npx videowright dev`. No ping-pong Q&A when the input was rich.
- **Plain-language fallback**: When in doubt the user can describe what they want in plain English; the skill's flows pull the right detail out of them without making them learn the lib's vocabulary.

**Quality bar**

- A fresh user reaches a polished first video — picked style + scaffolded segments + working `npx videowright dev` — in under 3 minutes from project setup.
- Every default the skill picks looks good. The hello-world video must look professional, not placeholder-ugly.
- The agent never asks a question whose answer is already in the user's input.

---

## 3. Skill file layout

This is the structure to lock during speccing. The file set, names, and ownership boundaries live here; per-file content is detailed in later sections.

```
skill/
├── SKILL.md                                # entry, intent dispatch, setup gate
├── references/
│   ├── setup.md                            # first-time scaffold; gated by config marker
│   ├── setup_new_style.md                  # author a named style (3 modes); reused
│   ├── new_video.md                        # intent capture + PLAN.md construction
│   ├── create_or_edit_video.md             # translate PLAN.md → segments/timeline; also handles edits
│   ├── authoring_segment.md                # segment lifecycle, timing, idempotency, footguns
│   ├── voiceover.md                        # VO field, `videowright script`, VO-first workflow
│   ├── styles.md                           # style structure, how videos consume styles, style-matching
│   ├── export.md                           # `record` / `render`, output paths, gotchas
│   ├── testing.md                          # what's worth testing + examples
│   ├── dev_server.md                       # `videowright dev`, URL hash, hot reload, HUD, keys
│   ├── project_structure.md                # consumer repo layout + file-ownership rules
│   └── types.md                            # quick TS types reference
└── assets/
    ├── hello_world/                        # starter video templates (.tmpl)
    │   ├── timeline.ts.tmpl
    │   ├── README.md.tmpl
    │   ├── PLAN.md.tmpl
    │   ├── voiceover/script.md.tmpl
    │   └── segments/
    │       ├── hello_intro.ts.tmpl
    │       └── hello_outro.ts.tmpl
    └── styles/                             # built-in style packs
        ├── modern/
        ├── retro/
        ├── bauhaus/
        └── animated-explainer/
```

Each style pack folder contains `STYLE.md` (frontmatter + rules), `tokens.css`, and a `sample-segment/index.ts.tmpl`. Details in §10.

### Cross-link map

Who loads what when:

- **`SKILL.md`** → `setup.md` (only when setup gate is open), `new_video.md`, `create_or_edit_video.md`, `styles.md`, `voiceover.md`, `export.md`, `dev_server.md`, `testing.md`.
- **`setup.md`** → `setup_new_style.md` (for the first style).
- **`new_video.md`** → `setup_new_style.md` (when user wants a new style for this video), `create_or_edit_video.md` (after PLAN.md is confirmed).
- **`create_or_edit_video.md`** → `authoring_segment.md`, `styles.md`, `voiceover.md`, `project_structure.md`, `types.md`.
- **`styles.md`** → `setup_new_style.md` (for "add a style" / "change default style" intents).

No file repeats content owned by another. When the same prose is needed in two places, the calling file links instead of restating.

---

## 4. SKILL.md (entry behavior)

`SKILL.md` is loaded into agent context whenever the skill triggers. It must be tight — every line either teaches Videowright at a glance, lists a trigger, or routes to a reference.

### Sections

1. **What Videowright is** — one short paragraph. Brief but complete: animated explainer videos in HTML/CSS/JS, library + skill, primitives are `defineSegment` / `Timeline`, dev mode is interactive, render mode is automated. Agents are smart; good context is the leverage.
2. **When to trigger** — bullet list: "make me a video", "edit segment X", "add a style", "change default style", "match the look of <past video>", "generate a script for X", any time `videowright.config.ts` is touched, any time the user mentions Videowright.
3. **Setup gate** — pseudo-instruction: read `videowright.config.ts`. If it does not exist OR `defaultStyle` is missing/empty, load `setup.md` and follow it before continuing. Otherwise, do not load `setup.md`.
4. **Intent dispatch** — table mapping user intent to reference file:

   | Intent | Reference |
   |---|---|
   | First-time setup of a Videowright project | `setup.md` |
   | New video | `new_video.md` |
   | Edit a video (add/remove/reorder segments, restyle, rewrite VO) | `create_or_edit_video.md` |
   | Add a new style | `setup_new_style.md` |
   | Change the default style | `styles.md` (covers config edit + cascade) |
   | Match a past video's style | `styles.md` |
   | Generate / regenerate VO script | `voiceover.md` |
   | Run / review the dev server | `dev_server.md` |
   | Export the video | `export.md` |
   | Write tests | `testing.md` |

5. **Core principles** — the locked do-and-don't list (current `SKILL.md` already gets this right; carry over and tighten):
   - Always `defineSegment`. Beat tracking + abort signal + typing.
   - Timing: `ctx.waitForNext()` and `ctx.hold(ms)` only. Never `setTimeout` / `setInterval` (breaks render-mode clock).
   - No `duration` field on segments.
   - Any web tech welcome inside segments (Three.js, GSAP, shadcn, Lottie, echarts, animated SVG).
   - PLAN.md is the working memory. Read first; append after meaningful changes.
   - Reuse, don't copy. Top-level `segments/`, `components/`, `transitions/` are shared.
   - Voiceover-first authoring is the default for new videos.

### Intent ambiguity

If the user's invocation does not name a clear intent, the skill asks one focused question listing the dispatch table options ("which of these are you doing?"). It does not guess.

### One-shot vs. interactive

The skill never asks a question whose answer is already in the user's input. `new_video.md` (§7) details how the agent decides to one-shot vs. iterate. `SKILL.md` itself does not duplicate that logic — it just routes.

---

## 5. Setup workflow (`setup.md`)

`setup.md` runs only when `SKILL.md`'s setup gate is open: `videowright.config.ts` is missing, or `defaultStyle` is missing/empty in it.

### Gate semantics

| Config state | Result |
|---|---|
| File missing | Open gate. Run all setup steps. |
| File exists, `defaultStyle` missing or empty string | Open gate. Skip directory scaffolding (already done); jump to the style step. |
| File exists, `defaultStyle` set to a slug | Closed gate. Don't load `setup.md`. |

A partial setup (config exists but no style) resumes at the style step. The skill never re-scaffolds files that already exist.

### Preconditions

`setup.md` assumes `videowright` is installed and the agent's instruction-file pointer is in place — both are the install project's responsibility. If `videowright` is missing from `package.json`, `setup.md` tells the user to run the install project first and stops.

### Steps

1. **Confirm intent.** "I'll set up a Videowright project here. OK to proceed?" Stop on no.
2. **Pick first video name.** Default `demo_video`. Date prefix suggested, not enforced.
3. **Pick first style.** Dispatch to `setup_new_style.md` (§9). Required — the user must pick or create a style. The hello-world video's quality depends on it.
4. **Scaffold the consumer repo.** Create the directory structure (§9 of architecture, will be detailed there), write `videowright.config.ts` with `projectStructure: 'v1'` and `defaultStyle: '<slug from step 3>'`, copy hello-world templates into `videos/<name>/` and `segments/`. Hello-world templates substitute `{{video_name}}`, `{{title}}`, `{{date}}`, and reference the chosen style's tokens via CSS variables.
5. **Confirm.** Tell the user what was created and to run `npm install && npx videowright dev`.

### Why pick is mandatory

Skipping the style step leaves the project without design tokens; the hello-world looks placeholder-ugly. Built-in style packs make the friction near-zero (one menu pick → the rest is templated). A "skip and add later" path is rejected.

---

## 6. setup_new_style workflow (`setup_new_style.md`)

The shared style-creation flow. Called from:

- `setup.md` → first style during initial setup.
- `new_video.md` → user wants a different style for this specific video.
- `styles.md` → "add a style" / "change default style" intents.

The caller passes context: which folder slug to write to (default: derived from the style name), and whether to set the result as the project's `defaultStyle` (yes for setup, no for per-video styles, configurable for explicit "change default style" intents).

### Three modes

The skill asks the user which mode they want:

**Mode 1 — Ingest an existing style guide.** The user has a brand-deck, CSS file, or paste-able description.

- The agent prompts: "Drop the content in chat. If you have a large file or many files, point me at an existing folder path on disk."
- The agent does **not** create a new top-level dir for source material. Folder paths the user provides are read in place.
- The agent transforms whatever the user provides into a `styles/<slug>/` folder (`STYLE.md` + `tokens.css` + sample segment).

**Mode 2 — Describe in chat.** The user types something like "Modern look using Inter, white background, #e0e230 accent, sans-serif headers, monospace for code."

- The agent drafts a full `STYLE.md` and `tokens.css` from the description.
- The agent reads it back to the user as a brief overview ("Here's what I built: ...") and asks "look good or any changes?"
- Iterate until confirmed.

**Mode 3 — Pick a built-in style pack.** Choose one of the 4 packs (§10). The agent copies the pack from `skill/assets/styles/<slug>/` into the consumer repo at `styles/<slug>/`. The slug is locked to the pack's slug (no rename) for clarity.

After any mode, the user's copy in `styles/<slug>/` is the source of truth. The skill does not auto-update it from `skill/assets/` later.

### Final actions

1. Write `styles/<slug>/STYLE.md`, `styles/<slug>/tokens.css`. Optionally copy the sample segment into `segments/<slug>-sample/index.ts` if the user opts in (default: yes during setup so hello-world has good content; default: no when adding a style mid-project).
2. If the caller asked, set `defaultStyle: '<slug>'` in `videowright.config.ts`.
3. Confirm to the user.

---

## 7. New video workflow (`new_video.md`)

Two phases: **design** (this file) and **build** (`create_or_edit_video.md`). The handoff is one-shot when the user's input is rich; iterative when it isn't.

### Inputs to capture

The agent must know the following before handing off to `create_or_edit_video.md`. It asks only for what's missing.

- **Video name** — for the `videos/<name>/` folder. Suggest a date prefix.
- **Purpose** — what is this video for, who is the audience, what's the takeaway.
- **Style** — confirm `defaultStyle` is right; if not, dispatch to `setup_new_style.md` and use the resulting slug.
- **Audio intent** — voiceover / music / silent. (Intent only; see §11.)
- **Hard guidelines** — must-haves: specific charts, logos, screenshots, length cap, avoid X.
- **Script** — if the user has voiceover copy, capture it. If not, the agent drafts one *during build* based on the other inputs.
- **Segment outline (optional)** — if the user has a structure in mind, capture it. Otherwise the build phase generates one from script + purpose.

### One-shot vs. iterate

The agent reads the user's invocation. If it already contains a multi-paragraph script plus enough purpose/style/audio signals, the agent drafts the PLAN.md in one pass and presents it for confirmation: "Here's the plan I built from your input — anything to change?"

If the input is sparse, the agent asks **only the missing questions**, grouped into a single round. No back-and-forth on already-answered items.

The default posture is **propose, don't interrogate**. When uncertain, the agent puts a reasonable answer in the proposed PLAN.md and flags it for review rather than asking another question.

### Output: confirmed `PLAN.md`

`PLAN.md` is written into `videos/<name>/PLAN.md` once the user confirms. Structure in §12. Then dispatch to `create_or_edit_video.md` with the new-video flag set so it scaffolds segments + timeline rather than editing existing files.

---

## 8. Create-or-edit video workflow (`create_or_edit_video.md`)

A single file because the underlying mechanics — segments, timeline composition, styles, VO, tokens — are the same whether scaffolding fresh or modifying. The skill does not separately describe "how to add a segment"; it describes how Videowright works, and the agent reasons from there.

### What this file teaches

- How segments + timeline + styles fit together (links to `project_structure.md`, `styles.md`, `authoring_segment.md`, `voiceover.md`, `types.md`).
- How to read `PLAN.md` and translate it into segments and timeline composition.
- How to edit an existing video without breaking it: respect existing segment ids (renames cascade through timelines), keep segment idempotency (§16), append to PLAN.md after meaningful changes.
- When to introduce shared `components/` and `transitions/` vs. inlining.
- The reuse rule: any video can use any segment in `segments/`. Don't duplicate.
- VO field on segments; `videowright script` round-trips between segments and `voiceover/script.md`.
- How to use the chosen style's tokens (CSS variables in `styles/<slug>/tokens.css`) inside segments.

### Modes

The flow is the same with two entry points:

- **Create** (after `new_video.md`): video folder doesn't exist; PLAN.md was just written. Scaffold `videos/<name>/`, generate segments to match PLAN, wire timeline, run `videowright dev` to verify.
- **Edit**: video folder exists. Read `PLAN.md` first. Make the change requested. Append to PLAN.md log. Run `videowright dev` to verify nothing regressed.

### Verification

After scaffolding or significant edits, the agent runs `npx videowright dev` (or asks the user to) and confirms the video plays end-to-end before declaring done.

---

## 9. Style architecture (consumer repo side)

### Directory shape

```
<consumer-repo>/
├── styles/
│   ├── modern/                 # one folder per installed style; slug = folder name
│   │   ├── STYLE.md            # description + rules + frontmatter
│   │   ├── tokens.css          # CSS custom properties (only required token format)
│   │   └── (optional further files the user adds)
│   └── retro/...
└── videowright.config.ts       # references defaultStyle by slug
```

There is **no** `styles/default/`. Every style has a real name. Multiple styles can coexist in one repo. The user can add and remove styles at will via `setup_new_style.md`.

### Config

```ts
import { defineConfig } from 'videowright';

export default defineConfig({
  projectStructure: 'v1',
  defaultStyle: 'modern',                      // required after setup; dual-purposes as setup marker
  defaults: { resolution: [1920, 1080], fps: 60, aspectRatio: '16:9' },
  transitions: { /* ... */ },
});
```

`defaultStyle` is a **string** (the slug of one of the folders in `styles/`). The skill validates that the named folder exists; if not, it errors during setup or edit.

### Per-video override

```ts
const timeline: Timeline = {
  meta: {
    title: 'January 2026 Launch',
    style: 'retro',                            // optional; falls back to config defaultStyle
  },
  segments: [...],
};
```

If `meta.style` is set, it points to a slug in `styles/`. The skill loads that style's tokens for the video.

### Per-segment

No `style` field on segment entries. Segments are free-form: import any tokens, write any CSS, ignore the project style entirely if they want. The "style" of a video is a directive the *author* honors via the segments they write — it isn't enforced by the lib.

### Token consumption

Tokens are consumed via CSS variables. Segments write `var(--color-accent)` etc. There is no TypeScript token mirror — segments can import the CSS file directly (vite/bundler handles it) and reference variables.

---

## 10. Built-in style packs

Four packs ship with the skill at `skill/assets/styles/<slug>/`. They are templates copied into the consumer repo on demand; once copied, the user's copy is the source of truth.

### Pack contents

Each `skill/assets/styles/<slug>/`:

| File | Purpose |
|---|---|
| `STYLE.md` | Frontmatter (`title`, `picker_description`, `font_sources`) + body (aesthetic rules, when to use, what makes this style distinctive). The agent reads this when authoring segments in this style. |
| `tokens.css` | CSS custom properties: colors (semantic + raw), font families, font sizes, spacing, radii, shadows. Imported by segments. |
| `sample-segment/index.ts.tmpl` | One example segment demonstrating the style — typography, layout, motion. Copied into the user's `segments/<slug>-sample/` on opt-in. |

### The 4 packs (locked names; pack design is an implementation phase)

1. **Modern** — clean, tech-product polish, sans-serif, restrained motion, plenty of whitespace.
2. **Retro** — 80s/90s-inspired warmth, bolder color, typographic personality.
3. **Bauhaus** — geometric, primary palette, strict grid, motion that respects the system.
4. **Animated Explainer** — illustrative, generous motion, friendly typography; the "Kurzgesagt feel."

Each pack must look polished by 2026 design standards. Implementation is a dedicated phase per pack (or one phase for all four — architecture decision).

### Fonts

Default to Google Fonts URLs declared in `STYLE.md` frontmatter (`font_sources: ["https://fonts.googleapis.com/..."]`). No self-hosted fonts shipped in v1; users who need self-hosted fonts can add them via `setup_new_style.md` modes 1 or 2.

---

## 11. Audio (intent capture only)

The new-video flow asks the user about audio: **voiceover**, **music**, or **silent**. The answer is recorded in PLAN.md and informs design (e.g., longer beat holds for silent, VO field populated for voiceover).

The lib does **not** play audio in v1. The skill must explicitly tell the user this when the answer is "music" or "voiceover":

> Audio playback isn't implemented in Videowright yet. Your video will be silent in dev and export. The voiceover script is generated for review and external TTS / mixing in post.

If the user picks voiceover, the existing VO field + `videowright script` flow applies (see `voiceover.md`).

The audio question is not skipped even when the input is rich — silent is a real choice and changes pacing.

---

## 12. PLAN.md structure

Single file with two sections, one mutable, one append-only.

```markdown
# Plan: <video title>

## Purpose
- Audience: ...
- Takeaway: ...
- Constraints / hard guidelines: ...

## Style
- defaultStyle / per-video style: <slug>
- Notes: ...

## Audio intent
- Mode: voiceover | music | silent
- Notes: ...

## Segment outline
1. <id> — <one-line purpose>
2. ...

## Script (if applicable)
<full VO script or pointer to voiceover/script.md>

---

## Log

### YYYY-MM-DD — Initial scaffold
- ...

### YYYY-MM-DD — User feedback
- ...
```

**Rules**

- The `# Plan` block (Purpose / Style / Audio / Segment outline / Script) is **mutable** — overwritten as the design evolves. The `create_or_edit_video.md` flow updates it when the user confirms changes.
- The `## Log` block is **append-only**. Never delete entries.
- When the agent makes meaningful changes (script revision, segment add/remove, style swap, design pivot), it appends a dated log entry.
- When in doubt, log it.

---

## 13. Reference content scope

Each reference file's content domain. Detailed prose is an implementation concern; the spec locks scope and ownership boundaries.

| File | Owns | Does not own |
|---|---|---|
| `authoring_segment.md` | Segment lifecycle (`mount`/`play`/`unmount`), `defineSegment`, `ctx.waitForNext` / `ctx.hold`, idempotency, `ctx.signal`, the `setTimeout` footgun, "any web tech welcome" guidance, internal beats. | Timeline composition (→ `create_or_edit_video.md`), styles (→ `styles.md`). |
| `voiceover.md` | The `voiceover` field on segments, VO-first authoring pattern, `videowright script` CLI usage, where script.md lives. | Audio playback (out of scope), TTS integration (out of scope). |
| `styles.md` | Style folder structure in consumer repo, how segments consume tokens, how to swap default style, "match this past video's style" workflow. | Style creation (→ `setup_new_style.md`). |
| `export.md` | `videowright record` and `videowright render` invocations, output paths, gotchas (full-screen player, window focus, ffmpeg deps). | Audio mixing (out of scope). |
| `testing.md` | What's worth testing in a Videowright project: timing-file alignment with segments, advance-count coherence, snapshot of rendered DOM at key beats. Examples, not prescriptions. | Lib's own test suite. |
| `dev_server.md` | `videowright dev`, default discovery (most-recent video by mtime), URL hash for position, hot reload behavior, HUD toggle, keyboard shortcuts. | Render mode (→ `export.md`). |
| `project_structure.md` | The §9-style consumer repo layout, file ownership rules ("anything in a top-level dir is shared"), naming guidance. | Per-workflow scaffolding (→ workflow files). |
| `types.md` | Quick reference for `Segment`, `PlayerContext`, `Timeline`, `TimelineMeta`, `Transition`, `Config`. Type signatures + one-line purpose. | Authoring rules (→ `authoring_segment.md`). |

The spec philosophy: **describe how Videowright works, not how to do every task.** "Adding a segment" is implicit in `authoring_segment.md` + `project_structure.md` + `create_or_edit_video.md`. The agent reasons from primitives.

---

## 14. Config and timeline contract changes

Driven by §9.

### `videowright.config.ts`

Adds `defaultStyle: string`. Required field once setup is complete. Empty string or absence = setup gate is open.

```ts
defineConfig({
  projectStructure: 'v1',
  defaultStyle: 'modern',
  defaults: { ... },
  transitions: { ... },
});
```

### `timeline.ts`

`meta.style?: string` — optional override. Falls back to `defaultStyle` from config.

```ts
{
  meta: {
    title: '...',
    style: 'retro',  // optional
    aspectRatio: '16:9',
    resolution: [1920, 1080],
    fps: 60,
  },
  segments: [...],
}
```

These are skill-driven contracts; the lib must accept them. Validation:

- `defaultStyle` slug must correspond to an existing `styles/<slug>/` folder. CLI errors with the missing slug + path it expected.
- `meta.style` slug must correspond to an existing `styles/<slug>/` folder. Same error model.

---

## 15. Edge cases

| Situation | Behavior |
|---|---|
| `videowright.config.ts` missing | Setup gate open. Run `setup.md`. |
| Config exists but `defaultStyle` empty | Setup gate open. Resume at style step only — don't re-scaffold dirs. |
| Config exists, `defaultStyle` references a slug with no `styles/<slug>/` folder | Error at use-time with a clear message; offer to re-run `setup_new_style.md`. |
| User invokes the skill with a clear intent + rich input | One-shot the relevant flow; confirm once at the end. |
| User invokes with sparse / ambiguous intent | Ask one question listing dispatch table options. |
| User pastes a huge style guide into chat (Mode 1) | Agent prompts for a folder path on disk instead. No new top-level dir created. |
| User wants to add a style mid-project | `styles.md` → `setup_new_style.md` with `setAsDefault: false` by default. |
| User wants to change default style mid-project | `styles.md` → edit config. Existing videos with `meta.style` set are unaffected; videos without override get the new style. |
| Sample segment from a style pack already exists in `segments/` | Skip the copy; tell the user. |
| User asks "make me a video" before setup | Setup gate triggers via `SKILL.md`. Run `setup.md` first; new-video flow continues after. |
| User asks for music or VO playback in dev | Skill explicitly notes audio is not implemented; intent captured in PLAN.md regardless. |
| `videowright` not installed in `package.json` | `setup.md` tells the user to run the install project; stops. |
| Existing video's segment ids collide with a new segment's id | Surface the collision; ask the user to rename or merge. |

---

## 16. Constraints

- **Skill content only.** No lib runtime / CLI changes.
- **Plain markdown.** No agent-format-specific frontmatter beyond what agent-skills.io requires. Same files must be readable by Claude Code, Codex, opencode (compatibility verification deferred).
- **Templates parse.** All `.tmpl` files must produce valid TypeScript / Markdown after substitution.
- **Cross-link integrity.** Every link in `SKILL.md` and reference files resolves to an existing file. Linter check in CI.
- **Variable substitution.** All `{{var}}` placeholders in templates are listed in a documented substitution map.
- **License.** All built-in style packs use MIT-compatible assets only. Google Fonts URLs are fine; non-MIT fonts are rejected.

---

## 17. Acceptance criteria

The project ships when:

1. A fresh user with `videowright` installed can run setup and reach a polished hello-world video in under 3 minutes.
2. The hero-use-case eval passes: paste a complete brief, agent one-shots PLAN.md, scaffolds the video, reports it ready. Single confirmation round.
3. All 4 built-in style packs install cleanly and look polished.
4. Switching `defaultStyle` (or setting `meta.style` per-video) re-skins hello-world without breaking it.
5. The dispatch table in `SKILL.md` covers the user-facing intent surface; no documented intent has no reference.
6. CI passes: cross-link linter, template substitution-map linter, typecheck on assets after substitution.

The eval set lives in the architecture/implementation-plan phases, not here.
