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
├── README.md                     ← You are here. Entry point.
├── AGENT_GUIDE.md                ← Mandatory operating instructions for every AI agent.
├── SDD_CONTROL.md                ← Specification-Driven Development enforcement rules.
├── CHANGE_POLICY.md              ← What AI agents can and cannot touch.
│
├── architecture/
│   ├── OVERVIEW.md               ← Runtime topology, data-flow, security boundaries.
│   └── MODULE_MAP.md             ← File-to-logical-module mapping for every source file.
│
├── features/
│   ├── INDEX.md                  ← Full feature decomposition with safety levels.
│   └── authentication.md        ← Detailed feature file: Authentication subsystem.
│
├── specs/
│   ├── TEMPLATE.md               ← Canonical spec template. Copy for every new change.
│   └── authentication/
│       └── spec.md               ← Fully realized spec: JWT auth feature.
│
└── evaluations/
    ├── TEMPLATE.md               ← Canonical evaluation template.
    └── authentication/
        └── eval.md               ← Completed eval report: JWT auth feature.
```

---

## Reading Order for AI Agents
1. `AGENT_GUIDE.md`
2. `CHANGE_POLICY.md`
3. `SDD_CONTROL.md`
4. `architecture/OVERVIEW.md`
5. `architecture/MODULE_MAP.md`
6. `features/INDEX.md`
7. Feature file for the relevant subsystem (`features/<name>.md`)
8. Spec file for the planned change (`specs/<name>/spec.md`)
9. Prior eval reports (`evaluations/<name>/eval.md`)

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
