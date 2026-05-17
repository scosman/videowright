# Audio Editing Style Guide

## When this is loaded

You are authoring or reviewing an audio plan for a product/demo video. This reference encodes opinions about what makes audio sound professional in this context. Apply these principles when writing volume curves, choosing levels, and reviewing mixes.

## Music level under speech

Music should recede when voiceover is speaking. The ear should never strain to separate the two.

| Scenario | Music level | Notes |
|---|---|---|
| VO speaking | 10-20% (roughly -14 to -20 dB below VO) | The music becomes texture, not competition. 15% is a good starting point. |
| VO pauses (animation beats, transitions) | 40-60% | Music can rise during visual-only moments to fill the space. |
| No VO at all (intro/outro, silent segments) | 80-100% | Let the music breathe when nothing else needs attention. |

These are guidelines, not rules. Trust your ear after rendering -- if the mix sounds right at different levels, those levels are right.

## SFX level

Sound effects should punctuate, not compete.

- **Peak level**: SFX should sit at 40-70% of VO level (e.g., `volume=0.4` to `volume=0.7` when VO is at `volume=1.0`). Loud enough to notice, quiet enough to not startle.
- **Duration**: keep SFX short. A 0.5-2s effect is typical. Longer ambient textures (server hum, rain) are exceptions.
- **Entry/exit**: brief fades (0.1-0.3s) prevent clicks and soften the transition. Even a 0.1s fade-in removes the harshness of a cold start.

### The "enhance, don't decorate" test

Before adding a SFX cue, ask: **would removing this hurt the video?** If no, it is decoration -- skip it. Good SFX makes a moment land (a typing sound while showing a terminal, a whoosh on a fast transition). Bad SFX adds noise without meaning.

Signs a SFX is decoration:
- It does not align with anything on screen.
- Removing it and the video feels the same.
- It draws attention to itself rather than to the visual.

## Ducking ramps

When transitioning music volume (e.g., ducking under VO), use smooth ramps rather than hard cuts.

| Ramp duration | Feel | Use for |
|---|---|---|
| 0.1-0.15s | Near-instant | Emergency ducks, very tight timing |
| 0.2s | Natural, unnoticeable | Standard duck-under-VO. **This is the default.** |
| 0.3-0.5s | Gentle, cinematic | Mood transitions, slow fades between sections |
| 1.0s+ | Dramatic | Deliberate musical swells or long crossfades |

The 0.2s ramp is the workhorse. It is fast enough that the listener does not perceive a gap, but slow enough that the volume change is not jarring.

### Ramp placement

- **Duck start**: begin the ramp 0.1-0.2s **before** the VO starts speaking. This way the music is already quiet when the first word lands.
- **Duck end**: begin the ramp **at** the last VO word's end timestamp. The music rises as the voice fades, creating a smooth handoff.

## Headroom and loudness target

### Target: -14 LUFS

Aim for an integrated loudness of **-14 LUFS** for the final mix. This is the standard for web and social media delivery (YouTube, Twitter/X, LinkedIn all normalize to roughly this range).

- Use the `loudnorm` ffmpeg filter as the final step in the mix chain. See [ffmpeg_cookbook.md](ffmpeg_cookbook.md).
- True peak should stay below **-1 dBTP** to prevent clipping after codec encoding.

### Leave dynamic range

Do not over-compress. A product demo benefits from some dynamics -- the VO should be louder than the music bed, SFX should punch above the ambient level. Flattening everything to the same volume makes the mix fatiguing.

The `loudnorm` filter with default LRA (loudness range) handles this well. Do not add additional compression unless the mix sounds uneven after loudnorm.

## Music selection principles

Match the music to the **segment's energy**, not just the overall video tone.

| Video moment | Music character |
|---|---|
| Intro / title card | Building energy, anticipation. Ambient textures or a gentle melody. |
| Feature explanation | Steady, supportive. Not distracting. Mid-energy. |
| Data / stats reveal | Can be more driving. Light percussion or rhythmic pulse. |
| Demo / terminal segment | Can drop to minimal or ambient. Let the visual speak. |
| Transition between sections | Brief energy bump. A swell, a beat drop, or a key change. |
| Outro / CTA | Resolution. Return to the intro's mood or build to a satisfying close. |

### One track or many?

For most product/demo videos (30s-3min), **one music track** is sufficient. The ducking curve and natural dynamics of the chosen track provide enough variation. Multiple music tracks increase complexity without proportional benefit unless the video has distinct tonal sections (e.g., a serious problem statement followed by an upbeat solution demo).

### BPM considerations

If the music has a strong beat, align visual transitions to beat boundaries when possible. The agent can read BPM from the `notes` field in `music.ts` and compute beat times: `beat_time = offset + (beat_number * 60 / BPM)`.

## Putting it together

A well-mixed product demo audio track:

1. **Starts with music** at full level (or fading in over 0.5s) during the title card or intro visual.
2. **Ducks music** smoothly (0.2s ramp) as the VO begins.
3. **Keeps music at 15%** under all speech segments.
4. **Raises music** during animation-only beats (visual transitions, data reveals without narration).
5. **Adds SFX sparingly** at key moments: a typing sound over a terminal demo, a subtle chime on a stat reveal. Each SFX fades in/out over 0.1-0.2s.
6. **Ends with music rising** as the VO concludes, carrying the outro to a clean fade-out or natural ending.
7. **Runs through loudnorm** at -14 LUFS as the final mastering step.

This pattern produces a polished, professional result. Deviate when the video calls for it, but start here.
