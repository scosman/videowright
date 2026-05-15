import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserError } from "../../src/cli/errors.js";
import { promptVideoSelection } from "../../src/cli/prompt.js";
import type { VideoSummary } from "../../src/types.js";

function makeVideos(count: number): VideoSummary[] {
	const videos: VideoSummary[] = [];
	for (let i = 0; i < count; i++) {
		videos.push({
			slug: `video_${i}`,
			timelinePath: `/fake/videos/video_${i}/timeline.ts`,
			title: `Video ${i} Title`,
			style: "motion-engineering",
			mtimeMs: Date.now() - i * 1000,
		});
	}
	return videos;
}

/**
 * Create a PassThrough stream that feeds lines with a small delay
 * to let readline consume them one at a time.
 */
function feedLines(stream: PassThrough, lines: string[]): void {
	let idx = 0;
	const next = () => {
		if (idx < lines.length) {
			stream.write(`${lines[idx]}\n`);
			idx++;
			// Small delay so readline processes each line before the next arrives
			setTimeout(next, 10);
		} else {
			// End the stream after all lines are consumed
			setTimeout(() => stream.end(), 10);
		}
	};
	// Start feeding after a tick to let readline attach
	setTimeout(next, 10);
}

describe("promptVideoSelection", () => {
	let origStdin: typeof process.stdin;
	let logSpy: ReturnType<typeof vi.spyOn>;
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		origStdin = process.stdin;
		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		Object.defineProperty(process, "stdin", { value: origStdin, writable: true });
		logSpy.mockRestore();
		errorSpy.mockRestore();
		vi.restoreAllMocks();
	});

	it("promptVideoSelection_valid_input", async () => {
		const videos = makeVideos(3);
		const mockStdin = new PassThrough();
		Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

		feedLines(mockStdin, ["2"]);
		const result = await promptVideoSelection(videos);
		expect(result).toBe(videos[1].timelinePath);
	});

	it("promptVideoSelection_first_option", async () => {
		const videos = makeVideos(3);
		const mockStdin = new PassThrough();
		Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

		feedLines(mockStdin, ["1"]);
		const result = await promptVideoSelection(videos);
		expect(result).toBe(videos[0].timelinePath);
	});

	it("promptVideoSelection_last_option", async () => {
		const videos = makeVideos(3);
		const mockStdin = new PassThrough();
		Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

		feedLines(mockStdin, ["3"]);
		const result = await promptVideoSelection(videos);
		expect(result).toBe(videos[2].timelinePath);
	});

	it("promptVideoSelection_retry_then_valid", async () => {
		const videos = makeVideos(3);
		const mockStdin = new PassThrough();
		Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

		feedLines(mockStdin, ["abc", "2"]);
		const result = await promptVideoSelection(videos);
		expect(result).toBe(videos[1].timelinePath);
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid selection"));
	});

	it("promptVideoSelection_max_retries_throws_UserError", async () => {
		const videos = makeVideos(3);
		const mockStdin = new PassThrough();
		Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

		feedLines(mockStdin, ["abc", "def", "ghi"]);
		try {
			await promptVideoSelection(videos);
			expect.fail("Expected promptVideoSelection to throw");
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			expect((e as UserError).message).toContain("Failed to select a video after 3 attempts");
		}
	});

	it("promptVideoSelection_out_of_range_retries", async () => {
		const videos = makeVideos(3);
		const mockStdin = new PassThrough();
		Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

		feedLines(mockStdin, ["0", "4", "2"]);
		const result = await promptVideoSelection(videos);
		expect(result).toBe(videos[1].timelinePath);
	});

	it("promptVideoSelection_prints_numbered_list", async () => {
		const videos = makeVideos(2);
		const mockStdin = new PassThrough();
		Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

		feedLines(mockStdin, ["1"]);
		await promptVideoSelection(videos);

		const allLogs = logSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(allLogs).toContain("Pick a video to render:");
		expect(allLogs).toContain("1. video_0");
		expect(allLogs).toContain("2. video_1");
	});
});
