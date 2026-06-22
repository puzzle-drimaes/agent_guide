# Install Update Dry-Run Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 Existing state read | Passed — `readState()` validates existing install-state and `update --dry-run` rejects missing state. |
| R2 New plan diff | Passed — `buildUpdateDryRun()` derives the next request and compares next plan operations with previous install-state operations. |
| R3 Managed file visibility | Passed — report statuses include `missing-would-create`, `new-would-apply`, `unchanged`, `would-update`, `skip-record`, and `removed-from-plan`. |
| R4 User modification detection | Passed — managed destinations that differ from expected canonical output are reported as `possible-user-modified`. |
| R5 No writes | Passed — `update` requires `--dry-run`; non-dry-run execution fails closed. |

## Verification commands

```text
rtk npm test
rtk npm run validate
rtk git diff --check
```

## Verification result

```text
npm test: pass (52 tests, 52 pass)
npm run validate: pass
git diff --check: pass
```

## Notes and follow-ups

- Non-dry-run managed file updates are now implemented: `agent-deploy update`
  reuses the dry-run analysis (`analyzeUpdate`) to build the next plan, then
  delegates writes/backup/install-state rewrite to `applyPlan`. Only next-plan
  operations are touched — user-created and `removed-from-plan` files are never
  modified. `--backup` and `--conflict-policy` are honored as in `apply`.
- User-modified drift is fail-closed by default. `--on-user-modified` controls
  it: `fail` (default, refuse with the drifted file list), `skip` (preserve the
  edit and record a `+update-skip` skip op in install-state), `overwrite`
  (restore canonical content; pair with `--backup`).
- Historical hash storage should still be added before the conservative
  `possible-user-modified` signal is treated as authoritative — a legitimate
  bundled asset change to a copy-file currently reads as user-modified and must
  be resolved with `--on-user-modified overwrite`.
