# SDD Control — Specification-Driven Development Enforcement

## 1. Core Principle

Every observable change to application behavior MUST be preceded by a written,
approved specification. This applies to AI agents and human contributors equally.

---

## 2. What Constitutes a Spec-Required Change

The following always require a spec:

| Change Type                 | Example                                              |
| --------------------------- | ---------------------------------------------------- |
| New API endpoint            | `POST /api/workspaces`                               |
| Modified API contract       | Adding/removing request or response fields           |
| New or modified middleware  | New rate-limit rule, new auth check                  |
| Schema change               | Adding column to `users` table in `shared/schema.ts` |
| New or modified service     | Changes to `server/services/*.ts`                    |
| New UI page or route        | New entry in `client/src/pages/`                     |
| New feature module          | New directory under `client/src/features/`           |
| Security configuration      | CSP headers, CORS origins, JWT settings              |
| Storage interface change    | Modification to `IStorage` in `server/storage.ts`    |
| Dependency addition/upgrade | New entry in `package.json`                          |

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
agent/specs/<feature-slug>/spec.md
```

`<feature-slug>` must match the feature's entry in `agent/features/INDEX.md`.

---

## 5. Mandatory Spec Fields

All specs must include these fields (defined in `agent/specs/TEMPLATE.md`):

| Field                     | Required                       |
| ------------------------- | ------------------------------ |
| `Feature`                 | Yes                            |
| `Status`                  | Yes                            |
| `Safety Level`            | Yes                            |
| `Scope — Files In`        | Yes                            |
| `Scope — Files Out`       | Yes                            |
| `Behavior: Before`        | Yes                            |
| `Behavior: After`         | Yes                            |
| `API Contract`            | If API changes are involved    |
| `Schema Changes`          | If schema changes are involved |
| `Security Considerations` | Yes for HIGH/CRITICAL          |
| `Test Plan`               | Yes                            |
| `Rollback Plan`           | Yes for MEDIUM and above       |
| `Assumptions`             | Yes (empty list is acceptable) |

---

## 6. Enforcement via CI (Recommended Gate)

The check script exists: **`scripts/feature-check.ts`** (run via `npm run feature:check`).

- `npm run feature:check` — validates `INDEX.yaml` integrity (ids, safety, status, that
  every listed path and referenced spec exists). Safe to run on every CI build.
- `npm run feature:check -- --changed` — also gates changed `server/`/`client/`/`shared/`
  files: each must be covered by an APPROVED spec's "Files In" list.

The gate's strictness is the `GATE_MODE` constant in `scripts/feature-check.ts`
(`'warn'` by default for a fresh template; flip to `'error'` once specs cover the code you
want to protect). To wire it into PRs: add `npm run feature:check -- --changed` as a CI step,
and a PR template that links the spec at `agent/specs/<feature>/spec.md`.

---

## 7. SDD Anti-Patterns (Forbidden)

- Writing code first and spec second.
- Marking a spec `APPROVED` without reviewing it against the architecture docs.
- Leaving spec `Status` as `DRAFT` and merging code anyway.
- Writing a spec so vague that it cannot be evaluated after implementation.
- Omitting `Scope — Files Out` (explicitly listing what will NOT change is required).
