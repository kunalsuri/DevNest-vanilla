# Feature Map Maintenance Guide

> **Purpose:** Workflows and automation strategies for keeping the feature map current.
> **Last Updated:** 2026-05-28

---

## Overview

This guide defines:
- When and how to update the feature map
- Automation opportunities
- Validation workflows
- CI integration strategies
- Maintenance schedules

---

## Update Triggers

### Mandatory Updates

The feature map **MUST** be updated in the same PR when:

1. **Adding a new feature**
   - Create new feature entry with all fields
   - Add to dependency graph
   - Update cross-cutting concerns if applicable

2. **Changing feature status**
   - EXPERIMENTAL → STABLE (after thorough testing)
   - STABLE → PARTIAL (when regressions occur)
   - PARTIAL → STABLE (when implementation completes)
   - Any status → DEPRECATED (when sunsetting)

3. **Modifying safety level**
   - After security audit changes risk assessment
   - When adding/removing auth requirements
   - When touching critical paths

4. **Adding or removing major APIs**
   - New endpoints
   - Removed endpoints
   - Breaking API changes

5. **Identifying new technical debt**
   - During code review
   - When discovering limitations
   - After incident post-mortems

6. **Completing tech debt items**
   - Remove from Tech Debt column
   - Update Known Limitations if resolved
   - Update Roadmap if milestone reached

7. **Adding or removing database tables/files**
   - New storage structures
   - Schema changes
   - Migration to different storage

8. **Changing feature dependencies**
   - New internal dependencies
   - Removed dependencies
   - Dependency direction changes

---

### Optional Updates

Consider updating for:

1. **Minor bug fixes** — Only if they affect documented Known Limitations
2. **Refactoring** — Only if it changes Related Files significantly
3. **Test additions** — When filling documented coverage gaps
4. **Documentation improvements** — When adding JSDoc/comments doesn't warrant feature map changes
5. **Configuration changes** — Unless they affect feature behavior

---

## Update Process

### Step-by-Step Workflow

#### 1. Before Implementation

```bash
# Read relevant feature documentation
cat ai-meta/FEATURE_MAP.md | grep -A 50 "F-0X"

# Check current status and tech debt
# Understand dependencies
```

**Agent Checklist:**
- [ ] Identified relevant feature(s)
- [ ] Read current feature state
- [ ] Reviewed dependencies
- [ ] Noted existing tech debt

---

#### 2. During Implementation

As you work, note:
- Any deviations from documented behavior
- New limitations discovered
- Additional dependencies needed
- Technical debt created or resolved

**Keep notes in memory or temp file:**
```
/tmp/feature-map-updates.md

Changes for F-01:
- Added email delivery service (resolves tech debt)
- New dependency on nodemailer
- Updated test coverage to include email tests
```

---

#### 3. After Implementation

Update the feature map:

```bash
# Edit the feature map
vim ai-meta/FEATURE_MAP.md

# Update the relevant feature section
# Update dependency graph if needed
# Update cross-cutting concerns if applicable
```

**Fields to review:**
- [ ] Status (changed?)
- [ ] Tech Debt (added/removed items?)
- [ ] Known Limitations (added/resolved?)
- [ ] Test Coverage (improved?)
- [ ] APIs (added/removed?)
- [ ] Dependencies (changed?)
- [ ] Roadmap (milestone reached?)

---

#### 4. Before PR Merge

**Validation checklist:**
- [ ] All related files exist (check Related Files section)
- [ ] API list matches actual endpoints
- [ ] Dependency graph updated
- [ ] Status accurately reflects implementation
- [ ] Tech debt column reflects current state
- [ ] Test coverage claims are accurate

**Run validation:**
```bash
# Type check
npm run check

# Lint
npm run lint

# Format
npm run format

# Optional: Validate feature map (future)
# npm run validate:feature-map
```

---

#### 5. Periodic Review

**Schedule:** Quarterly (every 3 months)

**Review items:**
- [ ] All feature statuses accurate
- [ ] Tech debt items still valid
- [ ] Known limitations still apply
- [ ] Roadmap items updated
- [ ] Dependencies current
- [ ] Cross-cutting concerns complete

---

## Automation Strategies

### Current State (Manual)

All feature map updates are currently manual. Developers must:
1. Remember to update the feature map
2. Know which fields to update
3. Validate updates manually
4. Keep it in sync with code

**Pain points:**
- Easy to forget updates
- No validation of accuracy
- Staleness detection is manual
- No enforcement

---

### Phase 1: Validation Scripts (Near Term)

Implement validation to catch errors:

#### `scripts/validate-feature-map.ts`

