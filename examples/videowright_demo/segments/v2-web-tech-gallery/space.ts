import lottie from "lottie-web/build/player/lottie_light";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { disposeWhenDetached } from "../../components/v2/dispose.js";
import { type Ticker, clamp01, css, expoOut, ms, tidy } from "../../components/v2/motion.js";
import type { Box } from "../../components/v2/stage.js";
import rocket from "./rocket-launch.json";

// Demo 3, advanced 3D and motion: a real Three.js scene and a real Lottie side by side. The
// planet is a glossy ocean sphere with smooth-shaded continents risen out of it from seeded
// noise and a cloud shell, lit by a cool key and a cyan rim, with a Fresnel atmosphere and an
// outer halo. It is scanned in, a clipping plane revealing the solid behind its cyan
// wireframe, while the orbit ring draws and a satellite flies it. The rocket is LottieFiles'
// rocket-launch.json, unmodified, on the light SVG player.
//
// Render safety: one rAF loop (the scene's ticker) renders every frame from ctx.clock(); the
// Lottie never plays itself (autoplay off) and is put on a frame with goToAndStop. The
// renderer is disposed only once the slot has been cleared (dispose.ts), so the transition
// out keeps the last frame.

const W = 1100;
const H = 800;
/** Planet centre and radius in the demo's px (it fills the left of the viewport). */
export const PLANET = { x: 390, y: 430, r: 238 } as const;
/** The Lottie card, in the demo's px. */
export const CARD = { x: 690, y: 112, w: 410, h: 576 } as const;
const PLAYER = 410;
/** The rocket leaves the pad on this frame of rocket-launch.json (25 fps). */
export const LAUNCH_FRAME = 56;

// Seeded value noise (no Math.random): the planet is the same in every render.
const hash = (x: number, y: number, z: number) => {
	const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
	return h - Math.floor(h);
};
function noise(x: number, y: number, z: number): number {
	const [xi, yi, zi] = [Math.floor(x), Math.floor(y), Math.floor(z)];
	const s = (f: number) => f * f * (3 - 2 * f);
	const [u, v, w] = [s(x - xi), s(y - yi), s(z - zi)];
	let out = 0;
	for (let dx = 0; dx < 2; dx++)
		for (let dy = 0; dy < 2; dy++)
			for (let dz = 0; dz < 2; dz++) {
				const weight = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
				out += hash(xi + dx, yi + dy, zi + dz) * weight;
			}
	return out;
}
const fbm = (x: number, y: number, z: number, octaves = 5) => {
	let sum = 0;
	let amp = 0.5;
	let f = 1;
	for (let i = 0; i < octaves; i++) {
		sum += amp * noise(x * f, y * f, z * f);
		f *= 2.03;
		amp *= 0.5;
	}
	return sum;
};

/** Continents: domain-warped fbm on the unit sphere, so coastlines meander. */
const elevation = (v: THREE.Vector3) => {
	const wx = fbm(v.x * 1.2 + 11, v.y * 1.2 + 3, v.z * 1.2 + 5, 3) - 0.5;
	const wy = fbm(v.x * 1.2 + 7, v.y * 1.2 + 13, v.z * 1.2 + 1, 3) - 0.5;
	return fbm(v.x * 1.5 + 3 + wx * 0.9, v.y * 1.5 + 1 + wy * 0.9, v.z * 1.5 + 7);
};
const SEA = 0.5;

/**
 * The land: an icosphere (vertices merged, so the shading is smooth) whose continents rise out
 * of the ocean sphere and whose sea floor sinks under it, coloured by height from shore to
 * snow. The ocean is its own glossy sphere, so the sun glints on water and not on land.
 */
