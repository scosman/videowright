---
status: complete
---

# Architecture: Design Templates Refresh

## 1. Project shape

This is not a code-architecture project. It is a content + assets refactor with a small docs sweep and a parameterized-test update. There are no new modules, no new APIs, no runtime changes.

The architectural decisions worth pinning down up front are:

1. **Target file layout.** Where every adapted artifact lives, and how it relates to consumer-repo paths after install.
2. **STYLE.md frontmatter schema.** The extended shape that subsumes `meta.json`.
3. **Sample-segment authoring pattern.** A canonical TypeScript skeleton repeated ~60 times.
4. **Mode 4 install copy logic.** Updated to handle the new pack folder shape (plural samples).
5. **Test parameterization.** How `skill_files.test.ts` ranges over packs × scenes.
6. **Doc-sweep enumeration.** Every doc file and every reference to be updated.
7. **Phasing rationale.** Pack-at-a-time so every phase is independently shippable.

Single architecture doc; no per-component breakdown needed.

## 2. Target file layout

### 2.1 In skill assets (source of truth)

```
packages/lib/skill/assets/styles/
├── editorial-mono/
│   ├── STYLE.md
│   ├── tokens.css
│   ├── brand.md
│   ├── reference/
│   │   ├── scenes.html
│   │   └── animations.jsx
│   └── sample/
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
├── swiss-console/         # same shape as editorial-mono
├── neon-terminal/         # same shape
├── motion-engineering/    # same shape
├── iso-diagram/           # same shape
└── risograph/             # same shape
```

After this project, the directory contains **exactly** these 6 pack folders. The 5 old packs (`modern`, `retro`, `bauhaus`, `animated-explainer`, `placeholder`) are deleted with no replacement leftover.

### 2.2 In consumer repo (after Mode 4 install of one pack)

```
<consumer-repo>/
├── styles/
│   └── <slug>/
│       ├── STYLE.md
│       ├── tokens.css
│       ├── brand.md
│       ├── reference/
│       │   ├── scenes.html
│       │   └── animations.jsx
│       └── sample/
│           └── (the 10 .ts files stay here as reference; segments/ is the live copy)
└── segments/
    ├── <slug>-sample-title.ts
    ├── <slug>-sample-section.ts
    ├── <slug>-sample-kinetic.ts
    ├── <slug>-sample-bullet.ts
    ├── <slug>-sample-stat.ts
    ├── <slug>-sample-feature.ts
    ├── <slug>-sample-grid.ts
    ├── <slug>-sample-ui-showcase.ts
    ├── <slug>-sample-content.ts
    └── <slug>-sample-cta.ts
```

`segments/` files are flat .ts (matching `hello_world/segments/*.ts`), not folders. The styles-folder `sample/` files stay as canonical reference (matching the existing "sample-segment stays in the style folder as a template" convention).

### 2.3 Cleanup at end of project

The source folder `videowright_design/` is deleted after Phase 6. It is project scaffolding for this refactor and is no longer needed once the templates have been adapted into `packages/lib/skill/assets/styles/`.

## 3. STYLE.md frontmatter schema

```yaml
---
title: <Display Name>                          # required, string
slug: <kebab-case-slug>                        # required, must match folder name
picker_description: <one-liner>                # required, string, ≤120 chars
font_sources:                                  # required, list of URLs (may be empty)
  - <CSS URL>
  - <CSS URL>
mood: [<adj>, <adj>, ...]                      # optional, list of 3–6 short adjectives
good_for:                                      # optional, list of use cases
  - <use case>
bad_for:                                       # optional, list of anti-use cases
  - <use case>
tags: [<tag>, <tag>, ...]                      # optional, list of descriptive tags
references: [<source>, <source>, ...]          # optional, list of design inspirations
---
```

Required fields are unchanged from today (the four already asserted by tests). New optional fields are lifted directly from each template's `meta.json`. `meta.json` is deleted from the pack folder; its data lives only in the frontmatter after this project.

YAML conventions:
- Lists use the block style (one item per line with `-`) for `font_sources`, `good_for`, `bad_for`.
- Inline arrays (`[a, b, c]`) are acceptable for short flat lists: `mood`, `tags`, `references`.
- Strings with special characters (colons, quotes) are quoted with single quotes.

