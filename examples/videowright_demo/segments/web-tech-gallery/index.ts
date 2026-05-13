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
	innerMesh: THREE.Mesh;
	orbitPoints: THREE.Points;
	dustPoints: THREE.Points;
	edges: THREE.LineSegments;
	vertexPoints: THREE.Points;
};
let three: ThreeScene | null = null;

function panel(id: string, label: string): string {
	return `
    <div data-ref="${id}" data-panel style="
      position: absolute; inset: 0;
      opacity: 0;
      pointer-events: none;
    ">
      <div style="
        position: absolute; top: 28px; left: 36px;
        display: flex; align-items: center; gap: 14px;
        font-family: var(--font-mono);
        font-size: 28px;
        font-weight: 500;
        letter-spacing: 0.06em;
        color: var(--color-accent);
      ">
        <span style="
          display: inline-block; width: 14px; height: 14px;
          background: var(--color-accent);
        "></span>
        <span>${label}</span>
      </div>
      <div data-ref="${id}-body" style="
        position: absolute; inset: 100px 36px 36px 36px;
        display: flex; align-items: center; justify-content: center;
      "></div>
    </div>
  `;
}

export default defineSegment({
	id: "web-tech-gallery",
	advances: [24.0],
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
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <div data-ref="stage" style="
          position: absolute;
          left: var(--safe-x); right: var(--safe-x);
          top: var(--safe-y); bottom: 180px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          overflow: hidden;
        ">
          ${panel("p-svg", "SVG")}
          ${panel("p-charts", "ECharts")}
          ${panel("p-3d", "Three.js + Lottie")}
          ${panel("p-app", "Your App's UI")}
        </div>

        <div data-ref="bottom-title" style="
          position: absolute;
          left: 50%; bottom: 90px;
          transform: translate(-50%, 0);
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 500;
          letter-spacing: -0.01em;
          text-align: center;
          white-space: nowrap;
          opacity: 0;
        ">If the browser can render it, Videowright can animate it.</div>

        <div data-ref="bottom-tagline" style="
          display: none;
          position: absolute;
          left: 50%; bottom: 90px;
          transform: translate(-50%, 0);
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 500;
          color: var(--color-accent);
          letter-spacing: -0.01em;
          text-align: center;
          white-space: nowrap;
          opacity: 0;
        ">SVG. Charts. Three.js. Lottie. Your actual product.</div>

        <div style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        ">
          <span>BEAT 03</span>
          <span data-ref="coord-t">T 00.00s</span>
          <span style="margin-left: auto;">GALLERY · 4 SCENES</span>
        </div>
      </div>
    `;

		// --- SVG panel: animated circles tracing paths ---
		const svgBody = el.querySelector('[data-ref="p-svg-body"]') as HTMLElement;
		svgBody.innerHTML = `
      <svg viewBox="0 0 800 480" style="width: 100%; height: 100%;">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="var(--cyan)" />
            <stop offset="1" stop-color="var(--color-accent)" />
          </linearGradient>
        </defs>
        <g data-ref="svg-orbits">
          <circle cx="400" cy="240" r="180" fill="none" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="4 6" style="opacity: 0;"/>
          <circle cx="400" cy="240" r="120" fill="none" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="4 6" style="opacity: 0;"/>
          <circle cx="400" cy="240" r="60" fill="none" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="4 6" style="opacity: 0;"/>
        </g>
        <g data-ref="svg-orb-1" style="transform-origin: 400px 240px;">
          <circle cx="580" cy="240" r="10" fill="url(#g1)" />
        </g>
        <g data-ref="svg-orb-2" style="transform-origin: 400px 240px;">
          <circle cx="520" cy="240" r="7" fill="var(--cyan)" />
        </g>
        <g data-ref="svg-orb-3" style="transform-origin: 400px 240px;">
          <circle cx="460" cy="240" r="5" fill="var(--color-accent)" />
        </g>
        <circle cx="400" cy="240" r="14" fill="var(--color-bg)" stroke="var(--color-accent)" stroke-width="2"/>
      </svg>
    `;

		// --- ECharts panel: bar + radar (CSS-only approximation) ---
		const chartsBody = el.querySelector('[data-ref="p-charts-body"]') as HTMLElement;
		chartsBody.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 36px; width: 100%; height: 100%; padding: 8px;">
        <div data-ref="bars-wrap" style="
          position: relative;
          border-left: 2px solid var(--color-muted);
          border-bottom: 2px solid var(--color-muted);
          padding: 0 0 40px 12px;
        ">
          <div style="
            position: absolute; top: 0; left: 16px;
            font-family: var(--font-mono); font-size: 20px;
            color: var(--color-muted); letter-spacing: 0.08em;
          ">REVENUE · QTRS</div>
          <div data-ref="bars" style="
            position: absolute; left: 36px; right: 18px; bottom: 50px; top: 56px;
            display: flex; gap: 14px; align-items: flex-end;
          "></div>
          <div data-ref="bar-labels" style="
            position: absolute; left: 36px; right: 18px; bottom: 8px;
            display: flex; gap: 14px;
            font-family: var(--font-mono); font-size: 18px;
            color: var(--color-muted); letter-spacing: 0.08em;
          "></div>
        </div>

        <div data-ref="radar-wrap" style="
          position: relative;
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="
            position: absolute; top: 0; left: 0;
            font-family: var(--font-mono); font-size: 20px;
            color: var(--color-muted); letter-spacing: 0.08em;
          ">SCORECARD · 5 AXES</div>
          <svg viewBox="0 0 400 400" style="width: 100%; height: 100%;">
            <g stroke="var(--color-muted)" stroke-width="1" fill="none" opacity="0.45">
              ${[40, 80, 120, 160]
								.map(
									(r) =>
										`<polygon points="${[0, 1, 2, 3, 4]
											.map((i) => {
												const a = ((-90 + i * 72) * Math.PI) / 180;
												return `${200 + Math.cos(a) * r},${200 + Math.sin(a) * r}`;
											})
											.join(" ")}" />`,
								)
								.join("")}
              ${[0, 1, 2, 3, 4]
								.map((i) => {
									const a = ((-90 + i * 72) * Math.PI) / 180;
									return `<line x1="200" y1="200" x2="${200 + Math.cos(a) * 160}" y2="${200 + Math.sin(a) * 160}" />`;
								})
								.join("")}
            </g>
            <polygon data-ref="radar-shape"
              points="200,200 200,200 200,200 200,200 200,200"
              fill="var(--color-accent)" fill-opacity="0.25"
              stroke="var(--color-accent)" stroke-width="2"/>
          </svg>
        </div>
      </div>
    `;

		// Build bars
		const bars = el.querySelector('[data-ref="bars"]') as HTMLElement;
		const barLabels = el.querySelector('[data-ref="bar-labels"]') as HTMLElement;
		const labels = ["Q1", "Q2", "Q3", "Q4"];
		for (const lab of labels) {
			const bar = document.createElement("div");
			bar.setAttribute("data-bar", "");
			bar.style.cssText = `
        flex: 1;
        background: linear-gradient(to top, var(--color-accent), var(--cyan));
        height: 0%;
        min-height: 2px;
      `;
			bars.appendChild(bar);
			const lblEl = document.createElement("div");
			lblEl.style.cssText = "flex: 1; text-align: center;";
			lblEl.textContent = lab;
			barLabels.appendChild(lblEl);
		}

		// --- 3D panel: wireframe sphere (CSS) + rocket SVG ---
		const threeBody = el.querySelector('[data-ref="p-3d-body"]') as HTMLElement;
		threeBody.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 36px; width: 100%; height: 100%;">
        <div style="
          position: relative;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        ">
          <div data-ref="three-host" style="
            width: 100%; height: 100%;
            position: relative;
          "></div>

          <!-- Blueprint overlay: subtle axis ticks only (no tiny labels) -->
          <svg style="
            position: absolute; inset: 0;
            width: 100%; height: 100%;
            pointer-events: none;
          " viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
            <g stroke="var(--cyan)" stroke-width="1" opacity="0.35" fill="none">
              <line x1="200" y1="20" x2="200" y2="60" />
              <line x1="200" y1="340" x2="200" y2="380" />
              <line x1="20" y1="200" x2="60" y2="200" />
              <line x1="340" y1="200" x2="380" y2="200" />
            </g>
          </svg>

        </div>

        <div style="
          position: relative;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        ">
          <div data-ref="lottie-host" style="
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
          "></div>
        </div>
      </div>
    `;

		// --- App UI panel: shadcn-style enterprise SaaS dashboard ---
		const appBody = el.querySelector('[data-ref="p-app-body"]') as HTMLElement;

		const navItem = (key: string, label: string, icon: string, active = false) => `
      <div data-nav="${key}" style="
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px;
        border-radius: 6px;
        margin: 2px 0;
        font-size: 18px;
        color: ${active ? "var(--color-fg)" : "var(--color-muted)"};
        background: ${active ? "rgba(255, 136, 0, 0.10)" : "transparent"};
        ${active ? "box-shadow: inset 2px 0 0 var(--color-accent);" : ""}
        cursor: default;
      ">
        <span style="font-family: var(--font-mono); font-size: 16px; opacity: 0.8;">${icon}</span>
        <span>${label}</span>
      </div>
    `;

		const kpiCard = (key: string, label: string, target: string, delta: string) => `
      <div data-kpi="${key}" style="
        padding: 18px 20px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background: var(--color-surface);
        opacity: 0;
        transform: translateY(8px);
      ">
        <div style="font-size: 14px; color: var(--color-muted); margin-bottom: 6px;">${label}</div>
        <div data-ref="kpi-${key}-value" data-target="${target}" style="
          font-family: var(--font-mono); font-size: 32px; font-weight: 500;
          line-height: 1; letter-spacing: -0.01em;
        ">—</div>
        <div style="
          margin-top: 8px;
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #9fc77a;
        ">
          <span>↑</span><span>${delta}</span>
          <span style="color: var(--color-muted); margin-left: 4px;">vs last 30d</span>
        </div>
      </div>
    `;

		appBody.innerHTML = `
      <div style="
        width: 100%; height: 100%;
        background: #0c1218;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        display: grid; grid-template-columns: 260px 1fr; grid-template-rows: 56px 1fr;
        font-family: var(--font-body);
        overflow: hidden;
      ">
        <!-- Sidebar -->
        <aside style="
          grid-row: span 2;
          background: #07101a;
          border-right: 1px solid var(--color-border);
          padding: 16px 12px;
          display: flex; flex-direction: column;
        ">
          <!-- Workspace header -->
          <div style="
            display: flex; align-items: center; gap: 10px;
            padding: 6px 10px 14px;
            border-bottom: 1px solid var(--color-border);
          ">
            <div style="
              width: 32px; height: 32px;
              background: var(--color-accent);
              border-radius: 6px;
              display: flex; align-items: center; justify-content: center;
              font-family: var(--font-display); font-weight: 700; font-size: 18px;
              color: #0a0a0a;
            ">A</div>
            <div>
              <div style="font-size: 15px; font-weight: 500;">Acme Inc</div>
              <div style="font-family: var(--font-mono); font-size: 11px; color: var(--color-muted);">workspace</div>
            </div>
            <div style="margin-left: auto; color: var(--color-muted); font-size: 14px;">⌄</div>
          </div>

          <div style="
            font-family: var(--font-mono); font-size: 11px;
            letter-spacing: 0.14em; color: var(--color-muted);
            padding: 16px 14px 6px;
          ">OVERVIEW</div>
          ${navItem("dashboard", "Dashboard", "▦", true)}
          ${navItem("customers", "Customers", "◉")}
          ${navItem("revenue", "Revenue", "$")}
          ${navItem("reports", "Reports", "▤")}

          <div style="
            font-family: var(--font-mono); font-size: 11px;
            letter-spacing: 0.14em; color: var(--color-muted);
            padding: 16px 14px 6px;
          ">WORKSPACE</div>
          ${navItem("team", "Team", "◑")}
          ${navItem("billing", "Billing", "▢")}
          ${navItem("settings", "Settings", "⚙")}

          <!-- User card at bottom -->
          <div style="
            margin-top: auto;
            display: flex; align-items: center; gap: 10px;
            padding: 10px;
            border-top: 1px solid var(--color-border);
            font-size: 14px;
          ">
            <div style="
              width: 30px; height: 30px; border-radius: 50%;
              background: linear-gradient(135deg, var(--cyan), var(--color-accent));
            "></div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 500;">Sarah Chen</div>
              <div style="color: var(--color-muted); font-size: 12px;">sarah@acme.co</div>
            </div>
          </div>
        </aside>

        <!-- Top bar -->
        <header style="
          display: flex; align-items: center; gap: 18px;
          padding: 0 24px;
          border-bottom: 1px solid var(--color-border);
          background: #0c1218;
        ">
          <div style="
            display: flex; align-items: center; gap: 8px;
            font-size: 14px; color: var(--color-muted);
          ">
            Acme <span style="opacity: 0.5;">/</span>
            <span data-ref="breadcrumb" style="color: var(--color-fg);">Dashboard</span>
          </div>
          <div style="
            margin-left: 28px;
            padding: 7px 14px;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            background: #0a0f14;
            display: flex; align-items: center; gap: 10px;
            min-width: 280px;
            font-size: 13px;
            color: var(--color-muted);
          ">
            <span style="opacity: 0.7;">⌕</span>
            <span>Search…</span>
            <span style="
              margin-left: auto;
              font-family: var(--font-mono); font-size: 11px;
              padding: 2px 6px;
              background: var(--color-surface);
              border: 1px solid var(--color-border);
              border-radius: 3px;
            ">⌘K</span>
          </div>
          <div style="
            margin-left: auto;
            display: flex; align-items: center; gap: 14px;
          ">
            <button style="
              padding: 7px 14px;
              border-radius: 6px;
              border: 1px solid var(--color-border);
              background: var(--color-surface);
              color: var(--color-fg);
              font-size: 13px;
            ">Invite</button>
            <button style="
              padding: 7px 14px;
              border-radius: 6px;
              border: none;
              background: var(--color-accent);
              color: #0a0a0a;
              font-size: 13px;
              font-weight: 500;
            ">+ New report</button>
          </div>
        </header>

        <!-- Main content area -->
        <main style="position: relative; overflow: hidden;">
          <!-- DASHBOARD VIEW -->
          <section data-view="dashboard" style="
            position: absolute; inset: 0;
            padding: 22px 28px;
            display: flex; flex-direction: column; gap: 18px;
            overflow: hidden;
          ">
            <div>
              <div style="
                font-family: var(--font-display); font-size: 24px;
                font-weight: 500; margin-bottom: 2px;
              ">Welcome back, Sarah</div>
              <div style="font-size: 14px; color: var(--color-muted);">
                Here's what's happening across the workspace today.
              </div>
            </div>

            <!-- KPI Row -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;">
              ${kpiCard("mrr", "MRR", "$48,392", "12.4%")}
              ${kpiCard("users", "Active users", "2,841", "8.1%")}
              ${kpiCard("conv", "Conversion", "4.7%", "0.6 pts")}
              ${kpiCard("churn", "Churn", "1.2%", "0.3 pts")}
            </div>

            <!-- Charts row -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 14px; flex: 1; min-height: 0;">
              <div data-ref="area-card" style="
                padding: 16px 18px;
                border: 1px solid var(--color-border);
                border-radius: 8px;
                background: var(--color-surface);
                display: flex; flex-direction: column;
                opacity: 0;
                transform: translateY(8px);
              ">
                <div style="
                  display: flex; align-items: center;
                  justify-content: space-between;
                  margin-bottom: 12px;
                ">
                  <div style="font-size: 14px; font-weight: 500;">Revenue · 30d</div>
                  <div style="
                    display: flex; gap: 6px;
                    font-family: var(--font-mono); font-size: 11px;
                  ">
                    <span style="padding: 3px 8px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-fg);">30d</span>
                    <span style="padding: 3px 8px; color: var(--color-muted);">90d</span>
                    <span style="padding: 3px 8px; color: var(--color-muted);">1y</span>
                  </div>
                </div>
                <svg data-ref="area-chart" viewBox="0 0 600 200" preserveAspectRatio="none"
                  style="width: 100%; flex: 1;">
                  <defs>
                    <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="var(--color-accent)" stop-opacity="0.32" />
                      <stop offset="1" stop-color="var(--color-accent)" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <!-- Grid -->
                  <g stroke="var(--color-border)" stroke-width="1">
                    <line x1="0" y1="50" x2="600" y2="50" />
                    <line x1="0" y1="100" x2="600" y2="100" />
                    <line x1="0" y1="150" x2="600" y2="150" />
                  </g>
                  <!-- Area fill (animated by clip-path) -->
                  <path data-ref="area-fill" d="M0,180 L0,140 C60,135 100,120 160,110 C220,100 260,115 320,95 C380,75 420,90 480,65 C540,40 580,55 600,30 L600,200 L0,200 Z"
                    fill="url(#area-fill)" style="opacity: 0;" />
                  <!-- Stroke line. Hidden at mount via stroke-dashoffset so it
                       can't flash visible between mount and play()'s setup. -->
                  <path data-ref="area-line" d="M0,140 C60,135 100,120 160,110 C220,100 260,115 320,95 C380,75 420,90 480,65 C540,40 580,55 600,30"
                    fill="none" stroke="var(--color-accent)" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round"
                    style="stroke-dasharray: 2000; stroke-dashoffset: 2000;" />
                  <!-- End dot -->
                  <circle data-ref="area-dot" cx="600" cy="30" r="4" fill="var(--color-accent)"
                    style="opacity: 0;" />
                </svg>
              </div>

              <div data-ref="bar-card" style="
                padding: 16px 18px;
                border: 1px solid var(--color-border);
                border-radius: 8px;
                background: var(--color-surface);
                display: flex; flex-direction: column;
                opacity: 0;
                transform: translateY(8px);
              ">
                <div style="font-size: 14px; font-weight: 500; margin-bottom: 14px;">
                  By plan
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
                  ${[
										{ name: "Enterprise", val: 92, mono: "$28.4k" },
										{ name: "Pro", val: 65, mono: "$14.2k" },
										{ name: "Team", val: 48, mono: "$5.1k" },
										{ name: "Starter", val: 22, mono: "$0.7k" },
									]
										.map(
											(b) => `
                    <div data-bar-row="${b.name}" style="opacity: 0;">
                      <div style="
                        display: flex; justify-content: space-between;
                        font-size: 12px; margin-bottom: 4px;
                      ">
                        <span>${b.name}</span>
                        <span style="font-family: var(--font-mono); color: var(--color-muted);">${b.mono}</span>
                      </div>
                      <div style="
                        height: 6px; background: var(--color-bg);
                        border-radius: 3px; overflow: hidden;
                      ">
                        <div data-bar-fill="${b.val}" style="
                          height: 100%; width: 0%;
                          background: var(--cyan);
                        "></div>
                      </div>
                    </div>
                  `,
										)
										.join("")}
                </div>
              </div>
            </div>
          </section>

          <!-- CUSTOMERS VIEW -->
          <section data-view="customers" style="
            position: absolute; inset: 0;
            padding: 22px 28px;
            display: none;
            flex-direction: column; gap: 16px;
            overflow: hidden;
          ">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="
                font-family: var(--font-display); font-size: 24px;
                font-weight: 500;
              ">Customers</div>
              <div style="
                padding: 3px 10px;
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: 12px;
                font-family: var(--font-mono); font-size: 12px;
                color: var(--color-muted);
              ">2,841 total</div>
              <div style="margin-left: auto; display: flex; gap: 10px;">
                <button style="
                  padding: 6px 12px;
                  border-radius: 6px;
                  border: 1px solid var(--color-border);
                  background: var(--color-surface);
                  color: var(--color-fg);
                  font-size: 13px;
                ">Filter</button>
                <button style="
                  padding: 6px 12px;
                  border-radius: 6px;
                  border: 1px solid var(--color-border);
                  background: var(--color-surface);
                  color: var(--color-fg);
                  font-size: 13px;
                ">Export</button>
              </div>
            </div>

            <!-- Table -->
            <div style="
              border: 1px solid var(--color-border);
              border-radius: 8px;
              background: var(--color-surface);
              overflow: hidden;
            ">
              <div style="
                display: grid;
                grid-template-columns: 1.6fr 1fr 0.8fr 0.8fr 0.6fr;
                padding: 12px 16px;
                background: #0a0f14;
                border-bottom: 1px solid var(--color-border);
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.08em;
                color: var(--color-muted);
              ">
                <div>CUSTOMER</div>
                <div>PLAN</div>
                <div>MRR</div>
                <div>STATUS</div>
                <div></div>
              </div>
              ${[
								{
									name: "Globex Corp",
									email: "ops@globex.com",
									plan: "Enterprise",
									mrr: "$4,800",
									status: "Active",
									color: "#9fc77a",
								},
								{
									name: "Initech",
									email: "billing@initech.io",
									plan: "Pro",
									mrr: "$1,400",
									status: "Active",
									color: "#9fc77a",
								},
								{
									name: "Wonka Industries",
									email: "finance@wonka.co",
									plan: "Pro",
									mrr: "$1,400",
									status: "Trial",
									color: "var(--cyan)",
								},
								{
									name: "Cyberdyne Systems",
									email: "skynet@cyberdyne.ai",
									plan: "Enterprise",
									mrr: "$6,200",
									status: "Active",
									color: "#9fc77a",
								},
								{
									name: "Stark Industries",
									email: "tony@stark.com",
									plan: "Enterprise",
									mrr: "$9,400",
									status: "Past due",
									color: "var(--warn)",
								},
							]
								.map(
									(r, i) => `
                <div data-row="${i}" style="
                  display: grid;
                  grid-template-columns: 1.6fr 1fr 0.8fr 0.8fr 0.6fr;
                  padding: 12px 16px;
                  font-size: 13px;
                  border-bottom: ${i < 4 ? "1px solid var(--color-border)" : "none"};
                  align-items: center;
                  opacity: 0;
                  transform: translateY(6px);
                ">
                  <div>
                    <div style="font-weight: 500;">${r.name}</div>
                    <div style="color: var(--color-muted); font-size: 11px; font-family: var(--font-mono);">${r.email}</div>
                  </div>
                  <div>${r.plan}</div>
                  <div style="font-family: var(--font-mono);">${r.mrr}</div>
                  <div>
                    <span style="
                      padding: 2px 8px;
                      border: 1px solid ${r.color};
                      border-radius: 12px;
                      color: ${r.color};
                      font-size: 11px;
                    ">${r.status}</span>
                  </div>
                  <div style="text-align: right; color: var(--color-muted);">⋯</div>
                </div>
              `,
								)
								.join("")}
            </div>

            <!-- Action panel (note dialog) -->
            <div data-ref="action-panel" style="
              padding: 14px 16px;
              border: 1px solid var(--color-border);
              border-radius: 8px;
              background: var(--color-surface);
              display: flex; align-items: center; gap: 12px;
              opacity: 0;
            ">
              <div style="
                font-size: 13px; color: var(--color-muted);
              ">Send note to <span style="color: var(--color-fg);">Stark Industries</span>:</div>
              <div style="
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--color-border);
                background: #0a0f14;
                border-radius: 6px;
                font-size: 13px;
                color: var(--color-fg);
              ">
                <span data-ref="note-text"></span><span data-ref="note-caret" style="
                  display: inline-block; width: 2px; height: 14px;
                  background: var(--color-accent);
                  margin-left: 1px; vertical-align: middle;
                  animation: blink 1s steps(2) infinite;
                "></span>
              </div>
              <button data-ref="note-submit" style="
                padding: 8px 16px;
                border-radius: 6px;
                border: none;
                background: var(--color-accent);
                color: #0a0a0a;
                font-size: 13px;
                font-weight: 500;
              ">Send</button>
            </div>

            <!-- Toast -->
            <div data-ref="toast" style="
              position: absolute;
              right: 28px; bottom: 28px;
              padding: 12px 18px;
              background: #07101a;
              border: 1px solid var(--color-border);
              border-radius: 8px;
              display: flex; align-items: center; gap: 10px;
              opacity: 0;
              transform: translateY(8px);
            ">
              <span style="color: #9fc77a;">✓</span>
              <span style="font-size: 13px;">Note sent · payment retry queued</span>
            </div>
          </section>
        </main>

        <style>
          @keyframes blink { 50% { opacity: 0; } }
        </style>
      </div>
    `;
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const bottomTitle = host?.querySelector('[data-ref="bottom-title"]') as HTMLElement;
		const coordT = host?.querySelector('[data-ref="coord-t"]') as HTMLElement;

		// Animate coordinate ticker
		const tickerStart = ctx.clock();
		const ticker = setInterval(() => {
			if (ctx.signal.aborted) return;
			const t = (ctx.clock() - tickerStart) / 1000;
			coordT.textContent = `T ${t.toFixed(2).padStart(5, "0")}s`;
		}, 100);
		ctx.signal.addEventListener("abort", () => clearInterval(ticker));

		// Show bottom title from start
		bottomTitle.animate(
			[
				{ opacity: 0, transform: "translate(-50%, 6px)" },
				{ opacity: 1, transform: "translate(-50%, 0)" },
			],
			{ ...opts, duration: 360 },
		);

		const showPanel = async (selector: string) => {
			const panel = host?.querySelector(selector) as HTMLElement | null;
			if (!panel) return;
			panel
				.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 })
				.finished.catch(() => {});
		};
		const hidePanel = async (selector: string) => {
			const panel = host?.querySelector(selector) as HTMLElement | null;
			if (!panel) return;
			panel
				.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, duration: 180 })
				.finished.catch(() => {});
		};

		// Panel windows (segment-relative): SVG 0.0–1.6, ECharts 1.6–3.6,
		// Three.js+Lottie 3.6–7.0, App UI 7.0–16.2 (two-phase dashboard → customers).
		// App UI lands slightly after the VO mention of "your real product UI" (4.4s)
		// to give Three.js breathing room without dragging the dashboard.
		const startT = ctx.clock();
		const waitUntil = async (relMs: number) => {
			const elapsed = ctx.clock() - startT;
			const remaining = relMs - elapsed;
			if (remaining > 0) await ctx.hold(remaining);
		};

		// === SVG panel (0.0–2.0s) ===
		await showPanel('[data-ref="p-svg"]');
		// Fade orbit rings in
		host?.querySelectorAll('[data-ref="svg-orbits"] circle').forEach((c, i) => {
			(c as SVGCircleElement).animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 400,
				delay: 200 + i * 100,
			});
		});
		const orb1 = host?.querySelector('[data-ref="svg-orb-1"]') as SVGGElement;
		const orb2 = host?.querySelector('[data-ref="svg-orb-2"]') as SVGGElement;
		const orb3 = host?.querySelector('[data-ref="svg-orb-3"]') as SVGGElement;
		orb1.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
			duration: 4000,
			iterations: Number.POSITIVE_INFINITY,
			easing: "linear",
		});
		orb2.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }], {
			duration: 3000,
			iterations: Number.POSITIVE_INFINITY,
			easing: "linear",
		});
		orb3.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
			duration: 2000,
			iterations: Number.POSITIVE_INFINITY,
			easing: "linear",
		});

		// === ECharts panel (1.6–3.6s) ===
		await waitUntil(1600);
		await hidePanel('[data-ref="p-svg"]');
		await showPanel('[data-ref="p-charts"]');
		const barEls = host?.querySelectorAll("[data-bar]");
		const heights1 = [42, 68, 55, 80];
		barEls?.forEach((b, i) => {
			(b as HTMLElement).animate([{ height: "0%" }, { height: `${heights1[i]}%` }], {
				...opts,
				duration: 400,
				delay: 40 + i * 40,
			});
		});

		// Animate radar shape via rAF + ctx.clock (WAAPI can't animate `points`)
		const radarShape = host?.querySelector('[data-ref="radar-shape"]') as SVGPolygonElement;
		const buildPoints = (vals: number[]) =>
			vals
				.map((v, i) => {
					const a = ((-90 + i * 72) * Math.PI) / 180;
					const r = v * 160;
					return `${200 + Math.cos(a) * r},${200 + Math.sin(a) * r}`;
				})
				.join(" ");

		const radarStart = [0, 0, 0, 0, 0];
		const radarTarget1 = [0.7, 0.55, 0.85, 0.45, 0.7];
		const radarTarget2 = [0.9, 0.7, 0.6, 0.85, 0.5];

		let radarFrom = radarStart;
		let radarTo = radarTarget1;
		let radarStartT = ctx.clock();
		const radarDur = 700;
		const easeOut = (t: number) => 1 - (1 - t) ** 3;

		const radarTick = () => {
			if (ctx.signal.aborted) return;
			const dt = ctx.clock() - radarStartT;
			const t = Math.min(1, Math.max(0, dt / radarDur));
			const e = easeOut(t);
			const vals = radarFrom.map((f, i) => f + (radarTo[i] - f) * e);
			radarShape.setAttribute("points", buildPoints(vals));
			if (t < 1) requestAnimationFrame(radarTick);
		};
		requestAnimationFrame(radarTick);

		// Mid-panel data refresh — bars + radar shift to target 2 while still visible
		await ctx.hold(1300);
		const heights2 = [55, 50, 78, 92];
		barEls?.forEach((b, i) => {
			(b as HTMLElement).animate([{ height: `${heights1[i]}%` }, { height: `${heights2[i]}%` }], {
				...opts,
				duration: 500,
				delay: i * 50,
			});
		});
		radarFrom = radarTarget1;
		radarTo = radarTarget2;
		radarStartT = ctx.clock();

		// === Three.js + Lottie panel (3.6–7.0s) — "wow" hold, then yields to App UI ===
		await waitUntil(3600);
		await hidePanel('[data-ref="p-charts"]');
		await showPanel('[data-ref="p-3d"]');

		// --- Real Three.js scene: rotating icosahedron with wireframe edges,
		// shaded inner mesh, vertex points, orbital ring, and a dust field.
		// Drive via ctx.clock() per render-safe pattern.
		const threeHost = host?.querySelector('[data-ref="three-host"]') as HTMLElement;

		const rect = threeHost.getBoundingClientRect();
		const w = Math.max(2, Math.round(rect.width));
		const h = Math.max(2, Math.round(rect.height));

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
		});
		renderer.setPixelRatio(window.devicePixelRatio || 1);
		renderer.setSize(w, h, false);
		renderer.setClearColor(0x000000, 0);
		threeHost.appendChild(renderer.domElement);

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 50);
		camera.position.set(0, 0, 6);

		const mainGroup = new THREE.Group();
		scene.add(mainGroup);

		// Inner shaded mesh — amber, low opacity, gives volume to the wireframe
		const innerGeo = new THREE.IcosahedronGeometry(1.4, 1);
		const innerMat = new THREE.MeshBasicMaterial({
			color: 0xff8800,
			transparent: true,
			opacity: 0.08,
			side: THREE.DoubleSide,
		});
		const innerMesh = new THREE.Mesh(innerGeo, innerMat);
		mainGroup.add(innerMesh);

		// Wireframe edges — cyan
		const edgesGeo = new THREE.EdgesGeometry(innerGeo);
		const edgesMat = new THREE.LineBasicMaterial({
			color: 0x4fd1e0,
			transparent: true,
			opacity: 0.85,
		});
		const edges = new THREE.LineSegments(edgesGeo, edgesMat);
		mainGroup.add(edges);

		// Vertex points — amber dots at each icosahedron vertex
		const vertexPositions = innerGeo.attributes.position.array as Float32Array;
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
			color: 0xff8800,
			size: 0.12,
			sizeAttenuation: true,
		});
		const vertexPoints = new THREE.Points(vertGeo, vertMat);
		mainGroup.add(vertexPoints);

		// Orbital ring of small points around the mesh — counter-rotates
		const orbitCount = 48;
		const orbitCoords: number[] = [];
		for (let i = 0; i < orbitCount; i++) {
			const a = (i / orbitCount) * Math.PI * 2;
			orbitCoords.push(Math.cos(a) * 2.3, Math.sin(a * 1.7) * 0.25, Math.sin(a) * 2.3);
		}
		const orbitGeo = new THREE.BufferGeometry();
		orbitGeo.setAttribute("position", new THREE.Float32BufferAttribute(orbitCoords, 3));
		const orbitMat = new THREE.PointsMaterial({
			color: 0x4fd1e0,
			size: 0.05,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.85,
		});
		const orbitPoints = new THREE.Points(orbitGeo, orbitMat);
		scene.add(orbitPoints);

		// Ambient dust field — small white-ish particles
		const dustCount = 180;
		const dustCoords: number[] = [];
		for (let i = 0; i < dustCount; i++) {
			const r = 2.6 + Math.random() * 2.4;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			dustCoords.push(
				r * Math.sin(phi) * Math.cos(theta),
				r * Math.sin(phi) * Math.sin(theta),
				r * Math.cos(phi),
			);
		}
		const dustGeo = new THREE.BufferGeometry();
		dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(dustCoords, 3));
		const dustMat = new THREE.PointsMaterial({
			color: 0xe8eef5,
			size: 0.02,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.4,
		});
		const dustPoints = new THREE.Points(dustGeo, dustMat);
		scene.add(dustPoints);

		three = {
			renderer,
			scene,
			camera,
			mainGroup,
			innerMesh,
			orbitPoints,
			dustPoints,
			edges,
			vertexPoints,
		};

		const threeStart = ctx.clock();
		const threeTick = () => {
			if (ctx.signal.aborted || !three) return;
			const t = (ctx.clock() - threeStart) / 1000;
			three.mainGroup.rotation.x = t * 0.35;
			three.mainGroup.rotation.y = t * 0.55;
			three.orbitPoints.rotation.y = -t * 0.8;
			three.orbitPoints.rotation.x = t * 0.2;
			three.dustPoints.rotation.y = t * 0.05;
			// Subtle edge opacity pulse
			(three.edges.material as THREE.LineBasicMaterial).opacity = 0.7 + Math.sin(t * 2.2) * 0.15;
			three.renderer.render(three.scene, three.camera);
			requestAnimationFrame(threeTick);
		};
		requestAnimationFrame(threeTick);

		// Real Lottie animation, driven manually via ctx.clock() per render-safe pattern.
		const lottieHost = host?.querySelector('[data-ref="lottie-host"]') as HTMLElement;
		lottieInstance = lottie.loadAnimation({
			container: lottieHost,
			renderer: "svg",
			loop: false,
			autoplay: false,
			animationData: rocketAnimation,
		});

		// Lottie duration in ms: (op - ip) / fr * 1000 = 75/25 * 1000 = 3000ms.
		const lottieDurMs = ((rocketAnimation.op - rocketAnimation.ip) / rocketAnimation.fr) * 1000;
		const lottieStart = ctx.clock();

		const lottieTick = () => {
			if (ctx.signal.aborted || !lottieInstance) return;
			const elapsed = ctx.clock() - lottieStart;
			// Loop the 3s animation across the 6s sphere/rocket beat.
			const pos = elapsed % lottieDurMs;
			lottieInstance.goToAndStop(pos, false);
			requestAnimationFrame(lottieTick);
		};
		requestAnimationFrame(lottieTick);

		// === App UI panel (7.0s → end) — two-phase enterprise SaaS demo ===
		await waitUntil(7000);
		await hidePanel('[data-ref="p-3d"]');
		await showPanel('[data-ref="p-app"]');

		// --- Phase 1: Dashboard (7.0 → 11.0s) ---

		// KPI cards stagger in with number count-up
		const kpiCards = host?.querySelectorAll("[data-kpi]");
		kpiCards?.forEach((c, i) => {
			(c as HTMLElement).animate(
				[
					{ opacity: 0, transform: "translateY(8px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 320, delay: 120 + i * 90 },
			);
		});

		// Count-up animation for each KPI value
		const kpiTargets: Array<{
			el: HTMLElement;
			target: string;
		}> = [];
		for (const el of host?.querySelectorAll("[data-target]") ?? []) {
			kpiTargets.push({
				el: el as HTMLElement,
				target: (el as HTMLElement).getAttribute("data-target") || "",
			});
		}

		const countUpStart = ctx.clock();
		const countUpDur = 900;
		const countUpTick = () => {
			if (ctx.signal.aborted) return;
			const elapsed = ctx.clock() - countUpStart;
			const t = Math.min(1, elapsed / countUpDur);
			const e = 1 - (1 - t) ** 3;
			for (const { el, target } of kpiTargets) {
				// Parse the target — e.g. "$48,392", "2,841", "4.7%", "1.2%"
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
				if (hasDecimal) {
					formatted = cur.toFixed(1);
				} else if (targetNum >= 1000) {
					formatted = Math.round(cur).toLocaleString("en-US");
				} else {
					formatted = Math.round(cur).toString();
				}
				el.textContent = prefix + formatted + suffix;
			}
			if (t < 1) requestAnimationFrame(countUpTick);
		};
		await ctx.hold(400);
		requestAnimationFrame(countUpTick);

		// Area chart card + bar chart card fade in
		const areaCard = host?.querySelector('[data-ref="area-card"]') as HTMLElement;
		const barCard = host?.querySelector('[data-ref="bar-card"]') as HTMLElement;
		areaCard.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 340, delay: 100, fill: "forwards" },
		);
		barCard.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 340, delay: 220, fill: "forwards" },
		);

		await ctx.hold(400);

		// Area chart line draws in via stroke-dashoffset
		const areaLine = host?.querySelector('[data-ref="area-line"]') as SVGPathElement;
		const areaFill = host?.querySelector('[data-ref="area-fill"]') as SVGPathElement;
		const areaDot = host?.querySelector('[data-ref="area-dot"]') as SVGCircleElement;
		const pathLen = areaLine.getTotalLength();
		areaLine.style.strokeDasharray = `${pathLen}`;
		areaLine.style.strokeDashoffset = `${pathLen}`;
		areaLine.animate([{ strokeDashoffset: pathLen }, { strokeDashoffset: 0 }], {
			duration: 1100,
			easing: "ease-out",
			fill: "forwards",
		});
		areaFill.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 600,
			delay: 600,
			fill: "forwards",
		});
		areaDot.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 200,
			delay: 1100,
			fill: "forwards",
		});

		// Bar chart rows fade in + bars fill
		host?.querySelectorAll("[data-bar-row]").forEach((row, i) => {
			(row as HTMLElement).animate(
				[
					{ opacity: 0, transform: "translateX(-6px)" },
					{ opacity: 1, transform: "translateX(0)" },
				],
				{ ...opts, duration: 260, delay: 100 + i * 80, fill: "forwards" },
			);
		});
		host?.querySelectorAll("[data-bar-fill]").forEach((bar, i) => {
			const val = Number.parseInt((bar as HTMLElement).getAttribute("data-bar-fill") || "0", 10);
			(bar as HTMLElement).animate([{ width: "0%" }, { width: `${val}%` }], {
				...opts,
				duration: 540,
				delay: 220 + i * 80,
				fill: "forwards",
			});
		});

		// --- Phase 2 transition (11.0 → 11.5s): tab switch to Customers ---
		await waitUntil(11000);

		// Sidebar nav highlight moves from Dashboard to Customers
		const dashNav = host?.querySelector('[data-nav="dashboard"]') as HTMLElement;
		const custNav = host?.querySelector('[data-nav="customers"]') as HTMLElement;
		dashNav.style.background = "transparent";
		dashNav.style.color = "var(--color-muted)";
		dashNav.style.boxShadow = "none";
		custNav.style.background = "rgba(255, 136, 0, 0.10)";
		custNav.style.color = "var(--color-fg)";
		custNav.style.boxShadow = "inset 2px 0 0 var(--color-accent)";

		// Breadcrumb updates
		const breadcrumb = host?.querySelector('[data-ref="breadcrumb"]') as HTMLElement;
		breadcrumb.textContent = "Customers";

		// Crossfade views
		const dashView = host?.querySelector('[data-view="dashboard"]') as HTMLElement;
		const custView = host?.querySelector('[data-view="customers"]') as HTMLElement;
		dashView.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 240,
			fill: "forwards",
		});
		custView.style.display = "flex";
		custView.animate(
			[
				{ opacity: 0, transform: "translateX(6px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 320, delay: 120, fill: "forwards" },
		);

		// Table rows stagger in
		host?.querySelectorAll("[data-row]").forEach((row, i) => {
			(row as HTMLElement).animate(
				[
					{ opacity: 0, transform: "translateY(6px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 280, delay: 280 + i * 80, fill: "forwards" },
			);
		});

		// --- Phase 2 action (12.4 → end): type a note, click send, toast ---
		await waitUntil(12400);

		const actionPanel = host?.querySelector('[data-ref="action-panel"]') as HTMLElement;
		actionPanel.animate(
			[
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300, fill: "forwards" },
		);

		await ctx.hold(350);

		// Type the note
		const noteText = host?.querySelector('[data-ref="note-text"]') as HTMLElement;
		const noteCaret = host?.querySelector('[data-ref="note-caret"]') as HTMLElement;
		const message = "Payment retry — try card on file Tue 9am";
		const typeStep = 38;
		for (let i = 0; i <= message.length; i++) {
			if (ctx.signal.aborted) return;
			noteText.textContent = message.slice(0, i);
			await ctx.hold(typeStep);
		}

		await ctx.hold(280);

		// Hide caret, "submit"
		noteCaret.style.display = "none";
		const submitBtn = host?.querySelector('[data-ref="note-submit"]') as HTMLElement;
		submitBtn.animate(
			[{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }],
			{ duration: 220, easing: "ease-out" },
		);

		await ctx.hold(220);

		// Toast appears
		const toast = host?.querySelector('[data-ref="toast"]') as HTMLElement;
		toast.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 320, fill: "forwards" },
		);

		// Hold to end
		await waitUntil(16200);
		clearInterval(ticker);
	},

	unmount() {
		if (lottieInstance) {
			lottieInstance.destroy();
			lottieInstance = null;
		}
		if (three) {
			three.innerMesh.geometry.dispose();
			(three.innerMesh.material as THREE.Material).dispose();
			three.edges.geometry.dispose();
			(three.edges.material as THREE.Material).dispose();
			three.vertexPoints.geometry.dispose();
			(three.vertexPoints.material as THREE.Material).dispose();
			three.orbitPoints.geometry.dispose();
			(three.orbitPoints.material as THREE.Material).dispose();
			three.dustPoints.geometry.dispose();
			(three.dustPoints.material as THREE.Material).dispose();
			three.renderer.dispose();
			three.renderer.domElement.remove();
			three = null;
		}
		host = null;
	},
});
