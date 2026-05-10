# Style Intake

## When this is loaded

You are preparing to generate a voiceover and need to understand the user's tone and pacing preferences before creating the provider script.

## Purpose

Style intake captures preferences that the agent **directly uses** when writing the provider script. It does NOT ask about attributes the user controls independently in the ElevenLabs portal or API (voice gender, accent, age, BPM, etc.) -- those are chosen by the user during voice selection, and the agent has no lever on them.

## Questions to ask

Ask these questions before generating the provider script. Group them into a single message -- do not ask one at a time. Skip any question whose answer is already clear from the user's input.

1. **Tone.** What overall tone should the narration have?
   - Examples: conversational, professional, enthusiastic, calm, authoritative, playful, serious, warm
   - If the user is unsure, default to "conversational and warm" -- it works for most explainer videos.

2. **Emotional arc.** Should the tone shift across the video? For example:
   - Start serious, build to excited
   - Maintain a steady calm throughout
   - Start warm, shift to urgent for the call to action
   - If the user has no preference, a steady tone is fine.

3. **Reference** (optional). Is there a narrator or video style they want to emulate?
   - "Like a TED talk", "like a product launch keynote", "like a podcast host"

## How answers map to provider script

The agent targets ElevenLabs v2, which does not have v3-style emotion tags (`[excited]`, `[calm]`, etc.). Instead, tone is conveyed through punctuation, sentence structure, and pacing cues:

| Preference | Provider script effect |
|---|---|
| Tone: enthusiastic | Exclamation marks, short punchy sentences, emphatic word choice |
| Tone: calm/serious | Longer sentences, measured pacing, more pauses between phrases |
| Tone: warm | Natural conversational phrasing -- the default for most v2 voices |
| Emotional arc | Vary sentence structure and punctuation across sections of the script |

See [provider_script.md](provider_script.md) for the full v2 writing toolkit.

## What NOT to ask

The following are controlled by the user in the ElevenLabs portal or API, not by the provider script. Do not ask about them during style intake:

- **Voice gender** -- the user picks a voice directly.
- **Accent or language** -- the user picks a voice with the desired accent.
- **Age / warmth / breathiness** -- ElevenLabs voice characteristics, not script attributes.
- **BPM / speaking rate** -- set via the speed slider in the portal or the `speed` parameter in the API, not via the script text.

If the user volunteers any of these, acknowledge the preference and remind them to apply it when selecting a voice or adjusting settings.

## When to skip style intake

- The user has explicitly described the voice style they want in their initial request.
- The user is iterating on an existing voiceover and the style is already established.
- The user is using the manual flow (Flow B) -- they already have the audio.

In these cases, proceed directly to the next step without asking style questions.
