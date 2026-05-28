# GEMINI.md

Governance for this repository is defined once, in **[`AGENTS.md`](AGENTS.md)**.

Read it first. It covers the prime directive (no approved spec → no change to
`server/`, `client/`, `shared/`), the specs-vs-features distinction, the spec
lifecycle, safety levels, and hard boundaries.

Then route your task via [`agent/INDEX.yaml`](agent/INDEX.yaml) and open only the
feature section you need in [`agent/FEATURE_MAP.md`](agent/FEATURE_MAP.md).

Scaffold a new feature with `npm run feature:new`; verify consistency with
`npm run feature:check`.
