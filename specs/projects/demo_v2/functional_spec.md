---
status: complete
---

# Functional Spec: Demo v2

## Summary

Two deliverables, in order:

1. **Style upgrade.** Rebuild the built-in `motion-engineering` style pack to a much higher visual standard: design system, motion system, transitions, typography, and all 10 sample scenes.
2. **`demo_v2` video.** A new video in `examples/videowright_demo/videos/demo_v2/`, built fresh in the upgraded style from demo v1's script and its *human* design decisions only.

Plus the audio. The voiceover is regenerated with the current TTS pipeline (ElevenLabs v3 + retime). The user generates the take in the ElevenLabs portal *before* implementation starts. Demo v1's latest take is a fallback placeholder, used only if the new take is not in the repo yet.

## Goals

- A demo video that is clearly better than v1 in every dimension: composition, typography, motion, transitions, timing, polish.
- A built-in style that new Videowright users can pick and get great results from.
- No regressions: every existing video still renders, and all repo checks pass.

## Non-goals

- Changing the script's message or the beat structure (8 beats, same order).
- Upgrading the other five built-in styles.
- Framework (`packages/lib/src`) changes. Exception: a blocking bug found during the build. Fix it minimally, with a test, and call it out.
- Publishing: uploading the MP4 to the README, or a release.

---

## The clean-room rule (applies to every phase)

The user's thesis is that building fresh from the script beats iterating on v1, and that looking at v1's implementation anchors the result downward. So:

**Agents building this project must NOT open or search:**

- `examples/videowright_demo/segments/**`, except new `v2-*` segments and the raw assets named under "Allowed assets" below.
- `examples/videowright_demo/videos/demo_video/**`, `demo_editorial_mono/**`, `demo_risograph/**`, `blooper_reel/**`, except copying the named audio assets byte-for-byte.
- `examples/videowright_demo/components/blooper-kit.ts`.
- The *pre-upgrade* contents of `styles/motion-engineering/` (both copies), and the sample/reference files of the other built-in packs. Overwrite them without reading. Everything needed from the old style (its identity and token names) is in this spec.
- Demo v1 renders, and the README demo video.

**Allowed (these are API docs or raw assets, not design):**

- Skill references: `packages/lib/skill/SKILL.md` and `packages/lib/skill/references/**`. Read them; they define the authoring API, render-safety rules, and the audio pipeline.
- Library source and types: `packages/lib/src/**`.
- Assets, copied into v2-owned locations:
  - Agent logos: `segments/any-coding-agent/icons/{claude,codex,opencode}.svg`.
  - Lottie: `examples/videowright_demo/rocket-launch.json`.
  - Placeholder VO: `videos/demo_video/audio/originals/voiceovers/v4/{audio.mp3,timing.json}`.
  - Typing SFX: `videos/demo_video/audio/originals/sfx/laptop_typing/audio.mp3`.
  - Videowright mark: `specs/projects/demo_v2/assets/videowright-mark.svg`.

Code review agents may read anything the diff touches, to verify non-regression.

---

## Part A — Upgrade the `motion-engineering` style pack

### Identity to keep (the only thing carried over)

> **Motion Engineering.** Aerospace HUD on a blueprint grid. Charcoal canvas, cyan-white type, an amber HUD signal color, cyan for measurement. Elements *measure themselves in*: dimension lines draw, crosshairs lock on, callouts arrive on leader lines. Every frame looks like a live engineering instrument. Mood: technical, precise, engineered, alive.

Everything else is designed fresh: palette values, type, scale, layout, motion, transitions, ambient layer, and scene recipes.

### Where it lives

- Source of truth: `packages/lib/skill/assets/styles/motion-engineering/`. It ships in the npm package, so new users get it.
- Synced copy: `examples/videowright_demo/styles/motion-engineering/`, plus re-copied samples in `examples/videowright_demo/segments/motion-engineering-sample-*/index.ts`.
- Files: `STYLE.md`, `tokens.css`, `brand.md`, `fonts/` (new), `reference/scenes.html`, `reference/animations.jsx`, and `sample/{title,section,kinetic,bullet,stat,feature,grid,ui-showcase,content,cta}.ts`. Keep the same 10 scene names and the same segment ids (`motion-engineering-sample-<scene>`).

