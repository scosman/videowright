import lottie from "lottie-web/build/player/lottie_light";
import * as THREE from "three";
import { disposeWhenDetached } from "../../components/v2/dispose.js";
import { type Ticker, clamp01, css, expoOut, ms, tidy } from "../../components/v2/motion.js";
import rocket from "./rocket-launch.json";

// Demo 3, advanced 3D and motion: a real Three.js scene and a real Lottie side by side. The
// planet's continents, shelves and clouds are computed per pixel on the GPU from seeded,
// domain-warped value noise (sharp coastlines at any size, nothing to precompute at mount):
// glossy water that alone takes the sun's glint, bump-lit land shaded from shore to snow, and
// a cloud shell. A cool key and a cyan rim light it; the Fresnel atmosphere and outer halo
// follow the light, bright on the day side and thin on the night side. It is scanned in, a
// clipping plane revealing the solid behind its cyan wireframe, while the orbit ring draws
// and a satellite (gold-foil bus, celled wings, dish) flies it. The rocket is LottieFiles'
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
/** By this frame the rocket has left the player: the card shows only the clearing smoke. */
export const CLEAR_FRAME = 58;

// Seeded value noise in GLSL (a sine-free hash, stable in float32): the planet is the same in
// every render. Continents are domain-warped fbm on the unit sphere, so coastlines meander.
const NOISE_GLSL = `
	float vwHash(vec3 p) {
		p = fract(p * 0.1031);
		p += dot(p, p.zyx + 31.32);
		return fract((p.x + p.y) * p.z);
	}
	float vwNoise(vec3 x) {
		vec3 i = floor(x);
		vec3 f = fract(x);
		vec3 u = f * f * (3.0 - 2.0 * f);
		return mix(
			mix(mix(vwHash(i), vwHash(i + vec3(1.0, 0.0, 0.0)), u.x),
				mix(vwHash(i + vec3(0.0, 1.0, 0.0)), vwHash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
			mix(mix(vwHash(i + vec3(0.0, 0.0, 1.0)), vwHash(i + vec3(1.0, 0.0, 1.0)), u.x),
				mix(vwHash(i + vec3(0.0, 1.0, 1.0)), vwHash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
			u.z);
	}
	float vwFbm(vec3 p, int octaves) {
		float sum = 0.0;
		float amp = 0.5;
		for (int i = 0; i < 6; i++) {
			if (i >= octaves) break;
			sum += amp * vwNoise(p);
			p *= 2.03;
			amp *= 0.5;
		}
		return sum;
	}
	float vwElevation(vec3 v) {
		float wx = vwFbm(v * 1.2 + vec3(11.0, 3.0, 5.0), 3) - 0.5;
		float wy = vwFbm(v * 1.2 + vec3(7.0, 13.0, 1.0), 3) - 0.5;
		return vwFbm(vec3(v.x * 1.5 + 3.0 + wx * 0.9, v.y * 1.5 + 1.0 + wy * 0.9, v.z * 1.5 + 7.0), 6);
	}
	// Bump mapping from the height's screen-space derivatives (Mikkelsen's surface gradient).
	vec3 vwPerturb(vec3 pos, vec3 n, vec2 dH) {
		vec3 sx = dFdx(pos);
		vec3 sy = dFdy(pos);
		vec3 r1 = cross(sy, n);
		vec3 r2 = cross(n, sx);
		float det = dot(sx, r1);
		vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
		return normalize(abs(det) * n - grad);
	}
`;

/** Sea level in the elevation's 0..1 range, and the bump's height (world units per unit h). */
const SEA = 0.5;
const BUMP = 0.1;

/** Sea, shelf and land colours (sRGB hex), shore to snow. */
const PALETTE = {
	deep: "#0d2e4b",
	shelf: "#17506a",
	shore: "#3b8f86",
	low: "#2c7a63",
	mid: "#5f9070",
	high: "#9aa88a",
	peak: "#eef4f2",
};

/**
 * Hooks a MeshStandardMaterial's shader: the object-space direction of each fragment reaches
 * the fragment stage, the noise is defined, and `fragment` runs after the base colour is set
 * (so it can rewrite diffuseColor and later chunks see its variables).
 */
