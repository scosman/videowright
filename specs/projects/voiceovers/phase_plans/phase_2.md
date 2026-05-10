---
status: draft
---

# Phase 2: Core types and `render` audio

## Overview

Add the `Timing` and `Voiceover` types to the type system, extend `Timeline` with `default_timing` / `default_voiceover`, implement `resolveTiming`, `validateTiming`, and `loadVoiceover` helpers in `packages/lib/src/timeline/`, modify ffmpeg to accept an optional audio file for single-pass muxing, add `--voiceover` flag to the CLI, and wire `render` to produce mp4s with muxed audio. At the end of this phase, `render --voiceover <slug>` produces an mp4 with voiceover audio.

## Steps

1. **Add `Timing` and `Voiceover` types to `packages/lib/src/types.ts`**
   - Add `Timing` type: `{ perSegment: Partial<Record<string, number[]>> }`
   - Add `Voiceover` type: `{ audio_file: string; provider: "elevenlabs" | "manual"; provider_timing_file?: string; timing: Timing; notes?: string }`
   - Extend `Timeline` interface with optional `default_timing?: Timing` and `default_voiceover?: Voiceover`
   - Export new types from `packages/lib/src/index.ts`

2. **Create `packages/lib/src/timeline/resolveTiming.ts`**
   - Export `ResolvedTiming` type: `{ source: "voiceover" | "default_timing" | "segments"; voiceover?: Voiceover; perSegment: Record<string, number[]> }`
   - Export `resolveTiming(args)` function implementing the four-level precedence:
     1. `cliVoiceoverModule` if provided and slug !== "none"
     2. `defaultVoiceover` if slug !== "none"
     3. `defaultTiming`
     4. Segment-level `advances`
   - Partial Timing overlays on top of segment advances (missing segments fall back)

3. **Create `packages/lib/src/timeline/validateTiming.ts`**
   - Export `ValidationResult` type: `{ ok: true } | { ok: false; errors: string[]; warnings: string[] }`
   - Export `validateTiming(timing, segmentIds)` function:
     - Warn on unknown segment ids in `timing.perSegment`
     - Error on non-array, non-positive, or non-finite values
   - Export `validateVoiceover(voiceover, voiceoverFolder)` function:
     - Error if `audio_file` does not exist on disk
     - Warn if `provider_timing_file` is set but does not exist

4. **Create `packages/lib/src/timeline/loadVoiceover.ts`**
   - Export `loadVoiceover(args: { videoFolder, slug })` function
   - Resolves `<videoFolder>/voiceovers/<slug>/voiceover.ts` via `loadModule`
   - Resolves `audio_file` and `provider_timing_file` relative to the voiceover folder
   - Returns `{ voiceover, voiceoverFolder, audioFilePath }`
   - Throws UserError on missing files

5. **Re-export new helpers from `packages/lib/src/timeline/index.ts`**
   - Re-export `resolveTiming`, `ResolvedTiming` from `./resolveTiming.js`
   - Re-export `validateTiming`, `validateVoiceover` from `./validateTiming.js`
   - Re-export `loadVoiceover` from `./loadVoiceover.js`

6. **Modify `packages/lib/src/cli/ffmpeg.ts` to support audio input**
   - Add `buildFfmpegArgs(opts)` function that returns the ffmpeg argument array
   - When `audioFilePath` is provided, add second `-i`, audio codec flags, stream mapping, and `-shortest`
   - When not provided, produce the existing video-only argument array

7. **Add `--voiceover` flag to CLI argv parser (`packages/lib/src/cli/argv.ts`)**
   - Add `voiceover` option to `parseArgs` (type: "string")
   - Add `voiceover?: string` to `ParsedArgs.flags`
   - Allow `--voiceover` on `render` and `record` commands only (reject on dev/script)

8. **Wire `render.ts` to use voiceover**
   - Add optional `voiceover?: string` to `RenderOptions`
   - After loading timeline, resolve voiceover via `loadVoiceover` if slug provided
   - Call `validateTiming` on the resolved timing
   - Use `resolveTiming` to build the final per-segment schedule (replacing the current raw advancesMap approach)
   - Pass `audioFilePath` to ffmpeg args builder
   - Update `index.ts` to pass `flags.voiceover` to render options

9. **Update help text in `packages/lib/src/cli/index.ts`**
   - Add `--voiceover <slug>` to help text options

## Tests

- `resolveTiming.test.ts`: all four precedence levels, partial Timing fallback, "none" semantics, segments-only fallback, voiceover overrides default_timing
- `validateTiming.test.ts`: unknown segment id warning, malformed values error, valid timing passes, voiceover with missing audio file errors, voiceover with missing provider_timing warns
- `loadVoiceover.test.ts`: happy path loads module and resolves paths, missing voiceover.ts throws, missing audio file throws
- `cli_voiceover_argv.test.ts`: `--voiceover slug` parses for render, `--voiceover none` parses for render, `--voiceover` on record parses, `--voiceover` on dev throws, no flag leaves undefined
- `render_audio.test.ts` (integration): fixture timeline + fixture mp3 -> render -> ffprobe confirms audio stream present in output mp4