### Requirements

1. **Fonts actually load.** Today nothing loads a style's `font_sources`, so every style has silently rendered in fallback system fonts. The upgraded pack must:
   - Bundle its fonts as `woff2` files in `fonts/`, with `@font-face` in `tokens.css` and relative URLs. Fonts must be OFL-licensed.
   - Never capture a frame with fallback glyphs. Samples await font readiness in `mount()`.
   - The agent may keep Space Grotesk + JetBrains Mono or choose better OFL faces. Justify the choice in `brand.md`.
2. **Token compatibility.** Every token name the old pack defined must still exist, so any segment or style already using them keeps working. Values may change. New tokens are additive. The old names are: `--color-bg`, `--color-fg`, `--color-accent`, `--color-muted`, `--color-border`, `--color-surface`, `--font-display`, `--font-body`, `--font-mono`, `--space-sm|md|lg|xl`, `--duration-fast|normal|slow`, `--radius-sm|md`, `--stagger`, `--ease-out`, `--ease-in`, `--rule-weight`, `--scene-hold`, `--safe-x`, `--safe-y`, `--cyan`, `--warn`, `--grid-line`.
3. **A real design system in `tokens.css`.** Type scale, a layered surface/elevation set, glow/light tokens for amber and cyan, line weights, motion easings and durations, and a z-layer convention.
4. **Legibility floor at 1080p.** Display 120px and up, headings 72px and up, body 36px and up, mono UI/code 28px and up. Labels and micro-readouts 22px minimum. Nothing smaller, ever. A label too small to read at phone size is removed, not shrunk.
5. **Depth and light.** Scenes are layered, not flat: grid plane, light falloff/vignette, a static film-grain texture, glowing signal elements, hairline surfaces with edge highlights. All of it must be render-safe (static or clock-driven).
6. **Motion system.** Write the choreography down in `STYLE.md` and apply it in every sample:
   - Order: **draw → fill → annotate → breathe**.
   - Expo-out settles. Eased draws. No bounce, spring, or fade-only entrances.
   - Text reveals are masked line reveals and/or a mono "decode".
   - Numbers tick; they don't tween.
   - Stagger rules, plus enter and exit choreography.
7. **Living frame.** Nothing is fully static for more than ~1s: slow camera drift or push, ambient HUD readouts, a subtle grid response. Restraint matters: ambient motion must never compete with the focal point.
8. **Transitions vocabulary.** `STYLE.md` defines the style's scene transitions (at least a signature sweep wipe and a camera push), each with a copy-pasteable `Transition` recipe (see [types.md](../../../packages/lib/skill/references/types.md) and the config `transitions` map). Samples demonstrate the in-scene enter/exit halves.
9. **Composition.** One focal point per frame. Content fills the frame (80–90%+ of width for primary content). HUD chrome (corner ticks, readouts) lives in a defined safe frame and never collides with content.
10. **Samples are self-contained.** They import only from `videowright`, with no relative imports, because they get copied into consumer repos. Each must render deterministically and pass the render-safety checklist in `create_or_edit_video.md` Step 2b.
11. **References stay truthful.** `reference/scenes.html` and `reference/animations.jsx` are rewritten to show the new system. They may be shorter than today's, but must not contradict it. `brand.md` explains the token rationale.
12. **Docs.** Update the pack's one-line blurb in `setup_new_style.md` (the picker list) and `picker_description` if the identity wording changes. Update the README note about built-in styles to say Motion Engineering has been upgraded.

### Keeping v1 unchanged

Upgrading in place changes `demo_video`, because it uses the project default style. Snapshot the *current* style files byte-for-byte into `examples/videowright_demo/styles/motion-engineering-legacy/`, without reading them, *before* the upgrade. Then point `demo_video/timeline.ts` at it, updating both its CSS import and `meta.style`. That is the only edit to v1.

---

## Part B — The `demo_v2` video

### Brief

