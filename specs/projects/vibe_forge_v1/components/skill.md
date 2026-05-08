---
status: complete
---

# Component: Skill

The Claude Code agent skill that teaches Claude to use Videowright fluently. Content, not code.

## Purpose and Scope

**Owns:**

- `skill/SKILL.md` — entry point with frontmatter and dispatch.
- `skill/references/*.md` — focused topic docs the agent loads on demand.
- `skill/assets/` — file templates the skill copies into consumer repos (hello-world video, demo template, framework starters).
- The setup-flow conversation pattern (functional spec §10.1).

**Not owned:**

- Lib runtime → all other component docs.
- Setup-step *behavior* (which is enforced as user-driven prompting, not automation). The skill provides prompts; the agent (Claude) drives.

## Public Interface

The skill is consumed by Claude Code via discovery of `skill/SKILL.md`. End-user-facing surface:

- The user installs the skill (referenced from `.claude/CLAUDE.md` in their consumer repo) — see *Installation* below.
- The user makes natural-language requests ("make me a video about X", "edit the intro segment", "match the style of last quarter's launch video"); the skill triggers and the agent works.

## Internal Design

### File layout

The skill lives **inside** the `videowright` npm package, at `packages/lib/skill/`. It ships in the published tarball (`package.json#files` includes `"skill"`), so `node_modules/videowright/skill/SKILL.md` is the canonical reference path in any consumer repo.

```
packages/lib/skill/
├── SKILL.md                                # entry, with frontmatter
├── references/
│   ├── setup.md                            # §10.1 setup flow prompts
│   ├── authoring_segment.md                # how to write a segment + footguns
│   ├── authoring_video.md                  # scaffold a video, VO-first, PLAN.md
│   └── style_matching.md                   # match a past video's look
└── assets/
    └── hello_world/                        # 2-segment hello-world
        ├── timeline.ts.tmpl
        ├── README.md.tmpl
        ├── PLAN.md.tmpl
        ├── voiceover/script.md.tmpl
        └── segments/
            ├── hello_intro.ts.tmpl
            └── hello_outro.ts.tmpl
```

`.tmpl` suffix marks files the skill copies into consumer repos with light variable substitution (e.g. `{{video_name}}`). Substitution rules and variable list are defined in `references/setup.md`.

There is **no `framework_starters/`** directory. Pre-wired framework starters were considered and rejected — the surface to maintain (React, shadcn, Three.js, echarts, GSAP, Lottie, plus whatever else users want next month) is large, and the agent already knows how to install these tools. Setup asks an open-ended question (see `references/setup.md`); the agent installs whatever the user names.

### `SKILL.md` (sketch)

```markdown
---
name: videowright
description: Author HTML/CSS/JS animated explainer videos using Videowright. Trigger on requests to: create a video, edit a segment, scaffold a new video, match a past video's style, or generate a VO script.
---

# Videowright

Videowright lets a developer (with this agent) author high-quality animated explainer videos in HTML/CSS/JS. The library exposes a small set of primitives (`Player`, `defineSegment`, `Timeline`); this skill teaches the agent how to use them.

## When to trigger

- "Make me a video about X"
- "Add a segment to <video>"
- "Edit the intro of <video>"
- "Generate a script for <video>"
- "Make a video matching <past video>'s style"
- Any time `videowright.config.ts` is referenced.

## Setup check (always first)

Before doing any work, look for `videowright.config.ts` at the repo root. If absent, follow `references/setup.md` to scaffold the consumer repo.

## Workflow dispatch

| Intent | Reference |
|---|---|
| Setup or first run | `references/setup.md` |
| New video / scaffold a video | `references/authoring_video.md` |
| New or edited segment | `references/authoring_segment.md` |
| Match a past video's style | `references/style_matching.md` |

## Core principles

- **Use `defineSegment` always.** It's the canonical authoring path.
- **Timing is `waitForNext` and `hold` only.** Never `setTimeout` / `setInterval` in segments — they break render-mode clock control.
- **No `duration` field on segments.** Ever. Killed in design.
- **Any web tech is welcome inside segments.** Three.js, Lottie, animated SVG, shadcn/React, GSAP — all encouraged. The segment owns its DOM; attach a shadow root if isolation is wanted.
- **PLAN.md is the working memory.** Read before iterating; append after meaningful changes.
- **Reuse, don't copy.** All segments live in `segments/`, all components in `components/`, all transitions in `transitions/`. Any video can use any. There is no `shared/` folder.
```

### `references/setup.md` (sketch)

The setup flow prompts. Key points:

1. **Check intent.** Before scaffolding anything, confirm with the user.
2. **Ask first-video name.** Default `demo_video`.
3. **Ask about specific dependencies — open-ended.** Default: none. The prompt should anchor with examples rather than offer a checklist:

   > Do you have any specific dependencies you want set up? (default: none)
   > Some examples:
   > - "Raw HTML" — vanilla, no extra deps
   > - "Three.js for animations"
   > - "Lottie for logos"
   > - "React and shadcn — we want to emulate our app UI"
   > - "echarts for data visualizations"

   The user answers freely. The agent installs whatever they name using its general knowledge of those tools — there are no pre-built templates.
