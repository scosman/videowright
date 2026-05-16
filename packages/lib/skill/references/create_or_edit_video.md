# Create or Edit Video

## When this is loaded

You were dispatched here from one of:

- **[new_video.md](new_video.md)** — create mode. The `videos/<name>/` folder is new and PLAN.md was just confirmed. Scaffold segments and timeline from the plan.
- **SKILL.md intent dispatch** — edit mode. The video already exists. Read PLAN.md, make the requested change, and append to the log.

This is a single file because the underlying mechanics — segments, timeline composition, styles, voiceover — are the same whether scaffolding fresh or modifying.

## What you need to know

These reference files cover the building blocks. Load them as needed — do not re-read this section's summaries when the full reference is available.

- **[authoring_segment.md](authoring_segment.md)** — segment lifecycle (`mount`/`play`/`unmount`), `defineSegment`, timing with `ctx.waitForNext()` and `ctx.hold(ms)`, render-safe animation patterns (WAAPI, `ctx.clock()`, patterns and recommendations), idempotency, any-web-tech guidance.
- **[audio.md](audio.md)** — audio workflow (voiceover, SFX, music), the `voiceover` field on segments, VO-first authoring pattern, `videowright script` CLI, file conventions, CLI usage (`--audio-track`).
- **[styles.md](styles.md)** — style folder structure, how segments consume tokens via CSS variables, switching styles, the timeline.ts import convention.
- **[project_structure.md](project_structure.md)** — consumer repo layout, file-ownership rules (top-level dirs are shared, per-video files live in `videos/<name>/`).
- **[types.md](types.md)** — quick reference for `Segment`, `PlayerContext`, `Timeline`, `TimelineMeta`, `Config`.

## Create mode

Entry condition: `videos/<name>/` was just created by new_video.md, and PLAN.md is confirmed.

### Step 1 — Read the plan

Read `videos/<name>/PLAN.md`. Extract:

- The segment outline (segment ids and their purposes).
- The style slug (from the Style section).
- The audio intent.
- The script (if present).

### Step 2 — Author segments

For each segment in the outline:

1. **Check if a segment with that id already exists** in `segments/<id>/index.ts`. If it does and is reusable for this video, use it. Do not duplicate.
2. **Create `segments/<id>/index.ts`** using `defineSegment`. Follow the rules in [authoring_segment.md](authoring_segment.md):
   - **Fill the frame.** Size text and visuals for a video canvas, not a web page. Body text 36px+ at 1080p, headings 64px+. Content containers should span 80-90%+ of the video width. See the "Visual sizing" section in [authoring_segment.md](authoring_segment.md).
   - **`waitForNext()` for VO-aligned beats.** Place a `waitForNext()` at every content reveal that a voiceover should cue. Use `ctx.hold(ms)` only for animation lead-in or fixed internal pauses. This keeps segments decoupled from any single voiceover — swapping narration only requires new timing data, not segment rewrites.
   - Prefer WAAPI (`.animate()` with `delay`) or CSS animations for smooth visual motion (smoother easing, less code). Timer-based patterns (`setTimeout`, `setInterval`, hold loops) also work deterministically under the render shim. See the render-safe animation patterns in [authoring_segment.md](authoring_segment.md).
   - Set the `advances` array to match the timing — one entry per beat, including the final advance that transitions to the next segment (see [authoring_segment.md](authoring_segment.md) for details on how `advances` maps to `waitForNext` and `hold` calls).
   - If audio intent is voiceover, set the `voiceover` field to the segment's VO text (from the script or drafted to match the segment's purpose). For music or silent videos, leave `voiceover` empty — use code comments to document what the segment shows.
   - Use CSS variables from the active style: `var(--color-accent)`, `var(--font-display)`, etc. Do not import tokens.css in segments — the timeline-level import provides them.
3. **Use any web tech.** Three.js, GSAP, Lottie, animated SVG, shadcn, echarts — all welcome inside segments. Pick the right tool for the visual.

### Step 2b — Review each segment (render-safety and design CR)

After writing each segment, perform a focused code review before moving on. This catches style issues, visual sizing problems, timing anti-patterns, and ensures idiomatic use of render-safe patterns.

**Checklist -- review the segment code for:**

