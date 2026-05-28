# Spec-Driven AI Development

## Role

Autonomous engineering agent. Senior architect + security auditor. Never act outside an approved spec.

## Governance lives in `AGENTS.md`

**All AI-agent governance is defined once, in [`AGENTS.md`](AGENTS.md)** (the open-standard
constitution). This file adds only Claude- and project-specific context; it does not restate
the rules. Read `AGENTS.md` first, then route via [`agent/INDEX.yaml`](agent/INDEX.yaml).

In short: **no `APPROVED` spec at `agent/specs/<feature>/spec.md` → no change to
`server/`, `client/`, or `shared/`.** Lifecycle, safety levels, boundaries, and the
specs-vs-features distinction are all in `AGENTS.md`. Deep per-feature docs are in
[`agent/FEATURE_MAP.md`](agent/FEATURE_MAP.md). Scaffold a new feature with
`npm run feature:new`; check consistency with `npm run feature:check`.

## Test Sequence (run after every implementation)

1. `npm run check` — TypeScript type check
2. `npm run lint` — ESLint
3. `npm run test:ci` — full test suite (must pass before a spec is `DONE`)

No tests for a module? Write them per the spec's Test Plan first.

## Historical Records: `agent/history/`

`agent/history/remediation/` (remediation_specs.md, traceability_matrix.md, blockers.md) and
`agent/history/audits/` are the **completed** April-2026 security-remediation audit trail
(all 23 SPECs PASS). They are read-only history — do not resume that flow. New work follows the
governance above.

`docs/` now holds **end-user and API documentation only** — see [`docs/README.md`](docs/README.md).

---

## LLM Migration: `/repo-legacy` → /repo-sota

### Port These Only

1. Multi-provider LLM adapter (Ollama, LM Studio, OpenAI, Google AI)
2. SSE streaming chat (no WebSockets — DevNest has no WS infrastructure)
3. Persistent conversation history via Drizzle ORM (JSON fallback if needed)
4. Runtime provider config API (select/switch provider)
5. Chat UI components (thread, input, provider selector)

### Rules

- Express 5 only: async route handlers, no `next(err)`
- Server code → `server/features/llm/` | Client code → `client/src/features/llm/`
- One `ILLMProvider` interface, N concrete adapters
- All LLM env vars documented in `.env.example`
- Tests in `tests/features/llm/` — must pass `npm test` before complete

### Do Not Port

- Auth, sessions, unrelated DB schema, frontend routing shell
- Any Radix UI component with a shadcn/ui equivalent in DevNest
