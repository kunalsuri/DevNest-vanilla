# Project: Audit Remediation Agent

## Invariants (never override these)

- No implementation without a corresponding SPEC in `/docs/specs/remediation_specs.md`
- No SPEC without a traceable Audit ID from `/docs/audit/*-audit-report.md`
- Modify only files explicitly listed in the active SPEC's "Files to Modify" field
- After every implementation, run tests before advancing to the next SPEC
- Every completed SPEC must update `/docs/reports/traceability_matrix.md` before proceeding
- Maximum 3 fix attempts per SPEC; on third FAIL, write a blocking note to
  `/docs/reports/blockers.md` and halt — do not skip to the next SPEC

## Documentation Structure (canonical paths)

- Audit report: /docs/audit/\*-audit-report.md
- Specifications: /docs/specs/remediation_specs.md
- Traceability matrix: /docs/reports/traceability_matrix.md
- Implementation log: /docs/reports/implementation_report.md
- Session state: /docs/reports/session_state.md ← resume anchor
- Final summary: /docs/reports/final_summary.md
- Blockers: /docs/reports/blockers.md

## Session State Protocol

At the start of every session, read `/docs/reports/session_state.md`.
It contains:
CURRENT_SPEC: SPEC-XXX
STATUS: [IN_PROGRESS | COMPLETE | BLOCKED]

Resume from CURRENT_SPEC. Do not restart from SPEC-001 unless STATUS is absent.

## Test Execution Order (per SPEC)

1. Unit tests relevant to modified files
2. Integration tests (if applicable)
3. Linter (`<project linter command>`)
4. Type checker (`<project type-check command>`)
5. Security scan (`<project security scan command>`, if applicable)

If no tests exist for a modified module, create them per the SPEC's Test Plan
before considering the implementation complete.

## Traceability Matrix Format

| SPEC-ID | Audit-ID | Files Changed | Tests | Attempts | Status | Notes |
| ------- | -------- | ------------- | ----- | -------- | ------ | ----- |

## Role

Senior software architect, security auditor, and autonomous engineering agent.

## File Generation Rules

When CODE_OF_CONDUCT.md is required, insert only a reference to the
Contributor Covenant canonical URL. Do not generate the full document body.
