# Plan: Videowright Explainer

## Purpose
- Audience: Developers who use coding agents (Claude Code, Codex, opencode) and care about building videos from code.
- Takeaway: Videowright turns a coding agent into a video team — one prompt, any web tech, deterministic MP4 export, voiceover-driven timing, works in any major agent.
- Constraints / hard guidelines:
  - Runtime ~70s (~74s total).
  - Voiceover only. No music, no sound effects.
  - Pronunciation note for TTS: "Videowright" = "video write". Also: Three.js ("three dot J S"), Lottie ("LOT-ee"), ECharts ("E-charts"), shadcn ("shad-CN"), npm ("N P M"), MP4 ("M P 4").

## Style
- Active style: motion-engineering
- Notes: Default project style. Terminal/JetBrains Mono visuals in Beat 1 and Beat 6 fit motion-engineering's dark-canvas aesthetic.

## Audio intent
- Mode: voiceover
- Notes:
  - **Pacing discipline:** With voiceover as the only audio, any gap between VO lines reads as silence — not as a beat, as a gap. Either fill it with VO or make the visual unambiguously deliberate (the Beat 1→2 cut, the held title in Beat 2). Avoid mid-beat silences in Beat 3 and Beat 4.
  - **Beat 1 silence is intentional.** Six seconds with no audio at the open reads as confident — like the video is waiting for you to notice. Don't fill it.
  - **Beat 3 VO is now load-bearing.** Previously diegetic sound carried the audio track during the gallery; now it's the VO. Two clauses with a small breath between them — make sure the TTS doesn't rush.
  - **The Beat 1 → Beat 2 cut is still the most important edit.** The hook lands on that cut.
  - **Beat 4b's meta-moment** depends on exact timing between the highlighted line and the audible VO. Worth an extra pass.

## Segment outline

Per-segment durations are now driven by VO timing (`voiceovers/v1/voiceover.ts`). Numbers below are the actual advances (seconds).

1. `cold-open` (9.99s) — Beat 1: black frame → real-terminal-window-rendering-Claude-Code TUI (orange ASCII mascot, ✻ welcome banner, conversation log with `>` user prompt, ● agent response, working spinner, ✓ final line, input box + footer) → hard cut to title.
2. `title-card` (4.51s) — Beat 2: `◢ PRODUCT · 001` tag → "Videowright" headline → cyan dimline → "Build videos in Claude Code" subtitle, all with translate+fade stagger.
3. `web-tech-gallery` (16.37s) — Beat 3: SVG (orbits) → ECharts (bars + radar) → Three.js + Lottie (real WebGL icosahedron + real rocket-launch lottie) → shadcn-style 2-phase enterprise app (Acme dashboard with KPIs/charts/bars → tab-switch to Customers → type a note → toast). Bottom title "If the browser can render it, Videowright can animate it." holds throughout.
4. `interactive-dev` (7.91s) — split-screen Claude Code TUI (40%) + browser at `localhost:5173` (60%). Browser starts on a basic off-brand title card ("VideoRight / Video Agent Tool"). User prompt types in, agent updates segment + tokens, HMR flash, browser swaps to the real motion-engineering title card with full animation sequence (matches Beat 2). Sits before render to establish the iteration loop.
5. `pixel-perfect-export` (7.59s) — Beat 4a: large export terminal types render command, progress bar fills, player window opens directly over the terminal and holds on the (paused) title-card frame.
6. `voiceover-sync` (7.33s) — Beat 4b: split-screen `voiceover/script.md` (left, lines highlight as spoken) + animation preview (right, scrubber + caption). User edits one line, "RE-SYNCING…" → "SYNCED ✓", animation re-times.
7. `any-coding-agent` (4.63s) — Beat 5: large bordered cards with real SVG logos (Claude Code in orange, Codex spirograph, opencode mark).
8. `install-cta` (9.76s) — Beat 6: "Install Videowright" headline, `npm install videowright` types into a bordered terminal, 5s post-VO hold on the final frame so the video doesn't end abruptly.

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

  **Before:** a basic, off-brand title card — plain dark slate background, "VideoRight" in Helvetica, "Video Agent Tool" subtitle. No motion-engineering chrome.

  **After agent finishes:** an `● HOT RELOADED` flash appears top-right of the browser stage. The basic card crossfades out; the real motion-engineering title card crossfades in and runs its full reveal animation (orange `◢ PRODUCT · 001` tag → "Videowright" headline → cyan dimline scales in → "Build videos in Claude Code" subtitle), mirroring Beat 2's motion.

