# Plan: Videowright demo v2

## Purpose
- Audience: developers who use coding agents (Claude Code, Codex, opencode).
- Takeaway: Videowright turns a coding agent into a video team. One prompt, any web tech, a live preview you edit in chat, deterministic MP4 export, narration-driven timing, works in any major agent.
- Constraints / hard guidelines:
  - Built fresh from demo v1's script and its human design decisions only (clean room: v1's segments, video, components and renders are never opened).
  - 1920×1080, 60fps, 16:9. Runtime set by the VO (~64s) plus a ~5s end hold.
  - The Videowright logo: the mark (three round-capped gradient strokes, its own gradients, never recoloured) and the lowercase Outfit SemiBold wordmark, near-white on dark. On the title card, inside the hot-reload payoff and the export player (both show the title card), and on the end card.
  - Claude orange `#D97757` only on Claude's own marks (mascot, prompt chevron, message bullets, status pip).
  - Never show `videowright.dev`; the install path is the README's (an agent prompt with `github.com/scosman/videowright`), not `npm install`.
  - Legibility floor at 1080p: display 120px+, headings 72px+, body 36px+, mono 28px+, labels 22px+.
  - Exactly one mandated hard cut: cold open → title card, on the breath after the first VO line.

## Style
- Active style: `motion-engineering` (project default; upgraded in Phases 1–2).
- Notes:
  - One world: every instrument segment shares one grid plane at the same origin, and one persistent HUD (`components/v2/hud.ts`): the corner frame, beat index (`02 / 08`), section name, a running timecode and the probe readout stay put across cuts and wipes; only readouts that change update.
  - The cold open is the exception: a real, neutral-dark terminal, full bleed, no grid and no HUD. The hard cut drops the viewer into the instrument world of the video Claude just made, and the HUD's clock starts there.
  - The demo kit lives in `components/v2/` (fonts, motion, stage, hud, logo, title-lockup, terminal, typing, sweep, browser, agent, dispose).

