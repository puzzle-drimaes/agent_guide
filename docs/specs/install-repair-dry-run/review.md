# Install Repair Dry-Run Review

## Spec coverage

| Requirement | Result |
|---|---|
| R1 Existing state read | Passed — `analyzeRepair()` reuses `readState()` to validate install-state; `repair --dry-run` rejects missing state. |
| R2 Missing-file detection | Passed — each recorded managed operation (`dest` set, `kind` != `skip`) is classified `present`/`missing` by `fs.existsSync`. |
| R3 Repair visibility | Passed — `buildRepairDryRun()` reports present/missing items plus a status summary. |
| R4 No writes | Passed — `repair` requires `--dry-run`; non-dry-run execution fails closed and the dry-run restores nothing. |

## Verification commands

```text
rtk npm test
rtk npm run validate
rtk git diff --check
```

## Verification result

```text
npm test: pass (60 tests, 60 pass)
npm run validate: pass
git diff --check: pass
```

## Notes and follow-ups

- Detection is existence-based only. A present-but-modified file is not flagged
  here; content/hash drift detection is a follow-up and overlaps with update's
  `possible-user-modified` signal (needs historical hashes to be authoritative).
- The actual restore write is a follow-up. Restoring `copy-file` destinations
  needs the source asset, and `merge-json`/`merge-toml`/`append-markdown`
  destinations need the operation payload, which install-state does not store —
  the write slice will re-derive content (e.g. by rebuilding the plan, as update
  apply does) before writing.
- Extra/unexpected file removal remains out of scope (that is uninstall, 6.4).
