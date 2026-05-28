# `agent/` — AI Agent Reference Layer — DevNest-Vanilla

> **The constitution lives at [`/AGENTS.md`](../AGENTS.md)** (repo root). Read it first.
> This directory holds the _deep reference_ that `AGENTS.md` points to.

## Purpose

This directory is the reference layer for AI-agent-driven development on this repository.
It contains no application code. It enforces safe, structured changes via
Specification-Driven Development (SDD) and Feature-Driven Development (FDD).

**CRITICAL:** No application file may be created, modified, renamed, or deleted without a
corresponding approved spec under `agent/specs/`. See `AGENT_GUIDE.md`.

---

## Specs vs Features (read this once)

The two words are not interchangeable — conflating them is the #1 source of confusion.

|           | **Feature** (a noun)             | **Spec** (a work order)               |
| --------- | -------------------------------- | ------------------------------------- |
| Answers   | "What does the app _do_?"        | "What am I _about to change_?"        |
| Describes | what **IS** (`STABLE`/`PARTIAL`) | what **WILL CHANGE** (`DRAFT→…→DONE`) |
| Lives in  | `INDEX.yaml` + `FEATURE_MAP.md`  | `specs/<slug>/spec.md`                |

> **Mnemonic:** Features are the building; specs are the work orders. A `DONE` spec
> graduates into a `FEATURE_MAP.md` entry. Full table + the optional _sketch_ artifact:
> [`/AGENTS.md` §1](../AGENTS.md).

---

## 🚦 Start Here

**→ First time, or any task at all?**

1. Read **[`/AGENTS.md`](../AGENTS.md)** — the constitution (mandatory, ~1,500 tokens).
2. Skim this README's **"Specs vs Features"** box and **Directory Map** below.
3. Follow the **"Default path"** in _Reading Order_ below — load `INDEX.yaml`, then open
   only the feature section you need.

**→ Already know the rules?**
Jump straight to `INDEX.yaml`, match keywords, open the one feature you're touching.
Everything else is on-demand reference (see the table in _Reading Order_).

---

## Directory Map

```
agent/
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

> **Only one document is mandatory: [`/AGENTS.md`](../AGENTS.md)** (the constitution,
> ~1,500 tokens). Everything below is _on-demand reference_ — open a file only when your
> task needs it. Do not bulk-read this directory; that is the token trap this layout exists
> to avoid.

### Default path (have a task, know the rules)

**~3,000 tokens.** You've read `AGENTS.md`. Now:

1. `INDEX.yaml` — **Load first.** Match your task's keywords to a feature; note its safety level.
2. `AGENT_ROUTING.md` — Only if the request spans multiple features.
3. `FEATURE_MAP.md` — Open **only the matched feature's section** for full detail.
4. Related docs — feature file, spec, architecture — as needed.

### Reference docs (open when relevant)

| When you need…                                             | Read                         |
| ---------------------------------------------------------- | ---------------------------- |
| The operating checklist (pre-flight / post-implementation) | `AGENT_GUIDE.md`             |
| The full permission matrix                                 | `CHANGE_POLICY.md`           |
| Spec rules, fields, and anti-patterns                      | `SDD_CONTROL.md`             |
| System topology / data flow                                | `architecture/OVERVIEW.md`   |
| File-to-module mapping                                     | `architecture/MODULE_MAP.md` |
| Deep narrative on a subsystem                              | `features/<name>.md`         |
| The spec you're implementing                               | `specs/<slug>/spec.md`       |
| Prior evaluation history                                   | `evaluations/<slug>/eval.md` |

---

## Stack Summary

| Layer               | Technology                                                  |
| ------------------- | ----------------------------------------------------------- |
| Runtime             | Node.js ≥ 20, ESM modules                                   |
| Server              | Express 5, TypeScript                                       |
| Client              | React 19, Vite 7, Wouter, TanStack Query                    |
| Schema / Validation | Drizzle ORM (type-gen only), Zod                            |
| Storage             | FileStorage — JSON files in `data/` (no DB in default mode) |
| Auth                | JWT (access + refresh) + CSRF tokens + bcrypt               |
| Observability       | Winston, Sentry, custom tracing middleware                  |
| Testing             | Vitest, Testing Library, Supertest                          |
| CI tooling          | ESLint, Prettier, Husky, lint-staged                        |

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
   - Answer: `agent/FEATURE_MAP.md`

**If you can answer all 5 questions correctly, you are ready to receive tasks.**

**If not:** Re-read [`/AGENTS.md`](../AGENTS.md), then the _Reading Order_ section above.
