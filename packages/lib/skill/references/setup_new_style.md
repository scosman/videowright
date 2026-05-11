# Setup New Style

## When this is called

This is the shared style-creation flow. You were dispatched here from one of:

- **[setup.md](setup.md)** -- picking the first style during initial project setup.
- **[new_video.md](new_video.md)** -- user wants a different style for a specific video.
- **[styles.md](styles.md)** -- user explicitly wants to add a style or change the default.

The caller passes two flags:

| Flag | Meaning | Default by caller |
|---|---|---|
| `setAsDefault` | Write this slug into `videowright.config.ts` as `defaultStyle` | `false` for setup (setup.md writes config itself), `false` for per-video styles, caller's choice for "change default style" |
| `copySample` | Install sample segments at `segments/<slug>-sample-<scene>.ts` demonstrating the style | `true` during initial setup, `false` when adding mid-project (unless user asks) |

## Flow

Present this message verbatim — do not rephrase or regenerate it:

<!-- Maintainer note: the built-in pack list below is baked in. Adding or removing a pack under skill/assets/styles/ requires updating this list. -->

> How would you like to define your visual style?
>
> 1. **Generate from reference docs** — provide a marketing page, brand guide, CSS file, or other document and I'll derive a style from it.
> 2. **Copy from a previous Videowright project** — provide a path to an existing project's style folder.
> 3. **Describe it** — give me a short description and I'll generate a style. Example: "Neo-brutalist, Inter font, yellow accent color."
> 4. **Built-in style pack** — pick one of these ready-made styles:
>    - **Editorial Mono** — Black ink on cream paper. One red accent. Reads like a magazine.
>    - **Swiss Console** — Strict 12-column grid. Hairline rules. Tabular numerals. Micro-labels everywhere.
>    - **Neon Terminal** — CRT terminal interface. Mono throughout. Phosphor-green on near-black, stepped motion.
>    - **Motion Engineering** — Aerospace HUD / blueprint. Charcoal canvas, cyan-white type, amber accent. Dimension lines and crosshairs.
>    - **Iso Diagram** — Pencil-and-paper explainer aesthetic. Hand-drawn lines, pastel fills, isometric drawings.

### Mode 1 -- Ingest reference material

The user has a brand deck, CSS file, Figma export, paste-able content, local files/folders, or a URL pointing to an existing visual identity.

1. Prompt: "Drop the content in chat, point me at local files or folders, or paste a URL. I'll extract the visual identity."
2. Read whatever the user provides:
   - **Pasted content or local files:** read directly.
   - **Folder path:** read files from that path in place. Do **not** create a new top-level directory for source material.
   - **URL:** fetch the page content and extract visual tokens (colors, typography, spacing, motion patterns) from the HTML/CSS/design assets.
