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
  default_timing?: Timing;
  default_audio_track?: AudioTrack;
}
```

| Field | Required | Purpose |
|---|---|---|
| `meta` | Yes | Timeline-level metadata. |
| `segments` | Yes | Ordered array of segment entries. |
| `default_timing` | No | Standalone timing overrides. Used when no audio track is active. |
| `default_audio_track` | No | Default audio track for this video. See [audio.md](audio.md). |

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

## Timing and Voiceover types

### `Timing`

Per-segment advance schedule overrides. Used by voiceovers and as a standalone timing layer (`default_timing` on Timeline).

```ts
type Timing = {
  perSegment: Partial<Record<string, number[]>>;
};
```

Keys are segment ids; values are advance times in seconds (same units as `SegmentSpec.advances`). A Timing only needs to specify segments it wants to override -- unspecified segments fall back to their own `advances`.

### `AudioTrack`

A rendered audio track for a video. Stored at `videos/<video>/audio/tracks/<id>/track.ts`.

```ts
type AudioTrack = {
  audio_file: string;
  length_s: number;
  timing: Timing;
  audio_plan_path?: string;
  plan_snapshot_path?: string;
  created_at?: string;
  notes?: string;
};
```

| Field | Required | Purpose |
|---|---|---|
| `audio_file` | Yes | Audio file path, relative to the **video folder** (directory containing `timeline.ts`). E.g., `"./audio/tracks/v1/track.mp3"`. Rewritten to absolute by `loadAudioTrack()`. |
| `length_s` | Yes | Length of the rendered audio in seconds. |
| `timing` | Yes | Per-segment advance timing synced to this audio track. |
| `audio_plan_path` | No | Path to the audio plan that produced this track, relative to `track.ts`. |
| `plan_snapshot_path` | No | Path to the point-in-time plan snapshot, relative to `track.ts`. |
| `created_at` | No | ISO timestamp when this track was rendered. |
| `notes` | No | Freeform notes about this track. |

See [audio.md](audio.md) for the audio workflow.

### `Voiceover`

A single voiceover source file. Stored at `videos/<video>/audio/originals/voiceovers/<slug>/voiceover.ts`. Voiceovers are source data used to build audio tracks -- they are not directly referenced by `timeline.ts`.

```ts
type Voiceover = {
  audio_file: string;
  provider: "elevenlabs" | "manual";
  provider_timing_file?: string;
  timing: Timing;
  notes?: string;
  eleven_labs_voice_id?: string;
};
```

| Field | Required | Purpose |
|---|---|---|
| `audio_file` | Yes | Audio file path, relative to `voiceover.ts` directory. |
| `provider` | Yes | Provider that produced the audio. |
| `provider_timing_file` | No | Provider timing JSON path, relative to `voiceover.ts` directory. |
| `timing` | Yes | Per-segment advance timing synced to this audio. |
| `notes` | No | Freeform notes about this voiceover. |
| `eleven_labs_voice_id` | No | ElevenLabs voice ID for TTS generation. Defaults to Asher (`tMvyQtpCVQ0DkixuYm6J`) when omitted. Ignored when provider is `"manual"`. |

See [audio/voiceover.md](audio/voiceover.md) for the full voiceover flow and file conventions.

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
