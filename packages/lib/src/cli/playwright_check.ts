/**
 * Playwright availability check.
 * Playwright is an optional runtime dependency -- only needed for record/render commands.
 * Dynamic import so consumers who only use dev/script don't pay the cost.
 */

import { UserError } from "./errors.js";

export interface PlaywrightModule {
	chromium: {
		launch(opts?: Record<string, unknown>): Promise<PlaywrightBrowser>;
	};
}

export interface PlaywrightBrowser {
	newContext(opts?: Record<string, unknown>): Promise<PlaywrightBrowserContext>;
	close(): Promise<void>;
}

export interface PlaywrightBrowserContext {
	newPage(): Promise<PlaywrightPage>;
	close(): Promise<void>;
}

/**
 * Minimal stub of Playwright's Page interface.
 * Intentionally narrow -- only the methods record.ts and render.ts actually use.
 * Playwright's real `evaluate` accepts arg-passing overloads; we don't need them.
 */
export interface PlaywrightPage {
	goto(url: string, opts?: Record<string, unknown>): Promise<unknown>;
	setViewportSize(size: { width: number; height: number }): Promise<void>;
	screenshot(opts?: Record<string, unknown>): Promise<Buffer>;
	evaluate<T>(fn: (() => T) | string): Promise<T>;
	waitForFunction(fn: (() => unknown) | string, opts?: Record<string, unknown>): Promise<unknown>;
	addInitScript(opts: { content: string }): Promise<void>;
	on(event: string, handler: (...args: unknown[]) => void): void;
	close(): Promise<void>;
}

/**
 * Dynamically import playwright.
 * Throws UserError with a clear install hint if playwright is not available.
 */
export async function ensurePlaywright(): Promise<PlaywrightModule> {
	try {
		const pw = await import("playwright");
		return pw as unknown as PlaywrightModule;
	} catch {
		throw new UserError(
			"Playwright is not installed",
			"Install it with: npm install playwright && npx playwright install chromium",
		);
	}
}
