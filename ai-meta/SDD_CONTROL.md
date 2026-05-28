# SDD Control — Specification-Driven Development Enforcement

## 1. Core Principle

Every observable change to application behavior MUST be preceded by a written,
approved specification. This applies to AI agents and human contributors equally.

---

## 2. What Constitutes a Spec-Required Change

The following always require a spec:

| Change Type | Example |
|---|---|
| New API endpoint | `POST /api/workspaces` |
| Modified API contract | Adding/removing request or response fields |
| New or modified middleware | New rate-limit rule, new auth check |
| Schema change | Adding column to `users` table in `shared/schema.ts` |
| New or modified service | Changes to `server/services/*.ts` |
| New UI page or route | New entry in `client/src/pages/` |
| New feature module | New directory under `client/src/features/` |
| Security configuration | CSP headers, CORS origins, JWT settings |
| Storage interface change | Modification to `IStorage` in `server/storage.ts` |
| Dependency addition/upgrade | New entry in `package.json` |

---

## 3. Spec Lifecycle

```
DRAFT → REVIEW → APPROVED → IN_PROGRESS → DONE
                     ↓
                 REJECTED
                     ↓
                 BLOCKED (uncertainty or blocker discovered mid-implementation)
```

- Only `APPROVED` specs may be implemented.
- `DONE` specs must have a corresponding eval report.
- `BLOCKED` specs must document the blocker clearly before resuming.

---

## 4. Spec File Location and Naming

```
ai-meta/specs/<feature-slug>/spec.md
```

`<feature-slug>` must match the feature's entry in `ai-meta/features/INDEX.md`.

---

## 5. Mandatory Spec Fields

All specs must include these fields (defined in `ai-meta/specs/TEMPLATE.md`):

| Field | Required |
|---|---|
| `Feature` | Yes |
| `Status` | Yes |
| `Safety Level` | Yes |
| `Scope — Files In` | Yes |
| `Scope — Files Out` | Yes |
| `Behavior: Before` | Yes |
| `Behavior: After` | Yes |
| `API Contract` | If API changes are involved |
| `Schema Changes` | If schema changes are involved |
| `Security Considerations` | Yes for HIGH/CRITICAL |
| `Test Plan` | Yes |
| `Rollback Plan` | Yes for MEDIUM and above |
| `Assumptions` | Yes (empty list is acceptable) |

---

## 6. Enforcement via CI (Recommended Gate)

To enforce SDD via pull request workflow:

1. Add a PR template that requires linking a spec: `ai-meta/specs/<feature>/spec.md`.
2. Add a CI step that checks for the presence of a spec file when `server/` or `client/src/`
   files are modified in the PR.
3. Require the spec `Status` field to contain `APPROVED` in CI.

Reference script location (to be created): `scripts/check-spec.ts`

---

## 7. SDD Anti-Patterns (Forbidden)

- Writing code first and spec second.
- Marking a spec `APPROVED` without reviewing it against the architecture docs.
- Leaving spec `Status` as `DRAFT` and merging code anyway.
- Writing a spec so vague that it cannot be evaluated after implementation.
- Omitting `Scope — Files Out` (explicitly listing what will NOT change is required).
