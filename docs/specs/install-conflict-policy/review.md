# Install Conflict Policy Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 Explicit policy option | Passed — `agent-deploy apply --conflict-policy <policy>` is parsed, dry-run validated, and passed to `applyPlan()`. |
| R2 Policy semantics | Passed — `managed-overwrite`, `skip`, `append`, `merge-json`, `merge-toml`, and `conflict-error` are implemented in `src/conflict-policy.js`. |
| R3 Fail closed before writes | Passed — disallowed conflicts throw before backup collection/copy and before destination writes. |
| R4 Install-state provenance | Passed — install-state records `conflictPolicy.policy` and per-conflict decisions; runtime schema validation covers the new shape. |

## Verification commands

```text
rtk npm test
rtk npm run validate
rtk git diff --check
```

## Verification result

```text
npm test: pass (50 tests, 50 pass)
npm run validate: pass
git diff --check: pass
```

## Notes and follow-ups

- Interactive conflict review and per-file policy are intentionally out of scope.
- Update/repair/uninstall still need separate lifecycle implementations that consume install-state provenance.
