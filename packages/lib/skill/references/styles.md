# Styles

## When this is loaded

You were routed here from the intent dispatch table. Relevant intents:

- **Change the default style** — edit config and optionally cascade to existing videos.
- **Match a past video's style** — extract the style from an existing video and apply it.
- **General style questions** — how styles work, how segments consume tokens, how to add or swap styles.

To **create a new style**, load [setup_new_style.md](setup_new_style.md).

## Style folder structure

Each style lives in `styles/<slug>/` at the consumer repo root. The slug is a kebab-case name that matches the folder name, the `slug` field in `STYLE.md` frontmatter, and the value written into `defaultStyle` or `meta.style`.

```
styles/
├── editorial-mono/
│   ├── STYLE.md            # description, rules, frontmatter (title, slug, picker_description, font_sources)
│   ├── tokens.css           # CSS custom properties on :root
│   ├── brand.md             # human-readable token rationale
│   ├── reference/
│   │   ├── scenes.html      # rendered scene mockups, browsable in a web browser
│   │   └── animations.jsx   # motion vocabulary mockups
│   └── sample/              # reference samples (one per scene type, stays here as templates)
│       ├── title.ts
│       ├── section.ts
│       ├── kinetic.ts
│       ├── bullet.ts
│       ├── stat.ts
│       ├── feature.ts
│       ├── grid.ts
│       ├── ui-showcase.ts
│       ├── content.ts
│       └── cta.ts
└── risograph/
    ├── STYLE.md
    ├── tokens.css
    └── ...
```

The `sample/` folder inside a style contains one TypeScript file per scene type. When installed, samples are copied to `segments/<slug>-sample-<scene>.ts` (flat files under `segments/`) for use in videos. The sources stay in the style folder as references.

**Required files per style:**

| File | Purpose |
|---|---|
| `STYLE.md` | Frontmatter (`title`, `slug`, `picker_description`, `font_sources`) + body (aesthetic rules, motion vocabulary, don'ts). The agent reads this when authoring segments in this style. |
| `tokens.css` | CSS custom properties on `:root`. The only required token format. Imported by timeline.ts. |

There is no `styles/default/`. Every style has a real name. Multiple styles can coexist in one repo.

## Recommended token set

Built-in packs use these tokens. User-authored styles may use any tokens they want — there is no enforced set — but following these conventions enables cross-style compatibility.

| Token | Purpose |
|---|---|
| `--color-bg` | Page background |
| `--color-fg` | Default text |
| `--color-accent` | Primary accent / call-out |
| `--font-display` | Headlines |
| `--font-body` | Body copy |
| `--font-mono` | Code / monospace |

Packs may define additional tokens beyond these six.

## How videos consume styles

### Timeline.ts top-of-file import

The active style's `tokens.css` is loaded via a CSS import at the top of the video's `timeline.ts`:

```ts
// videos/my_video/timeline.ts
import '../../styles/editorial-mono/tokens.css';  // path relative to this file
import type { Timeline } from 'videowright';

const timeline: Timeline = {
  meta: {
    title: 'My Video',
    // style: 'editorial-mono',  // optional — falls back to config defaultStyle
  },
  segments: [...],
};
export default timeline;
```

The import path is relative to the video's `timeline.ts` location. Adjust the `../../` prefix to match the actual directory depth.

Vite (the dev server) and any bundler resolves the CSS import natively. The CSS is injected into the page; `:root` custom properties cascade through the player's DOM.

**Keep the import in sync.** The top-of-file import must always match `meta.style ?? config.defaultStyle`. When you change the style for a video, update both the import path and `meta.style` (if set).

### Per-video override

Set `meta.style` on the timeline to override the project default for one video:

```ts
import '../../styles/risograph/tokens.css';
import type { Timeline } from 'videowright';

const timeline: Timeline = {
  meta: {
    title: 'January 2026 Launch',
    style: 'risograph',  // overrides config defaultStyle
  },
  segments: [...],
};
export default timeline;
```

### Segments

Segments use CSS variables directly: `var(--color-accent)`, `var(--font-display)`, etc. Segments do **not** import tokens themselves — the timeline-level import provides the variables at runtime via `:root` custom properties.

This means one segment can be reused across videos with different styles — the CSS variables resolve to whatever the timeline imported.

Segments may freely import additional CSS from any style folder if they want to mix styles or pull in supplementary resources. This is "off-book" and welcomed.

### No per-segment style field

There is no `style` field on segment entries. Segments are free-form: import any tokens, write any CSS, ignore the project style entirely. The "style" of a video is a directive the author honors via the segments they write — it is not enforced by the lib.

## Changing the default style

To change the project's default style:

1. Edit `videowright.config.ts` — set `defaultStyle` to the new slug.
2. Verify `styles/<new-slug>/tokens.css` exists. If not, create the style first via [setup_new_style.md](setup_new_style.md).
3. Ask the user whether to update existing videos:
   - **Yes**: scan `videos/*/timeline.ts`. For each video that does **not** have an explicit `meta.style` override, update the top-of-file CSS import to point to the new style. Leave videos with `meta.style` set completely untouched — an explicit override is an intentional pin.
   - **No**: only new videos get the new default. Existing videos keep their current imports.

## Matching a past video's style

When the user asks to "match the look of \<past video\>":

1. Read the past video's `PLAN.md` — check the Style section for the slug and any notes.
2. Read `styles/<slug>/STYLE.md` — absorb the aesthetic rules and motion vocabulary.
3. Read one or two representative segments from the past video to understand how the style was applied in practice.
4. Apply the same style to the new video: set the same slug in `meta.style` (or confirm `defaultStyle` matches), use the same top-of-file import, and author segments following the same aesthetic rules.

If the style folder no longer exists (deleted or renamed), offer to recreate it via [setup_new_style.md](setup_new_style.md) using the past video's segments as the reference input (Mode 1).

## Edge cases

| Situation | Behavior |
|---|---|
| `defaultStyle` references a slug with no `styles/<slug>/` folder | Error with a clear message naming the missing slug and expected path. Offer to create it via [setup_new_style.md](setup_new_style.md). |
| User wants to add a style mid-project | Route to [setup_new_style.md](setup_new_style.md) with `setAsDefault: false` by default. |
| Timeline import path and `meta.style` are out of sync | Fix the import to match `meta.style ?? config.defaultStyle`. |
| User asks "what styles do I have?" | List folders in `styles/` and read each `STYLE.md` frontmatter. |
