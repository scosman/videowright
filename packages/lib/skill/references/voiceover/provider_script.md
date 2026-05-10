# Provider Script

## When this is loaded

You have a confirmed script in PLAN.md and need to transform it into a provider-specific format for TTS generation.

## What `provider_script.md` is

The `provider_script.md` file is a transformation of the PLAN.md script with provider-specific annotations. It is the text that the user copies into the TTS provider's portal to generate audio. It lives at:

```
videos/<video>/voiceovers/<slug>/provider_script.md
```

The file is markdown for human readability, but its content is the exact text to paste into the provider. Segment headings are stripped -- only the narration text and annotations are included.

## Generating the provider script

### Step 1: Read the confirmed script from PLAN.md

Extract the script sections in timeline order.

### Step 2: Apply delivery annotations

Based on the style intake answers (see [style_intake.md](style_intake.md)), add provider-specific tags where appropriate. The specific tags depend on the provider -- see the provider reference:

- ElevenLabs v3: [providers/elevenlabs.md](providers/elevenlabs.md)

### Step 3: Add pauses

Where the PLAN.md script has `[pause for animation]` markers, insert provider-specific pause mechanisms:

- Short pauses (< 1 second): use ellipses (`...`) or em-dashes (`--`).
- Medium pauses (1-3 seconds): use the provider's pause tag if available, or combine multiple short-pause characters.
- Long pauses (> 3 seconds): use the provider's explicit pause mechanism. If unavailable, add a note to the user to manually trim or add silence in post.

See the provider reference for exact pause syntax.

### Step 4: Handle segment boundaries

The provider script is one continuous block of text (not divided by segment). Segment boundaries from PLAN.md become natural pause points in the provider script. Insert appropriate pause markers at segment transitions to give the audio natural breathing room.

### Step 5: Pronunciation and special terms

- Spell out abbreviations that should be pronounced as letters: "A P I" (with spaces) if the TTS should say each letter.
- Leave abbreviations that should be pronounced as words as-is: "NASA", "JPEG".
- For unusual proper nouns, add phonetic hints using the provider's pronunciation mechanism if available.

## Output format

Write the provider script as a single markdown file:

```markdown
# Provider Script

> Provider: ElevenLabs v3
> Voice: [user selects in portal]
> Style notes: Conversational, warm, moderate pace

---

Welcome to Acme Product. Today we'll walk through the three features that set us apart.

...

[excited] First up: real-time collaboration. [/excited] Your team can edit simultaneously, with changes syncing instantly across devices.

...

Next, the analytics dashboard. Track engagement, conversion, and retention -- in one view.

...

Finally, integrations. Connect with the tools you already use... Slack, GitHub, Jira, and more.

...

Ready to get started? Visit acme dot com for a free trial. Thanks for watching.
```

### Key conventions in the output

- The header block (blockquote) is metadata for the user, not pasted into the portal.
- Everything below the `---` is the text to paste.
- Delivery tags are inline with the text.
- Pause characters are inline where pauses should occur.
- URLs are written phonetically ("acme dot com") to avoid TTS mispronunciation.

## Presenting to the user

After generating the provider script:

1. Show the full script with a brief explanation of the annotations used.
2. Tell the user:
   > Copy everything below the horizontal rule into the ElevenLabs portal. See the portal walkthrough in the provider reference for step-by-step instructions.
3. Write the file to `voiceovers/<slug>/provider_script.md`.
4. Proceed to the provider walkthrough: [providers/elevenlabs.md](providers/elevenlabs.md).
