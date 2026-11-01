import { lockOn } from "../../components/v2/hud.js";
import { type Ticker, css, draw, ms, svg, tidy } from "../../components/v2/motion.js";

// Demo 1, animated SVG: a gear train drawn like a blueprint. Every gear is generated (teeth,
// hub, bore and keyway, lightening holes), drawn in stroke by stroke, filled, then turned:
// meshed, each at the speed its tooth ratio says. Construction lines (pitch circles, centre
// marks) and the tooth counts are the HUD's cyan; the drive gear takes the amber lock.
// The geometry is pure (no DOM), so the mesh is unit-tested.

export interface GearSpec {
	teeth: number;
	/** The gear it meshes with (index into the train; omit for the first, the drive gear). */
	from?: number;
	/** Direction from that gear's centre to this one's (deg; SVG axes, 0 = right, 90 = down). */
	angle?: number;
}

export interface Gear {
	cx: number;
	cy: number;
	teeth: number;
	/** Pitch radius. */
	r: number;
	/** Angle (deg) of tooth 0's centre at rest. */
	phase: number;
	/** Angular speed as a multiple of the drive gear's (negative: the other way round). */
	ratio: number;
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const mod = (v: number, m: number) => ((v % m) + m) % m;

/**
 * Lays out a meshing train: each gear sits at the sum of the two pitch radii from the gear it
 * meshes with, turns the other way at the inverse tooth ratio, and is phased so that a gap
 * faces its neighbour's tooth on the line of centres. In tooth pitches, with u the offset of
 * the line of centres from a gear's tooth 0, meshing gears satisfy u_a + u_b ≡ ½ (mod 1),
 * which stays true as they turn.
 */
export function gearTrain(
	first: { x: number; y: number; phase?: number },
	specs: readonly GearSpec[],
	module: number,
): Gear[] {
	const gears: Gear[] = [];
	specs.forEach((spec, i) => {
		const r = (module * spec.teeth) / 2;
		if (i === 0 || spec.from === undefined) {
			gears.push({
				cx: first.x,
				cy: first.y,
				teeth: spec.teeth,
				r,
				phase: first.phase ?? 0,
				ratio: 1,
			});
			return;
		}
		const a = gears[spec.from];
		const theta = spec.angle ?? 0;
		const d = a.r + r;
		const uA = mod(((theta - a.phase) * a.teeth) / 360, 1);
		gears.push({
			cx: a.cx + d * Math.cos(rad(theta)),
			cy: a.cy + d * Math.sin(rad(theta)),
			teeth: spec.teeth,
			r,
			phase: mod(theta + 180 - (360 / spec.teeth) * (0.5 - uA), 360),
			ratio: (-a.ratio * a.teeth) / spec.teeth,
		});
	});
	return gears;
}

/** Tooth outline (closed path, centred on the gear, at rest): trapezoid teeth on arcs. */
export function gearOutline(g: Gear, module: number): string {
	const tip = g.r + module;
	const root = g.r - 1.25 * module;
	const pitch = 360 / g.teeth;
	const pt = (radius: number, deg: number) =>
		`${(g.cx + radius * Math.cos(rad(deg))).toFixed(2)} ${(g.cy + radius * Math.sin(rad(deg))).toFixed(2)}`;
	let d = "";
	for (let k = 0; k < g.teeth; k++) {
		const c = g.phase + k * pitch;
		if (k === 0) d += `M${pt(root, c - pitch / 2)}`;
		d += `A${root} ${root} 0 0 1 ${pt(root, c - pitch * 0.27)}`;
		d += `L${pt(tip, c - pitch * 0.14)}`;
		d += `A${tip} ${tip} 0 0 1 ${pt(tip, c + pitch * 0.14)}`;
		d += `L${pt(root, c + pitch * 0.27)}`;
		d += `A${root} ${root} 0 0 1 ${pt(root, c + pitch / 2)}`;
	}
	return `${d}Z`;
}

/** The train shown: drive gear on the left, a branch off the third gear. */
export const MODULE = 11;
export const TRAIN: readonly GearSpec[] = [
	{ teeth: 36 },
	{ teeth: 18, from: 0, angle: -35 },
	{ teeth: 28, from: 1, angle: 20 },
	{ teeth: 12, from: 2, angle: -50 },
	{ teeth: 22, from: 2, angle: 60 },
];

/** Where each gear's tooth count sits (demo px, anchor), clear of every outline. */
const TRAIN_LABELS: ReadonlyArray<[number, number, "start" | "middle" | "end"]> = [
	[300, 694, "middle"],
	[543, 134, "middle"],
	[640, 562, "middle"],
	[1012, 188, "start"],
	[772, 682, "end"],
];

/** The drive gear's speed (deg/s) once spun up, and how long the spin-up takes (ms). */
const DRIVE = 34;
const SPIN_UP = 900;

export interface GearsDemo {
	layer: HTMLElement;
	gears: Gear[];
	/** Starts the drawing `delay` ms from now; the train turns once it is drawn. */
	play(ticker: Ticker, delay: number): void;
	/** Stops turning `delay` ms from now (once a sweep has covered it). */
	stopAfter(delay: number): void;
}

export function createGears(parent: HTMLElement): GearsDemo {
	const layer = document.createElement("div");
	layer.className = "v2-demo";
	parent.appendChild(layer);
	const root = svg(layer, "svg", {
		width: 1100,
		height: 800,
		viewBox: "0 0 1100 800",
		style: "position:absolute; left:0; top:0; overflow:visible",
	});
	const gears = gearTrain({ x: 300, y: 432, phase: 4 }, TRAIN, MODULE);
	const construction = svg(root, "g", {
		fill: "none",
		stroke: "var(--cyan)",
		"stroke-width": 1.5,
		opacity: 0.7,
	});
	const bodies = svg(root, "g", {});
	const labels = svg(root, "g", {});

	interface Built {
		gear: Gear;
		spin: SVGGElement;
		outline: SVGPathElement;
		details: SVGGeometryElement[];
		pitch: SVGCircleElement;
		cross: SVGPathElement;
		label: SVGTextElement;
	}
	const built: Built[] = gears.map((gear, i) => {
		const pitch = svg(construction, "circle", {
			cx: gear.cx,
			cy: gear.cy,
			r: gear.r,
			"stroke-dasharray": "10 10",
		});
		const hub = Math.max(26, gear.r * 0.22);
		const c = hub + 16;
		const cross = svg(construction, "path", {
			d: `M${gear.cx - c} ${gear.cy}H${gear.cx + c}M${gear.cx} ${gear.cy - c}V${gear.cy + c}`,
		});
		const spin = svg(bodies, "g", {});
		const outline = svg(spin, "path", {
			d: gearOutline(gear, MODULE),
			fill: "var(--surface-2)",
			"fill-opacity": 0,
			stroke: "var(--color-fg)",
			"stroke-width": 2.5,
			"stroke-linejoin": "round",
		});
		const stroke = { fill: "none", stroke: "var(--fg-2)", "stroke-width": 2 };
		const details: SVGGeometryElement[] = [
			svg(spin, "circle", { cx: gear.cx, cy: gear.cy, r: hub, ...stroke }),
			// The bore, and its keyway: a notch on the bore's rim.
			svg(spin, "circle", { cx: gear.cx, cy: gear.cy, r: hub * 0.42, ...stroke }),
			svg(spin, "path", {
				d: `M${gear.cx - hub * 0.12} ${gear.cy - hub * 0.4}V${gear.cy - hub * 0.6}H${gear.cx + hub * 0.12}V${gear.cy - hub * 0.4}`,
				...stroke,
			}),
		];
		const root = gear.r - 1.25 * MODULE;
		if (root - hub > 70) {
			// Lightening holes between the hub and the rim.
			const ring = (hub + root) / 2;
			const holes = gear.teeth > 30 ? 6 : 5;
			const size = Math.min((root - hub) * 0.3, (Math.PI * ring) / holes - 12);
			for (let h = 0; h < holes; h++) {
				const a = rad(gear.phase + (h * 360) / holes);
				details.push(
					svg(spin, "circle", {
						cx: gear.cx + ring * Math.cos(a),
						cy: gear.cy + ring * Math.sin(a),
						r: size,
						...stroke,
					}),
				);
			}
		}
		// Tooth count, set in the free space beside each gear (TRAIN_LABELS).
		const [lx, ly, anchor] = TRAIN_LABELS[i];
		const label = svg(labels, "text", {
			x: lx,
			y: ly,
			"text-anchor": anchor,
			fill: "var(--cyan)",
			class: "me-readout",
		});
		label.textContent = `Z${gear.teeth}${i === 0 ? " · DRIVE" : ""}`;
		return { gear, spin, outline, details, pitch, cross, label };
	});

	let stopped = false;
	const play = (ticker: Ticker, delay: number) => {
		const settle = css("--ease-settle");
		// Draw: outlines in reading order, then their hubs and holes; construction lines rotate
		// in around each centre.
		built.forEach((b, i) => {
			const at = delay + i * 110;
			draw(b.outline, at, 820);
			b.details.forEach((p, j) => draw(p, at + 360 + j * 40, 420));
			for (const node of [b.pitch, b.cross]) {
				node.style.transformBox = "view-box";
				node.style.transformOrigin = `${b.gear.cx}px ${b.gear.cy}px`;
				node.animate(
					[
						{ opacity: 0, transform: "rotate(-40deg) scale(0.92)" },
						{ opacity: 1, transform: "none" },
					],
					{ duration: 700, delay: at + 120, easing: settle, fill: "both" },
				);
			}
			// Fill: the body takes its surface once the outline is down.
			b.outline.animate([{ fillOpacity: 0 }, { fillOpacity: 0.92 }], {
				duration: ms("--dur-normal"),
				delay: at + 640,
				fill: "both",
			});
			b.label.animate(
				[
					{ opacity: 0, transform: "translateY(14px)" },
					{ opacity: 1, transform: "none" },
				],
				{ duration: ms("--dur-normal"), delay: at + 700, easing: settle, fill: "both" },
			);
		});
		const lead = built[0].gear;
		lockOn(root, lead.cx, lead.cy, delay + 980, 30);
		// Turn: one clock for the whole train, so the mesh holds on every frame. The drive spins
		// up over SPIN_UP (quadratic ease-in), then turns at DRIVE deg/s.
		const startAt = ticker.now() + delay + 520;
		ticker.add((t) => {
			const s = Math.max(0, tidy(t - startAt));
			const angle =
				s < SPIN_UP ? (DRIVE * s * s) / (2 * SPIN_UP * 1000) : (DRIVE * (s - SPIN_UP / 2)) / 1000;
			for (const b of built) {
				b.spin.setAttribute(
					"transform",
					`rotate(${(angle * b.gear.ratio).toFixed(3)} ${b.gear.cx.toFixed(2)} ${b.gear.cy.toFixed(2)})`,
				);
			}
			return !stopped && layer.isConnected;
		});
	};

	const stopAfter = (delay: number) => {
		setTimeout(() => {
			stopped = true;
		}, delay);
	};
	return { layer, gears, play, stopAfter };
}
