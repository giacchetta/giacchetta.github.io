---
slug: "building-ansina-dual-model-ai-runtime"
title: "Building Ansina: A Blueprint for a Deterministic, Dual-Model AI Runtime"
description: "Building Ansina: Designing a lean, provable AI agent runtime built from the ground up on Python ≥ 3.14: introducing the architecture blueprint for Ansina"
date: 2026-08-16
authors: ["giacchetta"]
tags: ["ai-agent"]
pr: "https://github.com/giacchetta/ansina/pull/18"
---

# Building Ansina: A Blueprint for a Deterministic, Dual-Model AI Runtime

Designing a lean, provable AI agent runtime built from the ground up on Python ≥ 3.14: introducing the architecture blueprint for **Ansina**.

Currently in its blueprint phase and moving rapidly toward initial implementation, Ansina focuses on a tight, deterministic core where every architectural choice serves operational control, high signal-to-noise ratio, and zero unnecessary bloat.

Here is an inside look at what Ansina brings to the table as it prepares to launch:

### 📐 Pure Hexagonal Architecture

* **Streamlined REST Surface**: Exposes a clean, single internal FastAPI REST API with zero channel bloat or unnecessary gateway protocol overhead.
* **Deliberate State Management**: Starts with a minimal SQLite schema, growing persistence intentionally rather than accumulating hundreds of unmanaged state tables.
* **Never-Throw Streaming Contracts**: Features an `ApiProvider` port where streaming errors are returned synchronously as terminal stream events, guaranteeing predictable error paths.
* **First-Class Redaction**: Implements structured logging with redaction hardcoded into the formatting pipeline to ensure sensitive data is filtered before it hits disk.

---

### 🫀 The Dual-Model Core: Heart & Brain

Ansina separates autonomic local liveness from remote cognitive reasoning to eliminate round-trip network hops for basic decisions:

* **The Heart (In-Process Autonomic Loop)**:
* Uses an embedded ≤4B parameter model running natively in-process via MLX on Apple Silicon (with a `llama-cpp-python` fallback).
* Bounded strictly by an 8k context window to ensure optimal prompt performance.
* Drives an always-on tick loop tasked exclusively with deciding `idle` vs. `act` vs. `escalate` without network overhead.

* **The Brain (Remote High-Reasoning)**:
* Connects to 35B+ parameter models via an OpenAI-compatible `BrainProvider` port for complex reasoning tasks.

---

### 🎯 Hardware Target & Testing Strategy

* **Hardware First**: Optimized explicitly to run as an always-on engine on local Apple Silicon hardware (M4 Mac Mini, 16GB unified memory).
* **Black-Box Verification**: Uses an E2E test harness that spins up `python -m ansina` as an isolated subprocess, testing readiness, migrations, and auth strictly over HTTP.

The design is locked, the constraints are set, and implementation of **M0 — Skeleton** is about to begin.
