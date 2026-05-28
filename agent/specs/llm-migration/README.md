# LLM Migration Specs (forward-looking)

FDD-style YAML specifications for porting LLM connectivity from the legacy repo into DevNest.
These are **planning artifacts**, not yet-implemented features. The migration scope and rules
are defined in the root [`CLAUDE.md`](../../../CLAUDE.md) ("LLM Migration").

## Specs

| File                             | Feature                              |
| -------------------------------- | ------------------------------------ |
| `external-ai-provider.yaml`      | Multi-provider LLM adapter interface |
| `ollama-adapter.yaml`            | Ollama provider adapter              |
| `lmstudio-adapter.yaml`          | LM Studio provider adapter           |
| `external-model-management.yaml` | Runtime model/provider management    |
| `chat-message-dispatch.yaml`     | SSE streaming chat dispatch          |
| `chat-session-memory.yaml`       | Persistent conversation history      |

## Each YAML defines

`feature`, `source_files` (in the legacy repo), `purpose`, `contracts` (endpoints/functions),
`dependencies`, `express_v5_changes`, `migration_complexity`, and `notes`.

## When implementing

A YAML here is a _contract sketch_, not an approved change. Before writing code, create a
standard spec at `agent/specs/<feature>/spec.md` (see [`../TEMPLATE.md`](../TEMPLATE.md)),
set its `Status` to `APPROVED`, and follow the rules in [`../../AGENT_GUIDE.md`](../../AGENT_GUIDE.md).
