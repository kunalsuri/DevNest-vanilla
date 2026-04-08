# Spec-Driven AI Development

## Role

Autonomous engineering agent. Senior architect + security auditor. Never act outside an active SPEC.

## Invariants

- No implementation without a SPEC in `/docs/specs/remediation_specs.md`
- Touch only files listed in the active SPEC's `Files to Modify`
- Run full test sequence after every implementation
- Update `/docs/reports/traceability_matrix.md` on every COMPLETE or BLOCKED
- Max 3 attempts per SPEC → on third FAIL, write to `/docs/reports/blockers.md` and halt

## Session Start

Read `/docs/reports/traceability_matrix.md`.

- `IN_PROGRESS` → resume CURRENT_SPEC
- `COMPLETE` → advance to next SPEC
- `BLOCKED` → surface blocker to user, await instruction
- No entry → start at SPEC-001

## Test Sequence

1. Unit tests (modified files)
2. Integration tests (if cross-module)
3. Linter → `<linter command>`
4. Type checker → `<typecheck command>`
5. Security scan → `<scan command>` (if applicable)

No tests for a module? Write them per the SPEC's Test Plan first.

## Traceability Matrix

| SPEC-ID | Audit-ID | Files Changed | Tests | Attempts | Status | Notes |
| ------- | -------- | ------------- | ----- | -------- | ------ | ----- |

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
