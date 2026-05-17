/**
 * End-to-end Playwright test for the demo example.
 *
 * Boots the actual Vite dev server, navigates to the demo_video,
 * and steps through all segments via keyboard (ArrowRight), asserting
 * each segment's slot content is rendered and on-screen.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, chromium, expect, test } from "@playwright/test";
import { type DevResult, runDev } from "../../src/cli/dev.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEMO_ROOT = resolve(__dirname, "../../../../examples/videowright_demo");

// The root URL now shows a homepage with video cards. The player mounts
// at /video/<video-slug>/, so all tests target the demo_video slug directly.
const VIDEO_PATH = "video/demo_video/";

// Ordered segment IDs in demo_video's timeline.
const SEGMENT_IDS = [
	"cold-open",
	"title-card",
	"web-tech-gallery",
	"interactive-dev",
	"pixel-perfect-export",
	"voiceover-sync",
	"any-coding-agent",
	"install-cta",
] as const;

let server: DevResult;

async function waitForSegment(page: Page, segmentId: string, timeoutMs = 10_000): Promise<void> {
	await page.waitForFunction((id) => window.location.hash.includes(`/${id}/`), segmentId, {
		timeout: timeoutMs,
	});
}

async function waitForStableLoad(page: Page): Promise<void> {
	await page.waitForSelector(".vw-host", { timeout: 15_000 });
	await page.waitForFunction(() => window.location.hash.length > 0, undefined, {
		timeout: 15_000,
	});
	await page.waitForTimeout(1500);
}

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
			const overlapsX = box.x + box.width > 0 && box.x < viewport.width;
			const overlapsY = box.y + box.height > 0 && box.y < viewport.height;
			expect(
				overlapsX && overlapsY,
				`${label}: element "${selector}" should be on-screen (box: ${JSON.stringify(box)}, viewport: ${viewport.width}x${viewport.height})`,
			).toBe(true);
		}
	}
}

async function pressNext(page: Page, waitMs = 600): Promise<void> {
	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(waitMs);
}

/**
 * Step ArrowRight until the URL hash advances to `nextSegmentId`, or fail
 * after `maxPresses`. Each segment has a different number of beats; rather
 * than hard-code per-segment beat counts (which churn as demo content
 * evolves), we just keep pressing until we land on the next segment.
 */
async function advanceToSegment(page: Page, nextSegmentId: string, maxPresses = 20): Promise<void> {
	for (let i = 0; i < maxPresses; i++) {
		const onTarget = await page.evaluate(
			(id) => window.location.hash.includes(`/${id}/`),
			nextSegmentId,
		);
		if (onTarget) return;
		await pressNext(page, 400);
	}
	throw new Error(
		`Failed to advance to segment "${nextSegmentId}" within ${maxPresses} ArrowRight presses`,
	);
}

test.beforeAll(async () => {
	server = await runDev({
		cwd: DEMO_ROOT,
		port: 5210,
	});

	// Pre-warm with a real browser to trigger Vite's dependency optimization.
	// Vite discovers deps when the browser requests JS modules, then triggers
	// a full page reload. We need this to complete before the actual tests run.
	const browser = await chromium.launch();
	const warmupPage = await browser.newPage();
	await warmupPage.goto(`${server.url}${VIDEO_PATH}`, { waitUntil: "networkidle" });

	try {
		await warmupPage.waitForSelector(".vw-host", { timeout: 15_000 });
		await warmupPage.waitForTimeout(2000);

		// Step through all segments to trigger lazy imports.
		for (let i = 0; i < 30; i++) {
			await warmupPage.keyboard.press("ArrowRight");
			await warmupPage.waitForTimeout(400);
		}
	} catch {
		// Warmup failures are non-fatal -- the page reload may cause errors.
	}

	await warmupPage.waitForTimeout(2000);
	await browser.close();
});

test.afterAll(async () => {
	if (server) {
		await server.close();
	}
});

test.describe(`Demo: step through all ${SEGMENT_IDS.length} segments`, () => {
	test("all segments render visible content via keyboard navigation", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto(`${server.url}${VIDEO_PATH}`, { waitUntil: "networkidle" });
		await waitForStableLoad(page);

		for (let i = 0; i < SEGMENT_IDS.length; i++) {
			const segmentId = SEGMENT_IDS[i];

			if (i === 0) {
				await waitForSegment(page, segmentId);
			} else {
				await advanceToSegment(page, segmentId);
			}

			// Each segment mounts content into the currently visible slot's
			// .vw-slot-content. During transitions, one slot is hidden + empty
			// and the other is visible + populated, so poll until any visible
			// slot has rendered children.
			await assertVisibleOnScreen(page, ".vw-slot[data-slot]", `${segmentId} slot`);
			await page.waitForFunction(
				() => {
					const slots = Array.from(document.querySelectorAll(".vw-slot")) as HTMLElement[];
					return slots.some((slot) => {
						if (slot.style.visibility === "hidden") return false;
						const content = slot.querySelector(".vw-slot-content");
						return !!content && content.childElementCount > 0;
					});
				},
				undefined,
				{ timeout: 5_000 },
			);
		}

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
		await page.goto(`${server.url}${VIDEO_PATH}`, { waitUntil: "networkidle" });
		await waitForStableLoad(page);

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
		await page.goto(`${server.url}${VIDEO_PATH}`, { waitUntil: "networkidle" });
		await waitForStableLoad(page);

		const [firstSegment, secondSegment] = SEGMENT_IDS;

		await waitForSegment(page, firstSegment);

		// Advance forward into the second segment.
		await advanceToSegment(page, secondSegment);

		// Go back. ArrowLeft retreats one beat at a time, so we may need
		// multiple presses to reach the previous segment.
		for (let i = 0; i < 20; i++) {
			const onFirst = await page.evaluate(
				(id) => window.location.hash.includes(`/${id}/`),
				firstSegment,
			);
			if (onFirst) break;
			await page.keyboard.press("ArrowLeft");
			await page.waitForTimeout(400);
		}
		await waitForSegment(page, firstSegment);

		await assertVisibleOnScreen(page, ".vw-slot[data-slot]", `${firstSegment} (after nav back)`);
	});
});
