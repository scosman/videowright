---
status: complete
---

# Functional Spec: Design Templates Refresh

## 1. Goals

- Replace Videowright's 5 existing built-in style packs (`modern`, `retro`, `bauhaus`, `animated-explainer`, `placeholder`) with 6 new templates adapted from `videowright_design/templates/`.
- Preserve the full fidelity of the new templates — their visual + motion guidance, token rationale, rendered scene mockups, and per-scene recipes all travel into Videowright's skill assets and to the consumer repo on install.
- Update all skill references, tests, scaffolds, and conventions that mention the old packs.

## 2. Non-Goals

- Authoring new templates beyond the 6 provided in `videowright_design/templates/`.
- Reworking the consumer-facing style-creation flow (Modes 1, 2, 3 of `setup_new_style.md`).
- Any changes to the lib runtime, segment authoring API, transition system, or render pipeline.
- Reworking `examples/demo_example/styles/` — it has its own custom (not built-in) style and is intentionally untouched.

## 3. Final Built-In Pack Roster

The 6 packs that ship in `packages/lib/skill/assets/styles/` after this project:

| Slug | Title | One-liner (`picker_description`) |
|---|---|---|
| `editorial-mono` | Editorial Mono | Black ink on cream paper. One red accent. Reads like a magazine. |
| `swiss-console` | Swiss Console | Strict 12-column grid. Hairline rules. Tabular numerals. Micro-labels everywhere. |
| `neon-terminal` | Neon Terminal | CRT terminal interface. Mono throughout. Phosphor-green on near-black, stepped motion. |
| `motion-engineering` | Motion Engineering | Aerospace HUD / blueprint. Charcoal canvas, cyan-white type, amber accent. Dimension lines and crosshairs. |
| `iso-diagram` | Iso Diagram | Pencil-and-paper explainer aesthetic. Hand-drawn lines, pastel fills, isometric drawings. |
| `risograph` | Risograph | Two-color screen-print on warm paper. Pink + ink-blue, visible grain, stop-motion cadence. |

All slugs are kebab-case and match their folder names. `picker_description` is lifted from each template's `meta.json` `tagline` field.

There is no longer a `placeholder` pack. The neutral-baseline role is dropped; first-time users pick one of the 6 real packs at setup.

## 4. Per-Pack Folder Shape (in skill assets)

After adaptation, every pack at `packages/lib/skill/assets/styles/<slug>/` has this shape:

```
styles/<slug>/
├── STYLE.md           # extended YAML frontmatter + the existing rich body (preserved verbatim)
├── tokens.css         # design tokens, named scale, 6 recommended core tokens defined
├── brand.md           # human-readable token rationale (lifted verbatim from new templates)
├── reference/
│   ├── scenes.html    # rendered scene mockups (10 scene types), browsable in a web browser
│   └── animations.jsx # motion vocabulary mockups
└── sample/
    ├── title.ts
    ├── section.ts
    ├── kinetic.ts
    ├── bullet.ts
    ├── stat.ts
    ├── feature.ts
    ├── grid.ts
    ├── ui-showcase.ts
    ├── content.ts
    └── cta.ts
```

The `sample/` folder replaces `sample-segment/`. It is plural — one TS file per scene type from the template's per-scene recipes table (10 files per pack).

## 5. STYLE.md (extended)

### 5.1 Frontmatter

YAML frontmatter is extended to subsume the structured fields from `meta.json`:

```yaml
---
title: <Display Name>
slug: <kebab-case-slug>
picker_description: <one-liner, from meta.json tagline>
font_sources:
  - <Google Fonts or equivalent URL for each typeface>
  - ...
mood: [<3–6 adjectives, from meta.json>]
good_for:
  - <use case>
  - ...
bad_for:
  - <anti-use case>
  - ...
tags: [<descriptive tags, from meta.json>]
references: [<inspirations, from meta.json>]
---
```

`title`, `slug`, `picker_description`, `font_sources` remain the required fields the test suite asserts. `mood`, `good_for`, `bad_for`, `tags`, `references` are new optional fields that future picker UIs and the agent can use.

After this project, `meta.json` no longer exists as a separate file — all its data lives in STYLE.md frontmatter.

### 5.2 Body

