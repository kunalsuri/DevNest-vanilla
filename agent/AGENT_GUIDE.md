# Agent Guide — Operating Checklists

> **Read [`/AGENTS.md`](../AGENTS.md) first.** It is the constitution: prime directive,
> workflow, spec lifecycle, safety levels, and hard boundaries.
> This file is the _operational complement_ — the pre-flight and post-implementation
> checklists. It does not restate the rules; it tells you how to execute them.

---

## 1. Pre-Flight Checklist

Before writing a single line of application code, confirm ALL of the following:

- [ ] 1. You have read [`/AGENTS.md`](../AGENTS.md) (prime directive + safety levels + boundaries).
- [ ] 2. Read `CHANGE_POLICY.md` — the full permission matrix for what you may touch.
- [ ] 3. Read `architecture/OVERVIEW.md` — runtime topology.
- [ ] 4. Read `architecture/MODULE_MAP.md` — locate the files you will edit.
- [ ] 5. Read `INDEX.yaml` — identify the feature and its safety level (compact registry).
- [ ] 6. Read the relevant `features/<name>.md` — understand scope and risks.
- [ ] 7. Locate or create `specs/<feature>/spec.md` (run `npm run feature:new`, or copy `specs/TEMPLATE.md`).
- [ ] 8. Confirm the spec `Status` is `APPROVED` before touching any application file.
- [ ] 9. Read prior eval reports in `evaluations/<feature>/eval.md` if they exist.

> Steps 3–6 are _on-demand reference_, not bulk reading. Open only what your task needs.

---

## 2. Execution Protocol

The change workflow (`EXPLORE → SPEC → APPROVE → IMPLEMENT → TEST → EVAL`) and safety-level
requirements are defined in [`/AGENTS.md` §2 and §4](../AGENTS.md). Run `npm run feature:check`
to verify spec/registry consistency at any point.

### Prohibited Mid-Flight Actions

- Do NOT refactor code unrelated to the spec scope.
- Do NOT rename files or directories.
- Do NOT upgrade or add dependencies without explicit spec approval.
- Do NOT delete tests.
- Do NOT bypass `authenticate` or `requireAdmin` middleware.
- Do NOT write secrets or credentials into source files.

(Hard boundaries are enumerated in [`/AGENTS.md` §5](../AGENTS.md) and the full permission
matrix in [`CHANGE_POLICY.md`](CHANGE_POLICY.md).)

---

## 3. Error Recovery

If you reach an uncertain state:

1. Stop all file modifications immediately.
2. Write your uncertainty into the spec `Assumptions` field.
3. Mark the spec `Status: BLOCKED`.
4. Report to the user before proceeding.

---

## 4. Post-Implementation Checklist

- [ ] All files changed are within the spec scope (`npm run feature:check` passes).
- [ ] `npm run check` (TypeScript) passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test:ci` passes.
- [ ] Eval report written at `evaluations/<feature>/eval.md`.
- [ ] No secrets committed.
- [ ] No unrelated files modified.
