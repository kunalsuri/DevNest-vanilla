# Change Policy — AI Agent Permissions

## 1. Permitted Actions (SAFE)

AI agents MAY perform the following without special approval beyond the standard spec:

| Action | Scope |
|---|---|
| Add new files | Under `ai-meta/` only — no approval gate |
| Modify UI components | `client/src/components/` and `client/src/features/*/components/` |
| Add new pages | `client/src/pages/` — requires MEDIUM spec |
| Add new hooks | `client/src/features/*/hooks/` |
| Add new API routes | `server/api/` — requires MEDIUM spec |
| Add new services | `server/services/` — requires MEDIUM spec |
| Add/modify tests | `tests/` — encouraged, no gate |
| Update documentation | `docs/`, `*.md` in repo root |
| Fix linting/formatting | `ai-meta/` docs only — no spec required; application files require at minimum a LOW spec |

---

## 2. Restricted Actions (REQUIRE APPROVED SPEC)

| Action | Safety Level | Notes |
|---|---|---|
| Modify `shared/schema.ts` | CRITICAL | Breaks client/server type contract |
| Modify `server/storage.ts` | CRITICAL | Affects all persistence |
| Modify `server/auth/` | HIGH | JWT, CSRF, session logic |
| Modify `server/index.ts` | HIGH | Express app bootstrap + security middleware |
| Modify `server/middleware/` | HIGH | Cross-cutting request handling |
| Add/remove dependencies (`package.json`) | MEDIUM | Supply chain risk |
| Modify `server/env.ts` | HIGH | Environment variable contract |
| Modify `drizzle.config.ts` | CRITICAL | Database migration config |
| Modify `vite.config.ts` or `tsconfig.json` | MEDIUM | Build config changes |
| Modify `eslint.config.js` | LOW | Linting rules |

---

## 3. Forbidden Actions (NEVER)

AI agents MUST NOT under any circumstances:

| Action | Reason |
|---|---|
| Read or write files under `data/` | Runtime user data — contains PII |
| Commit `.env` or any secret | Security violation |
| Delete or rename existing source files | Breaking change without migration path |
| Remove or skip `authenticate`/`requireAdmin` middleware | Security regression |
| Remove existing tests | Destroys safety net |
| Modify `.github/` directory | CI/CD configuration — human-only |
| Modify `.husky/` hooks | Pre-commit safety — human-only |
| Use `console.log` in server code | Use `logger` (Winston) exclusively |
| Use `Math.random()` for tokens/IDs | Use `crypto.randomUUID()` or `nanoid` |
| Store plain-text passwords | Use `bcryptjs` hashing exclusively |
| Bypass Zod validation on any API input | All API inputs must be Zod-parsed |

---

## 4. Scope Creep Prevention

When implementing a spec, the following heuristics detect out-of-scope drift:

1. If you find yourself modifying a file NOT listed in `Scope — Files In`, STOP.
2. If a fix requires changing the `IStorage` interface, escalate to a CRITICAL spec.
3. If a UI change requires a new API endpoint, open a separate MEDIUM spec first.
4. If a dependency must be added, document it in the spec's `Dependencies` field and
   confirm with a human reviewer before running `npm install`.

---

## 5. Audit Trail Requirements

Every merged change that was spec-driven must include:

1. Link to spec file in the PR description.
2. Link to eval report in the PR description (post-merge if eval is done after).
3. Spec `Status` updated to `DONE`.
4. Eval `Outcome` set to `PASS` or `FAIL` with justification.
