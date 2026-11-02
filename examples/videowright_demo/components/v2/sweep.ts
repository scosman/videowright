import { css, ms } from "./motion.js";

// The style's signature sweep (transitions/me-sweep.ts), local to a region of a scene: a cyan
// beam with a tick ruler on its leading edge crosses the region and reveals the incoming layer
// behind it while the outgoing one dims. Used for sub-scene switches inside one segment (the
// gallery's demos) and, vertically, for a browser's hot-reload refresh.

export interface SweepRegion {
	/** The region in the beam parent's px (the layers must cover exactly this region). */
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface SweepOptions {
	/** "x": left to right (default); "y": top to bottom. */
	axis?: "x" | "y";
	delay?: number;
	duration?: number;
}

const tint = (pct: number) => `color-mix(in srgb, var(--cyan) ${pct}%, transparent)`;

function beamFor(axis: "x" | "y", length: number): HTMLElement {
	const beam = document.createElement("div");
	const across = axis === "x";
	// The beam is a line across the region; its trail lies behind it, over the revealed side.
	beam.style.cssText = across
		? `position:absolute; left:0; top:0; width:0; height:${length}px; z-index:30; pointer-events:none; opacity:0`
		: `position:absolute; left:0; top:0; width:${length}px; height:0; z-index:30; pointer-events:none; opacity:0`;
	beam.innerHTML = across
		? `
		<div style="position:absolute; top:0; bottom:0; right:0; width:200px; background:linear-gradient(to left, ${tint(14)}, transparent)"></div>
		<div style="position:absolute; top:0; bottom:0; left:6px; width:16px; background:repeating-linear-gradient(to bottom, ${tint(70)} 0 2px, transparent 2px 40px)"></div>
		<div style="position:absolute; top:0; bottom:0; left:-2px; width:4px; background:var(--cyan); box-shadow:0 0 16px 2px ${tint(50)}, 0 0 56px 8px ${tint(18)}"></div>
		<div style="position:absolute; top:0; bottom:0; left:-1px; width:2px; background:var(--color-fg)"></div>`
		: `
		<div style="position:absolute; left:0; right:0; bottom:0; height:160px; background:linear-gradient(to top, ${tint(14)}, transparent)"></div>
		<div style="position:absolute; left:0; right:0; top:-2px; height:4px; background:var(--cyan); box-shadow:0 0 16px 2px ${tint(50)}, 0 0 56px 8px ${tint(18)}"></div>
		<div style="position:absolute; left:0; right:0; top:-1px; height:2px; background:var(--color-fg)"></div>`;
	return beam;
}

/**
 * Sweeps `incoming` in over `outgoing` across `region`. The incoming layer is hidden (clipped)
 * from now until the beam passes; the outgoing one is clipped away by the same edge (dimming as
 * it goes) and hidden once the sweep is done. Returns the sweep's end, in ms from now.
 */
export function sweepReveal(
	beamParent: HTMLElement,
	incoming: HTMLElement,
	outgoing: HTMLElement | null,
	region: SweepRegion,
	opts: SweepOptions = {},
): number {
	const axis = opts.axis ?? "x";
	const delay = opts.delay ?? 0;
	const duration = opts.duration ?? (ms("--dur-sweep") || 640);
	const easing = css("--ease-sweep");
	const timing = { duration, delay, easing, fill: "both" as const };
	const across = axis === "x";

	incoming.style.visibility = "";
	incoming.animate(
		[
			{ clipPath: across ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)" },
			{ clipPath: "inset(0 0 0 0)" },
		],
		timing,
	);
	const beam = beamFor(axis, across ? region.h : region.w);
	beamParent.appendChild(beam);
	const from = `translate(${region.x}px, ${region.y}px)`;
	const to = across
		? `translate(${region.x + region.w}px, ${region.y}px)`
		: `translate(${region.x}px, ${region.y + region.h}px)`;
	beam.animate([{ transform: from }, { transform: to }], timing);
	beam.animate(
		[{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }],
		{ duration, delay, fill: "both" },
	);
	if (outgoing) {
		// The outgoing layer is cut away by the same edge, so the beam is the only seam: nothing
		// of it shows through the incoming layer's translucent surfaces.
		outgoing.animate(
			[
				{ clipPath: "inset(0 0 0 0)" },
				{ clipPath: across ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)" },
			],
			timing,
		);
		outgoing.animate([{ filter: "brightness(1)" }, { filter: "brightness(0.7)" }], timing);
		// Hidden once covered, so nothing keeps painting (or rendering) under the new layer.
		outgoing.animate([{ visibility: "visible" }, { visibility: "hidden" }], {
			duration: 1,
			delay: delay + duration,
			fill: "forwards",
		});
	}
	setTimeout(() => beam.remove(), delay + duration + 50);
	return delay + duration;
}
