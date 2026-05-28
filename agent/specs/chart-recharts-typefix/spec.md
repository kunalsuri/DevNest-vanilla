# Spec: Chart Recharts Type Fix

---

## Spec Header

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Feature**      | Chart Recharts Type Fix                                        |
| **Feature ID**   | F-16                                                           |
| **Spec Version** | 1.0                                                            |
| **Status**       | DONE                                                           |
| **Safety Level** | LOW                                                            |
| **Author**       | kunalsuri                                                      |
| **Date**         | 2026-05-28                                                     |
| **Related Spec** | None (depends on feature F-08 Dashboard, which renders charts) |

---

## 1. Problem Statement [REQUIRED]

`client/src/components/ui/chart.tsx` is a shadcn/ui chart wrapper written against the
Recharts **v2** type surface, but the project ships Recharts **v3** (`recharts@^3.8.1`).
In v3, `Tooltip`'s public props (`React.ComponentProps<typeof Tooltip>` → `TooltipProps`)
deliberately _omit_ the values injected from chart context (`payload`, `label`,
`coordinate`, `active`, …) — those are now only present on the separate
`TooltipContentProps` passed to a custom content renderer. Likewise `LegendProps` does
`Omit<…, 'payload' | 'verticalAlign'>` and re-adds only `verticalAlign`, so the legend
payload type is the exported `LegendPayload`. Because the component reads `payload`/`label`
off the wrong (v2-shaped) types, `npm run check` (tsc) fails with ~9 errors confined to
this file (TS2339 on `payload`/`label`/`length`/`map`, TS7006 implicit-any on the
`.map((item, index) => …)` callbacks, TS2344 on `Pick<LegendProps, "payload" | …>`).
This is a CI-gating failure: `.github/workflows/ci.yml`'s `lint-and-typecheck` job runs
`npm run check`, so `main` is red.

---

## 2. Scope

### 2.1 Files In — Will Be Modified [REQUIRED]

- `client/src/components/ui/chart.tsx`

### 2.2 Files Out — Will NOT Be Modified [REQUIRED]

- The `recharts` dependency version in `package.json` — we adapt our types to the
  installed v3, we do **not** downgrade Recharts.
- Any other component under `client/src/components/ui/` — the type drift is isolated to
  the chart wrapper.
- `.github/workflows/ci.yml` — CI/CD is human-only (AGENTS.md §5).

### 2.3 New Files (if any)

- `tests/features/chart-recharts-typefix/chart-recharts-typefix.test.ts` (replaces the
  scaffolded `it.todo` stub with a real render + export smoke test).
- `agent/evaluations/chart-recharts-typefix/eval.md` (created at the EVAL step).

---

## 3. Behavior Specification

### 3.1 Before (Current Behavior) [REQUIRED]

- `npm run check` exits 1 with ~9 TypeScript errors, all in
  `client/src/components/ui/chart.tsx` (lines ~119, 124, 188, 264, 275, 288).
- CI `lint-and-typecheck` job fails; `main` is red.
- Runtime behavior of charts is unaffected — this is purely a compile-time type mismatch.

### 3.2 After (Target Behavior) [REQUIRED]

- `npm run check` exits 0 (no TypeScript errors).
- `ChartTooltipContent` types its context-injected props (`payload`, `label`) via the
  Recharts-exported `TooltipContentProps`; `payload` is `TooltipPayload`
  (`ReadonlyArray<TooltipPayloadEntry>`), so the `.map((item, index) => …)` callback
  params are inferred, not implicit `any`.
- `ChartLegendContent` types `payload` as `ReadonlyArray<LegendPayload>` and keeps
  `verticalAlign` via `Pick<LegendProps, "verticalAlign">`.
- No `any` casts are introduced; types come from Recharts' own exported declarations.
- Rendered DOM/props of the chart components are byte-for-byte unchanged (no JSX or
  runtime-logic edits — type annotations only).

### 3.3 Invariants (Must Remain True) [REQUIRED]

