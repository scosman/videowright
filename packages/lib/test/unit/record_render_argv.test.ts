import { describe, expect, it } from "vitest";
import { ArgvError, parseArgv } from "../../src/cli/argv.js";

describe("argv parser: record command", () => {
	it("argv_record_no_args", () => {
		const result = parseArgv(["record"]);
		expect(result.command).toBe("record");
		expect(result.positional).toBeUndefined();
	});

	it("argv_record_with_path", () => {
		const result = parseArgv(["record", "videos/demo/timeline.ts"]);
		expect(result.command).toBe("record");
		expect(result.positional).toBe("videos/demo/timeline.ts");
	});

	it("argv_record_with_verbose", () => {
		const result = parseArgv(["record", "--verbose"]);
		expect(result.command).toBe("record");
		expect(result.flags.verbose).toBe(true);
	});

	it("argv_record_with_path_and_verbose", () => {
		const result = parseArgv(["record", "videos/demo/timeline.ts", "--verbose"]);
		expect(result.command).toBe("record");
		expect(result.positional).toBe("videos/demo/timeline.ts");
		expect(result.flags.verbose).toBe(true);
	});

	it("argv_record_rejects_output_flag", () => {
		expect(() => parseArgv(["record", "--output", "foo.mp4"])).toThrow(ArgvError);
		expect(() => parseArgv(["record", "--output", "foo.mp4"])).toThrow(
			'--output is only valid for the "render" command',
		);
	});

	it("argv_record_rejects_width_flag", () => {
		expect(() => parseArgv(["record", "--width", "1920"])).toThrow(ArgvError);
		expect(() => parseArgv(["record", "--width", "1920"])).toThrow(
			'--width is only valid for the "render" command',
		);
	});

	it("argv_record_rejects_height_flag", () => {
		expect(() => parseArgv(["record", "--height", "1080"])).toThrow(ArgvError);
		expect(() => parseArgv(["record", "--height", "1080"])).toThrow(
			'--height is only valid for the "render" command',
		);
	});

	it("argv_record_rejects_fps_flag", () => {
		expect(() => parseArgv(["record", "--fps", "30"])).toThrow(ArgvError);
		expect(() => parseArgv(["record", "--fps", "30"])).toThrow(
			'--fps is only valid for the "render" command',
		);
	});

	it("argv_record_with_voiceover_slug", () => {
		const result = parseArgv(["record", "--voiceover", "narrator-warm"]);
		expect(result.command).toBe("record");
		expect(result.flags.voiceover).toBe("narrator-warm");
	});

	it("argv_record_with_voiceover_none", () => {
		const result = parseArgv(["record", "--voiceover", "none"]);
		expect(result.command).toBe("record");
		expect(result.flags.voiceover).toBe("none");
	});

	it("argv_record_with_voiceover_and_path", () => {
		const result = parseArgv(["record", "videos/demo/timeline.ts", "--voiceover", "v1"]);
		expect(result.command).toBe("record");
		expect(result.positional).toBe("videos/demo/timeline.ts");
		expect(result.flags.voiceover).toBe("v1");
	});
});

describe("argv parser: render command", () => {
	it("argv_render_no_args", () => {
		const result = parseArgv(["render"]);
		expect(result.command).toBe("render");
		expect(result.positional).toBeUndefined();
	});

	it("argv_render_with_fps", () => {
		const result = parseArgv(["render", "--fps", "30"]);
		expect(result.command).toBe("render");
		expect(result.flags.fps).toBe(30);
	});

	it("argv_render_with_output", () => {
		const result = parseArgv(["render", "--output", "rendered.mp4"]);
		expect(result.command).toBe("render");
		expect(result.flags.output).toBe("rendered.mp4");
	});

	it("argv_render_with_path_and_flags", () => {
		const result = parseArgv([
			"render",
			"videos/launch/timeline.ts",
			"--width",
			"1920",
			"--height",
			"1080",
			"--fps",
			"60",
		]);
		expect(result.command).toBe("render");
		expect(result.positional).toBe("videos/launch/timeline.ts");
		expect(result.flags.width).toBe(1920);
		expect(result.flags.height).toBe(1080);
		expect(result.flags.fps).toBe(60);
	});

	it("argv_render_invalid_width", () => {
		expect(() => parseArgv(["render", "--width", "abc"])).toThrow(ArgvError);
		expect(() => parseArgv(["render", "--width", "abc"])).toThrow("Invalid width");
	});

	it("argv_render_invalid_height", () => {
		expect(() => parseArgv(["render", "--height", "0"])).toThrow(ArgvError);
		expect(() => parseArgv(["render", "--height", "0"])).toThrow("Invalid height");
	});

	it("argv_render_invalid_fps", () => {
		expect(() => parseArgv(["render", "--fps", "0"])).toThrow(ArgvError);
		expect(() => parseArgv(["render", "--fps", "0"])).toThrow("Invalid fps");
	});

	it("argv_render_fps_out_of_range", () => {
		expect(() => parseArgv(["render", "--fps", "999"])).toThrow(ArgvError);
	});
});
