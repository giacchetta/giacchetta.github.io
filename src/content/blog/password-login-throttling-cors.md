---
pr: "https://github.com/giacchetta/ansina/pull/52"
slug: ansina-password-login-throttling-cors
title: "Ansina: Password Login, Throttling, and Browser CORS"
description: "Ansina adds password login, login throttling, and browser CORS so third-party clients can authenticate without auth-policy gaps."
date: 2026-09-23
authors: [giacchetta]
tags: [ai-engineer]
---

Password login and browser CORS landed; the auth stack stopped leaking by accident.

We replaced the fragile “some auth paths enforce policy, some do not” model with one boundary that actually holds. The fix was simple and boring: enforce weak-password checks before writes, lock brute-force attempts by username and IP, then make browser preflights respect the same auth rules.

⚡ **Password Policy and Self-Service Change**

- **Password policy** — `auth/password_policy.py` enforces a min-length floor of 8, casefolded username checks, and a bundled common-password reject list before any user row exists.
- **Self-service reset** — `PUT /auth/me/password` proves possession with the current password, then checks the new one, so a stolen token cannot probe policy or silently overwrite.
- **Everything in scope** — the same policy runs on create-user and admin password changes, which closes the bypass that would otherwise exist on the one request path that writes a password.

🛡️ **Throttling and Failure Signal Control**

- **Username and IP locks** — `LoginThrottle` holds separate buckets per username and per IP, records unknown usernames the same as real ones, and returns the longer remaining lock in `Retry-After`.
- **Failure timing** — the route now verifies a dummy argon2 hash on unknown-user and wrong-password failures, so reconnaissance does not leak an easy time signal.
- **Success clears state** — a successful login clears both buckets; repeated failures keep the lock, and the 429 path stays consistent instead of becoming an enumeration oracle.

🔒 **Browser CORS and Auth Boundary**

- **Origin allowlists** — `CorsSettings` accepts an explicit list, strips trailing slashes, and fails fast on empty or wildcard configs before uvicorn binds a port.
- **Preflight ordering** — CORS is registered outermost, so browser `OPTIONS` requests never hit `BearerAuthMiddleware` and a valid preflight returns 200 instead of a confusing 401.
- **Client visibility** — `Access-Control-Expose-Headers` includes `X-Request-ID` and `Retry-After`, so JavaScript can correlate auth failures and surface throttle state without hidden network errors.

The auth stack is finally boring in the right way. 💥

#AIEngineering #SoftwareEngineering #Authentication #WebSecurity