```typescript
// Pseudo-code for validation script

// 1. Check file existence
for (const file of relatedFiles) {
  if (!exists(file)) {
    error(`File not found: ${file}`);
  }
}

// 2. Validate API endpoints
const declaredAPIs = parseFeatureMap();
const actualAPIs = scanRouteFiles();
const missing = declaredAPIs.filter(api => !actualAPIs.includes(api));
const undocumented = actualAPIs.filter(api => !declaredAPIs.includes(api));

if (missing.length > 0) {
  warn(`APIs documented but not found: ${missing.join(', ')}`);
}
if (undocumented.length > 0) {
  warn(`APIs exist but not documented: ${undocumented.join(', ')}`);
}

// 3. Check for staleness
const lastUpdated = parseLastUpdated('ai-meta/FEATURE_MAP.md');
const daysSince = Date.now() - lastUpdated;
if (daysSince > 90) {
  warn(`Feature map not updated in ${daysSince} days`);
}

// 4. Validate dependency graph
const dependencies = parseDependencyGraph();
const cycles = detectCycles(dependencies);
if (cycles.length > 0) {
  error(`Circular dependencies detected: ${cycles}`);
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "validate:feature-map": "tsx scripts/validate-feature-map.ts"
  }
}
```

---

### Phase 2: CI Integration (Medium Term)

Add feature map validation to CI pipeline:

#### `.github/workflows/validate-feature-map.yml`

```yaml
name: Validate Feature Map

on:
  pull_request:
    paths:
      - 'ai-meta/FEATURE_MAP.md'
      - 'server/**/*.ts'
      - 'client/**/*.tsx'
      - 'shared/**/*.ts'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run validate:feature-map

      # Check if feature map was updated
      - name: Check for feature map update
        run: |
          if git diff --name-only origin/main | grep -qE '^(server|client|shared)/'; then
            if ! git diff --name-only origin/main | grep -q 'ai-meta/FEATURE_MAP.md'; then
              echo "❌ Code changes detected but feature map not updated"
              exit 1
            fi
          fi
```

**Benefits:**
- Catches missing feature map updates
- Validates file existence
- Detects API drift
- Enforces staleness limits

---

### Phase 3: Auto-generation (Long Term)

Automatically generate portions of the feature map:

#### API Inventory Generation

```typescript
// scripts/generate-api-inventory.ts

import { scanRouteFiles } from './utils/route-scanner';
import { updateFeatureMap } from './utils/feature-map-updater';

// Scan all route files
const apis = scanRouteFiles([
  'server/auth/',
  'server/api/',
  'server/profile.ts',
  'server/health.ts',
]);

// Update feature map with discovered APIs
for (const [feature, endpoints] of Object.entries(apis)) {
  updateFeatureMap(feature, { apis: endpoints });
}
```

#### File Inventory Generation

```typescript
// scripts/generate-file-inventory.ts

import { glob } from 'glob';
import { analyzeImports } from './utils/import-analyzer';

// Scan for files by feature
const featureFiles = {
  'F-01': {
    backend: glob.sync('server/auth/**/*.ts'),
    frontend: glob.sync('client/src/features/auth/**/*'),
    shared: ['shared/schema.ts'],
  },
  // ... other features
};

// Validate against feature map
validateFileInventory(featureFiles);
```

#### Dependency Graph Generation

```typescript
// scripts/generate-dependency-graph.ts

import { analyzeImports } from './utils/import-analyzer';

// Analyze all TypeScript files
const dependencies = analyzeImports([
  'server/**/*.ts',
  'client/src/**/*.tsx',
  'shared/**/*.ts',
]);

// Build feature dependency graph
const featureDeps = buildFeatureDependencyGraph(dependencies);

// Update feature map
updateDependencyGraph(featureDeps);
```

#### Test Coverage Extraction

```typescript
// scripts/extract-test-coverage.ts

import { readCoverageReport } from './utils/coverage-parser';

// Parse Vitest coverage report
const coverage = readCoverageReport('coverage/coverage-summary.json');

// Map coverage to features
const featureCoverage = mapCoverageToFeatures(coverage);

// Update feature map
updateTestCoverage(featureCoverage);
```

**Benefits:**
- Reduces manual effort
- Improves accuracy
- Keeps feature map current
- Enables real-time drift detection

---

## Validation Workflows

### Pre-Commit Validation

Add to `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# If feature map changed, validate it
if git diff --cached --name-only | grep -q "ai-meta/FEATURE_MAP.md"; then
  echo "🔍 Validating feature map..."
  npm run validate:feature-map
fi
```

---

### PR Review Checklist

When reviewing PRs, check:

1. **Code changes require feature map update?**
   - [ ] New feature added → feature map updated
   - [ ] Feature status changed → status updated
   - [ ] APIs added/removed → API list updated
   - [ ] Tech debt created → documented

