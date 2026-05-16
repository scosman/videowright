# Plan: Videowright Explainer

## Purpose
- Audience: Developers who use coding agents (Claude Code, Codex, opencode) and care about building videos from code.
- Takeaway: Videowright turns a coding agent into a video team — one prompt, any web tech, deterministic MP4 export, voiceover-driven timing, works in any major agent.
- Constraints / hard guidelines:
  - Runtime ~70s (~74s total).
  - Voiceover only. No music, no sound effects.
  - Pronunciation note for TTS: "Videowright" = "video write". Also: Three.js ("three dot J S"), Lottie ("LOT-ee"), ECharts ("E-charts"), shadcn ("shad-CN"), npm ("N P M"), MP4 ("M P 4").

## Style
- Active style: risograph
- Notes: Risograph — two-color screen-print on warm uncoated paper. Fluorescent pink (`--color-accent` `#FF4F8B`) and ink-blue (`--color-fg` `#1A2A6A`) on cream (`--color-bg` `#F2EBDC`), with visible grain and slight color-channel misregistration on heavy display type. Motion has a stop-motion cadence (`steps(6, end)` easing) — things stamp into place rather than smoothly fade. Visuals are reinterpreted through this lens: Beat 1's "Claude Code terminal" is a recognizable Claude Code window — traffic lights, ASCII Claude mascot, ✻ welcome banner, `>` prompt, ● agent lines, working spinner, footer hints — but tinted with the riso palette (warm paper chrome, ink-blue text, pink accents on the mascot/prompt markers) and given stop-motion type-in. The title card uses misregistered Archivo Black display + pink rule rather than a serif/red rule. The export player is a riso paper-card chrome rather than a glassy macOS window. The Three.js icosahedron is rendered with a flat ink-blue base + pink wireframe + paper grain on top to match the print register. Voiceover script and beat intents are unchanged.

## Audio intent
- Mode: voiceover
- Notes:
  - **Pacing discipline:** With voiceover as the only audio, any gap between VO lines reads as silence — not as a beat, as a gap. Either fill it with VO or make the visual unambiguously deliberate (the Beat 1→2 cut, the held title in Beat 2). Avoid mid-beat silences in Beat 3 and Beat 4.
  - **Beat 1 silence is intentional.** Six seconds with no audio at the open reads as confident — like the video is waiting for you to notice. Don't fill it.
  - **Beat 3 VO is now load-bearing.** Previously diegetic sound carried the audio track during the gallery; now it's the VO. Two clauses with a small breath between them — make sure the TTS doesn't rush.
  - **The Beat 1 → Beat 2 cut is still the most important edit.** The hook lands on that cut.
  - **Beat 4b's meta-moment** depends on exact timing between the highlighted line and the audible VO. Worth an extra pass.

## Segment outline

Per-segment durations are driven by VO timing (`voiceovers/v2/voiceover.ts`). Numbers below are the actual advances (seconds).

1. `rs-cold-open` (9.991s) — Beat 1: warm-paper frame → real-looking Claude Code TUI (traffic lights, ASCII Claude mascot tinted pink/ink-blue, ✻ welcome banner, conversation log with `>` user prompt, ● agent response, working spinner, ✓ final line, input box + footer) → stamp-cut to title.
2. `rs-title-card` (4.51s) — Beat 2: risograph title card — small kicker tag → "Videowright" misregistered display headline → pink rule → "Build videos in Claude Code" subtitle, all with stop-motion stamp staggering.
3. `rs-web-tech-gallery` (16.37s) — Beat 3: SVG (orbits) → ECharts (bars + radar) → Three.js (real WebGL icosahedron in riso ink-blue/pink) + Lottie (real rocket-launch.json) → shadcn-style enterprise app (Acme dashboard with KPIs/charts/bars → tab-switch to Customers → type a note → toast). Bottom title "If the browser can render it, Videowright can animate it." holds throughout, in misregistered display.
4. `rs-interactive-dev` (5.129s) — split-screen real-looking Claude Code TUI (40%) + browser at `localhost:5173` (60%). Browser starts on a basic off-brand title card ("VideoRight / Video Agent Tool"). User prompt types in, agent updates segment + tokens, HMR flash, browser swaps to the real risograph title card with full reveal sequence (matches Beat 2). Sits before render to establish the iteration loop.
5. `rs-pixel-perfect-export` (7.59s) — Beat 4a: large export terminal on warm paper types render command, progress bar fills, player window stamps in over the terminal and holds on the (paused) title-card frame.
6. `rs-voiceover-sync` (7.33s) — Beat 4b: split-screen `voiceover/script.md` (left, lines highlight in pink as spoken) + animation preview (right, scrubber + caption). User edits one line, "RE-SYNCING…" → "SYNCED ✓", animation re-times.
7. `rs-any-coding-agent` (6.58s) — Beat 5: large duotone cards with real SVG logos (Claude Code, Codex, opencode) stamped in one at a time on warm paper.
8. `rs-install-cta` (7.81s) — Beat 6: "Install Videowright" misregistered headline, `npm install videowright` types into a riso terminal card, post-VO hold on the final frame.

