/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { renderEmptyState } from "../../src/cli/entry/components/empty_state.js";

describe("renderEmptyState", () => {
	it("empty_state_renders_hero_text", () => {
		const panel = renderEmptyState();
		const hero = panel.querySelector(".vw-empty__hero");
		expect(hero).not.toBeNull();
		expect(hero?.textContent).toBe("No videos yet");
	});

	it("empty_state_renders_instruction_text", () => {
		const panel = renderEmptyState();
		const desc = panel.querySelector(".vw-empty__desc");
		expect(desc).not.toBeNull();
		expect(desc?.textContent).toContain("coding agent");
	});

	it("empty_state_renders_command_code_block", () => {
		const panel = renderEmptyState();
		const code = panel.querySelector(".vw-empty__code code");
		expect(code).not.toBeNull();
		expect(code?.textContent).toBe("/videowright new video");
	});

	it("empty_state_has_copy_button", () => {
		const panel = renderEmptyState();
		const copyBtn = panel.querySelector(".vw-copy-btn");
		expect(copyBtn).not.toBeNull();
	});

	it("empty_state_has_docs_link", () => {
		const panel = renderEmptyState();
		const link = panel.querySelector(".vw-empty__docs-link") as HTMLAnchorElement | null;
		expect(link).not.toBeNull();
		expect(link?.textContent).toContain("Read the docs →");
		expect(link?.target).toBe("_blank");
	});
});
