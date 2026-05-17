/**
 * Entry point for the video page.
 * Parses the video slug from the URL pathname and boots the video player.
 */

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

import projectInfo from "virtual:videowright/project";
import { parseSlugFromPath } from "./parse_slug.js";
import { renderVideoView } from "./views/video_view.js";

const app = document.getElementById("app");
if (!app) throw new Error("No #app element found");

const slug = parseSlugFromPath(location.pathname);
const video = slug ? projectInfo.videos.find((v) => v.slug === slug) : null;

if (!video) {
	app.innerHTML = `<p>Unknown video. <a href="/">Back to videos</a></p>`;
} else {
	app.appendChild(renderVideoView(projectInfo, video.slug));
}
