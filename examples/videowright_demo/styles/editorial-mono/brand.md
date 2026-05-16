# Editorial Mono — Brand

Human-readable rationale for the token values in `tokens.css`. Read together.

---

## Color

**`--color-bg` = `#F2EFE8` (warm cream).** Print-feeling, slightly yellow-warm.
Replaces pure white because white reads as "screen" — cream reads as "page."
Used edge-to-edge on every scene, no exceptions.

**`--color-fg` = `#14110E` (near-black ink).** Avoids pure black for the same
reason cream replaces white — pure black is screen-flat, this is ink on paper.
Primary type, hairline rules, logo marks.

**`--color-accent` = `#C8392C` (editorial red).** The kind of red an editor
marks the page with — saturated, slightly warm, never neon. Used as an
emphasis tool, not a fill. Underlines, single-word color, arrow tips, the
period at the end of a headline. **Once per scene, maximum.**

**`--color-muted` = `#7B756B` (warm gray).** For mono labels, captions,
secondary type, dim numerals. Warm-toned so it sits in the same family as
the cream background.

**`--color-border` = `#D9D3C7` (subtle warm).** For hairline rules and
unobtrusive separators. The rule is meant to be felt, not read.

**`--color-surface` = `#EBE7DD` (slightly darker paper).** For the rare
card or callout box. Almost imperceptible against the page — that's the
point. Editorial Mono does not use elevated surfaces.

## Typography

**Display: Instrument Serif.** A high-contrast modern serif with a striking
italic. Built for editorial display use. Free, web-available. Pairs with a
clean grotesk body without competing.

**Body: Geist.** Vercel's open-source grotesk. Neutral but with personality.
Reads small as well as large. Not Inter — Inter is overused.

**Mono: JetBrains Mono.** For editorial labels only. Tracked +0.08em and set
in UPPERCASE, it gives a tertiary structural layer (`VOL. 01 / CHAPTER 03`).

## Spacing

Spacing is opinionated and on a doubling scale (`16 / 32 / 64 / 128`) — the
same proportional thinking as a print grid. Safe-area margins are set to
`--space-xl` (128px) on the long axis and `--space-lg × 1.5` (96px) on the
short axis, which gives every scene the same negative-space ratio as a
hardcover page.

## Geometry

`--radius-sm` and `--radius-md` are deliberately small (2 and 4 px). The page
does not have rounded corners. The radii exist for tiny details — chip
labels, button hint hovers — not for cards. Cards have hairline borders
instead.

`--rule-weight` is `1px` flat. Two-pixel rules feel heavy and the editorial
register depends on hairlines.

## Motion

**Durations:**
- `--duration-fast` `220ms` — small things (cursor blinks, accent marks)
- `--duration-normal` `480ms` — most entries (text, cards)
- `--duration-slow` `900ms` — emphasis moments (stat count-up, underline draw)

**Easing:**
- `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` — easeOutQuart. Settles down.
- `--ease-in` `cubic-bezier(0.7, 0, 0.84, 0)` — for the rare exit.

**Stagger:** `80ms` base. Lists use `120ms` for breathing room.

**Scene hold:** `4s` default. Headlines may hold up to `6s`. Faster than this
breaks the editorial register.

## What this brand is not

- Not a "modern minimal" template. The negative space is on purpose, but the
  serif and the red are warm and opinionated.
- Not a luxury or fashion register — no metallic, no jewel-tone, no foil.
- Not "marketing site for a startup." It's "the magazine the marketing site
  links to."
