/**
 * Client entry point for `videowright dev`.
 * Acts as a tiny router that mounts the correct view based on pathname.
 */

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

import projectInfo from "virtual:videowright/project";
import { onRouteChange, parseRoute } from "./router.js";
import { renderHomepage } from "./views/homepage.js";
import { renderNotFound } from "./views/not_found.js";
import { renderVideoView } from "./views/video_view.js";

const app = document.getElementById("app");
if (!app) throw new Error("No #app element found");

const knownSlugs = new Set(projectInfo.videos.map((v) => v.slug));

function render(): void {
	const route = parseRoute(location.pathname, knownSlugs);
	app.innerHTML = "";

	switch (route.kind) {
		case "home":
			app.appendChild(renderHomepage(projectInfo));
			break;
		case "video":
			app.appendChild(renderVideoView(projectInfo, route.slug));
			break;
		case "not_found":
			app.appendChild(renderNotFound(route.attemptedPath, projectInfo));
			break;
	}
}

onRouteChange(render);
render();
