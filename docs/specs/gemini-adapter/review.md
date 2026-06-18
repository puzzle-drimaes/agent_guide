# Gemini Adapter Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 target registration | Passed. `gemini` is registered in the adapter registry and manifest validation recognizes it. |
| R2 project layout | Passed. Gemini apply creates `GEMINI.md`, `.gemini/`, and `.agent-deploy/install-state.json`. |
| R3 non-destructive root instruction | Passed. `GEMINI.md` uses a managed block and preserves existing content. Re-apply is idempotent. |
| R4 rules | Passed. Rules preserve layout under `.gemini/rules/`. |
| R5 commands | Passed. Commands preserve layout under `.gemini/commands/`. |
| R6 agents and skills fallback | Passed. Agents and skills install under `.gemini/agents/` and `.gemini/skills/` as fallback references. |
| R7 MCP skip reason | Passed. Gemini MCP module emits a skip operation with an explicit reason. |
| R8 safety and provenance | Passed. Existing apply path-safety and symlink guards are used; Gemini state is written under `.agent-deploy/`. |

## Verification commands

```text
npm --prefix agent-deploy run validate
npm --prefix agent-deploy test
```

## Verification result

```text
npm --prefix agent-deploy run validate
  PASS: manifest validation OK

npm --prefix agent-deploy test
  PASS: 14 tests total, 14 pass, 0 fail.
```

## Risks and follow-ups

- Confirm Gemini command and MCP config schema during pilot if a native schema is standardized.
- Add `docs/harness-capability-matrix.md` to document Codex/Claude/Gemini/Cursor parity and fallback choices.
- Consider moving Claude install-state to `.agent-deploy/` in a separate migration for consistency.