## Script

# Videowright Explainer — Script v3

**Runtime:** ~70 seconds
**Audio:** Voiceover only. No music, no sound effects.
**Pronunciation note for TTS:** "Videowright" = "video write". Also: Three.js ("three dot J S"), Lottie ("LOT-ee"), ECharts ("E-charts"), shadcn ("shad-CN"), npm ("N P M"), MP4 ("M P 4").

---

## Beat 1 — Cold Open (0:00–0:07)

### Visual

- **0:00–0:01** — Black frame, very brief.
- **0:01–0:06** — Stylized Claude Code terminal fades in. JetBrains Mono, dark background, simplified chrome. Cute orange Claude mascot in the corner.

  User's prompt is already typed in the input area, visible but static:
  > `I want to build a video explaining videowright. Here's the script: [Pasted 43 lines]`

  Agent response streams in:
  > `Reading your script. I'll scaffold the timeline and draft segments — ping me if you want a different style than your past videos.`

  Brief working state: mascot animates, small spinner, label reads `Drafting segments…`. Resolves in ~1.5 seconds. Then final line appears:
  > `Video is ready. Preview: npm run dev`

- **0:06–0:07** — Hard cut to title card.

### Voiceover

*(starts at 0:01, riding the terminal sequence)*

> Everything in this video — including the terminal you're watching right now — was generated by Videowright. One prompt. No editor.

The VO finishes just before the cut at 0:06, so the cut to the title card lands on a clean breath.

---

## Beat 2 — Title Card (0:07–0:10)

### Visual

- Title: **Videowright**
- Subtitle: **Build videos in Claude Code**
- Clean type, deliberate hold. No motion flourishes.

### Voiceover

> Videowright turns a coding agent into a video team.

---

## Beat 3 — Any Web Technology (0:10–0:34)

### Visual

Title slides in along the bottom edge:
- **If the browser can render it, Videowright can animate it.**

The title holds along the bottom while four demos play in sequence above it. Each demo has a small label in the upper-left corner identifying the technology.

- **0:12–0:16 — SVG.** Label: `SVG`. Reuse the animated SVG beat from the existing demo example.
- **0:16–0:21 — Charts.** Label: `ECharts`. Two charts share the frame — a bar chart on the left, a radar chart on the right. Both animate in, then update mid-beat with new data.
- **0:21–0:27 — Advanced libraries.** Label: `Three.js + Lottie`. Split frame: Three.js sphere rotating on the left (from the existing demo), Lottie rocket launching on the right (from the existing demo).
- **0:27–end — Your real app UI.** Label: `Your React components`. Two-phase shadcn-style enterprise SaaS demo (Acme Inc workspace). Phase 1: Dashboard — sidebar nav with workspace badge / Overview + Workspace nav groups / Sarah Chen user card; top bar with breadcrumb + ⌘K search + Invite + New report buttons; main area with 4 KPI cards (MRR, Active users, Conversion, Churn) whose numbers count up from 0, a "Revenue · 30d" area chart whose line traces in via stroke-dashoffset, and a "By plan" bar chart that fills in. Phase 2: nav highlight slides to Customers, breadcrumb updates, view crossfades to a 5-row customer table with status pills (Active / Trial / Past due), then an action panel appears and a note is typed and "sent", toast confirms.

