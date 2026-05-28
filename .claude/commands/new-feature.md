---
description: Scaffold a new spec-driven feature (DRAFT spec + registry + test stub)
---

Scaffold a new feature for this repository, following the governance in `/AGENTS.md`.

1. If you have not already this session, read `/AGENTS.md` (the constitution).
2. From the request below, derive: a **kebab-case slug**, a human **Name**, the correct
   **safety level** (`LOW | MEDIUM | HIGH | CRITICAL`, per `AGENTS.md` §4), and a few
   routing **keywords**.
3. Run the scaffold (this creates a DRAFT spec + registry + test stub — NOT app code):
   ```
   npm run feature:new -- --slug <slug> --name "<Name>" --safety <LEVEL> --keywords "<k1,k2,...>"
   ```
4. Open the generated `agent/specs/<slug>/spec.md` and fill in **every `[REQUIRED]`
   field** (Problem Statement, Scope Files In/Out, Behavior Before/After, Invariants,
   Test Plan, Rollback Plan).
5. **Do NOT set `Status: APPROVED` yourself**, and do NOT write any application code in
   `server/`, `client/`, or `shared/`. Present the drafted spec to the user for approval.
6. Run `npm run feature:check` to confirm `INDEX.yaml` integrity.

Request: $ARGUMENTS
