#!/usr/bin/env bash
# Prints the commit range(s) the CI secret-scan job must scan, one per line.
# Fails (exit 1) instead of guessing when a range can't be determined.
#
# Env: EVENT (pull_request | push | schedule | workflow_dispatch), DEFAULT_BRANCH, and per event:
#   pull_request:               BASE_SHA, HEAD_SHA
#   push:                       BEFORE, AFTER
#   schedule/workflow_dispatch: REPO (owner/name), GH_TOKEN, WINDOW (GNU date, default
#                               "3 days ago"), SCHEDULE_BRANCHES (default "dev master")
set -euo pipefail
shopt -s inherit_errexit

ZERO=0000000000000000000000000000000000000000

fail() {
  echo "::error title=secret-scan::could not determine the commit range: $1. Run bun run secret-scan --strict --diff <base>..<head> locally." >&2
  exit 1
}

has_commit() { git cat-file -e "$1^{commit}" 2>/dev/null; }

# Commits that are no longer on any branch (force-pushed over) aren't in an actions/checkout
# clone. GitHub still serves them by SHA until they are garbage-collected.
ensure_commit() {
  has_commit "$1" || git fetch --no-tags --quiet origin "$1" >&2 || true
  has_commit "$1"
}

# The range for one ref update from $1 (before) to $2 (after). merge-base(before, after)..after
# is a superset of before..after: it also covers older commits a force-push rewrote.
update_range() {
  local before=$1 after=$2 base
  ensure_commit "$after" || fail "pushed commit $after can't be fetched"
  if [ "$before" = "$ZERO" ]; then
    # New branch: everything not already on the default branch. A branch created at a commit
    # that is already on the default branch was scanned when it got there.
    if [ -z "${DEFAULT_BRANCH:-}" ]; then
      # Scheduled runs' event payload has no repository; ask the API.
      DEFAULT_BRANCH=$(gh api "repos/${REPO:?}" --jq .default_branch) || fail "can't read the default branch"
    fi
    base=$(git merge-base "$after" "origin/$DEFAULT_BRANCH") || fail "no merge-base with origin/$DEFAULT_BRANCH"
    if [ "$base" = "$after" ]; then echo "$after^!"; else echo "$base..$after"; fi
  else
    ensure_commit "$before" || fail "the previous tip $before can't be fetched"
    base=$(git merge-base "$before" "$after") || fail "$before and $after share no history"
    echo "$base..$after"
  fi
}

# Every ref update (push, force-push, PR merge, branch creation) GitHub recorded for each branch
# inside the window, by push time. Commit dates play no part, so a backdated or fast-forwarded
# old commit is still in the window of the day it was pushed. [skip ci] doesn't affect this.
recent_pushes() {
  [ -n "${REPO:-}" ] || fail "REPO is required"
  local cutoff branch events timestamp type before after
  cutoff=$(date -u -d "${WINDOW:-3 days ago}" +%Y-%m-%dT%H:%M:%SZ) || fail "invalid WINDOW"
  for branch in ${SCHEDULE_BRANCHES:-dev master}; do
    events=$(gh api --paginate \
      "repos/$REPO/activity?ref=refs/heads/$branch&time_period=month&per_page=100" \
      --jq '.[] | [.timestamp, .activity_type, .before, .after] | @tsv') \
      || fail "the repository activity API call for $branch failed"
    while IFS=$'\t' read -r timestamp type before after; do
      [ -n "$timestamp" ] || continue
      if ! [[ "$timestamp" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:]{8}Z$ && "$before" =~ ^[0-9a-f]{40}$ && "$after" =~ ^[0-9a-f]{40}$ ]]; then
        fail "unexpected activity entry for $branch ($type)"
      fi
      if [[ "$timestamp" < "$cutoff" ]]; then continue; fi
      if [ "$after" = "$ZERO" ]; then continue; fi # branch deletion: nothing new
      update_range "$before" "$after"
    done <<< "$events"
  done
}

case "${EVENT:-}" in
  pull_request)
    [ -n "${BASE_SHA:-}" ] && [ -n "${HEAD_SHA:-}" ] || fail "BASE_SHA and HEAD_SHA are required"
    echo "$BASE_SHA..$HEAD_SHA"
    ;;
  push)
    [ -n "${AFTER:-}" ] || fail "AFTER is required"
    update_range "${BEFORE:-$ZERO}" "$AFTER"
    ;;
  schedule | workflow_dispatch)
    ranges=$(recent_pushes)
    if [ -n "$ranges" ]; then sort -u <<< "$ranges"; fi
    ;;
  *)
    fail "unsupported event '${EVENT:-}'"
    ;;
esac