3. Transform the input into `styles/<slug>/`:
   - Draft `STYLE.md` with frontmatter (`title`, `slug`, `picker_description`, `font_sources`) and body (aesthetic rules, motion vocabulary, don'ts).
   - Draft `tokens.css` with `:root` custom properties. Always include the 6 recommended tokens (`--color-bg`, `--color-fg`, `--color-accent`, `--font-display`, `--font-body`, `--font-mono`). If the source material does not define values for all 6, pick reasonable defaults from the source's palette/typography and flag which ones you inferred.
   - If `copySample` is true, also draft sample segments demonstrating the style. Each sample lives at `styles/<slug>/sample/<scene>.ts` and will be copied to `segments/<slug>-sample-<scene>.ts` in the final actions step.
4. Read back a brief overview: "Here's what I built from your input: [summary]. Look good or any changes?"
5. Iterate until the user confirms.

### Mode 2 -- Copy from a previous Videowright project

The user provides a path to another Videowright project (the "source project").

1. Read `<source-project>/styles/` and list available styles (by reading `STYLE.md` frontmatter in each subfolder).
2. If multiple styles exist in the source project, ask the user which one to copy. If only one, confirm it.
3. Read `<source-project>/styles/<slug>/STYLE.md` and `<source-project>/styles/<slug>/tokens.css`.
4. Write them to `styles/<slug>/STYLE.md` and `styles/<slug>/tokens.css` in this project (the current working directory). The slug is preserved from the source.
5. If `copySample` is true and `<source-project>/styles/<slug>/sample/` exists, copy it to `styles/<slug>/sample/` in this project, then copy each `sample/<scene>.ts` to `segments/<slug>-sample-<scene>.ts` in this project.
6. Show the user a summary of what was copied and ask: "Look good or any changes?"
7. Iterate until confirmed.

### Mode 3 -- Describe in chat

The user types a description: "Modern look using Inter, white background, #e0e230 accent, sans-serif headers, monospace for code."

1. Draft `STYLE.md` and `tokens.css` from the description.
   - Always include the 6 recommended tokens. Infer values from the description; flag any you guessed.
   - Write aesthetic rules, motion vocabulary, and don'ts that match the described feel.
   - Pick Google Fonts URLs for `font_sources` based on the described typography.
   - If `copySample` is true, also draft sample segments demonstrating the described style. Each sample lives at `styles/<slug>/sample/<scene>.ts` and will be copied to `segments/<slug>-sample-<scene>.ts` in the final actions step.
2. Read back a brief overview and ask: "Look good or any changes?"
3. Iterate until confirmed.

### Mode 4 -- Pick a built-in style pack

Choose one of the built-in packs shipped with Videowright. The pack list and descriptions are already shown in the question above — no need to read frontmatter at runtime.

1. The user picks a pack from the list presented in the question. Confirm the choice.
2. Copy the entire `node_modules/videowright/skill/assets/styles/<slug>/` folder into the consumer repo at `styles/<slug>/`. This includes `STYLE.md`, `tokens.css`, `brand.md`, `reference/scenes.html`, `reference/animations.jsx`, and `sample/*.ts`. The slug is locked to the pack's slug -- no rename.
3. If `copySample` is true, copy each `styles/<slug>/sample/<scene>.ts` into `segments/<slug>-sample-<scene>.ts` (flat file directly under `segments/`). If any destination already exists, skip that file and report it to the user.

After any mode, the user's copy in `styles/<slug>/` is the source of truth. The skill does not auto-update it from `skill/assets/` later.

## Final actions

After the style is created (any mode):

1. **Modes 1 and 3 only:** Write `styles/<slug>/STYLE.md` and `styles/<slug>/tokens.css` to the consumer repo. (Mode 2 and Mode 4 already copied these in their respective steps.)
2. If `copySample` is true, copy each `styles/<slug>/sample/<scene>.ts` to `segments/<slug>-sample-<scene>.ts`. The sources stay in the style folder as references; the copies in `segments/` are what videos use. If any destination already exists, skip that file and tell the user.
3. If `setAsDefault` is true, set `defaultStyle: '<slug>'` in `videowright.config.ts`.
4. Confirm to the user what was created and where.

## STYLE.md shape

```markdown
---
title: <Display Name>
slug: <kebab-case-slug>
picker_description: <One-liner for the picker>
font_sources:
  - <Google Fonts URL>
  - <Google Fonts URL>
---

# Style: <Display Name>

## When to use
[1-2 sentences on when this style is the right choice]

## Aesthetic rules
- [Bullet rules the agent honors when authoring segments in this style]
- [Typography, color, motion density, layout patterns]

## Motion vocabulary
- [How elements enter, exit, and transition]
- [Timing curves, duration ranges, choreography patterns]

## Don'ts
- [Things to avoid when using this style]
```

## tokens.css shape

```css
:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-fg: #1a1a1a;
  --color-accent: #0066ff;

  /* Typography */
  --font-display: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Pack-specific tokens below */
}
```

## Edge cases

| Situation | Behavior |
|---|---|
| Slug already exists in `styles/` | Ask the user: overwrite, pick a different name, or cancel. |
| Sample segment already exists in `segments/` | Skip that file; tell the user which files were skipped. |
| User pastes a huge style guide into chat (Mode 1) | Prompt for a folder path on disk instead. Do not create a new top-level directory for source material. |
| User's source material has no typography info | Pick a sensible default (Inter for body/display, JetBrains Mono for mono). Flag the choice. |
| User's source material has no color info | Pick neutrals (white bg, dark fg, blue accent). Flag the choice. |
| No built-in packs exist yet (Mode 4) | Tell the user no built-in packs are available; suggest Mode 1 or Mode 3 instead. |
| `font_sources` URLs are not Google Fonts | Accept any URL. Note that self-hosted fonts are not bundled -- the URL must be accessible at runtime. |
| User provides a URL in Mode 1 | Fetch the page, extract CSS/design tokens from the markup, and proceed with style creation. If the URL is inaccessible, tell the user and suggest pasting the content directly. |
| Source project path in Mode 2 does not contain a `styles/` folder | Tell the user the path does not appear to be a Videowright project. Ask them to check the path. |
