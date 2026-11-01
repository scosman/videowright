import "./v2.css";

// A browser window: traffic dots, back / forward / reload, a URL pill, and a viewport under the
// toolbar that the caller fills (a product UI, the dev server's preview). Dark for the dev
// setup, light for a product. Sized in its parent's px, at legible 1x scale (URL 24px).

export interface BrowserOptions {
	/** The window's box in its parent's px. */
	x: number;
	y: number;
	w: number;
	h: number;
	url: string;
	theme?: "dark" | "light";
}

export interface Browser {
	root: HTMLElement;
	/** The page area, under the toolbar: `w` × (`h` − BROWSER_BAR) px. */
	viewport: HTMLElement;
	url: HTMLElement;
	setUrl(url: string): void;
}

/** Toolbar height (px): the viewport starts this far below the window's top. */
export const BROWSER_BAR = 64;

const ICONS = `
	<svg width="132" height="28" viewBox="0 0 132 28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
		<path d="M20 14H6M12 7l-7 7 7 7"/>
		<path d="M50 14h14M58 7l7 7-7 7" opacity="0.45"/>
		<path d="M117 8.5A8 8 0 1 0 120 15"/><path d="M118.5 3.5v6h-6"/>
	</svg>`;

export function createBrowser(host: HTMLElement, opts: BrowserOptions): Browser {
	const root = document.createElement("div");
	root.className = `v2-browser v2-browser-${opts.theme ?? "dark"}`;
	root.style.cssText = `left:${opts.x}px; top:${opts.y}px; width:${opts.w}px; height:${opts.h}px`;
	root.innerHTML = `
		<div class="v2-browser-bar">
			<span class="v2-browser-dot" style="left:26px"></span>
			<span class="v2-browser-dot" style="left:50px"></span>
			<span class="v2-browser-dot" style="left:74px"></span>
			<div class="v2-browser-icons">${ICONS}</div>
			<div class="v2-browser-url">
				<svg width="18" height="22" viewBox="0 0 18 22" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="9" width="14" height="11" rx="2.5"/><path d="M5 9V6.5a4 4 0 0 1 8 0V9"/></svg>
				<span data-ref="url"></span>
			</div>
		</div>
		<div class="v2-browser-view"></div>`;
	host.appendChild(root);
	const url = root.querySelector('[data-ref="url"]') as HTMLElement;
	url.textContent = opts.url;
	return {
		root,
		viewport: root.querySelector(".v2-browser-view") as HTMLElement,
		url,
		setUrl: (next) => {
			url.textContent = next;
		},
	};
}
