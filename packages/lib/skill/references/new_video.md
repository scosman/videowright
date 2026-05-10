# New Video

## When this is loaded

You were routed here from the intent dispatch table because the user wants to create a new video. This file covers the **design phase** — capturing intent and building a confirmed PLAN.md. Once the plan is confirmed, you hand off to [create_or_edit_video.md](create_or_edit_video.md) for the **build phase**.

## Inputs to capture

Before handing off to the build phase, you need all of the following. Ask only for what is missing from the user's input — never re-ask something already answered.

| Input | Required | Notes |
|---|---|---|
| **Video name** | Yes | Folder name under `videos/`. Suggest a date prefix (e.g., `2026_05_launch`). Default: `demo_video` for the first video; derive from topic for subsequent ones. The first video is usually created during setup — if `videos/demo_video/` already exists, derive from the topic instead to avoid a collision. |
| **Purpose** | Yes | What the video is for, who the audience is, what they should take away. |
| **Style** | Yes | Confirm the current `defaultStyle` is right. If not, dispatch to [setup_new_style.md](setup_new_style.md) with `setAsDefault: false`, `copySample: false`. Use the resulting slug for this video's `meta.style`. |
| **Audio intent** | Yes | One of: **voiceover**, **music**, or **silent**. Always ask — even when the input is rich. Silent is a real choice that changes pacing (longer beat holds, more visual motion). |
| **Hard guidelines** | If any | Must-haves: specific charts, logos, screenshots, length cap, things to avoid. |
| **Script** | If voiceover | Full VO copy if the user has it. If not, you will draft one during the build phase based on the other inputs. |
| **Segment outline** | Optional | If the user has a structure in mind, capture it. Otherwise, the build phase generates one from the script + purpose. |

### Audio intent notes

When the user picks **voiceover**, note that Videowright supports integrated voiceover audio:

- Audio plays in `dev` and `record` modes via an HTML `<audio>` element synced to the player.
- `render` muxes audio into the output MP4 via ffmpeg.
- The voiceover flow (AI-generated or manual) is handled after the video is scaffolded. See [voiceover.md](voiceover.md).

When the user picks **music**, note that background music is not currently supported. The video will be silent in dev and export. Music can be added in post-production.

## One-shot vs. iterate

Read the user's invocation carefully before asking anything.

**One-shot** — the user's input already contains:
- A multi-paragraph script or detailed description, AND
- Enough style/purpose signals to fill in the plan

Even when one-shotting, **always confirm audio intent explicitly** before drafting. Audio intent is never inferred — silent is a real choice that changes pacing. If the user's input includes a clear audio statement (e.g., "this has a voiceover" or "silent video"), that counts as confirmation. Otherwise, ask: "One quick question before I draft the plan — should this video have voiceover, music, or be silent?"

Once audio is confirmed, draft the full PLAN.md in one pass and present it: "Here's the plan I built from your input — anything to change?" Do not ask other intermediate questions.

**Iterate** — the input is sparse or missing key details.

In this case, ask **only the missing questions**, grouped into a single round. Do not ask one question at a time. Example:

> Before I build the plan, a few things I need:
> 1. What's this video for and who's the audience?
> 2. Should we use the current default style (modern), or do you want something different?
> 3. Audio: voiceover, music, or silent?

### Propose, don't interrogate

The default posture is **propose**. When uncertain about a detail, put a reasonable answer in the proposed PLAN.md and flag it for review — do not ask another question. Let the user correct the proposal rather than drilling them with questions.

## PLAN.md skeleton

Write PLAN.md into `videos/<name>/PLAN.md`. Use this structure:

```markdown
# Plan: <video title>

## Purpose
- Audience: <who>
- Takeaway: <what they should leave with>
- Constraints / hard guidelines: <must-haves, must-avoids>

## Style
- Active style: <slug>
- Notes: <any per-video style deviations or notes>

## Audio intent
- Mode: voiceover | music | silent
- Notes: <pacing implications, music vibe, VO tone, etc.>

## Segment outline
1. <id> — <one-line purpose>
2. <id> — <one-line purpose>
...

## Script (if applicable)
<full VO script, or "see voiceover/script.md">

---

## Log

### YYYY-MM-DD — Initial scaffold
- <what was built>
```

### PLAN.md rules

- The **Plan block** (Purpose / Style / Audio / Segment outline / Script) is **mutable** — overwritten as the design evolves.
- The **Log block** is **append-only**. Never delete entries. When meaningful changes happen (script revision, segment add/remove, style swap, design pivot), append a dated log entry.
- When in doubt, log it.

## Flow

1. **Evaluate the user's input.** Decide: one-shot or iterate?
2. **Gather missing inputs** (if iterating). Group questions into a single round.
3. **Draft PLAN.md.** Fill in all sections from the skeleton above.
4. **Present the plan for confirmation.** Show a summary — not the raw markdown — and ask: "Here's the plan. Anything to change?"
5. **Iterate if needed.** The user may want to adjust the script, add segments, change the style, etc. Update the plan each round.
6. **Write the confirmed PLAN.md** to `videos/<name>/PLAN.md`. Create the `videos/<name>/` directory if it does not exist.
7. **Hand off to build.** Load [create_or_edit_video.md](create_or_edit_video.md) and follow it with the create-mode entry condition (video folder is new, PLAN.md was just written).

## Edge cases

| Situation | Behavior |
|---|---|
| User already has a `videos/<name>/` folder with a PLAN.md | This is an edit, not a new video. Route to [create_or_edit_video.md](create_or_edit_video.md) in edit mode instead. |
| User wants a style other than `defaultStyle` | Dispatch to [setup_new_style.md](setup_new_style.md) with `setAsDefault: false`, `copySample: false`. Use the resulting slug for `meta.style` in the plan and timeline. |
| User provides a complete script but no segment outline | Generate the segment outline from the script during PLAN.md drafting. Each natural section of the script maps to a segment. |
| User provides a segment outline but no script | Capture the outline. The build phase will draft VO from the outline if audio intent is voiceover. |
| Video name conflicts with an existing folder | Ask the user to pick a different name, or confirm they want to overwrite. |
| User skips the audio question | Do not skip it yourself. Audio intent affects pacing. Ask directly: "One more thing — should this video have voiceover, music, or be silent?" |