2. **Feature map update quality**
   - [ ] All relevant fields updated
   - [ ] Related Files list accurate
   - [ ] Dependencies correct
   - [ ] Test coverage accurate
   - [ ] Tech debt specific and actionable

3. **Validation passing**
   - [ ] File existence checks pass
   - [ ] API inventory matches
   - [ ] No circular dependencies
   - [ ] Last Updated date current

---

### Quarterly Audit

**Schedule:** Every 3 months

**Audit process:**

1. **Status accuracy:**
   ```bash
   # For each feature, verify status
   # STABLE: All tests passing, no open bugs
   # PARTIAL: Known incomplete implementations
   # EXPERIMENTAL: Under active development
   ```

2. **Tech debt review:**
   ```bash
   # Review all tech debt items
   # Mark resolved items
   # Update estimates for remaining items
   # Add newly discovered items
   ```

3. **Dependency validation:**
   ```bash
   # Run dependency analysis
   npm run generate:dependency-graph
   # Compare to documented dependencies
   # Update feature map if drift detected
   ```

4. **Coverage check:**
   ```bash
   # Run test coverage
   npm run test:coverage
   # Compare to documented coverage
   # Update gaps if changed
   ```

5. **API drift detection:**
   ```bash
   # Generate API inventory
   npm run generate:api-inventory
   # Compare to feature map
   # Update if drift detected
   ```

---

## Maintenance Best Practices

### For AI Agents

1. **Always read feature map before making changes**
   - Understand current state
   - Check dependencies
   - Review tech debt

2. **Update feature map in same commit**
   - Keep changes atomic
   - Maintain consistency
   - Simplify review

3. **Be specific in tech debt descriptions**
   - Bad: "Needs improvement"
   - Good: "Email delivery not implemented — password reset tokens generated but not sent"

4. **Update Last Updated date**
   - Always update when modifying feature map
   - Format: YYYY-MM-DD

5. **Validate before committing**
   - Run validation script
   - Check file existence
   - Verify API accuracy

---

### For Human Reviewers

1. **Check for feature map updates**
   - If code changes, feature map should too
   - Verify all fields updated

2. **Validate accuracy**
   - Spot check Related Files
   - Verify API list
   - Check dependencies

3. **Ensure completeness**
   - All new tech debt documented
   - Test coverage accurate
   - Known limitations captured

4. **Require specificity**
   - Vague tech debt → request clarification
   - Generic limitations → ask for details
   - Missing info → request completion

---

## Troubleshooting

### Feature map and code out of sync

**Symptom:** Feature map claims files exist that don't, or vice versa

**Fix:**
```bash
# Run validation
npm run validate:feature-map

# Review errors
# Update feature map to match reality
```

---

### API drift detected

**Symptom:** Routes exist but not documented, or documented but not found

**Fix:**
```bash
# Generate API inventory
npm run generate:api-inventory

# Compare to feature map
# Update APIs section for affected features
```

---

### Dependency graph has cycles

**Symptom:** Circular dependencies in feature dependency graph

**Fix:**
```bash
# Analyze dependencies
npm run generate:dependency-graph

# Identify cycle
# Refactor to break cycle or update graph if cycle is intentional
```

---

### Feature map staleness

**Symptom:** Feature map not updated in 90+ days

**Fix:**
```bash
# Run quarterly audit
# Review each feature
# Update all outdated information
# Update Last Updated date
```

---

## Future Enhancements

### AI-Assisted Updates

**Concept:** AI agent automatically suggests feature map updates based on code changes

**Workflow:**
1. Detect code changes in PR
2. AI analyzes changes and current feature map
3. AI suggests updates in PR comment
4. Developer reviews and applies suggestions

---

### Real-Time Validation

**Concept:** Live validation in editor/IDE

**Implementation:**
- VS Code extension
- LSP server for feature map
- Real-time file existence checks
- Inline API validation

---

### Feature Map Dashboard

**Concept:** Web UI for visualizing feature map

**Features:**
- Feature status overview
- Dependency graph visualization
- Tech debt tracking
- Test coverage heatmap
- Staleness indicators

---

## Related Documentation

- [FEATURE_MAP.md](FEATURE_MAP.md) — The feature map itself
- [AGENT_ROUTING.md](AGENT_ROUTING.md) — Routing guide for AI agents
- [AGENT_GUIDE.md](AGENT_GUIDE.md) — Agent operating instructions
- [CHANGE_POLICY.md](CHANGE_POLICY.md) — What can be changed

---

**Maintenance:** Update this guide when introducing new automation or changing workflows.
**Last Updated:** 2026-05-28