### Voiceover

> Iterate in chat. The dev server hot-reloads. Type a change. See it.

### Production notes

- **Prop continuity matters.** The motion-engineering reveal in the browser is the same animation the viewer saw at Beat 2 — it reads as "the agent rebuilt the title card and it's now playing live in the dev server."
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
- A terminal prompt below (bordered in amber). Cursor blinks. Then types, character-by-character:
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

### 2026-05-11 — Initial scaffold
- Created `videos/demo_video/` with PLAN.md.
- Audio intent: voiceover (confirmed in user input).
- Style: motion-engineering (project default).
- Segment outline derived from the 7 beats in Script v3.

### 2026-05-11 — Segments + timeline built
- Created segments: cold-open, title-card, web-tech-gallery, pixel-perfect-export, voiceover-sync, any-coding-agent, install-cta.
- Timeline: 7 segments with fade transitions between beats 3–7 (cold-open → title-card uses default cut per script).
- Voiceover script written at `videos/demo_video/voiceover/script.md` with per-segment headings matching segment ids.
- All segments embrace motion-engineering aesthetics (grid bg, dimension/coord readouts, amber accent, mono numerals). CSS-rendered orbits/wireframe sphere stand in for Three.js; CSS bars + SVG radar stand in for ECharts.

### 2026-05-11 — Real Lottie wired up
- Installed `lottie-web` and consumed user-provided `rocket-launch.json` (root of project) in `web-tech-gallery`.
- Drives frames via `ctx.clock()` per render-safe pattern (`autoplay: false`, `goToAndStop(elapsed % 3000, false)` to loop the 3s clip across the 6s 3D+Lottie beat).

