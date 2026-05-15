import { describe, expect, it } from "vitest";
import { ArgvError, parseArgv } from "../../src/cli/argv.js";

describe("argv parser: record command removed", () => {
	it("argv_record_is_now_unknown", () => {
		expect(() => parseArgv(["record"])).toThrow(ArgvError);
		expect(() => parseArgv(["record"])).toThrow("Unknown command: record");
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