- The public export surface of `chart.tsx` is unchanged: `ChartContainer`,
  `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`,
  `ChartStyle`.
- `<ChartTooltipContent />` and `<ChartLegendContent />` remain usable with **no**
  required props (Recharts injects `payload`/`active`/`label` at render time), so all
  injected props stay optional on our component's prop type.
- No runtime behavior change. The only JSX edit is the tooltip row's React `key`,
  changed from `item.dataKey` to the loop `index`: once `item` is properly typed,
  `item.dataKey` is `DataKey<any>` (which includes a function form) and is no longer a
  valid React `key`. `index` is unique within the render-stable payload array, so
  reconciliation output is unchanged. Everything else is type annotations only.
- Existing authenticated endpoints continue to require valid JWT. (N/A — no server change.)
- All API inputs remain Zod-validated. (N/A — no API surface touched.)

---

## 4. API Contract [Required if API changes]

N/A — no HTTP API is added or modified. This is a client-only, compile-time type fix.

---

## 5. Schema Changes [Required if schema changes]

N/A — `shared/schema.ts` is not touched. No migration required.

---

## 6. Security Considerations

- [x] No new unauthenticated attack surface introduced (client-only type annotations).
- [x] No user input handling changed; nothing to Zod-validate here.
- [x] No secrets committed or logged.
- [x] No auth middleware involved or bypassed.
- [x] `dangerouslySetInnerHTML` in `ChartStyle` is pre-existing and **not** modified;
      its inputs (theme/colour config) are unchanged by this spec.

---

## 7. Test Plan [REQUIRED]

### Unit Tests

| Test File                                                              | Test Case                                                                                           | Expected Outcome                                       |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `tests/features/chart-recharts-typefix/chart-recharts-typefix.test.ts` | All named exports from `@/components/ui/chart` are defined                                          | Pass — module imports & evaluates cleanly under jsdom  |
| `tests/features/chart-recharts-typefix/chart-recharts-typefix.test.ts` | `ChartContainer` renders a `[data-chart]` wrapper and a `<style>` block when config carries colours | Pass — wrapper + injected CSS variables present in DOM |

### Integration Tests

| Test File              | Test Case                                 | Expected Outcome                                                                                                                  |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| (the typecheck itself) | `npm run check` (tsc) over the whole repo | Pass — 0 errors; this is the authoritative regression guard for a type-only fix, and is enforced in CI's `lint-and-typecheck` job |

### Manual Verification Steps

1. `npm run check` → exits 0.
2. `npm run lint` → exits 0 (no new ESLint errors; no `any` introduced).
3. `npm run test:ci` → full suite green.

---

## 8. Rollback Plan [REQUIRED for MEDIUM and above]

LOW safety — rollback is trivial: `git revert` the implementing commit. The change is a
self-contained edit to one file's type annotations plus an additive test; reverting
restores the prior (red) typecheck state with no data or schema implications.

---

## 9. Dependencies

| Type        | Name     | Version                    | Reason                                                                                                                           |
| ----------- | -------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| npm package | recharts | ^3.8.1 (already installed) | Source of the corrected `TooltipContentProps`, `TooltipPayload`, `LegendProps`, `LegendPayload` type exports. No version change. |

---

## 10. Assumptions

- [x] Recharts stays at v3 (`^3.8.1`); the fix targets the v3 type API. If Recharts were
      downgraded to v2 later, these annotations would need revisiting — but a downgrade is
      explicitly out of scope.
- [x] `chart.tsx` has no external call sites in the repo today (verified via grep), so
      narrowing the prop types cannot break other components.

---

## 11. Reviewer Sign-Off

| Role                       | Name             | Approved? | Date       |
| -------------------------- | ---------------- | --------- | ---------- |
| Author                     | kunalsuri        | Yes       | 2026-05-28 |
| Reviewer 1                 | kunalsuri        | Yes       | 2026-05-28 |
| Reviewer 2 (HIGH/CRITICAL) | N/A (LOW safety) | —         | —          |
