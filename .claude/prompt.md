---
Prompt 01
---

Read `/repo-legacy/server/` fully. Identify all files related to LLM connectivity:
provider adapters, chat services, streaming, conversation memory, chat route handlers.

For each logical feature found, write a YAML spec to `repo-sota/docs/feature-specs/<feature-name>.yaml`:

```yaml
feature: <name>
source_files: [relative paths in repo-legacy]
purpose: <one sentence>
contracts:
  - endpoint, method, inputs, outputs, side_effects
dependencies:
  npm: [required packages]
  internal: [DevNest services to integrate with]
express_v5_changes: <Express 4 patterns that must change>
migration_complexity: low | medium | high
notes: <conflicts, ambiguities, decisions>
```

Do not write any implementation code. Output YAML specs only.

---