## 4. Sample-segment authoring pattern

### 4.1 Canonical skeleton

Every `sample/<scene>.ts` follows this skeleton:

```ts
import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
  id: "<slug>-sample-<scene>",
  advances: [<seconds>, <seconds>, ...],   // omit if play() uses only ctx.hold()
  voiceover: "<1–2 short sentences describing what this scene demonstrates>",

  mount(el) {
    host = el;
    el.innerHTML = `
      <div style="
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        ...
      ">
        <!-- scene markup, anchored via data-ref attributes -->
      </div>
    `;
  },

  async play(ctx) {
    // Query data-ref handles
    const el = host?.querySelector('[data-ref="..."]') as HTMLElement;

    // WAAPI animations with explicit fill: 'forwards'
    el.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 480, easing: "var(--ease-out)", fill: "forwards" }
    );

    await ctx.waitForNext();

    // Subsequent beats animate further state changes
    // ...
  },

  unmount() {
    host = null;
  },
});
```

### 4.2 Required constraints

Every sample must satisfy (and the test suite asserts):

| Constraint | How |
|---|---|
| Imports `defineSegment` from `"videowright"` | `import { defineSegment } from "videowright"` |
| Has a `voiceover` field | Set in `defineSegment({ voiceover: "..." })` |
| Calls `ctx.waitForNext()` at least once | Inside `play()` |
| References at least one of the 6 recommended core CSS vars | `var(--color-bg)`, `var(--color-fg)`, `var(--color-accent)`, `var(--font-display)`, `var(--font-body)`, `var(--font-mono)` — at least one |
| Imports only from `"videowright"` or relative paths inside the pack | No `../../` escape; no external packages beyond `videowright` |
| `id` matches `<slug>-sample-<scene>` | E.g., `editorial-mono-sample-title`, `swiss-console-sample-kinetic` |
| `id` is unique within the pack | All 10 scene IDs distinct |
| Render-safe motion | WAAPI or CSS animations preferred; `ctx.hold(ms)` for control flow; avoid hold-driven mutation loops |

### 4.3 Pack-specific tokens

Samples are *encouraged* to reference pack-specific tokens (the whole reason these templates are richer than the old packs). Examples:

- Editorial Mono: `var(--space-xl)`, `var(--stagger)`, `var(--rule-weight)`, `var(--safe-x)`
- Swiss Console: `var(--grid-cols)`, `var(--grid-gutter)`, `var(--space-xl)`
- Neon Terminal: `var(--glow)`, `var(--amber)`
- Motion Engineering: `var(--cyan)`, `var(--warn)`, `var(--grid-line)`
- Iso Diagram: `var(--fill-blue)`, `var(--fill-pink)`, `var(--stroke)`
- Risograph: `var(--misreg)`, `var(--grain-opacity)`, `var(--color-second)`

The test that segments reference *at least one* of the 6 recommended core tokens is the only token-related assertion; pack-specific tokens are free-form.

### 4.4 Authoring source material

For each `sample/<scene>.ts`, the author derives the design from three inputs:

1. The pack's `STYLE.md` per-scene recipe row (sizing, max element count, motion beat).
2. The pack's `reference/scenes.html` rendered example for that scene type.
3. The pack's `tokens.css` available tokens.

The reference files use a React/Sprite-based animation system (custom Easing helpers, time-based components). They are **visual references only** — not directly portable code. The sample-segment author reads the reference for visual composition and motion timing, then implements the same effect with `defineSegment` + WAAPI/CSS.

### 4.5 Voiceover content

Each sample's `voiceover` field is a 1–2 sentence phrase that:

- Describes what the scene type is (so the scene reads as a self-contained demo when the consumer mounts it).
- Mentions the pack's identity (e.g., "the Editorial Mono title card" or just "...title cards in this style").

Example: `voiceover: "Title cards in Editorial Mono. Cream paper, serif display, a red mark that lands at the end."`

These are utility voiceovers — not the kind of script a real video would use. They are meant to drive timing in the dev server when the consumer scrubs through the segment and to demonstrate the `voiceover` field.

