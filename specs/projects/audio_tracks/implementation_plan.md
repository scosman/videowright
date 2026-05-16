---
status: complete
---

# Implementation Plan: Audio Tracks

Phases ordered so the library code lands first (everything downstream depends on it), the core mixing skill is in place before any real-world use, and the `/examples` migration validates the full chain end-to-end before SFX/music sourcing piles on.

## Phases

- [x] **Phase 1 — Library code + hello-world template.** `AudioTrack` type, `loadAudioTrack`, `loadVoiceover` path update, `resolveTiming` swap to audio-track shape, `render.ts` audio-track loading, `--audio-track` CLI flag (replaces `--voiceover`), `vite_helpers` rename, `script_cmd` writes to `voiceover_script/`. Updated unit + integration tests. Restructure `skill/assets/hello_world/` to the new `audio/` layout with a pre-built VO-only `tracks/v1/` so `create-videowright` → `render` works out of the box.

- [ ] **Phase 2 — Skill tree restructure.** Move existing `references/voiceover.md` + `references/voiceover/*` under `references/audio/voiceover/`. Create new top-level `references/audio.md` entry that asks the VO/SFX/music triage questions and routes to sub-references. Update `SKILL.md` to point at `audio.md` instead of `voiceover.md`. No new content yet — purely structural so later phases drop into a coherent tree.

- [ ] **Phase 3 — Audio plan + build + sync skill.** Write `audio/audio_plan.md` (format spec), `audio/cue_template.md` (per-cue template), `audio/ffmpeg_cookbook.md` (recipes), `audio/styles.md` (editing style guidance), `audio/build.md` (mux → snapshot → `track.ts` → approve → update timeline import), `audio/sync.md` (compute per-segment advances from snapshot + `timing.json`). After this phase, the agent can author a VO-only audio plan, build a track, sync it, and have render consume it.

- [ ] **Phase 4 — Migrate `/examples/videowright_demo/` + end-to-end validation.** Apply the migration steps (rename `voiceover/`, move `voiceovers/`, draft minimal `audio_plan.md`, build `tracks/v1/`, update `timeline.ts`) to all three demo videos. Render each and verify output matches the pre-migration audio. This phase exercises Phases 1–3 against real projects.

- [ ] **Phase 5 — SFX + music sourcing skills.** Write `audio/sfx/sfx.md`, `audio/sfx/providers/{elevenlabs,manual}.md`, `audio/music/music.md`, `audio/music/providers/{elevenlabs,manual}.md`. Each covers BYO and ElevenLabs paths, asset metadata authoring, the `Approve / Discard and request changes` approval UX, and `generate.sh` template. Extend the hello-world template with a sample SFX or music asset if useful for onboarding (optional, decide during the phase).
