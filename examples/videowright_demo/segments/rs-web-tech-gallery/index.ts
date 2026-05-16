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

const GRAIN_BG = `url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;)`;

const PINK = 0xff4f8b;
const INK = 0x1a2a6a;

export default defineSegment({
	id: "rs-web-tech-gallery",
	advances: [16.37],
	voiceover:
		"SVG. Charting libraries. Advanced 3D and motion. Even your real product UI, rendered from your own React components. No new framework. No animation DSL. If your stack runs in a browser, Videowright supports it.",

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
        <div style="
          position: absolute; inset: 0; pointer-events: none; z-index: 30;
          background-image: ${GRAIN_BG};
          opacity: var(--grain-opacity); mix-blend-mode: multiply;
        "></div>

        <!-- Panel label upper-left -->
        <div data-ref="panel-label" style="
          position: absolute;
          left: var(--safe-x); top: 80px;
          font-family: var(--font-mono);
          font-size: 28px;
          letter-spacing: 0.16em;
          font-weight: 600;
          color: var(--color-fg);
          opacity: 0;
          z-index: 10;
        ">
          <span style="color: var(--color-accent);">&#9670;</span>
          <span data-ref="panel-label-text">SVG</span>
        </div>

        <div style="
          position: absolute;
          right: var(--safe-x); top: 60px;
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          z-index: 10;
        ">&#9733; 03/08 &#9733;</div>

        <!-- Panel stage -->
        <div data-ref="stage" style="
          position: absolute;
          left: 160px; right: 160px;
          top: 170px; bottom: 200px;
        ">
          <!-- SVG orbits panel -->
          <div data-ref="p-svg" style="
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            opacity: 0;
          ">
            <svg viewBox="0 0 800 600" width="100%" height="100%" style="max-height: 100%;">
              <ellipse cx="400" cy="300" rx="320" ry="120" fill="none" stroke="#1a2a6a" stroke-width="3" stroke-dasharray="4 8" opacity="0.6"></ellipse>
              <ellipse cx="400" cy="300" rx="240" ry="200" fill="none" stroke="#1a2a6a" stroke-width="3" stroke-dasharray="4 8" opacity="0.6" transform="rotate(28 400 300)"></ellipse>
              <ellipse cx="400" cy="300" rx="180" ry="260" fill="none" stroke="#1a2a6a" stroke-width="3" stroke-dasharray="4 8" opacity="0.6" transform="rotate(-22 400 300)"></ellipse>
              <circle data-svg-orbit-1 cx="720" cy="300" r="22" fill="#ff4f8b" style="transform-origin: 400px 300px;"></circle>
              <circle data-svg-orbit-2 cx="400" cy="100" r="16" fill="#1a2a6a" style="transform-origin: 400px 300px;"></circle>
              <circle data-svg-orbit-3 cx="220" cy="300" r="12" fill="#ff4f8b" style="transform-origin: 400px 300px;"></circle>
              <circle cx="400" cy="300" r="48" fill="#1a2a6a"></circle>
              <circle cx="404" cy="304" r="48" fill="#ff4f8b" style="mix-blend-mode: multiply; opacity: 0.7;"></circle>
            </svg>
          </div>

          <!-- ECharts panel -->
          <div data-ref="p-charts" style="
            position: absolute; inset: 0;
            display: flex; gap: 56px; align-items: stretch;
            opacity: 0;
          ">
            <!-- Bar chart card -->
            <div style="
              flex: 1;
              border: 3px solid var(--color-fg);
              background: var(--color-bg);
              padding: 28px 32px;
              display: flex; flex-direction: column;
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 20px;
                letter-spacing: 0.18em;
                font-weight: 600;
                margin-bottom: 24px;
              ">&#9733; REVENUE &#183; QTRS</div>
              <div style="flex: 1; display: flex; align-items: flex-end; gap: 22px;">
                <div data-bar="60" style="flex: 1; background: var(--color-fg); height: 0%;"></div>
                <div data-bar="88" style="flex: 1; background: var(--color-accent); height: 0%;"></div>
                <div data-bar="72" style="flex: 1; background: var(--color-fg); height: 0%;"></div>
                <div data-bar="96" style="flex: 1; background: var(--color-accent); height: 0%;"></div>
              </div>
              <div style="
                margin-top: 12px;
                display: flex; gap: 22px;
                font-family: var(--font-mono);
                font-size: 16px;
                color: var(--color-muted);
              ">
                <span style="flex: 1; text-align: center;">Q1</span>
                <span style="flex: 1; text-align: center;">Q2</span>
                <span style="flex: 1; text-align: center;">Q3</span>
                <span style="flex: 1; text-align: center;">Q4</span>
              </div>
            </div>
            <!-- Radar chart card -->
            <div style="
              flex: 1;
              border: 3px solid var(--color-fg);
              background: var(--color-bg);
              padding: 28px 32px;
              display: flex; flex-direction: column;
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 20px;
                letter-spacing: 0.18em;
                font-weight: 600;
                margin-bottom: 12px;
              ">&#9733; SCORECARD &#183; 5 AXES</div>
              <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="-220 -220 440 440" width="100%" height="100%" style="max-height: 100%;">
                  ${[1, 0.75, 0.5, 0.25].map((r) => `<polygon points="${radarPoints(180 * r)}" fill="none" stroke="#1a2a6a" stroke-width="2" opacity="0.3"/>`).join("")}
                  ${[0, 1, 2, 3, 4]
										.map((i) => {
											const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
											return `<line x1="0" y1="0" x2="${Math.cos(a) * 180}" y2="${Math.sin(a) * 180}" stroke="#1a2a6a" stroke-width="2" opacity="0.3"/>`;
										})
										.join("")}
                  <polygon data-ref="radar-poly" points="0,0 0,0 0,0 0,0 0,0" fill="#ff4f8b" fill-opacity="0.5" stroke="#ff4f8b" stroke-width="3" style="opacity: 0;" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Three.js + Lottie panel -->
          <div data-ref="p-3d" style="
            position: absolute; inset: 0;
            display: flex; gap: 56px;
            opacity: 0;
          ">
            <div style="
              flex: 1 1 0;
              min-width: 0;
              width: 0;
              border: 3px solid var(--color-fg);
              background: var(--color-bg);
              padding: 28px 32px;
              display: flex; flex-direction: column;
              position: relative;
              overflow: hidden;
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 20px;
                letter-spacing: 0.18em;
                font-weight: 600;
                margin-bottom: 8px;
              ">&#9733; MESH &#183; ICOSA</div>
              <div data-ref="three-host" style="flex: 1; min-height: 0; position: relative; overflow: hidden;"></div>
            </div>
            <div style="
              flex: 1 1 0;
              min-width: 0;
              width: 0;
              border: 3px solid var(--color-fg);
              background: var(--color-bg);
              padding: 28px 32px;
              display: flex; flex-direction: column;
              position: relative;
              overflow: hidden;
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 20px;
                letter-spacing: 0.18em;
                font-weight: 600;
                margin-bottom: 8px;
              ">&#9733; LAUNCH &#183; T+00.0</div>
              <div data-ref="lottie-host" style="flex: 1; min-height: 0; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;"></div>
            </div>
          </div>

          <!-- App UI panel: Acme dashboard -->
          <div data-ref="p-app" style="
            position: absolute; inset: 0;
            opacity: 0;
          ">
            <div style="
              position: absolute; inset: 0;
              border: 3px solid var(--color-fg);
              background: var(--color-bg);
              display: grid; grid-template-columns: 240px 1fr;
              overflow: hidden;
            ">
              <!-- Sidebar -->
              <div style="
                padding: 22px 18px;
                border-right: 3px solid var(--color-fg);
                background: var(--color-bg);
                display: flex; flex-direction: column; gap: 6px;
              ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                  <div style="
                    width: 36px; height: 36px;
                    background: var(--color-accent);
                    color: var(--color-bg);
                    font-family: var(--font-display);
                    font-size: 22px;
                    display: flex; align-items: center; justify-content: center;
                  ">A</div>
                  <div style="font-family: var(--font-display); font-size: 22px;">Acme&nbsp;Inc</div>
                </div>
                <div style="
                  font-family: var(--font-mono);
                  font-size: 12px;
                  letter-spacing: 0.18em;
                  color: var(--color-muted);
                  padding: 4px 8px;
                  margin-top: 4px;
                ">OVERVIEW</div>
                <div data-nav="dashboard" style="
                  padding: 8px 12px;
                  font-size: 18px; font-weight: 600;
                  background: var(--color-accent);
                  color: var(--color-bg);
                ">&#9733; Dashboard</div>
                <div data-nav="customers" style="
                  padding: 8px 12px;
                  font-size: 18px; font-weight: 500;
                  color: var(--color-fg);
                ">&#9733; Customers</div>
                <div style="padding: 8px 12px; font-size: 18px; font-weight: 500; color: var(--color-muted);">&#9733; Reports</div>
                <div style="padding: 8px 12px; font-size: 18px; font-weight: 500; color: var(--color-muted);">&#9733; Billing</div>
                <div style="
                  font-family: var(--font-mono);
                  font-size: 12px;
                  letter-spacing: 0.18em;
                  color: var(--color-muted);
                  padding: 4px 8px;
                  margin-top: 12px;
                ">WORKSPACE</div>
                <div style="padding: 8px 12px; font-size: 18px; font-weight: 500; color: var(--color-muted);">&#9733; Team</div>
                <div style="padding: 8px 12px; font-size: 18px; font-weight: 500; color: var(--color-muted);">&#9733; Settings</div>

                <div style="margin-top: auto; padding: 12px 8px; border-top: 2px solid var(--color-fg); display: flex; gap: 10px; align-items: center;">
                  <div style="width: 28px; height: 28px; background: var(--color-fg); color: var(--color-bg); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 13px;">SC</div>
                  <div style="font-size: 14px; font-weight: 600;">Sarah Chen</div>
                </div>
              </div>

              <!-- Main -->
              <div style="display: flex; flex-direction: column; min-width: 0;">
                <!-- Top bar -->
                <div style="
                  padding: 14px 24px;
                  border-bottom: 3px solid var(--color-fg);
                  display: flex; align-items: center; gap: 16px;
                ">
                  <div data-ref="breadcrumb" style="font-family: var(--font-display); font-size: 22px;">Dashboard</div>
                  <div style="
                    flex: 1;
                    padding: 6px 12px;
                    font-family: var(--font-mono);
                    font-size: 14px;
                    color: var(--color-muted);
                    border: 2px solid var(--color-fg);
                    max-width: 280px;
                  ">&#8984;K&nbsp;&nbsp;Search&hellip;</div>
                  <div style="
                    padding: 6px 14px;
                    font-size: 14px; font-weight: 600;
                    border: 2px solid var(--color-fg);
                  ">Invite</div>
                  <div style="
                    padding: 6px 14px;
                    font-size: 14px; font-weight: 600;
                    background: var(--color-accent);
                    color: var(--color-bg);
                  ">+ New report</div>
                </div>

                <!-- Content stack -->
                <div style="flex: 1; padding: 22px; position: relative; overflow: hidden;">
                  <!-- Dashboard view -->
                  <div data-view="dashboard" style="position: absolute; inset: 22px; display: flex; flex-direction: column; gap: 18px;">
                    <!-- KPI row -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;">
                      ${kpiCard("MRR", "$48,392", "+12%")}
                      ${kpiCard("Active users", "2,841", "+318")}
                      ${kpiCard("Conversion", "4.7%", "+0.4")}
                      ${kpiCard("Churn", "1.2%", "-0.1")}
                    </div>
                    <!-- Chart row -->
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 14px; flex: 1; min-height: 0;">
                      <div data-ref="area-card" style="
                        border: 2px solid var(--color-fg);
                        padding: 16px 18px;
                        display: flex; flex-direction: column;
                        opacity: 0;
                      ">
                        <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; font-weight: 600; margin-bottom: 8px;">REVENUE &#183; 30d</div>
                        <svg viewBox="0 0 400 140" preserveAspectRatio="none" style="flex: 1; width: 100%; height: 100%;">
                          <defs>
                            <linearGradient id="area-grad-rs" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0" stop-color="#ff4f8b" stop-opacity="0.55"/>
                              <stop offset="1" stop-color="#ff4f8b" stop-opacity="0"/>
                            </linearGradient>
                          </defs>
                          <path data-ref="area-fill" d="M0,110 L40,98 L80,82 L120,90 L160,70 L200,60 L240,50 L280,40 L320,28 L360,20 L400,12 L400,140 L0,140 Z" fill="url(#area-grad-rs)" opacity="0"/>
                          <path data-ref="area-line" d="M0,110 L40,98 L80,82 L120,90 L160,70 L200,60 L240,50 L280,40 L320,28 L360,20 L400,12" fill="none" stroke="#ff4f8b" stroke-width="3"/>
                        </svg>
                      </div>
                      <div data-ref="bar-card" style="
                        border: 2px solid var(--color-fg);
                        padding: 16px 18px;
                        display: flex; flex-direction: column;
                        opacity: 0;
                      ">
                        <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; font-weight: 600; margin-bottom: 12px;">BY PLAN</div>
                        ${appBarRow("Enterprise", 92)}
                        ${appBarRow("Pro", 70)}
                        ${appBarRow("Team", 48)}
                        ${appBarRow("Starter", 28)}
                      </div>
                    </div>
                  </div>

                  <!-- Customers view -->
                  <div data-view="customers" style="position: absolute; inset: 22px; display: none; flex-direction: column; gap: 12px; opacity: 0;">
                    <div style="
                      border: 2px solid var(--color-fg);
                      flex: 1;
                      display: flex; flex-direction: column;
                    ">
                      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 10px 14px; border-bottom: 2px solid var(--color-fg); font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; font-weight: 600;">
                        <span>NAME</span><span>PLAN</span><span>MRR</span><span>STATUS</span>
                      </div>
                      ${customerRow("Globex Corp", "Enterprise", "$8,400", "Active", "active")}
                      ${customerRow("Initech LLC", "Pro", "$1,290", "Active", "active")}
                      ${customerRow("Hooli", "Team", "$640", "Trial", "trial")}
                      ${customerRow("Stark Industries", "Enterprise", "$12,800", "Past due", "past")}
                      ${customerRow("Wayne Tech", "Pro", "$1,290", "Active", "active")}
                    </div>
                    <div data-ref="action-panel" style="
                      border: 2px solid var(--color-fg);
                      padding: 14px 18px;
                      display: flex; gap: 14px; align-items: center;
                      opacity: 0;
                    ">
                      <span style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.16em; font-weight: 600;">NOTE</span>
                      <span data-ref="note-text" style="flex: 1; font-family: var(--font-mono); font-size: 16px;"></span>
                      <span data-ref="note-send" style="
                        padding: 6px 14px;
                        font-size: 14px; font-weight: 600;
                        background: var(--color-accent);
                        color: var(--color-bg);
                      ">Send &#9166;</span>
                    </div>
                    <div data-ref="toast" style="
                      position: absolute;
                      right: 0; bottom: 80px;
                      padding: 10px 16px;
                      background: var(--color-fg);
                      color: var(--color-bg);
                      font-size: 15px; font-weight: 600;
                      opacity: 0;
                    ">&#10003; Note sent &#183; payment retry queued</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom title -->
        <div data-ref="bottom-title" style="
          position: absolute;
          left: var(--safe-x); right: var(--safe-x);
          bottom: 60px;
          font-family: var(--font-display);
          font-size: 56px;
          line-height: 1;
          letter-spacing: -0.02em;
          color: var(--color-fg);
          white-space: nowrap;
          opacity: 0;
          z-index: 10;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">if the browser can render it, videowright can animate it.</span>
            <span style="position: relative;">if the browser can render it, videowright can animate it.</span>
          </span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const panelLabel = host?.querySelector('[data-ref="panel-label"]') as HTMLElement;
		const panelLabelText = host?.querySelector('[data-ref="panel-label-text"]') as HTMLElement;
		const bottomTitle = host?.querySelector('[data-ref="bottom-title"]') as HTMLElement;

		const stepEase = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: stepEase };

		const showPanel = (sel: string) => {
			const p = host?.querySelector(sel) as HTMLElement;
			p.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });
		};
		const hidePanel = (sel: string) => {
			const p = host?.querySelector(sel) as HTMLElement;
			p.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, duration: 160 });
		};
		const setLabel = (text: string) => {
			panelLabelText.textContent = text;
			panelLabel.animate(
				[
					{ opacity: 0, transform: "translateY(-6px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 200 },
			);
		};
		const hideLabel = () => {
			panelLabel.animate([{ opacity: 1 }, { opacity: 0 }], {
				...opts,
				duration: 120,
			});
		};

		const sceneStart = ctx.clock();
		const waitUntil = async (ms: number) => {
			const elapsed = ctx.clock() - sceneStart;
			const remaining = ms - elapsed;
			if (remaining > 0) await ctx.hold(remaining);
		};

		// Bottom title stamps in immediately and holds throughout
		bottomTitle.animate(
			[
				{ opacity: 0, transform: "translateY(10px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 280, delay: 100 },
		);

		// === Panel 1: SVG (0.0 – 2.0s) ===
		setLabel("SVG");
		showPanel('[data-ref="p-svg"]');

		// Animate the three orbiting circles with a stop-motion path stagger
		const o1 = host?.querySelector("[data-svg-orbit-1]") as SVGCircleElement;
		const o2 = host?.querySelector("[data-svg-orbit-2]") as SVGCircleElement;
		const o3 = host?.querySelector("[data-svg-orbit-3]") as SVGCircleElement;
		o1.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
			duration: 4200,
			iterations: Number.POSITIVE_INFINITY,
			easing: stepEase,
		});
		o2.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }], {
			duration: 3200,
			iterations: Number.POSITIVE_INFINITY,
			easing: stepEase,
		});
		o3.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
			duration: 2400,
			iterations: Number.POSITIVE_INFINITY,
			easing: stepEase,
		});

		// === Panel 2: ECharts (2.0 – 4.5s) ===
		await waitUntil(2000);
		hidePanel('[data-ref="p-svg"]');
		hideLabel();
		await ctx.hold(180);
		setLabel("ECharts");
		showPanel('[data-ref="p-charts"]');

		// Bar chart fills
		host?.querySelectorAll("[data-bar]").forEach((b, i) => {
			const v = Number.parseInt((b as HTMLElement).getAttribute("data-bar") || "0", 10);
			(b as HTMLElement).animate([{ height: "0%" }, { height: `${v}%` }], {
				...opts,
				duration: 520,
				delay: i * 70,
			});
		});

		// Radar polygon snaps in — stop-motion stepped reveal, then updates mid-beat
		const radarPoly = host?.querySelector('[data-ref="radar-poly"]') as SVGPolygonElement;
		const radarTarget1 = pentagonPoints([0.55, 0.85, 0.65, 0.9, 0.7]);
		const radarTarget2 = pentagonPoints([0.85, 0.6, 0.92, 0.5, 0.8]);
		radarPoly.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 240,
		});
		radarPoly.setAttribute("points", radarTarget1);
		await ctx.hold(1100);
		radarPoly.animate([{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }], {
			...opts,
			duration: 320,
		});
		await ctx.hold(160);
		radarPoly.setAttribute("points", radarTarget2);

		// === Panel 3: Three.js + Lottie (4.5 – 8.0s) ===
		await waitUntil(4500);
		hidePanel('[data-ref="p-charts"]');
		hideLabel();
		await ctx.hold(180);
		setLabel("Three.js + Lottie");
		showPanel('[data-ref="p-3d"]');

		// --- Three.js setup
		const threeHost = host?.querySelector('[data-ref="three-host"]') as HTMLElement;
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

		// Vertex dots in pink
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
			color: PINK,
			size: 0.14,
			sizeAttenuation: true,
		});
		const vertexPoints = new THREE.Points(vertGeo, vertMat);
		mainGroup.add(vertexPoints);

		// Orbital ring of pink points
		const orbitCount = 40;
		const orbitCoords: number[] = [];
		for (let i = 0; i < orbitCount; i++) {
			const a = (i / orbitCount) * Math.PI * 2;
			orbitCoords.push(Math.cos(a) * 2.4, Math.sin(a * 1.7) * 0.25, Math.sin(a) * 2.4);
		}
		const orbitGeo = new THREE.BufferGeometry();
		orbitGeo.setAttribute("position", new THREE.Float32BufferAttribute(orbitCoords, 3));
		const orbitMat = new THREE.PointsMaterial({
			color: PINK,
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

		// --- Lottie setup
		const lottieHost = host?.querySelector('[data-ref="lottie-host"]') as HTMLElement;
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

		// === Panel 4: App UI (8.0s → end) ===
		await waitUntil(8000);
		hidePanel('[data-ref="p-3d"]');
		hideLabel();
		await ctx.hold(180);
		setLabel("Your React components");
		showPanel('[data-ref="p-app"]');

		// KPIs stamp in + count up
		host?.querySelectorAll("[data-kpi]").forEach((c, i) => {
			(c as HTMLElement).animate(
				[
					{ opacity: 0, transform: "translateY(8px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 280, delay: 120 + i * 80 },
			);
		});

		const kpiTargets: Array<{ el: HTMLElement; target: string }> = [];
		const targetEls = host?.querySelectorAll("[data-target]");
		if (targetEls) {
			for (const el of targetEls) {
				kpiTargets.push({
					el: el as HTMLElement,
					target: (el as HTMLElement).getAttribute("data-target") || "",
				});
			}
		}
		const countUpStart = ctx.clock();
		const countUpDur = 900;
		const countUpTick = () => {
			if (ctx.signal.aborted) return;
			const elapsed = ctx.clock() - countUpStart;
			const t = Math.min(1, elapsed / countUpDur);
			const e = 1 - (1 - t) ** 3;
			for (const { el, target } of kpiTargets) {
				const m = target.match(/([^0-9]*)([\d,]+(?:\.\d+)?)([^0-9]*)$/);
				if (!m) {
					el.textContent = target;
					continue;
				}
				const [, prefix, num, suffix] = m;
				const hasDecimal = num.includes(".");
				const targetNum = Number.parseFloat(num.replace(/,/g, ""));
				const cur = targetNum * e;
				let formatted: string;
				if (hasDecimal) formatted = cur.toFixed(1);
				else if (targetNum >= 1000) formatted = Math.round(cur).toLocaleString("en-US");
				else formatted = Math.round(cur).toString();
				el.textContent = prefix + formatted + suffix;
			}
			if (t < 1) requestAnimationFrame(countUpTick);
		};
		await ctx.hold(380);
		requestAnimationFrame(countUpTick);

		const areaCard = host?.querySelector('[data-ref="area-card"]') as HTMLElement;
		const barCard = host?.querySelector('[data-ref="bar-card"]') as HTMLElement;
		areaCard.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 320, delay: 80 },
		);
		barCard.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 320, delay: 200 },
		);
		await ctx.hold(360);

		const areaLine = host?.querySelector('[data-ref="area-line"]') as SVGPathElement;
		const areaFill = host?.querySelector('[data-ref="area-fill"]') as SVGPathElement;
		const pathLen = areaLine.getTotalLength();
		areaLine.style.strokeDasharray = `${pathLen}`;
		areaLine.style.strokeDashoffset = `${pathLen}`;
		areaLine.animate([{ strokeDashoffset: pathLen }, { strokeDashoffset: 0 }], {
			duration: 900,
			easing: "ease-out",
			fill: "forwards",
		});
		areaFill.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 500,
			delay: 500,
			fill: "forwards",
		});

		host?.querySelectorAll("[data-app-bar]").forEach((bar, i) => {
			const v = Number.parseInt((bar as HTMLElement).getAttribute("data-app-bar") || "0", 10);
			(bar as HTMLElement).animate([{ width: "0%" }, { width: `${v}%` }], {
				...opts,
				duration: 500,
				delay: 220 + i * 70,
			});
		});

		// === Phase 2: Customers (12.0s) ===
		await waitUntil(12000);
		const dashNav = host?.querySelector('[data-nav="dashboard"]') as HTMLElement;
		const custNav = host?.querySelector('[data-nav="customers"]') as HTMLElement;
		dashNav.style.background = "transparent";
		dashNav.style.color = "var(--color-fg)";
		custNav.style.background = "var(--color-accent)";
		custNav.style.color = "var(--color-bg)";

		const breadcrumb = host?.querySelector('[data-ref="breadcrumb"]') as HTMLElement;
		breadcrumb.textContent = "Customers";

		const dashView = host?.querySelector('[data-view="dashboard"]') as HTMLElement;
		const custView = host?.querySelector('[data-view="customers"]') as HTMLElement;
		dashView.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 200,
		});
		custView.style.display = "flex";
		custView.animate(
			[
				{ opacity: 0, transform: "translateX(8px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 280, delay: 120 },
		);

		host?.querySelectorAll("[data-row]").forEach((row, i) => {
			(row as HTMLElement).animate(
				[
					{ opacity: 0, transform: "translateY(6px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 240, delay: 260 + i * 60 },
			);
		});

		// Action panel + note typing + toast
		await waitUntil(13800);
		const actionPanel = host?.querySelector('[data-ref="action-panel"]') as HTMLElement;
		actionPanel.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 240 },
		);
		await ctx.hold(280);
		const noteEl = host?.querySelector('[data-ref="note-text"]') as HTMLElement;
		const note = "Payment retry — try card on file Tue 9am";
		const noteStep = 1300 / note.length;
		for (let i = 0; i <= note.length; i++) {
			if (ctx.signal.aborted) return;
			noteEl.textContent = note.slice(0, i);
			await ctx.hold(noteStep);
		}
		await ctx.hold(120);
		const toast = host?.querySelector('[data-ref="toast"]') as HTMLElement;
		toast.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 280 },
		);

		// Clear the panel label + bottom tagline before the segment ends,
		// so they don't bleed into the fade transition to the next segment.
		await ctx.hold(800);
		panelLabel.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, duration: 240 });
		bottomTitle.animate(
			[
				{ opacity: 1, transform: "translateY(0)" },
				{ opacity: 0, transform: "translateY(6px)" },
			],
			{ ...opts, duration: 280, delay: 80 },
		);

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

