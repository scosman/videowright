# Setup New Style

## When this is called

This is the shared style-creation flow. You were dispatched here from one of:

- **[setup.md](setup.md)** — picking the first style during initial project setup.
- **[new_video.md](new_video.md)** — user wants a different style for a specific video.
- **[styles.md](styles.md)** — user explicitly wants to add a style or change the default.

The caller passes two flags:

| Flag | Meaning | Default by caller |
|---|---|---|
| `setAsDefault` | Write this slug into `videowright.config.ts` as `defaultStyle` | `true` for setup, `false` for per-video styles, caller's choice for "change default style" |
| `copySample` | Install a sample segment at `segments/<slug>-sample/index.ts` demonstrating the style | `true` during initial setup, `false` when adding mid-project (unless user asks) |

## Flow

Ask the user which mode they want:

### Mode 1 — Ingest an existing style guide

The user has a brand deck, CSS file, Figma export, or paste-able description of an existing visual identity.

1. Prompt: "Drop the content in chat. If you have a large file or many files, point me at an existing folder path on disk."
2. Read whatever the user provides. Do **not** create a new top-level directory for source material. If the user provides a folder path, read files from that path in place.
3. Transform the input into `styles/<slug>/`:
   - Draft `STYLE.md` with frontmatter (`title`, `slug`, `picker_description`, `font_sources`) and body (aesthetic rules, motion vocabulary, don'ts).
   - Draft `tokens.css` with `:root` custom properties. Always include the 6 recommended tokens (`--color-bg`, `--color-fg`, `--color-accent`, `--font-display`, `--font-body`, `--font-mono`). If the source material does not define values for all 6, pick reasonable defaults from the source's palette/typography and flag which ones you inferred.
   - If `copySample` is true, also draft a sample segment demonstrating the style. The sample lives at `styles/<slug>/sample-segment/index.ts` and will be copied to `segments/<slug>-sample/index.ts` in the final actions step.
4. Read back a brief overview: "Here's what I built from your input: [summary]. Look good or any changes?"
5. Iterate until the user confirms.

### Mode 2 — Describe in chat

The user types a description: "Modern look using Inter, white background, #e0e230 accent, sans-serif headers, monospace for code."

1. Draft `STYLE.md` and `tokens.css` from the description.
   - Always include the 6 recommended tokens. Infer values from the description; flag any you guessed.
   - Write aesthetic rules, motion vocabulary, and don'ts that match the described feel.
   - Pick Google Fonts URLs for `font_sources` based on the described typography.
   - If `copySample` is true, also draft a sample segment demonstrating the described style. The sample lives at `styles/<slug>/sample-segment/index.ts` and will be copied to `segments/<slug>-sample/index.ts` in the final actions step.
2. Read back a brief overview and ask: "Look good or any changes?"
3. Iterate until confirmed.

### Mode 3 — Pick a built-in style pack

Choose one of the built-in packs shipped with Videowright.

1. Read frontmatter from each `STYLE.md` in the skill's built-in style packs. Resolve via the installed package path: `node_modules/videowright/skill/assets/styles/*/STYLE.md`. Extract `title` and `picker_description` from each.
2. Present the picker — list each pack with its title and one-line description:

   ```
   Built-in style packs:
   1. Modern — Clean, tech-product polish. Restrained motion, generous whitespace.
   2. Retro — 80s/90s-inspired warmth. Bolder color, typographic personality.
   3. Bauhaus — Geometric, primary palette, strict grid. Motion respects the system.
   4. Animated Explainer — Illustrative, generous motion, friendly typography. The Kurzgesagt feel.
   ```

   (Actual descriptions come from the frontmatter; the above are examples.)

3. Copy the chosen pack from `node_modules/videowright/skill/assets/styles/<slug>/` into the consumer repo at `styles/<slug>/` (STYLE.md, tokens.css, and sample-segment/). The slug is locked to the pack's slug — no rename.
4. If `copySample` is true, copy `styles/<slug>/sample-segment/index.ts` into `segments/<slug>-sample/index.ts`.

After any mode, the user's copy in `styles/<slug>/` is the source of truth. The skill does not auto-update it from `skill/assets/` later.

## Final actions

After the style is created (any mode):

1. **Modes 1 and 2 only:** Write `styles/<slug>/STYLE.md` and `styles/<slug>/tokens.css` to the consumer repo. (Mode 3 already copied these in its step 3.)
2. If `copySample` is true and the sample segment does not already exist at `segments/<slug>-sample/index.ts`, copy it there from `styles/<slug>/sample-segment/index.ts`. The source stays in the style folder as a reference; the copy in `segments/` is what videos use. If the destination already exists, skip the copy and tell the user.
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
| Sample segment already exists in `segments/` | Skip the copy; tell the user. |
| User pastes a huge style guide into chat (Mode 1) | Prompt for a folder path on disk instead. Do not create a new top-level directory for source material. |
| User's source material has no typography info | Pick a sensible default (Inter for body/display, JetBrains Mono for mono). Flag the choice. |
| User's source material has no color info | Pick neutrals (white bg, dark fg, blue accent). Flag the choice. |
| No built-in packs exist yet (Mode 3) | Tell the user no built-in packs are available; suggest Mode 1 or Mode 2 instead. |
| `font_sources` URLs are not Google Fonts | Accept any URL. Note that self-hosted fonts are not bundled — the URL must be accessible at runtime. |
