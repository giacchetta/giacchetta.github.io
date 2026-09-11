# Post-on-merge pipeline

A reusable GitHub Actions workflow, hosted in this repo, that generates a
LinkedIn-style post from a merged PR in another ("lab"/PoC) repo and opens a
pull request against **this** repo adding it under `src/content/blog/<slug>.md`
— an Astro content collection, where the filename (or frontmatter `slug`) is
the post's public URL (`/blog/<slug>`). This repo's `static.yaml` workflow
rebuilds and deploys on push to `main`, so a merged post goes live
automatically.

**One merged PR == one post.** The PR title, body, and the PR author's own
comments are gathered as narrative feed, then `actions/ai-inference@v3`
(Copilot CLI) writes the post from a calibrated system prompt.

Originally built and run standalone inside `giacchetta/openclaw-a2a-bridge`;
extracted here (issue #85) so any lab repo can call it without copying scripts.

## Files

```
.github/
├── workflows/
│   └── post-on-merge.yml        # on: workflow_call (+ workflow_dispatch self-test)
├── scripts/
│   ├── gather-feed.sh           # gh + jq → feed.json (PR title/body + author's own comments)
│   ├── prepare-post.sh          # strips fences/CRLF; slug from a grepped frontmatter line, PR-title fallback
│   ├── sanitize-post.py         # backtick-wraps bare `<word>` tokens in the body (see Sanitization below)
│   ├── push-post.sh             # clone target repo, write post_dir/, commit, push via PR (idempotent)
│   ├── to-linkedin.py           # Markdown body → LinkedIn plain text + length lint (see LinkedIn export below)
│   └── comment-linkedin.sh      # posts/updates that text as a comment on the post PR (idempotent)
└── prompts/
    ├── linkedin-post.system.md  # voice + structure + hard rules — the single source of truth (calibrated against existing posts)
    └── linkedin-post.prompt.yml # feed wiring ({{repo}}, {{pr_number}}, {{merge_date}}, {{feed}}) + interpolates system.md as {{system_prompt}} into its own system message — see "Why the system prompt is interpolated, not passed via system-prompt-file" below
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
used only to read the source PR/comments via `gh` (scoped to `source_repo`
via the job's `GH_REPO` env).

## Upstream contract: the multi-issue PR scope protocol

Post quality depends on the source repo following the
[multi-issue PR scope protocol](https://github.com/giacchetta/lead-agentic-ai-coding/blob/main/protocols/pr-scope-protocol.md):
the PR body carries a `## Scope` checklist naming every issue in that diff
(plus a `## References` section), and each issue gets its own PR comment from
the PR author, `## ✅ #<issue> — <title>`, covering what landed, decisions
worth flagging for review, and verification evidence. `gather-feed.sh` reads
exactly that: the PR body plus the PR author's own comments (filtered by
`.user.login`, paginated — a rolling multi-issue PR accumulates one comment
per issue).

A PR with an empty body and no comments still generates a post — it'll just
be thin, since there's nothing to mine. `giacchetta/ansina#23` is the
before-and-after case that motivated dropping the diff from the feed: an
empty PR body meant the feed used to be commits + diffstat alone, and the
generated post read as a per-file changelog. `giacchetta/ansina#29` shows the
shape to aim for: a `## Scope` checklist plus one `## ✅ #<n> —` comment.

## Where things live

So the next prompt change lands in exactly one file:

- `linkedin-post.system.md` owns voice, structure, frontmatter shape, and all
  hard rules.
- `linkedin-post.prompt.yml` owns only feed wiring (the `{{feed}}` /
  `{{repo}}` / `{{pr_number}}` / `{{merge_date}}` template variables), a
  field reference for what's in the feed, and interpolating system.md's
  content into its own `role: system` message as `{{system_prompt}}` — it
  never restates a rule from system.md.
- This doc owns pipeline mechanics: inputs, secrets, the self-checkout, the
  sanitizer, output location, idempotency.

## Why the system prompt is interpolated, not passed via `system-prompt-file`

`actions/ai-inference@v3` has two incompatible code paths: when `prompt-file`
is a `.prompt.yml`, it parses that file's own `messages:` array and builds
the model request **from it alone** — the `system-prompt` / `system-prompt-file`
action inputs are only read on the *legacy* (plain-text `prompt-file`) path
and are silently ignored otherwise. There's no warning or error; the step
just succeeds having never read the file.

