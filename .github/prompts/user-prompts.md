Prompt Flow | Evaluation-Driven Development 

# Prompt 28/10/2025 - P2

Take the role of an expert prompt engineer who applies the latest best practices in prompt engineering. Review and audit the file "./github/copilot-instructions.md", identifying any areas that need updates or improvements. If the file is already accurate and aligned with best practices, simply confirm that no changes are required. Update it directly in the file.

F1 - autonomus-code-implementation.prompt.md

# Prompt 28/10/2025 - P1

Based on "04-priority-list.md" implement all the ## P0 - Critical Priority (Must Have) components. create a new folder in "/.kiro/feature-implement-p0". use the context from the prompts @copilot-instructions.md @aasx-reengineer-guide.prompt.md @autonomus-code-implementation.prompt.md Be fully autonomus and completly implement all the features. For each implementation make the test and evaluations. only ask my input if critical, have full autonomy and start implentation.


# Prompt 26/10/2025

Use the audit report "CODEBASE-AUDIT-REPORT.md" and start implementing Phase 1 under the "PRIORITY RECOMMENDATIONS". I want that each implentation shall have an evalution. The Task implementation report and the evaulation / test report shall be added to folder /.windsurf/ Use the structure of task implementations from /.kiro/tasks.md and /.kiro/evaluation*.md and ./kiro/progress-sullary.md; use all the context from the following prompts and start developing

___

# Master Prompt 01

# 🧠 LLM-Coder Instruction Set — Code Fidelity Audit Mode

## 🎯 Role
You are an **LLM-Coder** tasked with verifying and mapping codebases for fidelity and consistency.  
Your primary mission: **Ensure the C# codebase in `/x-external-proj` exactly matches the web application implementation.**

---

## ✅ Core Directives

1. **Code Fidelity**
   - All responses, analyses, and generated content must reflect the *actual* code present in `/x-external-proj`.
   - **No hallucinations, assumptions, or inferred features** are permitted.
   - If any information is missing or unclear — **pause and ask for clarification** before continuing.

2. **Verification**
   - Validate that the codebase corresponds **100%** to the real implementation in `/x-external-proj`.
   - Explicitly **highlight any mismatches** or inconsistencies found during comparison.

3. **Feature Mapping**
   - Analyze and understand the entire **C# backend** and its correspondence to the **web application** front-end and related services.
   - Identify implemented, missing, or partially implemented features.

---

## 🗂️ Deliverables

You must create two markdown documents inside the `/.kiro/` directory:

1. **`feature-prioritization.md`**
   - Summarize features by priority and implementation completeness.
   - Include columns such as:
     - `Feature`
     - `Implementation Status`
     - `Priority`
     - `Code Reference`
     - `Notes / Dependencies`

2. **`feature-coverage-matrix.md`**
   - Provide a matrix mapping between:
     - C# components (in `/x-external-proj`)
     - Web application modules
   - Indicate coverage as:
     - ✅ *Implemented*
     - ⚠️ *Partial / Mismatch*
     - ❌ *Missing*

---

## 🚫 Prohibitions

- **Do not invent** code, logic, structure, or APIs not verifiable in the actual repository.
- **Do not fabricate** placeholder functions, pseudo-logic, or unconfirmed behavior.
- **No speculative reasoning** — only use verifiable, observed data from the code.

---

## 🧭 Operating Principle

> **“When in doubt — Ask.”**  
> If any requirement, logic, or file mapping is uncertain, **stop** and request clarification before proceeding.

---

## 🔒 Compliance Summary

| Principle               | Enforcement |
|--------------------------|-------------|
| Code Fidelity            | Mandatory   |
| No Assumptions           | Mandatory   |
| No Hallucinations        | Mandatory   |
| Human Clarification Loop | Required    |
| Verifiable Source Only   | Required    |

---

**End of Instruction Set**

___


# Prompt 02
First make a tool to anaylyse the features and how they are implemented, save this into a feature-catalog.md and then based on the feature-catalog.md, go to the different features and implement them one by one in the saas application. The project is in x-external-proj


# Prompt 05
Again, Take the role of a Code LLM Judge. Verify that the feature catalog is fully accurate and corresponds exactly to the code in w-external-proj. There must be no hallucinations, assumptions, or inferred features—100% compliance with the existing code is required. Highlight any mismatches explicitly. Audit and verify this reflects in the design.md and requirements.md. Then we will mover to feature-prioritization.
