---
status: complete
---

# Audio Tracks

## What we're building

Extend videowright's audio capabilities beyond voice-over. Today the only audio in a video is a single voice-over file; this project introduces the concept of a full **audio track** — a single muxed audio file produced by combining multiple original audio sources (voice-over, sound effects, background music) with per-source timing, volume control, fades, and ducking.

A video's timeline points at an audio track (not a voice-over), and the existing "sync video to audio" step is upgraded to align video clips to *everything* in the track — not just spoken words.

## Why

- **Production value**: Real videos use SFX and music. Without them, the videos feel flat.
- **Stylistic control**: Editors (human or agent) need to express things like "music dips when voice-over starts", "keyboard typing sfx fades out when the demo ends", "punchy SFX on a beat drop".
- **Iterability**: Audio is something users will give subjective feedback on ("a bit quieter", "start 0.25s later"). The system needs to make precise, targeted changes without re-doing everything.

## Who it's for

The same audience as the rest of videowright: an agent driving video production with a human-in-the-loop providing creative direction.

## Core concepts being introduced

### 1. New `audio/` directory structure inside each video

Replaces today's flat `voiceovers/` and `voiceover/` folders. Rough shape:

```
audio/
  originals/        # source files we download/import. Never edited.
    voiceovers/     # (moved from root /voiceovers)
    sfx/            # one subfolder per sound effect, each with metadata + audio file
    music/          # one subfolder per music track, each with metadata + audio file
  tracks/           # muxed audio tracks we produce with ffmpeg
    v1/
      track.mp3
      metadata.ts          # path, length, link to audio_plan that generated it
      plan_snapshot.md     # point-in-time copy of the audio plan (minus log)
    v2/ ...
```

Open questions to resolve in the functional spec:
- Should the existing root `voiceover/` folder (script-only) be renamed to `voiceover_script/` for clarity? (Suspected yes.)
- Should `music` be its own folder under `originals/` or live alongside `sfx`? (Leaning: its own folder — different lifecycle, different metadata, different API.)
- Naming alignment with audio/video editing conventions to be reviewed (e.g. "tracks" vs "mixes", "originals" vs "assets" or "stems").

### 2. Sound effects (SFX) and music as first-class assets

Each sfx/music asset lives in its own subfolder with:
- The audio file (mp3/wav)
- Metadata: name, description, length, and subjective annotations ("beat drops at 5.3s", "uplifting piano build")

Two sourcing paths, mirroring how voice-overs work today:
- Drop in mp3s via the portal/web UI
- Agent fetches via ElevenLabs APIs (which has agent-optimized SFX + music endpoints)

### 3. The Audio Plan

A new artifact per video — modeled after `PLAN.md`:

- **Top section**: current plan, in plaintext (not JSON/YAML). Prose first ("music starts at 50% but dips to 15% when VO starts"), then the exact ffmpeg command(s) underneath. Plaintext keeps the agent free to use the full expressiveness of ffmpeg; the ffmpeg command underneath makes subjective feedback ("a bit quieter at 12s") precisely actionable.
- **Log section**: append-only edit history with timestamps. Each entry records the user's intent, what changed, the ffmpeg command that was run, the output track path, and whether it became the new default.

The plan must capture: links to original files, timing info, volumes, fades, ducking behavior — clearly enough that a skill example can teach an agent to produce one well.

### 4. Audio tracks (muxed output)

Each entry under `audio/tracks/vN/` represents one rendered audio file:
- The audio file itself
- A typescript metadata file (path, link to audio plan, length, etc.)
- A snapshot of the plan (without the log) used to generate it — this is what the "sync video to audio" step reads. Snapshots point at original-file timings (VO word timings, SFX metadata) rather than copying them, since originals are immutable.

### 5. New "audio build" pipeline stage

A new stage in the production flow:
- Build the audio file from originals + plan
- Get user sign-off, or take feedback and iterate until approved

### 6. Voice-over re-timing (advanced)

The plan should be able to shift a VO clip in time — e.g. "'that's why we built ASDF' is at 6.2s–8.1s in the original VO clip, but place it at 7.4s in the final video track." This is important because once SFX and music are involved, perfect VO timing depends on the whole mix, not just the spoken script.

### 7. Updated "sync video to audio" skill

Currently this skill uses VO word-by-word timing only. It now needs to consume the full audio plan: VO timing, SFX placements, music swells/fades — so visuals can land on the audio beats.

### 8. Timeline points at an audio track, not a voice-over

`timeline.ts` updated to reference an audio track. No backward compatibility — we're pre-v1.

### 9. Skill updates

The producing skill needs significant updates:
- Ask the user about audio holistically (SFX? Music?), not just voice-over
- Encode style guidance for good audio editing: appropriate SFX volume during speech, music ramping, music level during speech vs. silence
- Encode how-to knowledge: ffmpeg examples for each common effect (ducking, fading, crossfading, looping music to length, etc.)
- Encode how to fetch SFX and music from ElevenLabs APIs
- Use nested reference files for progressive disclosure: don't load "how to fetch SFX from ElevenLabs" into context if the user doesn't want SFX or is using the portal. Ordering of questions and conditional loading matters.

## Non-goals / scope notes

- **No backward compatibility shims.** Pre-v1; we'll update the existing voiceovers project structure in place.
- **One-off migration guide.** A short, non-committed agent-runnable guide to upgrade the user's single existing project. Not a consumer skill.

## Open critique / refinement (to resolve during functional spec)

The user explicitly asked for pushback on this rough plan. Items to revisit:

- **Naming**: "tracks", "originals", "audio plan" — sanity-check against standard audio/video editing terminology (e.g. "stems", "mix", "session", "bus", "ducking").
- **`music` location**: own folder vs. nested under `sfx/`.
- **`voiceover/` → `voiceover_script/` rename**: confirm the root folder is script-only.
- **Plan format**: is the prose + ffmpeg approach actually the right level? Risks: drift between prose and ffmpeg, hard for non-ffmpeg-fluent humans to read. Possible mitigation: a short "human summary" header even above the prose.
- **Track snapshot vs. log replay**: should each `tracks/vN/` keep a snapshot, or could we reconstruct it from the log? Snapshots are simpler; logs are more compact. Lean snapshot.
- **Voice-over re-timing**: does this belong in the audio plan, or as a pre-processing step that produces a new "original" VO clip with shifted timings? Affects how snapshot/sync-to-audio consume it.
