# 🧠 Prompt: React TypeScript Codebase Maturity Audit

## 🎯 Goal

Evaluate the current **React + TypeScript** codebase for architectural and implementation maturity, providing a comprehensive assessment with specific, actionable recommendations.

---

## 📋 Phase 1: Discovery & Context Gathering (REQUIRED FIRST)

Before analyzing, gather complete context using available tools:

1. **Use `file_search`** to identify:
   - All `.tsx`, `.ts` files in the codebase
   - Configuration files: `package.json`, `tsconfig.json`, `eslint.config.js`, `vite.config.ts`
2. **Use `read_file`** to review:
   - `package.json` - Check dependencies, scripts, and project metadata
   - `tsconfig.json` - Verify TypeScript strict mode and compiler options
   - `eslint.config.js` - Review linting rules and configuration
   - Main entry points: `client/src/main.tsx`, `client/src/App.tsx`
   - Directory structure of `client/src/` to map features and components

- **Use `semantic_search`** to locate:
  - State management patterns (e.g., Context, Redux, Zustand)
  - Data fetching and caching logic (e.g., React Query, SWR, `fetch`)
  - Error handling implementations (e.g., Error Boundaries, `try/catch` blocks)
  - Testing strategies (e.g., `vitest`, `@testing-library/react`)
  - Authentication and authorization patterns (e.g., JWT, session management)

4. **Use `grep_search`** to check for anti-patterns:
   - Search for `any` types (regex: `:\s*any`)
   - Search for leftover `console.log` statements
   - Search for disabled TypeScript checks (regex: `//\s*@ts-(ignore|expect-error)`)
   - Search for suppressed hook dependency warnings (regex: `eslint-disable-next-line react-hooks/exhaustive-deps`)

5. **Use `run_in_terminal`** to:
   - Run `npm audit` or `yarn audit` to check for dependency vulnerabilities.
   - Run `gitleaks` or `semgrep` if available for static application security testing (SAST).

---

## 🧩 Phase 2: Comprehensive Analysis

Analyze using the latest best practices for React (v18+) and TypeScript (≥5.x):

### **A. Architecture & Structure (Weight: 25%)**

- **Folder organization:** Is it feature-driven, component-driven, or hybrid?
- **Separation of concerns:** Are features, components, hooks, and utilities properly separated?
- **Scalability:** Can the structure accommodate 50+ features?
- **Module boundaries:** Clear import patterns and no circular dependencies?

### **B. Type Safety & TypeScript (Weight: 20%)**

- **Strict mode enabled:** Check `tsconfig.json` for `strict: true`
- **Type coverage:** Minimal use of `any`, proper interface/type definitions
- **Prop typing:** All components have properly typed props
- **Generic usage:** Appropriate use of generics for reusable components
- **Type guards:** Runtime type checking where needed

### **C. Component Design & Reusability (Weight: 20%)**

- **Component size:** Files under 300 lines, single responsibility
- **Composition patterns:** Proper use of children, render props, or compound components
- **Hook usage:** Custom hooks for shared logic
- **Prop drilling:** Minimal prop drilling (max 2-3 levels)
- **Performance:** Proper memoization (React.memo, useMemo, useCallback)

### **D. State Management (Weight: 15%)**

- **Global state:** Appropriate solution (Context, Redux, Zustand, etc.)
- **Local state:** useState vs useReducer appropriately chosen
- **Server state:** React Query, SWR, or similar for data fetching
- **State colocation:** State lives close to where it's used

### **E. Code Quality & Standards (Weight: 10%)**

- **Linting:** ESLint properly configured with React/TypeScript rules
- **Formatting:** Prettier or consistent formatting enforced
- **Testing:** Unit tests present with reasonable coverage
- **Error boundaries:** Implemented for graceful error handling
- **Documentation:** README, inline comments for complex logic

### **F. Security & Performance (Weight: 10%)**

- **Dependencies:** No critical vulnerabilities (check with npm audit)
- **Bundle size:** Vite config optimized, code splitting present
- **Accessibility:** Semantic HTML, ARIA attributes where needed
- **XSS prevention:** Proper sanitization of user inputs
- **Authentication:** Secure token storage and handling

---

## 🎯 Phase 3: Maturity Level Assessment

Calculate overall maturity score (1-10) based on weighted criteria above:

### **Maturity Level Definitions**

| Score    | Level                    | Description                                                                         |
| -------- | ------------------------ | ----------------------------------------------------------------------------------- |
| **1-3**  | � **Prototype**          | Inconsistent patterns, minimal types, no testing strategy, major refactoring needed |
| **4-6**  | 🟡 **Moderate**          | Some structure present, decent typing, basic testing, needs improvement for scale   |
| **7-8**  | 🟢 **Mature Foundation** | Strong architecture, strict types, comprehensive patterns, production-ready         |
| **9-10** | 💎 **Exemplary**         | Best-in-class implementation, comprehensive testing, excellent documentation        |

