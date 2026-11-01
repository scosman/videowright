---
status: complete
---

# Phase 5: Remaining beats

## Overview

Add beats 5–8 to `demo_v2`, which completes the 8-segment timeline:

- `v2-pixel-perfect-export`: one command renders the video. The frame counter runs to the real frame count, the HUD shows two runs hashing identically, and the exported file opens in a player, paused at 00:00 on the shared title card.
- `v2-voiceover-sync`: this video's own `script.md`, with the spoken line highlighted and swept word by word. Under it is a timeline of the video's segment blocks over the real narration waveform. A cursor retypes line 3, and on "re-syncs" its block grows and the blocks after it shift.
- `v2-any-coding-agent`: "Works in any coding agent." over three bold targets: Claude Code, Codex and opencode, with their real logos drawn in. Each gets a `SUPPORTED ✓` readout in turn.
- `v2-install-cta`: the logo returns, and `Install Videowright using these instructions: github.com/scosman/videowright` types into an agent prompt box. The closing line rises, then the frame holds for 5.0s after the last VO word, with ambient motion only.

This phase builds on Phases 1–4 (through d81fb69). Clean room: the only v1-era assets touched are the three agent logos, copied byte for byte with `cp`.

## Steps

1. **Kit** (`components/v2/`):
   - `program.ts` (new): `PROGRAM`, the running order as the video shows it, as `{ id, name, seconds }[]`, where `seconds` is each segment's final advance in the default track. Also `FPS = 60`, `frameCount(fps)` (the render's own count, Σ round(seconds × fps)), `startOf(id)` (seconds, frame-exact) and `videoSeconds()`. Used by the export's counter and player, and by the voiceover beat's timeline.
   - `typing.ts`: `typeSchedule(text, start, end, seed)`. Times (ms) for each character on a seeded, human rhythm: jitter per key, and a longer beat after spaces and punctuation. The first character lands on `start` and the last on `end`, so callers derive the span from their advance window. Also `charsAt(times, t)`.
   - `stage.ts`: `panelIn(stage, panel, delay, duration)`, the style's panel entrance (outline draws, then the surface fills top-down), lifted from the samples' kit.
2. **`segments/v2-pixel-perfect-export/index.ts`** (entered on `me-sweep`). `ADV = [1.22, 2.41, 3.65, 5.33, 7.521]`:
   - From frame 1: a neutral-dark shell window (`videowright_demo — zsh`, prompt `~/videowright_demo $`, mono 34px), across the safe frame. The command types over the first window ("One command exports").
   - [0] "your": Enter. `Starting render... this may take a while.`, then the CLI's progress bar with `frame n / 4071` ticking (n stepped on `--dur-tick`, linear like a render), then `✓ wrote explainer.mp4`, all within the window. Under the shell, the HUD's `SHA-256` row for run 1 rolls while the frames are written, and resolves when the file is written.
   - [1] "It's": run 2's row rises and resolves group by group. Each group that matches gets a cyan tick to run 1, then `✓ MATCH`, and amber corners lock onto both rows.
   - [2] "pixel-perfect": the file opens. A dark player window zooms out of the `explainer.mp4` on the ✓ line (settle on transform, a short linear opacity ramp). The window title is `explainer.mp4`, with ▶, the scrubber at 0 and `00:00 / 01:07`. It shows the shared title card on a mini stage via `createTitleLockup(..., { labels: false }).showFinal()`. The shell and the hash rows recede (brightness), and the hash corners go cyan (focus shift).
   - [3] "not": corners lock onto the player's frame, and a cyan tag `FRAME 0 OF 4,071 · 1920 × 1080` rises under it.
   - Release (corners let go, camera rests) is derived from the exit window. [4] exits before "Your".
3. **`segments/v2-voiceover-sync/index.ts`** + `envelope.ts` (entered on `me-push`). `ADV = [2.54, 5.44, 6.92, 8.922]`:
   - An editor panel on `videos/demo_v2/voiceover_script/script.md`: a gutter (18, 19), `## v2-voiceover-sync`, then the paragraph soft-wrapped one sentence per row (mono 40px). Line 3 starts as an older, shorter draft.
   - The current line has an amber band and gutter mark. The band slides from line to line, and past lines recede to fg-2 with a cyan mark. Its words light up in a sweep from cue + 150ms to 86% of the line's advance window, by character offset.
   - The timeline lane under it is on the grid's scale (1 cell = 1 s) and shows 0:30–1:10 of the video. It holds the `PROGRAM` blocks (`04 live-dev` … `08 install`), a waveform of this video's own track (`envelope.ts`, RMS per 0.1s of `track.mp3`), a playhead at the video's real time, and a status (`SYNCED ✓`). Before the edit, the lane shows the old draft's timing: block 06 is 1.2s shorter, the blocks after it sit 1.2s earlier, and line 3's stretch of the waveform is compressed.
   - [0] "The": line 2. During its window, the cursor travels to the end of line 3.
   - [1] "Edit": a triple-click selects the old line, and the playhead pauses (editing). Then `Edit a line and the video re-syncs.` types over the window (the typed line is the line being heard).
   - [2] "re-syncs": `RE-SYNCING…`. The old bars collapse, block 06 grows by 1.2s (its duration ticks 7.72 → 8.92 S), blocks 07–08 and the waveform after them shift right, the line's new bars rise left to right, and then `SYNCED ✓`.
   - Release, then [3] exits before "And".
