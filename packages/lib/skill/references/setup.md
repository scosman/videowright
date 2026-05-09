# Setup

## When this is loaded

You were routed here because the setup gate in SKILL.md is open: `videowright.config.ts` does not exist, or its `defaultStyle` field is missing or empty.

This flow runs once per project. After it completes, the setup gate closes and SKILL.md skips this file on future invocations.

## Preconditions

Check `package.json` for `videowright` in `dependencies` or `devDependencies`.

- If **missing**: tell the user "Videowright is not installed. Run `npm install videowright` (or your package manager equivalent) and make sure the agent instruction file points to the skill. Then try again." Stop here — do not proceed with setup.
- If **present**: continue.

## Gate semantics

| Config state | What to do |
|---|---|
| `videowright.config.ts` does not exist | Full setup. Run all steps below. |
| File exists but `defaultStyle` is missing or empty string | Partial setup. Skip directory scaffolding (step 2). Jump to step 4 (pick first style) and continue from there. |
| File exists and `defaultStyle` is set to a slug | Gate is closed. You should not be here. Return to SKILL.md intent dispatch. |

A partial setup means the user started setup previously but did not finish picking a style. Resume where they left off — never re-scaffold files that already exist.

## Steps

### Step 1 — Confirm intent

Ask: "I'll set up a Videowright project here. This will create the directory structure, a starter video, and pick a visual style. OK to proceed?"

If the user says no, stop.

### Step 2 — Scaffold directories

Create the consumer repo directory structure:

```
<repo-root>/
├── segments/               # shared segment library
├── components/             # shared web components
├── transitions/            # shared transition functions
├── styles/                 # style folders (populated in step 4)
└── videos/                 # per-video folders (populated in step 5)
```

Only create directories that do not already exist. Do not overwrite existing files.

### Step 3 — Pick first video name

Ask the user for a video name. Default: `demo_video`. Suggest a date prefix (e.g., `2026_05_demo`) but do not enforce it.

The name becomes the folder name under `videos/`.

### Step 4 — Pick first style

The first style is required. The hello-world video's quality depends on it — skipping leaves the project without design tokens and the starter video looks placeholder-ugly. There is no "skip and add later" path.

Dispatch to [setup_new_style.md](setup_new_style.md) with:

- `setAsDefault: true` — this style becomes the project's `defaultStyle`.
- `copySample: true` — install the sample segment into `segments/<slug>-sample/index.ts`. The hello-world timeline references this segment so the starter video showcases the chosen style.

Wait for the style creation flow to complete before continuing.

### Step 5 — Write config and scaffold hello-world

1. **Write `videowright.config.ts`** at the repo root (if it does not already exist from partial setup):

   ```ts
   import { defineConfig } from 'videowright';

   export default defineConfig({
     projectStructure: 'v1',
     defaultStyle: '<slug from step 4>',
     defaults: {
       resolution: [1920, 1080],
       fps: 60,
       aspectRatio: '16:9',
     },
   });
   ```

   If the file already exists (partial setup), only update `defaultStyle`.

2. **Scaffold the hello-world video** in `videos/<name>/`:
   - `timeline.ts` — imports the chosen style's `tokens.css` at the top of the file (the agent writes this import to match the chosen style; see [styles.md](styles.md) for the convention), defines a `Timeline` with the starter segments.
   - `PLAN.md` — a populated plan for the hello-world video.
   - `voiceover/script.md` — starter VO script. The hello-world defaults to voiceover audio intent as a teaching example, so the starter segments include `voiceover` fields and the script file is populated.

   Use the reference examples in `node_modules/videowright/skill/assets/hello_world/` as guidance for structure. The agent writes each file from scratch per the conventions in this skill — adapt content to reference the chosen style (import path, token usage, style slug in meta).

3. **Scaffold starter segments** in `segments/`:
   - The style pack's sample segment was already installed at `segments/<slug>-sample/index.ts` via step 4 (`copySample: true`). The hello-world timeline should reference this segment.
   - Write additional hello-world segments (e.g., intro, outro) as needed. These segments should use the chosen style's CSS variables (`var(--color-accent)`, `var(--font-display)`, etc.).

### Step 6 — Confirm

Tell the user what was created:

```
Setup complete! Here's what was created:

- videowright.config.ts (default style: <slug>)
- styles/<slug>/ (STYLE.md + tokens.css)
- videos/<name>/ (timeline.ts + PLAN.md + voiceover/script.md)
- segments/ (starter segments)

Next steps:
1. npm install (if you haven't already)
2. npx videowright dev
```

## Edge cases

| Situation | Behavior |
|---|---|
| `videowright` not in `package.json` | Stop with install instructions. Do not proceed. |
| Config exists but `defaultStyle` is empty | Resume at step 4 (pick style). Skip scaffolding. |
| Some directories already exist | Skip creating them. Do not overwrite existing files. |
| User declines to proceed at step 1 | Stop. Do not scaffold anything. |
| User wants to skip style selection | Do not allow. Explain that the style is required for the starter video to look good. Offer Mode 3 (pick a built-in pack) as the fastest path. |
