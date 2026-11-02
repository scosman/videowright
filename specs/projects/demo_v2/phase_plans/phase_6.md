---
status: draft
---

# Phase 6: Whole-video polish and final render

## Overview

The final phase. It closes every deferred review item from Phases 1–5 (the batch in priority
order A–D), re-tunes the voiceover's pauses to the animation as built, adds the video's one
match cut (agents → end card), masters the track with two-pass linear loudnorm, proves nothing
else regressed, and renders the final 60fps `renders/demo_v2.mp4`.

Section A runs in order: the guards land before the retime, so the retime cannot silently break
the voiceover-sync beat or the 0.15s anchor rule. B (high-visibility polish), C (style pack) and
D (hygiene) are independent of the take and land before the retime's review render, so one
round of renders judges them all. The clean-room rule holds throughout: v1 renders are checked
by exit status, logs and an automated error-overlay pixel check only.

## Steps

### A1. Guards (before the retime)

1. `segments/v2-voiceover-sync/index.ts`: `LANE = { x: 160, w: 1600, t0: Math.floor(START) - 2, pxPerS: 80 }`; the doc comment says the lane starts 2 s before the beat's whole second.
2. `PACE_WPM` constant in the same segment (the `PACE · N WORDS / MIN` readout uses it), pinned by a test to `round(words / ((last.end − first.start) / 60))` over `timing.json`.
3. `specs/projects/demo_v2/tools/envelope.sh` also writes `export const TRACK_SHA256 = "<hex>";` (sha256 of the track it read) into `envelope.ts`.
4. Advances become frame-exact: each cued advance fires on frame `round(cue × 60) − 9` of the video (9 frames = 0.150 s), written as a 3-decimal segment-relative value whose `round(a × 60)` is that frame. A small sync script (`specs/projects/demo_v2/tools/sync_advances.mjs`, review tooling) computes them from `timing.json`, the VO placement and the cue-word table, and prints the `perSegment` table; nudge today's values with it.

### A2. Pause retune (same take)

1. Review the current full render's inter-beat gaps; pick the new marker lengths in `voiceovers/v1/provider_script.md`: tail `[[pause 5.0s]]`, `[[pause 0.9s]]` after "capture.", and every other gap tuned (no dead air, no beat starved of its settle).
2. The `[[pause 0.5s]]` after "agent," is attempted; `retime apply` refuses it on this take (0.18 s of natural silence, 0.4 s needed), and `retime.md` forbids working around a refused pause. So it is not added; the request's typing is paced from its own window instead (B, interactive dev).
3. `retime apply` on `raw.mp3` + `raw_stt.json` → `audio.mp3`, `timing.json`.
4. Re-sync with the script from A1.4: `voiceover.ts`, `tracks/v1/track.ts` (timing, `length_s`), every segment's `advances` and `const ADV`, `components/v2/program.ts`.
5. Rebuild `tracks/v1` in place (not yet adopted by the user, as in Phase 3) from `audio_plan.md` (snapshot, ffmpeg, ffprobe), then `envelope.sh`, then the `PACE_WPM` pin. `WORD_MS`/`LINE3_WORD_MS` stay (no marker inside that paragraph).
6. The track now holds the 5 s end hold: the final advance lands at the end of the audio. Update the "render pads" comments in `track.ts` and `audio_plan.md`, and the CTA's `END_HOLD` comment.

### A3. Match cut into the end card

1. `v2-any-coding-agent`: in the release (last ~600 ms of the exit window, derived from it), the panels' content (logos, names, statuses) rises out of masks, the locks let go, and one `--hairline-strong` outline (an SVG rect in the stage's annotation layer) morphs with `--ease-settle` over 500 ms from the union of the three panels to the end card's prompt box (geometry read from both segments' constants), landing on the exit frame; the panels' surfaces hand over to it.
2. Export the end card's box geometry from `v2-install-cta` (`CTA_BOX`) for the agents beat to target, and the agents' panel geometry stays local.
3. `timeline.ts`: `{ id: "v2-install-cta", transition: "cut" }`.
4. `v2-install-cta`: the box's surface and outline are up on frame 1 (no `panelIn`); the logo draws above it and the prompt types from the first frames (the window gains the push's ~0.7 s).

### A4. Loudness

`audio_plan.md`'s final mix command becomes two passes: the unmastered mix to a temporary WAV, a `loudnorm … print_format=json` measurement, then `loudnorm=I=-14:TP=-1.5:LRA=…:linear=true:measured_*` (with a true-peak guard ahead of it if the linear gain would overshoot the ceiling). The mix itself is unchanged. Measure the track and the final MP4 (ebur128 integrated, true peak).

### A5. Non-regression and final render

