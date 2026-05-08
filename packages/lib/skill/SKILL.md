---
name: videowright
description: Author HTML/CSS/JS animated explainer videos using Videowright. Trigger on requests to create a video, edit a segment, scaffold a new video, match a past video's style, or generate a VO script.
---

# Videowright

Videowright lets a developer (with this agent) author high-quality animated explainer videos in HTML/CSS/JS. The library exposes a small set of primitives (`defineSegment`, `defineConfig`, `Timeline`); this skill teaches the agent how to use them.

## When to trigger

- "Make me a video about X"
- "Add a segment to \<video\>"
- "Edit the intro of \<video\>"
- "Generate a script for \<video\>"
- "Make a video matching \<past video\>'s style"
- Any time `videowright.config.ts` is referenced or the user asks about Videowright

## Setup check (always first)

Before doing any work, look for `videowright.config.ts` at the repo root. If absent, follow [references/setup.md](references/setup.md) to scaffold the consumer repo.

## Workflow dispatch

| Intent | Reference |
|---|---|
| Setup or first run | [references/setup.md](references/setup.md) |
| New video / scaffold a video | [references/authoring_video.md](references/authoring_video.md) |
| New or edited segment | [references/authoring_segment.md](references/authoring_segment.md) |
| Match a past video's style | [references/style_matching.md](references/style_matching.md) |

## Core principles

- **Use `defineSegment` always.** It is the canonical authoring path. It handles beat tracking, abort signals, and typing.
- **Timing is `waitForNext` and `hold` only.** Never use `setTimeout` or `setInterval` in segments -- they break render-mode clock control. Use `ctx.waitForNext()` for interactive beats and `ctx.hold(ms)` for timed pauses.
- **No `duration` field on segments.** The segment decides when it is done via its `play()` function. There is no duration property.
- **Any web tech is welcome inside segments.** Three.js, Lottie, animated SVG, shadcn/React, GSAP, echarts -- all encouraged. The segment owns its DOM; attach a shadow root if isolation is wanted.
- **PLAN.md is the working memory.** Read it before iterating on a video; append after meaningful changes.
- **Reuse, don't copy.** All segments live in `segments/`, all components in `components/`, all transitions in `transitions/`. Any video can use any segment. There is no `shared/` folder.
- **Voiceover-first workflow.** Write the script, then scaffold segments to match. This produces coherent videos.
