# MCP Governance Design

## Approach

Add a small MCP governance policy layer between canonical MCP assets and target adapters. Adapters continue to own target-specific output paths, but they call the shared policy layer before creating merge operations. The policy layer validates the canonical MCP config, filters disabled servers from `DISABLED_MCPS`, and returns visible skip records for filtered servers.

## Component / module design

```text
assets/mcp/servers.json      canonical approved MCP server definitions
assets/mcp/allowlist.json    governance policy: allowed/default-excluded/env-filter/rules
src/mcp-governance.js        validation + runtime filtering + target-neutral payload
scripts/check-mcp-governance.js  CI/validate wrapper
src/targets/{claude,codex,cursor}.js  call governance layer before JSON/TOML merge
src/targets/gemini.js        unchanged native policy: skip+reason
```

The CLI/planner does not contain target-specific MCP rules. Target adapters still decide destination layout, while `src/mcp-governance.js` handles target-neutral security policy.

## File / install layout

- Claude project: filtered allowlisted MCP JSON merges into `.mcp.json`.
- Claude home: filtered allowlisted MCP JSON merges into `~/.claude.json`.
- Codex: filtered allowlisted MCP config converts to `.codex/config.toml` add-only TOML.
- Cursor: filtered allowlisted MCP JSON merges into `.cursor/mcp.json`.
- Gemini: records skip reason until stable project-scope MCP config contract exists.

## Alternatives considered

- Keep allowlist only in docs → rejected because unsafe MCP entries could still ship.
- Put governance branching in planner → rejected because target adapters should own MCP destination behavior.
- Remove `mcp-baseline` entirely → rejected; explicit module/profile installs are useful after validation/filtering.

## Risks

- Existing users expecting `core` to include MCP may lose automatic MCP install → mitigated by explicit `developer`, `full`, or `--module mcp-baseline` usage.
- `DISABLED_MCPS` makes plans environment-dependent → mitigated by visible skip operations and install-state provenance.
