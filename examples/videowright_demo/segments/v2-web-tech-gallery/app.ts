import { BROWSER_BAR, createBrowser } from "../../components/v2/browser.js";
import { tickTo } from "../../components/v2/hud.js";
import { type Ticker, css, draw, ms, svg, tidy } from "../../components/v2/motion.js";
import type { Box } from "../../components/v2/stage.js";

// Demo 4, a real product UI: a shadcn-style SaaS app (Acme Inc) in a light browser window, at
// legible scale (Inter, the app's own face; UI text 22px and up). It is used, not shown: the
// dashboard's KPIs tick and its chart draws; a cursor opens Customers, adds a note to a row and
// sends it; a toast confirms. A camera frames the region being used (the window scales inside
// the demo viewport, never shrunk below 1x), and rests before the payoff.

const W = 1100;
const H = 800;
const SIDE = 250;
/** The page area's origin in the demo's px (right of the sidebar, under the browser bar). */
const PAGE = { x: SIDE + 40, y: BROWSER_BAR + 34 } as const;

const NAV = [
	{ name: "Dashboard", icon: "M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-3H4z" },
	{
		name: "Customers",
		icon: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8",
	},
	{ name: "Invoices", icon: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8" },
	{
		name: "Settings",
		icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1",
	},
];

const KPIS = [
	{
		label: "Revenue",
		value: 48210,
		format: (v: number) => `$${Math.round(v).toLocaleString("en-US")}`,
		delta: "+12.4%",
	},
	{
		label: "Customers",
		value: 1284,
		format: (v: number) => Math.round(v).toLocaleString("en-US"),
		delta: "+4.1%",
	},
	{ label: "Churn", value: 1.9, format: (v: number) => `${v.toFixed(1)}%`, delta: "−0.3%" },
];

const CUSTOMERS = [
	{ name: "Initech", email: "it@initech.io", status: "Active", mrr: "$1,150", tone: "#7c3aed" },
	{
		name: "Globex Corp",
		email: "ops@globex.com",
		status: "Active",
		mrr: "$4,200",
		tone: "#2563eb",
	},
	{ name: "Hooli", email: "team@hooli.xyz", status: "Trial", mrr: "$890", tone: "#0891b2" },
	{ name: "Soylent", email: "hello@soylent.co", status: "At risk", mrr: "$640", tone: "#db2777" },
	{ name: "Vandelay", email: "art@vandelay.com", status: "Active", mrr: "$2,300", tone: "#ea580c" },
];
/** The row the cursor acts on. */
const TARGET = 1;
export const NOTE = "Renewal call booked for Friday.";
/** customers()'s steps up to the open composer, at their natural pace (ms). */
const LEAD_MS = 1480;

const REVENUE = [21, 24, 23, 27, 30, 29, 33, 36, 35, 40, 44, 48];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const STYLE = `
	.acme { position:absolute; inset:0; font-family:"Inter", sans-serif; color:#09090b; background:#fff; -webkit-font-smoothing:antialiased; font-feature-settings:"cv11" 1, "tnum" 1; }
	.acme-side { position:absolute; left:0; top:0; bottom:0; width:${SIDE}px; background:#fafafa; border-right:1px solid #e4e4e7; }
	.acme-logo { position:absolute; left:28px; top:28px; display:flex; gap:14px; align-items:center; font-size:28px; font-weight:650; letter-spacing:-0.01em; }
	.acme-logo i { width:44px; height:44px; border-radius:11px; background:#18181b; color:#fff; font-style:normal; display:grid; place-items:center; font-size:26px; font-weight:700; }
	.acme-nav { position:absolute; left:16px; right:16px; height:56px; display:flex; gap:14px; align-items:center; padding:0 14px; border-radius:10px; font-size:26px; font-weight:500; color:#52525b; }
	.acme-nav svg { flex:none; }
	.acme-nav.on { background:#f0f0f2; color:#09090b; }
	.acme-page { position:absolute; left:${SIDE}px; top:0; right:0; bottom:0; }
	.acme-title { position:absolute; left:40px; top:34px; font-size:44px; font-weight:680; letter-spacing:-0.025em; }
	.acme-sub { font-size:22px; color:#71717a; font-weight:450; }
	.acme-card { position:absolute; box-sizing:border-box; border:1px solid #e4e4e7; border-radius:14px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
	.acme-label { font-size:22px; font-weight:520; color:#71717a; }
	.acme-chip { display:inline-flex; align-items:center; gap:8px; height:34px; padding:0 12px; border-radius:17px; font-size:22px; font-weight:560; }
	.acme-btn { position:absolute; display:flex; align-items:center; justify-content:center; gap:10px; height:48px; padding:0 20px; border-radius:10px; font-size:22px; font-weight:580; box-sizing:border-box; }
	.acme-btn.dark { background:#18181b; color:#fafafa; }
	.acme-btn.ghost { border:1px solid #e4e4e7; color:#18181b; background:#fff; }
	.acme-row { position:absolute; left:0; right:0; height:76px; border-top:1px solid #f0f0f2; }
	.acme-avatar { position:absolute; left:24px; top:16px; width:44px; height:44px; border-radius:50%; color:#fff; display:grid; place-items:center; font-size:22px; font-weight:650; }
`;

const icon = (d: string, size = 26) =>
	`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const STATUS: Record<string, string> = {
	Active: "color:#15803d; background:#dcfce7",
	Trial: "color:#1d4ed8; background:#dbeafe",
	"At risk": "color:#b91c1c; background:#fee2e2",
};

export interface AppDemo {
	layer: HTMLElement;
	/** The dashboard: cards rise, KPIs tick, the chart draws; the cursor heads for Customers. */
	dashboard(ticker: Ticker, delay: number): void;
	/**
	 * Cue "rendered": open Customers, frame the table, open the note on a row and type it, paced
	 * to fill `windowMs`, the time until the next cue ("If").
	 */
	customers(ticker: Ticker, windowMs: number): void;
	/** Cue "If": send the note; the toast confirms; the camera rests. */
	send(): void;
	/** The cursor leaves (the payoff is the claim, not the app). */
	idle(): void;
}

interface Camera {
	tx: number;
	ty: number;
	s: number;
}

export function createApp(parent: HTMLElement): AppDemo {
	const layer = document.createElement("div");
	layer.className = "v2-demo";
	parent.appendChild(layer);
	const browser = createBrowser(layer, {
		x: 0,
		y: 0,
		w: W,
		h: H,
		url: "app.acme.com/dashboard",
		theme: "light",
	});
	const win = browser.root;
	win.style.transformOrigin = "0 0";
	const view = browser.viewport;

	const nav = NAV.map(
		(item, i) =>
			`<div class="acme-nav${i === 0 ? " on" : ""}" data-ref="nav-${i}" style="top:${120 + i * 64}px">${icon(item.icon)}${item.name}</div>`,
	).join("");
	const kpis = KPIS.map(
		(k, i) => `
			<div class="acme-card" data-ref="kpi-${i}" style="left:${40 + i * 263}px; top:116px; width:243px; height:160px">
				<div class="acme-label" style="position:absolute; left:22px; top:22px">${k.label}</div>
				<div data-ref="kpi-value-${i}" style="position:absolute; left:20px; top:54px; font-size:44px; font-weight:680; letter-spacing:-0.02em">${k.format(0)}</div>
				<span class="acme-chip" style="position:absolute; left:20px; top:110px; color:#15803d; background:#dcfce7">${k.delta}</span>
			</div>`,
	).join("");
	const rows = CUSTOMERS.map(
		(c, i) => `
			<div class="acme-row" data-ref="row-${i}" style="top:${52 + i * 76}px">
				<div class="acme-avatar" style="background:${c.tone}">${c.name[0]}</div>
				<div style="position:absolute; left:84px; top:9px; font-size:26px; font-weight:620">${c.name}</div>
				<div class="acme-sub" style="position:absolute; left:84px; top:41px">${c.email}</div>
				<span class="acme-chip" style="position:absolute; left:372px; top:21px; ${STATUS[c.status]}">${c.status}</span>
				<div style="position:absolute; left:520px; top:21px; font-size:26px; font-weight:560">${c.mrr}</div>
				<div class="acme-btn ghost" data-ref="note-${i}" style="right:20px; top:14px; height:48px; padding:0 16px">${icon("M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", 22)}Note</div>
			</div>`,
	).join("");

	view.innerHTML = `
		<style>${STYLE}</style>
		<div class="acme">
			<div class="acme-side">
				<div class="acme-logo"><i>A</i>Acme Inc</div>
				${nav}
			</div>
			<div class="acme-page" data-ref="dashboard">
				<div class="acme-title">Dashboard</div>
				<span class="acme-chip" style="position:absolute; right:40px; top:44px; border:1px solid #e4e4e7; color:#3f3f46">Last 30 days</span>
				${kpis}
				<div class="acme-card" data-ref="chart" style="left:40px; top:300px; width:770px; height:400px">
					<div style="position:absolute; left:24px; top:22px; font-size:26px; font-weight:640">Revenue</div>
					<div class="acme-sub" style="position:absolute; left:24px; top:58px">Monthly recurring, $k</div>
				</div>
			</div>
			<div class="acme-page" data-ref="customers" style="visibility:hidden">
				<div class="acme-title">Customers</div>
				<div class="acme-btn dark" style="right:40px; top:38px">${icon("M12 5v14M5 12h14", 22)}Add customer</div>
				<div class="acme-card" style="left:40px; top:118px; width:380px; height:52px; display:flex; gap:12px; align-items:center; padding:0 18px; color:#a1a1aa; font-size:22px">${icon("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3", 22)}Search customers…</div>
				<div class="acme-card" data-ref="table" style="left:40px; top:192px; width:770px; height:432px; overflow:hidden">
					<div style="position:absolute; left:0; right:0; top:0; height:52px; background:#fafafa"></div>
					<div class="acme-label" style="position:absolute; left:24px; top:15px">Customer</div>
					<div class="acme-label" style="position:absolute; left:372px; top:15px">Status</div>
					<div class="acme-label" style="position:absolute; left:520px; top:15px">MRR</div>
					${rows}
				</div>
				<div class="acme-sub" style="position:absolute; left:44px; top:652px">1–5 of 1,284 customers</div>
				<div class="acme-btn ghost" style="right:148px; top:640px">Previous</div>
				<div class="acme-btn ghost" style="right:40px; top:640px">Next</div>
				<div class="acme-card" data-ref="composer" style="left:330px; top:${192 + 52 + (TARGET + 1) * 76 + 6}px; width:460px; height:204px; box-shadow:0 10px 30px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06); visibility:hidden">
					<div style="position:absolute; left:22px; top:20px; font-size:22px; font-weight:620">Note for ${CUSTOMERS[TARGET].name}</div>
					<div style="position:absolute; left:22px; right:22px; top:58px; height:64px; box-sizing:border-box; border:2px solid #18181b; border-radius:10px; padding:0 14px; display:flex; align-items:center; font-size:24px; white-space:pre"><span data-ref="note-text"></span><span data-ref="note-caret" style="display:inline-block; width:2px; height:30px; background:#18181b; margin-left:1px"></span></div>
					<div class="acme-btn ghost" style="right:128px; top:138px">Cancel</div>
					<div class="acme-btn dark" data-ref="send" style="right:22px; top:138px">Send</div>
				</div>
			</div>
			<div class="acme-card" data-ref="toast" style="right:24px; bottom:24px; width:420px; height:96px; box-shadow:0 10px 30px rgba(0,0,0,0.14); visibility:hidden">
				<div style="position:absolute; left:22px; top:26px; width:44px; height:44px; border-radius:50%; background:#16a34a; color:#fff; display:grid; place-items:center">${icon("M5 12l5 5L20 7", 26)}</div>
				<div style="position:absolute; left:84px; top:16px; font-size:26px; font-weight:640">Note added</div>
				<div class="acme-sub" style="position:absolute; left:84px; top:52px">${CUSTOMERS[TARGET].name} · just now</div>
			</div>
		</div>`;
	const q = (ref: string) => view.querySelector(`[data-ref="${ref}"]`) as HTMLElement;

	// The revenue chart: an SVG area, drawn like the app's own chart component would.
	const chartCard = q("chart");
	const plot = svg(chartCard, "svg", {
		width: 722,
		height: 290,
		viewBox: "0 0 722 290",
		style: "position:absolute; left:24px; top:96px; overflow:visible",
	});
	const px = (i: number) => 20 + (i * 682) / (REVENUE.length - 1);
	const py = (v: number) => 236 - ((v - 15) / 40) * 220;
	for (const v of [20, 30, 40, 50]) {
		svg(plot, "line", {
			x1: 0,
			x2: 722,
			y1: py(v),
			y2: py(v),
			stroke: "#f0f0f2",
			"stroke-width": 1.5,
		});
	}
	MONTHS.forEach((m, i) => {
		const label = svg(plot, "text", {
			x: px(i),
			y: 278,
			"text-anchor": "middle",
			fill: "#a1a1aa",
			"font-size": 22,
		});
		label.textContent = m;
	});
	let d = `M${px(0)} ${py(REVENUE[0])}`;
	for (let i = 1; i < REVENUE.length; i++) {
		const [x0, y0, x1, y1] = [px(i - 1), py(REVENUE[i - 1]), px(i), py(REVENUE[i])];
		d += ` C${x0 + (x1 - x0) / 2} ${y0} ${x0 + (x1 - x0) / 2} ${y1} ${x1} ${y1}`;
	}
	const defs = svg(plot, "defs", {});
	const grad = svg(defs, "linearGradient", { id: "acme-area", x1: 0, y1: 0, x2: 0, y2: 1 });
	svg(grad, "stop", { offset: 0, "stop-color": "#2563eb", "stop-opacity": 0.22 });
	svg(grad, "stop", { offset: 1, "stop-color": "#2563eb", "stop-opacity": 0 });
	const area = svg(plot, "path", {
		d: `${d} L${px(11)} 240 L${px(0)} 240 Z`,
		fill: "url(#acme-area)",
	});
	const curve = svg(plot, "path", {
		d,
		fill: "none",
		stroke: "#2563eb",
		"stroke-width": 3.5,
		"stroke-linecap": "round",
	});

	// The cursor and its click ring, above the window, in demo px. Deviation from STYLE.md's
	// crosshair pointer for product UIs: an ordinary arrow reads as someone using the real app;
	// the click ring stays the HUD's amber.
	const cursorLayer = svg(layer, "svg", {
		width: W,
		height: H,
		viewBox: `0 0 ${W} ${H}`,
		style: "position:absolute; left:0; top:0; overflow:visible; pointer-events:none",
	});
	const cursor = svg(cursorLayer, "g", { opacity: 0 });
	svg(cursor, "path", {
		d: "M0 0V34L8.5 26.2L14 39L20.5 36.2L15 23.6H26.5Z",
		fill: "#0a0a0a",
		stroke: "#fff",
		"stroke-width": 2.5,
		"stroke-linejoin": "round",
	});

	let cam: Camera = { tx: 0, ty: 0, s: 1 };
	// Screen (demo px) of a point in the window, under the current camera.
	const screen = (p: { x: number; y: number }, c = cam) => ({
		x: c.tx + c.s * p.x,
		y: c.ty + c.s * p.y,
	});
	const moveCamera = (to: Camera, delay: number, duration: number) => {
		win.animate(
			[
				{ transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` },
				{ transform: `translate(${to.tx}px, ${to.ty}px) scale(${to.s})` },
			],
			{ duration, delay, easing: css("--ease-draw"), fill: "both" },
		);
		cam = to;
	};
	// Centre region r (window px) at zoom s, clamped so the window always covers the viewport.
	const frameOn = (r: Box, s: number): Camera => {
		const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
		return {
			s,
			tx: clamp(W / 2 - s * (r.x + r.w / 2), W - W * s, 0),
			ty: clamp(H / 2 - s * (r.y + r.h / 2), H - H * s, 0),
		};
	};

	// The cursor travels in demo px; targets are window points mapped through the camera the
	// window will have when the cursor arrives.
	let at = { x: 1020, y: 860 };
	const travel = (to: { x: number; y: number }, delay: number, duration: number) => {
		cursor.animate(
			[
				{ transform: `translate(${at.x}px, ${at.y}px)` },
				{ transform: `translate(${to.x}px, ${to.y}px)` },
			],
			{ duration, delay, easing: css("--ease-settle"), fill: "both" },
		);
		at = to;
	};
	const click = (p: { x: number; y: number }, delay: number) => {
		const ring = svg(cursorLayer, "circle", {
			cx: p.x,
			cy: p.y,
			r: 10,
			fill: "none",
			stroke: "var(--amber)",
			"stroke-width": 3,
			opacity: 0,
		});
		ring.style.transformOrigin = `${p.x}px ${p.y}px`;
		ring.animate(
			[
				{ transform: "scale(1)", opacity: 0.95 },
				{ transform: "scale(3.6)", opacity: 0 },
			],
			{ duration: 520, delay, easing: css("--ease-settle"), fill: "forwards" },
		);
	};
	const show = (el: HTMLElement, delay: number, from = "translateY(16px)") => {
		el.animate([{ visibility: "hidden" }, { visibility: "visible" }], {
			duration: 1,
			delay,
			fill: "both",
		});
		el.animate(
			[
				{ opacity: 0, transform: from },
				{ opacity: 1, transform: "none" },
			],
			{
				duration: ms("--dur-normal"),
				delay,
				easing: css("--ease-settle"),
				fill: "both",
			},
		);
	};
	const hide = (el: HTMLElement, delay: number) => {
		el.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: ms("--dur-fast"),
			delay,
			fill: "forwards",
		});
		el.animate([{ visibility: "visible" }, { visibility: "hidden" }], {
			duration: 1,
			delay: delay + ms("--dur-fast"),
			fill: "forwards",
		});
	};
	/** A window element's centre, in window px. */
	const centreOf = (el: HTMLElement) => {
		let x = el.offsetWidth / 2;
		let y = el.offsetHeight / 2;
		let node: HTMLElement | null = el;
		while (node && node !== win) {
			x += node.offsetLeft;
			y += node.offsetTop;
			node = node.offsetParent as HTMLElement | null;
		}
		return { x, y };
	};
	// The arrow's hotspot is its tip; aim it just inside a control.
	const aim = (el: HTMLElement, dx = -0.18) => {
		const c = centreOf(el);
		return { x: c.x + el.offsetWidth * dx, y: c.y + 4 };
	};

	let typing: { start: number; done: boolean } | null = null;
	const noteText = q("note-text");
	const caret = q("note-caret");

	return {
		layer,
		dashboard(ticker, delay) {
			const rise = (el: HTMLElement, wait: number) =>
				el.animate(
					[
						{ opacity: 0, transform: "translateY(20px)" },
						{ opacity: 1, transform: "none" },
					],
					{
						duration: ms("--dur-normal"),
						delay: delay + wait,
						easing: css("--ease-settle"),
						fill: "both",
					},
				);
			KPIS.forEach((k, i) => {
				rise(q(`kpi-${i}`), 120 + i * 70);
				tickTo(
					ticker,
					q(`kpi-value-${i}`),
					k.value,
					ticker.now() + delay + 260 + i * 70,
					1000,
					k.format,
				);
			});
			rise(chartCard, 330);
			draw(curve, delay + 480, 1100);
			area.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
				duration: 1100,
				delay: delay + 480,
				easing: css("--ease-draw"),
				fill: "both",
			});
			// The cursor arrives from below and rests on Customers, ready for the cue.
			cursor.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 200,
				delay: delay + 1000,
				fill: "both",
			});
			travel(screen(aim(q("nav-1"), -0.36)), delay + 1000, 800);
		},
		customers(ticker, windowMs) {
			// The window from this cue ("rendered") to the next ("If") paces the whole sequence,
			// so a re-timed take can't make send() snap the note in: the steps up to the open
			// composer take 62% of it, the note types over the next 28%, and a short beat with the
			// note complete is left before Send. Micro-animations keep their own durations.
			const k = (0.62 * windowMs) / LEAD_MS;
			const paced = (natural: number) => natural * k;
			const navTo = q("nav-1");
			// Click Customers (the cursor is already on it; if the cue came early, it hurries).
			travel(screen(aim(navTo, -0.36)), 0, paced(160));
			click(at, paced(120));
			// A real SPA route change: the page swaps on one frame, the rows rise in after it.
			const swap = { duration: 0, delay: paced(160), fill: "both" as const };
			q("nav-0").animate(
				[
					{ background: "#f0f0f2", color: "#09090b" },
					{ background: "transparent", color: "#52525b" },
				],
				swap,
			);
			navTo.animate(
				[
					{ background: "transparent", color: "#52525b" },
					{ background: "#f0f0f2", color: "#09090b" },
				],
				swap,
			);
			setTimeout(() => browser.setUrl("app.acme.com/customers"), paced(160));
			q("dashboard").animate([{ visibility: "visible" }, { visibility: "hidden" }], swap);
			q("customers").animate([{ visibility: "hidden" }, { visibility: "visible" }], swap);
			CUSTOMERS.forEach((_, i) => {
				q(`row-${i}`).animate(
					[
						{ opacity: 0, transform: "translateY(18px)" },
						{ opacity: 1, transform: "none" },
					],
					{
						duration: ms("--dur-normal"),
						delay: paced(200 + i * 45),
						easing: css("--ease-settle"),
						fill: "both",
					},
				);
			});
			q("table").animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 200,
				delay: paced(180),
				fill: "both",
			});
			// Frame the table's top rows and the note composer that will open under the target.
			const table = q("table");
			const tableBox = { x: SIDE + table.offsetLeft, y: BROWSER_BAR + table.offsetTop };
			const target = frameOn({ x: tableBox.x - 10, y: tableBox.y + 40, w: 790, h: 420 }, 1.26);
			moveCamera(target, paced(260), paced(900));
			const button = q(`note-${TARGET}`);
			// Aim right of the label, so the click ring never covers it.
			const onButton = screen(aim(button, 0.36), target);
			travel(onButton, paced(720), paced(520));
			click(onButton, paced(1260));
			button.animate([{ background: "#fff" }, { background: "#f4f4f5" }], {
				duration: 1,
				delay: paced(1260),
				fill: "both",
			});
			show(q("composer"), paced(1320), "translateY(-10px) scale(0.98)");
			const start = ticker.now() + paced(LEAD_MS);
			const perChar = (0.28 * windowMs) / NOTE.length;
			typing = { start, done: false };
			const state = typing;
			ticker.add((t) => {
				if (state.done) return false;
				const n = Math.min(NOTE.length, Math.max(0, Math.floor(tidy(t - start) / perChar) + 1));
				noteText.textContent = t < start ? "" : NOTE.slice(0, n);
				caret.style.opacity =
					Math.floor(t / 530) % 2 === 0 || t < start + NOTE.length * perChar ? "1" : "0";
				return true;
			});
		},
		send() {
			// A cue that comes before the note is typed completes it first.
			if (typing) typing.done = true;
			noteText.textContent = NOTE;
			caret.style.opacity = "0";
			const send = q("send");
			const onSend = screen(aim(send, 0.36));
			travel(onSend, 0, 340);
			click(onSend, 380);
			send.animate(
				[{ background: "#18181b" }, { background: "#3f3f46" }, { background: "#18181b" }],
				{
					duration: 240,
					delay: 380,
					fill: "both",
				},
			);
			hide(q("composer"), 460);
			// The row's Note action now carries its count.
			const button = q(`note-${TARGET}`);
			setTimeout(() => {
				button.innerHTML = `${icon("M5 12l5 5L20 7", 22)}1 note`;
				button.style.color = "#15803d";
			}, 560);
			// Rest the camera, so the toast and the whole app are in view for the payoff.
			moveCamera({ tx: 0, ty: 0, s: 1 }, 540, 1000);
			show(q("toast"), 620, "translateY(24px)");
		},
		idle() {
			cursor.animate([{ opacity: 1 }, { opacity: 0 }], {
				duration: ms("--dur-normal"),
				fill: "forwards",
			});
		},
	};
}
