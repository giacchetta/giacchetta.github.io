---
pr: "https://github.com/giacchetta/ansina/pull/29"
slug: database-backed-rbac-with-sudo-enforcement
title: "Engineering Database-Backed RBAC with Sudo Enforcement"
description: "Ansina now ships database-backed RBAC, route-coverage enforcement, sudo step-up authentication, and a guarded management API."
date: 2026-09-04
authors: [giacchetta]
tags: [ai-engineer, ai-agent]
---

Ansina's access control is now database-backed, route-audited, and step-up protected.

This milestone replaced static credential assumptions with a complete RBAC system spanning identity, permissions, sudo grants, and management APIs. The hard part was not adding decorators. It was making every authorization decision explicit, testable, and difficult to bypass accidentally.

⚡ **The Authorization Boundary**

- **Database-backed identity** — Users, groups, roles, credentials, external identities, and role assignments now live in SQLite repositories. API tokens are stored only as salted hashes, passwords use argon2id, and `BearerAuthMiddleware` resolves active principals through an injectable authenticator chain.

- **Startup as a security gate** — `audit_route_coverage()` walks the real FastAPI route table and fails `create_app()` when a non-public route lacks `require(...)`. The old `BOOTSTRAP_RESOURCES` list is gone; the running application is now the resource catalog.

- **Explicit failure semantics** — Unauthorized requests remain 401, while insufficient permissions return distinguishable 403 `problem+json` codes. The response does not reveal whether the identity, token, or permission was the failing component.

⚙️ **Sudo as a Real Step-Up Flow**

- **Verifier-agnostic grants** — `SudoService` owns issuance, TTL, revocation, and lockout above a `StepUpVerifier` protocol. M2 uses password re-verification, but a future verifier can be registered without rewriting grant or enforcement logic.

- **Sensitive routes are structurally protected** — Maintain must present a live `X-Sudo-Token` for sensitive resources; Admin does not. Bad, expired, or revoked grants do not become authentication failures—they simply leave the principal without sudo and produce `CODE_SUDO_REQUIRED`.

- **State survives restarts** — Sudo grants and lockouts are persisted in `sudo_grants` and `sudo_lockouts`, not process memory. Failed attempts produce a real 429 with `Retry-After`, and no raw password or grant token reaches logs.

🛡️ **Management Without Self-Escalation**

- **The API can bootstrap its own users** — Admin can create a user over HTTP, set its password, issue a token, assign Maintain, and exercise the resulting identity. This is the first end-to-end path that provisions a non-bootstrap principal without touching SQLite directly.

- **Maintain is deliberately bounded** — Even with a valid sudo grant, Maintain cannot assign Admin or any role granting `auth.*` permissions. The checks cannot be reduced to a permission-subset comparison because Maintain and Admin share fixed grants under this policy.

- **Deletion is a tombstone** — `DELETE /auth/users/{id}` records `deleted_at` and purges credentials, assignments, memberships, and live sudo grants in one transaction. The identity remains for audit attribution, but manually reactivating the row restores nothing.

🔬 **Verification Against the Failure Modes**

- **Boot behavior is explicit** — Fresh databases auto-generate a 256-bit bootstrap token, print it once, and retain only its hash. Operator overrides are validated for entropy, dev mode requires a loopback bind, and manual runs confirmed stable restart behavior with no secrets in JSON logs.

- **The suite reached 598 unit tests** — `ruff`, formatting, and `mypy --strict` stayed clean while unit coverage remained at 100%. The e2e suite reached 20 black-box tests, including the full 401 → 403 → 200 authorization chain and the RBAC management round trip.

- **The failure cases are intentional** — Missing route dependencies fail startup. Inactive or tombstoned users stop authenticating. The final Admin cannot be deleted or demoted, and a sudoed Maintain cannot mint an Admin.

Deterministic access control is now part of the application boundary, not a convention.

#AIEngineering #SoftwareEngineering #RBAC #AccessControl #MultiAgentSystems
