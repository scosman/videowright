import type { PlayerContext } from "videowright";

// Footage in a segment: a muted <video> (an earlier render, cut to a VP9 WebM) driven by the
// segment clock. In a render it stays paused and is seeked to the frame for each virtual
// frame, and the frame's capture waits for the seek (ctx.deferFrame), so every frame shows
// exactly the source frame it should. In the dev player it simply plays.

export interface ClipOptions {
	/** The clip's URL (import it: `import url from "./clip.webm"`). */
	src: string;
	/** The clip's frame rate. */
	fps?: number;
}

export interface Clip {
	el: HTMLVideoElement;
	/** Resolves once the first frame is decoded and shown. Await it in mount(). */
	ready: Promise<void>;
	/** Starts playback from the clip's start, at the segment clock's current time. */
	start(ctx: PlayerContext): void;
}

export function createClip(host: HTMLElement, opts: ClipOptions): Clip {
	const fps = opts.fps ?? 60;
	const el = document.createElement("video");
	el.muted = true;
	el.playsInline = true;
	el.preload = "auto";
	el.style.cssText =
		"position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block";
	el.src = opts.src;
	host.appendChild(el);

	const seekTo = (s: number) =>
		new Promise<void>((resolve) => {
			el.addEventListener("seeked", () => resolve(), { once: true });
			el.currentTime = s;
		});

	const ready = new Promise<void>((resolve, reject) => {
		el.addEventListener("error", () => reject(new Error(`clip failed to load: ${opts.src}`)), {
			once: true,
		});
		el.addEventListener("loadeddata", () => void seekTo(0.5 / fps).then(resolve), { once: true });
	});

	return {
		el,
		ready,
		start(ctx) {
			if (ctx.mode === "interactive") {
				el.currentTime = 0;
				void el.play().catch(() => {});
				ctx.signal.addEventListener("abort", () => el.pause(), { once: true });
				return;
			}
			const t0 = ctx.clock();
			let shown = 0;
			const last = Math.max(0, Math.floor(el.duration * fps) - 1);
			const tick = () => {
				if (ctx.signal.aborted) return;
				const frame = Math.min(last, Math.floor(((ctx.clock() - t0) / 1000) * fps + 1e-6));
				if (frame !== shown) {
					shown = frame;
					// The middle of the frame, never its edge.
					ctx.deferFrame(seekTo((frame + 0.5) / fps));
				}
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		},
	};
}
