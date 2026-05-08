/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it } from "vitest";
import { onChange, read, readQueryFallback, write } from "../../src/player/hash_router.js";

afterEach(() => {
	// Reset hash and search after each test
	history.replaceState(null, "", location.pathname);
});

describe("hash_router read", () => {
	it("hash_router_parse_valid", () => {
		history.replaceState(null, "", "#/intro/0");
		const state = read();
		expect(state).toEqual({ segmentId: "intro", beat: 0 });
	});

	it("parses multi-digit beat", () => {
		history.replaceState(null, "", "#/seg-name/12");
		const state = read();
		expect(state).toEqual({ segmentId: "seg-name", beat: 12 });
	});

	it("hash_router_parse_malformed_garbage", () => {
		history.replaceState(null, "", "#garbage");
		expect(read()).toBeNull();
	});

	it("hash_router_parse_malformed_missing_beat", () => {
		history.replaceState(null, "", "#/intro");
		expect(read()).toBeNull();
	});

	it("returns null for empty hash", () => {
		history.replaceState(null, "", location.pathname);
		expect(read()).toBeNull();
	});

	it("returns null for hash with trailing slash", () => {
		history.replaceState(null, "", "#/intro/0/extra");
		expect(read()).toBeNull();
	});
});

describe("hash_router write", () => {
	it("hash_router_write_no_history_entry", () => {
		const lengthBefore = history.length;
		write({ segmentId: "intro", beat: 0 });
		expect(location.hash).toBe("#/intro/0");
		// replaceState does not push history
		expect(history.length).toBe(lengthBefore);
	});

	it("writes beat correctly", () => {
		write({ segmentId: "outro", beat: 5 });
		expect(location.hash).toBe("#/outro/5");
	});
});

describe("hash_router readQueryFallback", () => {
	it("hash_router_query_fallback", () => {
		// jsdom doesn't easily let us set search, so we use replaceState
		history.replaceState(null, "", "?to=intro");
		const id = readQueryFallback();
		expect(id).toBe("intro");
		// Query should be cleaned
		expect(location.search).toBe("");
	});

	it("returns null when no to param", () => {
		history.replaceState(null, "", location.pathname);
		expect(readQueryFallback()).toBeNull();
	});
});

describe("hash_router onChange", () => {
	it("calls handler on valid hashchange", async () => {
		const states: Array<{ segmentId: string; beat: number }> = [];
		const unsub = onChange((s) => states.push(s));

		// Simulate hashchange
		history.replaceState(null, "", "#/seg-1/3");
		window.dispatchEvent(new HashChangeEvent("hashchange"));

		expect(states).toEqual([{ segmentId: "seg-1", beat: 3 }]);

		unsub();
	});

	it("does not call handler for malformed hash", () => {
		const states: Array<{ segmentId: string; beat: number }> = [];
		const unsub = onChange((s) => states.push(s));

		history.replaceState(null, "", "#bad");
		window.dispatchEvent(new HashChangeEvent("hashchange"));

		expect(states).toHaveLength(0);

		unsub();
	});

	it("unsubscribe stops future calls", () => {
		const states: Array<{ segmentId: string; beat: number }> = [];
		const unsub = onChange((s) => states.push(s));

		unsub();

		history.replaceState(null, "", "#/seg/0");
		window.dispatchEvent(new HashChangeEvent("hashchange"));

		expect(states).toHaveLength(0);
	});
});
