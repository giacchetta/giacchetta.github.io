---
slug: single-agent-a2a-pivot-park-tri-node
title: "Single-agent A2A pivot: park tri-node, direct main→main A2A"
description: "Pivoted PoC to single-agent per container: preserve the tri-node artifacts, implement direct main→main A2A, and add local MCP servers with live tests."
date: 2026-08-12
authors:
  - giacchetta
tags:
  - a2a
  - agents
  - openclaw
pr: 13
---

🚀 **Bold pivot — what changed**  
Switched the fleet to single-agent mode: each container’s root agent (main) is now the working agent and performs direct A2A calls (main → main) to other containers. The planner→executor→reviewer tri-node is parked, not deleted — commented in-place (JSON5), preserved as IDENTITY.tri-node.md and tagged v0.1.0 for instant revival.

🔧 **Engineering details & validation**  
Index.js logic untouched (comments-only). openclaw.json updated by commenting sub-agents; MCP servers added per-agent (filesystem for Coder, memory for Researcher). Live tests (2026-08-11) show: Researcher curl→Coder round-trip, Coder produced structured code, Researcher folded result.output. MCP probes passed (files: ok, memory: ok). Docs (AGENTS.md, README) updated and note operational caveats (restart container to pick up MCP config; avoid pm2 restart gateway).

🧭 **Lessons & next steps**  
Root cause: sub-agent + A2A from within OpenClaw is unreliable. Workaround: move A2A to main while preserving tri-node artifacts for a future OpenClaw fix. Next: harden prompt enforcement (headless output hygiene), and monitor upstream fixes so we can safely re-enable the tri-node flow.

One-line close: pivoted to reliable cross-agent calls while keeping the original design one uncomment away.
