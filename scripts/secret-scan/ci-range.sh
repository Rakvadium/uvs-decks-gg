#!/usr/bin/env bash
# Prints the commit range(s) the CI secret-scan job must scan, one per line.
# Fails (exit 1) instead of guessing when the range can't be determined.
#
# Env: EVENT (pull_request | push | schedule), DEFAULT_BRANCH, and per event:
#   pull_request: BASE_SHA, HEAD_SHA
#   push:         BEFORE, AFTER
#   schedule:     WINDOW (git date, default "3 days ago"), SCHEDULE_BRANCHES (default "dev master")
set -euo pipefail

ZERO=0000000000000000000000000000000000000000

fail() {
  echo "::error title=secret-scan::could not determine the commit range: $1. Run bun run secret-scan --strict --diff <base>..<head> locally." >&2
  exit 1
}

has_commit() { git cat-file -e "$1^{commit}" 2>/dev/null; }

case "${EVENT:-}" in
  pull_request)
    [ -n "${BASE_SHA:-}" ] && [ -n "${HEAD_SHA:-}" ] || fail "BASE_SHA and HEAD_SHA are required"
    echo "$BASE_SHA..$HEAD_SHA"
    ;;

  push)
    [ -n "${AFTER:-}" ] || fail "AFTER is required"
    has_commit "$AFTER" || fail "pushed commit $AFTER is not available"
    if [ "${BEFORE:-$ZERO}" = "$ZERO" ]; then
      # New branch: everything not already on the default branch. A branch created at a commit
      # that is already on the default branch was scanned when it got there.
      base=$(git merge-base "$AFTER" "origin/$DEFAULT_BRANCH") || fail "no merge-base with origin/$DEFAULT_BRANCH"
      if [ "$base" = "$AFTER" ]; then echo "$AFTER^!"; else echo "$base..$AFTER"; fi
    else
      # After a force-push, the old tip is no longer on any branch, so actions/checkout doesn't
      # have it. GitHub still serves it by SHA until it is garbage-collected.
      has_commit "$BEFORE" || git fetch --no-tags --quiet origin "$BEFORE" >&2 || true
      has_commit "$BEFORE" || fail "the previous tip $BEFORE can't be fetched"
      # merge-base(before, after)..after is a superset of before..after: it also covers older
      # commits a force-push rewrote.
      base=$(git merge-base "$BEFORE" "$AFTER") || fail "$BEFORE and $AFTER share no history"
      echo "$base..$AFTER"
    fi
    ;;

  schedule)
    # Every commit that landed on each branch inside the window: commits reachable from the tip
    # but not from the newest first-parent commit older than the window. Old history (including
    # known historical leaks) is reachable from that base, so it never makes this run red.
    window=${WINDOW:-3 days ago}
    for branch in ${SCHEDULE_BRANCHES:-dev master}; do
      ref="origin/$branch"
      has_commit "$ref" || fail "$ref is not available"
      base=$(git rev-list -1 --first-parent --before="$window" "$ref")
      [ -n "$base" ] || fail "$ref has no commit older than $window"
      echo "$base..$ref"
    done
    ;;

  *)
    fail "unsupported event '${EVENT:-}'"
    ;;
esac
