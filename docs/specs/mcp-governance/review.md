# MCP Governance Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 Allowlisted MCP only | Passed — `assets/mcp/allowlist.json` + `check-mcp-governance.js` reject unknown servers. |
| R2 Unsafe defaults blocked | Passed — filesystem MCP is removed/default-excluded; npx package specs require versions. |
| R3 Secret-safe MCP env | Passed — env values must match `${ENV_NAME}` placeholders. |
| R4 Runtime disable filter | Passed — `DISABLED_MCPS` filters servers and records skip operations. |
| R5 Profile default scope | Passed — `minimal`/`core` are MCP-free; `developer`/`full` or explicit module installs include MCP. |

## Verification commands

```text
npm --prefix agent-deploy run validate
npm --prefix agent-deploy test
```

## Verification result

```text
validate: passed, including MCP governance validation OK (1 servers, env filter DISABLED_MCPS)
test: 78 tests, 77 pass, 1 skip (PowerShell not available on PATH)
```

## Notes and follow-ups

- Gemini MCP remains skip+reason until a stable project-scope MCP config contract is confirmed.
- Future stdio/npx MCP additions must use pinned package specs and pass allowlist review.
- Release manifest and internal checksum verification guidance remain separate artifact-signing follow-ups.
