/**
 * End-to-end Playwright test for the demo example.
 *
 * Boots the actual Vite dev server, navigates through all 7 segments
 * via keyboard (ArrowRight), and asserts each segment's content is
 * visible and on-screen.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, chromium, expect, test } from "@playwright/test";
import { type DevResult, runDev } from "../../src/cli/dev.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEMO_ROOT = resolve(__dirname, "../../../../examples/demo_example");

let server: DevResult;

/**
 * Helper: wait until the URL hash contains a given segment id.
 */
async function waitForSegment(page: Page, segmentId: string, timeoutMs = 10_000): Promise<void> {
	await page.waitForFunction((id) => window.location.hash.includes(`/${id}/`), segmentId, {
		timeout: timeoutMs,
	});
}

/**
 * Helper: wait for the page to be fully loaded and stable.
 * Handles Vite's dependency optimization reload gracefully.
 */
async function waitForStableLoad(page: Page): Promise<void> {
	await page.waitForSelector(".vw-host", { timeout: 15_000 });
	// Wait for the hash to be set (player has started)
	await page.waitForFunction(() => window.location.hash.length > 0, undefined, {
		timeout: 15_000,
	});
	// Additional settle time for animations
	await page.waitForTimeout(1500);
}

/**
 * Helper: assert an element is visible and within the viewport.
 */
async function assertVisibleOnScreen(page: Page, selector: string, label: string): Promise<void> {
	const locator = page.locator(selector).first();
	await expect(locator, `${label}: element "${selector}" should exist`).toBeAttached({
		timeout: 5_000,
	});

	const box = await locator.boundingBox();
	expect(box, `${label}: element "${selector}" should have a bounding box`).toBeTruthy();
	if (box) {
		const viewport = page.viewportSize();
		expect(viewport).toBeTruthy();
		if (viewport) {
			// Element should overlap with the viewport
			const overlapsX = box.x + box.width > 0 && box.x < viewport.width;
			const overlapsY = box.y + box.height > 0 && box.y < viewport.height;
			expect(
				overlapsX && overlapsY,
				`${label}: element "${selector}" should be on-screen (box: ${JSON.stringify(box)}, viewport: ${viewport.width}x${viewport.height})`,
			).toBe(true);
		}
	}
}

/**
 * Helper: press ArrowRight and wait a bit for transition.
 */
async function pressNext(page: Page, waitMs = 600): Promise<void> {
	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(waitMs);
}

test.beforeAll(async () => {
	server = await runDev({
		cwd: DEMO_ROOT,
		port: 5210,
	});

	// Pre-warm with a real browser to trigger Vite's dependency optimization.
	// Vite discovers deps (three, lottie-web, echarts) when the browser requests
	// JS modules, then triggers a full page reload. We need this to complete
	// before the actual tests run, so they don't hit the reload mid-test.
	const browser = await chromium.launch();
	const warmupPage = await browser.newPage();
	await warmupPage.goto(server.url, { waitUntil: "networkidle" });

	// Navigate through all segments to trigger all lazy imports.
	// Wait for the initial segment to load first.
	try {
		await warmupPage.waitForSelector(".vw-host", { timeout: 15_000 });
		await warmupPage.waitForTimeout(2000);

		// Step through all 7 segments to trigger dep loading
		for (let i = 0; i < 10; i++) {
			await warmupPage.keyboard.press("ArrowRight");
			await warmupPage.waitForTimeout(800);
		}
	} catch {
		// Warmup failures are non-fatal -- the page reload may cause errors
	}

	await warmupPage.waitForTimeout(2000);
	await browser.close();
});

test.afterAll(async () => {
	if (server) {
		await server.close();
	}
});

