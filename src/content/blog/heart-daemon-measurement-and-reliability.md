---
pr: "https://github.com/giacchetta/ansina/pull/57"
slug: heart-daemon-measurement-and-reliability
title: "Ansina: Making Heartbeat Measurable on Real Hardware"
description: "A measured Heart daemon now evaluates decisions, snapshots live state, trips a circuit breaker, journals each tick, and runs repeatable MLX hardware checks."
date: 2026-10-02
authors: [giacchetta]
tags: [ai-engineer, ai-agent]
---

We turned Heart from a prompt loop into a measurable, self-observing daemon—and proved it on an M4.

The work connects model evaluation to live daemon state, fault handling, and a readable record of every tick. The multi-hour soak is still running, so its stability and escalation conclusions remain open.

⚡ **Measure the Decision**

- **Real model, real gate** — A 24-case harness grew to 36 fixtures, including live-state faults. Gemma 4 2B reached 95.8% on the original set and 97.22% after the fixes.
- **Zero was the signal** — Initial runs hit 0% accuracy. Before reports showed the missing chat template and enabled reasoning; adding the template and disabling reasoning made the validated setup work.
- **Failure, then diagnosis** — The expanded gate first fell to 80.6%, with weak self-state recall. We fixed severity guidance and removed duplicate database reporting; the rerun passed twice, with 91.67% self-state recall.

⚙️ **Give the Daemon Guardrails**

- **Snapshot live state** — `DaemonStateSource` supplies five priority-banded items: uptime, readiness, database health, the last decision and duration, and failure counters. Live faults survive prompt-budget trimming.
- **Pause on repeated trouble** — Consecutive failures and overruns trip an automatic pause at the configured limit. `GET /heart/tick` exposes `paused_reason`; manual resume clears consecutive counters, not the lifetime total.
- **Leave a trustworthy trace** — Each completed tick writes a journal row, and the next snapshot can include recent entries. Notes are generated from triggering state—not copied from model output—and three real M4 rows matched daemon logs.

🧪 **Verify the Whole Path**

- **Keep hardware runs repeatable** — `make remote-heart` syncs the branch and runs the MLX bench on the Mac Mini. A real no-ref-movement bug left stale local edits behind; a hard reset fixed it, then dirty-tree and rerun checks passed.
- **Fix what the bench missed** — Real tick execution exposed MLX GPU-stream thread affinity: load and generation ran on different threads. A dedicated worker now handles backend operations; `make check` passed with 1290 tests and 100% unit coverage.
- **Keep the soak honest** — An eight-hour run is in progress, sampling RSS and tick state every 60 seconds. Escalation and Brain-wiring findings remain placeholders until results arrive; reports stay gitignored pending the planned S3-compatible upload.

A passing gate is evidence. A finished soak is still the next proof. 🔬

#AIEngineering #AutonomousAgents #MLX #Heartbeat #Observability