Bottom title "If the browser can render it, Videowright can animate it." stays up the whole beat — no swap to a closing tagline.

### Voiceover

VO spans the gallery to keep the audio track alive. Pacing should let each clause land on the beat it describes.

*(starts at 0:12)*

> SVG. Charting libraries. Advanced 3D and motion. Even your real product UI, rendered from your own React components.

*(brief pause, then over the app UI beat at 0:29)*

> No new framework. No animation DSL. If your stack runs in a browser, Videowright supports it.

---

## Beat — Interactive Dev Experience

*(Placed before Beat 4. Runtime ~8s, driven by VO sync.)*

### Visual

Split screen, held throughout the beat.

- **Left (~40%):** Stylized Claude Code terminal — same visual treatment as Beat 1. Cursor blinks in the input, then user prompt types itself in:
  > `update the title card to our latest branding (name, tagline, design guide, colors), and add some motion`

  Agent response streams below:
  > `Updating segments/title-card.tsx, styles/tokens.css…`

  Spinner runs briefly, then resolves:
  > `✓ Done. Hot-reloaded.`

- **Right (~60%):** Browser window running `npx videowright dev`. URL bar shows `localhost:5173 · HMR`.

  **Before:** a basic, off-brand title card — plain dark slate background, "VideoRight" in Helvetica, "Video Agent Tool" subtitle. No risograph chrome.

  **After agent finishes:** an `● HOT RELOADED` flash appears top-right of the browser stage. The basic card crossfades out; the real risograph title card crossfades in and runs its full reveal animation (small kicker tag → "Videowright" headline → pink rule scales in → "Build videos in Claude Code" subtitle), mirroring Beat 2's motion.

### Voiceover

> Iterate in chat. The dev server hot-reloads. Type a change. See it.

### Production notes

- **Prop continuity matters.** The risograph reveal in the browser is the same animation the viewer saw at Beat 2 — it reads as "the agent rebuilt the title card and it's now playing live in the dev server."
- **The "before" card is intentionally off-brand.** Wrong name ("VideoRight"), wrong tagline ("Video Agent Tool"), generic sans-serif — so the after-state lands as a deliberate rebrand, not a subtle polish.

---

## Beat 4 — Two Things You Didn't See (0:34–0:57)

### Visual

No section title. Straight into the first demonstration.

**Beat 4a — Pixel-perfect export (0:34–0:44)**

- Large export terminal, front and center: filename header `~/explainer — videowright render`, traffic lights, render command types itself in:
  > `npx videowright render --output explainer.mp4`
- Progress bar fills, frame counter ticks up to `4440/4440`, footer reads `✓ wrote explainer.mp4`.
- A QuickTime-style player window opens over the terminal — chrome with `explainer.mp4 — 01:14 — 1920×1080 · 60fps` filename header, `FRAME-IDENTICAL ✓` badge, play button, scrubber at 00:00 / 01:14, volume/fullscreen icons. The video surface renders the title-card content from Beat 2. The player is paused; the scrubber doesn't advance (it just opened — the user hasn't pressed play).

**Beat 4b — Voiceover sync (0:44–0:57)**

- Split screen. Left: a markdown file (`voiceover/script.md`) scrolls; each line highlights as it's "spoken." Right: the corresponding video segment plays, animations landing on the beats of the narration.
- Pull out to reveal the highlighted line on the left matches the line the viewer is hearing right now. Meta-moment.
- A cursor edits one line in the script. The right-side animation shifts its timing to match the new line length. Re-syncs in real time.

### Voiceover

*(over Beat 4a, starting at 0:35)*

> One command renders a deterministic MP4. Not a screen recording. Frame by frame, pixel-exact.

*(over Beat 4b, starting at 0:45)*

> Your script generates the narration. The narration drives the timing. Edit a line — everything re-syncs.

---

## Beat 5 — Any Coding Agent (0:57–1:04)

### Visual

- Tag: `◢ COMPATIBILITY`. Title: **Works in any coding agent.**
- Three bordered cards arranged horizontally with corner ticks, fading in one by one with a small delay between each. Each card has a real SVG logo, agent name, and `SUPPORTED ✓` footer:
  - **Claude Code** — Anthropic's Claude sunburst symbol in Claude orange (`#d97757`).
  - **Codex** — OpenAI's spirograph mark in foreground white.
  - **opencode** — opencode's two-tone square mark from the official brand assets.