The body of each new template's `STYLE.md` is preserved **verbatim** — Identity / When to use / When to avoid / Layout principles / Color application / Type rules / Motion principles / Pacing / Per-scene recipes / Connective elements / Pitfalls. This is the agent-facing visual + motion guide; its fidelity is the point of this project.

No structural rewrite of the body; only frontmatter is added and the file's filename is unchanged.

### 5.3 `font_sources` per pack

| Slug | font_sources |
|---|---|
| `editorial-mono` | Instrument Serif, Geist, JetBrains Mono — all Google Fonts |
| `swiss-console` | Switzer (Fontshare), JetBrains Mono (Google Fonts) |
| `neon-terminal` | JetBrains Mono, IBM Plex Mono — both Google Fonts |
| `motion-engineering` | Space Grotesk, JetBrains Mono — both Google Fonts |
| `iso-diagram` | Caveat, Nunito, JetBrains Mono — all Google Fonts |
| `risograph` | Archivo Black, Archivo, JetBrains Mono — all Google Fonts |

Switzer is the one non-Google font; use the Fontshare CSS URL. The skill already accepts any URL in `font_sources`.

## 6. tokens.css

### 6.1 Per-pack tokens

Each pack's `tokens.css` is preserved verbatim from `videowright_design/templates/<slug>/tokens.css` — only minor formatting normalization if needed. The named scale (`--space-sm/md/lg/xl`) and template-specific tokens (`--safe-x`, `--safe-y`, `--stagger`, `--scene-hold`, `--rule-weight`, `--grid-cols`, `--grid-gutter`, `--glow`, `--misreg`, `--grain-opacity`, fill palettes, etc.) all stay.

### 6.2 Required core tokens

The skill enforces (via test) that each `tokens.css` defines the 6 recommended core tokens. Spot-checking the new templates: every one already defines all 6. No backfill needed.

### 6.3 Skill docs

`packages/lib/skill/references/styles.md` and `references/project_structure.md` are updated so examples use a new pack name (recommend `editorial-mono`) and reflect the named-scale convention. The "Recommended token set" stays at the 6 core tokens — no enforced extended set.

## 7. brand.md

`brand.md` is kept as a separate sibling file alongside `STYLE.md`. Content is lifted verbatim from each `videowright_design/templates/<slug>/brand.md`. Ships to the consumer's `styles/<slug>/` on install. The agent can read it when explaining tokens or authoring style-specific scenes.

Not required by the skill; not asserted by tests; not part of the frontmatter contract.

## 8. reference/

`reference/scenes.html` and `reference/animations.jsx` are kept verbatim from each `videowright_design/templates/<slug>/reference/`. Ship to the consumer's `styles/<slug>/reference/` on install.

These files reference `../tokens.css` (a relative path) and load fonts/React/Babel via CDN — they open standalone in a browser, no build step needed. After install, a consumer can open `styles/<slug>/reference/scenes.html` in a browser to see the style's full scene library rendered live.

Not required by the skill; not asserted by tests.

## 9. sample/

### 9.1 Authoring

One TypeScript file per scene type per pack. 10 scene types × 6 packs = **60 sample segments to author** in skill assets.

Each `sample/<scene>.ts` is a stand-alone `defineSegment(...)` that demonstrates the pack's treatment of that single scene type, adapted from the template's `reference/scenes.html` + per-scene recipe in `STYLE.md`.

### 9.2 Required shape (per existing test contract)

Every sample segment must:

