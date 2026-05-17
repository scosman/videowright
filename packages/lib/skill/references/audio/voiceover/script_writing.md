# Script Writing

## When this is loaded

You are writing or integrating a voiceover script into the video's PLAN.md. This happens before generating the provider script.

## Where the script lives

The canonical script lives in the video's `PLAN.md` under a `## Script` section, divided by segment. Each segment gets a subsection with its VO text:

```markdown
## Script

### intro
Welcome to Acme Product. Today we'll walk through the three features that set us apart.

### feature-cards
First up: real-time collaboration. Your team can edit simultaneously, with changes syncing instantly across devices.

[pause for animation]

Next, the analytics dashboard. Track engagement, conversion, and retention in one view.

[pause for animation]

Finally, integrations. Connect with the tools you already use -- Slack, GitHub, Jira, and more.

### outro
Ready to get started? Visit acme.com for a free trial. Thanks for watching.
```

### Rules for the script section

- One subsection per segment, using the segment id as the heading.
- Segment ids must match the ids in the timeline.
- Use `[pause for animation]` markers where the script expects a visual beat to play before the narration continues. These are hints for the agent when computing multi-advance timing.
- Segments with no voiceover content are omitted from the script section.

## Writing a new script

When the user wants a script written for them:

1. **Read the video's PLAN.md.** Understand the purpose, audience, segment outline, and any creative direction.
2. **Read each segment's code** (or at minimum its `notes` and `voiceover` fields) to understand what visuals are on screen.
3. **Draft the script** section-by-section, following the segment outline order.

### Writing guidelines

- **Match visuals to narration.** The script should describe or complement what is on screen, not fight it. If a segment shows a data chart, the narration should reference the data.
- **Pacing: ~150 WPM.** A 30-word section takes about 12 seconds to speak. A 100-word section takes about 40 seconds. Use this to estimate segment durations. Err on the side of shorter -- spoken pace with pauses is slower than reading pace.
- **Use natural language.** Avoid jargon unless the audience expects it. Write like you are speaking to someone, not writing a whitepaper.
- **One idea per segment.** Each segment should have a single narrative focus. If a segment's script covers multiple unrelated ideas, consider splitting the segment.
- **Mark pauses explicitly.** Use `[pause for animation]` at points where the visual needs time to play without narration. These become multi-advance beats in the Timing.
- **End with a call to action or wrap-up.** The final segment's script should give the video a sense of closure.

## Integrating a user-provided script

When the user provides their own script (pasted or from a document):

1. **Chunk by segment.** Read the timeline's segment outline and divide the script into sections that match each segment's purpose. Use the segment's `notes` and `voiceover` hint fields as alignment cues.
2. **Write into PLAN.md** using the subsection format above.
3. **Add pause markers** where the script transitions between ideas within a segment, especially where an animation beat is expected.

If the script does not divide cleanly by segment:

- Propose a mapping and ask the user to confirm.
- If the script implies a different segment structure, suggest adding or removing segments to match.

## Sanity checks

Run these checks before proceeding to the provider script:

### Spelling and grammar

- Read the script aloud (mentally) and flag anything that sounds awkward when spoken.
- Flag common TTS pitfalls: abbreviations that should be spelled out (e.g., "API" should stay as "A-P-I" or "API" depending on desired pronunciation), numbers that might be misread, technical terms with unusual pronunciation.

### Script-video alignment

- For each segment, verify the script references content that is actually on screen.
- Flag cases where:
  - The script mentions a feature or visual that does not appear in the segment.
  - A segment has prominent visuals that the script ignores.
  - The script order does not match the timeline order.

When a misalignment is found, present it to the user:

> The script for segment "feature-cards" mentions "pricing comparison" but that segment shows collaboration features. Would you like to: (1) update the script to match the video, (2) update the video to match the script, or (3) keep it as-is?

### Duration estimate

- Sum up the word count per segment and estimate total duration at ~150 WPM.
- Flag if any segment's script seems much longer or shorter than expected given the segment's visual complexity.
- Present the estimate: "The full script is ~320 words, which should take about 2 minutes 8 seconds to narrate at a moderate pace."

## After the script is confirmed

1. Update each segment's `voiceover` field to match its PLAN.md script section.
2. Assemble all segments' voiceover text into `voiceover_script/script.md` (one `## segment-id` heading per segment, matching the output format in [voiceover.md](../voiceover.md)).
3. Proceed to [provider_script.md](provider_script.md) for Flow A, or directly to sync for Flow B.
