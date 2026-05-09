import { describe, expect, it } from "vitest";
import { ArgvError, parseArgv } from "../../src/cli/argv.js";

describe("argv parser: record command", () => {
	it("argv_record_no_args", () => {
		const result = parseArgv(["record"]);
		expect(result.command).toBe("record");
		expect(result.positional).toBeUndefined();
		expect(result.flags.width).toBeUndefined();
		expect(result.flags.height).toBeUndefined();
		expect(result.flags.fps).toBeUndefined();
		expect(result.flags.output).toBeUndefined();
	});

	it("argv_record_with_output", () => {
		const result = parseArgv(["record", "--output", "my_video.mp4"]);
		expect(result.command).toBe("record");
		expect(result.flags.output).toBe("my_video.mp4");
	});

	it("argv_record_with_resolution", () => {
		const result = parseArgv(["record", "--width", "1280", "--height", "720"]);
		expect(result.command).toBe("record");
		expect(result.flags.width).toBe(1280);
		expect(result.flags.height).toBe(720);
	});

	it("argv_record_with_fps", () => {
		const result = parseArgv(["record", "--fps", "24"]);
		expect(result.command).toBe("record");
		expect(result.flags.fps).toBe(24);
	});

	it("argv_record_with_path", () => {
		const result = parseArgv(["record", "videos/demo/timeline.ts"]);
		expect(result.command).toBe("record");
		expect(result.positional).toBe("videos/demo/timeline.ts");
	});

	it("argv_record_all_flags", () => {
		const result = parseArgv([
			"record",
			"videos/demo/timeline.ts",
			"--width",
			"1280",
			"--height",
			"720",
			"--fps",
			"30",
			"--output",
			"export.mp4",
			"--verbose",
		]);
		expect(result.command).toBe("record");
		expect(result.positional).toBe("videos/demo/timeline.ts");
		expect(result.flags.width).toBe(1280);
		expect(result.flags.height).toBe(720);
		expect(result.flags.fps).toBe(30);
		expect(result.flags.output).toBe("export.mp4");
		expect(result.flags.verbose).toBe(true);
	});

	it("argv_record_invalid_width", () => {
		expect(() => parseArgv(["record", "--width", "abc"])).toThrow(ArgvError);
		expect(() => parseArgv(["record", "--width", "abc"])).toThrow("Invalid width");
	});

	it("argv_record_invalid_height", () => {
		expect(() => parseArgv(["record", "--height", "0"])).toThrow(ArgvError);
		expect(() => parseArgv(["record", "--height", "0"])).toThrow("Invalid height");
	});

	it("argv_record_invalid_fps", () => {
		expect(() => parseArgv(["record", "--fps", "0"])).toThrow(ArgvError);
		expect(() => parseArgv(["record", "--fps", "0"])).toThrow("Invalid fps");
	});

	it("argv_record_fps_out_of_range", () => {
		expect(() => parseArgv(["record", "--fps", "999"])).toThrow(ArgvError);
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
});