This workflow always uses `linkedin-post.prompt.yml`, so passing
`system-prompt-file: linkedin-post.system.md` to the `actions/ai-inference`
step — as it did originally — is a no-op: the model never sees it. That
regression shipped invisibly when `linkedin-post.system.md` was split out as
"the single source of truth" for rules — before that, `linkedin-post.prompt.yml`'s
own user message inlined the frontmatter/structure rules directly, so it
happened to work despite the ignored input; once those rules moved to
system.md, the model started receiving only a one-line stub ("follow the
rules in the system prompt") with no actual rules attached, and generated
posts lost their frontmatter fields (`slug`/`description`/`authors`/`tags`)
and structure (emoji section headings, bulleted narrative, hashtag line) —
see `giacchetta/ansina#29`'s generated post (target_repo PR #93) for the
before-and-after.

The fix: `linkedin-post.system.md` is read as a `file_input:` (`system_prompt:
.postkit/.github/prompts/linkedin-post.system.md` in the workflow step) and
interpolated as `{{system_prompt}}` into `linkedin-post.prompt.yml`'s own
`role: system` message — file_input *is* honored on the `.prompt.yml` path,
since it's consumed by this repo's own template substitution before the
action ever sees the rendered messages. `system-prompt-file` is no longer
passed to the action at all (kept as documentation-only context in a
comment, not as a real wiring path).

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

## LinkedIn export

LinkedIn's post composer accepts plain text only — no Markdown, no HTML — so
pasting the generated `.md` post in as-is leaves literal `**stars**` and
backticks on the page. `to-linkedin.py` converts the post's body (frontmatter
dropped; the `title` is deliberately **not** prepended, since the body's
first line is already designed as a standalone hook — see
`linkedin-post.system.md`'s Hook rule) into plain text with the same visual
trick every LinkedIn-formatter web tool uses: Markdown `**bold**` and
`` `code` `` map onto Unicode "Mathematical Alphanumeric Symbols" look-alike
glyphs (bold/monospace letterforms that are still plain text, not
formatting), and `- ` bullets map onto `•`/`◦`/`▪`. `comment-linkedin.sh`
then posts that text as a comment on the post PR `push-post.sh` just
opened, inside a ` ```text ` fence — GitHub renders a one-click copy button
on the fence, so reviewing the post PR and copying the LinkedIn text happen
in the same place. Re-running the pipeline for the same source PR **edits
that comment in place** (found by a leading `<!-- linkedin-text -->` marker)
rather than stacking a new one, matching `push-post.sh`'s own idempotency.

**Three fixes exist purely because LinkedIn's paste handler is stricter than
plain-text conversion alone accounts for** — found by pasting a real
converted post into LinkedIn and checking what actually survived:

- **The hook (first line) is bolded.** `linkedin-post.system.md` keeps the
  *source* hook plain — no bold, no emoji, so the model writes a standalone
  claim, not a formatted heading — but a bold opening line is what stops the
  scroll once it's actually on LinkedIn. This is a rendering choice made in
  `to-linkedin.py` (`_bold_hook`), not a prompt change.
- **Bullets are indented with NBSP, not a literal tab or spaces.** LinkedIn
  strips leading ASCII whitespace per line on paste, so a real tab/space
  indent silently vanishes — the same mechanism as the next point. NBSP
  survives.
- **An otherwise-empty separator line gets a single invisible NBSP.**
  LinkedIn's paste handler collapses two consecutive real line breaks with
  nothing between them into one, silently erasing the blank-line paragraph
  gap between the hook/lead/headings/bullets/closing/hashtags. A "blank"
  line that contains even an invisible character survives as its own
  paragraph — the standard fix every LinkedIn-formatter tool applies.

**The UTF-16 gotcha.** LinkedIn's own character counter — and its
3,000-character post limit — counts UTF-16 code units (`String.length` in
JavaScript), not Unicode codepoints. Every Mathematical-Alphanumeric glyph
used for bold/monospace is outside the Basic Multilingual Plane and costs
**two** UTF-16 units, not one. A post that measures under 3,000 characters as
plain Markdown can render well over that once its bold lead-ins and code
spans are converted — 3 of the 7 posts live at the time this was built
exceeded it once converted, despite `linkedin-post.system.md` already
carrying a "3,000 hard cap" rule; the rule existed, but the structural rules
above it (section/bullet counts) allowed more raw characters than the cap
could ever hold once rendered. Both were tightened together: the structure
rules now bound the body to a derivable ~2,000 characters of bullets, and the
Length section explains the doubling cost so the model budgets bold/code
spans deliberately rather than guessing. `to-linkedin.py` reports both counts
(codepoints and UTF-16) and treats the UTF-16 one as the binding number.

Bolding the hook adds meaningfully to that budget — a ~100-140 character hook
costs roughly double once fully bold, since every one of its characters
becomes an astral glyph — and the NBSP bullet indents/blank-line fillers add
a smaller, fixed amount per bullet/gap. Between the two, a post that
cleared 3,000 UTF-16 units before these fixes can cross it after; this
pipeline's own length lint (below) is what actually catches that, not manual
estimation.

**Warn, don't fail.** Like `sanitize-post.py`, `to-linkedin.py` never blocks
the run by default — an over-length conversion prints `::warning::` in the CI
log and in the PR comment's stats line; the CODEOWNER review on `target_repo`
is the backstop, same as every other soft check in this pipeline. A `--strict`
flag (exit 1 over the limit) exists for local/manual use only and is never
passed by the workflow.

**Known, accepted trade-off.** Unicode math-alphabet letters are not
accessible: some screen readers skip them, others spell them out
letter-by-letter, and LinkedIn's own search does not index text set in them
the same way it indexes plain text. This is the trade every plain-text
LinkedIn formatter (including the third-party tool this replaces) makes, and
it's accepted here knowingly — the hook, lead, and general prose stay plain
ASCII throughout; only bold lead-ins, section headings, and inline-code
identifiers are affected.

## Output

- **`target_repo`**: `<post_dir>/<slug>.md` — always, via a short-lived
  `post/<slug>` branch + pull request (never a direct push to `target_repo`'s
  default branch). Merging that PR is what deploys it, via `target_repo`'s own
  build/deploy workflow.
- **The post PR**: also carries a `<!-- linkedin-text -->` comment with the
  LinkedIn-ready plain text — see LinkedIn export above.

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
