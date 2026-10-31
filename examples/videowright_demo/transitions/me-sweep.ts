import type { Transition } from "videowright";

// Motion Engineering signature sweep: a cyan scanline crosses the frame and the incoming
// scene is revealed behind it, as if the instrument redraws its readout. The tick ruler on
// the beam's leading edge lands on the 40px grid. Reverses for backward navigation.
const meSweep: Transition = async (outgoing, incoming, ctx) => {
	const root = getComputedStyle(document.documentElement);
	const token = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;
	const duration = ctx.duration ?? (Number.parseFloat(token("--dur-sweep", "640ms")) || 640);
	const easing = token("--ease-sweep", "cubic-bezier(0.45, 0, 0.55, 1)");
	const host = incoming.parentElement ?? incoming;
	const width = host.clientWidth;
	const forward = ctx.direction !== "backward";
	const hidden = forward ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
	// Hide the incoming scene before anything can paint it unclipped.
	incoming.style.clipPath = hidden;

	const cyan = "var(--cyan, #5bd8f5)";
	const tint = (pct: number) => `color-mix(in srgb, ${cyan} ${pct}%, transparent)`;
	const beam = document.createElement("div");
	beam.style.cssText =
		"position:absolute;top:0;bottom:0;left:0;width:0;z-index:3;pointer-events:none";
	const trail = forward
		? "right:0;background:linear-gradient(to left,"
		: "left:0;background:linear-gradient(to right,";
	const ticks = forward ? "left:6px" : "right:6px";
	beam.innerHTML = `
		<div style="position:absolute;top:0;bottom:0;${trail}${tint(14)},transparent);width:240px"></div>
		<div style="position:absolute;top:0;bottom:0;${ticks};width:16px;background:repeating-linear-gradient(to bottom,${tint(70)} 0 2px,transparent 2px 40px);background-position:0 20px"></div>
		<div style="position:absolute;top:0;bottom:0;left:-2px;width:4px;background:${cyan};box-shadow:0 0 16px 2px ${tint(50)},0 0 56px 8px ${tint(18)}"></div>
		<div style="position:absolute;top:0;bottom:0;left:-1px;width:2px;background:var(--color-fg, #e6f5fa)"></div>`;
	host.appendChild(beam);

	outgoing.style.zIndex = "1";
	incoming.style.zIndex = "2";
	const timing = { duration, easing, fill: "forwards" as const };
	const [x0, x1] = forward ? [0, width] : [width, 0];

	try {
		await Promise.all([
			incoming.animate([{ clipPath: hidden }, { clipPath: "inset(0 0 0 0)" }], timing).finished,
			beam.animate(
				[{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1}px)` }],
				timing,
			).finished,
			// Fade the beam in and out at the frame edges so it never pops.
			beam.animate(
				[{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }],
				{ duration, fill: "forwards" },
			).finished,
			outgoing.animate([{ filter: "brightness(1)" }, { filter: "brightness(0.75)" }], timing)
				.finished,
		]);
	} finally {
		beam.remove();
		incoming.style.clipPath = "";
		outgoing.style.zIndex = "";
		incoming.style.zIndex = "";
	}
};

export default meSweep;
