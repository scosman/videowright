---
status: complete
---

# Design Templates Refresh

Replace Videowright's existing built-in style packs with a new, stronger set of design templates.

## Context

A separate agent has built 6 new design templates under `videowright_design/`. They are pure HTML/CSS/JS and were not authored with knowledge of Videowright's conventions (slug-based folder structure, STYLE.md frontmatter, sample segments, the recommended token set, etc.). They need to be adapted to fit Videowright's built-in style-pack format.

The 6 new templates (see `videowright_design/STYLE_ROSTER.md`):

1. **Editorial Mono** — serious B2B / research / fintech launches
2. **Swiss Console** — dev tools, data products, infra
3. **Neon Terminal** — dark-mode dev tools, security, AI infra
4. **Motion Engineering** — hardware, robotics, technical explainers (HUD/CAD aesthetic)
5. **Iso Diagram** — explainers, educational content, technical concepts
6. **Risograph** — creative tools, design products, indie launches

See `videowright_design/TEMPLATE_SPEC.md` for what each template ships and the broader template-system design.

## Goals

- **Remove the existing style packs.** The new templates are better and replace them. Existing packs at `packages/lib/skill/assets/styles/{modern, retro, bauhaus, animated-explainer, placeholder}` are out.
- **Adapt the new templates to Videowright conventions.** Each template needs to be transformed into the built-in pack shape: STYLE.md with frontmatter (title, slug, picker_description, font_sources), tokens.css, a sample-segment/index.ts that shows off the style, and whatever supporting files (brand.md, meta.json, reference/) we decide to carry forward.
- **Adapt the token conventions in our project if needed.** The new templates use a slightly different token naming scheme (named scale like `--space-sm/md/lg/xl`) than the existing skill docs imply (numeric scale like `--space-1`...`--space-24`). Reconcile only if reconciliation is genuinely needed — otherwise leave the project's token guidance alone.
- **Update the skill to reflect the new built-in list.** Every place that lists or mentions the built-in packs needs to be updated: the hardcoded list in `setup_new_style.md` (Mode 4), example slugs in `styles.md`, `project_structure.md`, `new_video.md`, and any default-style references.

## Approach

During the spec process, surface and resolve any gaps or open details that come up — e.g., what happens to the `hello_world` scaffold (which currently uses the `placeholder` style), what to do with the extra files the new templates ship (`brand.md`, `meta.json`, `reference/`), how sample segments should be authored from the rich reference scenes, and whether the demo example should be touched.

## Out of scope (unless surfaced during spec)

- Authoring new templates beyond the 6 provided.
- Reworking the consumer-facing style-creation flow (Modes 1–3 of `setup_new_style.md`).
- Changes to the lib runtime or segment authoring APIs.
