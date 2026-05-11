---
status: complete
created: 2026-05-11
---

# Task: Fix dev preview frame — aspect ratio, render resolution, and crop marks

## Request

dev: the video rendering frame doesn't fix the aspect ratio or render size. It takes widow resolution I think (confirm). This makes using dev really hard - renders window size, no good for video authoring. The container in dev needs work
  - We should fix the aspect ratio to design target.
  - We should always render at target resolution
  - P2 :It should shrink to fit the user's screen as well, but scaling. Is this possible in CSS easily? We need it rendering at it's native resolution to they preview what "render" will draw. Rendering at target resolution and aspect ratio is P0. Fallback if not safe and trivial in css is render at target resolution (allowing it to be wider than viewport) and user will have to use browser scale
  - add print style crop marks/bleed marks/trim marks, for targeting screen recording "box" - I want to know where edge of video is, in lightweight way

## Notes

Manager's clarifying questions could not be asked (UI denied), so assumptions are documented here. User should correct any that are wrong before/during the run.

**Scope assumptions:**
- "dev" = the dev/authoring preview route/page in this project. Coding agent: confirm by inspecting routes and find the frame container that hosts the video render. First action should be to identify the file(s) and confirm the current behavior (user suspects it fills window).
- "design target" = the video's target aspect ratio + resolution as already configured in the project (e.g., render/export config). Use whatever the existing render pipeline writes at. Do NOT introduce a new constant — read from the existing source of truth. If multiple presets exist, default to whichever the render command uses by default.

**P0 (must do):**
1. Fix the dev preview frame to the target aspect ratio.
2. Render at the target native resolution (1:1 with what the renderer produces), regardless of viewport size.

**P2 (include in this task if trivial; otherwise punt with a clear TODO comment):**
3. Scale-to-fit the viewport using CSS `transform: scale(...)` so the frame visually shrinks but the inner DOM still renders at native pixel dimensions (i.e., preview matches render output). Use `transform-origin: top left` and a wrapper with computed scaled dimensions so layout doesn't break.
   - If trivial: implement it. The scale should be `min(viewportWidth / targetWidth, viewportHeight / targetHeight, 1)` — never upscale.
   - If non-trivial or fragile: leave the P0 behavior (render at native resolution, allow viewport overflow; user uses browser zoom). Add a brief TODO comment pointing back to this task.

**Crop marks (P0):**
4. Add print-style crop/trim marks around the frame to mark the video edge for screen-recording targeting.
   - Default style: **corner brackets only** (L-shaped marks at the four corners, just outside the frame). Lightweight, matches the user's "lightweight way" ask.
   - Marks should sit OUTSIDE the rendered frame so they don't appear in any screen recording cropped to the frame.
   - Subtle color (low contrast on dev background) so they don't dominate.
   - Should scale with the frame if P2 scale-to-fit is implemented (apply to the same scaled wrapper, OR re-size in tandem).

**Out of scope:**
- Production/export render pipeline — only the dev/authoring preview container.
- Any new aspect-ratio or resolution config — use existing values.
- Adding toggles/controls for the crop marks (not requested). If trivial to add a CSS class hook for hiding them later, fine, but don't build a UI.

**Verification:**
- Open the dev preview at multiple viewport sizes. Frame stays at target aspect ratio and native resolution at all sizes.
- Crop marks visible at all four corners, outside the frame edge.
- If P2 implemented: at small viewports, frame visually shrinks but inner content scale matches what would be rendered.
- Existing dev features (whatever was working) still work.
