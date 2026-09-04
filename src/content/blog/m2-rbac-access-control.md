---
pr: "https://github.com/giacchetta/ansina/pull/29"
title: "RBAC is more than permission checks"
date: 2026-09-04
---

Merged PR #29, closing M2 — RBAC & Access Control in Ansina.

The interesting part was not adding a few `if user.is_admin` checks. It was building an access-control system that remains coherent as the application grows.

The milestone now includes:

- A database-backed identity model for users, groups, roles, credentials, and external identities.
- Argon2id password hashing and salted, constant-time API-token verification.
- A formal authenticator chain that resolves principals before authorization.
- Permission enforcement across every non-public route.
- A mandatory startup audit that refuses to boot when a route is missing an authorization declaration.
- Sudo step-up authentication for sensitive Maintain operations, with TTLs, revocation, lockouts, and persistent state.
- A complete management API for users, groups, and role assignments.

Several design decisions mattered more than the endpoint count.

Bootstrap authentication is now generated safely on first boot when no override is configured: the token is printed once, only its salted hash is stored, and it cannot be recovered after startup. Authentication can be explicitly disabled for loopback development, rather than inferred from missing configuration.

Authorization is enforced from the actual FastAPI route graph. The old hand-maintained bootstrap resource list was removed, so the permission catalog cannot silently drift away from the application. Routes without `require(...)` are now a startup failure.

The management API also protects the authorization model itself. A caller cannot grant permissions it does not hold, Maintain cannot mint Admin or `auth.*` access even after sudo step-up, and the final active Admin cannot be deleted, demoted, or removed from its group.

Deletion is a tombstone, not merely suspension. Credentials, assignments, memberships, and live sudo grants are purged transactionally, while the identity row remains available for audit attribution.

The result is a security boundary with explicit seams: authentication methods can be extended, step-up verifiers can be replaced, and policy enforcement does not need to know how credentials are stored.

The milestone ended with 598 unit tests at 100% coverage and 20 black-box end-to-end tests. The final e2e flow provisions a user entirely over HTTP, assigns Maintain, proves the sudo gate, performs step-up, rejects self-escalation, and protects the last Admin.

The remaining token-management work—self-service issuance, listing, deletion, and usage bookkeeping—was deliberately moved to M3.

Good access control is not just about who can call an endpoint. It is about making unsafe states difficult to represent, easy to detect, and impossible to hide behind a passing test suite.

#AIEngineering #SecurityEngineering #Authorization #RBAC #SoftwareArchitecture
