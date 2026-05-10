---
status: complete
---

# Phase 4: Skill content

## Overview

Rewrite the existing voiceover skill reference (currently outdated -- it says audio playback is not implemented) and add structured sub-references that enable an agent to drive both the AI-generated and manual voiceover flows end-to-end without code changes. Also update SKILL.md with voiceover capability awareness, the types reference with Timing/Voiceover, the export reference with `--voiceover` usage, and the project structure reference with the voiceovers folder convention.

## Steps

1. **Rewrite `packages/lib/skill/references/voiceover.md`**
   - Remove the "audio playback is not implemented" disclaimer and all references to it.
   - Document the two voiceover flows (AI-generated via ElevenLabs, manual with user-provided audio).
   - Document file/folder conventions (`voiceovers/<slug>/voiceover.ts`, audio file, provider_timing.json, provider_script.md).
   - Document the `Voiceover` and `Timing` types at a conceptual level.
   - Document CLI usage (`--voiceover <slug>`, `--voiceover none`, default_voiceover).
   - Document dev/record/render audio behavior.
   - Add a flow entry point section routing to the correct sub-reference.
   - Keep the existing `voiceover` field on segments section (HUD hint, `videowright script` CLI).
   - Keep the VO-first authoring section.

2. **Create `packages/lib/skill/references/voiceover/style_intake.md`**
   - Questions to ask the user about voice, tone, pace, gender, emotion before generating a provider script.
   - How answers map to ElevenLabs v3 tags and voice selection guidance.

3. **Create `packages/lib/skill/references/voiceover/script_writing.md`**
   - How to write a per-segment script in PLAN.md.
   - How to integrate a user-provided script into PLAN.md (chunking by segment).
   - Sanity checks: spelling/grammar, script-video alignment.
   - Pacing guidance (~150 WPM).

4. **Create `packages/lib/skill/references/voiceover/provider_script.md`**
   - How to transform the PLAN.md script into `provider_script.md` for a specific provider.
   - ElevenLabs v3 tag conventions (audio tags, pauses, emphasis).
   - When and how to add pauses for animation timing.

5. **Create `packages/lib/skill/references/voiceover/sync_algorithm.md`**
   - Agent reasoning steps for converting provider word-timing JSON into a `Timing` object.
   - How to parse ElevenLabs TTS and STT timing JSON schemas.
   - Walking per-segment script and finding end timestamps.
   - Multi-advance segments: finding content cues for beat placement.
   - Presenting the proposed Timing to the user with annotations.
   - Iteration based on user feedback.

6. **Create `packages/lib/skill/references/voiceover/animation_sync.md`**
   - One-time pass over segment code when a voiceover is set as default.
   - How to identify fully automated animations (CSS transitions, GSAP, hold() durations).
   - How to adjust durations to align with audio beats.
   - Tradeoffs: sync is to the default voiceover only.

7. **Create `packages/lib/skill/references/voiceover/providers/elevenlabs.md`**
   - ElevenLabs v3 TTS: tag conventions, pause mechanisms, portal walkthrough for generating audio.
   - Expected output files: audio (mp3/wav) and per-word timing JSON.
   - ElevenLabs Speech-to-Text: portal walkthrough, expected output JSON schema.
   - Both flows use the same timing JSON format for downstream sync.

8. **Create `packages/lib/skill/references/voiceover/providers/manual.md`**
   - Manual flow: user provides their own audio file.
   - Using ElevenLabs STT to generate transcript and timing.
   - Expected output formats and where to place files.

9. **Update `packages/lib/skill/SKILL.md`**
   - Add voiceover as a supported intent in the dispatch table with a routing description.
   - Update the "When to trigger" list to include voiceover-related triggers.
   - Add voiceover to core principles (voiceover-first authoring).

10. **Update `packages/lib/skill/references/types.md`**
    - Add `Timing` and `Voiceover` type documentation.
    - Update `Timeline` type to show `default_timing` and `default_voiceover` fields.

11. **Update `packages/lib/skill/references/export.md`**
    - Document `--voiceover <slug>` and `--voiceover none` flags on `render`.
    - Remove "audio is not currently included" and "planned for a future update" disclaimers.
    - Document `record` voiceover support.

12. **Update `packages/lib/skill/references/dev_server.md`**
    - Document play button behavior and audio playback in dev mode.
    - Document default_voiceover integration.

13. **Update `packages/lib/skill/references/project_structure.md`**
    - Add `voiceovers/` folder to the consumer repo layout diagram.
    - Document voiceover file ownership rules.

14. **Update `packages/lib/skill/references/new_video.md`**
    - Remove the "audio playback is not implemented" disclosure.
    - Update audio intent section to reflect working voiceover support.

15. **Update `packages/lib/skill/references/create_or_edit_video.md`**
    - Update voiceover references to point to the rewritten voiceover.md.
    - Add voiceover flow integration notes.

## Tests

- NA: This phase is skill markdown content only. No automated tests. Verified by lint/format checks on the markdown files.
