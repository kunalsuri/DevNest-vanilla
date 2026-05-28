# Agent Guide — Mandatory Operating Instructions

> Every AI agent operating on this repository MUST read this file first.
> Non-compliance constitutes an architectural violation.

---

## 0. Prime Directive

**No spec = no change.**

You may not create, modify, rename, or delete any application file unless a spec document
exists at `ai-meta/specs/<feature>/spec.md` and its `Status` field is `APPROVED`.

---

## 1. Mandatory Pre-Flight Checklist

Before writing a single line of application code, confirm ALL of the following:

- [ ] 1. Read `ai-meta/CHANGE_POLICY.md` — know what you are permitted to touch.
- [ ] 2. Read `ai-meta/architecture/OVERVIEW.md` — understand the runtime topology.
- [ ] 3. Read `ai-meta/architecture/MODULE_MAP.md` — locate the files you will edit.
- [ ] 4. Read `ai-meta/features/INDEX.md` — identify the feature and its safety level.
- [ ] 5. Read the relevant `ai-meta/features/<name>.md` — understand scope and risks.
- [ ] 6. Locate or create `ai-meta/specs/<feature>/spec.md` using `ai-meta/specs/TEMPLATE.md`.
- [ ] 7. Confirm the spec `Status` is `APPROVED` before touching any application file.
- [ ] 8. Read prior eval reports in `ai-meta/evaluations/<feature>/eval.md` if they exist.

---

## 2. Execution Protocol

### 2.1 Change Workflow
```
EXPLORE → SPEC → APPROVE → IMPLEMENT → TEST → EVAL
```

| Step | Action |
|---|---|
| EXPLORE | Read architecture + module map. Do NOT modify anything yet. |
| SPEC | Write or update `ai-meta/specs/<feature>/spec.md`. |
| APPROVE | Spec `Status` must be set to `APPROVED` before proceeding. |
| IMPLEMENT | Make the minimal change described in the spec. |
| TEST | Run `npm run test:ci`. All tests must pass. |
| EVAL | Write `ai-meta/evaluations/<feature>/eval.md`. |

### 2.2 Prohibited Mid-Flight Actions
- Do NOT refactor code unrelated to the spec scope.
- Do NOT rename files or directories.
- Do NOT upgrade or add dependencies without explicit spec approval.
- Do NOT delete tests.
- Do NOT bypass `authenticate` or `requireAdmin` middleware.
- Do NOT write secrets or credentials into source files.

---

## 3. Safety Level Gating

| Safety Level | Meaning | Required Actions |
|---|---|---|
| `LOW` | Isolated UI or config change | Spec + 1 reviewer |
| `MEDIUM` | Business logic or API change | Spec + tests + 1 reviewer |
| `HIGH` | Auth, storage, session, security | Spec + tests + security review + 2 reviewers |
| `CRITICAL` | Schema changes, middleware, data migration | Spec + tests + security review + architecture sign-off |

---

## 4. Boundaries You Must Never Cross

| Boundary | Why |
|---|---|
| `data/` directory contents | Runtime user data — agents must not read or write |
| `.env` and environment variables | Secrets — never commit, never log |
| `shared/schema.ts` types | Contract between client and server — changes are CRITICAL |
| `server/auth/` session/JWT logic | Security boundary — changes are HIGH/CRITICAL |
| `server/storage.ts` `IStorage` interface | Storage contract — changes cascade to all services |

---

## 5. Error Recovery

If you reach an uncertain state:
1. Stop all file modifications immediately.
2. Write your uncertainty into the spec `Assumptions` field.
3. Mark the spec `Status: BLOCKED`.
4. Report to the user before proceeding.

---

## 6. Post-Implementation Checklist

- [ ] All files changed are within the spec scope.
- [ ] `npm run check` (TypeScript) passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test:ci` passes.
- [ ] Eval report written at `ai-meta/evaluations/<feature>/eval.md`.
- [ ] No secrets committed.
- [ ] No unrelated files modified.
