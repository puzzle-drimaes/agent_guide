# Install Uninstall Write Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 State-driven write | Passed — `applyUninstall()` reads validated install-state and never rebuilds a fresh plan. |
| R2 Managed-only teardown | Passed — `copy-file` is deleted; `append-markdown`/`merge-json`/`merge-toml` are reverted in place and files are preserved. |
| R3 User-modified fail-closed | Passed — drift defaults to refusal; `--on-user-modified skip` preserves drifted files; `force` removes/reverts explicitly. |
| R4 Safety guards | Passed — state path and all selected destinations are checked with path-safety and symlink guard before mutation. |
| R5 Backup support | Passed — `--backup` captures changed/deleted files and install-state before uninstall writes. |
| R6 Empty directory cleanup | Passed — empty parent directories are removed up to, but not including, the target safety root. |

## Verification commands

```text
rtk npm test
rtk npm run validate
rtk git diff --check
```

## Verification result

```text
npm test: pass (84 tests, 83 pass, 1 skipped because PowerShell is unavailable)
npm run validate: pass
git diff --check: pass
```

## Notes and follow-ups

- Rollback/restore from backup archives remains a future lifecycle command.
- `--on-user-modified force` is intentionally explicit; pair it with `--backup`
  when preserving edited managed content matters.
- TOML/JSON reverse merge preserves unrelated keys, but cannot prove whether an
  empty object/table existed before install; this is documented risk for shared
  config cleanup.