4. **`segments/v2-any-coding-agent/index.ts`** + `icons/{claude,codex,opencode}.svg` (copied with `cp`), entered on `me-sweep`. `ADV = [1.36, 3.737]`:
   - From frame 1 (under the sweep): the h1 "Works in any coding agent." rises. Three panels on the grid (480 wide, 80 gutters) measure themselves in. Each logo's outline draws and then fills: Claude's mark in `#D97757` (its own mark), Codex and opencode in their own monochrome. The names rise.
   - [0] "every": the amber corners hop Claude → Codex → opencode at fractions of the window. Each target's `SUPPORTED ✓` decodes as the lock lands, and the previous lock goes cyan. Then the HUD reports `3 / 3 SUPPORTED`. Release, then [1] exits before "Install".
5. **`segments/v2-install-cta/index.ts`** (entered on `me-push`). `ADV = [3.34, 10.65]`:
   - From frame 1: the logo (mark drawn stroke by stroke, the wordmark rising letter by letter) on the x = 160 line. Under it, the agent prompt box (`.me-panel`, `ASK YOUR CODING AGENT`, an amber `❯`, a `⏎ RETURN` chip). `Install Videowright using these instructions: github.com/scosman/videowright` types into it across the first window (word-wrapped, so the URL is the second line). The caret blinks on a `steps()` loop.
   - [0] "You'll": the closing line "You'll have a video before your coffee is cold." rises, and the corners lock onto the URL.
   - Release at the end hold's start (`ADV[1] − END_HOLD` + 0.5s): the corners let go and the probe settles. Then the calm final state runs to [1] = the last VO word's end + `END_HOLD` (5.0s).
6. **Timeline and audio timing**:
   - `timeline.ts` appends the four entries: `me-sweep`, `me-push`, `me-sweep`, `me-push`.
   - `voiceovers/v1/voiceover.ts` and `tracks/v1/track.ts` gain the four segments, with cue annotations. Every cued advance sits exactly 0.150s before its word in `timing.json`. The final advance ends the video 5.0s after "cold." (track 67.858s ≥ 63.40s).
   - Log the sync in `audio_plan.md`.
7. **PLAN.md**: a dated Phase 5 log entry covering each beat, the transitions chosen, and departures from the Direction with reasons.
8. **Render, look, iterate** into `/tmp/review/phase5/`:
   - a low-fps full-timeline render with contact sheets;
   - full-res stills at each VO cue in the new beats;
   - 60fps strips across the four new transitions and key sub-beats;
   - a 60fps mp4 with audio of the new beats, and a full 60fps render with audio;
   - a lossless double render of the new beats, comparing raw frames.

   Fix what is seen. Then write the self-critique (in the return summary) and act on its top items.
9. **Checks**: `source specs/projects/demo_v2/tools/env.sh && ./checks.sh`.

## Tests

`packages/lib/test/integration/demo_v2.test.ts`:
- `loads with the built v2 segments in order`: all eight ids, with transitions `[undefined, cut, me-push, me-split, me-sweep, me-push, me-sweep, me-push]`, each registered in the config.
- `advances land on their VO cues`: extended with export ("your", "It's", "pixel-perfect", "not", "Your"), voiceover sync ("The", "Edit", "resyncs", "And") and agents ("every", "Install"), plus the CTA's "You'll". Each is 0.15s before its word.
- `the final advance leaves the 5s end hold`: the CTA's last advance is the last word's end + 5.0s, and the timeline covers the whole track (≥ `length_s`), with no tail beyond the hold.
- `every segment's advances ascend`: positive, strictly increasing, in the track and in each segment's own `advances`. The existing `const ADV` copy check covers the four new segments.
- `PROGRAM is the timeline`: the same ids in order, each `seconds` equal to the segment's final track advance, and `frameCount()` equal to the render's frame count.
- `the voiceover beat's waveform is this track's`: `envelope.ts` has one value per 0.1s of `track.mp3` (`round(length_s × 10)`).
- `the agent logos are the byte-identical allowed assets`.

`packages/lib/test/unit/demo_v2_kit.test.ts`:
- `typeSchedule`: one time per character, non-decreasing, first on `start` and last on `end`, the same on every call (seeded), and a longer beat after a space than its average key.
- `charsAt`: counts the characters due by `t`.
