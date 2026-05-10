---
status: complete
---

# Voiceovers

This project adds voiceovers to videowright. Roughly, an agent that adds a VoiceOver using tech like elevenlabs or whisper transcription.

NOTE: Ignore capitalization of “VoiceOver” through this doc, that’s apple auto-complete, not an intentional choice. Should be “voice-over” to users and “voiceover" in code.

User Flow when they ask to add a voice-over
1. Ask if they have an audio file, or want us to generate one using AI text to speech. 

User flow for “generate with AI”
1. Check if PLAN.md already has a script text/VoiceOver. Can skip 2 if there is one.
2. Ask the user if they want to write a script, or want us to write one for them.
   - If they paste one, we use that. Analyze plan.md, figure out how we’d integrate it, and confirm the plan with the user
   - If they ask us to propose one, we read PLAN.md and propose one 
   - sanity checks: perform any iteration/feedback
     - If script doesn’t align to video clearly, ask how to fix (update script, update video, or how to apply)
     - suggest fix spelling and grammar errors
   - when done, integrate the scrip into the PLAN.md, divided section by section, with any needed notes on timing.
3. Build a “provider script” for specific AI VoiceOver provider to use for text to speech. The script, with needed tags.
   - Elevenlabs example (assume elevenlabs, as this is all we support in v1)
     - add breaks:
       1. v3, you use audio tags like [pauses], [sigh], ellipses ..., and dashes — instead — v3 dropped SSML break tags in favor of more "directorial" control. Research how to get exact timing to match desired video timing, can we have [pause 3 seconds]?
     - Style: Bracketed performance tags like [whispering], [excited], [serious] to shape delivery
   - Idea is to convert your knowledge of the script and video timing to generate the ideal “provider specific script”. Example: 
     - some phrases will need pauses to give an animation time to play — those pauses should be encoded in “provider script”
     - Any stylistic notes should also be integrated, to in a way the speech to text provider can consume them
   - Print out the script (for user to copy) AND instructions for how to get an audio file (provider specific). 
4. Get the user to add the mp3/wav file, and timestamps to a specific directory
   - create a dir (voiceover_v14)
   - drop in files: audio file 
   - Drop in timing file (per charater/word timing from eleven labs or similar) if available from provider.
5. Generate timing if we didn’t get it in step 4 above (see below for details)
6. Ask if they want to make this the default VoiceOver for their video
7. Create timing file to sync video to audio
   - In general in video editing these types of video: Audio takes precedence. Get video beats to align to the the audio timing. 
   - To do this we tweak “advance” timing of the video to fit the voiceover.
   - Note: this gets saved to a new Timing ts typed object inside the voiceover folder/object! Different voiceovers may have different timings, and they may want to keep several around in parallel. Rough type below.
   - See below for technical details.
