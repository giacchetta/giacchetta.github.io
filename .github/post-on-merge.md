# Post-on-merge pipeline

A reusable GitHub Actions workflow, hosted in this repo, that generates a
LinkedIn-style post from a merged PR in another ("lab"/PoC) repo and opens a
pull request against **this** repo adding it under `src/content/blog/<slug>.md`
— an Astro content collection, where the filename (or frontmatter `slug`) is
the post's public URL (`/blog/<slug>`). This repo's `static.yaml` workflow
rebuilds and deploys on push to `main`, so a merged post goes live
automatically.

**One merged PR == one post.** The PR's closing issues (parent + sub-issues)
are gathered as narrative feed alongside the PR title/body/commits/diffstat,
then `actions/ai-inference@v3` (Copilot CLI) writes the post from a calibrated
system prompt.

Originally built and run standalone inside `giacchetta/openclaw-a2a-bridge`;
extracted here (issue #85) so any lab repo can call it without copying scripts.

## Files

```
.github/
├── workflows/
│   └── post-on-merge.yml        # on: workflow_call (+ workflow_dispatch self-test)
├── scripts/
│   ├── gather-feed.sh           # gh + jq → feed.json (PR + linked issues + commits + diffstat)
│   ├── prepare-post.sh          # strips fences/CRLF; slug from a grepped frontmatter line, PR-title fallback
│   ├── sanitize-post.py         # backtick-wraps bare `<word>` tokens in the body (see Sanitization below)
│   └── push-post.sh             # clone target repo, write post_dir/, commit, push via PR (idempotent)
└── prompts/
    ├── linkedin-post.system.md  # voice + hard rules (calibrated against existing posts)
    └── linkedin-post.prompt.yml # user-message template ({{repo}}, {{pr_body}}, {{issues}}, …)
```

## Calling this workflow

A caller repo needs a thin trigger workflow — see
`giacchetta/openclaw-a2a-bridge`'s `.github/workflows/post-on-merge.yml` for
the live example:

```yaml
name: Post on Merge
on:
  pull_request: { types: [closed] }
  workflow_dispatch:
    inputs:
      pr_number: { description: "PR number to generate a post from", required: true, type: string }
permissions: { contents: read, pull-requests: read }
jobs:
  post:
    if: github.event_name == 'workflow_dispatch' || github.event.pull_request.merged == true
    uses: giacchetta/giacchetta.github.io/.github/workflows/post-on-merge.yml@main
    with:
      pr_number: ${{ github.event.pull_request.number || inputs.pr_number }}
    secrets:
      copilot_token: ${{ secrets.GC_COPILOT_TOKEN }}
      posts_pat:     ${{ secrets.GC_TOKEN }}
```

The caller owns the trigger and the `merged == true` gate; this workflow only
does the generation + cross-repo PR.

### Inputs

| Input | Required | Default | Purpose |
|---|---|---|---|
| `pr_number` | yes | — | PR number (in `source_repo`) to generate a post from |
| `source_repo` | no | caller's repo | owner/name the PR lives in |
| `target_repo` | no | `giacchetta/giacchetta.github.io` | owner/name posts are pushed to |
| `post_dir` | no | `src/content/blog` | target directory in `target_repo` |
| `model` | no | `auto` | model passed to `actions/ai-inference` |
| `pipeline_ref` | no | commit this workflow file is running from | override ref to fetch this repo's own scripts/prompts from (testing only) |

### Secrets

| Secret | Purpose | Scope |
|---|---|---|
| `copilot_token` | `COPILOT_GITHUB_TOKEN` for `actions/ai-inference` | a user PAT with a Copilot seat |
| `posts_pat` | cross-repo push to `target_repo` | `contents: write` + `pull-requests: write` on that repo (fine-grained) |

Both secrets live in the **caller** repo (e.g. `GC_COPILOT_TOKEN` / `GC_TOKEN`
on `openclaw-a2a-bridge`) and are passed through explicitly — this repo does
not need its own copies for callers to use it. The default `GITHUB_TOKEN` is
used only to read the source PR/issues via `gh` (scoped to `source_repo` via
the job's `GH_REPO` env).

## Why the workflow checks itself out

A reusable workflow executes against the **caller's** working tree — the
caller's checkout, if any, has none of `.github/scripts` or `.github/prompts`.
The first step (`Resolve pipeline ref` / `Check out post-on-merge kit`) checks
this repo out under `.postkit` at `github.job_workflow_sha` — the commit of
*this workflow file*, not the caller's `github.sha` — so the YAML and the
scripts/prompts it invokes are always the exact same commit and can never
drift out of sync. `pipeline_ref` is an escape hatch for testing a
scripts/prompts change from a branch before merging.

## Sanitization

`prepare-post.sh` routes the model's body through `sanitize-post.py` before
writing `cleaned_file`. It backtick-wraps any bare `<word>` or
`<word>__<word>` token left un-escaped in the body (leaving real HTML tags,
autolinks, and anything already in code/fences alone). This closes a
production incident where an un-escaped `bundle-mcp:<server>__<tool>` was
parsed as raw unclosed HTML, which silently corrupted this site's
`astro-llms-md` build step — `querySelector('main')` returned `null`, so the
post's `.md`/`llms.txt` extraction came back empty with no build error.

The sanitizer **fixes and warns** (`::warning::` per rewritten line) rather
than failing the job — it never blocks the PR; the CODEOWNER review on
`target_repo` remains the backstop. `linkedin-post.system.md` also carries a
hard rule telling the model to backtick these tokens itself; the script is the
guarantee, not the first line of defense. Its logic is covered by table-driven
self-tests run as a workflow step before AI inference:
`python3 .github/scripts/sanitize-post.py --self-test`.

## Output

- **`target_repo`**: `<post_dir>/<slug>.md` — always, via a short-lived
  `post/<slug>` branch + pull request (never a direct push to `target_repo`'s
  default branch). Merging that PR is what deploys it, via `target_repo`'s own
  build/deploy workflow.

## Idempotency

The post's frontmatter carries `pr: "https://github.com/<source_repo>/pull/<N>"`
— computed by `prepare-post.sh` from `SOURCE_REPO`/`PR_NUMBER`, never trusted
from the model (it doesn't reliably know `source_repo` vs `target_repo`; any
`pr:` line the model emits is stripped and replaced). It also doubles as the
"View source PR" link rendered next to the tags on the published post.

The filename (slug) is model-chosen, so it can differ between runs of the
same PR: on re-run, `push-post.sh` first looks for an existing post under
`post_dir` carrying a matching `pr:` (matching just the trailing PR number —
tolerant of the legacy bare-number `pr: <N>` shape written before this URL
change) and, if its filename differs, renames it into place (`git mv`) rather
than publishing a duplicate. It then overwrites that file if its `pr:`
matches (safe re-run), aborts if `pr:` differs (an unrelated post happens to
have the same slug), and no-ops if the content is unchanged.

## Model

`actions/ai-inference` with `model: auto` by default. Override per-caller via
the `model` input.
