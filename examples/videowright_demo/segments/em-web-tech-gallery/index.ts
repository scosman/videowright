import lottie, { type AnimationItem } from "lottie-web";
import * as THREE from "three";
import { defineSegment } from "videowright";
import rocketAnimation from "../../rocket-launch.json";

let host: HTMLElement | null = null;
let lottieInstance: AnimationItem | null = null;

type ThreeScene = {
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	mainGroup: THREE.Group;
	edges: THREE.LineSegments;
	vertexPoints: THREE.Points;
	orbitPoints: THREE.Points;
};
let three: ThreeScene | null = null;

const INK = 0x14110e;
const ACCENT_RED = 0xc8392c;

export default defineSegment({
	id: "em-web-tech-gallery",
	advances: [16.37],
	voiceover:
		"Use any web technology — SVG, charts, three-D, real product UI. If the browser can render it, Videowright can animate it.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        overflow: hidden;
      ">
        <!-- top hairline + label row -->
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: var(--safe-y); height: 1px; background: var(--color-border);"></div>
        <div style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: calc(var(--safe-y) + 22px);
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-muted);
        ">
          <div data-ref="plate-tag">Chapter 02 / The Gallery</div>
          <div data-ref="plate-num">Plate I of IV</div>
        </div>

        <!-- the stage holds 4 plates stacked, only one visible at a time -->
        <div data-ref="stage" style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: 200px;
          bottom: 260px;
        ">
          ${plate(
						"p0",
						`
            <div style="display: flex; align-items: center; gap: 96px; height: 100%;">
              <div style="flex: 0 0 720px;">
                <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 24px;">A / SVG</div>
                <div style="font-family: var(--font-display); font-size: 96px; line-height: 0.96; margin-bottom: 28px;">Animated SVGs.</div>
                <div style="font-family: var(--font-body); font-size: 24px; color: var(--color-muted); line-height: 1.45; max-width: 580px;">A scalable diagram, drawn by the browser, animated with the same primitives you already know.</div>
              </div>
              <div style="flex: 1; height: 100%; display: flex; align-items: center; justify-content: center;">
                ${orbitSVG()}
              </div>
            </div>
          `,
					)}

          ${plate(
						"p1",
						`
            <div style="display: flex; gap: 80px; height: 100%;">
              <div style="flex: 0 0 600px;">
                <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 24px;">B / Charts</div>
                <div style="font-family: var(--font-display); font-size: 88px; line-height: 0.96; margin-bottom: 24px;">Charts.</div>
                <div style="font-family: var(--font-body); font-size: 22px; color: var(--color-muted); line-height: 1.45; max-width: 520px;">Bars, areas, radars — animated by stroke and width, not by exporting frames.</div>
              </div>
              <div style="flex: 1; display: grid; grid-template-rows: 1fr 1fr; gap: 32px;">
                ${barsBlock()}
                ${radarBlock()}
              </div>
            </div>
          `,
					)}

          ${plate(
						"p2",
						`
            <div style="display: flex; gap: 80px; height: 100%;">
              <div style="flex: 0 0 520px; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 24px;">C / Three.js + Lottie</div>
                <div style="font-family: var(--font-display); font-style: italic; font-size: 88px; line-height: 0.96; margin-bottom: 24px;">Three-D.</div>
                <div style="font-family: var(--font-body); font-size: 22px; color: var(--color-muted); line-height: 1.45; max-width: 460px;">WebGL geometry on the left, vector motion on the right — the same primitives your product already uses.</div>
              </div>
              <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; min-height: 0;">
                <div style="display: flex; flex-direction: column; gap: 10px; min-height: 0;">
                  <div style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted);">Three.js · WebGL</div>
                  <div data-ref="three-host" style="flex: 1; border: 1px solid var(--color-border); background: var(--color-surface); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; min-height: 0;"></div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; min-height: 0;">
                  <div style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted);">Lottie · SVG</div>
                  <div data-ref="lottie-host" style="flex: 1; border: 1px solid var(--color-border); background: var(--color-surface); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; min-height: 0;"></div>
                </div>
              </div>
            </div>
          `,
					)}

          ${plate(
						"p3",
						`
            <div style="height: 100%; display: flex; flex-direction: column; gap: 18px;">
              <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <div>
                  <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 16px;">D / Your Product UI</div>
                  <div style="font-family: var(--font-display); font-size: 72px; line-height: 1;">Real product UI.</div>
                </div>
                <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted);">Acme · Dashboard</div>
              </div>
              ${productMock()}
            </div>
          `,
					)}
        </div>

        <!-- bottom title -->
        <div data-ref="bottom" style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          bottom: var(--safe-y);
          padding-top: 28px;
          border-top: 1px solid var(--color-border);
        ">
          <div data-ref="bottom-tag" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 12px;
            opacity: 0;
          ">Thesis</div>
          <div data-ref="bottom-line" style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 44px;
            line-height: 1.1;
            white-space: nowrap;
            opacity: 0;
          ">If the browser can render it, Videowright can animate it<span style="color: var(--color-accent); font-style: italic;">.</span></div>
        </div>
      </div>
    `;

		// initial state: all plates hidden, then we'll fade them in via play()
		for (let i = 0; i < 4; i++) {
			const p = host?.querySelector(`[data-ref="p${i}"]`) as HTMLElement;
			if (p) p.style.opacity = "0";
		}
	},

	async play(ctx) {
		const $ = (k: string) => host?.querySelector(`[data-ref="${k}"]`) as HTMLElement;
		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const fwd = { fill: "forwards" as const, easing: ease };

		// bottom thesis lives throughout
		$("bottom-tag").animate([{ opacity: 0 }, { opacity: 1 }], {
			...fwd,
			duration: 480,
			delay: 200,
		});
		$("bottom-line").animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 600, delay: 320 },
		);

		const plateDurations = [3700, 3900, 4100, 4670]; // ms — sums to 16370
		const plateLabels = ["I of IV", "II of IV", "III of IV", "IV of IV"];

		for (let i = 0; i < 4; i++) {
			const plate = $(`p${i}`);
			$("plate-num").textContent = `Plate ${plateLabels[i]}`;

			// fade in current plate
			plate.animate(
				[
					{ opacity: 0, transform: "translateY(14px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...fwd, duration: 520 },
			);

			// run plate-specific animations
			if (!host) throw new Error("host is not set");
			runPlateAnimations(host, i);
			if (i === 2) setupThreeAndLottie(ctx);

			// hold for the plate's lifetime minus the 320ms crossfade out
			await ctx.hold(plateDurations[i] - 320);

			// fade out (except the last one — it stays until segment ends)
			if (i < 3) {
				plate.animate([{ opacity: 1 }, { opacity: 0 }], {
					...fwd,
					duration: 320,
					easing: "cubic-bezier(0.7, 0, 0.84, 0)",
				});
				await ctx.hold(320);
			}
		}

		await ctx.waitForNext();
	},

	unmount() {
		if (lottieInstance) {
			lottieInstance.destroy();
			lottieInstance = null;
		}
		if (three) {
			three.renderer.dispose();
			three.edges.geometry.dispose();
			(three.edges.material as THREE.Material).dispose();
			three.vertexPoints.geometry.dispose();
			(three.vertexPoints.material as THREE.Material).dispose();
			three.orbitPoints.geometry.dispose();
			(three.orbitPoints.material as THREE.Material).dispose();
			three.renderer.domElement.remove();
			three = null;
		}
		host = null;
	},
});

function plate(ref: string, inner: string): string {
	return `<div data-ref="${ref}" style="
    position: absolute;
    inset: 0;
    opacity: 0;
  ">${inner}</div>`;
}

