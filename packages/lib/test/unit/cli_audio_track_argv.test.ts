import { describe, expect, it } from "vitest";
import { ArgvError, parseArgv } from "../../src/cli/argv.js";

describe("argv parser: --audio-track flag", () => {
	it("render_accepts_audio_track_id", () => {
		const result = parseArgv(["render", "--audio-track", "v1"]);
		expect(result.command).toBe("render");
		expect(result.flags.audioTrack).toBe("v1");
	});

	it("render_accepts_audio_track_none", () => {
		const result = parseArgv(["render", "--audio-track", "none"]);
		expect(result.command).toBe("render");
		expect(result.flags.audioTrack).toBe("none");
	});

	it("dev_rejects_audio_track_flag", () => {
		expect(() => parseArgv(["dev", "--audio-track", "v1"])).toThrow(ArgvError);
		expect(() => parseArgv(["dev", "--audio-track", "v1"])).toThrow(
			'--audio-track is only valid for the "render" command',
		);
	});

	it("script_rejects_audio_track_flag", () => {
		expect(() => parseArgv(["script", "--audio-track", "v1"])).toThrow(ArgvError);
	});

	it("no_audio_track_flag_leaves_undefined", () => {
		const result = parseArgv(["render"]);
		expect(result.flags.audioTrack).toBeUndefined();
	});

	it("audio_track_with_positional_and_other_flags", () => {
		const result = parseArgv([
			"render",
			"videos/demo/timeline.ts",
			"--audio-track",
			"v3",
			"--fps",
			"30",
			"--verbose",
		]);
		expect(result.command).toBe("render");
		expect(result.positional).toBe("videos/demo/timeline.ts");
		expect(result.flags.audioTrack).toBe("v3");
		expect(result.flags.fps).toBe(30);
		expect(result.flags.verbose).toBe(true);
	});
});
