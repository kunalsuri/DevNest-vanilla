# AI Meta-Layer — DevNest-Vanilla

## Purpose
This directory is the control surface for AI-agent-driven development on this repository.
It contains no application code. It enforces safe, structured changes via
Specification-Driven Development (SDD) and Feature-Driven Development (FDD).

**CRITICAL:** No application file may be created, modified, renamed, or deleted without a
corresponding approved spec under `ai-meta/specs/`. See `AGENT_GUIDE.md`.

---

## 🚦 Start Here

**→ First time working with this repository?**
1. Read this README entirely (you are here)
2. Follow **"Comprehensive Reading Order"** below (~30 minutes)
3. Steps 1-4 are **MANDATORY** (safety rules and process)

**→ Already onboarded and have a specific task?**
1. Use **"Quick Start (Feature-based workflow)"** below (~20 minutes)
2. Prerequisites: Must have read `AGENT_GUIDE.md` at least once

**→ Unsure which path to take?**
Choose **Comprehensive Reading Order** (better safe than sorry)

---

## Directory Map

```
ai-meta/
├── README.md                         ← You are here. Entry point.
├── INDEX.yaml                        ← LOAD FIRST. Compact registry: keywords, safety, files.
├── AGENT_GUIDE.md                    ← Mandatory operating instructions for every AI agent.
├── AGENT_ROUTING.md                  ← How to route a request to a feature (uses INDEX.yaml).
├── SDD_CONTROL.md                    ← Specification-Driven Development enforcement rules.
├── CHANGE_POLICY.md                  ← What AI agents can and cannot touch.
├── FEATURE_MAP.md                    ← Deep per-feature docs: APIs, deps, tech debt (PRIMARY).
├── FEATURE_MAP_MAINTENANCE.md        ← Workflows and automation for feature map updates.
│
├── architecture/
│   ├── OVERVIEW.md                   ← Runtime topology, data-flow, security boundaries.
│   ├── MODULE_MAP.md                 ← File-to-logical-module mapping for every source file.
│   └── state-management-strategy.md  ← Engineering decision record: client/server state.
│
├── features/
│   ├── INDEX.md                      ← Thin pointer to INDEX.yaml + FEATURE_MAP.md.
│   └── authentication.md            ← Detailed feature file: Authentication subsystem.
│
├── specs/
│   ├── TEMPLATE.md                   ← Canonical spec template. Copy for every new change.
│   ├── authentication/
│   │   └── spec.md                   ← Fully realized spec: JWT auth feature.
│   └── llm-migration/                ← Forward-looking FDD specs for the LLM migration (CLAUDE.md).
│
├── evaluations/
│   ├── TEMPLATE.md                   ← Canonical evaluation template.
│   └── authentication/
│       └── eval.md                   ← Completed eval report: JWT auth feature.
│
└── history/                          ← Read-only record of completed governance cycles.
    ├── audits/                       ← Past security/readiness audit reports.
    └── remediation/                  ← Completed remediation specs + traceability matrix.
```

---

## Reading Order for AI Agents

### Quick Start (Feature-based workflow)

**Time estimate:** ~10 minutes | **Token estimate:** ~3,000 tokens
**Prerequisites:** Must have read `AGENT_GUIDE.md` at least once
**Best for:** Agents with a specific task who understand the rules

1. `INDEX.yaml` — **Load first.** Match your task's keywords to a feature; note its safety level.
2. `AGENT_ROUTING.md` — Only if the request spans multiple features.
3. `FEATURE_MAP.md` — Open **only the matched feature's section** for full detail.
4. Related docs — feature file, spec, architecture, as needed.

---

### Comprehensive Reading Order

**Time estimate:** ~30 minutes | **Token estimate:** ~30,000 tokens
**Best for:** First-time agents or comprehensive codebase understanding

**Phase 1: Safety & Process (MANDATORY — ~10 minutes)**

1. **[MANDATORY]** `AGENT_GUIDE.md` — Operating instructions and pre-flight checklist
2. **[MANDATORY]** `CHANGE_POLICY.md` — Boundaries and what can be modified
3. **[MANDATORY]** `SDD_CONTROL.md` — Specification-driven development rules
4. **[MANDATORY]** `FEATURE_MAP.md` — **PRIMARY REFERENCE** for all features

**Phase 2: System Understanding (~15 minutes)**

5. `INDEX.yaml` — Compact feature registry (keywords, safety, files) — your routing index
6. `AGENT_ROUTING.md` — How to route requests to features (procedure + multi-feature cases)
7. `architecture/OVERVIEW.md` — System architecture and topology
8. `architecture/MODULE_MAP.md` — File-to-module mapping

**Phase 3: Task-Specific Deep Dive (as needed)**

9. Feature file for the relevant subsystem (`features/<name>.md`) — Detailed feature docs
10. Spec file for the planned change (`specs/<name>/spec.md`) — Implementation specs
11. Prior eval reports (`evaluations/<name>/eval.md`) — Evaluation history

---

## Stack Summary
| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20, ESM modules |
| Server | Express 5, TypeScript |
| Client | React 19, Vite 7, Wouter, TanStack Query |
| Schema / Validation | Drizzle ORM (type-gen only), Zod |
| Storage | FileStorage — JSON files in `data/` (no DB in default mode) |
| Auth | JWT (access + refresh) + CSRF tokens + bcrypt |
| Observability | Winston, Sentry, custom tracing middleware |
| Testing | Vitest, Testing Library, Supertest |
| CI tooling | ESLint, Prettier, Husky, lint-staged |

---

## ✅ Onboarding Complete Checkpoint

**You are ready to work when you can answer these questions:**

1. **What is the spec lifecycle?**
   - Answer: `DRAFT → REVIEW → APPROVED → IN_PROGRESS → DONE` (or `REJECTED`/`BLOCKED`)

2. **What safety level is the Storage Layer (F-12)?**
   - Answer: `CRITICAL`

3. **Where are user authentication routes located?**
   - Answer: `server/auth/jwt-auth-routes.ts`

4. **Can I modify `.github/workflows/` directly?**
   - Answer: `No` (restricted, requires review)

5. **Where do I find the comprehensive feature registry?**
   - Answer: `ai-meta/FEATURE_MAP.md`

**If you can answer all 5 questions correctly, you are ready to receive tasks.**

**If not:** Review the documents in the Comprehensive Reading Order, focusing on steps 1-4.
