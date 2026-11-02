import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { createTicker, css } from "../../components/v2/motion.js";
import { type Stage, createStage, startAmbient } from "../../components/v2/stage.js";
import { type TitleLockup, createTitleLockup } from "../../components/v2/title-lockup.js";
import timing from "../../videos/2026_11_five_months/audio/originals/voiceovers/v1/timing.json";

// The close: both videos were made with Videowright. The v2 logo draws (mark, then the wordmark
// on "Videowright", the tagline "Build videos in Claude Code" on "Claude"), the features light
// as the narration names them, and the GitHub link rises on "Download", typing as it is said
// and turning amber on "GitHub". Then the end hold: only the ambient layer moves.

/** This segment's start on the track (s). */
const START = 55.717;
const FEATURES = ["Animation", "Styles", "Voiceovers", "Sound effects", "Music", "& more"];
/** The narration word that lights each feature. */
const FEATURE_WORDS = ["animation,", "styles,", "voiceovers,", "sound", "music,", "more."];
const URL = "github.com/scosman/videowright";

type Timed = { words: Array<{ word: string; start: number }> };
const words = (timing as Timed).words.filter((w) => w.start > START);
const at = (word: string) => {
	const w = words.find((x) => x.word === word);
	return w ? w.start - START : Number.POSITIVE_INFINITY;
};

/** The logo at 70%, centred: the lockup's content spans x 160-1740, y 340-720 at full size. */
const LOGO = { scale: 0.7, x: 295, y: -96 };

let stage: Stage;
let lockup: TitleLockup;
let chips: HTMLElement[] = [];
let link: HTMLElement;
let linkText: HTMLElement;

export default defineSegment({
	id: "fm-cta",
	advances: [1.3, 3.783, 11.05, 17.667],
	voiceover:
		"Both videos were made with Videowright: an open-source framework that gives Claude everything it needs to make videos. Animation, styles, voiceovers, sound effects, music, and more. Download it free on GitHub.",
	notes:
		"Entered on me-sweep from the voice beat. Advance 1: the wordmark, 0.15s before 'Videowright'. Advance 2: the tagline, before 'Claude'. Advance 3: the link, before 'Download'. Advance 4: the end of the track (the 5s end hold). The features and the link's highlight follow their words' times (timing.json).",

	async mount(el) {
		await fontsReady();
		stage = createStage(el, { key: { x: 960, y: 420 }, scanPhase: 2600 });
		const logo = document.createElement("div");
		logo.style.cssText = `position:absolute; left:0; top:0; width:1920px; height:1080px; transform:translate(${LOGO.x}px, ${LOGO.y}px) scale(${LOGO.scale}); transform-origin:0 0`;
		stage.content.appendChild(logo);
		lockup = createTitleLockup(logo);

		const row = document.createElement("div");
		row.style.cssText =
			"position:absolute; left:80px; right:80px; top:560px; display:flex; justify-content:center; gap:22px";
		row.innerHTML = FEATURES.map(
			(f) =>
				`<span style="padding:14px 30px; border:2px solid var(--hairline); border-radius:999px; font-family:var(--font-body); font-size:44px; font-weight:560; color:var(--fg-2); opacity:0.35; white-space:nowrap">${f}</span>`,
		).join("");
		stage.content.appendChild(row);
		chips = Array.from(row.children) as HTMLElement[];

		link = document.createElement("div");
		link.style.cssText =
			"position:absolute; left:0; right:0; top:730px; display:flex; flex-direction:column; align-items:center; gap:22px; opacity:0";
		link.innerHTML = `
			<div class="me-label" style="font-size:28px; color:var(--fg-2)">FREE &amp; OPEN SOURCE</div>
			<div style="padding:26px 48px; border:2px solid var(--hairline-strong); border-radius:12px; background:rgba(10,14,20,0.7); font-family:var(--font-mono); font-size:68px; font-weight:500; color:var(--color-fg); min-width:1340px; text-align:center">
				<span data-ref="url"></span><span style="color:var(--amber)">▍</span>
			</div>`;
		stage.content.appendChild(link);
		linkText = link.querySelector('[data-ref="url"]') as HTMLElement;
	},

	async play(ctx) {
		startAmbient(ctx, stage, { driftMs: 18000, push: 0.02 });
		lockup.revealMark();
		const ticker = createTicker(() => ctx.clock(), ctx.signal);
		const featureAt = FEATURE_WORDS.map((w) => at(w) - 0.15);
		ticker.add((t) => {
			const s = t / 1000;
			chips.forEach((chip, i) => {
				const on = s >= featureAt[i];
				chip.style.opacity = on ? "1" : "0.35";
				chip.style.color = on ? css("--color-fg") : css("--fg-2");
				chip.style.borderColor = on ? css("--cyan") : css("--hairline");
			});
			return true;
		});

		await ctx.waitForNext();
		lockup.revealWords();
		await ctx.waitForNext();
		lockup.revealTagline();
		await ctx.waitForNext();
		// The link: it rises, types over "it free on GitHub", and turns amber on "GitHub".
		link.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "none" },
			],
			{ duration: 520, easing: css("--ease-settle"), fill: "forwards" },
		);
		const typeFrom = ticker.now();
		const typeFor = Math.max((at("GitHub.") - at("Download")) * 1000, 400);
		const amberAt = (at("GitHub.") - 0.15) * 1000;
		ticker.add((t) => {
			const n = Math.min(URL.length, Math.ceil(((t - typeFrom) / typeFor) * URL.length));
			linkText.textContent = URL.slice(0, Math.max(n, 0));
			if (t >= amberAt) linkText.style.color = css("--amber");
			return n < URL.length || t < amberAt;
		});
		await ctx.waitForNext();
	},
});
