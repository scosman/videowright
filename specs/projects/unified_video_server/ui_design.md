---
status: complete
---

# UI Design: Unified Video Server

The user asked for a "cool modern dev tool" feel — not basic HTML. Think Linear, Raycast, Vercel dashboards, Resend dashboard, Railway. Dense but breathable, dark by default, sharp typography, accent color used sparingly, micro-interactions that feel intentional.

Implementation is **vanilla HTML/CSS/JS** (no React/Vue/etc.). All this needs to be achievable with hand-written templates and CSS — no design-system framework is being introduced. Tailwind-style utility classes are fine but optional; raw CSS with design tokens is the default.

## Design System

### Color Tokens

Dark mode is the only mode (matches the rest of the dev-tool category; light mode is out of scope for this project — file under "future").

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0a0a0b` | Page background |
| `--bg-surface` | `#131316` | Cards, modals, HUD strip |
| `--bg-surface-hover` | `#1a1a1f` | Card hover, button hover |
| `--bg-surface-elevated` | `#1d1d22` | Modal background (above other surfaces) |
| `--border-subtle` | `#26262d` | 1px borders on cards, inputs |
| `--border-strong` | `#3a3a44` | Hover borders, focused inputs |
| `--text-primary` | `#f5f5f7` | Titles, primary text |
| `--text-secondary` | `#a0a0a8` | Slugs, metadata, descriptions |
| `--text-tertiary` | `#6e6e78` | Disabled, very-secondary |
| `--accent` | `#a78bfa` | Primary accent (violet — playwright/theatre vibe). Used sparingly: primary buttons, active states, link hover, focus ring. |
| `--accent-dim` | `#7c3aed33` | Subtle accent backgrounds (active card, badge tint) |
| `--success` | `#34d399` | Copied-to-clipboard confirmation |
| `--error` | `#f87171` | Error overlay, 404 messaging |

These are *initial* values — visual polish during implementation may shift them. The token names are the contract.

### Typography

- **UI font:** `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif`. Inter if available, system fallback otherwise.
- **Monospace:** `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace`. Used for slugs, CLI commands, code blocks.
- **Scale:** 11px / 12px / 13px / 14px / 16px / 20px / 24px / 32px. Default body 14px. Card titles 16px. Page titles 24px. Hero/empty-state 32px.
- **Weights:** 400 (body), 500 (UI labels, card titles), 600 (page titles, emphasis). No 700.
- **Line height:** 1.5 for body, 1.3 for titles.

### Spacing

8px grid. Tokens: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`. Use multiples.

### Radius

- `--radius-sm`: 6px (buttons, inputs, badges)
- `--radius-md`: 10px (cards, modal sections)
- `--radius-lg`: 14px (modal outer)

### Elevation / Shadows

Avoid heavy shadows. Use border + slight background lift instead. The one exception is the modal overlay (uses a subtle drop shadow for depth):

- `--shadow-modal`: `0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-subtle)`

### Motion

- All transitions: `150ms cubic-bezier(0.16, 1, 0.3, 1)` (a smooth out-curve, feels snappy).
- Card hover: `transform: translateY(-1px); border-color: var(--border-strong);`
- Modal enter: backdrop fades in 100ms, card slides up 8px and fades in 200ms.
- Respect `prefers-reduced-motion`: disable transforms, keep opacity fades only.

### Iconography

Use **Lucide** icons (free, modern, consistent). Inline SVG, 16px stroke=1.5 default. Specific icons:

- Download icon: `lucide-download` (a tray with a down arrow).
- Copy icon: `lucide-copy` → swaps to `lucide-check` for 1.5s after click.
- Close: `lucide-x`.
- Home / logo: small wordmark `videowright` (no separate logo icon needed — it's a CLI tool).
- Chevron / arrow: `lucide-chevron-right`.

## Page Inventory

| Route | Page | Layout |
|---|---|---|
| `/` (videos exist) | Homepage | Video grid |
| `/` (no videos) | Cold-start | Empty-state panel |
| `/[slug]/` | Video view | Player + HUD |
| `/[invalid]/` or any unknown path | 404 | Centered error panel |

## Layouts

### Homepage — populated

```
┌─────────────────────────────────────────────────────────────────┐
│  videowright                                  my-project ▾      │   <- top bar, 56px tall
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Videos                                                        │   <- section heading, 24px
│   3 in this project                                             │   <- secondary, 12px
│                                                                 │
│   ┌────────────────────────┐  ┌────────────────────────┐        │
│   │  Demo Title       ⬇    │  │  How It Works     ⬇    │        │
│   │                        │  │                        │        │
│   │  demo_video            │  │  landing_page_explainer│        │   <- mono, secondary
│   │  motion-engineering    │  │  minimal               │        │   <- style badge
│   └────────────────────────┘  └────────────────────────┘        │
│                                                                 │
│   ┌────────────────────────┐                                    │
│   │  Welcome          ⬇    │                                    │
│   │  onboarding_flow       │                                    │
│   │  motion-engineering    │                                    │
│   └────────────────────────┘                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Top bar:** 56px height, `--bg-surface` background, `--border-subtle` bottom border. Left: `videowright` wordmark in mono 14px medium, `--text-primary` color. Right: project name (directory of cwd) in 13px `--text-secondary`. Both clickable — wordmark routes to `/`.
- **Page header:** "Videos" in 24px semibold, secondary line "N in this project" below in 12px.
- **Grid:** CSS Grid, `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`. Gap 16px. Max content width 1200px, centered, with 32px horizontal padding (16px on mobile).
- **Card:** 
  - 16px padding, `--radius-md`, `--bg-surface` background, 1px `--border-subtle` border.
  - Title (`meta.title`) in 16px medium, `--text-primary`.
  - Slug below title, mono 13px, `--text-secondary`.
  - Style badge at bottom: small chip, mono 11px, `--text-secondary`, subtle border. No accent tint — keep visual noise low.
  - Download icon top-right, 32×32 hit target with 16px icon. Hover: `--bg-surface-hover` background, accent-tinted icon stroke.
  - Card hover: lift 1px, border to `--border-strong`. Cursor pointer.
  - Click anywhere except download icon → navigate to `/[slug]/`.
  - Download icon click → open modal, stops propagation.

