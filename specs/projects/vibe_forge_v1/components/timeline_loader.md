---
status: complete
---

# Component: Timeline Loader

Loads timelines, resolves segment ids via Vite glob, validates against config, applies meta defaults.

## Purpose and Scope

**Owns:**

- Building the segment id → loader map from a Vite glob.
- Building the custom-transition name → loader map from `videowright.config.ts`.
- Validating a `Timeline` object against the loader maps and config.
- Applying `videowright.config.ts` defaults onto a timeline's `meta`.
- Defining the public `Timeline`, `TimelineMeta`, `Config` types.

**Not owned:**

- Reading `videowright.config.ts` from disk (CLI's job → `cli.md`).
- Loading the timeline `.ts` module from disk (CLI's job in Node; Vite handles it in browser).
- Player runtime → `player.md`.

## Public Interface

Most functions are internal-ish (used by Player and CLI), but exported because both Player and `script()` need them.

```ts
// videowright/src/index.ts re-exports:

export interface TimelineMeta {
  title: string;
  aspectRatio?: string;
  resolution?: [number, number];
  fps?: number;
}

export interface TimelineEntry {
  id: string;
  transition?: string | { type: string; duration?: number; [k: string]: unknown };
  renderBeats?: number[];
}

export interface Timeline {
  meta: TimelineMeta;
  segments: TimelineEntry[];
}

export interface Config {
  projectStructure: 'v1';
  defaults?: {
    resolution?: [number, number];
    fps?: number;
    aspectRatio?: string;
  };
  transitions?: Record<string, () => Promise<{ default: Transition }>>;
}

export function defineConfig(config: Config): Config;     // identity, types help

export function buildSegmentLoaderMap(
  globResult: Record<string, () => Promise<unknown>>
): SegmentLoaderMap;

export function buildTransitionLoaderMap(
  config: Config
): TransitionLoaderMap;

export function validateTimeline(
  timeline: Timeline,
  segmentLoaders: SegmentLoaderMap,
  transitionLoaders: TransitionLoaderMap
): TimelineValidationResult;

export function applyMetaDefaults(
  timeline: Timeline,
  config: Config
): Timeline;

export type SegmentLoaderMap = Map<string, () => Promise<{ default: Segment }>>;
export type TransitionLoaderMap = Map<string, () => Promise<{ default: Transition }>>;

export type TimelineError =
  | { kind: 'missing-segment'; segmentId: string; timelineTitle: string }
  | { kind: 'missing-transition'; transitionName: string; segmentId: string }
  | { kind: 'missing-title'; }
  | { kind: 'malformed-segment-path'; path: string };

export type TimelineValidationResult =
  | { ok: true; timeline: Timeline }
  | { ok: false; errors: TimelineError[] };
```

## Internal Design

### `buildSegmentLoaderMap`

Input: `Record<string, () => Promise<...>>` from `import.meta.glob('/segments/*/index.ts')`.

```ts
export function buildSegmentLoaderMap(globResult: Record<string, ...>): SegmentLoaderMap {
  const map = new Map<string, () => Promise<{ default: Segment }>>();
  const errors: TimelineError[] = [];
  for (const path in globResult) {
    const m = path.match(/^\/segments\/([^/]+)\/index\.ts$/);
    if (!m) {
      errors.push({ kind: 'malformed-segment-path', path });
      continue;
    }
    const id = m[1];
    if (map.has(id)) {
      // Filesystem prevents path collisions, so this is paranoia. Throw if hit.
      throw new Error(`Duplicate segment id: ${id} (paths: ${path})`);
    }
    map.set(id, globResult[path] as any);
  }
  if (errors.length) {
    // Soft warning; map may still be useful.
    console.warn('buildSegmentLoaderMap: some paths skipped', errors);
  }
  return map;
}
```

The path regex is strict — only `/segments/<id>/index.ts` files are accepted. Extension is `.ts` because that's what Vite gives us in dev. Production builds (later phase) will adjust.

### `buildTransitionLoaderMap`

Combines built-in transitions (always present) with user-registered transitions from `config.transitions`:

```ts
export function buildTransitionLoaderMap(config: Config): TransitionLoaderMap {
  const map = new Map<string, () => Promise<{ default: Transition }>>();
  // Built-ins
  map.set('cut', () => import('./player/transitions/cut'));
  map.set('fade', () => import('./player/transitions/fade'));
  map.set('slideLeft', () => import('./player/transitions/slide').then(m => ({ default: m.slideLeft })));
  map.set('slideRight', () => import('./player/transitions/slide').then(m => ({ default: m.slideRight })));
  map.set('slideUp', () => import('./player/transitions/slide').then(m => ({ default: m.slideUp })));
  map.set('slideDown', () => import('./player/transitions/slide').then(m => ({ default: m.slideDown })));
  // User
  for (const [name, loader] of Object.entries(config.transitions ?? {})) {
    if (map.has(name)) {
      console.warn(`Custom transition "${name}" shadows a built-in.`);
    }
    map.set(name, loader);
  }
  return map;
}
```

### `validateTimeline`

Iterates `timeline.segments`, accumulates errors:

- For each entry: `id` must exist in `segmentLoaders`. If not → `missing-segment` error.
- For each entry with a `transition`: extract the name (string or object's `type`); must exist in `transitionLoaders`. If not → `missing-transition`.
- `meta.title` must be a non-empty string. If not → `missing-title`.

Render-mode-specific validation (every entry has `renderBeats`) lands when render mode lands; not implemented in v1.

Returns aggregate result. Player surfaces errors in the load-time error overlay; CLI prints to stderr.

### `applyMetaDefaults`

Returns a new Timeline with missing meta fields filled from `config.defaults`. Does not mutate.

```ts
export function applyMetaDefaults(timeline: Timeline, config: Config): Timeline {
  const d = config.defaults ?? {};
  return {
    ...timeline,
    meta: {
      ...timeline.meta,
      resolution: timeline.meta.resolution ?? d.resolution ?? [1920, 1080],
      fps: timeline.meta.fps ?? d.fps ?? 60,
      aspectRatio: timeline.meta.aspectRatio ?? d.aspectRatio ?? '16:9',
    },
  };
}
```

### `defineConfig`

Identity function with strict typing:

```ts
export function defineConfig(config: Config): Config { return config; }
```

Brand-checking (like Segment) is unnecessary here — config is consumed directly by the CLI, not loaded from a glob.

## Dependencies

**Depends on:**
- Types defined in this module.
- Built-in transitions (for the loader map default population).

**Depended on by:**
- `player.md` (uses all four functions).
- `cli.md` (uses `applyMetaDefaults`, `validateTimeline`, `buildSegmentLoaderMap` for `videowright script`).
- `script/script.md` (the helper) — actually `script()` is documented in architecture.md §12, simple enough to skip a dedicated component doc. It uses the loader map.

## Test Plan

### Unit (Vitest)

- `build_segment_map_simple`: glob with 3 paths → 3-entry map keyed by id.
- `build_segment_map_skips_malformed`: nonconforming path warned, rest still in map.
- `build_segment_map_throws_on_duplicate_id`: two entries for same id → throws (defensive; FS shouldn't allow it).
- `build_transition_map_has_builtins`: result contains 'cut', 'fade', 'slideLeft' through 'slideDown'.
- `build_transition_map_user_overrides_warn`: user transition named 'fade' → console warning, user wins.
- `build_transition_map_no_user_transitions`: empty config → only built-ins.
- `validate_passes_for_valid_timeline`: clean timeline → ok=true.
- `validate_missing_segment`: timeline with id 'foo' but no loader → missing-segment error with id 'foo' and timeline title.
- `validate_missing_transition_string`: transition 'morph' not registered → missing-transition error.
- `validate_missing_transition_object`: `{ type: 'morph' }` not registered → same error.
- `validate_missing_title`: meta without title → missing-title error.
- `validate_aggregates_multiple_errors`: timeline with multiple bad entries → all errors returned.
- `apply_meta_defaults_fills_missing`: timeline meta `{title}` only → result has resolution/fps/aspectRatio from config.
- `apply_meta_defaults_keeps_present`: timeline with explicit resolution → not overwritten.
- `apply_meta_defaults_falls_back_to_lib_default`: config without defaults → 1920x1080, 60fps, 16:9.
- `define_config_returns_input`: defineConfig is identity.