- **Audience:** developers who use coding agents (Claude Code, Codex, opencode).
- **Takeaway:** Videowright turns a coding agent into a video team. One prompt, any web tech, a live preview you edit in chat, deterministic MP4 export, narration-driven timing, works in any major agent.
- **Format:** 1920×1080, 60fps, 16:9. Runtime is driven by the VO: about 64s of narration plus a ~5s end hold.
- **Style:** the upgraded `motion-engineering` (project default).
- **Audio:** voiceover, plus one typing SFX under the opening prompt being typed. No music.
- **Logo:** the Videowright mark (three round-capped gradient strokes) plus the wordmark "videowright" in Outfit SemiBold, lowercase. Wordmark is navy `#161A3A` on light, near-white on dark. The mark is in `specs/projects/demo_v2/assets/videowright-mark.svg`, built as `<line>` strokes so it can be drawn in. Use it on the title card, inside the hot-reload payoff and the export player (both show the title card), and on the end card. Keep the mark's own gradients; don't recolor it into the HUD palette.

### Script (verbatim; one section per segment)

| Segment | Voiceover |
|---|---|
| `v2-cold-open` | The video you're watching and this voice were generated by Videowright in Claude Code, with a single prompt. |
| `v2-title-card` | Videowright turns a coding agent into a video team, using any web technologies. |
| `v2-web-tech-gallery` | That includes animated SVG. Any library, like charting libraries. Advanced 3D and motion, like Three.js or Lottie. Even your real product UI, rendered from your app's codebase. If your stack runs in a browser, Videowright supports it. |
| `v2-interactive-dev` | Request changes in your coding agent, and the preview hot reloads. |
| `v2-pixel-perfect-export` | One command exports your video. It's deterministic, pixel-perfect rendering. Not a screen capture. |
| `v2-voiceover-sync` | Your script generates an AI narration. The pace of the narration drives the video timing. Edit a line and the video re-syncs. |
| `v2-any-coding-agent` | And Videowright works in every major coding agent. |
| `v2-install-cta` | Install Videowright and ask your agent to build your video. You'll have a video, before your coffee is cold. |

The script text is fixed. Delivery-level punctuation in `provider_script.md` may be tuned for the TTS.

TTS pronunciation: "Videowright" = "video write". Spell out "S V G", "3 D", and "U I" with spaces in the provider script. "Three.js" = "three dot J S". "Lottie" = "LOT-ee".

### Per-beat contract