### Homepage — cold start (zero videos)

```
┌─────────────────────────────────────────────────────────────────┐
│  videowright                                  my-project        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│                       ╭─────────────────────╮                   │
│                       │                     │                   │
│                       │   No videos yet     │   <- 32px         │
│                       │                     │                   │
│                       │   Ask your coding   │   <- 14px         │
│                       │   agent to create   │      secondary    │
│                       │   one for you:      │                   │
│                       │                     │                   │
│                       │   ┌──────────────┐  │                   │
│                       │   │ /videowright │  │   <- mono code    │
│                       │   │ new video    │  │      block with   │
│                       │   │           ⎘  │  │      copy icon    │
│                       │   └──────────────┘  │                   │
│                       │                     │                   │
│                       │   New to Videowright?│  <- link line    │
│                       │   Read the docs  →  │                   │
│                       │                     │                   │
│                       ╰─────────────────────╯                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Centered panel, max-width 440px, vertically centered in the viewport.
- Hero text "No videos yet" — 32px semibold.
- Body — friendly, points the user at their coding agent.
- Code block: `--bg-surface-elevated`, mono 13px, copy icon on the right (swaps to check on click).
- Docs link: `--accent` color, opens README / project docs in new tab.

### Video View

```
┌─────────────────────────────────────────────────────────────────┐
│  videowright  /  Demo Title                            ⬇        │   <- top bar
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│                                                                 │
│                  ┌─────────────────────┐                        │
│                  │                     │                        │
│                  │    [player area]    │                        │   <- existing
│                  │                     │                        │       player
│                  │                     │                        │
│                  └─────────────────────┘                        │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ▶  cold-open  beat 2  0:03 / 0:42  ›  preview        ⌨ keys    │   <- HUD strip,
│                                                       ▼         │      80px (existing)
└─────────────────────────────────────────────────────────────────┘
                                                       ↑
                                                       Hide-HUD tab
                                                       (visible flush
                                                        with HUD top
                                                        when shown,
                                                        sticks up
                                                        when hidden)
```

- **Top bar:** same 56px bar. Breadcrumb: `videowright / Demo Title`. The `videowright` wordmark is the home link. Right side: download icon (same as homepage card) — opens the Download modal for the current video.
- **Player area:** unchanged from today. Centered, max width respects aspect ratio.
- **HUD strip:** unchanged content from today (play/pause, segment ID, beat, times, voiceover transcript, keyboard reference). Visual refresh: use the design tokens. Background `--bg-surface`, top border `--border-subtle`.
- **Hide-HUD tab:**
  - When HUD is shown: a small 28×8px tab anchored to the top edge of the HUD strip, horizontally centered. `--bg-surface-hover` color, `--radius-sm` top-only. Click → collapse HUD.
  - When HUD is hidden: the same tab remains in place (sticks up from where the HUD was). Click → expand HUD.
  - Subtle chevron icon inside the tab indicating direction.
  - `H` keyboard shortcut still works.

### Download Modal

Triggered from homepage card download icon or video view top-bar download icon.

```
                  ┌──────────────────────────────────────────┐
                  │  Export Demo Title                  ✕   │
                  │  demo_video                              │
                  ├──────────────────────────────────────────┤
                  │                                          │
                  │  ┌──────────────────┐  ┌──────────────┐  │
                  │  │ EXPORT VIDEO     │  │ SCREEN       │  │
                  │  │ Recommended      │  │ RECORD       │  │
                  │  │                  │  │              │  │
                  │  │ Pixel-perfect    │  │ Capture in   │  │
                  │  │ MP4 export.      │  │ a live       │  │
                  │  │ Best quality.    │  │ browser with │  │
                  │  │                  │  │ your screen  │  │
                  │  │ ┌──────────────┐ │  │ recorder.    │  │
                  │  │ │npx videowright│ │  │ Manual pace, │  │
                  │  │ │render        │ │  │ great for    │  │
                  │  │ │demo_video  ⎘ │ │  │ live VO.     │  │
                  │  │ └──────────────┘ │  │              │  │
                  │  │                  │  │ • Press H to │  │
                  │  │ Export is        │  │   hide HUD   │  │
                  │  │ CLI-only —       │  │ • ← → to     │  │
                  │  │ runs ffmpeg +    │  │   advance    │  │
                  │  │ Playwright on    │  │ • Space to   │  │
                  │  │ your machine.    │  │   play/pause │  │
                  │  └──────────────────┘  └──────────────┘  │
                  │                                          │
                  └──────────────────────────────────────────┘
