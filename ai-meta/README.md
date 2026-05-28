# AI Meta-Layer — DevNest-Vanilla

## Purpose
This directory is the control surface for AI-agent-driven development on this repository.
It contains no application code. It enforces safe, structured changes via
Specification-Driven Development (SDD) and Feature-Driven Development (FDD).

**CRITICAL:** No application file may be created, modified, renamed, or deleted without a
corresponding approved spec under `ai-meta/specs/`. See `AGENT_GUIDE.md`.

---

## Directory Map

```
ai-meta/
├── README.md                         ← You are here. Entry point.
├── AGENT_GUIDE.md                    ← Mandatory operating instructions for every AI agent.
├── AGENT_ROUTING.md                  ← Feature-based routing guide for AI agents.
├── SDD_CONTROL.md                    ← Specification-Driven Development enforcement rules.
├── CHANGE_POLICY.md                  ← What AI agents can and cannot touch.
├── FEATURE_MAP.md                    ← Comprehensive AI-readable feature registry (PRIMARY).
├── FEATURE_MAP_MAINTENANCE.md        ← Workflows and automation for feature map updates.
│
├── architecture/
│   ├── OVERVIEW.md                   ← Runtime topology, data-flow, security boundaries.
│   └── MODULE_MAP.md                 ← File-to-logical-module mapping for every source file.
│
├── features/
│   ├── INDEX.md                      ← Full feature decomposition with safety levels.
│   └── authentication.md            ← Detailed feature file: Authentication subsystem.
│
├── specs/
│   ├── TEMPLATE.md                   ← Canonical spec template. Copy for every new change.
│   └── authentication/
│       └── spec.md                   ← Fully realized spec: JWT auth feature.
│
└── evaluations/
    ├── TEMPLATE.md                   ← Canonical evaluation template.
    └── authentication/
        └── eval.md                   ← Completed eval report: JWT auth feature.
```

---

## Reading Order for AI Agents

**Quick Start (Feature-based workflow):**
1. `FEATURE_MAP.md` — Start here for comprehensive feature overview
2. `AGENT_ROUTING.md` — Determine which feature(s) your task involves
3. Feature details in `FEATURE_MAP.md` — Deep dive into relevant features
4. Related detailed docs — Feature files, specs, architecture as needed

**Comprehensive Reading Order:**
1. `AGENT_GUIDE.md` — Operating instructions and pre-flight checklist
2. `CHANGE_POLICY.md` — Boundaries and what can be modified
3. `SDD_CONTROL.md` — Specification-driven development rules
4. `FEATURE_MAP.md` — **PRIMARY REFERENCE** for all features
5. `AGENT_ROUTING.md` — How to route requests to features
6. `architecture/OVERVIEW.md` — System architecture and topology
7. `architecture/MODULE_MAP.md` — File-to-module mapping
8. `features/INDEX.md` — Feature index with safety levels
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
