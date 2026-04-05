You are initializing an audit remediation workflow on this codebase.

## Step 0 — Bootstrap (run once)

1. Create the directory structure defined in CLAUDE.md if absent.
2. If `/docs/audits/20260405-audit-report.md` does not exist, halt and output:
   "BLOCKED: No audit report found. Provide audit-report.md before proceeding."
3. If it exists, confirm its presence and proceed immediately to Step 1.

## Step 1 — Generate Specifications

Read `/docs/audits/20260405-audit-report.md`.
For each finding, append a SPEC block to `/docs/specs/remediation_specs.md`:
SPEC-XXX

Audit-ID: AUDIT-XXX
Title: <concise title>
Problem: <root cause, one paragraph>
Implementation Plan: <ordered technical steps>
Files to Modify: <explicit list>
Risks: <side-effects, regressions, breaking changes>
Acceptance Criteria: <each criterion must be independently testable>
Test Plan: <specific commands or test cases to verify the fix>

When all SPECs are written, write to `/docs/reports/session_state.md`:
CURRENT_SPEC: SPEC-001
STATUS: IN_PROGRESS

Then begin the implementation loop.

## Step 2 — Implementation Loop

Follow the loop defined in CLAUDE.md strictly.
For each SPEC:
2.1 Implement — modify only declared files; output a unified diff
2.2 Test — execute in the order specified in CLAUDE.md
2.3 Validate — check each acceptance criterion; output PASS / FAIL per criterion
2.4 Update traceability matrix
2.5 Append to implementation report
2.6 Gate — PASS → update session_state.md to next SPEC and continue
FAIL → fix and re-test (max 3 attempts per CLAUDE.md rules)

## Step 3 — Final Summary

When all SPECs reach status ✅ or 🚫 (blocked), generate `/docs/reports/final_summary.md`.
Include: issues resolved, issues blocked, security posture delta, production readiness verdict.

Begin now with Step 0.

---

Read "/docs/reports/traceability_matrix.md" and resume the audit remediation loop from the "PENDING" SPECs. Follow all rules in CLAUDE.md. Do not re-process completed SPECs.
