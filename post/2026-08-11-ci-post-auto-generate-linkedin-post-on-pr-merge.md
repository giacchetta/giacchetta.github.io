---
slug: auto-generate-linkedin-posts-on-pr-merge
title: Automating LinkedIn Posts from Merged PRs
date: 2026-08-11
authors: [giacchetta]
tags: [automation, ci-cd, copilot]
pr: 14
---

🤖 **Automating the narrative**

Every merged PR is a discrete engineering story. Until now, turning that PR into a LinkedIn post was manual—gather context, open Gemini, synthesize, publish. PR #14 replaces that friction with a per-merge pipeline: on every close-to-`main`, the PR title, body, closing issues, commits, and diffstat feed into `actions/ai-inference@v1` (Copilot CLI, `claude-haiku-4.5`) with a calibrated system prompt. A finished post lands in the personal site's `post/` collection in ~30 seconds.

🔗 **The plumbing**

Seven new files under `.github/` orchestrate the flow: trigger + feed-gathering (`gh` + `jq`) + AI inference + validation (frontmatter, body, idempotency via `pr: <number>`) + cross-repo push to `giacchetta.github.io`. The personal repo's `static.yaml` workflow rebuilds and deploys on push to `main`—no additional CI needed.

🎯 **Decision: keep it local, reuse it later**

Phase 1 lives in this repo. Phase 2 extracts the workflow to `giacchetta/.github` so every lab-topic PoC repo gets the pipeline via `uses:`. One merged PR, one automation loop, deployed.

One engineering story, zero manual steps.
