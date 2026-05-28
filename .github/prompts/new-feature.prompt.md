---
mode: "agent"
description: "Scaffold a new spec-driven feature: DRAFT spec + INDEX.yaml entry + FEATURE_MAP section + test stub. Enforces AGENTS.md governance."
---

Scaffold a new feature for this repository the spec-driven way. **Governance is defined in
[`/AGENTS.md`](../../AGENTS.md) — read it first.**

### Steps

1. From the user's request, derive:
   - a **kebab-case slug** (e.g. `team-billing`),
   - a human-readable **Name** (e.g. `Team Billing`),
   - the correct **safety level** (`LOW | MEDIUM | HIGH | CRITICAL`, per `AGENTS.md` §4),
   - a few routing **keywords**.

2. Run the scaffold (creates a DRAFT spec, not application code):

   ```bash
   npm run feature:new -- --slug <slug> --name "<Name>" --safety <LEVEL> --keywords "<k1,k2,...>"
   ```

3. Open `agent/specs/<slug>/spec.md` and complete **every `[REQUIRED]` field**:
   Problem Statement, Scope (Files In / Files Out), Behavior (Before / After),
   Invariants, Test Plan, and Rollback Plan.

4. **Do NOT set `Status: APPROVED` yourself** and **do NOT write any code in
   `server/`, `client/`, or `shared/`** until the spec is approved by a human reviewer.

5. Verify consistency:

   ```bash
   npm run feature:check
   ```

### Rules

- The prime directive (`AGENTS.md` §0) applies: no app code without an APPROVED spec.
- Respect the safety level's review requirements (`AGENTS.md` §4).
- Keep the change within the spec's declared scope.
