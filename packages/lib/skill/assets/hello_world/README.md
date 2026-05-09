# Hello Videowright

A starter video created during Videowright setup.

## Segments

- **hello-intro** -- Title card with animated entrance
- **placeholder-sample** -- Style token showcase (from the placeholder style pack)
- **hello-outro** -- Closing card with call to action

## Running

```bash
npx videowright dev
```

The dev server auto-discovers the most recent timeline. To target this video explicitly:

```bash
npx videowright dev videos/hello_videowright/timeline.ts
```

## Editing

- Edit segments in `segments/` -- each segment has its own folder with an `index.ts`
- Add new segments to `segments/<id>/index.ts` and wire them in `timeline.ts`
- The dev server reloads automatically on file changes
- See `PLAN.md` for the video's design and history
