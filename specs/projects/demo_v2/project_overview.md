---
status: draft
---

# Demo v2

The demo video in this project (`examples/videowright_demo/videos/demo_video`) has a good script, but was generated with Opus 4.6. Opus 5.5 is much better at video generation — better in every way: transitions, motion, design, timing. We want to leverage that much better design sense, while essentially keeping the script from the first video, and not regressing anything.

Make a `demo_v2` video using the videowright skill's "new video" command:

- Copy in the script from the original demo video.
- Build demo v2 fresh, using the newer model's better judgement and design sense. Take the *human* design decisions from demo v1, but not the detailed design / timing / etc.
- Building fresh from the same script should produce a much better video. Looking too closely at the existing video would only hurt the final product, so we index on current-model judgement over the reference every time, and hide the v1 implementation from the agents doing the build.
- Generate the voiceover with the new audio models. If blocked on API key access, use the existing voiceover track for now, and send the user a script so they can generate and send back an MP3.

Demo v1 used an existing built-in style (`motion-engineering`). So there is a first step: upgrade that style to the higher visual standards Opus 5.5 is capable of, before starting demo v2.

The user supplied the new Videowright logo (designed by their son) for use in the video.

Process note: spec all planning phases in one pass of questions. This isn't hard, so don't run five separate spec steps.
