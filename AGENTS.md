# AGENTS.md — Constitution for AI Agents

> **This is the single source of truth for AI-agent governance in this repository.**
> It is the open-standard ([agents.md](https://agents.md)) entry point read by Codex,
> Cursor, Gemini CLI, Zed, Aider, Jules, and others. Claude Code (`CLAUDE.md`),
> GitHub Copilot (`.github/copilot-instructions.md`), and Gemini (`GEMINI.md`) all
> defer to this file. Read it fully before touching anything.

---

## 0. Prime Directive

**No approved spec = no change.**

You may not create, modify, rename, or delete any **application file**
(`server/`, `client/`, `shared/`) unless a spec exists at
`agent/specs/<feature>/spec.md` with `Status: APPROVED`.

Docs (`agent/`, `*.md`, `docs/`) and tests (`tests/`) are exempt — improve them freely.

---

## 1. Specs vs Features — know the difference

These two words are NOT interchangeable. This is the most common point of confusion.

|                 | **Feature** (a noun)                        | **Spec** (a work order)                          |
| --------------- | ------------------------------------------- | ------------------------------------------------ |
| **Answers**     | "What does the app _do_? Where's the code?" | "What am I _about to change_, under what rules?" |
| **Tense**       | Present — describes what **IS**             | Future — describes what **WILL CHANGE**          |
| **State**       | `STABLE` / `PARTIAL` (a condition)          | `DRAFT→…→DONE` (a workflow, see §3)              |
| **Lives in**    | `agent/INDEX.yaml` + `agent/FEATURE_MAP.md` | `agent/specs/<slug>/spec.md`                     |
| **Cardinality** | One feature ← many specs over its lifetime  | One spec → touches one (or few) features         |

> **Mnemonic:** Features are the building; specs are the work orders that build or
> remodel it. A `DONE` spec graduates into a `FEATURE_MAP.md` entry.

A third, optional artifact exists: a **sketch** — a `*.yaml` contract draft (see
`agent/specs/llm-migration/`). A sketch is _pre-spec_ planning, never approved to
implement. Promote a sketch to a real `spec.md` before writing code.

---

## 2. The Workflow

```
EXPLORE → SPEC → APPROVE → IMPLEMENT → TEST → EVAL
```

1. **EXPLORE** — Load `agent/INDEX.yaml`, match your task's keywords to a feature, note its safety level. Do not edit yet.
2. **SPEC** — Copy `agent/specs/TEMPLATE.md` to `agent/specs/<slug>/spec.md` (or run `npm run feature:new`). Fill every `[REQUIRED]` field.
3. **APPROVE** — Set `Status: APPROVED`. Without this, stop.
4. **IMPLEMENT** — Make only the change the spec describes. Touch only files listed in `Scope — Files In`.
5. **TEST** — `npm run check && npm run lint && npm run test:ci` must all pass.
6. **EVAL** — Write `agent/evaluations/<slug>/eval.md` with `Outcome: PASS|FAIL`.

Run `npm run feature:check` at any point to verify spec/feature-map consistency.

---

## 3. Spec Lifecycle

```
DRAFT → REVIEW → APPROVED → IN_PROGRESS → DONE
                    ↓
                REJECTED / BLOCKED
```

Only `APPROVED` specs may be implemented. `DONE` specs require an eval report.
`BLOCKED` specs must document the blocker before resuming.

---

## 4. Safety Levels (canonical — other docs link here)

Determine a change's safety from the feature's `safety:` in `agent/INDEX.yaml`.

| Level      | Applies to                                          | Required to merge                                      |
| ---------- | --------------------------------------------------- | ------------------------------------------------------ |
| `LOW`      | Isolated UI or config                               | Spec + 1 reviewer                                      |
| `MEDIUM`   | Business logic, API, new dependency                 | Spec + tests + 1 reviewer                              |
| `HIGH`     | Auth, admin, sessions, security middleware          | Spec + tests + security review + 2 reviewers           |
| `CRITICAL` | `shared/schema.ts`, `server/storage.ts`, migrations | Spec + tests + security review + architecture sign-off |

---

## 5. Hard Boundaries (never cross)

| Never                                                                         | Why                                      |
| ----------------------------------------------------------------------------- | ---------------------------------------- |
| Read or write `data/`                                                         | Runtime user data / PII                  |
| Commit or log `.env` / secrets                                                | Security violation                       |
| Delete or rename existing source files                                        | Breaking change without migration        |
| Remove or bypass `authenticate` / `requireAdmin`                              | Security regression                      |
| Delete existing tests                                                         | Destroys the safety net                  |
| Modify `.github/workflows/`, `dependabot.yml`, GitHub templates, or `.husky/` | CI/CD and repo automation are human-only |
| `console.log` in server code                                                  | Use the Winston `logger`                 |
| `Math.random()` for tokens/IDs                                                | Use `crypto.randomUUID()` / `nanoid`     |
| Skip Zod validation on API input                                              | All inputs must be Zod-parsed            |

Full permission matrix: `agent/CHANGE_POLICY.md`.

---

## 6. Where to look next

| Need                                     | Open                             |
| ---------------------------------------- | -------------------------------- |
| **Route a task to a feature**            | `agent/INDEX.yaml` (load first)  |
| Full onboarding + reading order          | `agent/README.md`                |
| Deep per-feature detail (APIs, debt)     | `agent/FEATURE_MAP.md`           |
| Operating checklist                      | `agent/AGENT_GUIDE.md`           |
| Permission matrix                        | `agent/CHANGE_POLICY.md`         |
| Spec rules + anti-patterns               | `agent/SDD_CONTROL.md`           |
| System architecture                      | `agent/architecture/OVERVIEW.md` |
| Project-specific context (LLM migration) | `CLAUDE.md`                      |

**Token tip:** read `agent/INDEX.yaml` first, then open only the one feature section
you need. Do not bulk-read every governance doc — this file is the contract; the rest
is reference.
