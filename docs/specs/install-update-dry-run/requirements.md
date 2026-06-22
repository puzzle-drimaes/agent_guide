# Install Update Dry-Run Requirements

## Context

Backup and conflict policy are now available. The next lifecycle step is update, but applying updates without first proving install-state reading, plan diffing, and drift visibility would be risky. This slice implements a non-writing update dry-run that future update/repair commands can build on.

Related plan: `TODO.md` section 6.2 update.

## SDD mode

SDD-full, because update is an installer lifecycle feature that consumes install-state and affects managed file safety.

## Scope

In scope:

- Add `agent-deploy update --dry-run`.
- Read and validate the existing install-state.
- Build the next plan from the existing state request when profile/modules are not provided.
- Compare the existing install-state operations with the next plan.
- Report missing, new, changed, unchanged, and possible user-modified managed files.

Out of scope:

- Non-dry-run update writes.
- Automatic restore/rollback.
- Strong hash-based drift detection from historical install content.
- Per-file interactive update approval.

## Requirements

### R1. Existing state read

`update --dry-run` reads the current target install-state from the adapter state path and rejects missing or invalid state.

### R2. New plan diff

`update --dry-run` builds the next plan and reports operation-level diff status against the existing install-state.

### R3. Managed file visibility

The dry-run report identifies missing managed files, newly planned managed files, unchanged managed files, and files that would change.

### R4. User modification detection

The dry-run report flags possible user modifications for managed destinations whose current content differs from the expected canonical/apply output. Because earlier install-state versions do not store hashes, this is a conservative signal.

### R5. No writes

`update --dry-run` never writes destination files, backup files, or install-state. Non-dry-run `update` must fail closed until a later implementation.

## Acceptance criteria

- `agent-deploy update --dry-run --json` emits valid JSON.
- Missing install-state fails with a clear error.
- A modified managed copy-file destination is reported as possible user modification.
- Non-dry-run `update` is rejected.
- `npm test` passes.
- `npm run validate` passes.
