# Style Matching

When the user asks to create a video that matches the look of an existing one, follow this process.

## Step 1: Read the style guide

Check `styles/STYLE.md` at the repo root. This file documents the team's design language: colors, typography, spacing, animation patterns, and any conventions that emerged from past videos.

If `STYLE.md` is empty or missing, that is fine -- you will create it as part of this process.

## Step 2: Study the reference video

Read these files from the video to match:

1. **`videos/<name>/timeline.ts`** -- understand the segment order, transitions used, and pacing.
2. **`videos/<name>/PLAN.md`** -- understand design decisions and user feedback that shaped the video.
3. **`videos/<name>/README.md`** -- understand the video's purpose and audience.
4. **Segment source files** -- for each segment in the timeline, read its `segments/<id>/index.ts`. Study:
   - Animation techniques (WAAPI, CSS transitions, GSAP, Three.js, etc.)
   - Color palette and typography
   - Layout patterns (flexbox, grid, absolute positioning)
   - Timing patterns (hold durations, beat pacing)
   - DOM structure and component reuse

## Step 3: Reuse, don't copy

Look in the top-level directories for reusable pieces:

- **`segments/`** -- can the new video reuse existing segments directly? A well-built intro or outro might work across videos.
- **`components/`** -- are there web components (animated logos, card layouts, chart wrappers) that can be reused?
- **`transitions/`** -- custom transitions from the reference video are available to all videos.
- **`styles/tokens.css`** -- design tokens (colors, fonts, spacing) should be shared.

If a segment is close but needs tweaks, create a new segment that imports shared components rather than duplicating the original.

## Step 4: Build the new video

1. Scaffold the new video per [authoring_video.md](authoring_video.md).
2. Apply the same design patterns observed in Step 2:
   - Same color tokens from `styles/tokens.css`
   - Same animation library/approach
   - Similar timing and pacing
   - Same transition types between segments
3. Reuse existing segments where they fit.
4. Create new segments that follow the same coding patterns.

## Step 5: Update STYLE.md

After completing the new video, update `styles/STYLE.md` with any patterns worth preserving:

- New color tokens or typography choices
- Animation techniques that worked well
- Layout patterns that should be consistent
- Transition preferences

### STYLE.md template

```markdown
# Style Guide

## Colors
- Primary: #...
- Secondary: #...
- Background: #...
- Text: #...

## Typography
- Headings: ...
- Body: ...
- Code: ...

## Animation
- Preferred library: WAAPI / GSAP / CSS transitions
- Standard durations: entrance 400ms, exit 300ms, holds 600-1200ms
- Easing: ease-out for entrances, ease-in for exits

## Layout
- Standard padding: ...
- Card pattern: ...
- Grid pattern: ...

## Transitions
- Between related segments: fade (400ms)
- Between sections: slideLeft (500ms)
- For emphasis: custom transition

## Conventions
- ... (document anything that emerged from building videos)
```

## Key principles

- **Consistency comes from shared tokens and components**, not from copying code between segments.
- **The style guide is a living document.** Update it as patterns emerge.
- **Reuse segments and components directly** when they fit. The flat directory structure exists for this reason.
- **When in doubt, match the reference video's approach exactly** -- same library, same animation style, same timing. Diverge only when the user asks for something different.
