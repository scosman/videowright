---
status: in_progress
---

# Phase 1: Library code + hello-world template

## Overview

Replace the voiceover-centric data model and CLI surface with audio-track equivalents. This is the foundational code change that all downstream phases depend on. After this phase, the timeline references an `AudioTrack` instead of a `Voiceover`, the CLI uses `--audio-track` instead of `--voiceover`, and the hello-world template ships with the new `audio/` directory layout so `create-videowright` + `render` works out of the box.

## Steps

1. **Add `AudioTrack` type to `types.ts`**
   - Add the `AudioTrack` type with fields: `audio_file`, `length_s`, `timing`, `audio_plan_path?`, `plan_snapshot_path?`, `created_at?`, `notes?`
   - Replace `default_voiceover?: Voiceover` with `default_audio_track?: AudioTrack` on the `Timeline` interface
   - Keep the `Voiceover` type (still used for source VO files)
   - Export `AudioTrack` from `src/index.ts`

2. **Create `timeline/loadAudioTrack.ts`**
   - New file mirroring `loadVoiceover.ts`
   - `loadAudioTrack({ videoFolder, trackId })` resolves `<videoFolder>/audio/tracks/<trackId>/track.ts`
   - Returns `{ audioTrack, trackFolder, audioFilePath }` with `audio_file` rewritten to absolute path
   - Throws `UserError` for missing track.ts, invalid module shape, missing audio file

3. **Update `timeline/loadVoiceover.ts` path**
   - Change voiceover lookup from `voiceovers/<slug>/voiceover.ts` to `audio/originals/voiceovers/<slug>/voiceover.ts`
   - Update error messages accordingly

4. **Update `timeline/resolveTiming.ts`**
   - Rename `voiceover` field to `audioTrack` in `ResolvedTiming`
   - Change source discriminator from `"voiceover"` to `"audio_track"`
   - Rename args: `defaultVoiceover` -> `defaultAudioTrack`, `cliVoiceoverSlug` -> `cliAudioTrackId`, `cliVoiceoverModule` -> `cliAudioTrackModule`
   - Update interface types from `Voiceover` to `AudioTrack`

5. **Update `cli/render.ts`**
   - Replace voiceover loading with audio-track loading
   - Use `loadAudioTrack` for CLI `--audio-track <id>` 
   - Use `timeline.default_audio_track` for the default path
   - Update `resolveTiming` call to use new arg names
   - Update `RenderOptions` type: `voiceover?` -> `audioTrack?`
   - Update validation to use `AudioTrack` instead of `Voiceover`

6. **Update `cli/argv.ts`**
   - Rename `--voiceover` flag to `--audio-track`
   - Rename `VOICEOVER_COMMANDS` to `AUDIO_TRACK_COMMANDS`
   - Update error messages
   - Update `ParsedArgs.flags`: rename `voiceover` to `audioTrack`

7. **Update `cli/vite_helpers.ts`**
   - Rename `voiceoverNone` to `audioTrackNone` in `VwGlobals` interface and the virtual module output

8. **Update `src/virtual-modules.d.ts` and `src/cli/entry/virtual.d.ts`**
   - Rename `voiceoverNone` to `audioTrackNone`

9. **Update `cli/script_cmd.ts`**
   - Change output directory from `voiceover/` to `voiceover_script/`

10. **Update `cli/index.ts`**
    - Update help text to reference `--audio-track` instead of `--voiceover`
    - Update render call to pass `audioTrack` instead of `voiceover`

11. **Update `timeline/validateTiming.ts`**
    - Rename `validateVoiceover` to `validateAudioTrack` (or adapt validation for AudioTrack shape)
    - Update to work with `AudioTrack` type instead of `Voiceover`

12. **Restructure `skill/assets/hello_world/`**
    - Rename `voiceover/` to `voiceover_script/`
    - Create `audio/tracks/v1/track.ts` with timing from the hello-world segments
    - Update `timeline.ts` to use `default_audio_track` instead of `default_voiceover`

13. **Update `skill_files.test.ts`**
    - Update assertions for hello_world directory structure (voiceover_script instead of voiceover)

14. **Update `test/unit/loadVoiceover.test.ts`**
    - Update fixture paths from `voiceovers/<slug>/` to `audio/originals/voiceovers/<slug>/`

15. **Create `test/unit/loadAudioTrack.test.ts`**
    - Happy path: loads valid track.ts, returns absolute paths
    - Missing track.ts -> UserError
    - Invalid module shape -> UserError
    - Missing audio file -> UserError

16. **Update `test/unit/resolveTiming.test.ts`**
    - Replace Voiceover fixtures with AudioTrack fixtures
    - Update field names (voiceover -> audioTrack, source discriminator)

17. **Update `test/unit/cli_voiceover_argv.test.ts`**
    - Rename to reflect --audio-track flag
    - Update all assertions from --voiceover to --audio-track

18. **Update `test/integration/render_audio.test.ts`**
    - Update fixture to use audio-track structure (audio/tracks/vN/ and audio/originals/voiceovers/)
    - Update runRender calls from `voiceover: "slug"` to `audioTrack: "slug"`

19. **Update `test/integration/cli_script.test.ts`**
    - Update expected output path from `voiceover/script.md` to `voiceover_script/script.md`

## Tests

- `loadAudioTrack.test.ts`: happy path loads and resolves paths, missing track.ts throws UserError, invalid module shape throws UserError, missing audio file throws UserError
- `loadVoiceover.test.ts` (updated): paths now reference `audio/originals/voiceovers/`
- `resolveTiming.test.ts` (updated): all precedence tests use AudioTrack, source discriminator is `"audio_track"`
- `cli_voiceover_argv.test.ts` (updated): `--audio-track` flag accepted on render, rejected on dev/script
- `render_audio.test.ts` (updated): integration test renders with audio track structure
- `cli_script.test.ts` (updated): script --write creates `voiceover_script/script.md`
- `skill_files.test.ts` (updated): hello_world structure assertions updated
