---
slug: ansina-rock-solid-skeleton
title: "Ansina Rock‑Solid Skeleton: packaging, config, logging, REST API, auth, persistence, CI, docs"
description: "M0 skeleton for Ansina: REST API, auth, persistence, CI, tests and docs—foundational infra and CI gates with zero model code; CI green on unit + E2E."
date: 2026-08-21
authors: [giacchetta]
tags: [ai-agent, ai-mcp, ai-engineer]
pr: 21
---

Laid the foundation: core infra, API, auth, persistence, CI, tests and docs — a production-minded M0 skeleton for Ansina.

Lead
A focused engineering sweep to make Ansina reviewable and operable without any model code. The PR delivers a full infra baseline (packaging, config, logging already merged via #19), then adds REST endpoints, auth, persistence primitives, CI gates, testing conventions and docs scaffolding. All checks (unit + e2e, both OS legs) are green; branch is still a draft pending final author flip to "ready for review."

🚧 **What this PR adds**
- 🧩 REST: 🛣️ API skeleton and middleware (src/ansina/api/app.py, routes/health.py, middleware.py, exception_handlers.py) to standardize request/response flows.  
- 🔐 Auth: 🪪 API authentication and public endpoints (src/ansina/api/auth.py) with tests to validate behavior.  
- 💾 Persistence: 🧰 DB foundation, migrator and initial migration (src/ansina/storage/database.py, migrator.py, migrations/0001_init.sql).  
- 📄 Docs & README: 📝 README rewrite and docs scaffolding (docs/architecture/blueprint.md) to explain architecture sections §3–§5.

⚙️ **CI, tests, and quality gates**
- 🧪 Tests: ✅ Unit + E2E tests added (tests/unit/*, tests/e2e/test_server.py) and a testing strategy that defines unit conventions + E2E build validation gate.  
- 🔁 CI pipeline: 🛠️ .github/workflows/ci.yml implements unit and E2E jobs; both OS legs pass on CI.  
- 🧹 Hygiene: ✨ pre-commit, Makefile, pyproject tweaks and .gitignore updates to keep developer UX smooth.

🧭 **Engineering choices & tradeoffs**
- ⚖️ Separation: Model code intentionally excluded — M0 focuses on stability, contracts, and reproducible ops before wiring inference.  
- 🧪 Validation-first: E2E gate ensures the runnable artifact builds cleanly on multiple OS runners before merging downstream model work.  
- 📚 Documented: Architecture blueprint and examples (ansina.example.toml) make onboarding and future design decisions explicit.

🔎 **Files and signals worth scanning**
- 🔁 CI + tests: .github/workflows/ci.yml, tests/e2e/test_server.py  
- 🧭 API surface: src/ansina/api/app.py, auth.py, routes/health.py, readiness.py  
- 🗄️ Storage: src/ansina/storage/database.py, migrator.py, migrations/0001_init.sql  
- 📘 Docs: README.md, docs/architecture/blueprint.md

This was a foundation-first sprint: stable contracts, testable CI, and readable docs — readying Ansina for the next phase where model integration becomes a consumer of this platform.

Onward to M1 — wire the models once the infra is battle-tested.
