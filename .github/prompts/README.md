# 🗂 Prompt Manifest

This folder contains reusable **prompt templates** for guiding AI coding agents (e.g., Copilot, GPT) when working on this React + TypeScript SaaS project.  
Each file defines a **mode** with clear rules and expected outputs.

---

## 🔎 Quality & Audits

- **`audit.md`** → Audit the codebase for compliance with React + TypeScript best practices and Feature-Driven Development (FDD). Produces per-file and overall summary.
- **`accessibility-audit.md`** → Check JSX/HTML for accessibility issues. Reports violations, ARIA usage, keyboard navigation, and fixes.
- **`performance-audit.md`** → Analyze bundle, rendering, and component structure. Suggests memoization, lazy loading, and code splitting optimizations.

---

## 🛠 Build & Improve

- **`feature-generator.md`** → Generate new feature modules. Includes components, hooks, services, and integration steps.
- **`refactor.md`** → Clean and optimize legacy code. Ensures modularity, removes duplication, and aligns with workspace rules.
- **`migration.md`** → Assist with dependency or framework upgrades (e.g., React, TypeScript, Tailwind). Provides migration plan and code updates.
- **`error-handling.md`** → Audit and add proper error handling. Suggests `try/catch`, error boundaries, fallback UI, and logging.

---

## ✅ Testing

- **`testing.md`** → Generate Jest + React Testing Library unit and integration tests. Provides coverage checklist.

---

## 📖 Documentation

- **`readme-update.md`** → Scan codebase and update root `README.md` with project description, setup, usage, and feature list.
- **`docs-generator.md`** → Generate structured documentation under `/docs`:
  - `architecture.md` → Project architecture & module structure
  - `components.md` → Core React components & props
  - `hooks.md` → Custom hooks with usage examples
  - `api.md` → API endpoints and contracts
  - `conventions.md` → Coding style, naming, TypeScript rules
  - `changelog.md` → Project changes and history
- **`release-notes.md`** → Auto-generate release notes based on commits and code changes.

---

## 📚 Knowledge

- **`knowledge-extractor.md`** → Convert comments, scattered practices, and implicit patterns into consolidated developer guides.

---

## 🔖 Usage

- Run any prompt file as a **workspace instruction** for your coding agent.
- Each prompt is written in Markdown with YAML front matter (`mode`, `description`).
- Use them as-is or extend them with feature/task-specific details.

---

🚀 With these prompts, you can:

- **Audit → Improve → Build → Document → Release**  
  in a repeatable, agent-friendly workflow.
