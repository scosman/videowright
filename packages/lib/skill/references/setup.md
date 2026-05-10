# Setup

Each input-gathering step is its own conversational turn. Do not stack questions.

## When this is loaded

You were routed here because the setup gate in SKILL.md is open: `videowright.config.ts` does not exist, or its `defaultStyle` field is missing or empty.

This flow runs once per project. After it completes, the setup gate closes and SKILL.md skips this file on future invocations.

## Preconditions: Verify install

Before any setup work, verify that the Videowright installer was run successfully. Check all three of these conditions:

1. `videowright` is in the project's `package.json` `dependencies` or `devDependencies`.
2. `node_modules/videowright/` exists as a directory (i.e., `npm install` or equivalent was actually run).
3. An instruction file contains a `<!-- videowright:start -->` marked region. Check `CLAUDE.md` if it exists; otherwise check `AGENTS.md`.

If **any** of these checks fail, stop and tell the user exactly:

> Videowright is not fully installed in this project. Visit https://github.com/scosman/videowright for install instructions.

Do not attempt repair. Do not proceed with setup. The user should re-run the installer.

## Gate semantics

| Config state | What to do |
|---|---|
| `videowright.config.ts` does not exist | Full setup. Run all steps below. |
| File exists but `defaultStyle` is missing or empty string | Partial setup. Skip directory scaffolding (step 2). Jump to step 3 (pick first style) and continue from there. |
| File exists and `defaultStyle` is set to a slug | Gate is closed. You should not be here. Return to SKILL.md intent dispatch. |

A partial setup means the user started setup previously but did not finish picking a style. Resume where they left off -- never re-scaffold files that already exist.

## Steps

### Step 1 -- Confirm intent

Ask: "I'll set up a Videowright project here. This will create the directory structure, pick a visual style, and then we'll create your first video together. OK to proceed?"

If the user says no, stop.

### Step 2 -- Scaffold directories

Create the consumer repo directory structure:

```
<repo-root>/
├── segments/               # shared segment library
├── components/             # shared web components
├── transitions/            # shared transition functions
├── styles/                 # style folders (populated in step 3)
└── videos/                 # per-video folders (populated after handoff to new_video.md)
```

Only create directories that do not already exist. Do not create any files inside these directories.

### Step 3 -- Pick first style

The first style is required. Without it, there are no design tokens and any video will lack visual identity. There is no "skip and add later" path.

This is its own conversational turn -- do not combine with any other question.

Dispatch to [setup_new_style.md](setup_new_style.md) with:

- `setAsDefault: false` -- do **not** let the style flow write `videowright.config.ts`. The config does not exist yet; Step 4 writes it with the chosen slug.
- `copySample: true` -- install the sample segment into `segments/<slug>-sample/index.ts`. The sample segment showcases the chosen style.

Wait for the style creation flow to complete. Record the chosen slug for Step 4.

### Step 4 -- Write config

Write `videowright.config.ts` at the repo root (if it does not already exist from partial setup):

```ts
import { defineConfig } from 'videowright';

export default defineConfig({
  projectStructure: 'v1',
  defaultStyle: '<slug from step 3>',
  defaults: {
    resolution: [1920, 1080],
    fps: 60,
    aspectRatio: '16:9',
  },
});
```

If the file already exists (partial setup), only update `defaultStyle`.

### Step 5 -- Hand off to first video

Tell the user exactly:

> Setup complete! Now let's create your first video -- tell me what you want to make. Describe the topic, audience, or purpose, and I'll handle the rest. Editing happens through chat: I write the code, you give direction.

Then dispatch to [new_video.md](new_video.md) for the first real video. Do **not** ask for a video name here -- `new_video.md` handles that as part of its own intake flow.

## Edge cases

| Situation | Behavior |
|---|---|
| `videowright` not in `package.json` | Stop with install instructions. Do not proceed. |
| Config exists but `defaultStyle` is empty | Resume at step 3 (pick style). Skip scaffolding. |
| Some directories already exist | Skip creating them. Do not overwrite existing files. |
| User declines to proceed at step 1 | Stop. Do not scaffold anything. |
| User wants to skip style selection | Do not allow. Explain that the style is required for videos to have visual identity. Offer Mode 4 (pick a built-in pack) as the fastest path. |
