/**
 * ffmpeg detection and execution helpers.
 * Assumes ffmpeg is installed on the system PATH; does not bundle it.
 */

import { execFileSync, spawn } from "node:child_process";
import { platform } from "node:os";
import { UserError } from "./errors.js";

/**
 * Find ffmpeg on the system PATH.
 * Returns the absolute path to the ffmpeg binary.
 * Throws UserError with install instructions if not found.
 */
export function findFfmpeg(): string {
	const isWindows = platform() === "win32";
	const whichCmd = isWindows ? "where" : "which";

	try {
		const result = execFileSync(whichCmd, ["ffmpeg"], {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		// `which` and `where` may return multiple lines; take the first
		const path = result.trim().split("\n")[0].trim();
		if (path) return path;
	} catch {
		// not found
	}

	const installHint = isWindows
		? "Install ffmpeg: https://ffmpeg.org/download.html or via `choco install ffmpeg` / `winget install ffmpeg`"
		: platform() === "darwin"
			? "Install ffmpeg: `brew install ffmpeg` or download from https://ffmpeg.org/download.html"
			: "Install ffmpeg: `sudo apt install ffmpeg` or download from https://ffmpeg.org/download.html";

	throw new UserError("ffmpeg not found on PATH", installHint);
}

/**
 * Write a buffer to a writable stream, honoring backpressure.
 * If write() returns false, waits for 'drain' before resolving.
 *
 * When waiting for drain, we attach both a 'drain' and 'error' listener.
 * Whichever fires first removes the other to prevent listener accumulation
 * across repeated backpressure events.
 */
export function writeWithBackpressure(stream: NodeJS.WritableStream, data: Buffer): Promise<void> {
	return new Promise((resolve, reject) => {
		const canContinue = stream.write(data);
		if (canContinue) {
			resolve();
		} else {
			const onDrain = () => {
				stream.removeListener("error", onError);
				resolve();
			};
			const onError = (err: Error) => {
				stream.removeListener("drain", onDrain);
				reject(err);
			};
			stream.once("drain", onDrain);
			stream.once("error", onError);
		}
	});
}

export interface FfmpegResult {
	code: number;
	stderr: string;
}

/**
 * Build the ffmpeg argument array for a render pass.
 *
 * When `audioFilePath` is provided, the arguments include a second `-i` for
 * the audio file, AAC encoding, explicit stream mapping, and `-shortest`.
 * When absent, the existing video-only argument array is produced.
 */
export function buildFfmpegArgs(opts: {
	fps: number;
	outputPath: string;
	audioFilePath?: string;
}): string[] {
	const { fps, outputPath, audioFilePath } = opts;

	const args: string[] = ["-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "pipe:0"];

	if (audioFilePath) {
		args.push("-i", audioFilePath);
	}

	args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "18");

	if (audioFilePath) {
		args.push("-c:a", "aac", "-b:a", "192k", "-map", "0:v:0", "-map", "1:a:0", "-shortest");
	}

	args.push("-r", String(fps), outputPath);

	return args;
}

/**
 * Spawn ffmpeg with the given arguments.
 * Returns a promise that resolves when the process exits.
 * stderr is captured for diagnostics.
 */
export function spawnFfmpeg(
	ffmpegPath: string,
	args: string[],
): {
	process: ReturnType<typeof spawn>;
	done: Promise<FfmpegResult>;
} {
	const proc = spawn(ffmpegPath, args, {
		stdio: ["pipe", "pipe", "pipe"],
	});

	let stderr = "";
	proc.stderr?.on("data", (chunk: Buffer) => {
		stderr += chunk.toString();
	});

	const done = new Promise<FfmpegResult>((resolve, reject) => {
		proc.on("close", (code) => {
			resolve({ code: code ?? 1, stderr });
		});
		proc.on("error", (err) => {
			reject(err);
		});
	});

	return { process: proc, done };
}
