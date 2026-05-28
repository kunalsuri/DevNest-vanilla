# Feature Index — DevNest-Vanilla

> The feature registry is no longer duplicated here. There is **one source of truth**:
>
> - **Compact lookup (load first):** [`agent/INDEX.yaml`](../INDEX.yaml) — every feature's
>   id, name, safety level, status, routing keywords, and primary file locations.
> - **Deep per-feature docs:** [`agent/FEATURE_MAP.md`](../FEATURE_MAP.md) — APIs,
>   dependencies, test coverage, tech debt, roadmap.
>
> Safety levels: `LOW | MEDIUM | HIGH | CRITICAL` · Status: `STABLE | PARTIAL`

## How to use

1. Match your task's keywords against `features[].keywords` in [`INDEX.yaml`](../INDEX.yaml).
2. Note the feature's `safety` level and consult the gating rules in
   [`/AGENTS.md` §4 Safety Levels](../../AGENTS.md).
3. Open the matching section of [`FEATURE_MAP.md`](../FEATURE_MAP.md) for full detail.

Detailed narrative docs for individual subsystems live at `agent/features/<name>.md`
(e.g. [`authentication.md`](authentication.md)).
