# Feature Map Strategy for `/agent`

Evaluate whether the repository should include a file such as:

`/agent/feature-map.md`

The goal of this file is to act as a continuously maintainable AI-readable feature registry for the entire codebase.

The document should:

- Contain all major and minor product/application features
- Be structured in a machine-readable and human-readable tabular format
- Help AI coding agents quickly understand:
  - existing features
  - feature ownership
  - related modules/files
  - dependencies
  - architectural boundaries
  - feature status
  - technical debt
  - known limitations
  - testing coverage
  - API/UI touchpoints
  - database interactions
  - feature flags/configuration
  - roadmap or planned evolution

The AI agent should determine:

1. Whether `feature-map.md` is beneficial for this repository
2. What schema/format should be used
3. Whether additional supporting files are needed, such as:
   - `module-map.md`
   - `dependency-graph.md`
   - `architecture-map.md`
   - `domain-glossary.md`
   - `feature-dependencies.md`
   - `feature-lifecycle.md`
   - `agent-routing.md`

The AI agent should generate the feature map using best practices from:

- Specification-Driven Development (SDD)
- AI-native repository design
- Autonomous coding agent workflows
- Large-scale monorepo maintenance
- Knowledge graph style documentation
- Retrieval-optimized documentation structures

The generated table should ideally include columns such as:

| Feature ID | Feature Name | Description | Entry Points | Related Files | Backend Modules | Frontend Components | APIs | State Management | Database Tables | Dependencies | Feature Flags | Test Coverage | Owner | Status | Tech Debt | Notes |

The output should:

- minimize future token usage for AI agents
- reduce repository re-analysis costs
- improve long-term maintainability
- support autonomous planning and code modification
- be incrementally updateable
- remain deterministic and structured for machine parsing

The AI agent should also recommend:

- update workflows
- automation strategies
- CI validation for stale feature maps
- conventions for future contributors
- methods to auto-generate portions of the file from source code analysis
