# Spec Template

> Copy this file to `agent/specs/<feature-slug>/spec.md` and fill in every field.
> Do NOT leave `<!-- placeholder -->` markers in an APPROVED spec.
> Fields marked `[REQUIRED]` must be completed before Status can be set to APPROVED.

---

## Spec Header

| Field            | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **Feature**      | [REQUIRED] Name matching `features/INDEX.md`                              |
| **Feature ID**   | [REQUIRED] e.g. F-01                                                      |
| **Spec Version** | 1.0                                                                       |
| **Status**       | DRAFT \| REVIEW \| APPROVED \| IN_PROGRESS \| DONE \| REJECTED \| BLOCKED |
| **Safety Level** | LOW \| MEDIUM \| HIGH \| CRITICAL                                         |
| **Author**       | Agent or human identifier                                                 |
| **Date**         | YYYY-MM-DD                                                                |
| **Related Spec** | Link to predecessor/dependent spec if any                                 |

---

## 1. Problem Statement [REQUIRED]

<!-- One paragraph. What is broken or missing? What user/system need is unmet? -->

---

## 2. Scope

### 2.1 Files In — Will Be Modified [REQUIRED]

<!-- List every file that WILL be changed. No wildcards. -->

- `path/to/file.ts`

### 2.2 Files Out — Will NOT Be Modified [REQUIRED]

<!-- Explicitly list files that are adjacent but out of scope. -->

- `path/to/untouched-file.ts`

### 2.3 New Files (if any)

<!-- List new files to be created. -->

- `path/to/new-file.ts`

---

## 3. Behavior Specification

### 3.1 Before (Current Behavior) [REQUIRED]

<!-- Describe the current observable behavior. Be concrete. -->

### 3.2 After (Target Behavior) [REQUIRED]

<!-- Describe the target observable behavior. Be concrete. -->

### 3.3 Invariants (Must Remain True) [REQUIRED]

<!-- Behaviors that must not change under any circumstances. -->

- Existing authenticated endpoints must continue to require valid JWT.
- All API inputs must remain Zod-validated.

---

## 4. API Contract [Required if API changes]

### New or Modified Endpoints

#### `METHOD /api/path`

- **Auth required:** Yes/No
- **CSRF required:** Yes/No
- **Rate limited:** Yes/No
- **Request body:**
  ```json
  {
    "field": "type — description"
  }
  ```
- **Response (success):**
  ```json
  {
    "field": "type — description"
  }
  ```
- **Error responses:**
  | Status | Code | Condition |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Invalid input |
  | 401 | `INVALID_TOKEN` | Bad/expired token |

---

## 5. Schema Changes [Required if schema changes]

<!-- If modifying shared/schema.ts, list every field added/removed/modified. -->

### `shared/schema.ts`

| Table | Field         | Change | Type | Nullable | Default |
| ----- | ------------- | ------ | ---- | -------- | ------- |
| users | example_field | ADD    | text | YES      | null    |

**Migration required:** Yes/No
**Drizzle command:** `npm run db:push` (if DATABASE_URL is set)

---

## 6. Security Considerations [REQUIRED for HIGH/CRITICAL]

<!-- Address each relevant security concern. -->

- [ ] No new unauthenticated attack surface introduced.
- [ ] Input validated with Zod before processing.
- [ ] No secrets committed or logged.
- [ ] Auth middleware not bypassed.

---

## 7. Test Plan [REQUIRED]

### Unit Tests

| Test File        | Test Case   | Expected Outcome |
| ---------------- | ----------- | ---------------- |
| `tests/unit/...` | Description | Pass/behavior    |

### Integration Tests

| Test File               | Test Case   | Expected Outcome |
| ----------------------- | ----------- | ---------------- |
| `tests/integration/...` | Description | Pass/behavior    |

### Manual Verification Steps

1. Step one.
2. Step two.

---

## 8. Rollback Plan [REQUIRED for MEDIUM and above]

<!-- How to revert if the change causes regressions. -->

1. Revert the PR / commits.
2. Specific data migration reversal steps if applicable.

---

## 9. Dependencies

| Type        | Name | Version | Reason |
| ----------- | ---- | ------- | ------ |
| npm package | —    | —       | —      |

---

## 10. Assumptions

<!-- Any uncertainty documented here. If blocking, set Status to BLOCKED. -->

- [ ] Assumption 1: …

---

## 11. Reviewer Sign-Off

| Role                       | Name | Approved? | Date |
| -------------------------- | ---- | --------- | ---- |
| Author                     |      |           |      |
| Reviewer 1                 |      |           |      |
| Reviewer 2 (HIGH/CRITICAL) |      |           |      |