function withNoise(
	material: THREE.MeshStandardMaterial,
	uniforms: Record<string, THREE.IUniform>,
	fragment: string,
	afterNormal = "",
): THREE.MeshStandardMaterial {
	material.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, uniforms);
		const declare = Object.entries(uniforms)
			.map(([name, u]) => `uniform ${u.value instanceof THREE.Color ? "vec3" : "float"} ${name};`)
			.join("\n");
		shader.vertexShader = shader.vertexShader
			.replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
			.replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>\nvarying vec3 vObj;\n${declare}\n${NOISE_GLSL}`,
			)
			.replace("#include <color_fragment>", `#include <color_fragment>\n${fragment}`)
			.replace(
				"#include <normal_fragment_maps>",
				`#include <normal_fragment_maps>\n${afterNormal}`,
			);
	};
	// three.js caches programs by material type and parameters, not by onBeforeCompile's output:
	// two hooked materials (the surface, the clouds) must never share a program.
	material.customProgramCacheKey = () => `vw-noise:${fragment}${afterNormal}`;
	return material;
}

/** The planet's surface: sea and land in one sphere, coloured, glossed and bumped per pixel. */
function surfaceMaterial(scan: THREE.Plane): THREE.MeshStandardMaterial {
	const colours = Object.fromEntries(
		Object.entries(PALETTE).map(([k, hex]) => [`vw_${k}`, { value: new THREE.Color(hex) }]),
	);
	return withNoise(
		new THREE.MeshStandardMaterial({ roughness: 0.85, clippingPlanes: [scan] }),
		{ ...colours, vwSea: { value: SEA }, vwBump: { value: BUMP } },
		`
		float vwH = vwElevation(normalize(vObj)) - vwSea;
		// The coastline is anti-aliased over about a pixel (the height's screen derivative).
		float vwAA = max(fwidth(vwH), 1e-4);
		float vwLand = smoothstep(-vwAA, vwAA, vwH);
		vec3 vwSeaColour = mix(vw_deep, vw_shelf, smoothstep(-0.07, 0.0, vwH));
		float vwT = max(vwH, 0.0) / 0.25;
		vec3 vwGround = vwT < 0.035 ? vw_shore
			: vwT < 0.35 ? mix(vw_low, vw_mid, vwT / 0.35)
			: vwT < 0.75 ? mix(vw_mid, vw_high, (vwT - 0.35) / 0.4)
			: mix(vw_high, vw_peak, min(1.0, (vwT - 0.75) / 0.25));
		diffuseColor.rgb = mix(vwSeaColour, vwGround, vwLand);
		`,
		`
		// Only water takes the glint; only land has relief.
		roughnessFactor = mix(0.42, 0.88, vwLand);
		metalnessFactor = mix(0.1, 0.0, vwLand);
		vec2 vwDH = vec2(dFdx(max(vwH, 0.0)), dFdy(max(vwH, 0.0))) * vwBump;
		normal = vwPerturb(-vViewPosition, normal, vwDH);
		`,
	);
}

/** The cloud shell: white, its alpha a sharper fbm of its own. */
function cloudMaterial(scan: THREE.Plane): THREE.MeshStandardMaterial {
	return withNoise(
		new THREE.MeshStandardMaterial({
			color: "#ffffff",
			transparent: true,
			roughness: 1,
			depthWrite: false,
			clippingPlanes: [scan],
		}),
		{},
		`
		vec3 vwC = normalize(vObj);
		float vwN = vwFbm(vec3(vwC.x * 2.4 + 21.0, vwC.y * 3.2 + 4.0, vwC.z * 2.4 + 9.0), 6);
		diffuseColor.a *= 0.92 * smoothstep(0.52, 0.66, vwN);
		`,
	);
}

/**
 * The atmosphere: a Fresnel rim, brightest where the key light scatters through it (the day
 * side) and where the cyan rim light grazes it, thin across the night side, so the limb varies.
 */
const ATMOSPHERE = {
	vertexShader: `varying vec3 vN; varying vec3 vV;
		void main() {
			vec4 mv = modelViewMatrix * vec4(position, 1.0);
			vN = normalize(normalMatrix * normal);
			vV = normalize(-mv.xyz);
			gl_Position = projectionMatrix * mv;
		}`,
	fragmentShader: `uniform vec3 color; uniform float strength; uniform vec3 sun; uniform vec3 rimLight;
		varying vec3 vN; varying vec3 vV;
		void main() {
			float day = smoothstep(-0.45, 0.65, dot(vN, sun));
			float graze = smoothstep(0.1, 0.95, dot(vN, rimLight));
			float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0) * 1.1 * strength;
			f *= 0.22 + 0.78 * day + 0.5 * graze;
			gl_FragColor = vec4(color * f, f);
		}`,
};