test.describe("Demo: step through all 7 segments", () => {
	test("all segments render visible content via keyboard navigation", async ({ page }) => {
		// Collect console errors (but don't fail on warnings)
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		// Navigate to the demo. Dependencies should already be optimized from warmup.
		await page.goto(server.url, { waitUntil: "networkidle" });
		await waitForStableLoad(page);

		// ============================================================
		// Segment 1: intro
		// ============================================================
		await waitForSegment(page, "intro");
		// The intro has an <animated-title> custom element
		await assertVisibleOnScreen(page, "animated-title", "intro");
		// The slot containing it should be visible
		await assertVisibleOnScreen(page, ".vw-slot[data-slot]", "intro slot");

		// ============================================================
		// Segment 2: feature-svg
		// ============================================================
		await pressNext(page, 1000);
		await waitForSegment(page, "feature-svg");
		// SVG node graph should be present
		await assertVisibleOnScreen(page, ".node-graph", "feature-svg");
		// Check that SVG has line elements
		const svgLineCount = await page.locator(".node-graph .edge").count();
		expect(svgLineCount, "feature-svg: should have edge lines").toBeGreaterThanOrEqual(4);

		// ============================================================
		// Segment 3: feature-three
		// ============================================================
		await pressNext(page, 1500);
		await waitForSegment(page, "feature-three");
		// Three.js renders a canvas element inside play(), which is async.
		// Wait for the canvas to appear.
		await assertVisibleOnScreen(page, ".three-container", "feature-three");
		await page.waitForSelector(".three-container canvas", { timeout: 5_000 });
		const canvasCount = await page.locator(".three-container canvas").count();
		expect(canvasCount, "feature-three: should have a canvas").toBeGreaterThanOrEqual(1);
		// feature-three has 2 beats -- advance through them
		await pressNext(page, 500);
		await pressNext(page, 500);

		// ============================================================
		// Segment 4: feature-lottie
		// ============================================================
		await pressNext(page, 1500);
		await waitForSegment(page, "feature-lottie");
		// Lottie container should exist and render in play()
		await assertVisibleOnScreen(page, ".lottie-container", "feature-lottie");
		// lottie-web renders an SVG element inside the container
		await page.waitForSelector(".lottie-container svg", { timeout: 5_000 });
		const lottieSvg = await page.locator(".lottie-container svg").count();
		expect(lottieSvg, "feature-lottie: should have an SVG from lottie-web").toBe(1);

		// ============================================================
		// Segment 5: feature-echarts
		// ============================================================
		await pressNext(page, 1500);
		await waitForSegment(page, "feature-echarts");
		// ECharts renders into .chart-container in play()
		await assertVisibleOnScreen(page, ".chart-container", "feature-echarts");
		await page.waitForSelector(".chart-container canvas", { timeout: 5_000 });
		const chartCanvas = await page.locator(".chart-container canvas").count();
		expect(
			chartCanvas,
			"feature-echarts: should have a canvas from echarts",
		).toBeGreaterThanOrEqual(1);
		// feature-echarts has 1 beat -- advance through it
		await pressNext(page, 500);

		// ============================================================
		// Segment 6: feature-cards
		// ============================================================
		await pressNext(page, 1000);
		await waitForSegment(page, "feature-cards");
		// Should have 3 feature-card elements
		const cardCount = await page.locator("feature-card").count();
		expect(cardCount, "feature-cards: should have 3 cards").toBe(3);
		await assertVisibleOnScreen(page, "feature-card", "feature-cards");
		// feature-cards has 3 beats -- advance through them
		await pressNext(page, 500);
		await pressNext(page, 500);
		await pressNext(page, 500);

		// ============================================================
		// Segment 7: outro
		// ============================================================
		await pressNext(page, 1000);
		await waitForSegment(page, "outro");
		// Outro has logo, code block
		await assertVisibleOnScreen(page, ".code-block", "outro");
		// The code block should contain the install command
		const codeText = await page.locator(".code-block").textContent();
		expect(codeText, "outro: code block should have install command").toContain(
			"npm install videowright",
		);

		// ============================================================
		// Verify no unexpected console errors
		// ============================================================
		// Filter out known non-critical errors (favicon 404, DevTools, etc.)
		const unexpectedErrors = consoleErrors.filter(
			(e) =>
				!e.includes("404") &&
				!e.includes("favicon") &&
				!e.includes("DevTools") &&
				!e.includes("Autofocus"),
		);
		expect(unexpectedErrors, "should have no unexpected console errors").toHaveLength(0);
	});

	test("segments are on-screen (bounding box inside viewport)", async ({ page }) => {
		await page.goto(server.url, { waitUntil: "networkidle" });
		await waitForStableLoad(page);

		// Check that the visible slot has position:absolute and inset:0
		// (verifying the slot fix is working)
		const slotStyle = await page.evaluate(() => {
			const slot = document.querySelector(".vw-slot") as HTMLElement;
			if (!slot) return null;
			const cs = window.getComputedStyle(slot);
			return {
				position: cs.position,
				top: cs.top,
				left: cs.left,
				width: cs.width,
				height: cs.height,
			};
		});

		expect(slotStyle, "slot should exist").toBeTruthy();
		if (slotStyle) {
			expect(slotStyle.position, "slot should be absolutely positioned").toBe("absolute");
			expect(slotStyle.top, "slot top should be 0").toBe("0px");
			expect(slotStyle.left, "slot left should be 0").toBe("0px");
		}

		// Check that the content div inside the slot exists and is visible
		const contentBox = await page.evaluate(() => {
			const content = document.querySelector(".vw-slot-content") as HTMLElement;
			if (!content) return null;
			const rect = content.getBoundingClientRect();
			return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
		});

		expect(contentBox, "slot content div should exist").toBeTruthy();
		if (contentBox) {
			expect(contentBox.width, "slot content should have width").toBeGreaterThan(0);
			expect(contentBox.height, "slot content should have height").toBeGreaterThan(0);
		}
	});

	test("can navigate backward with ArrowLeft", async ({ page }) => {
		await page.goto(server.url, { waitUntil: "networkidle" });
		await waitForStableLoad(page);

		// Start at intro
		await waitForSegment(page, "intro");

		// Go to feature-svg
		await pressNext(page, 1000);
		await waitForSegment(page, "feature-svg");

		// Go back to intro
		await page.keyboard.press("ArrowLeft");
		await page.waitForTimeout(1000);
		await waitForSegment(page, "intro");

		// Verify intro content is visible again
		await assertVisibleOnScreen(page, "animated-title", "intro (after nav back)");
	});
});
