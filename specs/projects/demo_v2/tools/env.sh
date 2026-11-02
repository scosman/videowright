#!/usr/bin/env bash
# Environment for the demo_v2 review tools. Source it; it is idempotent.
#
# Sets REPO_ROOT, DEMO_DIR, VW_BIN, REVIEW_ROOT and defines `vw` (the CLI, run from the demo
# project). Works around two sandbox quirks:
#   - Playwright wants chromium and chromium-headless-shell revisions that /opt/pw-browsers may
#     not have: symlink the installed ones under the expected names in /tmp/pw-browsers. Source
#     this before ./checks.sh too, or the render integration tests skip themselves.
#   - The `videowright` bin may not be linked: run packages/lib/dist/cli/bin.js directly,
#     rebuilding the lib first when its sources are newer than the last build.

TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$TOOLS_DIR/../../../.." && pwd)"
DEMO_DIR="$REPO_ROOT/examples/videowright_demo"
VW_BIN="$REPO_ROOT/packages/lib/dist/cli/bin.js"
REVIEW_ROOT="${REVIEW_ROOT:-/tmp/review}"
export TOOLS_DIR REPO_ROOT DEMO_DIR VW_BIN REVIEW_ROOT

_vw_fix_playwright() {
	[ -d /opt/pw-browsers ] || return 0
	local json="$REPO_ROOT/node_modules/playwright-core/browsers.json"
	local name dir want have missing=0
	# Playwright launches the headless shell for renders; the full browser is what the
	# render integration tests probe (chromium.executablePath()) before they run.
	for name in chromium chromium-headless-shell; do
		dir="$(printf '%s' "$name" | tr '-' '_')"
		want="$(node -e 'const b=require(process.argv[1]).browsers.find((x)=>x.name===process.argv[2]);console.log(b.revision)' "$json" "$name")"
		if [ -d "/opt/pw-browsers/$dir-$want" ]; then
			mkdir -p /tmp/pw-browsers
			ln -sfn "/opt/pw-browsers/$dir-$want" "/tmp/pw-browsers/$dir-$want"
			continue
		fi
		have="$(ls -d "/opt/pw-browsers/$dir"-[0-9]* 2>/dev/null | sort -V | tail -1)"
		[ -n "$have" ] || { echo "env.sh: no $dir-* in /opt/pw-browsers" >&2; return 1; }
		mkdir -p /tmp/pw-browsers
		ln -sfn "$have" "/tmp/pw-browsers/$dir-$want"
		missing=1
	done
	if [ "$missing" = 1 ]; then
		export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers
	else
		export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
	fi
}

_vw_build_lib() {
	local stamp="$REPO_ROOT/packages/lib/dist/tsconfig.tsbuildinfo"
	if [ ! -f "$VW_BIN" ] || [ ! -f "$stamp" ] ||
		[ -n "$(find "$REPO_ROOT/packages/lib/src" -name '*.ts' -newer "$stamp" -print -quit)" ]; then
		echo "env.sh: building packages/lib" >&2
		(cd "$REPO_ROOT" && npm run build -w packages/lib >/dev/null) || return 1
	fi
}

vw() { (cd "$DEMO_DIR" && node "$VW_BIN" "$@"); }

# Hash of what a render depends on (the demo project and the lib source), including
# uncommitted and untracked files, for render caches.
worktree_hash() {
	local idx tree
	idx="$(mktemp)"
	tree="$(
		cd "$REPO_ROOT" &&
			GIT_INDEX_FILE="$idx" git read-tree HEAD &&
			GIT_INDEX_FILE="$idx" git add -A examples/videowright_demo packages/lib/src &&
			GIT_INDEX_FILE="$idx" git write-tree
	)"
	rm -f "$idx"
	(cd "$REPO_ROOT" && git rev-parse "$tree:examples/videowright_demo" "$tree:packages/lib/src") |
		md5sum | cut -c1-16
}

_vw_fix_playwright && _vw_build_lib