## Audio intent
- Voiceover: yes — ElevenLabs v4, voice Cosman-1 (the user's instant voice clone), take `audio/originals/voiceovers/v1`.
- Sound effects: yes — one typing SFX under the opening prompt being typed.
- Background music: no.
- Notes: the VO is placed 0.6s into the track, so the cold open opens on keys. Every reveal starts ≤150ms before its cue word, never after. Pause lengths in `provider_script.md` can be re-tuned to the built animation (Phase 6) from the same take.

## Segment outline
1. `v2-cold-open` — a Claude Code session: the prompt types (with a paste chip), Claude works, "Video is ready. Preview: npm run dev". Ends on the hard cut.
2. `v2-title-card` — the Videowright lockup measured by the HUD: the hero frame.
3. `v2-web-tech-gallery` — animated SVG → ECharts → Three.js + Lottie → a real product UI, under one claim.
4. `v2-interactive-dev` — agent + browser split; the prompt hot-reloads an off-brand card into the real title card.
5. `v2-pixel-perfect-export` — one render command, a frame counter, the exported player paused at 00:00 on the title card.
6. `v2-voiceover-sync` — this video's own script, the spoken line highlighted, narration-driven timeline blocks re-syncing after an edit.
7. `v2-any-coding-agent` — Claude Code, Codex, opencode.
8. `v2-install-cta` — the install prompt in an agent input box, then a 5s calm end hold.

## Script
See `voiceover_script/script.md` (verbatim from demo v1; one section per segment).

---

## Log

### 2026-11-01 — Phase 4: the gallery and the live loop
- `v2-web-tech-gallery` (entered on `me-push`, out of the title card's "any web technologies"):
  - The claim "If the browser can render it, Videowright can animate it." holds the left rail from frame 1 to the exit, on four lines (52px). Under it, a four-step spine names each technology as it plays: `01 Animated SVG`, `02 ECharts`, `03 Three.js + Lottie`, `04 Product UI`. The current step is amber, done steps are cyan and upcoming ones are muted, and the cyan fill grows down the spine. The spine is both the progress indicator and the labels.
  - The demos fill a 1100 × 800 viewport on the right and swap under the signature sweep (`components/v2/sweep.ts`, a local copy of `me-sweep`) on their VO cues. The beam is the only seam: the outgoing demo is clipped away by the same edge, so nothing double-exposes.
    - SVG: a generated gear train drawn like a blueprint. Teeth, hubs, bores with keyways and lightening holes draw stroke by stroke and fill. Cyan pitch circles, centre marks and tooth counts. The amber lock sits on the drive gear. The train then turns meshed: one clock, each gear at its tooth ratio, with the mesh unit-tested.
    - ECharts 6 (canvas renderer, `devicePixelRatio: 1`): a streaming throughput area chart with its live value, render-ms bars and a cache-hit donut. All are in the instrument's palette and type (≥ 22px) and use ECharts' own entrance animation. The data streams on a fixed `ctx.clock()` schedule from seeded values.
    - Three.js + Lottie: a planet built like a real WebGL showcase. It has a glossy ocean sphere (the sun glints on water only), smooth-shaded continents risen from seeded, domain-warped noise, a drifting cloud shell, a cool key and a cyan rim light behind it, a Fresnel atmosphere and an outer halo. It is scanned in by a clipping plane behind its wireframe, with a drawn orbit and a satellite. Beside it, the real `rocket-launch.json` sits in a player card with a frame counter. On "Three.js" the HUD locks onto the planet, and on "Lottie" it hands over to the card. The Lottie's start is derived from that cue, so the rocket leaves the pad (frame 56) mid-word.
    - Product UI: a shadcn-style Acme Inc app in a light browser window, in Inter, at legible scale. The KPIs tick and the revenue chart draws. On "rendered", a cursor opens Customers: the route swaps on one frame, like a real SPA, and the rows rise in. The camera frames the table (zoom 1.26 inside the viewport), the cursor opens Note on Globex and the note types in, all paced from the window to "If". On "If", Send and a toast confirm, and the camera rests.
  - Payoff on "Videowright supports it.": all four steps are done, the demo viewport steps back (dims), the HUD locks onto the claim, and its second half turns amber. The release lets the corners go and rests the camera before the exit.
  - The HUD probe reports each technology (`SVG · 5 GEARS · 116 TEETH`, `ECHARTS 6.1 · CANVAS 2D`, `THREE.JS R184 · WEBGL 2`, `LOTTIE 5.13 · SVG PLAYER`, `ROUTE /CUSTOMERS`, `POST /NOTES · 201 CREATED`, `SUPPORTED · 4 / 4 STACKS`).
- `v2-interactive-dev` (entered on the new `me-split`):
  - Claude Code is on the left (40%). It is the same session as the cold open (`videowright_demo — claude`, `~/videowright_demo`): its last line is still "Video is ready. Preview: npm run dev". The browser on `localhost:5173/video/demo_v2` is on the right (60%), with a dev bar, a half-scale preview frame and the timeline's segment chips.
  - The preview starts on the draft: "VideoRight" / "Video Agent Tool", in a generic system sans, plain white.
  - The request types under the VO's "Request changes in your coding agent", wrapping in a growing input box. On "and": Enter, then `⏺ Updating segments/title-card.ts, styles/tokens.css…` with the spinner, while the key light glides to the preview.
  - On "reloads": `✓ Done. Hot-reloaded.` The dev bar's HMR status flips to `hmr update · title-card.ts`, a refresh sweep runs down the preview, and the real title card plays its reveal. This is `createTitleLockup` on the same stage as beat 2, at half scale and unlabelled. It then holds ~2.8s.
- Kit additions: `sweep.ts` (local and vertical sweeps), `browser.ts` (window chrome), `agent.ts` (a windowed Claude Code session, word-wrapped), `dispose.ts` (deferred disposal), a `labels` option on the title lockup, and Inter (bundled, OFL) for real screens' UI type: the product UI and the browser chrome.
- New transition `me-split`: a cyan rule (with a dark knockout, so it reads over light scenes) draws down the incoming scene's split line over ~210ms, and two beams open from it to the frame edges. It is registered in `videowright.config.ts`.
- Fix (Phase 3 review): a HUD decode cut off by its segment's unmount now finishes its text, so the persistent readout never freezes on noise.
- Departures from the Direction, and why:
  - "Each demo uses the full stage": the demos share the frame with the claim rail (the viewport is 1100 × 800 of the safe frame), because the claim must hold for the whole beat. Every demo fills its viewport, and the app is framed by a camera inside it.
  - The gallery has four extra advances: "Three.js", "Lottie", "rendered" and "Videowright". Each sub-beat event is cued on its VO word rather than on holds.
  - The cursor in the product UI is an ordinary arrow (with the HUD's amber click ring), not the style's crosshair pointer, so it reads as someone using the real app.
  - The 3D sub-beat's planet orbit is drawn in fg-2, not amber: amber stays with the HUD's lock.
  - The live-dev beat has no camera framing (the split windows nearly fill the safe frame, and any push would carry them into the HUD band). The key light carries the eye from the agent to the preview instead.
  - The request types fast (16ms a character) because it has to land between "Request" and "and" (~1.8s). Phase 6 can widen the pause before "Request" if it reads rushed.

### 2026-11-01 — Phase 3: foundation, audio, the hook
- Video folder: this PLAN, `voiceover_script/script.md`, `timeline.ts` (`v2-cold-open`, then `v2-title-card` on a hard `cut`, default audio track v1).
- Kit `components/v2/`: `motion` (tokens, eases, draws, masked rises, one-clock ticker, a key-framed camera), `fonts` (all four faces, awaited only when not yet loaded), `stage` (the me-* layer stack, ambient camera), `hud` (the HUD vocabulary and the persistent HUD chrome), `logo` (the mark from the bundled SVG, re-id'd per copy, drawn stroke by stroke; the Outfit wordmark), `title-lockup` (the beat-2 composition as a reusable component), `terminal` (a Claude Code TUI at legible 1x scale), `typing` (the SFX's measured keystrokes and the cold open's typing schedule). Outfit SemiBold is bundled (OFL) for the wordmark only.
- Persistent HUD: one overlay in the player's host, above both slots and transition layers, shared by every instrument segment. Its chrome never re-enters; changed readouts decode in place; the timecode runs from the hard cut on. Segments never remove it; the cold open takes it offline.
- Audio: synced the v1 take (`voiceover.ts`: elevenlabs / eleven_v4 / Cosman-1); copied the typing SFX byte for byte with a new `sfx.ts`; `audio/audio_plan.md` places the SFX under the visual typing (the whole file, a slice of its first keys for the rest of the sentence, single keys for the paste and for Enter) and the VO at 0.6s; built `audio/tracks/v1` (63.40s, -14 LUFS target).
- `v2-cold-open`: the prompt types on the SFX's own keystrokes (the keys you hear are the keys you see; the comma lands on the SFX's breath). The camera opens ~1.95x on the input line, eases out (cubic, settled as the paste lands) to frame the line and its `[Pasted 43 lines]` chip, and pulls back to the whole session on Enter while Claude replies, loads the videowright skill, writes the plan and runs its spinner (counters time-lapsed). "Video is ready. Preview: npm run dev" lands on "with a single prompt", then a push in on that line (to ~1.2x, the header leaves the frame) is still moving near full speed when the cut lands, and the caret holds solid so nothing blinks near the cut. In dev, an early first advance jumps the session to its settled end state first.
- `v2-title-card`: the hard cut is a light event: on its first frame a cyan bloom lifts the plane around the mark (~+40 luma, measured) and the grid's crosses flash, both gone within ~0.3s, over the first mark stroke already most of the way down. The strokes draw down, up, down like one pen gesture; the wordmark rises letter by letter onto "Videowright"; a crosshair locks on the mark's vertex, corners bracket the lockup, the grid flares, and a dimension measures its width (`1,578 PX`). The hero hold breathes on a faster drift (~2% push), and the HUD reads ahead (`UP NEXT · 03 WEB TECH`) on "web". A release cue lets the HUD go before the next beat. The HUD's clock restarts whenever the title card mounts, so the dev preview matches the render.
- Departures from the Direction, and why:
  - The cut sits 0.45s after "prompt." and 0.62s before "Videowright" rather than 0.15s before the next word: the cut lands on the breath, and the title card needs that time for its first strokes before the word. Every other advance is anchored 0.15s before its cue word (the release follows "technologies.").
  - The title card has two extra advances (the wordmark on "Videowright", the read-ahead on "web"), so its events are cued by the VO instead of holds.
  - The cold open's typing, paste and Enter run on fixed times (they are the SFX's schedule, placed by the audio plan); only "Video is ready" and the cut are VO cues.
  - The crosshair hands off to the corners and lets go once they lock, so the hero hold is clean.
  - The track is mastered with a -1.5 dBTP ceiling (the MP4's AAC encode adds ~0.5 dB). The final master (Phase 6) should use two-pass linear loudnorm.

### 2026-11-01 — Phases 1–2: the upgraded style (log back-fill)
- The built-in `motion-engineering` pack was rebuilt to a higher standard before this video began, and frozen for v1 (`styles/motion-engineering-legacy/`).
- Faces chosen and bundled (OFL, `fonts/`, `font-display: block`, awaited before any frame): Archivo (one variable family whose width axis carries display, body and labels), JetBrains Mono (code and readouts, coding ligatures removed so it reads like a terminal), and an "ME Symbols" supplement for the glyphs neither has (✓ ⏺ ⎿ ✻ …).
- The grid is the measuring scale: 40px cells, 160px majors, centred on the frame, so values can be read off the plane and every scene's grid lands on the same pixels.
- Transitions added and registered in `videowright.config.ts`: `me-sweep` (the signature cyan scanline wipe) and `me-push` (a camera push through the content).
- Two player fixes for transitions (`packages/lib/src/player`): the transition is resolved before the incoming segment mounts, and the timeline's transitions are preloaded before render capture starts, so no transition loads mid-render.