function landGeometry(radius: number): THREE.BufferGeometry {
	const geo = mergeVertices(new THREE.IcosahedronGeometry(radius, 64));
	const pos = geo.attributes.position;
	const [shore, low, mid, high, peak] = ["#3b8f86", "#2c7a63", "#5f9070", "#9aa88a", "#eef4f2"].map(
		(c) => new THREE.Color(c),
	);
	const colors: number[] = [];
	const v = new THREE.Vector3();
	const c = new THREE.Color();
	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i).normalize();
		const h = elevation(v) - SEA;
		v.multiplyScalar(radius * (h > 0 ? 1 + h * 0.12 : 0.98));
		pos.setXYZ(i, v.x, v.y, v.z);
		const t = Math.max(0, h) / 0.25;
		if (h < 0.015) c.copy(shore);
		else if (t < 0.35) c.copy(low).lerp(mid, t / 0.35);
		else if (t < 0.75) c.copy(mid).lerp(high, (t - 0.35) / 0.4);
		else c.copy(high).lerp(peak, Math.min(1, (t - 0.75) / 0.25));
		colors.push(c.r, c.g, c.b);
	}
	geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
	geo.computeVertexNormals();
	return geo;
}

/** Clouds: a shell just above the land, white with a seeded noise alpha. */
function cloudGeometry(radius: number): THREE.BufferGeometry {
	const geo = mergeVertices(new THREE.IcosahedronGeometry(radius, 32));
	const pos = geo.attributes.position;
	const rgba: number[] = [];
	const v = new THREE.Vector3();
	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i).normalize();
		const n = fbm(v.x * 2.4 + 21, v.y * 3.2 + 4, v.z * 2.4 + 9);
		rgba.push(1, 1, 1, 0.9 * Math.min(1, Math.max(0, (n - 0.5) * 5)));
	}
	geo.setAttribute("color", new THREE.Float32BufferAttribute(rgba, 4));
	geo.computeVertexNormals();
	return geo;
}

const ATMOSPHERE = {
	vertexShader: `varying vec3 vN; varying vec3 vV;
		void main() {
			vec4 mv = modelViewMatrix * vec4(position, 1.0);
			vN = normalize(normalMatrix * normal);
			vV = normalize(-mv.xyz);
			gl_Position = projectionMatrix * mv;
		}`,
	fragmentShader: `uniform vec3 color; uniform float strength; varying vec3 vN; varying vec3 vV;
		void main() {
			float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0) * 1.1 * strength;
			gl_FragColor = vec4(color * f, f);
		}`,
};

/** The outer halo: light scattered past the limb, brightest at the planet's edge. */
const HALO = {
	vertexShader: ATMOSPHERE.vertexShader,
	fragmentShader: `uniform vec3 color; uniform float strength; varying vec3 vN; varying vec3 vV;
		void main() {
			float f = pow(clamp(-dot(vN, vV) * 1.9, 0.0, 1.0), 2.0) * strength;
			gl_FragColor = vec4(color * f, f);
		}`,
};

export interface SpaceDemo {
	layer: HTMLElement;
	/** The planet's and the Lottie card's boxes, in the demo's px (for the HUD's locks). */
	planetBox: Box;
	cardBox: Box;
	/**
	 * Starts the scene `delay` ms from now. The Lottie plays at its own rate from `lottieAt`
	 * ms from now (it holds frame 0 until then).
	 */
	play(ticker: Ticker, delay: number, lottieAt: number): void;
	/** Stops rendering `delay` ms from now (once a sweep has covered it); the last frame stays. */
	stopAfter(delay: number): void;
	dispose(): void;
}

