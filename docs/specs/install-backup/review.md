# Install Backup Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 Explicit backup option | Passed — `agent-deploy apply --backup` is parsed and passed to `applyPlan()`. |
| R2 Backup location | Passed — project scope uses `.agent-deploy/backups/<timestamp>/`; home scope uses target config root `backups/<timestamp>/`. |
| R3 Existing file preservation | Passed — existing write destinations and previous install-state are collected and copied before apply writes. |
| R4 Install-state provenance | Passed — install-state records `backup.enabled`, `backup.root`, and backup entries; runtime schema validation covers the new shape. |

## Verification commands

```text
rtk npm test
rtk npm run validate
rtk git diff --check
```

## Verification result

```text
npm test: pass (46 tests, 46 pass)
npm run validate: pass
git diff --check: pass
```

## Notes and follow-ups

- Full conflict policy remains a follow-up after backup lands.
- Backup restore/repair/update/uninstall commands are intentionally out of scope for this slice.
- Backup copies are file-level preservation only; hashing and transactional restore can be added with repair/update work.
