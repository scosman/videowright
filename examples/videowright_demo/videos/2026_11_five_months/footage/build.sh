#!/usr/bin/env bash
# Builds the comparison clips in this folder. Run from examples/videowright_demo. Takes ~30 min
# (the planet renders slowly without a GPU). The source renders go to $OUT (not committed).
#
#   Then: a fresh render of demo_video (pinned to the frozen motion-engineering-legacy style).
#   Now:  v2_source.timeline.ts: demo_v2's title card, gallery (3D beat held longer) and
#         voiceover-sync segments, with demo_v2's track timing.
#
# Clips are VP9 WebM at exactly the rig window's size (1440x810, so the page never rescales
# them), 60fps, a keyframe every 10 frames (cheap exact seeks), no audio.
set -euo pipefail
OUT="${OUT:-/tmp/fm_footage}"
mkdir -p "$OUT"
HERE=videos/2026_11_five_months/footage
CLI=../../packages/lib/dist/cli/bin.js

[ -f "$OUT/demo_video.mp4" ] || node "$CLI" render demo_video --output "$OUT/demo_video.mp4"
[ -f "$OUT/v2_source.mp4" ] || node "$CLI" render "$HERE/v2_source.timeline.ts" --output "$OUT/v2_source.mp4"

cut() { # name source start duration
	ffmpeg -v error -y -ss "$3" -i "$OUT/$2" -t "$4" -an -vf "scale=1440:810:flags=lanczos" \
		-c:v libvpx-vp9 -b:v 0 -crf 26 -g 10 -keyint_min 10 -row-mt 1 -deadline good -cpu-used 3 \
		-pix_fmt yuv420p "$HERE/$1.webm"
	echo "$1.webm: $2 from ${3}s, ${4}s"
}

# Then (demo_video): each clip covers its pair's Then hold plus the 0.64s sweep.
cut then_title_card demo_video.mp4 9.35 4.20     # the title card's reveal, from the headline's first frames
cut then_3d demo_video.mp4 19.25 3.55            # the Three.js + Lottie panel
cut then_product_ui demo_video.mp4 23.20 4.30    # the Acme dashboard, its tab switching itself
cut then_narration_sync demo_video.mp4 46.50 3.95 # the script view, its line highlighted

# Now (v2_source): each clip starts at the sweep and covers the pair's Now hold.
cut now_title_card v2_source.mp4 0.00 5.60       # from demo_v2's hard cut: the bloom, the strokes
cut now_3d v2_source.mp4 12.10 6.70              # the planet and the Lottie card (launch ~16.4s)
cut now_product_ui v2_source.mp4 20.20 6.30      # the cursor opens Customers, the note, the toast
cut now_narration_sync v2_source.mp4 30.10 4.40  # line 2 lit word by word on its real times, then the edit begins
