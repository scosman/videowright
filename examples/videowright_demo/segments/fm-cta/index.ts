import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { css } from "../../components/v2/motion.js";
import { type Stage, createStage, startAmbient } from "../../components/v2/stage.js";
import { type TitleLockup, createTitleLockup } from "../../components/v2/title-lockup.js";
import cues from "../../videos/2026_11_five_months/audio/cues.json";

// The close: both videos were made with Videowright. The v2 logo draws at the centre of the
// frame (the wordmark rises on "Videowright", then the tagline "Build videos in Claude Code").
// On "open-source" it glides up and shrinks to make room. On "animation" the six features arrive
// as one gesture: a row of tiles, each with a line icon that draws itself. On "Download" the
// GitHub link rises whole. Then the end hold: only the ambient layer moves.

/**
 * The logo's placement (a translate, then a scale about the top-left corner). The lockup's
 * content spans x 160-1740, y 340-720 at full size: centred on the frame at 85%, then centred
 * across the top at 62%.
 */
const LOGO_CENTRE = { x: 960 - 950 * 0.85, y: 540 - 530 * 0.85, s: 0.85 };
const LOGO_TOP = { x: 960 - 950 * 0.62, y: 96 - 340 * 0.62, s: 0.62 };
const place = (p: { x: number; y: number; s: number }) =>
	`translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${p.s})`;

// Line icons on a 48-unit grid, stroked (each shape draws itself: pathLength 1).
const ICONS: Array<[label: string, shapes: string]> = [
	["Animation", `<circle cx="31" cy="24" r="9"/><path d="M5 17h12M3 24h14M5 31h12"/>`],
	[
		"Styles",
		`<path d="M24 6C13.5 6 6 13.6 6 23.5 6 33.6 13.9 42 23.6 42c2.6 0 3.9-1.5 3.9-3.4 0-2.6-2.3-3.3-2.3-5.4 0-2 1.7-3.6 3.8-3.6h4.5C38.6 29.6 42 26 42 21.4 42 12.6 34.2 6 24 6z"/><circle cx="16" cy="20" r="2.6"/><circle cx="24" cy="14" r="2.6"/><circle cx="32.5" cy="18.5" r="2.6"/>`,
	],
	[
		"Voiceovers",
		`<rect x="18" y="5" width="12" height="23" rx="6"/><path d="M11 22a13 13 0 0 0 26 0M24 35v8M17 43h14"/>`,
	],
	[
		"Sound effects",
		`<path d="M7 18.5h7l10-8v27l-10-8H7z"/><path d="M30 18c2.6 3.2 2.6 8.8 0 12M35.5 12.5c5.5 6.4 5.5 16.6 0 23"/>`,
	],
	[
		"Music",
		`<path d="M19 35V12l20-5v23"/><circle cx="14" cy="35" r="5"/><circle cx="34" cy="30" r="5"/>`,
	],
	["And more", `<circle cx="24" cy="24" r="17"/><path d="M24 15.5v17M15.5 24h17"/>`],
];
const TILE = { w: 240, h: 230, gap: 16, top: 412 };

let stage: Stage;
let lockup: TitleLockup;
let logo: HTMLElement;
let tiles: HTMLElement[] = [];
let link: HTMLElement;

export default defineSegment({
	id: "fm-cta",
	advances: cues.segments["fm-cta"].advances,
	voiceover:
		"Both videos were made with Videowright: an open-source framework that gives Claude everything it needs to make videos. Animation, styles, voiceovers, sound effects, music, and more. Download it free on GitHub.",
	notes:
		"Entered on me-sweep from the voice beat. Advance 1: the wordmark, 0.15s before 'Videowright'. Advance 2: the logo moves up, before 'open-source'. Advance 3: the feature tiles, before 'animation'. Advance 4: the link, before 'Download'. Advance 5: the end of the track (the 5s end hold).",

	async mount(el) {
		await fontsReady();
		stage = createStage(el, { key: { x: 960, y: 460 }, scanPhase: 2600 });
		logo = document.createElement("div");
		logo.style.cssText = `position:absolute; left:0; top:0; width:1920px; height:1080px; transform-origin:0 0; transform:${place(LOGO_CENTRE)}`;
		stage.content.appendChild(logo);
		lockup = createTitleLockup(logo);

		const rowW = ICONS.length * TILE.w + (ICONS.length - 1) * TILE.gap;
		const row = document.createElement("div");
		row.style.cssText = `position:absolute; left:${(1920 - rowW) / 2}px; top:${TILE.top}px; display:flex; gap:${TILE.gap}px`;
		row.innerHTML = ICONS.map(
			([label, shapes]) => `
			<div class="me-panel" style="width:${TILE.w}px; height:${TILE.h}px; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:26px; opacity:0">
				<svg width="104" height="104" viewBox="0 0 48 48" fill="none" stroke="var(--cyan)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="filter:var(--glow-cyan-filter)">${shapes}</svg>
				<div style="font-family:var(--font-body); font-size:34px; font-weight:560; color:var(--color-fg); white-space:nowrap">${label}</div>
			</div>`,
		).join("");
		stage.content.appendChild(row);
		tiles = Array.from(row.children) as HTMLElement[];
		for (const shape of row.querySelectorAll("svg *")) {
			shape.setAttribute("pathLength", "1");
			(shape as SVGElement).style.strokeDasharray = "1";
			(shape as SVGElement).style.strokeDashoffset = "1";
		}

		link = document.createElement("div");
		link.style.cssText =
			"position:absolute; left:0; right:0; top:724px; display:flex; flex-direction:column; align-items:center; gap:22px; opacity:0";
		link.innerHTML = `
			<div class="me-label" style="font-size:28px; color:var(--fg-2)">FREE AND OPEN SOURCE</div>
			<div style="padding:26px 56px; border:2px solid var(--amber); border-radius:12px; background:rgba(10,14,20,0.72); box-shadow:0 0 28px rgba(255,181,71,0.18); font-family:var(--font-mono); font-size:72px; font-weight:500; color:var(--amber)">github.com/scosman/videowright</div>`;
		stage.content.appendChild(link);
	},

	async play(ctx) {
		startAmbient(ctx, stage, { driftMs: 18000, push: 0.02 });
		const settle = css("--ease-settle");
		lockup.revealMark();

		await ctx.waitForNext();
		lockup.revealWords();
		lockup.revealTagline(500);

		await ctx.waitForNext();
		logo.animate([{ transform: place(LOGO_CENTRE) }, { transform: place(LOGO_TOP) }], {
			duration: 900,
			easing: settle,
			fill: "forwards",
		});

		await ctx.waitForNext();
		// The features: one gesture, the tiles rising in a quick stagger, their icons drawing.
		tiles.forEach((tile, i) => {
			const delay = i * 70;
			tile.animate(
				[
					{ opacity: 0, transform: "translateY(28px)" },
					{ opacity: 1, transform: "none" },
				],
				{ duration: 520, delay, easing: settle, fill: "forwards" },
			);
			tile.querySelectorAll("svg *").forEach((shape, k) => {
				(shape as SVGElement).animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
					duration: 640,
					delay: delay + 120 + k * 60,
					easing: css("--ease-draw"),
					fill: "forwards",
				});
			});
		});

		await ctx.waitForNext();
		link.animate(
			[
				{ opacity: 0, transform: "translateY(28px)" },
				{ opacity: 1, transform: "none" },
			],
			{ duration: 560, easing: settle, fill: "forwards" },
		);
		await ctx.waitForNext();
	},
});