---

## ⚙️ Constraints

- Keep the report **concise and pragmatic** — avoid unnecessary extras
- The goal is to ensure the code is **future-ready and maintainable**, not necessarily fully production-grade
- Prioritize findings by impact (blockers vs. nice-to-haves)
- Provide specific file paths and code examples where relevant

---

## 📝 Output Format

Provide your findings in **Markdown** with the following sections:

```markdown
# Codebase Maturity Audit Report

## Executive Summary

**Overall Maturity Score:** [Score]/10 ([Level Name])
**Assessment Date:** [Date]
**Tech Stack:** React v[auto-detect], TypeScript v[auto-detect], Vite v[auto-detect]

[2-3 sentence overview of the codebase state, its primary strengths, and critical weaknesses.]

---

## Maturity Breakdown

| Category                 | Score | Status   | Key Findings                             |
| ------------------------ | ----- | -------- | ---------------------------------------- |
| Architecture & Structure | X/10  | 🔴/🟡/🟢 | [Brief summary of architectural state]   |
| Type Safety & TypeScript | X/10  | 🔴/🟡/🟢 | [Brief summary of typing quality]        |
| Component Design         | X/10  | 🔴/🟡/🟢 | [Brief summary of component reusability] |
| State Management         | X/10  | 🔴/🟡/🟢 | [Brief summary of state patterns]        |
| Code Quality & Standards | X/10  | 🔴/🟡/🟢 | [Brief summary of linting/testing setup] |
| Security & Performance   | X/10  | 🔴/🟡/🟢 | [Brief summary of vulnerabilities/perf]  |

---

## 🔴 Critical Issues (Must Fix Before Scaling)

1.  **[Issue Title]**
    - **Location:** `path/to/file.ts`
    - **Impact:** [Describe the risk, e.g., "Blocks scalability," "Poses security risk"]
    - **Fix:** [Specific action to take, e.g., "Refactor component to use Context API"]

---

## 🟡 Important Improvements (Should Address Soon)

1.  **[Issue Title]**
    - **Location:** [Files/folders affected]
    - **Benefit:** [Why this matters, e.g., "Improves maintainability," "Reduces type errors"]
    - **Recommendation:** [What to do, e.g., "Enable `strictNullChecks` in tsconfig.json"]

---

## 🟢 Nice-to-Have Enhancements (Can Defer)

1.  **[Enhancement Title]**
    - **Benefit:** [Incremental improvement, e.g., "Better developer experience"]
    - **Effort:** [Low/Medium/High]

---

## 📊 Key Metrics

- **Total Components:** [Count]
- **TypeScript Files (`.ts`/`.tsx`):** [Count]
- **Test Coverage:** [X% (if available, otherwise N/A)]
- **`any` Type Usage:** [Count] occurrences
- **`@ts-ignore` / `@ts-expect-error`:** [Count] occurrences
- **ESLint Errors/Warnings:** [Count]
- **Security Vulnerabilities:** [X critical, Y high (from `npm audit`)]

---

## ✅ Strengths

- **[Strength 1]:** [Briefly describe what the codebase does well, e.g., "Well-organized feature-driven folder structure."]
- **[Strength 2]:** [e.g., "Consistent use of Tailwind CSS for styling."]
- **[Strength 3]:** [e.g., "Effective use of React Query for server state management."]

---

## 🎯 Recommended Action Plan

### Immediate (Week 1)

- [ ] **Fix Critical Issue #1:** [Issue Title from above]
- [ ] **Fix Critical Issue #2:** [Issue Title from above]

### Short-term (Month 1)

- [ ] **Address Improvement #1:** [Improvement Title from above]
- [ ] **Address Improvement #2:** [Improvement Title from above]

### Long-term (Quarter 1)

- [ ] **Implement Enhancement #1:** [Enhancement Title from above]
- [ ] [Action item, e.g., "Plan migration to a centralized state management library"]

---

## 📚 Resources & References

- [Link to TypeScript best practices]
- [Link to React patterns]
- [Link to relevant documentation]
```

---

## 🚀 Objective

Deliver a **comprehensive code maturity audit report** that:

1. Provides a clear, quantified assessment of the current state
2. Identifies blockers that must be fixed before scaling
3. Offers a prioritized, actionable roadmap for improvement
4. Ensures this codebase can evolve into a larger, feature-rich system without major refactoring

---

## ✅ Checklist for AI Agent

Before submitting the report, verify:

- [ ] All major directories and files have been reviewed
- [ ] Configuration files have been analyzed
- [ ] Specific file paths are provided for issues
- [ ] Scores are calculated based on the defined criteria
- [ ] Recommendations are actionable with clear next steps
- [ ] Report includes both quantitative metrics and qualitative insights
- [ ] Prioritization is clear (🔴 critical, 🟡 important, 🟢 nice-to-have)
