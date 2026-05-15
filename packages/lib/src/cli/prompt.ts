/**
 * Interactive video selection prompt for `videowright render`.
 * Uses Node's built-in readline -- no new dependencies.
 */

import { createInterface } from "node:readline";
import type { VideoSummary } from "../types.js";
import { UserError } from "./errors.js";

const MAX_RETRIES = 3;

/**
 * Display a numbered list of videos and prompt the user to pick one.
 * Retries up to 3 times on invalid input, then throws UserError.
 *
 * @returns The timelinePath of the selected video.
 */
export async function promptVideoSelection(videos: VideoSummary[]): Promise<string> {
	console.log("\nPick a video to render:");
	for (let i = 0; i < videos.length; i++) {
		const v = videos[i];
		console.log(`  ${i + 1}. ${v.slug} — "${v.title}" — ${v.style}`);
	}
	console.log();

	// Output to stderr so the prompt text doesn't pollute stdout if piped
	const rl = createInterface({
		input: process.stdin,
		output: process.stderr,
	});

	let attempts = 0;

	try {
		while (attempts < MAX_RETRIES) {
			const answer = await new Promise<string>((resolve) => {
				rl.question(`Enter number [1-${videos.length}]: `, resolve);
			});

			const num = Number.parseInt(answer.trim(), 10);
			if (!Number.isNaN(num) && num >= 1 && num <= videos.length) {
				return videos[num - 1].timelinePath;
			}

			attempts++;
			if (attempts < MAX_RETRIES) {
				console.error(`Invalid selection: "${answer.trim()}". Try again.`);
			}
		}
	} finally {
		rl.close();
	}

	throw new UserError("Failed to select a video after 3 attempts.");
}