4. **Scaffold layout.** Create the consumer repo directory tree (functional spec §2), write `videowright.config.ts`, set up `package.json` with `videowright` plus any dependencies named in step 3.
5. **Copy hello-world.** From `node_modules/videowright/skill/assets/hello_world/` into `videos/<name>/` and `segments/`. Apply variable substitution.
6. **Confirm.** Report what was created. Tell the user `npm install && npx videowright dev`.

The reference file includes the exact prompts, fallback prompts ("if the user is unsure, suggest..."), and the variable substitution map.

### `references/authoring_segment.md` (sketch)

Teaches the agent:

- The locked `Segment` interface and the `defineSegment` helper.
- The single timing rule: `play()` resolves when transition out can begin. Background work runs until `unmount()`.
- Use `waitForNext` for user-driven beats. Use `hold(ms)` for fixed delays.
- The `setTimeout` / `setInterval` footgun: works in interactive, breaks in render. Prefer rAF, CSS animations, WAAPI, GSAP.
- `ctx.signal` — pass to `fetch`, abort GSAP timelines, etc.
- Idempotency: `play()` may run multiple times across mounts.
- Voiceover is a field on the segment, not separate.
- The segment receives a plain `<div>`. Attach a shadow root for style isolation, or skip it if you want global CSS to cascade in. The lib doesn't prescribe.
- Internal beats pattern with a worked example.
- "Any web tech welcome" — concrete examples for Three.js, animated SVG, shadcn.

### `references/authoring_video.md` (sketch)

Teaches:

- Folder structure: `videos/<name>/timeline.ts`, `README.md`, `PLAN.md`, `voiceover/`.
- `timeline.ts` format with worked examples.
- VO-first authoring: take a script, scaffold matching segments.
- PLAN.md workflow: read before iterating, append after meaningful changes (script revisions, design choices, user feedback). Concrete template for PLAN.md.
- Reordering = move array entries.
- Promotion is implicit (no `shared/` folder); just leave segments in `segments/` from the start.

### `references/style_matching.md` (sketch)

Teaches:

- Read `styles/STYLE.md` for design notes.
- Read the past video's `timeline.ts`, segments, and `PLAN.md` to understand what works.
- Reuse from top-level `segments/`, `components/`, `transitions/`, `styles/` — no copying.
- Update `STYLE.md` when you discover new patterns worth keeping.

### Installation

For consumer repos, the skill is installed by reference. The consumer's `.claude/CLAUDE.md` includes a pointer to `node_modules/videowright/skill/SKILL.md`. The skill scaffolds this CLAUDE.md entry as part of setup if it isn't already there.

The skill versions in lockstep with the lib — one `npm install videowright` gets both, no separate package to update.

### Templates and variable substitution

Templates use `{{var_name}}` syntax. Variables resolved by setup:

| Variable | Source |
|---|---|
| `{{video_name}}` | User answer (default `demo_video`) |
| `{{date_prefix}}` | Today's date as `YYYY-MM` |
| `{{title}}` | User answer or derived from `video_name` |
| `{{video_path}}` | `videos/{{date_prefix}}-{{video_name}}` (if user accepts date prefix) or `videos/{{video_name}}` |

### Quality bar

A fresh user, given the lib + this skill, reaches a working first video in under 2 minutes. The hello-world video must run on `npx videowright dev` immediately after scaffold.

## Dependencies

**Depends on:**
- The lib's API surface stays stable (the skill teaches against it).
- Templates in `assets/` reference `videowright` correctly.

**Depended on by:**
- End users via Claude Code.
- Quality of skill content directly affects "agent-native" UX.

## Test Plan

The skill is text content; no automated tests.

### Manual evaluation

- **Cold-start eval.** A fresh agent, given only this skill (no lib source), can scaffold a new repo and produce a working 3-segment video. Run before each release.
- **Setup flow eval.** A fresh agent runs the setup flow; verify it asks the locked questions in §10.1 and scaffolds correctly.
- **Authoring eval.** Ask the agent to write a segment with internal beats and an animated SVG; verify the result uses `defineSegment`, uses `waitForNext`, doesn't use `setTimeout`.
- **Style-matching eval.** Build two demo videos, then ask the agent to make a third matching the second's style; verify it reads the right files.

### Programmatic checks (CI)

- Templates parse as valid TS (typecheck assets directory).
- All references in `SKILL.md` resolve to existing files.
- All `{{vars}}` in templates appear in the substitution map (linter script).

## Notes

The skill structure is **explicitly revisable** during implementation. If a better organization emerges (e.g. consolidating two references into one, splitting another), update freely — flag changes in the project's PLAN.md so they're traceable.
