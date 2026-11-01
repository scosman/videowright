// demo_v2's running order, as the video shows it to itself: the export beat's frame counter
// and player, and the voiceover beat's timeline. Each length is the segment's final advance in
// the default audio track (audio/tracks/v1/track.ts), so the counts are the render's own: it
// captures round(seconds × fps) frames per segment. A test keeps this table equal to the
// track; a re-timed take (Phase 6) updates both. No imports, so it is unit-testable.

export interface ProgramEntry {
	id: string;
	/** The short name the video's own tools show (the dev server's chips, the timeline). */
	name: string;
	seconds: number;
}

export const PROGRAM: readonly ProgramEntry[] = [
	{ id: "v2-cold-open", name: "cold-open", seconds: 7.33 },
	{ id: "v2-title-card", name: "title-card", seconds: 6.37 },
	{ id: "v2-web-tech-gallery", name: "gallery", seconds: 17.543 },
	{ id: "v2-interactive-dev", name: "live-dev", seconds: 5.785 },
	{ id: "v2-pixel-perfect-export", name: "export", seconds: 7.521 },
	{ id: "v2-voiceover-sync", name: "vo-sync", seconds: 8.922 },
	{ id: "v2-any-coding-agent", name: "agents", seconds: 3.737 },
	{ id: "v2-install-cta", name: "install", seconds: 10.65 },
];

export const FPS = 60;

const framesOf = (seconds: number, fps: number) => Math.round(seconds * fps);

/** Frames in the render of the whole video. */
export function frameCount(fps = FPS): number {
	return PROGRAM.reduce((n, e) => n + framesOf(e.seconds, fps), 0);
}

/** The video's length (s), frame-exact. */
export function videoSeconds(fps = FPS): number {
	return frameCount(fps) / fps;
}

/** Where segment `id` starts in the video (s), frame-exact, as the render schedules it. */
export function startOf(id: string, fps = FPS): number {
	const i = PROGRAM.findIndex((e) => e.id === id);
	if (i < 0) throw new Error(`not in the program: ${id}`);
	return PROGRAM.slice(0, i).reduce((n, e) => n + framesOf(e.seconds, fps), 0) / fps;
}
