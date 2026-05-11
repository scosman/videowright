---
title: Swiss Console
slug: swiss-console
picker_description: 'Strict 12-column grid. Hairline rules. Tabular numerals. Micro-labels everywhere.'
font_sources:
  - https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap
mood: [precise, systematic, neutral, informational, dense]
good_for:
  - Dev tools and SDKs
  - Data products and dashboards
  - Infrastructure and platform launches
  - Fintech, trading, analytics
  - Anything that benefits from showing structure
bad_for:
  - Consumer apps needing warmth
  - Brand/lifestyle launches
  - Stories or narrative explainers (use Editorial Mono)
tags: [swiss, grid, grotesk, minimal, informational, light-mode]
references: [Pentagram, Linear marketing site, Vercel changelog, Stripe dashboard]
---

# Swiss Console — STYLE.md

## Identity

A precise, information-dense aesthetic. Helvetica-grade grotesk throughout. Strict 12-column grid. Hairline rules. Mono micro-labels anchor every element to the grid. One signal-red accent. Tabular numerals everywhere.

**Mood:** precise, systematic, neutral, informational, dense.

## When to use

- Dev tools, SDKs, infrastructure launches
- Data products, dashboards, analytics
- Fintech and trading platforms
- Anything that benefits from showing its own structure

## When to avoid

- Consumer apps needing warmth or whimsy
- Brand/lifestyle launches
- Slow narrative pieces → use Editorial Mono

## Layout principles

- **12-column grid is law.** Every element snaps to a column. `--safe-x` is 96px each side; gutters are 24px.
- **Micro-labels above and beside everything.** `01 / 12`, `→ 03:12`, `FIG. 2.3` in mono uppercase, 12–14px, tracked +0.08em.
- **Hairline rules organize space.** Top rule, bottom rule, between-column rules. 1px `--color-border`.
- **Dense by design.** Multiple elements per scene is fine — this style *invites* density. Show structure.
- **Numerals are tabular.** `font-variant-numeric: tabular-nums` on anything numeric.

## Color application

- White bg, graphite fg. No cream, no off-white.
- Red `--color-accent` is signal: highlights one number, one underline, one arrow. Never decorative.
- Muted gray for labels, captions, secondary type, less-important rows.
- Surface gray for cards, table headers, sidebars.

## Type rules

- **Display = Body = Switzer.** One grotesk family. Variation via weight (400/500/600) and size, not family.
- Sizes: micro 14, body 18–24, headline 56–96, display 140–220. No serif anywhere.
- **Mono = JetBrains Mono.** Uppercase, tracked +0.08em, for labels and identifiers.
- Tabular numerals on any number that updates.

## Motion principles

- **Slide on grid rails.** Elements enter by sliding 24–48px from a grid edge (right→left, top→bottom). Subtle.
- **Stagger = 60ms.** Many small staggered entries, not few big ones.
- **Number ticks.** Numbers count up with a digit-by-digit feel; pair with the value changing in tabular-num style.
- **Scene transitions = hard cut.** No fades. The page advances.
- **Forbidden:** spring, bounce, fade-up alone (must combine with grid-rail slide).
- **Ambient layer:** the grid itself can pulse subtly — a hairline rule sweeping right→left on idle scenes.

## Pacing

Brisk. Scenes hold 3–4s. Information is the content — get to it.

## Per-scene recipes

| Scene | Recipe |
|---|---|
| **Title** | Top-left micro-label (`01 / OVERVIEW`), top-right timestamp. Display headline at 200px, left-aligned, columns 1–8. Subtitle 28px, columns 1–6. |
| **Section** | Centered numeral `03` at 280px above a section name at 64px. Hairlines top + bottom of the slab. |
| **Kinetic** | One sentence, 80–96px, left-aligned, columns 1–10. Last word colored red. Optional `STATEMENT 02` micro-label. |
| **Bullet** | Numbered list with mono numerals in column 1, rule between, body in column 2–N. 5–6 items OK. |
| **Stat** | Big number columns 1–6 (180–280px), label columns 7–12. Optional sparkline below. Count-up over 720ms. |
| **Feature** | Three-column layout: icon/label, feature name, description. Micro-labels above each. |
| **Grid** | 4 or 6-column grid of small feature cards. Each has micro-label, name, 1-line desc. Cards staggered in. |
| **UI showcase** | Mock fills columns 2–11 with hairline frame. Callouts in remaining margins use mono labels with leader lines in red. |
| **Content** | Two-column body: heading columns 1–4, paragraph columns 5–12. |
| **CTA** | Bottom-right URL in mono, top-left micro-label `END / 10`, logo bottom-left. |

### Connective elements

- **Lower third:** mono label bottom-left with hairline rule above
- **Scene transition:** hard cut. No flash, no fade.
- **Ambient:** optional sweeping hairline on long-held scenes

## Pitfalls

- **Don't break the grid.** Off-grid placement reads as broken, not stylish.
- **Don't use serifs.** Anywhere. Ever.
- **Don't overuse the red.** One signal element per scene.
- **Don't soft-corner anything.** All corners 90°.
- **Don't fade between scenes.** Hard cut.
- **Don't skip the micro-labels.** They are the load-bearing element of the style.
