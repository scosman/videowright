---
title: Neon Terminal
slug: neon-terminal
picker_description: 'CRT terminal interface. Mono throughout. Phosphor-green on near-black, stepped motion.'
font_sources:
  - https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap
  - https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap
mood: [technical, nocturnal, precise, retro-cyber, intimate]
good_for:
  - Developer tools, CLIs, SDKs
  - Security and infra products
  - AI products with technical audiences
  - Anything that wants to feel hacker-native
bad_for:
  - Consumer apps
  - Non-technical audiences
  - Brand/lifestyle launches
  - Anything that needs warmth
tags: [terminal, mono, dark-mode, retro, cyber, technical]
references: [Warp, Linear dark, Vercel terminal launches, Mr. Robot]
---

# Neon Terminal — STYLE.md

## Identity

A CRT terminal interface from a near-future. Monospace at every size, phosphor-green text on near-black, blinking cursors, ASCII rules, faint scan lines. The viewer feels like they're watching someone *use* a computer, not read a polished slide.

**Mood:** technical, nocturnal, precise, retro-cyber, intimate.

## When to use

- Developer tools, CLIs, SDKs
- Security, infra, observability products
- AI products with technical audiences
- Open-source launches

## When to avoid

- Consumer apps, non-technical audiences
- Anything that needs warmth

## Layout principles

- **Everything is in a frame.** The whole scene is "inside the terminal window." Top chrome shows session info; bottom chrome shows status.
- **Left-aligned, monospace columns.** No grid in the design sense — character cells.
- **ASCII rules as separators:** `────`, `═══`, `~~~~~`.
- **Headers prefixed:** `$`, `>`, `[●]`, `01 ▸`.
- **Status footers:** `[OK]`, `[··]`, `[!!]`.

## Color application

- Near-black bg, mint-green fg.
- Accent (`--color-accent`, phosphor green) for prompts (`$`), highlights, the cursor, completed status, key numbers. Always glows softly.
- Amber `--amber` for warnings and "in-progress."
- Muted moss for secondary text and ASCII chrome.

## Type rules

- **Mono only.** JetBrains Mono everywhere — display, body, labels.
- Sizes: micro 14, body 20–28, headline 56–96, display 120–200. Same font, different sizes.
- Headlines may be set in lowercase for terminal-output feel; ALL CAPS reserved for status badges (`[OK]`, `RUNNING`).

## Motion principles

- **Stepped, not smooth.** Use `steps(N, end)` easing. Text *types in* character by character or word-by-word.
- **Cursors blink.** A `▍` after the latest typed text, blinking at ~500ms.
- **Scan lines breathe.** A faint horizontal scan-line layer drifts vertically over time (1px high, 1% opacity).
- **Glow on accent.** Text-shadow phosphor glow on accent text only.
- **Scene transitions:** `clear` — wipe top-to-bottom in 200ms (the screen "redraws").
- **Forbidden:** smooth fades, scale animations, bounce.
- **Ambient layer:** scan lines + occasional cursor blink + status footer ticking.

## Pacing

Brisk-typed. Scenes hold 3.5–4.5s. Typing fills the first 1–2s, then the scene rests with the cursor blinking.

## Per-scene recipes

| Scene | Recipe |
|---|---|
| **Title** | Boot-sequence: `$ beacon --launch` types, then ASCII logo block, then tagline, all stepped. |
| **Section** | `── CHAPTER 02 ──────────────────` then section name in big mono on a new line. |
| **Kinetic** | One sentence types word-by-word. Last word glows accent. Cursor blinks at end. |
| **Bullet** | `[01]` `[02]` … prefixes; each row types in. `[OK]` or `[··]` status on the right. |
| **Stat** | Big number types digit-by-digit with the typing sound implied. Below: `// caption` in muted. |
| **Feature** | `$ feature describe --name checkpoint-memory` prompt, then description text streams below. |
| **Grid** | Three terminal "panes" side-by-side. Each pane is its own mini-terminal with its own prompt and content. |
| **UI showcase** | A larger terminal/TUI mock — sidebar pane, main pane, status bar. Looks like a real CLI tool. |
| **Content** | A long block of typed-in body text with `> ` quote prefixes for emphasis. |
| **CTA** | `$ install beacon` types, then URL, then a glowing cursor. |

### Connective elements

- **Lower third:** `[ ▸ narration · 00:24 ]` at bottom in muted.
- **Scene transition:** screen-clear wipe.
- **Ambient:** scan lines, cursor blink, status-bar tick.

## Pitfalls

- **Don't use any non-mono font.** Ever.
- **Don't use color outside the palette.** No reds or blues — green and amber only.
- **Don't smooth-fade.** Stepped easing throughout.
- **Don't fill the screen.** Even though it's terminal, leave breathing room.
- **No emoji.** ASCII glyphs only: `▸ ● ▍ ░ █ →`.
