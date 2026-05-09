# Types

Quick reference for Videowright's public TypeScript types. All types are importable from `'videowright'`.

## Segment types

### `SegmentSpec`

The spec object passed to `defineSegment()`.

```ts
interface SegmentSpec {
  id: string;
  advances: number[];
  voiceover?: string;
  notes?: string;
  mount?(el: HTMLElement, ctx: PlayerContext): void | Promise<void>;
  play(ctx: PlayerContext): Promise<void>;
  unmount?(): void;
  next?(): boolean;
  prev?(): boolean;
}
```

See [authoring_segment.md](authoring_segment.md) for field details.

### `Segment`

The branded object returned by `defineSegment()`. Extends `SegmentSpec` with an internal brand symbol. Frozen and immutable.

```ts
interface Segment extends SegmentSpec {
  readonly [SEGMENT_BRAND]: true;
}
```

### `PlayerContext`

Runtime context passed to `mount` and `play` lifecycle methods.

```ts
interface PlayerContext {
  waitForNext(): Promise<void>;
  hold(ms: number): Promise<void>;
  signal: AbortSignal;
  mode: 'interactive' | 'render';
  clock(): number;
}
```

## Timeline types

### `Timeline`

A complete timeline definition. Default export of a video's `timeline.ts`.

```ts
interface Timeline {
  meta: TimelineMeta;
  segments: TimelineEntry[];
}
```

### `TimelineMeta`

Timeline-level metadata.

```ts
interface TimelineMeta {
  title: string;
  style?: string;
  aspectRatio?: string;
  resolution?: [number, number];
  fps?: number;
}
```

| Field | Required | Purpose |
|---|---|---|
| `title` | Yes | Video title. |
| `style` | No | Style slug for this video. Overrides `config.defaultStyle`. Must match a folder in `styles/`. |
| `aspectRatio` | No | Aspect ratio string (e.g., `'16:9'`). Falls back to config default, then `'16:9'`. |
| `resolution` | No | `[width, height]` in pixels. Falls back to config default, then `[1920, 1080]`. |
| `fps` | No | Frames per second. Falls back to config default, then `60`. |

### `TimelineEntry`

A single entry in a timeline's segments array.

```ts
interface TimelineEntry {
  id: string;
  transition?: string | { type: string; [k: string]: unknown };
}
```

| Field | Required | Purpose |
|---|---|---|
| `id` | Yes | Segment id. Maps to `segments/<id>/index.ts`. |
| `transition` | No | Transition when entering this segment. String name (e.g., `'fade'`) or config object. |

Built-in transitions: `cut`, `fade`, `slideLeft`, `slideRight`, `slideUp`, `slideDown`.

## Transition types

### `Transition`

A transition function that animates between two slot elements.

```ts
type Transition = (
  outgoing: HTMLElement,
  incoming: HTMLElement,
  ctx: TransitionContext,
) => Promise<void>;
```

### `TransitionContext`

Context passed to transition functions.

```ts
interface TransitionContext {
  direction: 'forward' | 'backward';
  duration?: number;
}
```

## Config types

### `Config`

Repo-wide configuration from `videowright.config.ts`. Authored via `defineConfig()`.

```ts
interface Config {
  projectStructure: 'v1';
  defaultStyle?: string;
  defaults?: {
    resolution?: [number, number];
    fps?: number;
    aspectRatio?: string;
  };
  transitions?: Record<string, () => Promise<{ default: Transition }>>;
}
```

| Field | Required | Purpose |
|---|---|---|
| `projectStructure` | Yes | Layout version marker. Always `'v1'`. |
| `defaultStyle` | After setup | Slug of the default style in `styles/<slug>/`. Required once setup completes. Empty or missing = setup gate open. |
| `defaults` | No | Default values for timeline meta fields (resolution, fps, aspectRatio). |
| `transitions` | No | Custom transition loaders keyed by name. Shadows built-ins if names collide. |

## Functions

### `defineSegment(spec: SegmentSpec): Segment`

Validates and brands a segment spec. Throws `TypeError` if `id`, `play`, or `advances` is missing or invalid.

### `defineConfig(config: Config): Config`

Identity function for typed config authoring. Provides autocomplete and type checking for `videowright.config.ts`.
