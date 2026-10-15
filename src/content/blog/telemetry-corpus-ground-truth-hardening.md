---
pr: "https://github.com/giacchetta/ansina/pull/73"
slug: ansina-telemetry-corpus-ground-truth-hardening
title: "Ansina: Hardening Telemetry for Ground-Truth Decisions"
description: "Added deployment-level telemetry attribution, exact decision counters, and fault-injection tooling while keeping the hardware soak open until corpus evidence exists."
date: 2026-10-15
authors: [giacchetta]
tags: [ansina, ai-engineer, ai-agent]
---

Telemetry can now tell us which host produced each record—and how many decisions the daemon actually made.

We changed the corpus at the collection boundary, not by guessing from sample payloads. Host-keyed objects separate deployments, lifetime counters recover exact decision windows, and fault injection exercises the real Heart paths.

⚙️ **Attribute Every Record**

- **Prefix both streams** — Vector’s S3 sinks now add `host=<id>/` ahead of `kind` and `dt`. One key-layout change attributes telemetry samples and mirrored runlog records alike.
- **Sanitize host IDs** — `[telemetry] host_id` can set an operator-defined identity; otherwise Ansina uses the machine hostname. Unsafe characters become `-` before the ID reaches a bucket key.
- **Version the contract** — The key layout is a breaking change, so the corpus schema moved from v1 to v2. The v1 schema remains committed and untouched; the production upload was tracked separately.

📊 **Make Decisions Countable**

- **Track lifetime totals** — `TickLoop` now counts `idle`, `act`, and `escalate` decisions after each successful tick. These totals keep accumulating across `resume()`, just like `failures_total`.
- **Recover exact windows** — The sampler used to under-count ticks 2:1. Readers can now diff the counters from any two samples to get exact interval counts, even if a sample was missed or delayed.
- **Keep the exception valid** — A Python-2-style `except` caused a syntax error under Python 3. Fixing it exposed a Ruff formatter bug that rewrote the valid syntax, so `# fmt: skip` protects the line; the schema moved to v3.

🧪 **Test Real Faults, Not Text**

- **Drive real failure paths** — `FaultInjector` flips a registered readiness check, raises into the tick loop’s failure handler, or sleeps to trigger its real overrun check. It does not fabricate daemon snapshot text.
- **Make the schedule usable** — A committed example and soak scripts can deploy a schedule, collect the run, and score journal decisions against expected outcomes. Same-kind overlaps are rejected; different fault axes can overlap.
- **Keep the evidence gate open** — The example is validated, but no real Mac Mini M4 soak or ground-truth-labelled corpus entry exists yet. Long failure windows can trip the circuit breaker and cancel later windows.

Better telemetry is only as useful as the evidence behind it.

#AIEngineering #SoftwareEngineering #Telemetry #FaultInjection #MultiAgentSystems
