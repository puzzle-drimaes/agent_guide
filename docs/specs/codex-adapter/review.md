# Codex Adapter Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 target registration | Passed. `codex` is registered in the adapter registry and manifest validation recognizes it. |
| R2 project layout | Passed. Codex apply creates `AGENTS.md`, `.agents/`, `.codex/`, and `.agent-deploy/install-state.json`. |
| R3 non-destructive root instruction | Passed. `AGENTS.md` uses a managed block and preserves existing content. Re-apply is idempotent. |
| R4 rules and skills | Passed. Rules and skills preserve layout under `.agents/`. |
| R5 agents | Passed. Canonical Markdown agents install under `.codex/agents/`. |
| R6 MCP TOML merge | Passed. `servers.json` converts to `[mcp_servers.*]` sections and preserves existing keys. Generated TOML parses with Python `tomllib`. |
| R7 unsupported command capability | Passed. Codex command module emits a skip operation with an explicit reason. |
| R8 safety and provenance | Passed. Existing apply path-safety and symlink guards are used; Codex state is written under `.agent-deploy/`. |

## Verification commands

```text
npm --prefix agent-deploy run validate
rtk proxy node agent-deploy/test/smoke.test.js
npm --prefix agent-deploy test
```

## Verification result

```text
npm --prefix agent-deploy run validate
  PASS: manifest validation OK

rtk proxy node agent-deploy/test/smoke.test.js
  PARTIAL PASS: 11 tests total, 9 pass, 2 fail because sandbox blocks spawnSync node with EPERM.
  Codex-specific tests pass.

npm --prefix agent-deploy test
  PASS outside the sandbox: 11 tests total, 11 pass, 0 fail.
```

Sandbox note:

```text
Inside the restricted sandbox, the two CLI JSON tests can fail with `spawnSync node EPERM`.
The same full suite passes when executed outside the sandbox, confirming the earlier failures were environment restrictions rather than product failures.
```

Manual CLI checks:

```text
Codex dry-run JSON output parsed successfully.
Codex apply JSON output parsed successfully.
Generated Codex TOML parsed successfully with tomllib.
```

## Risks and follow-ups

- Confirm Codex MCP config field compatibility during pilot if the CLI config schema changes.
- Add Gemini adapter next to complete the initial target set.
- Consider moving Claude install-state to `.agent-deploy/` in a separate migration for consistency.
