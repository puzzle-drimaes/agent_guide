# Gemini Adapter Design

## SDD mode

SDD-full, because this is a new target adapter with target parity, fallback, install-state, and rollout implications.

## Architecture

The existing `agent-deploy` pipeline remains unchanged:

```text
CLI request
  -> planner / manifest resolution
  -> target adapter operation planning
  -> apply operation executor
  -> install-state writer
```

Gemini-specific mapping lives in `src/targets/gemini.js`. No profile/module resolution logic is added to the adapter.

## Operation mapping

| Canonical asset | Gemini project destination | Operation |
|---|---|---|
| root instruction block | `GEMINI.md` | `append-markdown` |
| `rules/**` | `.gemini/rules/**` | `copy-file` |
| `commands/**` | `.gemini/commands/**` | `copy-file` |
| `agents/*.md` | `.gemini/agents/*.md` | `copy-file` fallback |
| `skills/**` | `.gemini/skills/**` | `copy-file` fallback |
| `mcp/servers.json` | none | `skip` |

## Root instruction strategy

The adapter creates one managed block in `GEMINI.md` when the baseline rules module is selected. The block points Gemini to `.gemini/rules/`, `.gemini/commands/`, `.gemini/agents/`, and `.gemini/skills/`.

Managed block markers:

```text
<!-- agent-deploy:gemini:start -->
...
<!-- agent-deploy:gemini:end -->
```

## Fallback strategy

The MVP treats Gemini commands, agents, and skills as instruction-backed files rather than assuming all surfaces are native. This preserves semantic equivalence without silently dropping assets.

MCP is skipped with an explicit reason because the rollout decision for Gemini MCP config is not finalized in the current project documents.

## State path

Gemini follows the shared rollout requirement and writes install state to:

```text
.agent-deploy/install-state.json
```

## Risks

- Gemini CLI may later standardize a more specific command or MCP schema; these files can be adapted in the target adapter without changing canonical assets.
- User edits inside the managed `GEMINI.md` block are replaced on re-apply.