### 4.6 Render-safety checklist

Each sample is reviewed against the skill's render-safety checklist (per `references/create_or_edit_video.md` Step 2b):

- ✅ Animations use WAAPI (`el.animate(...)`) or CSS `@keyframes`.
- ✅ Element entry animations specify `fill: "forwards"` to lock the final state.
- ✅ `ctx.waitForNext()` and `ctx.hold(ms)` are used for control flow; no `setTimeout` inside `play()`.
- ✅ Mount-time markup is final (no DOM construction during `play()` unless necessary).
- ✅ No external network requests during `play()` (fonts are loaded via `font_sources`/`@import` in `tokens.css` which Vite handles at build).

## 5. Mode 4 install copy logic

The current implementation in `references/setup_new_style.md` Mode 4 is:

> 2. Copy the chosen pack from `node_modules/videowright/skill/assets/styles/<slug>/` into the consumer repo at `styles/<slug>/` (STYLE.md, tokens.css, and sample-segment/). The slug is locked to the pack's slug — no rename.
> 3. If `copySample` is true, copy `styles/<slug>/sample-segment/index.ts` into `segments/<slug>-sample/index.ts`.

Updated to:

> 2. Copy the entire `node_modules/videowright/skill/assets/styles/<slug>/` folder into the consumer repo at `styles/<slug>/`. This includes `STYLE.md`, `tokens.css`, `brand.md`, `reference/scenes.html`, `reference/animations.jsx`, and `sample/*.ts`. The slug is locked to the pack's slug — no rename.
> 3. If `copySample` is true, copy each `styles/<slug>/sample/<scene>.ts` into the consumer's `segments/<slug>-sample-<scene>.ts` (flat file directly under `segments/`). If any destination already exists, skip that file and report it to the user.

This is purely a documentation change to the skill — the agent is the one executing the copy at install time (the skill describes the behavior; there is no compiled installer code that runs Mode 4).

## 6. Test parameterization (`packages/lib/test/unit/skill_files.test.ts`)

### 6.1 Constants

```ts
const STYLE_PACKS = [
  "editorial-mono",
  "swiss-console",
  "neon-terminal",
  "motion-engineering",
  "iso-diagram",
  "risograph",
] as const;

const SAMPLE_SCENES = [
  "title", "section", "kinetic", "bullet", "stat",
  "feature", "grid", "ui-showcase", "content", "cta",
] as const;
```

### 6.2 Folder-shape assertion (per pack)

```ts
it("pack folder exists with required files", () => {
  expect(existsSync(styleDir)).toBe(true);
  expect(existsSync(resolve(styleDir, "STYLE.md"))).toBe(true);
  expect(existsSync(resolve(styleDir, "tokens.css"))).toBe(true);
  expect(existsSync(resolve(styleDir, "brand.md"))).toBe(true);
  expect(existsSync(resolve(styleDir, "reference/scenes.html"))).toBe(true);
  expect(existsSync(resolve(styleDir, "reference/animations.jsx"))).toBe(true);
  for (const scene of SAMPLE_SCENES) {
    expect(existsSync(resolve(styleDir, `sample/${scene}.ts`))).toBe(true);
  }
});
```

### 6.3 Per-sample-segment shape (nested per pack × scene)

The existing `it("sample-segment uses defineSegment, voiceover, waitForNext...", ...)` and `it("sample-segment imports nothing from outside its own pack folder", ...)` become:

