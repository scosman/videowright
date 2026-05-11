---
status: complete
created: 2026-05-10
---

# Task: Render command should respect config defaults and timeline meta for resolution/fps

## Request

Do the fix to apply resolution precedence you suggest.

## Notes

**Problem identified during clarification:**

`packages/lib/src/cli/render.ts:95-97` currently hardcodes resolution/fps fallbacks:
```ts
const width = opts.width ?? 1920;
const height = opts.height ?? 1080;
const fps = opts.fps ?? 60;
```

This bypasses both `config.defaults.resolution`/`fps` (defined in `videowright.config.ts`) and per-video overrides in `timeline.meta.resolution`/`fps` (declared in `TimelineMeta` at `packages/lib/src/types.ts:84-88`). The browser-side `applyMetaDefaults` runs inside `render_entry.ts:60`, but the resolved values never flow back to the Node-side driver that sets the viewport and ffmpeg parameters.

**Scope:**

- `runRender` should load the config and resolve final `resolution` and `fps` on the Node side before launching the browser, using `applyMetaDefaults` (or the equivalent precedence logic).
- Precedence (highest to lowest):
  1. CLI args (`--width`/`--height`, `--fps`)
  2. `timeline.meta.resolution` / `timeline.meta.fps`
  3. `config.defaults.resolution` / `config.defaults.fps`
  4. Hardcoded fallback (keep as last-resort safety, do not remove — preserves current behavior for configs without defaults)
- Apply the same precedence to viewport size, ffmpeg params, and any other place width/height/fps is consumed in the render driver.
- Verify dev/record/preview paths are not regressed (they currently sidestep this by not setting a fixed pixel viewport).

**Out of scope:**
- Removing the hardcoded fallback entirely (can be a follow-up if desired).
- Adding `aspectRatio` handling beyond what already exists.
- Refactoring `applyMetaDefaults` itself.
