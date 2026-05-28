# Evaluation Template

> Copy this file to `ai-meta/evaluations/<feature-slug>/eval.md`.
> Complete after implementation. An eval report is required before a spec can be set to DONE.

---

## Eval Header

| Field | Value |
|---|---|
| **Feature** | Name matching `features/INDEX.md` |
| **Feature ID** | e.g. F-01 |
| **Spec Version** | Matches the spec this eval covers |
| **Outcome** | PASS \| FAIL \| PARTIAL |
| **Evaluator** | Agent or human identifier |
| **Date** | YYYY-MM-DD |
| **Linked Spec** | `ai-meta/specs/<feature>/spec.md` |

---

## 1. Scope Compliance

### 1.1 Files Modified
List every file actually changed during implementation. Mark any deviation from spec.

| File | In Spec? | Deviation? |
|---|---|---|
| `path/to/file.ts` | YES/NO | None / describe deviation |

### 1.2 Out-of-Scope Files Touched
<!-- List any files modified that were NOT in the spec. Explain why. -->
- None (ideal)

---

## 2. Behavior Verification

| Behavior from Spec §3.2 | Verified? | Evidence |
|---|---|---|
| Behavior description | YES/NO/PARTIAL | Test name / manual step / log output |

---

## 3. Test Results

### 3.1 Automated Tests
```
npm run test:ci
```

| Suite | Total | Passed | Failed | Skipped |
|---|---|---|---|---|
| Unit | — | — | — | — |
| Integration | — | — | — | — |

Paste failing test output here if FAIL or PARTIAL.

### 3.2 TypeScript Check
```
npm run check
```
Result: PASS / FAIL (paste errors if FAIL)

### 3.3 Lint
```
npm run lint
```
Result: PASS / FAIL (paste errors if FAIL)

---

## 4. Security Review

| Checklist Item | Status | Notes |
|---|---|---|
| No new unauthenticated attack surface | PASS/FAIL | |
| Inputs Zod-validated | PASS/FAIL | |
| No secrets committed or logged | PASS/FAIL | |
| Auth middleware not bypassed | PASS/FAIL | |
| CSRF protection intact | PASS/FAIL | |

---

## 5. Invariant Verification

List each invariant from Spec §3.3 and confirm it holds.

| Invariant | Holds? | Evidence |
|---|---|---|
| Invariant description | YES/NO | |

---

## 6. Deviations & Findings

<!-- Describe anything that differed from the spec. -->
<!-- If outcome is FAIL or PARTIAL, this section is mandatory. -->

### 6.1 Expected vs Actual Differences
- None

### 6.2 Bugs Found
- None

### 6.3 New Risks Identified
- None (or describe)

---

## 7. Follow-On Actions

| Action | Priority | Assignee | New Spec Required? |
|---|---|---|---|
| Description of follow-on work | HIGH/MED/LOW | — | YES/NO |

---

## 8. Final Verdict

**Outcome:** PASS / FAIL / PARTIAL

**Justification:**
One paragraph explaining the outcome. For FAIL or PARTIAL, describe what must be done
before the spec can be closed as DONE.