function orbitSVG(): string {
	return `
    <svg viewBox="0 0 600 600" style="width: 100%; max-width: 600px; height: auto;">
      <!-- center point -->
      <circle cx="300" cy="300" r="6" fill="var(--color-accent)"/>
      <!-- orbital rings -->
      <ellipse data-ref="orbit-1" cx="300" cy="300" rx="140" ry="50" fill="none" stroke="var(--color-fg)" stroke-width="1" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
      <ellipse data-ref="orbit-2" cx="300" cy="300" rx="220" ry="80" fill="none" stroke="var(--color-fg)" stroke-width="1" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(35 300 300)"/>
      <ellipse data-ref="orbit-3" cx="300" cy="300" rx="280" ry="105" fill="none" stroke="var(--color-fg)" stroke-width="1" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-25 300 300)"/>
      <!-- planet body that orbits -->
      <g data-ref="planet" style="transform-origin: 300px 300px;">
        <circle cx="440" cy="300" r="9" fill="var(--color-fg)"/>
      </g>
    </svg>
  `;
}

function barsBlock(): string {
	return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted);">Revenue · 30 days</div>
      <div data-ref="bars" style="flex: 1; display: flex; align-items: flex-end; gap: 8px; padding-top: 6px; min-height: 160px;">
        ${barCols(14)}
      </div>
    </div>
  `;
}

function barCols(n: number): string {
	const heights = [22, 28, 38, 30, 44, 52, 46, 60, 72, 64, 78, 88, 96, 110];
	let html = "";
	for (let i = 0; i < n; i++) {
		const h = heights[i % heights.length];
		html += `<div data-ref="bar-${i}" style="flex: 1; height: 0; background: var(--color-fg); align-self: flex-end;" data-target="${h}"></div>`;
	}
	return html;
}

function radarBlock(): string {
	return `
    <div style="display: flex; gap: 24px; align-items: center;">
      <div style="flex: 0 0 260px;">
        <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted); margin-bottom: 8px;">Capability</div>
        <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-fg); line-height: 1.5;">
          <div>Speed <span data-ref="radar-stat-1" style="float: right; font-family: var(--font-mono); color: var(--color-muted);">— —</span></div>
          <div>Quality <span data-ref="radar-stat-2" style="float: right; font-family: var(--font-mono); color: var(--color-muted);">— —</span></div>
          <div>Reach <span data-ref="radar-stat-3" style="float: right; font-family: var(--font-mono); color: var(--color-muted);">— —</span></div>
          <div>Cost <span data-ref="radar-stat-4" style="float: right; font-family: var(--font-mono); color: var(--color-muted);">— —</span></div>
        </div>
      </div>
      <svg viewBox="0 0 200 200" style="width: 200px; height: 200px;">
        <polygon points="100,20 173.2,60 173.2,140 100,180 26.8,140 26.8,60" fill="none" stroke="var(--color-border)" stroke-width="1"/>
        <polygon points="100,50 144.6,75 144.6,125 100,150 55.4,125 55.4,75" fill="none" stroke="var(--color-border)" stroke-width="1"/>
        <polygon data-ref="radar-shape" points="100,40 162,70 158,130 100,160 42,130 38,75" fill="var(--color-accent)" fill-opacity="0.18" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 100px 100px; transform: scale(0); opacity: 0;"/>
      </svg>
    </div>
  `;
}

function setupThreeAndLottie(ctx: {
	clock(): number;
	signal: AbortSignal;
}) {
	const threeHost = host?.querySelector('[data-ref="three-host"]') as HTMLElement;
	const lottieHost = host?.querySelector('[data-ref="lottie-host"]') as HTMLElement;
	if (!threeHost || !lottieHost) return;

	const rect = threeHost.getBoundingClientRect();
	const w = Math.max(2, Math.round(rect.width));
	const h = Math.max(2, Math.round(rect.height));

	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio || 1);
	renderer.setSize(w, h);
	renderer.setClearColor(0x000000, 0);
	renderer.domElement.style.display = "block";
	renderer.domElement.style.maxWidth = "100%";
	renderer.domElement.style.maxHeight = "100%";
	threeHost.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
	camera.position.set(0, 0, 6);

	const mainGroup = new THREE.Group();
	scene.add(mainGroup);

	const geo = new THREE.IcosahedronGeometry(1.5, 1);

	const edgesGeo = new THREE.EdgesGeometry(geo);
	const edgesMat = new THREE.LineBasicMaterial({
		color: INK,
		transparent: true,
		opacity: 1,
	});
	const edges = new THREE.LineSegments(edgesGeo, edgesMat);
	mainGroup.add(edges);

	const vertexPositions = geo.attributes.position.array as Float32Array;
	const vertexSet = new Set<string>();
	const vertexCoords: number[] = [];
	for (let i = 0; i < vertexPositions.length; i += 3) {
		const x = vertexPositions[i];
		const y = vertexPositions[i + 1];
		const z = vertexPositions[i + 2];
		const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
		if (!vertexSet.has(key)) {
			vertexSet.add(key);
			vertexCoords.push(x, y, z);
		}
	}
	const vertGeo = new THREE.BufferGeometry();
	vertGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertexCoords, 3));
	const vertMat = new THREE.PointsMaterial({
		color: ACCENT_RED,
		size: 0.14,
		sizeAttenuation: true,
	});
	const vertexPoints = new THREE.Points(vertGeo, vertMat);
	mainGroup.add(vertexPoints);

	const orbitCount = 40;
	const orbitCoords: number[] = [];
	for (let i = 0; i < orbitCount; i++) {
		const a = (i / orbitCount) * Math.PI * 2;
		orbitCoords.push(Math.cos(a) * 2.4, Math.sin(a * 1.7) * 0.25, Math.sin(a) * 2.4);
	}
	const orbitGeo = new THREE.BufferGeometry();
	orbitGeo.setAttribute("position", new THREE.Float32BufferAttribute(orbitCoords, 3));
	const orbitMat = new THREE.PointsMaterial({
		color: ACCENT_RED,
		size: 0.06,
		sizeAttenuation: true,
	});
	const orbitPoints = new THREE.Points(orbitGeo, orbitMat);
	scene.add(orbitPoints);

	three = { renderer, scene, camera, mainGroup, edges, vertexPoints, orbitPoints };
	const threeStart = ctx.clock();
	const threeTick = () => {
		if (ctx.signal.aborted || !three) return;
		const t = (ctx.clock() - threeStart) / 1000;
		three.mainGroup.rotation.x = t * 0.35;
		three.mainGroup.rotation.y = t * 0.55;
		three.orbitPoints.rotation.y = -t * 0.7;
		three.orbitPoints.rotation.x = t * 0.2;
		three.renderer.render(three.scene, three.camera);
		requestAnimationFrame(threeTick);
	};
	requestAnimationFrame(threeTick);

	lottieInstance = lottie.loadAnimation({
		container: lottieHost,
		renderer: "svg",
		loop: false,
		autoplay: false,
		animationData: rocketAnimation,
	});
	const lottieDurMs = ((rocketAnimation.op - rocketAnimation.ip) / rocketAnimation.fr) * 1000;
	const lottieStart = ctx.clock();
	const lottieTick = () => {
		if (ctx.signal.aborted || !lottieInstance) return;
		const elapsed = ctx.clock() - lottieStart;
		const pos = elapsed % lottieDurMs;
		lottieInstance.goToAndStop(pos, false);
		requestAnimationFrame(lottieTick);
	};
	requestAnimationFrame(lottieTick);
}

function productMock(): string {
	return `
    <div style="
      flex: 1;
      background: var(--color-surface);
      border: 1px solid var(--color-fg);
      display: grid;
      grid-template-columns: 260px 1fr;
      overflow: hidden;
    ">
      <!-- sidebar -->
      <div style="
        border-right: 1px solid var(--color-fg);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 28px; height: 28px; border: 1px solid var(--color-fg); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 18px;">A</div>
          <div style="font-family: var(--font-body); font-weight: 500; font-size: 18px;">Acme Inc</div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; color: var(--color-muted); text-transform: uppercase; margin-top: 18px;">Workspace</div>
        <div data-ref="nav-dash" style="font-family: var(--font-body); font-size: 18px; color: var(--color-fg); font-weight: 500; border-left: 2px solid var(--color-accent); padding-left: 10px;">Dashboard</div>
        <div data-ref="nav-cust" style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted); padding-left: 12px;">Customers</div>
        <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted); padding-left: 12px;">Reports</div>
        <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted); padding-left: 12px;">Settings</div>
      </div>
      <!-- main -->
      <div style="padding: 26px 30px; display: flex; flex-direction: column; gap: 18px; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div style="font-family: var(--font-display); font-size: 40px;">Overview</div>
          <div style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; color: var(--color-muted); text-transform: uppercase;">May 2026</div>
        </div>
        <!-- KPI row -->
        <div data-ref="kpis" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px;">
          ${kpi("MRR", "kpi-0")}
          ${kpi("Active", "kpi-1")}
          ${kpi("Conv", "kpi-2")}
          ${kpi("Churn", "kpi-3")}
        </div>
        <!-- revenue area sketch -->
        <div style="border: 1px solid var(--color-border); padding: 16px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; color: var(--color-muted); text-transform: uppercase;">Revenue · 30 days</div>
            <div style="font-family: var(--font-mono); font-size: 12px; color: var(--color-accent);">▲ 12.4%</div>
          </div>
          <svg viewBox="0 0 600 130" style="width: 100%; height: 110px;">
            <path data-ref="rev-fill" d="M0,90 L40,84 L80,76 L120,82 L160,68 L200,58 L240,62 L280,46 L320,40 L360,32 L400,38 L440,28 L480,18 L520,22 L560,12 L600,8 L600,130 L0,130 Z" fill="var(--color-fg)" fill-opacity="0.06" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" stroke="none"/>
            <path data-ref="rev-line" d="M0,90 L40,84 L80,76 L120,82 L160,68 L200,58 L240,62 L280,46 L320,40 L360,32 L400,38 L440,28 L480,18 L520,22 L560,12 L600,8" fill="none" stroke="var(--color-fg)" stroke-width="1.5" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
          </svg>
        </div>
      </div>
    </div>
  `;
}

function kpi(label: string, ref: string): string {
	return `
    <div style="border: 1px solid var(--color-border); padding: 14px 16px;">
      <div style="font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; color: var(--color-muted); text-transform: uppercase; margin-bottom: 6px;">${label}</div>
      <div data-ref="${ref}" style="font-family: var(--font-display); font-size: 36px; line-height: 1;">0</div>
    </div>
  `;
}

function runPlateAnimations(root: HTMLElement, idx: number) {
	const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
	const fwd = { fill: "forwards" as const, easing: ease };

	if (idx === 0) {
		// orbit rings draw + planet rotates
		for (let i = 1; i <= 3; i++) {
			const o = root.querySelector(`[data-ref="orbit-${i}"]`) as SVGElement;
			if (o)
				o.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
					...fwd,
					duration: 900,
					delay: 150 * (i - 1),
				});
		}
		const planet = root.querySelector(`[data-ref="planet"]`) as HTMLElement;
		if (planet)
			planet.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
				duration: 4200,
				iterations: Number.POSITIVE_INFINITY,
				easing: "linear",
			});
	} else if (idx === 1) {
		// bars rise
		const bars = root.querySelector(`[data-ref="bars"]`) as HTMLElement;
		const cols = bars?.querySelectorAll<HTMLElement>("[data-target]");
		cols?.forEach((c, i) => {
			const target = c.getAttribute("data-target") ?? "40";
			c.animate([{ height: "0px" }, { height: `${target}px` }], {
				...fwd,
				duration: 700,
				delay: 60 * i,
			});
		});
		// radar polygon expands via scale (transform-origin is the center of the SVG)
		const radar = root.querySelector(`[data-ref="radar-shape"]`) as SVGPolygonElement;
		if (radar) {
			radar.animate(
				[
					{ transform: "scale(0)", opacity: 0 },
					{ transform: "scale(1)", opacity: 1 },
				],
				{ ...fwd, duration: 900, delay: 400 },
			);
		}
		const stats = ["62", "84", "47", "33"];
		stats.forEach((v, i) => {
			const s = root.querySelector(`[data-ref="radar-stat-${i + 1}"]`) as HTMLElement;
			if (s)
				setTimeout(
					() => {
						s.textContent = v;
						s.style.color = "var(--color-fg)";
					},
					600 + i * 120,
				);
		});
	} else if (idx === 3) {
		// KPI numbers count up
		const targets = [
			{ ref: "kpi-0", to: 48392, prefix: "$" },
			{ ref: "kpi-1", to: 2841, prefix: "" },
			{ ref: "kpi-2", to: 4.7, prefix: "", suffix: "%" },
			{ ref: "kpi-3", to: 1.2, prefix: "", suffix: "%" },
		];
		targets.forEach((t, i) => {
			const el = root.querySelector(`[data-ref="${t.ref}"]`) as HTMLElement;
			if (!el) return;
			const steps = 24;
			for (let s = 0; s <= steps; s++) {
				setTimeout(
					() => {
						const v = (t.to * s) / steps;
						const formatted = t.suffix === "%" ? v.toFixed(1) : Math.round(v).toLocaleString();
						el.textContent = `${t.prefix}${formatted}${t.suffix ?? ""}`;
					},
					200 + i * 90 + (s * 700) / steps,
				);
			}
		});
		// revenue line draws
		const line = root.querySelector(`[data-ref="rev-line"]`) as SVGPathElement;
		const fill = root.querySelector(`[data-ref="rev-fill"]`) as SVGPathElement;
		if (line)
			line.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
				...fwd,
				duration: 1500,
				delay: 600,
			});
		if (fill)
			fill.animate([{ opacity: 0 }, { opacity: 1 }], {
				...fwd,
				duration: 800,
				delay: 1400,
			});
		// transition to Customers later in the plate
		setTimeout(() => {
			const dash = root.querySelector(`[data-ref="nav-dash"]`) as HTMLElement;
			const cust = root.querySelector(`[data-ref="nav-cust"]`) as HTMLElement;
			if (dash) {
				dash.style.borderLeft = "2px solid transparent";
				dash.style.color = "var(--color-muted)";
				dash.style.fontWeight = "400";
				dash.style.paddingLeft = "12px";
			}
			if (cust) {
				cust.style.borderLeft = "2px solid var(--color-accent)";
				cust.style.color = "var(--color-fg)";
				cust.style.fontWeight = "500";
				cust.style.paddingLeft = "10px";
			}
		}, 2400);
	}
}
