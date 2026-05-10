# Style Intake

## When this is loaded

You are preparing to generate a voiceover and need to understand the user's voice and tone preferences before creating the provider script.

## Purpose

Style intake captures the user's preferences for the voiceover's delivery. The answers inform two things:

1. **Voice selection guidance** -- what to tell the user when they pick a voice in the ElevenLabs portal.
2. **Provider script annotations** -- which audio tags and delivery directions to include in `provider_script.md`.

## Questions to ask

Ask these questions before generating the provider script. Group them into a single round -- do not ask one at a time. Skip any question whose answer is already clear from the user's input.

### Required

1. **Tone.** What overall tone should the narration have?
   - Examples: conversational, professional, enthusiastic, calm, authoritative, playful, serious, warm
   - If the user is unsure, default to "conversational and warm" -- it works for most explainer videos.

2. **Pace.** How fast should the narration feel?
   - Options: slow and deliberate, moderate, brisk and energetic
   - Default: moderate (~150 WPM). Slow works for technical content; brisk works for marketing.

### Optional (ask only if relevant)

3. **Gender preference.** Does the user have a preference for the voice's gender?
   - This affects which voice they select in the ElevenLabs portal. Videowright does not store voice IDs.

4. **Accent or language notes.** Any preference for accent (American, British, Australian) or pronunciation notes for technical terms?

5. **Emotional arc.** Should the tone shift across the video? For example:
   - Start serious, build to excited
   - Maintain a steady calm throughout
   - Start warm, shift to urgent for the call to action

6. **Reference.** Is there a narrator or video style they want to emulate?
   - "Like a TED talk", "like a product launch keynote", "like a podcast host"

## How answers map to provider script

| Preference | Provider script effect |
|---|---|
| Tone: enthusiastic | Add `[excited]` tags around high-energy sections |
| Tone: calm/serious | Add `[serious]` or `[calm]` tags where appropriate |
| Tone: warm | Default delivery -- no special tags needed in most cases |
| Pace: slow | Add more pauses (ellipses, em-dashes) between sentences |
| Pace: brisk | Fewer pauses, shorter sentences |
| Emotional arc | Apply different tags to different sections of the script |
| Accent | Note in the portal voice selection guidance, not in the script |

## Voice selection guidance

After style intake, provide the user with voice selection advice for the ElevenLabs portal:

> When you open the ElevenLabs portal to generate audio, select a voice that matches: **[tone summary]**. Look for voices tagged as [relevant descriptors]. You can preview voices in the portal before generating.

Do not store voice IDs or settings in `voiceover.ts` -- the user makes this choice in the portal each time.

## When to skip style intake

- The user has explicitly described the voice style they want in their initial request.
- The user is iterating on an existing voiceover and the style is already established.
- The user is using the manual flow (Flow B) -- they already have the audio.

In these cases, proceed directly to the next step without asking style questions.
