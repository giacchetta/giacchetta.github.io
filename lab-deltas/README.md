# lab-deltas/

Raw, text-only weekly deltas collected from tracked PoC/Lab repositories.
This folder is a **staging ground** for the Lab Delta → LinkedIn Post pipeline.
It is NOT part of the Astro content collections (lives at repo root, outside
`src/content/`), so none of these files are rendered as site pages.

## Purpose

Every Saturday, a GitHub Action (`.github/workflows/lab-delta.yml`, planned)
collects the week's changes from every repo tagged with the `lab` GitHub topic
and consolidates them into a single `lab-deltas/<YYYY-MM-DD>.md` file here.
The user then turns that raw delta into a polished LinkedIn post in
`www_gianet_us/blog` (manually via the Gemini App for now; Copilot-in-Actions
automation is under investigation).

## File naming

- `lab-deltas/<YYYY-MM-DD>.md` — the consolidated delta for the week ending on
  that date (Saturday collection date). One file per week, covering ALL tracked
  repos. No emojis, structured text only (this is raw material, not a post).
- `lab-deltas/.manifest.json` — last-processed HEAD SHA per tracked repo, keyed
  by `nameWithOwner`. Drives incremental collection (only new commits since the
  last run are included).
- `lab-deltas/PIPELINE.md` — pipeline documentation (both stages, Saturday
  handoff, how to add a tracked repo).

## Repo discovery

Tracked repos are discovered dynamically via the `lab` GitHub topic:

```bash
gh repo list giacchetta --topic lab --json nameWithOwner,defaultBranchRef
```

**Topic management is owned by Terraform/OpenTofu (IaC).** This pipeline ONLY
reads the `lab` topic; it never sets it. To add a new PoC repo to the pipeline,
tag it `lab` in the IaC — the next Action run picks it up automatically (the
manifest handles the first-run full-history case).

## Currently tracked (as of 2026-08-01)

- `giacchetta/openclaw-a2a-bridge` — A2A network PoC (OpenClaw + Apicurio).

## Stage 2 (post generation) — deferred

Turning a raw delta into a polished LinkedIn post is a manual step for now
(Gemini App, included in Google Workspace). Automating it with Copilot
inference directly from a GitHub Action is under investigation (subscription /
per-inference billing question). See `PIPELINE.md` for the intended design.
