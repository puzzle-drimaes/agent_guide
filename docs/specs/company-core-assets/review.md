# Company Core Assets Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 common company rules | Passed. `agent-deploy/assets/rules/common` now contains company AI principles, security, source attribution, and knowledge sharing; minimal installs them for Codex/Claude/Gemini. |
| R2 developer core rules | Passed. Architecture, Git commit convention, harness engineering, and SDD rules are present as precise developer modules and are excluded from minimal. |
| R3 workflow skills | Passed. SDD mode selector, harness parity review, commit message writer, and existing architecture review skills install from assets. |
| R4 manifest precision | Passed. Developer rules were split into file-level modules to avoid broad ownership/collisions; profiles were updated. |
| R5 cross-harness parity | Passed. Smoke tests assert Codex `.agents`, Claude `.claude`, and Gemini `.gemini` layouts for the same core rule/skill set. |
| R6 safety and provenance | Passed. Existing plan/apply path-safety and install-state flow are unchanged; skip reasons remain tested. |

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

## Notes and follow-ups

- Add a future drift check so `.agents/rules` and promoted `agent-deploy/assets/rules` do not diverge accidentally.
- `docs/specs/<feature>/` reusable templates are still a future SDD workflow enhancement.
- Gemini MCP remains skip-with-reason until a native config policy is finalized.
