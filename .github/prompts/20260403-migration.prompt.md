Refined Prompt:

**Role:**
Act as a senior software engineer and project automation agent.

**Task:**
In the project repository, create a new folder named **`migration-2026`**. Inside this folder, create a Markdown file named **`migration-action-list.md`** that will be used to track all upcoming feature implementations and their associated tests. After each feature is implemented, you must update this Markdown file to reflect the implementation status, test coverage, and evaluation results.

**Constraints:**

- Use a structured Markdown table format for tracking.
- Each feature must have corresponding automated tests.
- Tests must be created immediately after each feature implementation.
- All tests must run after each feature is completed.
- The tracking file must be updated after:
  - Feature implementation
  - Test creation
  - Test execution
  - Evaluation result

- Follow the principle of **Evaluation-Driven Development with Full Traceability**.
- Do not skip test creation or tracking updates.
- Ensure the process is repeatable and consistent for every new feature.

**Output Requirements:**

1. Create folder: `migration-2026`
2. Create file: `migration-action-list.md`
3. Initialize the file with a Markdown table with the following columns:

| Feature Name | Description | Implemented (Yes/No) | Tests Created (Yes/No) | Tests Passed (Yes/No) | Coverage % | Evaluation Notes | Last Updated |
| ------------ | ----------- | -------------------- | ---------------------- | --------------------- | ---------- | ---------------- | ------------ |

4. After each feature implementation, automatically update the corresponding row in this table.
5. Ensure all tests are executed and results are recorded before marking a feature as complete.
