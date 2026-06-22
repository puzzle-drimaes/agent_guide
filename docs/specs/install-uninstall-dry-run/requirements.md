# Install Uninstall Dry-Run Requirements

## Context

Backup, conflict policy, update (dry-run + apply), and repair (dry-run) are now
available. The next lifecycle step is uninstall. Uninstall reverse-replays the
recorded install-state operations to tear down a previous install, but doing
destructive deletes without first proving install-state-based targeting and
safety visibility would be risky. This slice implements a non-writing uninstall
dry-run that the later uninstall write can build on.

Related plan: `TODO.md` section 6.4 uninstall.

## SDD mode

SDD-full, because uninstall is an installer lifecycle feature that consumes
install-state and performs destructive file removal; managed-file safety is
critical.

## Scope

In scope:

- Add `agent-deploy uninstall --dry-run`.
- Read and validate the existing install-state.
- Reverse-replay the recorded managed operations and classify what uninstall
  would do to each destination.
- Report deletion targets and reverted (kept) files, distinguishing fully managed
  files from shared files, plus the install-state provenance file.

Out of scope:

- Non-dry-run uninstall writes (actual deletion / block-and-key reversion).
- User-modified detection / fail-closed policy for deletes (a write-step concern,
  mirroring update's `--on-user-modified`).
- Empty-directory cleanup after deletion.
- Backup-archive removal.

## Requirements

### R1. Existing state read

`uninstall --dry-run` reads the current target install-state from the adapter
state path and rejects missing or invalid state.

### R2. Reverse-replay classification

`uninstall --dry-run` reverse-replays the recorded managed operations (`dest`
set, `kind` not `skip`) and classifies each destination by what uninstall would
do, based on operation kind and on-disk existence.

### R3. Managed-only safety

Fully managed files (`copy-file`) are deletion targets. Shared files that we only
merged or appended into (`append-markdown`/`merge-json`/`merge-toml`) are reverted
in place — the managed block/keys would be removed, but the file (which may hold
user-authored content) is kept, never deleted.

### R4. State teardown visibility

The dry-run reports the install-state provenance file as a deletion target.

### R5. No writes

`uninstall --dry-run` never deletes or modifies any file. Non-dry-run
`uninstall` must fail closed until a later implementation.

## Acceptance criteria

- `agent-deploy uninstall --dry-run --json` emits valid JSON.
- Missing install-state fails with a clear error.
- A `copy-file` managed destination is reported as `would-delete`.
- A shared `append-markdown`/`merge-*` destination is reported as `would-revert`,
  not `would-delete`.
- The install-state file is reported as a deletion target.
- Non-dry-run `uninstall` is rejected.
- `npm test` passes.
- `npm run validate` passes.
- TODO/Finish and this spec's review are updated as a result.