```ts
describe.each(SAMPLE_SCENES)("sample: %s", (scene) => {
  const samplePath = resolve(styleDir, `sample/${scene}.ts`);

  it("uses defineSegment, voiceover, waitForNext", () => {
    const content = readFileSync(samplePath, "utf-8");
    expect(content).toContain("defineSegment");
    expect(content).toContain("voiceover");
    expect(content).toContain("waitForNext");

    const varRefs = content.match(/var\(--[\w-]+\)/g) ?? [];
    const usedRecommended = varRefs.filter((ref) => {
      const token = ref.match(/var\((--[\w-]+)\)/)?.[1] ?? "";
      return RECOMMENDED_TOKENS_SET.has(token);
    });
    expect(usedRecommended.length).toBeGreaterThanOrEqual(1);
  });

  it("has id matching <slug>-sample-<scene>", () => {
    const content = readFileSync(samplePath, "utf-8");
    expect(content).toMatch(new RegExp(`id:\\s*["']${packName}-sample-${scene}["']`));
  });

  it("imports nothing from outside its own pack folder", () => {
    const content = readFileSync(samplePath, "utf-8");
    const imports = content.match(/from\s+["']([^"']+)["']/g) ?? [];
    for (const imp of imports) {
      const path = imp.match(/from\s+["']([^"']+)["']/)?.[1] ?? "";
      expect(
        path === "videowright" || path.startsWith("./") || path.startsWith("../"),
      ).toBe(true);
      if (path.startsWith("../")) {
        expect(!path.startsWith("../../")).toBe(true);
      }
    }
  });
});
```

### 6.4 STYLE.md frontmatter test

Continues to assert `title`, `slug`, `picker_description`, `font_sources`. The new optional fields are not asserted (they are optional).

### 6.5 hello_world tests

The "timeline.ts imports style tokens" test changes its expected substring from `styles/placeholder/tokens.css` to `styles/editorial-mono/tokens.css`. The "voiceover/script.md" test changes its expected segment id check from `hello-intro` (still present) to also accommodate the new `editorial-mono-sample-kinetic` id.

The "hello_intro / hello_outro uses only 6 recommended tokens" tests are unchanged; those segments stay portable.

### 6.6 Phase-by-phase test state

`STYLE_PACKS` grows phase by phase:

| Phase | STYLE_PACKS contents |
|---|---|
| 1 | `["editorial-mono"]` |
| 2 | `["editorial-mono", "swiss-console"]` |
| 3 | adds `"neon-terminal"` |
| 4 | adds `"motion-engineering"` |
| 5 | adds `"iso-diagram"` |
| 6 | adds `"risograph"` (final) |

Each phase's test suite passes against the packs it builds.

## 7. Doc sweep enumeration

Files that contain references to the old pack slugs or to the old `sample-segment/` shape:

| File | Update |
|---|---|
| `packages/lib/skill/references/styles.md` | Folder structure illustration (replace `modern/`, `retro/` with `editorial-mono/`, `risograph/`); folder-shape table (add rows for `brand.md`, `reference/`, replace `sample-segment/` with `sample/`); example slugs in body text. |
| `packages/lib/skill/references/setup_new_style.md` | Mode 4 hardcoded message (per §5 above + functional spec §10.1); pack folder shape illustration; copy behavior (per §5 above); maintainer-note paragraph stays. |
| `packages/lib/skill/references/project_structure.md` | `styles/` tree illustration; `defaultStyle: 'modern'` example → `defaultStyle: 'editorial-mono'`; kebab-case examples. |
| `packages/lib/skill/references/new_video.md` | Line 49: `"current default style (modern)"` → `"current default style (<defaultStyle slug from config>)"` or just `"current default style"`. |
| `packages/lib/skill/references/create_or_edit_video.md` | Grep for any hardcoded slug references; update each. |
| `packages/lib/skill/references/voiceover/style_intake.md` | Grep for slug references. |
| `packages/lib/skill/SKILL.md` | Grep — no current slug references found, but verify. |
| `packages/lib/skill/install/INSTALL.md` | Grep — references `styles/` generically; no specific slug to update. |
| `packages/lib/skill/assets/hello_world/timeline.ts` | Import path, segment id (per functional spec §11). |
| `packages/lib/skill/assets/hello_world/PLAN.md` | Style section: slug, notes. |
| `packages/lib/skill/assets/hello_world/README.md` | `placeholder-sample` mention. |
| `packages/lib/skill/assets/hello_world/voiceover/script.md` | `## placeholder-sample` heading + VO line. |

Approach for each: grep `modern\|retro\|bauhaus\|animated-explainer\|placeholder\|sample-segment` across `packages/lib/skill/` to surface every hit; edit each in-place.

## 8. Phasing rationale

### 8.1 Pack-at-a-time

Each phase: one pack, fully complete (STYLE.md + tokens.css + brand.md + reference/ + 10 samples + test-list entry + Mode 4 message entry). After each phase, tests pass; the skill is internally consistent (no broken references to nonexistent packs); the project is shippable mid-stream.