export function createSpace(parent: HTMLElement): SpaceDemo {
	const layer = document.createElement("div");
	layer.className = "v2-demo";
	parent.appendChild(layer);

	// ── Three.js ──
	const canvas = document.createElement("canvas");
	canvas.style.cssText = `position:absolute; left:0; top:0; width:${W}px; height:${H}px`;
	layer.appendChild(canvas);
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: true,
		preserveDrawingBuffer: true,
	});
	renderer.setPixelRatio(1);
	renderer.setSize(W, H, false);
	renderer.setClearColor(0x000000, 0);
	renderer.localClippingEnabled = true;
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);
	// 1 world unit = H / (2 · 9.5 · tan 14°) px at the planet's depth.
	const unit = H / (2 * 9.5 * Math.tan(THREE.MathUtils.degToRad(14)));
	const R = PLANET.r / unit;
	const centre = new THREE.Vector3((PLANET.x - W / 2) / unit, -(PLANET.y - H / 2) / unit, 0);

	const scan = new THREE.Plane(new THREE.Vector3(-1, 0, 0), centre.x - R * 1.4);
	const land = new THREE.Mesh(
		landGeometry(R),
		new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, clippingPlanes: [scan] }),
	);
	const ocean = new THREE.Mesh(
		new THREE.SphereGeometry(R * 1.004, 128, 96),
		new THREE.MeshStandardMaterial({
			color: "#0f3352",
			roughness: 0.42,
			metalness: 0.1,
			clippingPlanes: [scan],
		}),
	);
	const clouds = new THREE.Mesh(
		cloudGeometry(R * 1.025),
		new THREE.MeshStandardMaterial({
			vertexColors: true,
			transparent: true,
			roughness: 1,
			depthWrite: false,
			clippingPlanes: [scan],
		}),
	);
	const wireMaterial = new THREE.LineBasicMaterial({
		color: css("--cyan"),
		transparent: true,
		opacity: 0,
	});
	const wire = new THREE.LineSegments(
		// Above the ocean (R·1.004): the wire's chords sag ~0.4% between vertices.
		new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 1.012, 6)),
		wireMaterial,
	);
	const globe = new THREE.Group();
	globe.add(ocean, land, clouds, wire);
	globe.rotation.z = 0.35;
	globe.position.copy(centre);
	const atmosphere = new THREE.Mesh(
		new THREE.SphereGeometry(R * 1.035, 64, 48),
		new THREE.ShaderMaterial({
			...ATMOSPHERE,
			uniforms: { color: { value: new THREE.Color(css("--cyan")) }, strength: { value: 0 } },
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	atmosphere.position.copy(centre);
	const halo = new THREE.Mesh(
		new THREE.SphereGeometry(R * 1.16, 64, 48),
		new THREE.ShaderMaterial({
			...HALO,
			uniforms: { color: { value: new THREE.Color(css("--cyan")) }, strength: { value: 0 } },
			side: THREE.BackSide,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	halo.position.copy(centre);

	// The orbit: a quiet fg-2 ring (amber stays for the HUD's lock, cyan for measurement),
	// drawn by its range; sized so it stays inside the viewport.
	const ringRadius = R * 1.52;
	const points = Array.from({ length: 257 }, (_, i) => {
		const a = (i / 256) * Math.PI * 2;
		return new THREE.Vector3(Math.cos(a) * ringRadius, 0, Math.sin(a) * ringRadius);
	});
	const ring = new THREE.Line(
		new THREE.BufferGeometry().setFromPoints(points),
		new THREE.LineBasicMaterial({ color: css("--fg-2"), transparent: true, opacity: 0.85 }),
	);
	ring.geometry.setDrawRange(0, 0);
	const satellite = new THREE.Group();
	const metal = new THREE.MeshStandardMaterial({
		color: "#d6dde2",
		metalness: 0.6,
		roughness: 0.35,
	});
	const cells = new THREE.MeshStandardMaterial({
		color: "#1b3c66",
		metalness: 0.3,
		roughness: 0.4,
		emissive: "#0a1a30",
	});
	const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.16), cells);
	satellite.add(
		new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.22), metal),
		wing.clone().translateX(0.36),
		wing.clone().translateX(-0.36),
	);
	satellite.scale.setScalar(0);
	const orbit = new THREE.Group();
	orbit.add(ring, satellite);
	orbit.rotation.set(0.46, 0, -0.24);
	orbit.position.copy(centre);
	scene.add(globe, atmosphere, halo, orbit);
	const key = new THREE.DirectionalLight("#f2f6ff", 3.1);
	key.position.set(5, 2.5, 3);
	// The rim sits behind the planet, so it lights the limb, not a glint on the ocean.
	const rim = new THREE.DirectionalLight(css("--cyan"), 2.2);
	rim.position.set(-5, 1.5, -6);
	scene.add(key, rim, new THREE.AmbientLight("#10202e", 0.6));

	// ── Lottie ──
	const card = document.createElement("div");
	card.className = "me-panel";
	card.style.cssText = `position:absolute; left:${CARD.x}px; top:${CARD.y}px; width:${CARD.w}px; height:${CARD.h}px; box-sizing:border-box; overflow:hidden`;
	card.innerHTML = `
		<div class="me-mono" style="position:absolute; left:28px; top:20px; color:var(--color-fg)">rocket-launch.json</div>
		<div data-ref="player" style="position:absolute; left:0; top:76px; width:${PLAYER}px; height:${PLAYER}px; background:#14171c"></div>
		<div style="position:absolute; left:28px; right:28px; bottom:44px; height:2px; background:var(--hairline)"></div>
		<div data-ref="head" style="position:absolute; left:28px; bottom:42px; width:0; height:6px; background:var(--cyan)"></div>
		<div class="me-readout" data-ref="frame" style="position:absolute; right:28px; bottom:8px; color:var(--color-muted)"></div>
		<div class="me-readout" style="position:absolute; left:28px; bottom:8px; color:var(--color-muted)">25 FPS</div>`;
	layer.appendChild(card);
	const q = (ref: string) => card.querySelector(`[data-ref="${ref}"]`) as HTMLElement;
	const frames = rocket.op - rocket.ip;
	const anim = lottie.loadAnimation({
		container: q("player"),
		renderer: "svg",
		loop: false,
		autoplay: false,
		// lottie annotates the data it is given; hand it a copy, so a remount starts clean.
		animationData: structuredClone(rocket),
	});
	const frameReadout = q("frame");
	const head = q("head");
	const track = CARD.w - 56;

	let stopped = false;
	let disposed = false;
	return {
		layer,
		planetBox: {
			x: PLANET.x - PLANET.r - 18,
			y: PLANET.y - PLANET.r - 18,
			w: 2 * PLANET.r + 36,
			h: 2 * PLANET.r + 36,
		},
		cardBox: { x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h },
		play(ticker, delay, lottieAt) {
			const start = ticker.now() + delay;
			const lottieStart = ticker.now() + lottieAt;
			ticker.add((t) => {
				if (stopped || !layer.isConnected) return false;
				const s = tidy(t - start) / 1000;
				// Settle: the camera arrives from slightly further out.
				camera.position.set(0, 0.25, 9.5 + 1.1 * (1 - expoOut(clamp01(s / 1.4))));
				camera.lookAt(0, 0, 0);
				// Scan: wireframe first, then the lit solid is revealed left to right behind it.
				wireMaterial.opacity = 0.5 * clamp01(s / 0.25) - 0.4 * clamp01((s - 1.0) / 0.8);
				const reveal = clamp01((s - 0.2) / 1.0);
				scan.constant = centre.x - R * 1.15 + reveal * R * 2.4;
				const glow = clamp01((s - 0.7) / 0.6);
				(atmosphere.material as THREE.ShaderMaterial).uniforms.strength.value = glow;
				(halo.material as THREE.ShaderMaterial).uniforms.strength.value = 0.55 * glow;
				ring.geometry.setDrawRange(0, Math.round(257 * expoOut(clamp01((s - 0.4) / 0.9))));
				satellite.scale.setScalar(expoOut(clamp01((s - 1.1) / 0.5)));
				globe.rotation.y = 0.8 + s * 0.24;
				// The weather drifts a little faster than the ground turns.
				clouds.rotation.y = s * 0.05;
				const a = 1.9 + s * 0.62;
				satellite.position.set(Math.cos(a) * ringRadius, 0, Math.sin(a) * ringRadius);
				satellite.lookAt(orbit.localToWorld(new THREE.Vector3(0, 0, 0)));
				renderer.render(scene, camera);
				// The Lottie, at its own 25 fps (sub-frame interpolated), from lottieAt.
				if (anim.isLoaded) {
					const ms = Math.max(0, tidy(t - lottieStart));
					const frame = Math.min(frames - 1, (ms / 1000) * rocket.fr);
					anim.goToAndStop(frame, true);
					frameReadout.textContent = `F ${String(Math.floor(frame)).padStart(2, "0")} / ${frames}`;
					head.style.width = `${((track * frame) / (frames - 1)).toFixed(1)}px`;
				}
				return true;
			});
			card.animate(
				[
					{ opacity: 0, transform: "translateY(28px)" },
					{ opacity: 1, transform: "none" },
				],
				{
					duration: ms("--dur-slow"),
					delay: delay + 240,
					easing: css("--ease-settle"),
					fill: "both",
				},
			);
		},
		stopAfter(delay) {
			setTimeout(() => {
				stopped = true;
			}, delay);
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			stopped = true;
			disposeWhenDetached(layer, () => {
				anim.destroy();
				renderer.dispose();
				renderer.forceContextLoss();
			});
		},
	};
}