### Voiceover

> And Videowright works in every major coding agent.

---

## Beat 6 — Install / CTA (1:04–1:14)

### Visual

- Clean frame. Centered.
- Title above: **Install Videowright**
- A terminal prompt below (bordered with a hairline red rule per editorial-mono). Cursor blinks. Then types, character-by-character:
  > `npm install videowright`
- Cursor lands. Holds for ~5 seconds after the VO finishes so the final frame breathes before the video ends. No CTA card (no URL announced — videowright.dev isn't the canonical URL).

### Voiceover

> Paste one line into your coding agent. You'll have a video before your coffee's cold.

---

## Total runtime

~74 seconds.

## Production notes

- **Pacing discipline:** With voiceover as the only audio, any gap between VO lines reads as silence — not as a beat, as a gap. Either fill it with VO or make the visual unambiguously deliberate (the Beat 1→2 cut, the held title in Beat 2). Avoid mid-beat silences in Beat 3 and Beat 4.
- **Beat 1 silence is intentional.** Six seconds with no audio at the open reads as confident — like the video is waiting for you to notice. Don't fill it.
- **Beat 3 VO is now load-bearing.** Previously diegetic sound carried the audio track during the gallery; now it's the VO. Two clauses with a small breath between them — make sure the TTS doesn't rush.
- **The Beat 1 → Beat 2 cut is still the most important edit.** The hook lands on that cut.
- **Beat 4b's meta-moment** depends on exact timing between the highlighted line and the audible VO. Worth an extra pass.
- **Renamed Beat 4** from "Three things" to "Two things" since we dropped the optional third earlier. (Heads-up: this is just an internal section name; nothing in the on-screen visual or VO references it.)

---

## Log

### 2026-05-11 — Forked to demo_risograph (style swap, fresh impl)

- Plan and voiceover (v2) copied from `demo_editorial_mono`. Style swapped from editorial-mono to **risograph** (built-in pack), installed at `styles/risograph/`.
- Segments re-implemented from scratch against the same VO timing in `voiceovers/v2/voiceover.ts` — same beat counts/durations and same VO script. Since `segments/` is shared across all videos, this video's fresh implementations live under **`rs-*`** IDs: `rs-cold-open`, `rs-title-card`, `rs-web-tech-gallery`, `rs-interactive-dev`, `rs-pixel-perfect-export`, `rs-voiceover-sync`, `rs-any-coding-agent`, `rs-install-cta`. `voiceovers/v2/voiceover.ts` `perSegment` keys remapped to the `rs-*` IDs; `audio.mp3` and `timing.json` are byte-identical to `demo_editorial_mono`'s.
- Visuals are reinterpreted through risograph: warm cream paper (`#F2EBDC`), ink-blue ink (`#1A2A6A`), fluorescent pink accent (`#FF4F8B`), Archivo Black display + Archivo body + JetBrains Mono labels. Display type uses 3px pink/blue misregistration; body and UI stay sharp. SVG fractal-noise grain layer is permanent on every scene. Motion uses `steps(6, end)` stepped easing — stamp-cut entrances, not smooth fades.
- **Per user direction**, `rs-cold-open` and `rs-interactive-dev` render a *real-looking* Claude Code TUI (traffic lights, orange/pink Claude ASCII mascot, ✻ welcome banner, conversation log, ● agent dots, `>` prompt, working spinner, ✓ final line, input box + footer with esc/help hints) — not a stylized abstraction. The terminal chrome itself is tinted to fit the riso palette (warm paper title bar, ink-blue body text, pink accent markers on mascot/prompt) but the layout and content readout are recognizably Claude Code.
- **Three.js + Lottie**: `rs-web-tech-gallery` uses real WebGL (rotating icosahedron, wireframe edges, vertex points, ambient dust — same approach as `segments/web-tech-gallery` but recoloured for riso) and real Lottie (`rocket-launch.json` from project root, manually driven via `ctx.clock()`).
- Animations are WAAPI-first with `steps(6, end)` easing per the render-safety checklist; `ctx.hold` loops are used only for stepped/discrete changes (typing, counter ticks, line-by-line highlighting).
