#!/usr/bin/env bash
# Tile consecutive frames around a moment to judge motion (transitions, entrances).
#
# Usage: strip.sh <target> <center_s> [span_s=1.2]
#
# <target> is an existing 30fps .mp4, or anything render_review.sh accepts; a non-mp4 target
# is rendered once at 30fps and cached per worktree_hash, so several strips cost one render.
# Env: STEP (keep every Nth frame, default 2), COLS (default 6), TILE_W (default 480).
# Writes $REVIEW_ROOT/strips/<target>_<center>.png and prints its path.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

target="${1:?usage: strip.sh <target> <center_s> [span_s]}"
center="${2:?usage: strip.sh <target> <center_s> [span_s]}"
span="${3:-1.2}"
step="${STEP:-2}"
cols="${COLS:-6}"
tile_w="${TILE_W:-480}"
tile_h=$((tile_w * 9 / 16))

if [[ "$target" == *.mp4 ]]; then
	mp4="$target"
	safe_name="$(basename "$target" .mp4)"
else
	safe_name="$(printf '%s' "$target" | tr -c 'A-Za-z0-9_.-' '_')"
	# Long ad-hoc reels get a short stable name.
	[ "${#safe_name}" -le 40 ] || safe_name="reel_$(printf '%s' "$target" | md5sum | cut -c1-8)"
	cache_dir="$REVIEW_ROOT/cache/${safe_name}_$(worktree_hash)"
	mp4="$(ls "$cache_dir"/*.mp4 2>/dev/null | head -1 || true)"
	if [ -z "$mp4" ]; then
		SHEET_FPS=1 "$TOOLS_DIR/render_review.sh" "$target" 30 "$cache_dir" >&2
		mp4="$(ls "$cache_dir"/*.mp4 | head -1)"
	fi
fi

start="$(awk -v c="$center" -v s="$span" 'BEGIN { t = c - s / 2; if (t < 0) t = 0; print t }')"
frames="$(awk -v s="$span" -v st="$step" 'BEGIN { printf "%d", (s * 30) / st }')"
rows=$(((frames + cols - 1) / cols))

mkdir -p "$REVIEW_ROOT/strips"
png="$REVIEW_ROOT/strips/${safe_name}_${center}.png"
ffmpeg -hide_banner -loglevel error -y -ss "$start" -t "$span" -i "$mp4" -vf \
	"select='not(mod(n\,$step))',scale=$tile_w:$tile_h,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='%{pts\:hms\:$start}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.65,tile=${cols}x${rows}" \
	-frames:v 1 "$png"
echo "$png"
