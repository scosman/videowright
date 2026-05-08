# Setup Flow

Follow this flow when `videowright.config.ts` is missing from the repo root. This scaffolds a consumer repo ready for video authoring.

## Prerequisites

The `videowright` npm package must be installed. If it is not, install it first:

```bash
npm install videowright
```

## Flow

### Step 1: Confirm intent

Before scaffolding anything, confirm with the user:

> I'll set up a Videowright project here. This creates a `videowright.config.ts`, directory structure, and a starter video. OK to proceed?

If the user declines, stop. Never auto-scaffold.

### Step 2: Ask for the first video's name

> What should we call the first video? (default: `demo_video`)
>
> I suggest a date prefix like `2026-01-launch` to keep things organized, but it's optional.

Accept whatever the user provides. Default to `demo_video` if they have nothing in mind.

### Step 3: Ask about dependencies

This is an open-ended question. Do not offer a checklist. Anchor with examples:

> Do you want any specific dependencies set up? (default: none)
>
> Some examples:
> - "Raw HTML" -- vanilla, no extra deps
> - "Three.js for 3D animations"
> - "Lottie for logo animations"
> - "React and shadcn -- we want to emulate our app UI"
> - "echarts for data visualizations"
> - "GSAP for timeline-based animation"

The user answers freely. Install whatever they name using general knowledge of those tools. There are no pre-built templates -- just `npm install` the packages and set them up as you normally would.

### Step 4: Scaffold the directory structure

Create this layout at the repo root:

```
<repo>/
  videowright.config.ts
  segments/
    hello-intro/
      index.ts
    hello-outro/
      index.ts
  videos/
    <video_name>/
      timeline.ts
      README.md
      PLAN.md
      voiceover/
        script.md
  components/         (empty, for future use)
  transitions/        (empty, for future use)
  styles/
    STYLE.md          (empty template)
    tokens.css        (empty)
  assets/             (empty, for fonts/icons/footage)
  .claude/
    CLAUDE.md         (with skill reference)
```

#### `videowright.config.ts`

```ts
import { defineConfig } from 'videowright';

export default defineConfig({
  projectStructure: 'v1',
  defaults: {
    resolution: [1920, 1080],
    fps: 60,
    aspectRatio: '16:9',
  },
});
```

#### `.claude/CLAUDE.md`

Add or append this line to the consumer repo's `.claude/CLAUDE.md`:

```markdown
Read `node_modules/videowright/skill/SKILL.md` for the Videowright agent skill.
```

### Step 5: Copy hello-world templates

Copy templates from `node_modules/videowright/skill/assets/hello_world/` into the consumer repo. Apply variable substitution (see below).

Each segment lives at `segments/<id>/index.ts` -- the folder name must match the segment's `id` field.

**File mapping:**

| Template | Destination |
|---|---|
| `timeline.ts.tmpl` | `videos/<video_name>/timeline.ts` |
| `README.md.tmpl` | `videos/<video_name>/README.md` |
| `PLAN.md.tmpl` | `videos/<video_name>/PLAN.md` |
| `voiceover/script.md.tmpl` | `videos/<video_name>/voiceover/script.md` |
| `segments/hello_intro.ts.tmpl` | `segments/hello-intro/index.ts` |
| `segments/hello_outro.ts.tmpl` | `segments/hello-outro/index.ts` |

### Step 6: Confirm

Report what was created and tell the user how to run:

> Setup complete! Created:
> - `videowright.config.ts`
> - `videos/<video_name>/` with timeline, README, PLAN, and voiceover script
> - `segments/hello-intro/` and `segments/hello-outro/`
> - Directory structure for components, transitions, styles, and assets
>
> Run `npm install && npx videowright dev` to see your first video.

## Variable Substitution

Templates use `{{var_name}}` syntax. Replace these when copying:

| Variable | Source | Example |
|---|---|---|
| `{{video_name}}` | User's answer from Step 2 (default `demo_video`) | `2026-01-launch` |
| `{{title}}` | Derived from video_name: replace hyphens/underscores with spaces, title case | `2026 01 Launch` |
| `{{date}}` | Today's date as `YYYY-MM-DD` | `2026-01-15` |

## Fallback Prompts

If the user is unsure about the video name:
> No worries -- `demo_video` is a fine starting point. You can always create more videos later.

If the user is unsure about dependencies:
> Let's start with vanilla HTML/CSS/JS. You can add Three.js, Lottie, or any other library to individual segments later -- Videowright doesn't restrict what you use.

## After Setup

Once setup is complete, the user will typically ask to create content. Dispatch to:
- [authoring_video.md](authoring_video.md) for scaffolding a new video
- [authoring_segment.md](authoring_segment.md) for writing or editing segments
