import * as THREE from "three";
import { defineSegment } from "videowright";
import { palette } from "../../styles/tokens.js";

let host: HTMLElement | null = null;
let renderer: THREE.WebGLRenderer | null = null;

export default defineSegment({
	id: "feature-three",
	advances: [2.0, 4.0, 6.0],
	voiceover: "Three.js for 3D. A full WebGL scene, right inside a segment.",

	mount(el) {
		host = el;
		el.style.cssText = `
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: #07070d;
			position: relative;
			overflow: hidden;
		`;

		el.innerHTML = `
			<div style="font-family: Inter, system-ui, sans-serif; font-size: 1rem; font-weight: 600; color: #5c5c78; letter-spacing: 0.15em; text-transform: uppercase; position: absolute; top: 3rem; z-index: 1;">Three.js</div>
			<div class="three-container" style="width: 100%; height: 100%;"></div>
			<div class="label" style="
				position: absolute;
				bottom: 4rem;
				font-family: Inter, system-ui, sans-serif;
				font-size: 1.5rem;
				font-weight: 600;
				color: #f0f0f5;
				opacity: 0;
				z-index: 1;
			">Any npm package. Any web API.</div>
		`;
	},

	async play(ctx) {
		if (!host) return;
		const container = host.querySelector(".three-container") as HTMLElement;
		const label = host.querySelector(".label") as HTMLElement;
		if (!container) return;

		const width = container.clientWidth || 960;
		const height = container.clientHeight || 540;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(palette.bgPrimary);

		const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
		camera.position.z = 5;

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		container.appendChild(renderer.domElement);

		const geometry = new THREE.IcosahedronGeometry(1.4, 1);
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color(palette.accentBlue),
			roughness: 0.35,
			metalness: 0.6,
			wireframe: false,
			flatShading: true,
		});
		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		const wireGeo = new THREE.IcosahedronGeometry(1.42, 1);
		const wireMat = new THREE.MeshBasicMaterial({
			color: new THREE.Color(palette.accentPurple),
			wireframe: true,
			transparent: true,
			opacity: 0.15,
		});
		const wireMesh = new THREE.Mesh(wireGeo, wireMat);
		scene.add(wireMesh);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		const pointLight1 = new THREE.PointLight(new THREE.Color(palette.accentBlue), 80, 50);
		pointLight1.position.set(5, 5, 5);
		scene.add(pointLight1);

		const pointLight2 = new THREE.PointLight(new THREE.Color(palette.accentPurple), 60, 50);
		pointLight2.position.set(-5, -3, 3);
		scene.add(pointLight2);

		let rafId: number;
		const startTime = performance.now();

		function animate() {
			const elapsed = (performance.now() - startTime) / 1000;
			mesh.rotation.y = elapsed * 0.4;
			mesh.rotation.x = elapsed * 0.2;
			wireMesh.rotation.y = elapsed * 0.4;
			wireMesh.rotation.x = elapsed * 0.2;
			renderer?.render(scene, camera);
			rafId = requestAnimationFrame(animate);
		}
		rafId = requestAnimationFrame(animate);

		ctx.signal.addEventListener("abort", () => {
			cancelAnimationFrame(rafId);
		});

		// Beat 1: camera zooms out to reveal full shape
		await ctx.waitForNext();
		camera.position.z = 7;

		// Beat 2: label appears
		await ctx.waitForNext();
		if (label) {
			label.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 400,
				fill: "forwards",
				easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			});
			label.dataset.visible = "true";
		}
	},

	unmount() {
		if (renderer) {
			renderer.dispose();
			renderer = null;
		}
		host = null;
	},
});
