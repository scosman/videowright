---
status: complete
---

# Architecture: Videowright

System-level technical design. Per-component depth lives in `/components/*.md` (listed in §10).

---

## 1. Repo layout

Single npm workspace at the repo root.

```
videowright/
├── package.json                  # root: workspaces, dev tooling, scripts
├── tsconfig.base.json            # shared strict TS config
├── .github/workflows/
│   ├── ci.yml                    # typecheck, lint, unit + integration (Vitest)
│   └── e2e.yml                   # Playwright smoke test (separate workflow)
│
├── packages/lib/                 # the npm package: `videowright` (lib + skill ship together)
│   ├── package.json              # exports: ".", "./cli". bin: videowright. files: ["dist", "skill"]
│   ├── vite.config.ts            # lib-mode build
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # public API barrel
│   │   ├── player/               # player runtime + transitions + hash router + HUD
│   │   ├── segment/              # defineSegment + PlayerContext impl
│   │   ├── timeline/             # loader, id resolution, validation
│   │   ├── script/               # script() helper
│   │   ├── cli/                  # `videowright dev` and `videowright script`
│   │   └── types.ts              # public types
│   ├── skill/                    # ships in published npm package
│   │   ├── SKILL.md
│   │   ├── references/
│   │   │   ├── setup.md
│   │   │   ├── authoring_segment.md
│   │   │   ├── authoring_video.md
│   │   │   └── style_matching.md
│   │   └── assets/               # templates: hello-world segments + video
│   └── test/
│       ├── unit/
│       └── integration/
│
├── examples/
│   └── demo_example/             # the stylish showcase video (§9 functional spec)
│
└── README.md                     # project README, written final phase
```

The skill structure is **flexible** — it can be reorganized in later spec iterations or during development if a better shape emerges. The lib structure is more load-bearing: changes there ripple through component contracts.

---

## 2. Module boundaries

| Module | Responsibility | Public exports |
|---|---|---|
| `player/` | Runtime that mounts segments, runs transitions, handles input, owns hash routing and HUD | `Player` |
| `segment/` | Authoring helper for segments and the `PlayerContext` implementation passed to them | `defineSegment`, types |
| `timeline/` | Load a timeline module, resolve segment ids via Vite glob, validate `meta` | (used internally by Player; minor exports for the CLI) |
| `script/` | Walk a timeline's segments and emit Markdown VO document | `script(timeline)` |
| `cli/` | Thin command parsers + Vite dev server / one-shot script runner | `bin: videowright` |
| `skill/` | Agent skill content; not code | (none — read by Claude) |
| `examples/demo_example/` | Showcase video using the lib | (none — runs in browser) |

Lib's public API surface is locked in functional spec §11. Internals can change.

---

## 3. Build & packaging

- **Lib build.** Vite library mode. ESM only (`"type": "module"`, `"exports"` field). Single bundle plus type declarations (`vite-plugin-dts`).
- **CLI.** Same package, separate entry. `bin` field in `package.json` points to `dist/cli/index.js`. Shebang line. CLI entry parses argv and delegates to `dev` or `script` subcommand modules.
- **Consumer dev server.** `videowright dev` programmatically boots a Vite dev server with our internal entry HTML, configured to glob the consumer repo's `segments/`, `transitions/`, etc. The consumer doesn't need their own `vite.config.ts` for trivial videos.
- **Consumer build.** v1 only ships the dev server. Production builds of consumer videos are a later phase, tied to render/record commands.

---

## 4. Player architecture (key flows)

The player is the most complex component. Detailed in `/components/player.md`. System-level summary:

### Slot model

The player owns two slots: `current` and `incoming`. Each slot is a `<div>` with inline positioning styles. The slot div is passed directly to the segment's `mount(el, ctx)` — segments choose whether to attach a shadow root for isolation, append children directly, or use any other DOM strategy. The lib doesn't impose a hosting strategy. At any moment, one or both slots are populated.

- Steady state: only `current` populated.
- During transition: both populated, transition function animates between them, `current` is then unmounted, `incoming` becomes `current`.

### Forward step