Each beat has **Must** items (human decisions; non-negotiable) and **Direction** (the planner's proposal; a builder may beat it with something clearly better, and should log why).

#### 1. `v2-cold-open`

- **Must:**
  - A Claude Code session in a normal terminal.
  - The user's prompt: `I want to build a video, here's the script:`, with a `[Pasted 43 lines]` paste chip.
  - Claude responds, works briefly (spinner), and finishes with `Video is ready. Preview: npm run dev`.
  - Claude orange (`#D97757`) only on Claude's own marks: mascot, prompt chevron, message bullets, status pip. The terminal chrome stays neutral dark.
  - The typing SFX plays under the visual typing.
  - The beat ends on a **hard cut** to the title card. This is the most important edit in the video, and the hook lands on it. The cut falls on the clean breath after the VO line.
- **Direction:**
  - Open cold and tight on the prompt as it types (huge and readable).
  - The camera pulls back as Claude replies, revealing the full session.
  - The terminal is full-bleed with no HUD around it, so it reads as a real screen.
  - The hard cut then drops the viewer into the instrument world of the video Claude just made.

#### 2. `v2-title-card`

- **Must:** Videowright logo lockup and the tagline "Build videos in Claude Code". A deliberate hero hold.
- **Direction:**
  - The three mark strokes draw in (staggered), the wordmark reveals, the tagline settles.
  - The HUD measures the lockup: a crosshair locks on, dimension lines bracket it, readouts tick.
  - This is the video's best frame.

#### 3. `v2-web-tech-gallery`

- **Must:**
  - The claim "If the browser can render it, Videowright can animate it." stays on screen for the whole beat. No closing tagline swap.
  - Four demos, in order, each switching on its VO cue: **animated SVG** → **a real charting library (ECharts)** → **real Three.js + real Lottie** (the rocket from `rocket-launch.json`) → **a real product UI**.
  - Each demo is labelled with its technology.
  - The product UI is a shadcn-style SaaS app (Acme Inc). It goes: dashboard (KPIs count up, charts draw) → navigate to Customers → act on a row (type a note, send) → toast confirms.
  - The final sentence ("If your stack runs in a browser…") plays over the app.
- **Direction:**
  - Each demo uses the full stage, not a small panel.
  - The SVG demo is an intricate self-drawing vector piece.
  - Charts animate in, then live-update.
  - The 3D scene is lit, not wireframe-only.
  - The app is shown at legible scale, with a camera that frames regions of interest and a visible cursor, rather than shrinking the whole app.
  - A 4-step progress indicator.
  - Sub-scene changes use the style's signature sweep.

#### 4. `v2-interactive-dev`

- **Must:**
  - Split screen: the coding agent (Claude Code, ~40%) and a browser on the dev server (`localhost:5173`, ~60%).
  - The browser starts on a deliberately off-brand card: "VideoRight" / "Video Agent Tool", in a generic font, plain.
  - The prompt types in: `update the title card to our latest branding (name, tagline, design guide, colors), and add some motion`.
  - The agent edits files: `Updating segments/title-card.ts, styles/tokens.css…`, then `✓ Done. Hot-reloaded.`
  - On the VO word "reloads", the browser hot-reloads to the **real v2 title card** playing its reveal. This is prop continuity with beat 2, using the same component.
  - It holds ~2s on the result.
- **Direction:** a satisfying hot-reload moment (a viewport refresh sweep plus an HMR badge), with readable agent text.

#### 5. `v2-pixel-perfect-export`

- **Must:**
  - One command types into a terminal: `npx videowright render --output explainer.mp4`.
  - Progress runs to completion with a frame counter (total = this video's real frame count), then `✓ wrote explainer.mp4`.
  - The exported video opens in a 16:9 player over the terminal, **paused at 00:00** (just opened), showing the title card frame.
- **Direction:** make "deterministic, pixel-perfect" visible. For example, frames streaming out as a filmstrip, or a frame-hash readout matching across two runs. Tasteful, not gimmicky.

#### 6. `v2-voiceover-sync`

- **Must:**
  - This video's own `voiceover_script/script.md` is shown with the line being spoken highlighted, in sync with the VO. This is the meta-moment: the highlighted line is what you are hearing.
  - Alongside it, a timeline of segment blocks driven by the narration.
  - A cursor edits a line, typing `Edit a line and the video re-syncs.`. The matching block re-times (grows, downstream blocks shift) and the status goes from re-syncing to `SYNCED ✓`.
- **Direction:**
  - Line-level sync via one `waitForNext()` per sentence, with a word sweep inside each line.
  - A waveform lane under the blocks.
  - Show only the 3–4 relevant script lines, large.

#### 7. `v2-any-coding-agent`

- **Must:** "Works in any coding agent.", with Claude Code, Codex, and opencode shown with their real logos and names.
- **Direction:** three bold targets that fill the frame, logos drawing in, a `SUPPORTED ✓` readout ticking per agent. It must read in ~4s.

#### 8. `v2-install-cta`

- **Must:**
  - An "Install Videowright" end card.
  - Holds ~5s after the VO ends so the final frame breathes (ambient motion only).
  - Never show `videowright.dev`.
  - Install content (user decision): the real install path from the README. Show a coding-agent prompt box with `Install Videowright using these instructions:` and `github.com/scosman/videowright` as the visible destination. Do not use `npm install videowright`.
- **Direction:** logo lockup returns, the install line types into an agent input box, the HUD settles into a calm final state.

### Global creative bar

- **One world.** All segments share one blueprint grid plane, anchored at the same origin, so a wipe or cut reads as one instrument changing readouts, not as the page changing. Persistent HUD chrome (corner ticks, beat index `02 / 08`, section name) sits at identical positions in every segment.
- **Designed cuts.** Every transition is chosen for its cut. No default fades. Vary the rhythm: hard cut, sweep, push, match cut. Exactly one hard cut is mandated (1→2).
- **Legible at phone size.** The Part A legibility floor applies to everything, including terminal, browser, and app mockups. Frame regions of interest with the camera; never shrink a whole window.
- **Timed to the voice.** Every reveal lands on its VO cue: it starts ≤150ms before the cue word, never after. No dead air: when the VO pauses, the picture is doing something deliberate.
- **Restraint.** The ambient layer supports the focal point and never competes with it. Use one accent at a time.

---

## Part C — Audio

1. **New VO take: prepared during speccing (done), generated by the user.**
   - `videos/demo_v2/audio/originals/voiceovers/v1/` already contains:
     - `provider_script.md`: ElevenLabs v3, Asher, stability 0.5, with `[[pause Xs]]` markers at every segment boundary and at each internal VO cue.
     - `generate.sh`: the API flow, for if a key is ever added.
     - `HANDOFF.md`: the exact portal text and steps.
   - The user drops `raw.mp3` and `raw_stt.json` (the ElevenLabs Speech-to-Text JSON export) into that folder.
   - The build environment cannot run STT itself (no keys; model hosts are blocked), so the STT JSON is required.
2. **Ingest (Phase 3).**
   - Run `retime check` and reject a bad take by asking the user to regenerate.
   - Run `retime apply` → `audio.mp3` + `timing.json`.
   - Sync with the skill's sync algorithm and write `voiceover.ts` (`provider: "elevenlabs"`, `model: "eleven_v3"`, `voice: "tMvyQtpCVQ0DkixuYm6J"`).
3. **Fallback placeholder.** Only if the take is not in the repo when Phase 3 starts:
   - Copy demo v1's latest take (`voiceovers/v4/audio.mp3` and `timing.json`; its words match the script) into `voiceovers/placeholder/`.
   - Sync it, and note in its `voiceover.ts` that it is a placeholder (`eleven_multilingual_v2`).
   - Swap to the v1 take as soon as it arrives (Phase 7).
4. **SFX.** Copy the typing SFX into `demo_v2/audio/originals/sfx/laptop_typing/` and align it to the visual typing in `v2-cold-open`.
5. **Track.** Write `audio_plan.md` (typing SFX + VO, mastered to -14 LUFS) and build tracks with the skill's build flow. `timeline.ts` uses the latest as `default_audio_track`.
6. **Pause tuning (Phase 6).** The marker lengths in `provider_script.md` were sized for the *planned* animation. Once the animation is built:
   - Re-tune them to the real needs: transition room, the hot-reload payoff, the cut breath, the re-sync animation.
   - Edit the markers and re-run `retime apply` on the same `raw.mp3` / `raw_stt.json`. No new take is needed.
   - Then re-sync and rebuild the track.
   - Never edit the audio anywhere except at markers (see `retime.md`). If a segment's animation doesn't fit its beat, adjust the segment or the pause, not the words.

---

## Quality process

- **Render, look, iterate.** After building or changing a segment, the builder renders the whole video at low fps. It inspects a contact sheet plus full-res stills at each VO cue time and at transition midpoints. It fixes what it sees before handing to code review. Low-fps contact sheets judge layout; motion is judged from short 60fps clips around transitions (frame strips).
- **Manager design review.** At the end of each phase, the manager reviews the renders and sends concrete design feedback. That feedback is a coding round like any other.
- **Self-critique.** Each phase's builder writes a short "what would make this better" note in the phase plan, and acts on the top items before declaring done.

## Non-regression

- `./checks.sh` (lint, typecheck, tests) passes.
- Every video in `examples/videowright_demo/videos/` renders without errors. `demo_video` looks as before (pinned to the legacy style).
- No existing segment, component, or other style is modified, except the re-copied `motion-engineering-sample-*` segments and the `demo_video` timeline pin.

## Acceptance criteria

- The upgraded pack meets Part A 1–12. The 10 samples render cleanly, and a contact sheet of them is shown to the user.
- `videowright render demo_v2` produces a 1920×1080 60fps MP4 with audio, with no advance/coherence errors. Every Must item is visible in the frames.
- No text below the legibility floor. No frame static for more than 1s except by design. No clipping, overlap, or flash-of-unstyled-fonts.
- The final MP4 is in `renders/demo_v2.mp4` (gitignored) and sent to the user.
- The final video uses the ElevenLabs v3 take (`voiceovers/v1`), retimed and synced. It does not use the placeholder.
- PLAN.md for `demo_v2` exists with the brief and script, and a log of every phase.
