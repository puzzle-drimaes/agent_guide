# Codex Adapter Design

## SDD mode

SDD-full, because this is a new target adapter with install-state, path-safety, target parity, and config merge implications.

## Architecture

The existing pipeline remains unchanged:

```text
CLI request
  -> planner / manifest resolution
  -> target adapter operation planning
  -> apply operation executor
  -> install-state writer
```

Codex-specific behavior lives in `src/targets/codex.js`. Shared operation support is added only where the existing executor lacks required generic operation types.

## Operation mapping

| Canonical asset | Codex project destination | Operation |
|---|---|---|
| `rules/**` | `.agents/rules/**` | `copy-file` |
| root instruction block | `AGENTS.md` | `append-markdown` |
| `skills/**` | `.agents/skills/**` | `copy-file` |
| `agents/*.md` | `.codex/agents/*.md` | `copy-file` |
| `commands/**` | none | `skip` |
| `mcp/servers.json` | `.codex/config.toml` | `merge-toml` |

## Root instruction strategy

The adapter creates one managed block in `AGENTS.md` when the baseline rules module is selected. The block points Codex to `.agents/rules/` and `.agents/skills/` rather than inlining every rule. This keeps `AGENTS.md` stable and prevents destination collisions between multiple rule modules.

Managed block markers:

```text
<!-- agent-deploy:codex:start -->
...
<!-- agent-deploy:codex:end -->
```

## TOML merge strategy

`mcp/servers.json` remains the canonical MCP asset. The Codex adapter converts it into a TOML merge payload:

```text
[mcp_servers."company-docs"]
url = "https://..."
enabled = true

[mcp_servers."filesystem"]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "."]
enabled = true
```

The shared `merge-toml` executor performs an add-only table/key merge:

- If a table does not exist, append the full table.
- If a table exists, insert only missing keys in that table.
- If a key already exists, preserve the user value.
- Nested object values, such as `env`, become nested tables.

This is intentionally minimal and avoids a dependency while satisfying the current Codex MCP config shape.

## State path

Unlike the existing Claude skeleton state path, Codex follows the rollout requirement and writes install state to:

```text
.agent-deploy/install-state.json
```

The adapter factory gets a generic `stateSegments` option so this target-specific state path does not leak into planner or apply logic.

## Risks

- Codex MCP TOML format may evolve. The current implementation is based on the local Codex config shape and rollout documents.
- `append-markdown` is non-destructive, but user edits inside the managed block are replaced on the next apply.
- Full TOML syntax preservation is best-effort; unrelated content and existing keys are preserved, but formatting around inserted keys may change near managed tables.