1. **Visual sizing — content fills the frame.** Text, cards, stats, and key visuals should be large and legible. Body text should be at least 36px at 1080p; headings 64px+. No `max-width: 800px` web-page centering. Primary containers should span 80-90%+ of the video width. If the segment would look like a small island surrounded by empty space, increase sizes. See the "Visual sizing" section in [authoring_segment.md](authoring_segment.md).
2. **`waitForNext()` used for VO-aligned beats.** Every content reveal that a voiceover might want to cue differently should be gated by `waitForNext()`, not `hold()`. `hold()` is for animation lead-in or fixed internal pauses. If a different voiceover would want to trigger a reveal at a different time, it must be `waitForNext()`. See the timing guidance in [authoring_segment.md](authoring_segment.md).
3. **Prefer WAAPI for DOM animation** (smoother easing, less code). Timer-based patterns (`setTimeout`, `setInterval`, rAF loops, `performance.now`) all work deterministically under the render shim but WAAPI provides smoother sub-frame interpolation.
4. **`ctx.hold` loops are fine for stepped/discrete changes** (e.g., typing out characters). For eased motion, prefer WAAPI with per-element `delay`.
5. **`ctx.clock()` used** for any code that needs the current render time (Three.js rotation, Lottie frame drive, shader uniforms, etc.).
6. **WAAPI / CSS animations used** for DOM animations. Staggered entrances prefer WAAPI `delay` parameter over `ctx.hold()` between `.animate()` calls (less code, smoother easing).
7. **Lottie uses manual frame drive** -- `autoplay: false` with `anim.goToAndStop(ctx.clock(), false)` per tick.
8. **Three.js reads `ctx.clock()`** for time-derived values (preferred for clarity; `performance.now()` also works under the shim).
9. **Imports, types, and segment shape** match project conventions (see [authoring_segment.md](authoring_segment.md)).

**If any issue is found:** fix the segment code, then re-check the full checklist before continuing. A segment is ready only after a clean pass.

See the "Render-safe animation patterns" section in [authoring_segment.md](authoring_segment.md) for the full list of patterns and recommendations with examples.

### Step 3 — Write timeline.ts

Create `videos/<name>/timeline.ts`:

```ts
import '../../styles/<slug>/tokens.css';
import type { Timeline } from 'videowright';

const timeline: Timeline = {
  meta: {
    title: '<video title from PLAN.md>',
    // style: '<slug>',  // include only if overriding defaultStyle
  },
  segments: [
    { id: '<segment-1>' },
    { id: '<segment-2>', transition: 'fade' },
    // ...
  ],
};
export default timeline;
```

Key rules:

- **Top-of-file CSS import.** Always import the active style's `tokens.css` as the first line. The agent writes this import to match the chosen style — it is not copied from a template. The import path is relative to `timeline.ts`. Adjust `../../` depth to match directory structure.
- **Keep the import in sync.** The CSS import must match `meta.style ?? config.defaultStyle`. See [styles.md](styles.md) for details.
- **Set `meta.style`** only when overriding the project `defaultStyle`. If using the default, omit the field.
- **Transitions** are optional on each segment entry. Use built-in transitions (`fade`, `slideLeft`, `slideRight`) or custom ones from `transitions/`.

### Step 4 — Write voiceover script file

This step applies only when the video has a voiceover. For videos without voiceover, skip it entirely.

The voiceover system has two parts that stay in sync:
- **`voiceover` field** on each segment (in `segments/<id>/index.ts`) — the VO text for that segment. Set this in step 2 above.
- **`voiceover_script/script.md` file** (in `videos/<name>/voiceover_script/script.md`) — the full script for the video, organized by segment id. Written here.

Steps:

1. Create `videos/<name>/voiceover_script/script.md` with the full script, organized by segment id (one `## segment-id` heading per segment).
2. Verify each segment's `voiceover` field matches its section in the script. These must stay in sync — `videowright script` can regenerate one from the other.
3. See [audio.md](audio.md) for the audio workflow and [audio/voiceover.md](audio/voiceover.md) for the VO-first authoring pattern and `videowright script` usage.

### Step 5 — Shared resources

When writing segments, decide what belongs in shared directories:

- **`components/`** — reusable web components used across multiple segments (e.g., `<animated-title>`, `<feature-card>`). If a visual element appears in more than one segment, extract it.
- **`transitions/`** — custom transition functions. Only create if a built-in transition does not fit.
- **`segments/`** — all segments live here, shared across all videos. Any video can reference any segment. Name them descriptively.

The reuse rule: do not copy a segment to modify it for a different video. If two videos need the same visual with slight differences, parameterize the segment or extract the shared parts into a component.

