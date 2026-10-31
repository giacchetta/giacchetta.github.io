---
pr: "https://github.com/giacchetta/ansina/pull/80"
slug: bounded-opencode-execution-heart
title: "OpenCode as a Bounded Executor"
description: "Adds a confined OpenCode executor, run API and telemetry, deterministic Heart interventions, and real-data evaluations that reject two model-led policy experiments."
date: 2026-10-31
authors: [giacchetta]
tags: [ai-engineer, ai-agent, ai-orcherstrator]
---

Ansina now runs OpenCode as a confined executor—and keeps the Heart’s actions deterministic.

A one-shot CLI runner, run-submission API, and lifecycle telemetry turn OpenCode into a supervised part of the daemon. The real-data experiments tested whether models should curate context or replace intervention policy. Both failed their adoption gates.

⚙️ **Confined OpenCode Execution**

- **One-shot runs.** `OpencodeCliRunner` launches `opencode run --format json` in the workspace, streams events to a callback, and bounds concurrency, backlog, output, and runtime.
- **Layered confinement.** OpenCode config sources merge, so inherited permission settings can survive. Preflight checks effective permissions with `opencode debug config`; `cwd=` scopes execution and project-config resolution.
- **A real CLI failure.** Every real run hit an invalid `--dir` flag before model admission. Removing it fixed the runner; the E2E fake now rejects flags outside the real v2 CLI allow-list.

🔄 **Lifecycle the Heart Can See**

- **Two records, two jobs.** `/opencode/runs` owns mutable status; `kind=opencode` JSONL preserves the append-only lifecycle trace. Submission telemetry is written before the API returns.
- **Observe, then intervene.** Heart reads three bounded state snapshots through a structural Protocol. Its deterministic ladder retries, nudges, pauses intake, or escalates under cooldown and hourly limits.
- **No guessed compact flag.** OpenCode v2.1.4 exposes compaction through its HTTP API, not the one-shot CLI. The action returns `unsupported` until a server-based runner can reach that endpoint.

🧪 **Real Data, Rejected Experiments**

- **Curation lost to recency.** Across four real sessions, the model recalled 0% of must-keep turns; the recency baseline kept all four and identified the failure cause 4/4. The curator was rejected and left out of runtime.
- **Valid JSON wasn’t enough.** Extraction was schema-valid on all 11 fixtures, but chose less-conservative intervention actions in 2/4 cases—including retry after recognizing exhausted budget. The deterministic policy stays.
- **Regression guard, not a victory lap.** The fake-binary E2E test covers submission through `succeeded`; 1,904 unit tests passed at 100% coverage. The real-binary smoke run remains outstanding.

Deterministic policy stays in charge. 🛡️

#AIEngineering #SoftwareEngineering #OpenCode #MultiAgentSystems
