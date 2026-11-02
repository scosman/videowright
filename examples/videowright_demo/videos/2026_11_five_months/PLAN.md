# Plan: 5 months of progress in Claude video generation

## Purpose
- Audience: developers and AI-curious people scrolling Reddit, X and LinkedIn. The post's title carries the headline ("5 months of progress in Claude video generation").
- Takeaway: the same demo video, made by Claude twice from the same script and the same brief, five months apart, is dramatically better. Videowright is how both were made.
- The comparison: `demo_video` ("Then", made 2026-05-15/16) vs `demo_v2` ("Now", made 2026-10-31 to 11-02). 171 days. Same script, same brief; the style rebuild for v2 was also briefed as "rebuild the style with the new model making the decisions", so the model is the variable.
- Constraints / hard guidelines:
  - **Sound off by default.** Every social site autoplays muted. Every spoken line has an on-screen equivalent (the rail captions, the title, the CTA text); the voice beat shows word-timed captions and a "Sound on" chip.
  - **Then/Now must be unmistakable**, and the Then → Now transition and the position of both are the most important thing in the video (see Comparison rig).
  - Legibility at phone size (a 1920 frame shown ~390pt wide is a 0.2 scale): THEN/NOW labels ~96-110px, captions ~64px, voice-beat captions 72px+.
  - Fairness: the Then footage is shown as rendered. No desaturation, no VHS or "old" effects, no softening.
  - 1920×1080, 60fps, 16:9. About 75s including a ~5s end hold (138 spoken words, ~52s, plus the pauses; pauses can be tightened after the take).
  - CTA: the Videowright logo, "Videowright", "Build videos in Claude Code", `github.com/scosman/videowright`.

## Style
- Active style: `motion-engineering` (project default; the v2-upgraded pack).
- Notes: reuse the `components/v2/` kit (fonts, motion, stage, logo, title-lockup, sweep). No v2 HUD readouts in the comparison beats: the rail is this video's instrument. The cyan sweep is the Then → Now gesture.