1. Render every other video in `videos/` at low fps; check exit status, the log, and one frame per segment for the error overlay with an automated pixel check (`/tmp/review/phase6/overlay_check.py`: the overlay's #e54 left border and dark-red strip at the bottom of the frame). v1 frames are never viewed.
2. Render the motion-engineering samples reel (C changes).
3. Final: `renders/demo_v2.mp4` at 60 fps with audio from the final tree; copy into `/tmp/review/phase6/`.

### B. High-visibility polish

- Title card: the cut bloom's gradient uses eased stops (0% α, 30% 0.55α, 65% 0.18α, 100% transparent), radius 560 px, a 500 ms fade.
- `typing.ts` `COLD_OPEN`: gains `reply` (the text and its stream rate: 2 words per 45 ms); `settledAt` includes the reply stream's end. The cold open reads both from it.
- Gallery:
  - Acme: `frameOn` region `x: tableBox.x + 18` (zoom 1.24 if the Note buttons crowd); click ring aim 0.42 and ring scale capped at 2.6; the composer's opacity is its own 90 ms linear ramp, the settle on transform only, `hide()` 100 ms.
  - Gear labels: each tooth count sits on a 40 px leader off its gear's pitch circle at a fixed angle per gear (no hand-placed floating labels).
  - Claim lock: `name-3` goes to fg-2 with `num-3`.
  - Lottie: the card lock and its tag release as the rocket clears the card (derived from the Lottie's own start and its exit frame), so no amber lock sits on an empty card.
  - Planet: land and ocean become one sphere whose fragment shader (via `onBeforeCompile` on `MeshStandardMaterial`) computes domain-warped value-noise continents per pixel (sharp coastlines and colour at 1080p, per-pixel roughness so only water glints, a bump from the height's screen derivatives); clouds the same on their shell. No JS noise or `mergeVertices` at mount (also the D mount-cost item). The atmosphere and halo are modulated by the key and rim light directions, so the limb varies. The satellite gets a gold-foil body, cell-gridded wings (canvas texture), a dish and a boom.
- Interactive dev: the request types on a seeded rhythm (±30 % jitter per key, a longer beat after `,` and `)`) from `TYPE_AT = 300` to a beat before Enter, paced from the window (see A2.2); the mini title card skips its dimension when unlabelled; `me-split`'s rule keyframe eases on `cubic-bezier(0.33, 1, 0.68, 1)`.
- Export: run 2 resolves at `perChar` 8; the SHA-256 label moves up 8 px clear of the hash lock; each run rolls its own noise seed.
- Voiceover sync: the line-3 selection shows at once (no delay); the waveform covers the lane through the growth; the ghost line uses `stroke-opacity`.
- End card: `ASK YOUR CODING AGENT` and `⏎ RETURN` share a baseline; judge keeping the URL's lock through the end hold.

### C. Style pack (both copies byte-identical; the demo's `transitions/me-push.ts` = STYLE.md recipe)

- `me-push`: the HUDs swap at the push's start (the outgoing scene's timecode is frozen once it unmounts) and the incoming HUD's readouts are live through the push; the key light glides on `--ease-sweep`; fix the one-frame "UP NEXT" garble found in a strip.
- `cta` sample: the `❯` is muted until the corners re-acquire the input, then turns amber; the caret leaves on Enter (STYLE.md's CTA line follows).
- `ui-showcase` sample: `frameOn` fits the focus mask's inner edges (1648 × 752), STYLE.md's Region framing wording follows; fix the "WA" ghost; keep `CACHE 47 OF 50 TASKS`.
- Glyph test: the fixture lists each bundled font's cmap separately; every on-screen character (comments stripped, numeric and named entities decoded) must be drawable by both stacks (Archivo + ME Symbols, JetBrains Mono + ME Symbols).

### D. Hygiene

- `hashing()` end includes the roll-in; `60 FPS` literals use `FPS` from `program.ts`; the ghost path uses `TL.blocks - 10` and `TL.wave + TL.waveH`.
- Gallery: charts and space are disposed on their own mount's `ctx.signal`, not from module state in `unmount()`.
- `agent.ts`: `wrapSpans(text, cols)` gives each wrapped line's offset in the text; `AgentInput.show(text, chars)` and the CTA place the caret from it (no phantom separator after a split word).
- Acme `moveCamera` starts from the pose at its start time (read when it starts), not the last target.
- Live dev uses `tui.echo` for the entered request and writes the status row only when it changes.
- `architecture.md`: the import rule allows the declared libraries.

### Records

- `videos/demo_v2/PLAN.md`: a dated Phase 6 log entry; `audio_plan.md`: rebuild and sync log entries.

## Tests

`packages/lib/test/integration/demo_v2.test.ts`:
- `the voiceover beat's word times are timing.json's, from each line's window start` (the reviewer's test).
- `the PACE readout is this take's pace`.
- `advances land on their VO cues`: each cued advance's frame (`startOf()` + `round(a × 60)`) is 9 frames before the cue word's frame, so its lead is within ±1/120 s of 0.150 s and its frame-rounded lead is ≤ 0.150 s.
- `ends the video END_HOLD_S after the last VO word`: the final advance is within a frame of the track's end (the track holds the end hold; no padding).
- `the voiceover beat's waveform is this track's`: `TRACK_SHA256` equals the sha256 of `track.mp3`.
- `the voiceover beat's lane starts 2 s before the beat`: `LANE.t0` is computed, not a literal.
- Transitions list: `v2-install-cta` enters on `cut`.
- `the final mix masters in two passes`: the plan's command measures, then applies `linear=true` with the measured values.

`packages/lib/test/unit/demo_v2_kit.test.ts`:
- `wrapSpans`: offsets index the original text; a split word has no separator charged.
- `COLD_OPEN.settledAt` covers the reply stream.

`packages/lib/test/unit/motion_engineering_pack.test.ts`:
- `every on-screen character is drawable by both font stacks` (per-font cmaps, comments stripped, named entities decoded).
