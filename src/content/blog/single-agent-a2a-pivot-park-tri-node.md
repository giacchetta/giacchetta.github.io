---
slug: "single-agent-a2a-pivot-park-tri-node"
title: "Single-agent A2A pivot — park the tri-node, preserve the work"
description: "Pivoted an OpenClaw A2A fleet to single-agent mode: main→main A2A calls, tri-node (planner→executor→reviewer) parked but preserved via JSON5 comments, local MCPs added, docs & live-tests included."
date: 2026-08-12
authors: ["giacchetta"]
tags: ["ai-agent","ai-a2a","ai-mcp"]
pr: "https://github.com/giacchetta/openclaw-a2a-bridge/pull/13"
---

Hook: We pivoted to a pragmatic architecture — single-agent A2A — while keeping the original tri-node design one uncomment away.

Lead: After end-to-end tests showed sub-agent → A2A is unreliable in OpenClaw, the team chose stability and observability over brittle enforcement. The result: main does cross-agent calls directly, tri-node is parked (preserved), MCP tooling added, and docs + tests updated.

🔁 **Why we pivoted**
- ⚠️ Sub-agent A2A break: tests showed a sub-agent cannot reliably drive another agent over A2A; the break is the sub-agent+cross-agent combination.
- 🔍 Practical trade: preserve the tri-node design, but avoid production fragility by routing A2A from main→main.
- ♻️ Preserve, not delete: tri-node config, prompts, and workspaces remain in-place as JSON5 comments and IDENTITY.tri-node.md (tag v0.1.0 = revival baseline).

🛠️ **What changed (concrete)**
- 🧭 Single-agent mode: both containers make main the working agent; when code is needed Researcher main curls Coder at http://coder:3000/a2a/tasks.
- 🗂️ JSON5 preservation: sub-agent entries commented in openclaw.json so revival is one uncomment away.
- 🧰 Local MCPs: added filesystem MCP for Coder and memory MCP for Researcher; tools surface as `bundle-mcp:<server>__<tool>`.
- 🧪 Orchestration + tests: index.js remained logic-identical (comments updated); tmux vm-bridge used for live runs and probes.

✅ **What we validated**
- 🔎 Spawn logs: live single-agent tasks showed spawn_count = 0 — no sub-agent spawn.
- ↔️ A2A round-trip: Researcher→Coder→Researcher worked in live tests (Coder logged payload, returned structured JSON, Researcher folded result.output).
- 🧰 MCP probe: openclaw mcp doctor files → files: ok; doctor memory → memory: ok; live tool calls returned expected results.
- ⚙️ Docs & artifacts: AGENTS.md + README updated, diffs and diffstat adjusted, IDENTITY.tri-node.md preserved, tag v0.1.0 recorded.

📌 **Edge cases, constraints & next steps**
- 🪪 Prompt hygiene: observed headless-output violations (narration prefixes, markdown fences) and a fallback self-write when Coder was down — these are prompt-enforcement issues to fix, not A2A plumbing failures.
- 🔁 Operational note: to pick up MCP config changes, restart the container (sudo podman restart) — do NOT use pm2 restart openclaw-gateway (it can orphan the gateway).
- 🛠️ Revival path: once OpenClaw fixes cross-agent delegation from sub-agents, simply uncomment JSON5 entries + swap IDENTITY.tri-node.md back to resume tri-node operation.
- 🚦 Next: tighten prompt enforcement, add CI smoke-tests for A2A round-trip, and monitor upstream OpenClaw fixes to evaluate revival.

Final: Practical pivots win — preserved the long-term design while shipping a robust, testable PoC for cross-agent work.
