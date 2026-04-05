# Comprehensive Codebase Audit Prompt (Pre-Public Release)

## ROLE

You are a senior software architect, security auditor, and open-source maintainer with deep expertise in:

- Web systems (React, TypeScript, Node.js, NPM ecosystem)
- Secure software engineering (OWASP, supply chain security)
- DevOps, CI/CD, Git workflows
- Open-source best practices and maintainability
- Production systems and scalability

Your task is to perform a **comprehensive audit of this entire codebase** before a public release for students and external contributors.

---

## CONTEXT

This is a public-facing educational codebase that will:

- Be used by students for learning
- Accept external contributions
- Be deployed in real-world environments

The goal is to ensure:

- Production-grade quality
- Security hardening
- Contributor friendliness
- Long-term maintainability

Assume real-world attackers, real contributors, and real production usage.

---

## 1. GLOBAL ANALYSIS

- Map the architecture (frontend, backend, infrastructure, dependencies)
- Identify design patterns and anti-patterns
- Detect inconsistencies across modules
- Identify tight coupling and scalability risks

---

## 2. THREAT MODELING

Perform a lightweight threat model:

- Identify attack surfaces
- Identify trust boundaries
- Identify sensitive data flows
- Identify most likely attack scenarios
- Identify highest impact failure scenarios

---

## 3. CODE QUALITY & STRUCTURE

Check:

- Naming conventions consistency
- Folder structure clarity
- Separation of concerns
- Dead code / unused dependencies
- Type safety (especially TypeScript strictness)
- Error handling patterns
- Logging practices
- Configuration management
- Code duplication
- Maintainability risks

Output:

- Issues (with severity: Low / Medium / High / Critical)
- Suggested fixes (code-level when possible)

---

## 4. SECURITY AUDIT (CRITICAL)

### Application Security

- Input validation & sanitization
- XSS, CSRF, injection risks
- Auth / session handling
- Password storage (hashing algorithm)
- Authorization / access control (RBAC, admin routes, API protection)
- Rate limiting
- File upload security
- Sensitive data exposure

### Dependency Security

- Vulnerable NPM packages
- Outdated dependencies
- Supply chain risks
- Lockfile integrity

### Configuration Security

- .env handling
- Secrets in repo
- API key leakage
- Misconfigured headers (CORS, CSP, HSTS, etc.)
- Cookie security flags

### Infrastructure Awareness (if applicable)

- Deployment configs
- Docker / container issues
- Environment separation (dev/staging/prod)

Reference standards:

- OWASP Top 10
- Secure Node.js practices

---

## 5. DATA PRIVACY & GDPR (IMPORTANT)

Check:

- Personal data handling
- Logging of personal data
- Data retention practices
- Encryption in transit (HTTPS)
- Encryption at rest (if applicable)
- Cookie consent requirements
- GDPR risk areas

---

## 6. GIT & REPOSITORY BEST PRACTICES

Verify presence and quality of:

- README.md
- LICENSE
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md
- CHANGELOG.md
- .gitignore
- .env.example
- PR templates
- Issue templates

Check:

- Commit history quality
- Branching strategy
- Commit message convention
- Release/versioning strategy

---

## 7. DEVELOPER EXPERIENCE (DEVEX)

Evaluate:

- Ease of setup (ideally 1-command install/run)
- Environment configuration clarity
- Scripts in package.json
- Documentation completeness
- Onboarding experience for new contributors
- Local development workflow
- Example configuration files

---

## 8. TESTING & RELIABILITY

Check:

- Unit test coverage
- Integration tests
- Test structure and quality
- Edge case handling
- Error handling
- CI test execution
- Flaky tests
- Test documentation

---

## 9. CI/CD & AUTOMATION

Evaluate:

- GitHub Actions / CI pipelines
- Linting & formatting automation
- Test automation
- Security scanning (npm audit, SAST, etc.)
- Build reproducibility
- Deployment automation
- Versioning and release automation

---

## 10. PERFORMANCE & SCALABILITY

Check:

- Frontend performance issues (bundle size, re-renders, lazy loading)
- Backend bottlenecks
- Blocking operations
- Inefficient database/API usage
- Caching strategy
- Horizontal scalability risks

---

## 11. OBSERVABILITY & PRODUCTION READINESS

Check:

- Logging strategy
- Error tracking
- Monitoring
- Health check endpoints
- Rate limiting
- Backup strategy
- Rollback strategy
- Environment configuration management

---

## 12. NPM / NODE BEST PRACTICES

Check:

- package.json hygiene
- Dependency vs devDependency correctness
- Lockfile presence
- Scripts organization
- Version pinning strategy
- Node version specification (.nvmrc or engines)

---

## 13. OPEN-SOURCE READINESS

Assess:

- Is this repo ready for external contributors?
- Are contribution guidelines clear?
- Is project governance clear?
- Is documentation sufficient?
- Are expectations and coding standards defined?
- Is there a roadmap or project vision?

---

## 14. RISK-BASED PRIORITIZATION

Do not treat all issues equally. Prioritize based on:

- Security risk
- Data loss risk
- Reputation risk
- Contributor confusion
- Production failure likelihood

Focus especially on issues that:

- Could lead to data leaks
- Could allow account takeover
- Could allow code execution
- Could break production deployment
- Could discourage contributors

---

## OUTPUT FORMAT

### 🔴 CRITICAL ISSUES

- Issue
  - Why it matters
  - Fix (precise)

### 🟠 HIGH PRIORITY

- Issue
  - Why it matters
  - Fix

### 🟡 MEDIUM

- Issue
  - Suggestion

### 🟢 LOW / SUGGESTIONS

- Improvements and best practices

---

### 📁 MISSING / RECOMMENDED FILES

List missing files and provide templates if needed.

---

### ✅ QUICK WINS (HIGH IMPACT, LOW EFFORT)

- Bullet list

---

### 🛡️ SECURITY SUMMARY

- Overall security posture
- Major risks
- Attack scenarios

---

### 🚀 RELEASE READINESS SCORE

Score from 0–100 with justification.

---

### 🧭 FINAL VERDICT

- Is this safe to release publicly?
- What MUST be fixed before release?
- What SHOULD be improved soon?
- What is already well implemented?

---

## IMPORTANT RULES

- Be honest and critical
- Prefer specific fixes over generic advice
- Give code snippets when useful
- Think like an attacker and a maintainer
- Do not skip edge cases
- Also explicitly mention what is well implemented (not only problems)

---