/** The outer halo: light scattered past the limb, following the same light. */
const HALO = {
	vertexShader: ATMOSPHERE.vertexShader,
	fragmentShader: `uniform vec3 color; uniform float strength; uniform vec3 sun; uniform vec3 rimLight;
		varying vec3 vN; varying vec3 vV;
		void main() {
			// vN is the halo shell's outward normal (its far side is drawn): it points the way of
			// the limb it glows past.
			float day = smoothstep(-0.5, 0.7, dot(vN, sun));
			float graze = smoothstep(0.1, 0.95, dot(vN, rimLight));
			float f = pow(clamp(-dot(vN, vV) * 1.9, 0.0, 1.0), 2.0) * strength;
			f *= 0.3 + 0.7 * day + 0.45 * graze;
			gl_FragColor = vec4(color * f, f);
		}`,
};

/** The satellite's solar cells: dark blue cells on a silver grid (a small canvas texture). */
function cellTexture(): THREE.CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = 128;
	canvas.height = 32;
	const g = canvas.getContext("2d") as CanvasRenderingContext2D;
	g.fillStyle = "#c9d2da";
	g.fillRect(0, 0, 128, 32);
	g.fillStyle = "#1a3d6e";
	for (let x = 0; x < 8; x++)
		for (let y = 0; y < 2; y++) g.fillRect(x * 16 + 1.5, y * 16 + 1.5, 13, 13);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}

export interface SpaceDemo {
	layer: HTMLElement;
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
	const surface = new THREE.Mesh(
		new THREE.SphereGeometry(R * 1.004, 160, 120),
		surfaceMaterial(scan),
	);
	const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 128, 96), cloudMaterial(scan));
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
	globe.add(surface, clouds, wire);
	globe.rotation.z = 0.35;
	globe.position.copy(centre);
	// The lights' directions in view space, for the atmosphere and halo (set every frame).
	const sun = new THREE.Vector3();
	const rimLight = new THREE.Vector3();
	const lightUniforms = () => ({ sun: { value: sun }, rimLight: { value: rimLight } });
	const atmosphere = new THREE.Mesh(
		new THREE.SphereGeometry(R * 1.035, 64, 48),
		new THREE.ShaderMaterial({
			...ATMOSPHERE,
			uniforms: {
				color: { value: new THREE.Color(css("--cyan")) },
				strength: { value: 0 },
				...lightUniforms(),
			},
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
			uniforms: {
				color: { value: new THREE.Color(css("--cyan")) },
				strength: { value: 0 },
				...lightUniforms(),
			},
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
	// The satellite: a gold-foil bus, two celled wings on a yoke, a dish facing the planet (it
	// looks at the orbit's centre, +z) and an antenna boom out the back.
	const satellite = new THREE.Group();
	const foil = new THREE.MeshStandardMaterial({
		color: "#c79a3e",
		metalness: 0.85,
		roughness: 0.32,
	});
	const white = new THREE.MeshStandardMaterial({
		color: "#e8edf1",
		metalness: 0.2,
		roughness: 0.45,
	});
	const cellsMap = cellTexture();
	const cells = new THREE.MeshStandardMaterial({
		map: cellsMap,
		metalness: 0.35,
		roughness: 0.38,
		emissive: "#0a1a30",
	});
	const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.014, 0.15), cells);
	const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.72, 8), white);
	yoke.rotation.z = Math.PI / 2;
	const dish = new THREE.Mesh(
		new THREE.CylinderGeometry(0.085, 0.018, 0.045, 24, 1, true),
		new THREE.MeshStandardMaterial({
			color: "#e8edf1",
			metalness: 0.2,
			roughness: 0.45,
			side: THREE.DoubleSide,
		}),
	);
	dish.rotation.x = Math.PI / 2;
	dish.position.z = 0.14;
	const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), white);
	boom.rotation.x = Math.PI / 2;
	boom.position.z = -0.19;
	satellite.add(
		new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.22), foil),
		yoke,
		wing.clone().translateX(0.36),
		wing.clone().translateX(-0.36),
		dish,
		boom,
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
		play(ticker, delay, lottieAt) {
			const start = ticker.now() + delay;
			const lottieStart = ticker.now() + lottieAt;
			ticker.add((t) => {
				if (stopped || !layer.isConnected) return false;
				const s = tidy(t - start) / 1000;
				// Settle: the camera arrives from slightly further out.
				camera.position.set(0, 0.25, 9.5 + 1.1 * (1 - expoOut(clamp01(s / 1.4))));
				camera.lookAt(0, 0, 0);
				camera.updateMatrixWorld();
				sun.copy(key.position).normalize().transformDirection(camera.matrixWorldInverse);
				rimLight.copy(rim.position).normalize().transformDirection(camera.matrixWorldInverse);
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
				cellsMap.dispose();
				renderer.dispose();
				renderer.forceContextLoss();
			});
		},
	};
}
