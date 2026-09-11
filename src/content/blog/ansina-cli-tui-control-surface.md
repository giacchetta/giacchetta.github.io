---
pr: "https://github.com/giacchetta/ansina/pull/36"
slug: ansina-cli-tui-control-surface
title: "Ansina CLI/TUI: A Dependency-Isolated Control Surface"
description: "Built a dependency-isolated CLI and TUI over Ansina's REST API with self-service tokens, sudo handling, raw route coverage, and live health views."
date: 2026-09-11
authors: [giacchetta]
tags: [ai-engineer, ai-agent]
---

Ansina's REST API now has a real control surface: a dependency-isolated CLI for automation and a TUI for operators.

We built `ansina-tui` without importing `ansina`, then wired authentication, token lifecycle, raw API access, and a live Overview tab on top of HTTP. The result is a usable front door for both CI/CD and humans, with failure states designed instead of leaked as tracebacks.

⚡ **A Separate Control Surface**

- **Dependency isolation** — `tui/` owns its packaging, lockfile, virtual environment, and CI job. `tests/unit/test_isolation.py` pins the boundary: the CLI never imports the daemon package, while `typer`, `httpx`, `textual`, and `rich` stay on the client side.

- **One invocation, two modes** — Bare `ansina-tui` opens the TUI only on a TTY. Any argument selects the CLI, while a non-TTY bare invocation prints help to stderr and exits 2. `--refresh` is validated only when an actual TUI launch occurs.

- **Operational exit codes** — `status` checks `/healthz` before `/readyz`, then `/version`, and distinguishes unreachable, not-ready, and unhealthy states. Codes 6 and 7 make the command useful as a container readiness and health probe, not just a diagnostic.

🔒 **Identity and Credential Boundaries**

- **Self identity is first-class** — `GET /auth/me` resolves the existing `Principal` without a database read. The `me.*` policy carve-out grants every builtin role access to `me.profile`, while sensitive `auth.*` routes remain protected.

- **Tokens are self-service** — Users can mint, list, and revoke their own tokens; administrators can manage tokens on behalf of other users. Raw credentials are returned exactly once, hashes never leave the server, and revoked tokens fail on the next authenticated request.

- **Bootstrap means break-glass** — The bootstrap identity is auto-generated, never overridden or rotated, and can hold exactly one token. A separate configured Admin is provisioned from `ANSINA_SECURITY__ADMIN_USERNAME` and `ANSINA_SECURITY__API_TOKEN`; the token-only configuration is no longer valid.

🧠 **Automation Without Hidden Interaction**

- **Raw REST coverage** — `ansina-tui api` reaches every daemon route without a client-side allow-list. `-f key=value` builds simple JSON bodies, `--input` sends typed or raw payloads, and `-H` cannot override the real `Authorization` or `X-Sudo-Token` headers.

- **Sudo becomes state** — A live sudo grant is attached automatically through the shared session layer. Without one, sensitive calls exit 4 with an `auth sudo` hint and never prompt mid-request, keeping the API command safe for CI/CD.

- **Output stays machine-safe** — `--json` and piped output preserve the daemon body verbatim, including non-2xx problem documents. Diagnostics go to stderr, so `api ... --json | jq` remains predictable.

🔬 **A TUI That Fails Deliberately**

- **Overview is a refresh contract** — `fetch_overview()` reads health, readiness, version, and identity into an `OverviewSnapshot`. Connectivity failures and insecure `hosts.toml` become designed states rather than exceptions from Textual workers.

- **No flicker, no duplicate widgets** — An exclusive refresh worker updates existing sections in place on a timer or with `r`. Adding another tab is an append to `TABS`, not a rewrite of the application shell.

- **The honest boundary** — Heart-disabled handling is explicitly out of scope because Overview calls four routes and `/heart/tick` is not one of them. That acceptance item is N/A, documented rather than silently implied.

M4 is shipped: a REST API with a control surface that respects both operators and automation. ⚙️

#AIEngineering #SoftwareEngineering #CommandLineTools #MultiAgentSystems #RBAC