- Import `defineSegment` from `videowright`.
- Have a `voiceover` field (1–2 short sentences appropriate to the scene type).
- Use `ctx.waitForNext()` at least once in `play()`.
- Reference at least one of the 6 recommended core CSS vars (`--color-bg`, `--color-fg`, `--color-accent`, `--font-display`, `--font-body`, `--font-mono`).
- Import only from `videowright` or from relative paths *inside* the same pack folder (no `../../` escape).
- Have a unique `id` matching the convention `<slug>-sample-<scene>` (e.g., `editorial-mono-sample-title`, `swiss-console-sample-kinetic`).
- Be render-safe (per the skill's render-safety checklist — primarily WAAPI/CSS animations, not hold-driven mutation loops).

### 9.3 Scene types (canonical 10)

Drawn directly from `videowright_design/TEMPLATE_SPEC.md` and consistent across all 6 packs:

| File | Scene |
|---|---|
| `title.ts` | Title card |
| `section.ts` | Section header |
| `kinetic.ts` | Kinetic statement |
| `bullet.ts` | Bullet reveal |
| `stat.ts` | Stat card |
| `feature.ts` | Feature card |
| `grid.ts` | Card grid |
| `ui-showcase.ts` | UI / product showcase |
| `content.ts` | Content card (generic catch-all) |
| `cta.ts` | CTA / outro |

Every pack ships all 10; no pack ships fewer or more.

## 10. Mode 4 install behavior (`setup_new_style.md`)

### 10.1 Pack list (hardcoded message)

The hardcoded message presenting the 4 modes is updated. The Mode 4 sub-list is regenerated for the 6 new packs:

```
4. Built-in style pack — pick one of these ready-made styles:
   - Editorial Mono — Black ink on cream paper. One red accent. Reads like a magazine.
   - Swiss Console — Strict 12-column grid. Hairline rules. Tabular numerals. Micro-labels everywhere.
   - Neon Terminal — CRT terminal interface. Mono throughout. Phosphor-green on near-black, stepped motion.
   - Motion Engineering — Aerospace HUD / blueprint. Charcoal canvas, cyan-white type, amber accent.
   - Iso Diagram — Pencil-and-paper explainer aesthetic. Hand-drawn lines, pastel fills, isometric drawings.
   - Risograph — Two-color screen-print on warm paper. Pink + ink-blue, visible grain, stop-motion cadence.
```

The maintainer note above the message stays — it still warns that the list is baked in and pack-list edits require updating both the source and this message.

### 10.2 Copy behavior

When Mode 4 runs:

1. Copy the entire `node_modules/videowright/skill/assets/styles/<slug>/` folder into the consumer's `styles/<slug>/`. This now includes `STYLE.md`, `tokens.css`, `brand.md`, `reference/scenes.html`, `reference/animations.jsx`, and `sample/*.ts` — all four kinds of artifact.
2. If `copySample` is true, copy each `styles/<slug>/sample/<scene>.ts` into the consumer's `segments/<slug>-sample-<scene>.ts` (flat .ts file directly under `segments/`, not in a per-scene folder).
3. If any destination sample file already exists, skip that copy and report it to the user (per existing "sample segment already exists" edge case, generalized per-file).

### 10.3 Document the new sample layout

The Mode 4 description, the "Folder structure" section of `styles.md`, and `project_structure.md` are updated to reflect the new `sample/` folder shape and the per-scene file naming.

## 11. hello_world

Currently uses `placeholder`. After this project:

- `packages/lib/skill/assets/hello_world/timeline.ts`: replace `import "../../styles/placeholder/tokens.css"` with `import "../../styles/editorial-mono/tokens.css"`.
- `packages/lib/skill/assets/hello_world/timeline.ts`: replace the `placeholder-sample` segment ID with one of the new Editorial Mono samples. Use `editorial-mono-sample-kinetic` (kinetic statement is the most narration-friendly demonstration of a style).
- `packages/lib/skill/assets/hello_world/PLAN.md`: update Style section to `Active style: editorial-mono` and rewrite the notes.
- `packages/lib/skill/assets/hello_world/README.md`: replace the `placeholder-sample` mention with the new segment.
- `packages/lib/skill/assets/hello_world/voiceover/script.md`: replace the `## placeholder-sample` heading and its line with the new segment's VO.
- The two existing standalone segments (`hello_intro.ts`, `hello_outro.ts`) continue to use only the 6 recommended core tokens — they're portable across any style and don't need to change.

The choice of Editorial Mono for hello_world is per the user's Q1.A answer: clean, light-mode, content-first. It reads as a sensible default for a first-time user without being aggressive.

## 12. Skill documentation updates

Every place that mentions a specific old pack slug, or describes the old `sample-segment/` shape, gets updated:

- `packages/lib/skill/references/styles.md` — folder-structure illustration (`modern/`, `retro/` → `editorial-mono/`, `risograph/`); folder-shape table (add `brand.md`, `reference/`, switch `sample-segment/` → `sample/`); `Recommended token set` table unchanged.
- `packages/lib/skill/references/setup_new_style.md` — Mode 4 list (per 10.1); pack folder shape illustration; copy behavior (per 10.2); example slugs in body text.
- `packages/lib/skill/references/project_structure.md` — `styles/` tree illustration; `defaultStyle: 'modern'` example → `defaultStyle: 'editorial-mono'`; kebab-case examples.
- `packages/lib/skill/references/new_video.md` — change `"current default style (modern)"` to a generic phrasing that doesn't hardcode a slug.
- `packages/lib/skill/references/create_or_edit_video.md` — sweep for any hardcoded slug references.
- `packages/lib/skill/SKILL.md` — sweep, though no current slug references found.

`packages/lib/skill/install/INSTALL.md` references `styles/` generically and does not mention specific slugs — no change.

## 13. Test updates (`packages/lib/test/unit/skill_files.test.ts`)

- `STYLE_PACKS` constant: replace `["placeholder", "modern", "retro", "bauhaus", "animated-explainer"]` with `["editorial-mono", "swiss-console", "neon-terminal", "motion-engineering", "iso-diagram", "risograph"]`.
- "pack folder exists with required files" test: in addition to `STYLE.md` and `tokens.css`, assert that `brand.md` exists, `reference/scenes.html` exists, and `sample/` is a directory containing all 10 canonical scene `.ts` files.
- "STYLE.md has required frontmatter fields" test: continues to assert `title`, `slug`, `picker_description`, `font_sources`. The new optional fields (`mood`, `good_for`, `bad_for`, `tags`, `references`) are not asserted (they're optional metadata).
- "sample-segment uses defineSegment, voiceover, waitForNext..." test: rewrite to iterate over all 10 sample files in `sample/` and apply the same assertions to each.
- "sample-segment imports nothing from outside its own pack folder" test: same — iterate over all sample files.
- `hello_world` timeline test: update the expected import path from `styles/placeholder/tokens.css` to `styles/editorial-mono/tokens.css`.
- `hello_world` voiceover/script test: update the expected segment id from `hello-intro` (still present) but also check the new sample id replaces `placeholder-sample`.

The test that asserts "hello_intro.ts uses only the 6 recommended style tokens" and the analogous one for `hello_outro.ts` continue to pass — the hello segments themselves don't change.

## 14. demo_example (out of scope)

`examples/demo_example/styles/` is a custom (not built-in) style — its own demonstration of how a consumer authors a bespoke style. It is **not** updated in this project; the demo continues to look exactly as it does today.

If during implementation it becomes obvious that the demo's style references something we're removing, surface that and revisit. Otherwise: untouched.

## 15. Edge cases

| Situation | Behavior |
|---|---|
| A sample segment's `play()` uses pack-specific tokens (e.g., `--safe-x`, `--stagger`, `--cyan`, `--glow`, fill palettes) | Allowed — only the test that segments reference *at least one* of the 6 recommended tokens applies. Pack-specific tokens are the whole point. |
| Mode 4 install: destination `segments/<slug>-sample-<scene>.ts` already exists for some but not all 10 scenes | Skip the existing ones (per existing edge-case behavior), copy the rest. Report each skipped file individually to the user. |
| Mode 4 install: destination `styles/<slug>/` already exists with some files | Behavior is unchanged from current — error / ask to overwrite (per existing "slug already exists" edge case). |
| `brand.md` or `reference/` files diverge between the source template and what a consumer wants | The consumer's copy is theirs to edit; the skill does not auto-sync from `skill/assets/` after install (per existing convention). |
| A new template defines a token that conflicts semantically with the recommended set (e.g., a pack uses `--font-display` for an actual display family AND a different token for headlines) | Spot-check during adaptation; the new templates have already been written with the 6-core convention in mind, so no conflict expected. |
| `font_sources` URL fails to load at runtime in dev or render | Existing behavior — the font falls back through the CSS font stack. Not a blocker. |
| `references/voiceover/style_intake.md` mentions specific pack names | Sweep during the docs phase. |

## 16. Open items for review

- **hello_world's chosen sample.** Spec says `editorial-mono-sample-kinetic`. Could also be `editorial-mono-sample-title` or `editorial-mono-sample-stat`. Confirm during review.
- **Slug for "neon-terminal" sample IDs that include dashes.** The convention `<slug>-sample-<scene>` produces e.g., `neon-terminal-sample-ui-showcase` — readable but multi-dashed. Acceptable.
- **Pack ordering.** The setup picker presents packs in a fixed order. Recommend the order from `videowright_design/STYLE_ROSTER.md`: Editorial Mono, Swiss Console, Neon Terminal, Motion Engineering, Iso Diagram, Risograph. Confirm.