1. Read next segment from timeline.
2. Mount `incoming` (call segment's `mount()`, await it).
3. Start `play(ctx)` on `incoming`. **Do not await it** — `play()` resolves only when the *outgoing* transition can begin, but for the first segment there's no outgoing.
4. For step ≥ 2: when outgoing's `play()` resolves, run the transition function with both slot elements. After it resolves, unmount outgoing.
5. Update URL hash to `#/<segment-id>/0`.

### Backward step

1. If current segment's `prev()` returns `true`, no segment change (handled internally — though see "no animation reversal" below).
2. Otherwise unmount current, mount the previous segment fresh, run transition in reverse direction (cut by default), advance to the segment's stable starting state.
3. **No animation reversal.** Going backward always renders the *starting* state of the target beat. We never play `play()` backward.

### Hash routing

- Player reads `location.hash` on load. Format: `#/<segment-id>/<beat-index>`. If absent, `?to=<id>` query is read once, rewritten to hash, and the URL replaced (no history entry).
- On segment change: `history.replaceState(null, '', '#/<id>/0')`.
- On internal beat advance (via `ctx.waitForNext()` resolving): `history.replaceState(null, '', '#/<id>/<n>')`.
- On `hashchange` event (user manually edits URL): jump to the new segment + beat.
- On hot reload: page reloads, hash persists, player seeks to that position.

### Seek to beat N on load

The player must be able to start a segment "at beat N" (e.g. after a hot reload). Implementation: when seeking to beat N > 0, the player calls `mount()`, then runs `play()` with a special context that resolves the first N `waitForNext()` calls immediately (synchronously). After the Nth, normal interactive behavior resumes. Same effect as the user pressing next N times immediately, but instantaneous.

This relies on `play()` being idempotent and using only `waitForNext` / `hold` for control flow — both are required by the spec.

`ctx.hold(ms)` is **not** fast-forwarded during seek; only `waitForNext()` is. (Otherwise we'd skip animation.) An author who needs to seek-skip a `hold` should restructure as `waitForNext()` instead.

---

## 5. Segment helper (`defineSegment`)

Detailed in `/components/segment_helper.md`. Summary:

```ts
export function defineSegment(spec: SegmentSpec): Segment;
```

`defineSegment` returns a Segment object whose `next()` / `prev()` are auto-wired from the user's `play()` body. Internals:

- A counter tracks how many `waitForNext()` calls have resolved. This is the current beat index, written to the URL hash.
- The default `next()` resolves the next pending `waitForNext()` promise. If no pending wait exists (i.e., the segment has finished its `play()` body), `next()` returns `false` so the player advances to the next segment.
- `prev()` always returns `false` by default. The player handles backward navigation by remount, since we don't reverse animations.
- `ctx.signal` is from a single `AbortController` per segment instance, aborted on unmount.
- `ctx.clock()` reads from the player's video clock (monotonic ms since segment mount).

Authors may override `next()` / `prev()` in `spec` for custom logic. Authors may also write the bare `Segment` interface manually with full strict typing.

---

## 6. Timeline loader

Detailed in `/components/timeline_loader.md`. Summary:

The player needs to resolve `{ id: 'intro' }` to `segments/intro/index.ts` at runtime. Implementation: an internal entry file used by `videowright dev` calls:

```ts
const segmentModules = import.meta.glob('/segments/*/index.ts');
```

This produces `Record<string, () => Promise<Module>>`. The player's loader extracts the id from each path (`/segments/<id>/index.ts`) and builds the id → loader map. On timeline load, the player iterates the timeline's `segments` array and validates that each id is in the map. Missing ids error at load with the timeline path and the missing id.

Custom transitions are loaded similarly from `videowright.config.ts`'s `transitions` field — each value is a `() => Promise<Module>` lazy-loader.

The user does not write `import` statements for segments. The id is the source of truth.

---

## 7. CLI

Detailed in `/components/cli.md`. Summary:

`videowright dev [path]`:
- Parses argv via Node's built-in `node:util/parseArgs` (no third-party CLI parser).
- Verifies `videowright.config.ts` exists at cwd.
- Discovers the timeline path: explicit arg, or the most-recently-modified `videos/*/timeline.ts`.
- Boots Vite dev server programmatically with our internal entry HTML and a config that mounts the player against the discovered timeline.
- Vite handles HMR; we full-reload on any change. Hash routing preserves position.

`videowright script [path]`:
- One-shot. Loads the timeline file via `tsx` (or jiti) so we can import a `.ts` module from Node.
- Calls the lib's `script()` helper.
- Prints to stdout, or with `--write`, writes to `videos/X/voiceover/script.md`.

---

## 8. Skill

Detailed in `/components/skill.md`. Summary:

The skill is content (Markdown + asset files), not code. It ships **inside** the `videowright` npm package at `packages/lib/skill/` (versioned together; `package.json#files` includes the `skill` directory in the published tarball). The lib does not depend on the skill at runtime; the skill references the lib and teaches the agent how to use it.

Setup-flow logic lives in `packages/lib/skill/references/setup.md` as a prompt the agent follows, not as automation. The "agent-native" requirement means: the agent drives the flow conversationally, asking the locked questions from functional spec §10.1 efficiently in one round. The dependency-setup question is **open-ended** — the agent asks what the user wants to install (with examples to anchor) and uses general knowledge to install it. No pre-built framework starter templates.

Templates in `packages/lib/skill/assets/`:
- `hello_world/` — the 2-segment hello-world video copied into a fresh consumer repo during setup.

The skill structure is explicitly **revisable** during implementation if a better organization emerges.

---

## 9. Demo example

Detailed in `/components/demo_example.md`. Summary:

`examples/demo_example/` is a stylish video that exercises the surface and serves as the canonical "good Claude output." It also generates the MP4 embedded in the project README (rendered manually via screen-record in v1, or via `record`/`render` if those phases ship).

Scope: roughly 5 segments — animated SVG title, Three.js feature demo, HTML/CSS card grid with internal beats, a custom transition between two segments, and a styled outro. Plus one custom transition file, plus styles tokens.

Stylish is a hard requirement here: this is what people will see first.

---

## 10. Component design plan

The following docs in `/components/` will be drafted in step 5:

| File | Covers |
|---|---|
| `player.md` | Slot model, transition orchestration, hash router, HUD, hot reload, seek-to-beat |
| `segment_helper.md` | `defineSegment` internals, `PlayerContext` implementation, internal beat counter, signal plumbing |
| `timeline_loader.md` | Vite glob resolution, timeline validation, custom transition loading, error formats |
| `cli.md` | argv parsing, `videowright dev` flow, `videowright script` flow, error messages |
| `skill.md` | SKILL.md content outline, references content, assets layout, setup flow prompts |
| `demo_example.md` | Concrete segment list, design tokens, custom transition, README MP4 plan |

`script/` (the `script()` helper) and `transitions/` (built-in fade/slide/cut) are simple enough to specify inline in this doc — see §11 and §12 below.

---

## 11. Built-in transitions

Six functions, each ~20 lines using Web Animations API. All accept `(outgoing, incoming, ctx) => Promise<void>` per functional spec §7.

- `cut` — instantaneous: hide outgoing, show incoming. No animation. ~5 lines.
- `fade` — both elements crossfade (outgoing opacity 1→0, incoming 0→1) over 400ms by default.
- `slideLeft` / `slideRight` / `slideUp` / `slideDown` — incoming translates in from the matching edge while outgoing translates out to the opposite edge, 500ms default.

Defaults are configurable per timeline entry: `transition: { type: 'fade', duration: 800 }`.

`direction: 'forward' | 'backward'` is passed to the function via `ctx`. Built-ins use it to flip slide direction on backward navigation. `cut` and `fade` ignore it.

Custom transitions are user code in `transitions/<name>.ts`, registered in `videowright.config.ts`. Loaded lazily.

---

## 12. `script()` helper

```ts
export function script(timeline: Timeline): string;
```

Walks `timeline.segments` in order. For each, loads the segment module (via the same id → loader map the player uses), reads `voiceover` field, and emits:

```markdown
# {timeline.meta.title}

## {segment.id}
{segment.voiceover}

## {next-segment.id}
{next-segment.voiceover}

...
```

Segments without `voiceover` are skipped (with their id still listed under "no VO").

CLI `videowright script --write` writes to `videos/<inferred>/voiceover/script.md`.

---

## 13. Error handling strategy

- **Load-time errors** (missing config, missing segment id, malformed timeline) surface as a styled error overlay in the player and a non-zero exit from the CLI. Stack trace in console; user-facing message identifies the file and the issue.
- **Runtime errors during `play()`** are caught by the player. The HUD shows a "segment errored" banner with the segment id and the message. Playback halts at the failed segment. Console has the full stack.
- **`renderBeats` mismatch** (render mode only) errors with the segment id, expected beat count, and actual count.
- **Render-mode runtime errors** (later phase) will halt the export and exit non-zero with a clear message.
- **Segment authoring errors** (missing required `id`, etc.) caught at `defineSegment` call time with a thrown TypeError. TypeScript strict mode catches most before runtime.

The lib does not silently swallow errors. No try/catch around user code unless we explicitly need to surface a friendly message.

---

## 14. Testing strategy

### Unit tests (Vitest, in-process)

- `defineSegment`: returned object shape, `next()` consumption, beat counter increments, default `prev()` is always `false`, signal aborts on unmount.
- `script()`: walks a synthetic timeline, handles missing VO, ordering correct.
- Built-in transitions: each function resolves; with `direction: 'backward'`, slides flip.
- Timeline validation: missing id errors with timeline path + missing id; valid timeline parses; meta defaults applied from config.
- CLI argv parser: handful of cases.

### Integration tests (Vitest with jsdom)

- Full timeline load + first segment mount + `play()` runs + hash updates to `#/<id>/0`.
- Forward through 3 segments, verify `unmount()` called on each, `mount()` called on next, hash updates.
- Beat advance: a segment with 3 `waitForNext()` calls; simulate next-presses; verify beats counter increments and hash updates.
- Seek-to-beat N on load: hash `#/segB/2`, player jumps directly to segment B beat 2.
- Backward: from beat 2 of segB, prev → beat 1 of segB; from beat 0 of segB, prev → segA last stable state.

### E2E smoke (Playwright, separate workflow)

- Build `examples/demo_example/`. Open in Playwright. Walk through full timeline via keyboard. Assert segments mount/unmount, no console errors, expected text present at each beat.

### Coverage

No hard percentage target. **Required:** every public lib export has at least one unit test; the integration suite covers the player's full lifecycle; the E2E covers the demo end-to-end.

---

## 15. CI

Two GitHub Actions workflows:

**`.github/workflows/ci.yml`** — fast path, runs on every push/PR:
- Setup Node 22 (LTS), npm ci.
- Typecheck: `npm run typecheck` (root tsc --noEmit across workspaces).
- Lint: `npm run lint` (ESLint or Biome — pick during implementation).
- Unit + integration: `npm test` (Vitest, all workspaces).

**`.github/workflows/e2e.yml`** — heavier, also on push/PR but separate job:
- Setup Node 22 (LTS), npm ci.
- Install Playwright browsers.
- Build demo_example.
- Run Playwright smoke: `npm run test:e2e`.

Separate workflow keeps the fast CI fast and isolates browser-dependent failures.

---

## 16. Key technical risks

| Risk | Mitigation |
|---|---|
| Vite glob in production builds doesn't resolve dynamic ids cleanly | v1 only ships dev-server-driven playback; production builds tied to render phase. Defer to that phase. |
| `import.meta.glob` semantics changing between Vite versions | Pin Vite minor in `package.json`; lib re-exports a thin wrapper around the glob if useful. |
| Hot reload race conditions (file change mid-`play()`) | Full reload on any source change. Hash preserves position. No in-place HMR for v1. |
| Authors writing `setTimeout` everywhere | Documented footgun in the skill. Authors guided toward rAF / CSS / WAAPI / GSAP. |
| `tsx`/jiti not loading the user's `videowright.config.ts` cleanly | Settle on one (likely `tsx`) and pin it. Test against a config with type imports. |

---

## 17. License & dependencies

MIT for our code. All runtime deps must be MIT-compatible. Key planned deps:

- `vite` — dev server + lib build
- `vitest` — tests
- `@playwright/test` — e2e
- `tsx` (or `jiti`) — runtime TS for CLI
- `typescript` — strict
- `eslint` (or `biome`) — lint, decided in implementation
- (none for transitions/animation: WAAPI is browser-native)

No BUSL deps. No copyleft.
