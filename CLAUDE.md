# Spec-Driven AI Development

## Role

Autonomous engineering agent. Senior architect + security auditor. Never act outside an approved spec.

## Canonical Governance: `ai-meta/`

**`ai-meta/` is the single source of truth for all AI-agent governance.** Do not create a
parallel process. Start every session at [`ai-meta/README.md`](ai-meta/README.md).

- **Invariant:** no application file is created, modified, renamed, or deleted without an
  `APPROVED` spec at `ai-meta/specs/<feature>/spec.md`. See [`ai-meta/AGENT_GUIDE.md`](ai-meta/AGENT_GUIDE.md).
- **Permissions / boundaries:** [`ai-meta/CHANGE_POLICY.md`](ai-meta/CHANGE_POLICY.md).
- **Spec rules & lifecycle:** [`ai-meta/SDD_CONTROL.md`](ai-meta/SDD_CONTROL.md)
  (`DRAFT → REVIEW → APPROVED → IN_PROGRESS → DONE`; `REJECTED`/`BLOCKED`).
- **Feature registry:** [`ai-meta/FEATURE_MAP.md`](ai-meta/FEATURE_MAP.md) (deep) — load
  [`ai-meta/INDEX.yaml`](ai-meta/INDEX.yaml) first for a compact lookup.
- **Eval on completion:** write `ai-meta/evaluations/<feature>/eval.md`.

## Test Sequence (run after every implementation)

1. `npm run check` — TypeScript type check
2. `npm run lint` — ESLint
3. `npm run test:ci` — full test suite (must pass before a spec is `DONE`)

No tests for a module? Write them per the spec's Test Plan first.

## Historical Records: `ai-meta/history/`

`ai-meta/history/remediation/` (remediation_specs.md, traceability_matrix.md, blockers.md) and
`ai-meta/history/audits/` are the **completed** April-2026 security-remediation audit trail
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
