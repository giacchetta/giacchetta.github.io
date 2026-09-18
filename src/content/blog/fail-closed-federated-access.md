---
pr: "https://github.com/giacchetta/ansina/pull/46"
slug: fail-closed-federated-access
title: "Fail-Closed Access: Custom Roles and Federated Identity"
description: "Ansina now enforces fail-closed sudo, custom role safety, expiring credentials, TOTP step-up, and OAuth 2.0/OIDC federated login."
date: 2026-09-18
authors: [giacchetta]
tags: [ai-engineer, ai-agent]
---

Ansina's identity layer moved from static role assumptions to fail-closed, federated access control.

M3 shipped custom roles, TOTP step-up, credential expiry, role-mapping provenance, and an OAuth 2.0/OIDC login exchange. The common thread is structural enforcement: permissions must match served routes, sensitive mutations require live step-up, and federated claims cannot silently override local assignments.

⚡ **Fail-Closed Authorization**

- **Sudo gate** — `SudoRequiredError` now applies to every non-admin role on sensitive resources. A custom role granting `auth.*` cannot bypass step-up by avoiding the old `maintain` slug.
- **Factor registry** — `StepUpRegistry` returns every enrolled verifier, while `GET /auth/me` exposes `step_up_factors`. Zero factors, unknown factors, and ambiguous requests fail with 403 without consuming lockout attempts.
- **Grant fidelity** — Resource catalogs now persist served verbs and policy class. Builtin grants are intersected with `resource.verbs`, so inert permissions such as `system.version:DELETE` are pruned on boot.

🛡️ **Roles, Credentials, and TOTP**

- **Custom role lifecycle** — `POST`, `PATCH`, and `DELETE /auth/roles` validate catalogued, served, grantable permissions before self-escalation checks. Builtin roles and assigned custom roles remain immutable or undeletable.
- **Credential expiry** — Authentication filters `credentials.expires_at` in SQL and uses one injected clock instant for expiry and staleness. `issue_token` can now mint tokens with an explicit TTL.
- **Encrypted step-up** — RFC 6238 TOTP uses an AES-GCM `v1` envelope, an env-only 32-byte key, drift handling, and replay prevention. Enrollment is intentionally ungated; disabling it requires sudo.

🔄 **Federated Login Without Rewriting Auth**

- **Login exchange** — `POST /auth/oidc/login` and `GET /auth/oidc/callback` implement authorization code plus PKCE. ID tokens reject bad signatures, issuers, audiences, expiry, nonces, and unsupported algorithms before provisioning.
- **Claims reconciliation** — Each login refreshes `role_mappings` through `sync_mapped_roles`. Provider-owned assignments change with claims; local assignments survive. JIT provisioning links matching local usernames, with explicit refusals and warnings.
- **Deliberate boundary** — OIDC is a login exchange, not a per-request authenticator. `Authenticator`, bearer middleware, `resolve_principal`, and the TUI stayed untouched; `ansina-tui` remains an external API client.

The access layer now fails closed by construction. 🔒

#AIEngineering #SoftwareEngineering #RBAC #FederatedIdentity #TOTP