```

- **Backdrop:** `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(8px)`. Click outside modal to dismiss.
- **Modal:** `--bg-surface-elevated`, `--radius-lg`, `--shadow-modal`. Max width 720px. Centered (flexbox). 32px padding.
- **Header:** "Export [Title]" in 20px semibold, slug below in mono 13px `--text-secondary`. Close `✕` icon top right.
- **Two columns:** equal width, `--bg-surface` background each, `--radius-md`, 1px `--border-subtle` border, 20px padding. Stacks vertically on screens < 600px.
- **Column header label:** 11px uppercase, letter-spaced, `--text-secondary`. The "Export Video" column also has a small "Recommended" badge in accent.
- **CLI code block (Export column):** `--bg-surface-elevated`, mono 12px, 12px padding. Copy icon top-right. The full command is `npx videowright render <slug>`. On click → copies to clipboard, icon swaps to check for 1.5s, toast not needed.
- **Tips list (Screen Record column):** bullet list, 13px, `--text-secondary`. Three tips: H to hide HUD, ←/→ to advance, Space to play/pause.
- **Escape key** dismisses the modal.

### 404 Page

```
┌─────────────────────────────────────────────────────────────────┐
│  videowright                                  my-project        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│                                                                 │
│                         404                                     │   <- 64px mono, dim
│                                                                 │
│                  Video not found                                │   <- 24px
│                                                                 │
│           No video at /broken_slug/                             │   <- 14px secondary
│                                                                 │
│                  ←  Back to videos                              │   <- accent link
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Centered panel. The `404` is 64px mono, `--text-tertiary` (muted). The bad path is echoed verbatim.

Reached when:
- A path doesn't match any known route.
- A path matches `/[slug]/` but no video exists at `videos/[slug]/timeline.ts`.

## Component Inventory (vanilla)

These are referenced by the architecture. All implemented as plain functions returning DOM nodes / strings, mounted into the appropriate container by the client-side router.

- **TopBar(`{ breadcrumb?, projectName, showDownload?, onDownload? }`)** — the 56px top bar. Shared across all pages.
- **VideoCard(`{ slug, title, style, onOpen, onDownload }`)** — homepage card.
- **EmptyState()** — cold-start panel.
- **PlayerView(`{ slug, timeline }`)** — wraps existing player + HUD + hide-HUD tab.
- **DownloadModal(`{ slug, title, onClose }`)** — modal.
- **NotFound(`{ attemptedPath }`)** — 404 panel.
- **CopyButton(`{ text }`)** — copy-to-clipboard icon button with check-swap.

## Interaction Details

### Keyboard

- `Esc`: closes modal if open.
- `H`: toggles HUD in video view (existing).
- Existing player shortcuts (←/→/Space/1-9/R) preserved.
- Tab order: focus moves through interactive elements in DOM order. Cards are focusable (`tabindex=0`); Enter opens, separate focus stop on download icon.

### Focus styles

- All interactive elements: `outline: 2px solid var(--accent); outline-offset: 2px;` on `:focus-visible`. No native browser outline.

### Cursor

- Cards: `cursor: pointer` on hover.
- Icon buttons: `cursor: pointer` always.

### Toast / Confirmation

No toasts needed. Copy-to-clipboard uses inline icon swap (check icon for 1.5s).

## Responsive Behavior

- **≥ 1024px:** full layout as shown above. Card grid auto-fills.
- **640–1023px:** card grid collapses to 1-2 columns. Modal width reduces to 90vw, max 640px.
- **< 640px (mobile):** single column. Top bar truncates project name. Modal columns stack vertically. HUD strip uses tighter spacing.

The dev-tool category isn't mobile-first, so mobile is "works, not delightful." Don't spend implementation time on mobile polish beyond functional.

## Accessibility

- Semantic HTML: `<main>`, `<nav>`, `<button>`, `<dialog>` for the modal where supported, with focus trap.
- All interactive elements have visible focus.
- Icon-only buttons have `aria-label`.
- Color contrast: all text/background pairs meet WCAG AA. Verify `--text-secondary` on `--bg-surface` during implementation.
- The modal traps focus while open, returns focus to trigger on close.
- `prefers-reduced-motion` disables transforms.

## Out of Scope (UI)

- Light mode.
- Internationalization.
- Touch-optimized mobile interactions.
- Storybook / component playground.
- A separate design tokens package — tokens live in one CSS file.
