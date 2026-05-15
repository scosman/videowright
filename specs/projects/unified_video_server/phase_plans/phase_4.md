---
status: complete
---

# Phase 4: Render Command Updates + Docs

## Overview

This phase adds slug-based resolution and interactive multi-video prompting to `videowright render`, and updates all documentation (README, INSTALL.md, package.json template) to remove `record` references and document the new `render` behavior and homepage.

## Steps

1. **Add `resolveSlugOrPath` to `discover.ts`**
   - Accepts `(arg: string, root: string) => string | null`
   - First tries as slug: `videos/<arg>/timeline.ts`
   - Then tries as literal path (resolved relative to root)
   - Returns absolute path or null

2. **Add `promptVideoSelection` to a new `prompt.ts`**
   - Uses Node `readline` to show numbered list and read user input
   - Validates input (integer in [1, N])
   - Retries up to 3 times on bad input, then exits 1
   - Returns the selected `VideoSummary.timelinePath`

3. **Rewrite `render.ts` discovery logic**
   - Replace `discoverProject(cwd, positional, "render")` with the zero/one/many branching:
     - If positional arg: use `resolveSlugOrPath`, error if null
     - If no arg: call `discoverAllVideos`, then branch on count:
       - 0 videos: error with guidance
       - 1 video: use it directly
       - many + non-TTY: error with slug list
       - many + TTY: interactive prompt
   - Config discovery stays separate (still need it for render params)

4. **Update README CLI section**
   - Remove `npx videowright record` from CLI modes
   - Update render description to explain slug + interactive prompt
   - Document homepage behavior under `npx videowright dev`
   - Fix typo "vdeo" -> "video" in the "How Does Videowright Work?" section

5. **Update INSTALL.md**
   - Remove `"record": "npx videowright record"` from the package.json template
   - Remove `"record"` from the `add "dev", "render", and "record" entries` instruction

6. **Update install package.json template**
   - Remove the `"record"` script from `skill/assets/install/package.json`

## Tests

- **resolveSlugOrPath_slug_match**: slug resolves to timeline path
- **resolveSlugOrPath_path_match**: explicit path resolves
- **resolveSlugOrPath_slug_wins_over_path**: slug takes precedence when ambiguous
- **resolveSlugOrPath_neither**: returns null
- **resolveSlugOrPath_slug_no_timeline**: directory exists but no timeline.ts returns null
- **promptVideoSelection_valid_input**: selecting valid number returns correct path
- **promptVideoSelection_retry_on_invalid**: bad input triggers retry
- **promptVideoSelection_max_retries_throws_UserError**: 3 bad inputs throws UserError
- **render_zero_videos_error**: no videos exits with guidance message
- **render_one_video_auto_pick**: single video renders without prompting
- **render_slug_arg_resolves**: `render <slug>` resolves correctly
- **render_bad_slug_exits**: unresolvable arg exits with error
