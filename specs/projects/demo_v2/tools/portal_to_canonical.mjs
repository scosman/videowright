// Convert an ElevenLabs portal Speech-to-Text JSON export
// ({segments:[{words:[{text,start_time,end_time}]}]}) to canonical timing ({words:[{word,start,end}]}).
import { readFileSync, writeFileSync } from "node:fs";
const [, , inPath, outPath] = process.argv;
const src = JSON.parse(readFileSync(inPath, "utf8"));
const words = src.segments
	.flatMap((s) => s.words)
	.filter((w) => w.text.trim() !== "")
	.map((w) => ({ word: w.text.trim(), start: w.start_time, end: w.end_time }));
writeFileSync(outPath, `${JSON.stringify({ words }, null, "\t")}\n`);
console.log(`${words.length} words, ${words[0].start}s - ${words.at(-1).end}s`);