### 2026-05-11 — Cold-open + Three.js polish
- **cold-open** restyled as simplified Claude Code: orange ASCII mascot in header (user-provided art), Claude orange (#d97757) accent, warm-tinted chrome, "you / claude" speaker labels, footer with esc/help hints.
- **web-tech-gallery** Three.js panel upgraded from CSS-circle "sphere" to real WebGL: rotating icosahedron with cyan wireframe edges, amber vertex points, translucent inner mesh, counter-rotating cyan orbit ring, ambient dust field, edge-opacity pulse. Driven by `ctx.clock()` in a rAF loop; resources disposed in `unmount()`. Blueprint SVG overlay (+X/-X/+Z/-Z axis ticks) and θ readout layered on top to keep the motion-engineering aesthetic.

### 2026-05-11 — Export beat + CTA trim
- **pixel-perfect-export** redesigned: removed the "localhost" browser window entirely. The export CLI is now front-and-center and much larger (1380×540, 26px mono). After progress completes, the MP4 file icon pops in over the terminal, then a video-player window opens covering the export. Player chrome includes traffic lights, filename header, FRAME-IDENTICAL badge, play button + scrubber that advances with current/total time, and volume/fullscreen icons. The player's video surface renders the actual title-card content (grid, "Videowright", dim line, "Build videos in Claude Code") so it reads as the exported video playing back.
- **install-cta** dropped the `videowright.dev` CTA card and footer URL — not our URL. The beat now ends on the npm install command holding centered.

### 2026-05-11 — Added interactive-dev beat
- New segment `interactive-dev` placed before `pixel-perfect-export` (per user direction "before render/export" — supersedes the brief's "between Beat 4 and Beat 5" suggestion). Order is now: web-tech-gallery → interactive-dev → pixel-perfect-export → voiceover-sync → any-coding-agent → install-cta.
- 10s. Split screen: Claude Code TUI on left (40%) showing user prompt "Add our tagline to the title card." typing in → agent line "Updating segments/title-card.tsx…" → spinner → green "✓ Done. Hot-reloaded." On the right (60%) a browser at `localhost:5173` renders the title card live; after the agent finishes, an HMR flash badge appears and the "Build videos in Claude Code" subtitle animates in below the existing "Videowright" title — same animation as the title-card segment, so it reads as continuity from Beat 2.

### 2026-05-11 — Beat 1 rewrite (VO rides terminal sequence)
- Beat 1 VO moved from a single line landing on the 0:06 cut → a longer line riding the whole terminal sequence (0:01–0:06): "Everything in this video — including the terminal you're watching right now — was generated by Videowright. One prompt. No editor."
- Removed the 6s leading silence in `provider_script.md` (now 1s leading silence; VO starts at 0:01).
- Updated `segments/cold-open/index.ts` voiceover field and `voiceover/script.md` to match.

### 2026-05-11 — VO v1 generated (ElevenLabs portal) + timing synced
- User ran portal flow with v2 model, dropped `voiceovers/v1/audio.mp3` (~65s) and `voiceovers/v1/timing.json` (ElevenLabs STT export, 9 segments / 128 words).
- Also tweaked install-cta line in `provider_script.md` to "Paste a script into your coding agent..." (was "Paste one line..."). Propagated to segment + script.md.
- Wrote `voiceovers/v1/voiceover.ts` and wired it into `timeline.ts` as `default_voiceover`. Per-segment advances computed by walking timing JSON, anchoring each segment to its first matched word, ending each (except the last) 0.15s before the next segment's first word; last segment gets a 0.4s tail buffer.
- Note: STT transcribed "Videowright" as "VideoWrite" — matcher updated accordingly. Sync is unaffected (we only need timestamps).
- Resulting advances (s): cold-open 9.991, title-card 4.51, web-tech-gallery 16.37, interactive-dev 7.909, pixel-perfect-export 7.59, voiceover-sync 7.33, any-coding-agent 4.63, install-cta 4.761. Total ~63.1s + 7×0.15s lead-ins ≈ 64.1s, matching audio duration.

### 2026-05-11 — Design polish pass (post-VO sync)

Per-segment changes after watching the synced cut. Visuals only; timing/voiceover untouched unless noted.

- **cold-open (Claude Code window):** restored to a "normal terminal with Claude Code inside" — standard dark `#0c0c0c` chrome, gray traffic-lights title bar, NOT warm-tinted. Orange only on the mascot, ✻ welcome marker, `>` prompt characters, ● claude-message dots, and the model-status pip. Window scaled up to 1680×900 with 26px body / 22px banner / 22px input / 16px footer so text is comfortably readable at 1080p. `[Pasted 43 lines]` now renders on its own line under the prompt (dimmer gray, smaller), matching how Claude Code actually shows pastes. Removed a redundant user-block fade animation that was causing the prompt text to flash (snapped from opacity 1 → 0.3 → 1 when the animation kicked off).

- **web-tech-gallery (panel labels + chrome):** panel labels ("SVG", "ECharts", "Three.js + Lottie", "Your React components") bumped 12px → 28px with a bigger marker dot; chart titles ("REVENUE · QTRS", "SCORECARD · 5 AXES") 11px → 20px; bar labels 10px → 18px. Removed the small subtitles on the advanced/3D scene ("MESH · ICOSA · 60 EDGES", "θ" readout, "LAUNCH · T+00.0", and the +X/-X/+Z/-Z axis micro-labels — kept the tick marks).

- **web-tech-gallery (App UI rebuild):** replaced the prior search-results panel with a higher-fidelity shadcn-style enterprise SaaS dashboard. Acme Inc workspace with sidebar (orange "A" workspace badge, OVERVIEW + WORKSPACE nav groups, Sarah Chen user card), top bar (breadcrumb + ⌘K search pill + Invite / "+ New report" buttons), and a main content area. Two phases: **Phase 1 (Dashboard)** — 4 KPI cards stagger in and count up from 0 (MRR $48,392 / Active users 2,841 / Conversion 4.7% / Churn 1.2%), a "Revenue · 30d" area chart with the line drawing in via stroke-dashoffset and a fill gradient, and a "By plan" bar chart that fills in (Enterprise / Pro / Team / Starter). **Phase 2 (Customers)** — sidebar highlight slides to Customers, breadcrumb updates, dashboard crossfades out, customer table with 5 rows + status pills (Active / Trial / Past due) reveals, action panel appears with a typed note ("Payment retry — try card on file Tue 9am"), submit button press, toast "✓ Note sent · payment retry queued" lands.

- **web-tech-gallery (panel timing):** windows retimed for even spacing weighted toward the richer panels. SVG 0.0–2.0 → 0.0–1.6, ECharts 1.6–3.6, Three.js+Lottie 3.6–7.0, App UI 7.0–end (~9.2s). App UI starts ~2.6s after the "your real product UI" VO cue — lags slightly to give Three.js room without dragging the dashboard. Earlier attempts tried to land each panel on the VO word; reverted because it felt frantic.

- **web-tech-gallery (orange tagline removed):** dropped the closing "SVG. Charts. Three.js. Lottie. Your actual product." amber tagline swap that previously replaced the bottom title at the end. "If the browser can render it, Videowright can animate it." now holds the whole beat. Also added `white-space: nowrap` to the bottom title so it doesn't sometimes wrap and wreck layout.

- **interactive-dev (rewrite — VideoRight → Videowright rebrand):** browser now starts on an off-brand basic title card ("VideoRight" Helvetica + "Video Agent Tool" subtitle, plain dark slate, no chrome). User prompt updated to `update the title card to our latest branding (name, tagline, design guide, colors), and add some motion`. Agent line updated to `Updating segments/title-card.tsx, styles/tokens.css…`. After "✓ Done. Hot-reloaded.", the basic card crossfades out and the real motion-engineering title card crossfades in, running the same WAAPI reveal sequence as Beat 2 (tag / headline / dimline / subtitle stagger). HMR flash badge appears top-right of the browser stage.

- **pixel-perfect-export (rebuild):** removed the "localhost" browser window entirely (it didn't show anything). Removed the intermediate MP4 file icon step (terminal → player directly). CLI is bigger and front-and-center (1380×540, 26px mono); render progress bar runs faster (1.1s instead of 2.4s) so the player can open earlier and stay visible for ~4s before transition. Player window is larger than the terminal (1560×820), opens centered and covers the export. Inside the player, the video surface renders Beat 2's title-card content scaled up (Videowright 140px). Player stays paused — scrubber doesn't advance, time stays at 00:00, play button is shown (matches a just-opened-but-not-yet-playing state).

- **any-coding-agent (real logos):** replaced placeholder glyphs with real SVG marks pulled from official brand assets — Claude Code (Anthropic's Claude sunburst from Wikimedia Commons, in `#d97757`), Codex (OpenAI's spirograph mark cropped from the OpenAI logo), opencode (sst/opencode's official two-tone square from the dashboard-icons distribution). Cards scaled up (260 → 380px min-width, 88 → 160px icon container), title 24 → 36px, "SUPPORTED ✓" label 11 → 16px, intro title 72 → 84px.

- **install-cta:** dropped the `videowright.dev` CTA card and footer URL (not our canonical URL). The 5-second post-VO hold is in the segment's `play()` and the advance was extended (4.761s → 9.761s) so the final frame holds before the video ends.

- **Beat 1 silence revised:** initial leading silence in `provider_script.md` shortened from 6s → 1s when Beat 1's VO was moved to ride the whole terminal sequence (0:01 → 0:06) instead of landing on the cut.

### 2026-05-11 — Render-mode framework bug identified (no project workaround)

In `videowright render`, every segment's `mount()` content was appearing one schedule entry late: cold-open played through frame 870 (14.5s) instead of transitioning at frame 599 (9.99s), and so on cumulatively for every segment. The root cause is in `Player.renderAdvance()` — when `triggerNext()` consumes a pending `waitForNext`, the method returns without transitioning, so the segment-final advance only consumes the resolver; the actual transition happens when the *next* segment's schedule entry fires and finds no resolvers. Off-by-one per segment. ffprobe confirmed the output's total frame count and fps were correct — just internal segment boundaries shifted.

A project-side workaround (branching on `ctx.mode === "render"`) was prototyped earlier for a related shim-boot issue, then reverted at user direction — the user is fixing the framework instead. Once `Player.renderAdvance(isLast)` is patched to always transition on the last beat, this project should re-render with correct timing without any segment-side changes.
