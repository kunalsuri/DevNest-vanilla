# Feature Index — DevNest-Vanilla

> The feature registry is no longer duplicated here. There is **one source of truth**:
>
> - **Compact lookup (load first):** [`ai-meta/INDEX.yaml`](../INDEX.yaml) — every feature's
>   id, name, safety level, status, routing keywords, and primary file locations.
> - **Deep per-feature docs:** [`ai-meta/FEATURE_MAP.md`](../FEATURE_MAP.md) — APIs,
>   dependencies, test coverage, tech debt, roadmap.
>
> Safety levels: `LOW | MEDIUM | HIGH | CRITICAL` · Status: `STABLE | PARTIAL`

## How to use

1. Match your task's keywords against `features[].keywords` in [`INDEX.yaml`](../INDEX.yaml).
2. Note the feature's `safety` level and consult the gating rules in
   [`AGENT_GUIDE.md`](../AGENT_GUIDE.md#3-safety-level-gating).
3. Open the matching section of [`FEATURE_MAP.md`](../FEATURE_MAP.md) for full detail.

Detailed narrative docs for individual subsystems live at `ai-meta/features/<name>.md`
(e.g. [`authentication.md`](authentication.md)).