### Step 6 — Update PLAN.md log

Append a dated entry to the Log section of `videos/<name>/PLAN.md`:

```markdown
### YYYY-MM-DD — Initial scaffold
- Created segments: <list of segment ids>
- Timeline: <number> segments, style: <slug>
- Voiceover: <drafted / user-provided / none>
```

### Step 7 — Verify

Run `npx videowright dev` (or ask the user to run it) and confirm:

- The video loads without errors.
- All segments play in order.
- Transitions work.
- The style's CSS variables are applied (colors, fonts look correct).

If something is broken, fix it before declaring done.

### Step 8 — Post-build handoff

After the video is verified, present the user with an explicit choice. Show this message verbatim:

> Two options:
> 1. **Edit the video content** — tell me what to change (segments, copy, animations, style).
> 2. **Set up audio** — I'll walk you through voiceover, SFX, and music.

If the user picks option 1, stay in this file and follow edit-mode instructions below for whatever they want to change.

If the user picks option 2, immediately load [audio.md](audio.md) and follow its flow entry point. Do not add any intermediate questions — audio.md handles intake.

If audio intent is **silent**, omit option 2 and instead just ask: "The video is ready. Want to make any changes?"

## Edit mode

Entry condition: `videos/<name>/` already exists with a PLAN.md and timeline.ts.

### Step 1 — Read PLAN.md

Always read `videos/<name>/PLAN.md` before making any changes. Understand the current state of the video — its segments, style, audio intent, and history.

### Step 2 — Make the requested change

Common edit operations:

**Add a segment:**
1. Create `segments/<id>/index.ts` following the rules above.
2. Add the segment entry to `timeline.ts` in the correct position.
3. Update the segment outline in PLAN.md.

**Remove a segment:**
1. Remove the segment entry from `timeline.ts`.
2. Do **not** delete the segment file from `segments/` — other videos may use it. Only delete if you confirm no other timeline references it.
3. Update the segment outline in PLAN.md.

**Reorder segments:**
1. Reorder the entries in `timeline.ts`.
2. Update the segment outline in PLAN.md.

**Restyle the video:**
1. Update the top-of-file CSS import in `timeline.ts` to point to the new style.
2. Update `meta.style` (if present) to match.
3. Segments do not need to change — CSS variables resolve at runtime from the timeline's import. If the new style defines different tokens than what segments reference, verify the segments still look correct.
4. See [styles.md](styles.md) for the full swap workflow.

**Rewrite voiceover:**
1. Edit the `voiceover` field on affected segments.
2. Run `npx videowright script` to regenerate `voiceover_script/script.md` from the updated segment fields. See [audio/voiceover.md](audio/voiceover.md).

**Edit a segment's content:**
1. Modify `segments/<id>/index.ts` directly.
2. If timing changes, update the `advances` array to match.
3. If voiceover changes, update the `voiceover` field.

**After any segment is created or modified**, run the render-safety CR checklist from Step 2b (create mode) against the changed segment. Fix any issues before continuing.

### Step 3 — Respect existing segment ids

Segment ids are the primary key. Renaming a segment id cascades through:
- Every `timeline.ts` that references it.
- The `voiceover_script/script.md` heading.
- The PLAN.md segment outline.

If you must rename, update all references. Prefer keeping existing ids unless the user explicitly asks for a rename.

### Step 4 — Append to PLAN.md log

After any meaningful change, append a dated entry:

```markdown
### YYYY-MM-DD — <what changed>
- <description of the change and why>
```

### Step 5 — Verify

Run `npx videowright dev` and confirm the video still plays end-to-end. Check that the edit did not break existing segments or transitions.

## Edge cases

| Situation | Behavior |
|---|---|
| Segment id in PLAN.md conflicts with an existing segment | Surface the collision. Ask the user to rename or merge. |
| Video references a segment that does not exist | Create it. Follow the create-mode segment authoring rules. |
| Style slug in PLAN.md does not exist in `styles/` | Offer to create it via [setup_new_style.md](setup_new_style.md) or pick an existing style. |
| User asks to edit a video that has no PLAN.md | Create a PLAN.md by reading the existing `timeline.ts` and segments. Back-fill the plan from what exists, then proceed with the edit. |
| User asks to "add a segment" without specifying which video | Check how many videos exist. If one, use it. If multiple, ask which video. |
| `npx videowright dev` fails | Read the error output. Common issues: missing segment file, TypeScript error in a segment, broken import path. Fix and re-run. |
