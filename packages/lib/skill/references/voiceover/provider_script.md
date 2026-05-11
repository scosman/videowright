# Provider Script

## When this is loaded

You have a confirmed script in PLAN.md and need to transform it into a provider-specific format for TTS generation.

## What `provider_script.md` is

The `provider_script.md` file is a transformation of the PLAN.md script with provider-specific annotations. It is the text that the user copies into the TTS portal (or the agent sends via API) to generate audio. It lives at:

```
videos/<video>/voiceovers/<slug>/provider_script.md
```

The file is markdown for human readability, but its content is the exact text to paste into the provider. Segment headings are stripped -- only the narration text and annotations are included.

## Target: ElevenLabs v2

All provider scripts target **ElevenLabs v2** (`eleven_multilingual_v2`). This model is chosen because it supports exact pause timing via SSML `<break>` tags, which is critical for syncing audio to video animations.

**Do NOT use v3-style tags.** ElevenLabs v3 introduced inline emotion tags like `[excited]`, `[calm]`, `[whispering]`, etc. These tags are **silently ignored** by the v2 model. Never include them in a provider script.

## Generating the provider script

### Step 1: Read the confirmed script from PLAN.md

Extract the script sections in timeline order.

### Step 2: Apply delivery style through writing

Since v2 does not have v3's emotion tag system, tone and emotion are conveyed through **how the text is written** -- punctuation, sentence structure, and word choice. The v2 model's prosody engine responds to natural language cues:

#### The v2 writing toolkit

| Technique | Effect on v2 delivery | Example |
|---|---|---|
| **Exclamation marks** | Increased energy, slight pitch rise | "This changes everything!" |
| **Question marks** | Rising intonation | "Ready to get started?" |
| **Ellipsis** (`...`) | Natural micro-pause (~0.3-0.5s), trailing-off feel | "And then... something unexpected." |
| **Em-dash** (`--`) | Brief breath pause (~0.2-0.4s), interruption feel | "The result -- stunning." |
| **ALL CAPS** | Slight emphasis on the word (use sparingly) | "This is EXACTLY what we needed." |
| **Short punchy sentences** | Energetic, urgent pacing | "It's fast. It's reliable. It just works." |
| **Long flowing sentences** | Calm, measured delivery | "Over the course of the next few minutes, we'll walk through each of the core features that make this possible." |
| **Commas and semicolons** | Micro-pacing within a sentence | "First, the dashboard; then, the analytics." |
| **Repeated punctuation** | Heightened emotion (use very sparingly) | "This is incredible!!" |
| **Parenthetical asides** | Softer, conspiratorial tone | "The best part (and this surprised us too) is the speed." |

#### What v2 cannot do

- **No explicit emotion control.** You cannot tag a section as `[excited]` or `[whispering]`. The closest approximation is through writing style (see toolkit above).
- **No voice speed control via script text.** Speaking rate is controlled by the speed slider in the portal or the `speed` parameter in the API, not by script content.
- **No pitch control.** v2 does not support pitch-shifting tags.

This is a deliberate trade-off: v2 gives us **deterministic pause timing** via `<break>` tags at the cost of explicit emotion tags. For voiceover-to-video sync, predictable timing is more valuable than fine-grained emotion control.

### Step 3: Add pauses

Where the PLAN.md script has `[pause for animation]` markers, insert pause mechanisms appropriate to the desired duration:

#### Pause reference (v2)

| Pause type | Syntax | Duration | Use for |
|---|---|---|---|
| Natural micro-pause | `...` (ellipsis) | ~0.3-0.5s | Trailing off, rhetorical beat |
| Breath pause | `--` (em-dash) | ~0.2-0.4s | Parenthetical, interruption |
| Sentence break | Period + new sentence | ~0.5-0.8s | Normal sentence transition |
| Medium pause | `<break time="1.0s" />` | Exact (1.0s) | Animation beat between ideas |
| Long pause | `<break time="2.5s" />` | Exact (2.5s) | Major visual transition |
| Very long pause | `<break time="4.0s" />` | Exact (up to ~5s) | Extended animation sequence |

**The `<break>` SSML tag is the primary mechanism for precise pauses.** It is supported by v2 and produces exact, deterministic timing. Use it for any pause of 1 second or more where the video needs time for a visual transition.

Syntax: `<break time="X.Xs" />` where `X.X` is seconds (e.g., `"1.5s"`, `"0.8s"`, `"3.0s"`).

For pauses under 0.5 seconds, ellipses and em-dashes often sound more natural than a `<break>` tag. For pauses over 0.5 seconds, use `<break>`.

### Step 4: Handle segment boundaries

The provider script is one continuous block of text (not divided by segment). Segment boundaries from PLAN.md become natural pause points in the provider script. Insert a `<break>` tag at each segment transition to give the audio natural breathing room:

```
...set us apart.

<break time="1.0s" />

First up: real-time collaboration.
```

The duration of segment-boundary breaks depends on the video's pacing. A good default is 1.0-1.5 seconds.

### Step 5: Pronunciation and special terms

v2 handles pronunciation through these mechanisms:

- **Spell out letters:** "A P I" (with spaces) for letter-by-letter pronunciation.
- **Phonetic hint:** For unusual names, spell them phonetically nearby: "Istio (is-tee-oh)" or just "is-tee-oh" if the correct name is not needed in audio.
- **URLs:** Write as speech: "acme dot com" instead of "acme.com".
- **Numbers:** "one hundred twenty three" instead of "123" if the TTS reads it oddly. Test first -- ElevenLabs v2 generally handles numbers well.

v2 does NOT support IPA phoneme tags or SSML `<phoneme>` elements. Use inline phonetic spelling as the workaround.

## Output format

Write the provider script as a single markdown file:

```markdown
# Provider Script

> Provider: ElevenLabs v2 (eleven_multilingual_v2)
> Voice: [voice name and ID from selection, e.g. "Asher (tMvyQtpCVQ0DkixuYm6J)"]
> Style notes: Conversational, warm

---

Welcome to Acme Product. Today we'll walk through the three features that set us apart.

<break time="1.2s" />

First up: real-time collaboration! Your team can edit simultaneously, with changes syncing instantly across devices.

<break time="2.0s" />

Next, the analytics dashboard. Track engagement, conversion, and retention -- in one view.

<break time="2.0s" />

Finally, integrations. Connect with the tools you already use... Slack, GitHub, Jira, and more.

<break time="1.0s" />

Ready to get started? Visit acme dot com for a free trial. Thanks for watching.
```

### Key conventions in the output

- The header block (blockquote) is metadata for the user, not pasted into the portal or sent to the API.
- Everything below the `---` is the text to paste or send.
- `<break>` tags are inline where exact pauses should occur.
- Punctuation-driven pauses (ellipses, em-dashes) are inline for natural micro-pauses.
- URLs are written phonetically ("acme dot com") to avoid TTS mispronunciation.
- **No v3 emotion tags** (`[excited]`, `[calm]`, `[whispering]`, etc.) -- these are silently ignored by v2.

## Presenting to the user

After generating the provider script:

1. Show the full script with a brief explanation of the annotations used.
2. Tell the user:
   > Copy everything below the horizontal rule into the ElevenLabs portal, or the agent will send it via the API. See the provider reference for step-by-step instructions.
3. Write the file to `voiceovers/<slug>/provider_script.md`.
4. Proceed to the provider walkthrough: [providers/elevenlabs.md](providers/elevenlabs.md).
