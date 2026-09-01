#!/usr/bin/env bash
# gather-feed.sh — collect PR feed for post generation.
#
# Reads from the current repo (GH_TOKEN env) and emits a single JSON object on
# stdout with the shape the ai-inference prompt template expects:
#
#   {
#     "pr_number": 13,
#     "pr_title": "...",
#     "pr_body": "...",
#     "repo": "giacchetta/openclaw-a2a-bridge",
#     "repo_description": "...",
#     "merge_date": "2026-08-11",
#     "comments": [ { "author": "giacchetta", "created_at": "...", "body": "..." }, ... ]
#   }
#
# `comments` is the PR author's own comments only (chronological), fetched via
# the REST issues/comments endpoint rather than `gh pr view --json comments` —
# it paginates (a rolling multi-issue PR accumulates one comment per issue,
# per the pr-scope-protocol) and exposes `.user.login`/`.user.type` for
# filtering out bots and other commenters.
#
# No diff/commits/files/diffstat and no linked-issue fetch: per the
# pr-scope-protocol, the PR body carries a `## Scope` checklist naming every
# in-scope issue and each issue gets its own `## ✅ #<n> — <title>` comment
# from the author — that comment IS the narrative. (A checklist row like
# `- [ ] #24 — ...` also isn't a closing keyword, so the old
# closingIssuesReferences/`gh issue view` fetch would have missed it anyway.)
#
# Env: GH_TOKEN (auth), PR_NUMBER (required).
set -euo pipefail

: "${PR_NUMBER:?PR_NUMBER env is required}"

REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

# --- PR metadata -------------------------------------------------------------
PR_JSON="$(gh pr view "$PR_NUMBER" --json number,title,body,author,mergedAt)"

PR_TITLE="$(echo "$PR_JSON" | jq -r '.title')"
PR_BODY="$(echo "$PR_JSON" | jq -r '.body // ""')"
PR_AUTHOR="$(echo "$PR_JSON" | jq -r '.author.login // ""')"
MERGED_AT="$(echo "$PR_JSON" | jq -r '.mergedAt // ""')"

# Merge date in UTC YYYY-MM-DD (the post's filename date). For workflow_dispatch
# on an already-merged PR, mergedAt is present. Fall back to today if missing.
if [ -n "$MERGED_AT" ] && [ "$MERGED_AT" != "null" ]; then
  MERGE_DATE="$(date -u -d "$MERGED_AT" +%Y-%m-%d)"
else
  MERGE_DATE="$(date -u +%Y-%m-%d)"
fi

# --- Repo description --------------------------------------------------------
REPO_DESCRIPTION="$(gh repo view "$REPO" --json description -q '.description // ""')"

# --- PR author's own comments (paginated) ------------------------------------
# PR comments live on the issues endpoint in the REST API (a PR is an issue).
# --paginate emits one JSON array per page (a rolling multi-issue PR
# accumulates many per-issue comments); slurp+flatten with jq -s 'add', then
# filter to the PR author via --arg (never string-interpolated into the jq
# program) and drop everything else (bots, reviewers, other contributors).
COMMENTS_JSON="$(gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" --paginate \
  | jq -s --arg author "$PR_AUTHOR" '
      (add // [])
      | map(select(.user.login == $author))
      | map({author: .user.login, created_at: .created_at, body: .body})
    ')"

# --- Assemble ----------------------------------------------------------------
jq -n \
  --arg pr_number "$PR_NUMBER" \
  --arg pr_title "$PR_TITLE" \
  --arg pr_body "$PR_BODY" \
  --arg repo "$REPO" \
  --arg repo_description "$REPO_DESCRIPTION" \
  --arg merge_date "$MERGE_DATE" \
  --argjson comments "${COMMENTS_JSON:-[]}" \
  '{
    pr_number: ($pr_number | tonumber),
    pr_title: $pr_title,
    pr_body: $pr_body,
    repo: $repo,
    repo_description: $repo_description,
    merge_date: $merge_date,
    comments: $comments
  }'