function radarPoints(r: number): string {
	return [0, 1, 2, 3, 4]
		.map((i) => {
			const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
			return `${Math.cos(a) * r},${Math.sin(a) * r}`;
		})
		.join(" ");
}

function pentagonPoints(radii: number[]): string {
	const R = 180;
	return radii
		.map((rNorm, i) => {
			const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
			const r = R * rNorm;
			return `${Math.cos(a) * r},${Math.sin(a) * r}`;
		})
		.join(" ");
}

function kpiCard(label: string, target: string, delta: string): string {
	return `
    <div data-kpi style="
      border: 2px solid var(--color-fg);
      padding: 14px 16px;
      opacity: 0;
      display: flex; flex-direction: column; gap: 4px;
    ">
      <div style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; font-weight: 600; color: var(--color-muted);">${label.toUpperCase()}</div>
      <div data-target="${target}" style="font-family: var(--font-display); font-size: 36px; color: var(--color-fg);">0</div>
      <div style="font-family: var(--font-mono); font-size: 12px; color: var(--color-accent); font-weight: 600;">${delta}</div>
    </div>
  `;
}

function appBarRow(label: string, val: number): string {
	return `
    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
      <span style="font-size: 12px; font-family: var(--font-mono); flex: 0 0 90px;">${label}</span>
      <div style="flex: 1; height: 14px; border: 2px solid var(--color-fg); position: relative;">
        <div data-app-bar="${val}" style="position: absolute; left: -2px; top: -2px; bottom: -2px; width: 0%; background: var(--color-accent);"></div>
      </div>
    </div>
  `;
}

function customerRow(
	name: string,
	plan: string,
	mrr: string,
	status: string,
	statusKey: string,
): string {
	const statusColor =
		statusKey === "past"
			? "var(--color-accent)"
			: statusKey === "trial"
				? "var(--color-second)"
				: "var(--color-fg)";
	const statusBg =
		statusKey === "past"
			? "var(--color-accent)"
			: statusKey === "trial"
				? "var(--color-second)"
				: "transparent";
	const statusFg =
		statusKey === "past" || statusKey === "trial" ? "var(--color-bg)" : "var(--color-fg)";
	return `
    <div data-row style="
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
      padding: 10px 14px;
      border-bottom: 1px solid var(--color-fg);
      font-size: 15px;
      opacity: 0;
    ">
      <span style="font-weight: 600;">${name}</span>
      <span style="font-family: var(--font-mono); font-size: 13px;">${plan}</span>
      <span style="font-family: var(--font-mono); font-size: 13px;">${mrr}</span>
      <span><span style="
        padding: 2px 10px;
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.06em;
        background: ${statusBg};
        color: ${statusFg};
        border: 2px solid ${statusColor};
      ">${status}</span></span>
    </div>
  `;
}