Alternative considered: bulk demolition + foundation in phase 1 (all 6 pack folders with metadata but no samples), then samples per phase. Rejected because intermediate phases would have packs with no working sample (tests would need conditional logic).

### 8.2 Phase 1 is the foundation phase

Phase 1 is the heaviest: it removes the 5 old packs, brings in the first new pack end-to-end, repoints hello_world, updates the test parameterization scaffold, updates the bulk of the docs (since most doc updates are pattern-establishment, not pack-specific). Subsequent phases (2–6) follow the pattern with minimal docs work — just appending to the Mode 4 message and growing STYLE_PACKS.

### 8.3 Phase 6 wraps up

Last pack (Risograph) + final cleanup pass: delete `videowright_design/`, final grep for any straggler slug references, confirm Mode 4 message lists all 6, confirm STYLE_PACKS has all 6, run the full test suite.

## 9. Error handling and edge cases

This project does not introduce new runtime error paths. Risks are content-quality and consistency:

| Risk | Mitigation |
|---|---|
| Sample segment uses pack-specific token not defined in `tokens.css` | Manual review during pack-phase CR; smoke-test in dev server confirms tokens resolve. |
| Sample segment is not render-safe (hold-driven mutation, etc.) | Render-safety checklist applied during CR per pack phase (§4.6). |
| YAML frontmatter has a syntax error | Tests parse frontmatter implicitly via regex; the unit test for required fields will fail. Run tests after each pack phase. |
| Font URL is broken or behind a CDN that requires CORS | Manual smoke-test in dev server during pack phase — open sample in browser, confirm font loads. |
| `reference/scenes.html` references a path that won't work after install | The reference HTML uses `../tokens.css` (a relative path that works in both skill assets and consumer's `styles/<slug>/reference/`). Verified during Phase 1; pattern holds for subsequent packs. |
| Doc reference to old slug missed | Final grep in Phase 6 catches stragglers. |
| Test suite ratchet: test fails on a partially-built phase | Each phase's STYLE_PACKS list is updated atomically with the pack content, so tests always match the current state. |

## 10. Testing strategy

### 10.1 Automated

Single test file: `packages/lib/test/unit/skill_files.test.ts`. Parameterized via `describe.each` over `STYLE_PACKS` × (nested) `SAMPLE_SCENES`. Existing test infrastructure (vitest) is sufficient — no new test packages.

Tests run via the project's standard automated check command. Each phase ends with all tests passing.

### 10.2 Manual

Per pack-phase, the implementing agent opens the dev server (`npx videowright dev`) against a scratch timeline that mounts each of the 10 sample segments and visually confirms:

- Each scene renders with the expected layout.
- Motion is smooth (WAAPI/CSS, not hold-driven jank).
- Fonts load.
- Tokens resolve (no `inherit`/default fallbacks visible).
- Voiceover field shows in the dev HUD.

This is the "feature correctness" check that automated tests cannot do. It is explicit in each phase's exit criteria.

### 10.3 Phase 6 final integration

After the last pack lands:

- Run the full test suite.
- Smoke-test the install path: create a fresh consumer project (or a temp directory), simulate Mode 4 for each of the 6 packs, confirm files copy as expected.
- Final grep across `packages/lib/skill/` for any slug from the old packs — should return zero hits.

## 11. Dependencies and external choices

No new package dependencies. No version bumps. No build-system changes.

Font URLs in `font_sources`:

- Google Fonts URLs for all typefaces except Switzer (Swiss Console).
- Switzer uses Fontshare: `https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap`.
- All URLs verified during Phase 1 (Editorial Mono) and Phase 2 (Swiss Console — where Switzer lives) by loading them in the dev server.

## 12. Out of scope

- Any change to the videowright lib (`packages/lib/src/`).
- Any change to the CLI commands.
- Any change to render or export pipelines.
- Any change to `examples/demo_example/` styles.
- Building new templates beyond the 6 supplied.
- A picker UI that consumes the new `mood`/`good_for`/`bad_for` metadata. The frontmatter accepts these fields; no UI exists yet to read them.
