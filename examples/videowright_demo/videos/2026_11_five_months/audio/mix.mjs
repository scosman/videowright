#!/usr/bin/env node
// Renders the mix from audio/cues.json (audio/sync.mjs). Run from the video folder:
//   node audio/mix.mjs <out.mp3>
// It is the audio plan's final mix command: the cue times come from the assembled narration, so
// a re-timed take needs no edits here.
//
//   narration  the assembled narration (voice beat included), from 0s
//   music      the bed's build (0s on) under the title and the pairs, fading out over the cut
//              into the voice beat; then its last stretch from after the voice beat's last
//              word, ending on the music's own fade with the video, lifted for the end hold
//   whooshes   one per Then -> Now sweep, peaking mid-sweep (the file peaks 0.375s in; the
//              beam is mid-window ~0.3s after its cue)
// Master: demo_v2's two-pass recipe (a true-peak guard, then one linear gain to -14 LUFS).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const out = process.argv[2];
if (!out) throw new Error("usage: node audio/mix.mjs <out.mp3>");
const cues = JSON.parse(readFileSync("audio/cues.json", "utf8"));
if (cues.standIn) console.warn("warning: cues.json was built from the stand-in narration");

const NARRATION = "audio/originals/voiceovers/assembled/audio.wav";
const MUSIC = "audio/originals/music/bed/audio.mp3";
const WHOOSH = "audio/originals/sfx/sweep_whoosh/audio.mp3";
/** Where the music's own fade starts to end (s, in the music file): its closing stretch ends here. */
const MUSIC_END = 146.33;
const BED = 0.0891; // -21 dB under the narration
const LIFT = 0.2239; // -13 dB for the end hold
const WHOOSH_GAIN = 0.3;
const WHOOSH_LEAD = 0.075;

const f = (t) => t.toFixed(3);
const end = cues.duration;
const voiceStart = cues.music.outAt;
const backAt = cues.music.inAt;
const closeLen = end - backAt;
const closeFrom = MUSIC_END - closeLen;
const lastWordEnd = cues.lastWordEnd;
const liftAt = lastWordEnd + 0.1 - backAt; // local to the closing slice

const whooshes = cues.sweeps.map((t) => Math.round((t - WHOOSH_LEAD) * 1000));
const graph = [
	"[0:a] pan=stereo|c0=c0|c1=c0 [vo]",
	`[1:a] atrim=0:${f(voiceStart + 0.3)}, asetpts=PTS-STARTPTS, volume=${BED}, afade=t=out:st=${f(voiceStart - 0.9)}:d=1.2 [m1]`,
	`[2:a] atrim=start=${f(closeFrom)}:end=${f(MUSIC_END)}, asetpts=PTS-STARTPTS, volume='if(lt(t,${f(liftAt)}),${BED},if(lt(t,${f(liftAt + 0.8)}),${BED}+${(LIFT - BED).toFixed(4)}*(t-${f(liftAt)})/0.8,${LIFT}))':eval=frame, afade=t=in:st=0:d=1.2, afade=t=out:st=${f(closeLen - 0.6)}:d=0.6, adelay=${Math.round(backAt * 1000)}:all=1 [m2]`,
	`[3:a] aresample=44100, volume=${WHOOSH_GAIN}, asplit=${whooshes.length} ${whooshes.map((_, i) => `[w${i}]`).join("")}`,
	...whooshes.map((ms, i) => `[w${i}] adelay=${ms}:all=1 [s${i}]`),
	`[vo][m1][m2]${whooshes.map((_, i) => `[s${i}]`).join("")} amix=inputs=${3 + whooshes.length}:duration=longest:normalize=0, atrim=0:${f(end)} [out]`,
].join(";\n");

const script = `set -euo pipefail
TMP="$(mktemp -d)"; RAW="$TMP/raw.wav"; MIX="$TMP/mix.wav"
ffmpeg -y -hide_banner -loglevel error -i ${NARRATION} -i ${MUSIC} -i ${MUSIC} -i ${WHOOSH} \\
  -filter_complex "${graph}" -map "[out]" -ar 44100 -c:a pcm_f32le "$RAW"
I0="$(ffmpeg -hide_banner -nostats -i "$RAW" -af ebur128 -f null - 2>&1 | sed -n 's/^ *I: *\\(-\\{0,1\\}[0-9.]*\\) LUFS/\\1/p' | tail -1)"
LIMIT="$(awk -v i="$I0" 'BEGIN { g = -14 - i; printf "%.4f", 10 ^ ((-2.8 - g) / 20) }')"
ffmpeg -y -hide_banner -loglevel error -i "$RAW" -af "aresample=176400, alimiter=limit=$LIMIT:level=disabled:attack=1:release=60, aresample=44100" -c:a pcm_f32le "$MIX"
M="$(ffmpeg -hide_banner -nostats -i "$MIX" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')"
m() { printf '%s' "$M" | sed -n "s/.*\\"$1\\" : \\"\\(.*\\)\\".*/\\1/p"; }
P2="$(ffmpeg -y -hide_banner -nostats -i "$MIX" -af "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I=$(m input_i):measured_TP=$(m input_tp):measured_LRA=$(m input_lra):measured_thresh=$(m input_thresh):offset=$(m target_offset):print_format=json" -ar 44100 -c:a libmp3lame -q:a 2 "${out}" 2>&1)"
rm -rf "$TMP"
printf '%s' "$P2" | grep -q '"normalization_type" : "linear"' || { echo "loudnorm fell back to dynamic mode" >&2; exit 1; }
echo "unmastered I=$I0 LUFS, limiter=$LIMIT"
`;
execFileSync("bash", ["-c", script], { stdio: "inherit" });
console.log(
	`wrote ${out}: music out ${f(voiceStart)}s, back ${f(backAt)}s (from ${f(closeFrom)}s of the bed), whooshes at ${whooshes.map((m) => (m / 1000).toFixed(3)).join(", ")}`,
);
