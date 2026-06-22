# Install Repair Dry-Run Requirements

## Context

Backup, conflict policy, and update (dry-run + apply) are now available. The next
lifecycle step is repair. Unlike update — which rebuilds the next plan from the
current asset bundle and refreshes content — repair treats the recorded
install-state as the source of truth and restores managed files that have gone
missing (deleted, partially cleaned, or never fully written).

Applying repair writes without first proving install-state-based detection and
drift visibility would be risky. This slice implements a non-writing repair
dry-run that the later repair write can build on.

Related plan: `TODO.md` section 6.3 repair.

## SDD mode

SDD-full, because repair is an installer lifecycle feature that consumes
install-state and governs managed-file safety.

## Scope

In scope:

- Add `agent-deploy repair --dry-run`.
- Read and validate the existing install-state.
- Detect managed destinations recorded in install-state that are missing on disk
  (existence-based detection).
- Report which managed files are present vs missing and would be restored.

Out of scope:

- Non-dry-run repair writes (restoring missing files).
- Hash/content-based drift detection (only missing-file detection in this slice).
- Re-deriving operation content from a rebuilt plan (needed only for write repair).
- Removal of unexpected/extra files.

## Requirements

### R1. Existing state read

`repair --dry-run` reads the current target install-state from the adapter state
path and rejects missing or invalid state.

### R2. Missing-file detection

`repair --dry-run` classifies each managed operation recorded in install-state
(`dest` set, `kind` not `skip`) as `present` or `missing` based on whether the
destination exists on disk.

### R3. Repair visibility

The dry-run report lists managed files that are present and those that are
missing and would be restored, plus a status summary.

### R4. No writes

`repair --dry-run` never writes destination files, backup files, or install-state.
Non-dry-run `repair` must fail closed until a later implementation.

## Acceptance criteria

- `agent-deploy repair --dry-run --json` emits valid JSON.
- Missing install-state fails with a clear error.
- A managed destination deleted after install is reported as `missing`.
- A fully intact install reports zero `missing`.
- Non-dry-run `repair` is rejected.
- `npm test` passes.
- `npm run validate` passes.
- TODO/Finish and this spec's review are updated as a result.
