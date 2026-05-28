# Agent Routing Guide — Feature-Based Agent Dispatch

> **Purpose:** Map a user request to the relevant feature(s) before making changes.
> **Last Updated:** 2026-05-28

---

## How to route (single source of truth)

Per-feature routing keywords, safety levels, statuses, and file locations now live in one
machine-readable file: **[`agent/INDEX.yaml`](INDEX.yaml)**. They are no longer duplicated here.

**Procedure:**

1. Read [`INDEX.yaml`](INDEX.yaml) and match the request against each feature's `keywords`.
2. Select the **primary** feature; note any related features that share files or keywords.
3. Read the feature's `safety` level and apply the gating rules in
   [`/AGENTS.md` §4 Safety Levels](../AGENTS.md).
4. Open the matching section of [`FEATURE_MAP.md`](FEATURE_MAP.md) for full detail
   (APIs, dependencies, tech debt) — only for the feature(s) you actually touch.

---

## Multi-feature requests

Some requests span features. Load the listed contexts together:

| Request type        | Features involved                           | Extra docs                                                                                     |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Security review** | F-01 (Auth), F-04 (Admin), all API features | [features/authentication.md](features/authentication.md), [CHANGE_POLICY.md](CHANGE_POLICY.md) |
| **Error handling**  | All features                                | [FEATURE_MAP.md](FEATURE_MAP.md) per-feature error sections                                    |
| **Validation**      | All API features                            | `shared/schema.ts` (Zod schemas)                                                               |

---

## Safety-first actions by level

Apply these on top of the per-level gating in [`/AGENTS.md` §4 Safety Levels](../AGENTS.md):

- **CRITICAL** (F-12 Storage): re-read [CHANGE_POLICY.md](CHANGE_POLICY.md); a spec must be
  `APPROVED` before any edit; run the full test sequence after changes. A change here
  cascades to every feature.
- **HIGH** (F-01 Auth, F-04 Admin): review the risk register in the feature doc; make minimal
  changes; run security-focused tests.
- **MEDIUM**: check known limitations; add tests for new behavior.
- **LOW**: read the feature overview; add basic tests.

---

## Best practices

1. Always check the `safety` level before proceeding.
2. Respect `status: PARTIAL` — those features may have incomplete implementations.
3. Follow dependencies — a change may affect related features.
4. Review existing test coverage and fill gaps before adding functionality.

---

**Maintenance:** when features change, update [`INDEX.yaml`](INDEX.yaml) (registry) and
[`FEATURE_MAP.md`](FEATURE_MAP.md) (detail) — not this file.
