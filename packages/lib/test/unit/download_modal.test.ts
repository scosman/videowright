/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderDownloadModal } from "../../src/cli/entry/components/download_modal.js";

describe("renderDownloadModal", () => {
	afterEach(() => {
		// Clean up any modals left in the DOM
		document.body.innerHTML = "";
	});

	it("download_modal_renders_two_columns", () => {
		renderDownloadModal({ slug: "demo", title: "Demo Title", onClose: vi.fn() });

		const columns = document.querySelectorAll(".vw-modal__column");
		expect(columns).toHaveLength(2);
	});

	it("download_modal_shows_correct_title", () => {
		renderDownloadModal({ slug: "demo", title: "My Video", onClose: vi.fn() });

		const title = document.querySelector(".vw-modal__title");
		expect(title?.textContent).toBe("Export My Video");
	});

	it("download_modal_shows_slug", () => {
		renderDownloadModal({ slug: "my_slug", title: "Title", onClose: vi.fn() });

		const slug = document.querySelector(".vw-modal__slug");
		expect(slug?.textContent).toBe("my_slug");
	});

	it("download_modal_shows_correct_cli_command", () => {
		renderDownloadModal({ slug: "landing_page", title: "Landing Page", onClose: vi.fn() });

		const code = document.querySelector(".vw-modal__code code");
		expect(code?.textContent).toBe("npx videowright render landing_page");
	});

	it("download_modal_has_copy_button", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", onClose: vi.fn() });

		const copyBtn = document.querySelector(".vw-copy-btn");
		expect(copyBtn).not.toBeNull();
	});

	it("download_modal_export_column_has_recommended_badge", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", onClose: vi.fn() });

		const badge = document.querySelector(".vw-modal__badge");
		expect(badge).not.toBeNull();
		expect(badge?.textContent).toBe("Recommended");
	});

	it("download_modal_screen_record_column_has_tips", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", hasPlayer: true, onClose: vi.fn() });

		const tips = document.querySelector(".vw-modal__tips");
		expect(tips).not.toBeNull();

		const items = tips?.querySelectorAll("li");
		expect(items).toHaveLength(3);
		expect(items?.[0]?.textContent).toContain("Press H");
	});

	it("download_modal_no_player_shows_open_player_button", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", onClose: vi.fn() });

		const openPlayerBtn = document.querySelector(".vw-modal__open-player") as HTMLAnchorElement;
		expect(openPlayerBtn).not.toBeNull();
		expect(openPlayerBtn.textContent).toBe("Open Player");
		expect(openPlayerBtn.href).toContain("/video/demo");

		// Tips should NOT be rendered
		const tips = document.querySelector(".vw-modal__tips");
		expect(tips).toBeNull();
	});

	it("download_modal_has_player_does_not_show_open_player_button", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", hasPlayer: true, onClose: vi.fn() });

		const openPlayerBtn = document.querySelector(".vw-modal__open-player");
		expect(openPlayerBtn).toBeNull();
	});

	it("download_modal_close_via_x_button", () => {
		const onClose = vi.fn();
		renderDownloadModal({ slug: "demo", title: "Demo", onClose });

		const closeBtn = document.querySelector(".vw-modal__close") as HTMLButtonElement;
		expect(closeBtn).not.toBeNull();
		closeBtn.click();

		expect(onClose).toHaveBeenCalledOnce();
		expect(document.querySelector(".vw-modal-backdrop")).toBeNull();
	});

	it("download_modal_close_via_escape_key", () => {
		const onClose = vi.fn();
		renderDownloadModal({ slug: "demo", title: "Demo", onClose });

		expect(document.querySelector(".vw-modal-backdrop")).not.toBeNull();

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

		expect(onClose).toHaveBeenCalledOnce();
		expect(document.querySelector(".vw-modal-backdrop")).toBeNull();
	});

	it("download_modal_close_via_backdrop_click", () => {
		const onClose = vi.fn();
		renderDownloadModal({ slug: "demo", title: "Demo", onClose });

		const backdrop = document.querySelector(".vw-modal-backdrop") as HTMLElement;
		expect(backdrop).not.toBeNull();

		// Click on the backdrop itself (not the modal)
		backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		expect(onClose).toHaveBeenCalledOnce();
		expect(document.querySelector(".vw-modal-backdrop")).toBeNull();
	});

	it("download_modal_click_on_modal_does_not_close", () => {
		const onClose = vi.fn();
		renderDownloadModal({ slug: "demo", title: "Demo", onClose });

		const modal = document.querySelector(".vw-modal") as HTMLElement;
		modal.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		// Should NOT close when clicking inside the modal
		expect(onClose).not.toHaveBeenCalled();
		expect(document.querySelector(".vw-modal-backdrop")).not.toBeNull();
	});

	it("download_modal_has_dialog_role", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", onClose: vi.fn() });

		const dialog = document.querySelector("[role='dialog']");
		expect(dialog).not.toBeNull();
		expect(dialog?.getAttribute("aria-modal")).toBe("true");
	});

	it("download_modal_uses_aria_labelledby", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", onClose: vi.fn() });

		const dialog = document.querySelector("[role='dialog']");
		expect(dialog?.getAttribute("aria-labelledby")).toBe("vw-modal-title");

		const title = document.getElementById("vw-modal-title");
		expect(title).not.toBeNull();
		expect(title?.textContent).toBe("Export Demo");
	});

	it("download_modal_dismiss_returns_cleanup_fn", () => {
		const dismiss = renderDownloadModal({ slug: "demo", title: "Demo", onClose: vi.fn() });
		expect(typeof dismiss).toBe("function");
		expect(document.querySelector(".vw-modal-backdrop")).not.toBeNull();

		dismiss();
		expect(document.querySelector(".vw-modal-backdrop")).toBeNull();
	});

	it("download_modal_double_open_replaces_existing", () => {
		renderDownloadModal({ slug: "first", title: "First", onClose: vi.fn() });
		renderDownloadModal({ slug: "second", title: "Second", onClose: vi.fn() });

		const backdrops = document.querySelectorAll(".vw-modal-backdrop");
		expect(backdrops).toHaveLength(1);

		const title = document.querySelector(".vw-modal__title");
		expect(title?.textContent).toBe("Export Second");
	});

	it("download_modal_focus_trap_wraps_tab_forward", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", hasPlayer: true, onClose: vi.fn() });

		const closeBtn = document.querySelector(".vw-modal__close") as HTMLElement;
		const copyBtn = document.querySelector(".vw-copy-btn") as HTMLElement;
		expect(closeBtn).not.toBeNull();
		expect(copyBtn).not.toBeNull();

		// Focus the last focusable element (copy button)
		copyBtn.focus();
		expect(document.activeElement).toBe(copyBtn);

		// Tab forward from last should wrap to first (close button)
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
		);

		expect(document.activeElement).toBe(closeBtn);
	});

	it("download_modal_focus_trap_wraps_shift_tab_backward", () => {
		renderDownloadModal({ slug: "demo", title: "Demo", hasPlayer: true, onClose: vi.fn() });

		const closeBtn = document.querySelector(".vw-modal__close") as HTMLElement;
		const copyBtn = document.querySelector(".vw-copy-btn") as HTMLElement;
		expect(closeBtn).not.toBeNull();
		expect(copyBtn).not.toBeNull();

		// Focus the first focusable element (close button)
		closeBtn.focus();
		expect(document.activeElement).toBe(closeBtn);

		// Shift+Tab from first should wrap to last (copy button)
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }),
		);

		expect(document.activeElement).toBe(copyBtn);
	});
});
