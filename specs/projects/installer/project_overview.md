---
status: complete
---

# Installer

This project is to create an “agent native” installer. The best ones I have seen just say “Paste this in your coding agent...”, and the agent does the rest.

- Readme install section, something like
```
Paste this in your coding agent: 
"Install videowright using these instructions: [link to github markdown file we create below]"
```
- Create a markdown file which explains to the agent how to install it.
  - check root folder is empty. videowrite expects its own folder to manage. Can be a sub-folder of another repo, but should be its own clean folder. 
    - If root folder is already a videowright project, that’s okay.
    - If it has other stuff, check with user. Suggest a clean project, or subfolder. Get them to choose but don’t install parallel with other work.
  - check which node package manger is setup and install: `npm install videowright`, etc. Ask user which packager manger if not already setup and they have both npm and pnpm installed.
    - Also install needed tools: playwright, type-checker, linter, vitest, etc. Prob worth listing exact set in md instructions. 
  - add skill to coding agent (project specific config, not user-wide/global)
  - Update the agent instructions (`AGENTS.md` or `CLAUDE.md` with important context
    - “This project is a [videowright](https://github.com/scosman/videowright) project. It [key context]” (note, if this is sub-folder of another project and this file is at higher level, update the “this project” to “the project in folder X”.
    - “Load the skill `/videowright` to complete any tasks relate for video editing….”
    - your refine. Excellent but concise context for coding agent.
- Agent Support: Claude Code, Codex, and opencode
  - the instructions file: CLAUDE.md/AGENTS.ms should be set for target agents
  - installing a skill to the agent: have instructions for each in your install markdown. Each is a little different.
  - which to install:
    - run `which claude && which codex && which opencode` to see what they have
    - If they have multiple installed, ask which they want installed. If they only have current agent, assume only current agent and proceed without asking.
- Style:
  - kinda like a top tier CLI installer, but in an agent. “Which package manager do you want to use? [npm] or [pnpm]?”. 
  - We design great strings and great flow once, and code them into the markdown file. Want it to work pretty consistently across different agents/models.
- Integrating with our skill
  - In setup.md, add a new first step to check the installer was run: “verify videowright installed”
    - we don’t really need to validate skill is installed, as this file is only loaded when skill installed so that’s pointless
    - do verify package.json is setup as required, and other install steps are complete. If not, setup should redirect to this file for fixing install.
    - ensure “npm install” was run
- npm init install:
  - setup `npm init videowright` command. It should be ligghtweight/simple: asks which agent they want to install into (claude, opencode, etc), user selects, then we launch that agent with the prompt. `claude -p ...` (handoff so it’s interactive). Really just handing off the suggested prompt to selected coding agent, keep it light.
  - P2 if hard.
