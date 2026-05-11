---
name: videowright
description: Author HTML/CSS/JS animated explainer videos using Videowright. Trigger on requests to create a video, edit a segment, add or change a style, generate a VO script, run the dev server, or export.
---

# Videowright

Videowright lets you author high-quality animated explainer videos in HTML/CSS/JS. Videos are composed from segments — self-contained TypeScript modules that own a DOM element and animate it. A `Timeline` orders segments with transitions, the dev server plays them interactively, and the render pipeline exports to MP4. The core authoring primitives are `defineSegment`, `defineConfig`, and the `Timeline` type.

## When to trigger

- "Make me a video about X"
- "Add a segment to \<video\>"
- "Edit the intro of \<video\>"
- "Add a style" / "Change the default style"
- "Match the look of \<past video\>"
- "Generate a script for \<video\>"
- "Add a voiceover" / "Generate a voiceover" / "Record a voiceover"
- "Run the dev server" / "Preview the video"
- "Export the video" / "Render the video"
- "Write tests for \<video\>"
- Any time `videowright.config.ts` is referenced or the user mentions Videowright

## Setup gate

Before doing any work, check `videowright.config.ts` at the repo root:

- If the file **does not exist**, OR `defaultStyle` is missing or empty string: load [references/setup.md](references/setup.md) and follow it before continuing.
- Otherwise: skip `setup.md`. Proceed with intent dispatch below.

## Intent dispatch

Read the user's request and route to the matching reference file:

| Intent | Reference |
|---|---|
| First-time setup of a Videowright project | [references/setup.md](references/setup.md) |
| New video | [references/new_video.md](references/new_video.md) |
| Edit a video (add/remove/reorder segments, restyle, rewrite VO) | [references/create_or_edit_video.md](references/create_or_edit_video.md) |
| Add a new style | [references/setup_new_style.md](references/setup_new_style.md) |
| Change the default style | [references/styles.md](references/styles.md) |
| Match a past video's style | [references/styles.md](references/styles.md) |
| Generate or regenerate a VO script | [references/voiceover.md](references/voiceover.md) |
| Add a voiceover (AI-generated or manual) | [references/voiceover.md](references/voiceover.md) |
| Run or review the dev server | [references/dev_server.md](references/dev_server.md) |
| Export the video | [references/export.md](references/export.md) |
| Write tests | [references/testing.md](references/testing.md) |

If the user's request does not map to a clear intent, ask one focused question listing the options above. Do not guess.

## Core principles

- **Use `defineSegment` always.** It is the canonical authoring path. It handles beat tracking, abort signals, and typing.
- **Fill the frame.** Text and visual elements should be large, legible, and use the full video canvas — body text 36px+ at 1080p, headings 64px+, content containers spanning 80-90%+ of the video width. Avoid excessive margins, padding, or whitespace that shrinks content into a small portion of the frame. If text is too small to read comfortably at normal playback size, make it bigger or remove it. Small decorative labels are acceptable when intentional, but body text, headings, stats, and key visuals must dominate the frame. This is a video, not a web page — there is no scrolling, so every pixel of every frame matters.
- **`waitForNext()` for VO-aligned beats; `hold(ms)` for pacing within a beat.** Use `ctx.waitForNext()` at every point where the video should sync to a voiceover advance — this keeps timing decoupled from any single VO recording, so swapping voiceovers only requires new timing data, not re-authoring segments. Use `ctx.hold(ms)` for pauses that are internal to a beat (entrance animations, dwell time before the next interactive point). Do not bake voiceover-specific durations into `hold()` calls — that couples the segment to one VO and forces re-authoring to swap narration.
- **Render-safety CR on every segment.** After writing or modifying a segment, review it against the render-safety checklist in [references/create_or_edit_video.md](references/create_or_edit_video.md) (Step 2b). This catches patterns that work in dev but may produce suboptimal results in render (e.g., hold-driven mutation loops where WAAPI would give smoother interpolation).
- **No `duration` field on segments.** There is no duration property — the segment decides when it is done via its `play()` function.
- **Any web tech is welcome inside segments.** Three.js, Lottie, animated SVG, shadcn/React, GSAP, echarts — all encouraged. The segment owns its DOM; attach a shadow root if isolation is wanted.
- **PLAN.md is the working memory.** Read it before iterating on a video; append after meaningful changes. Never delete log entries.
- **Reuse, don't copy.** Top-level `segments/`, `components/`, `transitions/` are shared across all videos. Any video can use any segment. Don't duplicate.
- **Voiceover-first authoring is the default for new videos.** Write the script, then scaffold segments to match. This produces coherent videos.
- **One-shot when the input is rich.** Never ask a question whose answer is already in the user's input. When the user provides a complete brief, draft the plan and confirm — don't interrogate.
