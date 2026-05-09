---
status: complete
---

# Refining Skill and UX

The agent skill is the user experience. Everything with videowright is designed to be done inside coding agent, so we want a pretty killer “agent/skill UX” here.

Below is a design of the skill. 

- P0: I should be able to open Claude Code, and make a kick ass video, no prior experience needed. When in doubt, I can say in plain language what I want, and the skill gets it done.
- Hero use case/goal: I want to paste in a really good script, and get a really good video out, in essentially 1 shot. No interaction past the few nice designed flows we describe below, and it telling me to preview dev, then export via CLI.

I’ve given various degrees of detail below, but none of them are final. Your role is to refine and make this really excellent. You can tweak files/strings/steps/prompts, nothing is final, it’s all guidance. Some are more speced in more detailed than others, that’s just an artifact, make them all great.

- Precondition:
  - videowright is installed, skill connected to current agent. There’s a separate “setup” project for this, this is not in scope for this project, you should assume the skill is installed and the CLAUDE.md/AGENTS.md has a description that this is a videowright project with link to skill. DO NOT TACKLE INITIAL INSTALL AS PART OF THIS PROJECT.
- SKILL.md: core flow, core knowledge
  - start of SKILL.md should explain what videowright is, so agent can be smart. Brief but complete. Agents are very smart now, good context is key.
  - Tell agent to check if project setup is complete. 
    - Each setup stage saves a value to config, so this just involves checking the final value exists. If setup already complete, it doesn’t launch the setup.md flow. We don’t even need to load `setup.md` into context if the final market is set.
  - Ask what they want to do
    - If the message where the skill was invoked didn’t include a clear instruction, ask their intent: new video, edit existing video, add style, change default style, etc. A decently comprehensive list of things this skill can do.
    - Follow up with any needed questions to redirect to the right reference file for next steps (setup.md, new_video.md, etc)
    - Once we know, load the relevant reference files, and continue
- setup flow: setup.md
  - step 1: completely new projects. 
    - create folder structure
    - 
    - setup config to say it’s created
  - step 2: style guide creation. 
    - Process
      - Ask about them (see below)
      - ingest data and create a new named style in `/styles/[name]` 
      - set “default_style” in our config ts file pointing to the new style folder.
    - Interaction/ask flow looks something like this (refine)
      - Pick one of 3 models then follow up questions that make sense for selected option
      - 1) Do you have a style guide we can ingest? Colors, fonts, logos, etc.
           - Follow up if they pick this: Link us to it, or paste it into the `/reference_files/style_reference` folder in this project and let us know when done.
        2) Provide us a style guide here in chat: “Modern look using Inter font, white background, #e0e230 accent color. Sans serif for headers and body, monospaced for callouts and code.”
           - Follow up: great, I’ve created a style guide for you! Look good or any changes? \n [overview]
        3) Select one of our built in styles. One of: `Modern`, `Retro`, or `Bauhaus`, `Animated explainer`
           - Follow up: none, just confirm it’s setup
    - Built in styles:
      - propose a set of 3-5. Aim for high quality, stylish design guides you’d seed in modern well designed projects in 2026. This should be its own implementation phase. Each includes fonts, color scheme, rules, descriptions an agent can use to understand the visual style, title, short description for the choice section, etc. 
- New Video Experience 
  - walk the user through creating a new video
    - get a project/video name from the user
    - style select: confirm default style is the right one to use, if they say no, let them
    - Build the v1 video PLAN.md file
      - Ask user to describe the video they want. Both the what, the why, they style, and hard guidelines (I want a graph showing X). If you have a voice-over script, include that.
      - This is interactive loop. Some users can paste in a ton of details (script, segment descriptions) in 1 go, and you can 1-shot the video PLAN.md from that (and just confirm). Some users will have way too little detail, and you’ll need to iterate with them until plan is complete - asking “why” and pulling detail out of them, and building a design. This is a key agent which is smart, flexible, and good at designing videos.
      - Key questions:
        - What is the video for?
        - What is the style (animated explainer, technical presentation with graphs, slides, brand-deck, etc)
        - Audio: is there a voice over? Music wanted? Silent?
    - Next dispatch to edit_video.md with prompt to “this is new, build the plan” sort of thing? Open to design suggestions.
- Others (across implementation phases)
  - create_or_edit_video.md - instructions for editing a video.
  - create_or_edit_style.md - instructions for creating or editing style. 
  - testing.md - explain that it can write tests, and which is should write. Example “timing files align to actual segments”
  - export.md - how to export/save. 
  - more: this list is not complete, you are to design it using our guidance/style/approach. For example, might need files explaining our folder structure, ts types, etc.
- Technical design
  - Lots of smaller skill `/reference/X.md files`, which allow us to cross link and compose. No repeated instructions, when we need to repeat, instead break it out and link.
  - You propose the design, but rough guidance below, showing an example of how setup_new_style.md is used from multiple places, without repeating instructions.
    - Core SKILL.md - see above
    - setup.md - walks through setup stages. Checks if completeion marker is in config, and only loads a sub-setup-step if it isn’t
    - setup_new_style.md - setup a new style. Used in setup.md for creating a default style, and also called from creating a new video where the user says they want a style other than default. Same file, used 2 places. Callers have use-case specific details (setup.md knows to tell it to set default skill in config after, but that’s not needed for new video).
  - Support Claude Code, Codex, and opencode
    - the instructions file: CLAUDE.md/AGENTS.ms should be set for current agent

I want to see your skill design, and approve it, during specing. Bullet point list of skills files, what they covered, and what links to what. 


