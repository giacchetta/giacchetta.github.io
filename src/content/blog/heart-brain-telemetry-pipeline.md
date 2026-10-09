---
pr: "https://github.com/giacchetta/ansina/pull/66"
slug: ansina-heart-brain-telemetry-pipeline
title: "Ansina: Wiring Heart Escalations to the Brain"
description: "Wired Heart escalation to Brain streaming, added bounded telemetry and a supervised Vector shipper, and published a versioned corpus contract while keeping triage experimental."
date: 2026-10-09
authors: [giacchetta]
tags: [ai-engineer, ai-agent]
---

Heart escalations to the Brain—and made telemetry, shipping, and evidence part of the same operating path.

The 8-hour soak supported the decision to wire `escalate` to `BrainProvider.stream()`, but it exercised only idle ticks. Alongside that first Brain call, we built a bounded telemetry pipeline and a supervised Vector sidecar, then defined the corpus contract for what they produce. Request triage is still an experiment, not a production route.

⚡ **A journaled Brain call**

- **Append-only outcomes** — `CompositeDecisionHandler` sequences the journal and Brain handlers; only `escalate` calls `stream()`. A second row records status and token counts without rewriting the tick.
- **Opt-in wiring** — `escalate_to_brain=false` preserves the exact journal-only handler. Missing Brain records `declined`; provider failure is journaled without pausing ticks, while caller cancellation still propagates.
- **Evidence boundary** — The 8.01-hour soak covered 960 idle ticks and found zero false escalations. That justified wiring without cooldown; a real injected escalation to a configured Brain is still pending on M4.

⚙️ **Telemetry with operational guardrails**

- **Bounded telemetry** — A restart-safe writer rotates and prunes sample and log spools independently. Samples include breaker counters; disabled telemetry creates no directory, attaches no handler, and starts no loop.
- **Redaction stays shared** — The log mirror uses the primary JSON formatter, avoiding a second redaction path. Strict checks maintained 100% coverage, with unit and end-to-end suites passing.
- **Supervised shipper** — Vector gets an allow-listed environment and bounded retry; preflight gates launch. Real R2 verification exposed a checksum incompatibility and SIGTERM orphaning, driving the 0.45.x pin and signal-replay cleanup. SIGKILL can still orphan the child.

🔬 **A producer contract, not a consumer**

- **Fail-safe uploads** — S3 stays off by default; upload failure is logged at bench time, not raised at startup. A live R2 migration uploaded 27 artifacts, then skipped all 27 on repeat.
- **Defined corpus** — Schema v1 covers bench, soak, telemetry, and log artifacts. Host attribution remains a documented gap; publishing the schema to the live bucket is dry-run verified, not yet performed.
- **Triage stays gated** — 36 synthetic fixtures and explicit misroute and latency gates exercise a port wired into no route. There is no real request traffic yet; the Mac Mini bench and verdict remain pending.

Next: prove the Brain call with a real escalation. 💥

#AIEngineering #SoftwareEngineering #Telemetry #CloudflareR2