8. Set the video’s voiceover
   - if they want to make this the default voiceover update the timeline.ts file to import the voiceover ts file, as a new `voiceover` field. When set, the timing for VoiceOver super-seeds timing in segments (unless you run record with `--voiceover none` or otherwise clear VoiceOver, in which case we go back to segment based advance timing. Switching voiceovers later is easy: just import and use new object. Doesn’t delete any of the timing data, which is great.

User Flow when they say they have auto file:
1. Get them to give us the audio file: either pass a path, or paste it into a VoiceOver folder we create.
2. Analyize the audio file to get transcript and timing (see details below)
3. Continue with “ Ask if they want to make this the default VoiceOver for their video” and later steps from above

Tech to build
- Code
  - Update player to be able to play audio: 
    - dev mode: plays in web browser. 
    - record mode by appending audio track to video after video capture.
    - render mode: if using CLI to do video capture, audio track to video after video capture. If rendering in real browser, play in web browser. Kinda hybrid.
  - Need some sort of “advance beats based on script” type/file
    - We built this type. It’s used on default_timing today, and we use the same thing inside the voiceover ts type…  
  - VoiceOver type, file, and conventions
    - need a new `voiceover` ts type, includes timing field for advancing video
    - convention to create a `voiceover.ts` in `voiceovers/[slug]/voiceover.ts` for each voice over. Include `audio_file_path`, and any other fields we need.
  - render and record CLIs take a optional `--voiceover [slug]`, if provided uses that audio file and timing to override default segment timing.
  - timeline.js files can include a default_voiceover — importing and setting a VoiceOver as the default. When set, the vo timing superseeds default_timing.
- Most of this is “skill” files. A “VoiceOver” reference file, which references sub-capabilities
  - core “VoiceOver” skill reference file (still part of our one skill)
  - sub-capabilities
    - style questions: ask user about style reqs (voice, excitement, etc) before starting
    - instructions to convert a script to needed format for a provider (provider script) 
    - flow mangement: agent drives process
      - “here’s a script, open elevenlabs, run it, and save both the video and timeline files to the folder X when done”.
    - video-sync-to-audio capability - sync the video to the script using timeline files. Two parts
      - “advance timing script”, like hitting -> button to advance, at the right moments. See codebase, for existing.
      - tweak any fully automated animations that aren’t driven by next. Sometimes there are smooth animations you want timed to audio beats, but without the pauses introduced by waiting for “next”. For this, we only do it if user has specified this will be the default VoiceOver! This isn’t perfect — if I’m playing different voiceovers on same video, their advance timing auto-updates, but this doesn’t. We accept that tradeoff, and time animation in segments to default VoiceOver.
      - Tech note: we should end up storing several “advance timing ts scripts”. One in each voiceover (as I may end up with several voiceovers for different “takes”). a video’s config can point to (import and set field), or when running render we can point to a VoiceOver folder to use that specific audio + timing file.
    - provider specific reference files (elevenlabs to start, but designed to add more)
      - how to generate “script” file - what do they use for tone, pauses, gender/voice, etc. 
      - how to read timeline files and generate the file videowright needs to advance along with it
      - how to guide user (“Open eleven labs portal, click “New Track”…) etc.
    - voiceover writer
      - If the user just started this video with a description, and not script, we should be able to write one based on the plan.
- Make core skill aware of these needed capabilities for VO: add VoiceOver, switch VoiceOver (if they have many), etc.
- 2 Providers in V1:
  - ElevenLabs v3: 
    - voice to text saas provider. See descriptions above.
    - Read their docs for v3, to be able to make a great guide for writing provider scripts, using the app to get audio files and timing files.
  - Manual: 
    - get them to provide a recording (audio file), by path or dropping into a VO folder.
    - get timestamps from audio for sync
      - Option 1: using agent itself if it can read audio
      - Option 2: instructions to upload it to some saas tool and get them generated,
      - Option 3: install a local CLI like `whisper-timestamped`
      - Research options here including web-UIs/saas-options (elevenlabs preferred), local CLIs. Aim for 1 local CLI and 1 easy to use web-ui, let them choose (web-UI: easier for one audio file, CLI: more setup, but reusable/automateable/local).
- UX: 
  - the dev HUD should be updated to allow selecting any of the available voiceovers. When you pick it switches playback to use that VoiceOver (not changing default, that’s done in agent).
  - Update dev hud to have a “play” button: starts “playing” the video, auto-advancing with timing, and synced audio. Any manual nav (prev/next) should pause, but they can hit play again to resume
  - TBD how we discovery these for dropdown: either all_voiceovers: array with imports in timeline.ts or discover by path/glob? Latter if we can, auto-discover is nice.


Rough timing examples (edit as much as you need, rough idea)
```
  import type { Timing } from "videowright"; 
  export default {
    perSegment: {
      // Each list entry = wall-clock SECONDS that segment's beat displays before advancing.
      // Last entry's advance transitions to the next segment in the timeline.   
      "intro":           [3.0],                        // 1 advance: end-of-segment 
      "feature-svg":     [4.5],                        // 1 
      "feature-three":   [3.0, 5.5],                   // 2: zoom-in beat, then end 
      "feature-lottie":  [3.5],                        // 1 
      "feature-echarts": [2.5, 4.0],                   // 2
      "feature-cards":   [2.5, 2.5, 2.5, 1.5],         // 4: 3 cards + transition
      "outro":           [4.0],                        // end video time
    },
  } satisfies Timing; 
  ```

