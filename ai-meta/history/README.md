# Governance History (read-only)

This directory holds the **completed** record of past governance cycles. It is an archive —
do **not** resume these flows or edit the records as if they were live.

```
history/
├── audits/        Past security / pre-release audit reports (dated).
└── remediation/   Completed remediation cycle: specs + traceability matrix + blockers.
```

## What's here

- **`audits/`** — point-in-time audit reports (e.g. `20260405-audit-report.md`). Each reflects
  the codebase as it was on that date.
- **`remediation/`** — the April-2026 security remediation: `remediation_specs.md` (SPEC-001…023),
  `traceability_matrix.md` (all 23 SPECs `✅ PASS`), and `blockers.md`. This cycle is **closed**.

## For active work

New changes follow the live governance in [`../README.md`](../README.md):
`INDEX.yaml` → `FEATURE_MAP.md` → an approved spec under `../specs/`. The audit-workflow
prompts in `.github/prompts/` write *new* audit/remediation artifacts into this directory.