## Audio intent
- Voiceover: yes. ElevenLabs v4, voice Cosman-1 (the owner's instant voice clone), for all narration. One line in ElevenLabs v2 (`eleven_multilingual_v2`, stock voice Asher, the May settings) for the voice beat's "Then". Round 2: the voice beat's Now line is calm, with `[factual]` / `[confident]` tags.
- Sound effects: yes, light. One soft whoosh under each Then → Now sweep, low under the VO. Nothing else.
- Background music: yes. A low instrumental bed under the VO; out entirely for the voice beat (so the two voices compare cleanly), back for the CTA, resolving on the end hold.
- Notes: the comparison clips are muted (their own audio is never heard). The voice beat's narration is the example: the old voice describes itself, then the new voice answers.

## Comparison rig
One fixed layout for every Then/Now pair. Nothing moves between Then and Now except the beam.

```
┌──────────────────────────────────────────────────────────────┐
│       ┌──────────────────────────────────────────────┐       │
│       │                                              │       │
│       │        footage window · 1440×810 (75%)       │       │
│       │      THEN clip  ── beam ──▶  NOW clip        │       │
│       │                                              │       │
│       └──────────────────────────────────────────────┘       │
│       THEN  ●━━━━┿━━━━┿━━━━┿━━━━┿━━━━┿━━━━━━━━━━━━━○  NOW     │
│                    <caption: Then line / Now line>           │
└──────────────────────────────────────────────────────────────┘
```

- Footage window: 1440×810 (exactly 0.75× of the 1080p source), centred, thin border. Then and Now play in the same rect.
- Rail: THEN (left, aligned to the window's left edge) and NOW (right, aligned to its right edge), both always visible. The active one is lit (Then fg, Now amber); the other is dimmed to ~30%. Between them, the ruler from the title card: one tick per month, May to Nov, with a marker at the active end.
- Caption row: centred under the rail, ~64px. The Then line in fg-2, the Now line in fg. It swaps when the beam reaches the middle of the window.
- Then → Now: one gesture. The cyan beam sweeps left → right across the window; behind it is Now (like a progress bar). The rail marker travels THEN → NOW in lockstep, the window border turns from grey to amber behind the beam, and the caption swaps at the midpoint. ~0.6s.
- Next pair: hard cut to the next Then clip; the marker snaps back to THEN (~0.3s).
- Holds: Then at least 3s, Now at least 4s, so a muted viewer reads the caption, then looks.
- Build the rig first (on the 3D pair) and get the owner's sign-off on a render before the other beats.

## Segment outline
Round 2 (the owner's notes on the first render). Captions use the narration's own words, so what a muted viewer reads is what the narration says.
1. `fm-title` — one title, whole on frame 1 (the thumbnail): a huge **5 months** over "of progress in Claude video generation". No rail, dates or claim line. It rises out on the release cue.
2. `fm-pair-title-card` — the first pair builds the rig in (window, rail, caption, ~0.7s). Caption: "designs were basic" → "rich animations and graphics".
3. `fm-pair-3d` — Caption: "a simple shape" → "real-time scenes on the GPU".
4. `fm-pair-product-ui` — Caption: "a dashboard that played itself" → "a cursor, a panning camera, a real route change" (auto-fit to one line).
5. `fm-pair-narration-sync` — Caption: "narration sync was by line" → "timed to every word".
6. `fm-voice` — the rig with a voice instrument: the line's real waveform with a playhead and 70px words lit on their real times; the Now line's `FACTUAL` / `CONFIDENT` tags as amber chips. No "Sound on" chip. Caption: "ElevenLabs v2 · stock voice" → "ElevenLabs v4 · my cloned voice".
7. `fm-cta` — the v2 logo draws at the centre (wordmark on "Videowright", then "Build videos in Claude Code"), glides up on "open-source", the six feature tiles (line icons that draw themselves: Animation, Styles, Voiceovers, Sound effects, Music, And more) arrive as one staggered gesture on "animation", the GitHub link rises whole on "Download" ("FREE AND OPEN SOURCE", `github.com/scosman/videowright` in amber). ~5s end hold.

## Footage
- Approach: render both videos, cut short clips, play them in `<video>` driven by the segment clock (`components/fm/clip.ts`). Chosen over mounting the original segments in divs (they can only play from their own start, their style tokens collide, v2's HUD binds to the nearest player host, and it would be May's code on today's library) and over iframes (the render clock only drives the top-level page).
- Library feature added for it: `ctx.deferFrame(promise)` (the render driver waits for every deferral made during a frame before capturing it; a seek's `seeked` promise is the deferral). Documented in the skill (authoring_segment.md, recipe 7).
- Clips: VP9 WebM at exactly the window's size (1440×810), 60fps, a keyframe every 10 frames, no audio. `footage/build.sh` renders the sources and cuts every clip. Then: a fresh render of `demo_video` (pinned to the frozen `motion-engineering-legacy` style; the original May MP4 was not available). Now: `footage/v2_source.timeline.ts`, demo_v2's title card, gallery and voiceover-sync segments with demo_v2's track timing, except the gallery's 3D + Lottie beat, held 3.4s longer (the 3D pair's Now narration runs ~6.6s; the shipped beat is 4.1s). Same scene and code, running longer: the planet keeps turning, the rocket launches later.
- Clip windows (source seconds; see `footage/build.sh`):

| Pair | Then (`demo_video` render) | Now (`v2_source` render) |
|---|---|---|
| Title card | 9.35 + 4.20s (the reveal, from the headline's first frames) | 0.00 + 4.90s (from the hard cut: bloom, strokes, wordmark) |
| 3D + Lottie | 19.25 + 3.55s | 12.10 + 6.70s (planet, satellite, Lottie launch) |
| Product UI | 23.20 + 4.30s (KPIs, the tab switching itself) | 20.20 + 6.30s (cursor → Customers → note → toast) |
| Narration sync | 46.50 + 3.95s (the line highlighted) | 30.10 + 4.15s (line 2 lit word by word on its real times, then the edit begins) |

## Script
See `voiceover_script/script.md` (round 2, one section per segment, with each caption). Audio sources: `audio/originals/voiceovers/v2/` (Cosman-1, v4: the whole narration but the voice beat, one take), `voice_then/` (Asher, v2) and `voice_now/` (Cosman-1, v4, `[factual]` / `[confident]`). `audio/assemble.mjs` joins them; `audio/sync.mjs` computes every cue into `audio/cues.json`, which the track, the voiceover and the segments read; `audio/mix.mjs` is the audio plan's mix command.

---

## Log

### 2026-11-02 — Plan confirmed, audio handoff
- Script and comparison rig confirmed with the owner after two rounds:
  - Designed for sound off: the rail captions carry every comparison; the voice beat gets word-timed captions and a "Sound on" chip.
  - Then/Now labels and the Then → Now gesture are the priority; the rig is built and reviewed first.
  - Copy edits from the owner: "a spinning polygon" (not "icosahedron"), "a panning camera", narration sync "by line" → "timed to every word", the voice beat's narration is itself the example (old voice describes itself, new voice answers), and the CTA pitches Videowright as the open-source framework that made both videos.
  - Title card first (it is the thumbnail, and it teaches the rail: left = May = Then, right = Nov = Now).
  - Music bed: yes. SFX: light (one whoosh per sweep).
- Audio is generated by the owner in the ElevenLabs portal (no API key in the build environment). Handoffs written: `audio/originals/voiceovers/v1/HANDOFF.md`, `audio/originals/voiceovers/then_asher_v2/HANDOFF.md`, `audio/originals/music/bed/HANDOFF.md`, `audio/originals/sfx/sweep_whoosh/HANDOFF.md`.

### 2026-11-02 — Audio track v1, `ctx.deferFrame`, the rig and every beat (owner away)
- Audio: both portal takes passed `retime check` (only STT spellings: 3D, GPU, UI, VideoWrite). Two pause changes before `retime apply`: after "polygon." 0.8 → 1.0s (the 3D Then clip needs its ~3s), and the voice-beat gap 8.0 → 9.0s (Now hold, the "Sound on" chip, the 5.1s Asher line, a breath). The narration runs 73.33s. Track v1 (`audio/audio_plan.md`): narration from 0s; the Asher line at 42.60s, +5.3 dB (matched on the A/B windows: in the master the Asher line is -14.0 LUFS, the Cosman-1 line -13.3); the music's build (0-42.3s) under the title and pairs, out for the voice beat, its outro (127.6-146.33s) under the CTA so its natural fade lands on the end hold; five whooshes at 30% peaking mid-sweep; two-pass master to -14.0 LUFS, -1.7 dBTP. Awaiting the owner's listen.
- Library: `ctx.deferFrame` (see Footage), with integration tests (including a real VP9 clip seeked from the frame clock, which fails without the barrier).
- The rig (`components/fm/rig.ts`, `rig.css`): window 1440×810 at (240, 48); rail at y 872 (THEN / NOW at 100px, the May-Nov ruler with 7 ticks, a cyan fill and the marker); caption row at y 994, 60px. The sweep is `components/v2/sweep.ts`'s beam over the window, with the marker, fill, labels (cross-fading at the midpoint), the window's amber border and the caption swap on the same 640ms `--ease-sweep`. Pairs entered from a pair rewind the marker NOW → THEN in 300ms. No ambient camera on rig segments: the rig never moves.
- Segments: `fm-title` (headline whole on frame 1 for the thumbnail; the rail already in place; the fill measures 171 days with a counting readout; the claim lights phrase by phrase; then the morph: title out, the rail to rest on THEN, the empty window up), four pairs through `components/fm/pair.ts`, `fm-voice` (the rig with a voice instrument: "Sound on for this one", the line's real waveform from `footage/voice_envelopes.sh` with a playhead, 70px words lit on their STT times, `WARMLY` / `EXCITED` chips), `fm-cta` (the v2 lockup at 70% with its "Build videos in Claude Code" tagline, the six feature chips lit on their words, "FREE & OPEN SOURCE" and the GitHub link typed over "it free on GitHub", amber on "GitHub", then the end hold). Every pair and the voice beat are joined by hard cuts; the CTA enters on `me-sweep`.
- Timing: every cued advance is 9 frames (0.150s) before its word's frame; exits are 0.15s before the next segment's first word, except the narration-sync pair's (41.75s: its Now clip holds 4.05s before the Asher line at 42.60s). The voice beat's words and the CTA's feature chips follow `timing.json` directly (they are captions of the words).
- Departure: the 3D pair's Now clip comes from a render with the beat held longer (see Footage).


### 2026-11-02 — First full render (v1)
- `npx videowright render 2026_11_five_months`: 73.38s, 4,403 frames at 1920×1080/60, audio track v1 muxed (-14.0 LUFS, -1.5 dBTP in the MP4). 23 min on this 4-core, GPU-less box.
- Checked: stills across every beat; the voice beat and CTA fixes are in; the first sweep's beam is ~58% across the window at the whoosh's peak (11.0s), so the sound lands mid-gesture; the dev player plays the clips (no console errors).
- Also from review: the Then title clip starts at 9.35s (its first 0.25s was an almost empty frame), and the shim tests' browser is closed at file level (the deferred-frame block had been running on a closed browser when the whole file ran).
- Waiting on the owner: sign-off on the rig, a listen to the mix.

### 2026-11-02 — Round 2 (the owner's notes on the first render)
- Title: one title only (option A: a huge "5 months" over "of progress in Claude video generation"), the descender clipping fixed (masks have room in px of each line's size). The first pair now builds the rig in.
- Narration: shorter and more general (`voiceover_script/script.md`). New opener ("We generated the same video with Claude, five months apart. The difference is staggering."), new title-card and 3D lines; the product UI and narration-sync lines as before. Captions are the narration's own words.
- Audio: the owner's round-2 one take (v2) passes retime check; the 3D pair's pause after "shape." is 1.4s (so its Then clip holds ~2.9s). The voice beat's takes are new: the correct Asher voice (v1's then_asher_v2 used the wrong library voice) and a calm Cosman-1 line. `audio/assemble.mjs` joins the three takes (70.25s; Asher +1.2 dB); `audio/sync.mjs` writes every advance into `audio/cues.json`; track v2 via `audio/mix.mjs` (-13.9 LUFS, -1.9 dBTP; the voice beat's lines -13.2 / -13.3 LUFS).
- Voice beat: the "Sound on" chip is gone; the waveform and words fill the window.
- CTA: redesigned (logo centre, then up; the features as six line-icon tiles in one gesture instead of word-by-word chips; the link whole, no typing).
- Clips: the title-card Now clip is 5.6s and the narration-sync Now clip 4.4s (their holds grew).


### 2026-11-02 — Round 2 render (v2), and two CTA fixes for the next render
- `npx videowright render 2026_11_five_months`: 70.25s, 4,215 frames, track v2 (-14.0 LUFS, -1.7 dBTP in the MP4). Stills checked across every beat; sent to the owner.
- From that review (not yet rendered): the CTA's logo now glides up on "everything" instead of "open-source", so the whole lockup holds at the centre ~2.7s (it was ~1.1s, mostly the mark alone); the feature tiles are larger for phone viewing (268×256, 120px icons, 38px labels, the row ~1700px wide).
