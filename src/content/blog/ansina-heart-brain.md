---
pr: "https://github.com/giacchetta/ansina/pull/23"
slug: ansina-heart-brain
title: "Ansina: Heart & Brain — MLX heart runtime, autonomic tick loop, and OpenAI‑compatible brain"
description: "Introduces a runtime Heart protocol (MLX adapter), an autonomic tick loop for mission pacing, and a BrainProvider with an OpenAI-compatible adapter to make Ansina a resilient autonomous agent."
date: 2026-08-28
authors: [giacchetta]
tags: [ai-agent, ai-a2a, ai-mcp]
---

Small changes in surface, big moves under the hood: Ansina gets a Heart and a Brain.

Lead: Merged PR #23 wires together three pieces that make Ansina more autonomous and interoperable — a Heart runtime protocol (MLX), an autonomic tick loop for continuous decisioning, and a BrainProvider with an OpenAI-compatible adapter. This is about runtime contracts, graceful looping, and making the brain easier to swap and test.

❤️ **Heart: runtime protocol & MLX adapter**
- 🧭 Implemented a Heart runtime protocol (src/ansina/heart/runtime.py) to formalize how the agent's "heart" signals intentions and reacts to runtime events.
- 🔌 Added an MLX adapter (src/ansina/heart/adapters/mlx.py) so the Heart can speak an external ML execution layer — a practical runtime bridge for experiments and deployments.
- 🛠️ Exposed heartbeat endpoints and route integration (src/ansina/api/routes/heart.py) so orchestration layers can observe and drive the Heart.
- ✅ Tests added around models, runtime, and the MLX adapter (tests/unit/heart/* and tests/unit/heart/adapters/test_mlx.py) to keep the contract honest.

🧠 **BrainProvider: port + OpenAI-compatible adapter**
- 🔁 Ported a BrainProvider abstraction (src/ansina/brain/provider.py) to centralize model calls, retries, and selection logic.
- 🧩 Introduced an OpenAI-compatible adapter (src/ansina/brain/adapters/openai_compat.py) to make local or third-party LLMs plug into existing tooling and tests.
- 🧪 Rich test coverage for events, retry logic, and adapter behavior (tests/unit/brain/*) to validate fallbacks and deterministic selection strategies.
- 📦 Config surfaced in settings and examples (src/ansina/config/settings.py, ansina.example.toml) so switching brains is configuration, not code surgery.

⚙️ **Autonomy: autonomic tick loop & decision snapshots**
- ⏱️ Built an autonomic tick loop (src/ansina/heart/tick/loop.py) that drives periodic decision ticks and lifecycle transitions — the agent keeps itself honest over time.
- 🧠 Split decision logic, snapshots, and selection into focused modules (tick/decision.py, tick/snapshot.py) for easier reasoning and replay.
- 🔄 The loop integrates with Heart runtime events and BrainProvider calls to make pacing and retries explicit and testable (many unit tests added).
- 🪪 Snapshots and deterministic decisions make debugging and e2e validation (tests/e2e/test_server.py) reproducible.

📚 **DX, docs & reliability**
- 📝 Docs and blueprints updated (README.md, docs/architecture/blueprint.md, AGENTS.md) to document the runtime contract and configuration.
- 🧰 CI-friendly changes and a fuller pyproject + lock (pyproject.toml, uv.lock) — improved reproducibility.
- 🧩 API and error surface tightened (src/ansina/api/* and src/ansina/errors.py) so telemetry and retries are actionable.
- 🔍 Numerous unit tests added/extended across API, brain, heart, and logging to keep future refactors safe.

This merge moves Ansina from prototype toward a composable runtime: clear contracts for heartbeats, a pluggable brain interface, and an autonomic loop that keeps the agent moving even when things fail.

Onward — building agents with both heart and brain.
