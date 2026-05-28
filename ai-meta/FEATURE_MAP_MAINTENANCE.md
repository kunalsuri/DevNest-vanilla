# Feature Map Maintenance Guide

> **Purpose:** Keep [`FEATURE_MAP.md`](FEATURE_MAP.md) and [`INDEX.yaml`](INDEX.yaml) accurate.
> **Last Updated:** 2026-05-28

---

## Two files to keep in sync

| File | Holds | Update when |
|---|---|---|
| [`INDEX.yaml`](INDEX.yaml) | id, name, safety, status, keywords, file paths | files move/rename, status or safety changes, feature added/removed |
| [`FEATURE_MAP.md`](FEATURE_MAP.md) | APIs, dependencies, test coverage, tech debt, roadmap | any of the above plus API/dep/debt changes |

Update **both in the same PR** as the code change. Update the `Last Updated` date in each.

---

## Mandatory update triggers

Update the feature map in the same PR when you:

1. **Add or remove a feature** — new `INDEX.yaml` entry + new `FEATURE_MAP.md` section.
2. **Change status** — `STABLE ⇄ PARTIAL` (or add `EXPERIMENTAL`/`DEPRECATED`).
3. **Change safety level** — after a security review reassesses risk, or auth requirements change.
4. **Add/remove/break an API** — update the feature's API list.
5. **Create or resolve tech debt** — keep the Tech Debt / Known Limitations sections current.
6. **Move or rename files** — update `server`/`client` paths in `INDEX.yaml`.
7. **Change feature dependencies** — update the dependency notes in `FEATURE_MAP.md`.

---

## Update process

**Before:** read the feature's section in `FEATURE_MAP.md`; note current status, deps, tech debt.

**After implementation, review these fields:**

- [ ] Status accurate (`STABLE`/`PARTIAL`)
- [ ] Safety level still correct
- [ ] File paths in `INDEX.yaml` exist and are complete
- [ ] API list matches actual routes
- [ ] Dependencies, tech debt, known limitations current
- [ ] `Last Updated` date bumped in both files

**Validate before committing:**

```bash
npm run check   # TypeScript
npm run lint    # ESLint
npm run test:ci # full suite
```

Spot-check that every path you listed in `INDEX.yaml` actually exists.

---

## Tech-debt descriptions: be specific

- Bad: "Needs improvement"
- Good: "Email delivery not implemented — password-reset tokens generated but not sent"

---

## Future automation (proposed — not yet built)

None of these exist today; they are candidates if maintenance becomes burdensome:

- A `scripts/validate-feature-map.ts` that checks every `INDEX.yaml` path exists, compares
  documented APIs against scanned route files, and flags staleness — wired to a
  `validate:feature-map` npm script and a pre-commit / CI gate.
- Auto-generated API and file inventories from route/glob scans.

If you build any of these, document the new npm script here and remove it from this list.

---

## Related

- [FEATURE_MAP.md](FEATURE_MAP.md) · [INDEX.yaml](INDEX.yaml) · [AGENT_GUIDE.md](AGENT_GUIDE.md) · [CHANGE_POLICY.md](CHANGE_POLICY.md)
