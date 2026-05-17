/**
 * Entry point for the index page (video list).
 * Imports global styles and mounts the homepage view.
 */

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

import projectInfo from "virtual:videowright/project";
import { renderHomepage } from "./views/homepage.js";

const app = document.getElementById("app");
if (!app) throw new Error("No #app element found");

app.appendChild(renderHomepage(projectInfo));
