#!/usr/bin/env bash
# Extract full-resolution PNG stills from a render at the given times (seconds).
#
# Usage: stills.sh <mp4> <out-dir> <t1> [t2 …]
# Writes <out-dir>/still_<t>.png for each time and prints the paths.
set -euo pipefail

mp4="${1:?usage: stills.sh <mp4> <out-dir> <t1> [t2 …]}"
out="${2:?usage: stills.sh <mp4> <out-dir> <t1> [t2 …]}"
shift 2
[ "$#" -gt 0 ] || { echo "stills.sh: give at least one time" >&2; exit 1; }
mkdir -p "$out"

for t in "$@"; do
	png="$out/still_${t}.png"
	ffmpeg -hide_banner -loglevel error -y -ss "$t" -i "$mp4" -frames:v 1 "$png"
	echo "$png"
done
