#!/usr/bin/env bash
#
# Run all project checks (lint, typecheck, test) in parallel.
# Exits non-zero if any check fails, printing only the failing output.
#
# Usage:
#   ./checks.sh              # run all checks
#   ./checks.sh --no-test    # skip tests (lint + typecheck only)
#
# Pre-commit hook install (run once per clone):
#   ln -sf ../../checks.sh .git/hooks/pre-commit

set -euo pipefail
set +m  # disable job-control messages ("[1]+ Done" etc.)

skip_test=false
for arg in "$@"; do
  case "$arg" in
    --no-test) skip_test=true ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: ./checks.sh [--no-test]"
      exit 1
      ;;
  esac
done

tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/checks.XXXXXX")
trap 'rm -rf "$tmpdir"' EXIT

run_check() {
  local name="$1"
  shift
  if "$@" > "$tmpdir/$name.out" 2>&1; then
    echo "pass" > "$tmpdir/$name.status"
  else
    echo "fail" > "$tmpdir/$name.status"
  fi
}

run_check lint npm run lint &
run_check typecheck npm run typecheck &

if [ "$skip_test" = false ]; then
  run_check test npm test &
fi

wait

failed=()
passed=()

for check in lint typecheck; do
  if [ "$(cat "$tmpdir/$check.status")" = "fail" ]; then
    failed+=("$check")
  else
    passed+=("$check")
  fi
done

if [ "$skip_test" = false ]; then
  if [ "$(cat "$tmpdir/test.status")" = "fail" ]; then
    failed+=("test")
  else
    passed+=("test")
  fi
fi

if [ "${#failed[@]}" -eq 0 ]; then
  echo "All checks passed: ${passed[*]}"
  exit 0
fi

echo "Checks failed: ${failed[*]}"
echo ""

for check in "${failed[@]}"; do
  echo "=== $check output ==="
  if [ "$check" = "test" ]; then
    # For test failures, extract the vitest "Failed Tests" summary and the
    # final status block. This filters out pages of vite/esbuild teardown
    # stack traces that bury the actual failure messages.
    # Look for the "Failed Tests" header (vitest uses ⎯ U+23AF as separator)
    # and print from there to end of file.
    summary=$(sed -n '/Failed Tests/,$p' "$tmpdir/$check.out")
    if [ -n "$summary" ]; then
      # Save full log so users can deep-dive if needed
      cp "$tmpdir/$check.out" test-failure.log 2>/dev/null || true
      echo "$summary"
      echo ""
      echo "(full test output saved to test-failure.log)"
    else
      # No "Failed Tests" section found — show everything
      cat "$tmpdir/$check.out"
    fi
  else
    cat "$tmpdir/$check.out"
  fi
  echo ""
done

exit 1
