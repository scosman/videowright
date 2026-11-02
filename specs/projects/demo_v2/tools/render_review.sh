#!/usr/bin/env bash
# Render a video at low fps and write contact sheets for layout review.
#
# Usage: render_review.sh <target> [fps=4] [out=$REVIEW_ROOT/<name>]
#
# <target> is one of:
#   <slug>                  a video under examples/videowright_demo/videos/ (rendered with its
#                           default audio track, so VO timing drives the advances)
#   samples:<style>         that style's sample segments back to back, hard cuts between them
#   segments:<id>[@<tr>],…  an ad-hoc reel; "@<tr>" sets the transition into that segment
#
# samples: and segments: reels go through a throwaway timeline in videos/_review_<name>/
# (removed on exit). It imports styles/$STYLE/tokens.css; STYLE defaults to the sample style,
# else motion-engineering.
#
# Env: SHEET_FPS (tiles per second of video, default 2), TILE (default 4x4).
#
# Run one render at a time and don't edit files under examples/videowright_demo while it
# runs: renders share Vite's dependency cache, and the render server full-reloads the page on
# file changes, either of which silently changes frames.
#
# Writes <out>/<name>.mp4 and <out>/sheet_NN.png, then prints the duration.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

target="${1:?usage: render_review.sh <target> [fps] [out]}"
fps="${2:-4}"
sheet_fps="${SHEET_FPS:-2}"
tile="${TILE:-4x4}"

scene_order=(title section kinetic bullet stat feature grid ui-showcase content cta)

throwaway=""
cleanup() { if [ -n "$throwaway" ]; then rm -rf "$throwaway"; fi; }
trap cleanup EXIT

# Writes a throwaway timeline for the given "id[@transition]" entries; sets $slug.
write_reel() {
	local name="$1" style="$2"
	shift 2
	slug="_review_$name"
	throwaway="$DEMO_DIR/videos/$slug"
	rm -rf "$throwaway"
	mkdir -p "$throwaway"
	{
		echo "import \"../../styles/$style/tokens.css\";"
		echo 'import type { Timeline } from "videowright";'
		echo ""
		echo "const timeline: Timeline = {"
		echo "	meta: { title: \"Review: $name\", style: \"$style\" },"
		echo "	segments: ["
		local entry id tr
		for entry in "$@"; do
			id="${entry%%@*}"
			tr=""
			[[ "$entry" == *@* ]] && tr="${entry#*@}"
			if [ -n "$tr" ]; then
				echo "		{ id: \"$id\", transition: \"$tr\" },"
			else
				echo "		{ id: \"$id\", transition: \"cut\" },"
			fi
		done
		echo "	],"
		echo "};"
		echo "export default timeline;"
	} >"$throwaway/timeline.ts"
}

case "$target" in
samples:*)
	style="${target#samples:}"
	entries=()
	for scene in "${scene_order[@]}"; do
		[ -f "$DEMO_DIR/segments/$style-sample-$scene/index.ts" ] && entries+=("$style-sample-$scene")
	done
	[ "${#entries[@]}" -gt 0 ] || { echo "no sample segments for style $style" >&2; exit 1; }
	name="samples_$style"
	write_reel "$name" "${STYLE:-$style}" "${entries[@]}"
	;;
segments:*)
	IFS=, read -r -a entries <<<"${target#segments:}"
	name="reel_$(printf '%s' "${target#segments:}" | md5sum | cut -c1-8)"
	write_reel "$name" "${STYLE:-motion-engineering}" "${entries[@]}"
	;;
*)
	slug="$target"
	name="$target"
	[ -f "$DEMO_DIR/videos/$slug/timeline.ts" ] || { echo "no video $slug" >&2; exit 1; }
	;;
esac

out="${3:-$REVIEW_ROOT/$name}"
mkdir -p "$out"
mp4="$out/$name.mp4"
partial="$out/.$name.partial.mp4"
rm -f "$out"/sheet_*.png "$partial"

# Render to a hidden temp file and move it into place only on success, so an interrupted
# render never leaves a truncated mp4 where strip.sh's cache would pick it up.
vw render "$slug" --fps "$fps" --output "$partial"
mv "$partial" "$mp4"

ffmpeg -hide_banner -loglevel error -y -i "$mp4" -vf \
	"fps=$sheet_fps,scale=640:360,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='%{pts\:hms}':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.65,tile=$tile" \
	"$out/sheet_%02d.png"

duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$mp4")"
echo "video:    $mp4"
echo "sheets:   $(ls "$out"/sheet_*.png | wc -l) in $out"
echo "duration: ${duration}s"
