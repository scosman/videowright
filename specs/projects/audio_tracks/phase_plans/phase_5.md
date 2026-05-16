---
status: complete
---

# Phase 5: SFX + Music Sourcing Skills

## Overview

Write the SFX and music sourcing skill references that teach the agent how to source, approve, and manage sound effects and music assets -- both via ElevenLabs APIs and BYO (bring your own). This completes the audio skill tree by filling in the previously-placeholder SFX and music sections. Also update the top-level `audio.md` to route to these new references instead of showing "later phase" placeholders.

## Steps

1. **Create `references/audio/sfx/sfx.md`** -- Top-level SFX sourcing reference. Covers:
   - When this is loaded (routed from audio.md when user wants SFX)
   - BYO vs ElevenLabs decision prompt
   - `sfx.ts` metadata shape and authoring guidance
   - Slug naming conventions for SFX folders
   - The per-asset Approve / Discard and request changes UX (clickable file:// link, exactly two options, delete-on-discard, iterate until approved)
   - How approved SFX integrates into the audio plan (reference to cue_template.md)

2. **Create `references/audio/sfx/providers/elevenlabs.md`** -- ElevenLabs SFX API reference. Covers:
   - API endpoint (text-to-SFX / sound generation)
   - Request shape and authentication (`ELEVENLABS_API_KEY`)
   - Prompt-writing tips for good SFX generation
   - `generate.sh` template for reproducibility
   - Post-generation: measure duration via ffprobe, write `sfx.ts`, trigger approval UX

3. **Create `references/audio/sfx/providers/manual.md`** -- BYO SFX reference. Covers:
   - User drops file into `audio/originals/sfx/<slug>/`
   - Agent prompts for metadata (name, description, notes)
   - Measure length_s via ffprobe
   - Write `sfx.ts`
   - Trigger approval UX

4. **Create `references/audio/music/music.md`** -- Top-level music sourcing reference. Covers:
   - When this is loaded (routed from audio.md when user wants music)
   - BYO vs ElevenLabs decision prompt
   - `music.ts` metadata shape and authoring guidance (rich free-text notes for BPM/key/mood/structure)
   - Slug naming conventions for music folders
   - The per-asset Approve / Discard and request changes UX
   - How approved music integrates into the audio plan

5. **Create `references/audio/music/providers/elevenlabs.md`** -- ElevenLabs Music API reference. Covers:
   - API endpoint (music generation)
   - Request shape and authentication
   - Prompt-writing tips for good music generation
   - `generate.sh` template for reproducibility
   - Post-generation: measure duration via ffprobe, write `music.ts`, trigger approval UX

6. **Create `references/audio/music/providers/manual.md`** -- BYO music reference. Covers:
   - User drops file into `audio/originals/music/<slug>/`
   - Agent prompts for metadata (name, description, notes -- encourage rich musical detail)
   - Measure length_s via ffprobe
   - Write `music.ts`
   - Trigger approval UX

7. **Update `references/audio.md`** -- Replace the "later phase" placeholder text for SFX and Music sections with actual routing to the new reference files. Keep the same progressive-disclosure pattern: ask BYO vs ElevenLabs, then load the appropriate provider sub-reference.

8. **Decision: hello-world template** -- The hello-world template is intentionally minimal (no audio sources, placeholder silent track). Adding a sample SFX or music asset would add complexity without helping onboarding (new users should run the audio skill to source assets, not have pre-baked ones). Skip extending hello-world.

## Tests

- No automated tests for skill markdown files (they are documentation, not executable code)
- Verify all internal markdown links resolve by checking relative paths
- Run `npm run typecheck` and `npm run lint` to confirm no TS/lint regressions
- Run `npm test` to confirm existing tests still pass
