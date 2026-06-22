# Install Uninstall Dry-Run Design

## Approach

Implement uninstall as a new usecase/helper module, mirroring repair and update.
CLI parses user intent; `src/uninstall.js` reads state, reverse-replays the
recorded managed operations, classifies each destination, and produces a dry-run
report.

Like repair, uninstall treats the recorded install-state as the source of truth —
no `buildPlan` call is needed for the dry-run. Unlike repair (which detects
missing files to restore), uninstall reports what teardown would remove.

## Component / module design

```text
src/state.js
  readState(statePath) validates existing install-state (reused)

src/uninstall.js
  analyzeUninstall(request)   reads state, reverse-replays + classifies managed ops
  buildUninstallDryRun(request)  shapes the dry-run report (incl. state-file teardown)

src/cli.js
  adds uninstall command
  requires --dry-run for now (non-dry-run fails closed)
  prints human or JSON report
```

The uninstall helper is an application/usecase layer. It depends on state and the
target registry only to locate the state path; it does not know target-specific
adapter internals beyond the recorded operations.

## Reverse-replay and classification

Managed operations (`dest` set, `kind` not `skip`) are processed in reverse of the
recorded order, so the dry-run faithfully previews teardown order (last written →
first removed). Each destination is classified as one of:

- `would-delete` — fully managed file (`copy-file`) that exists; uninstall would
  delete the whole file.
- `would-revert` — shared file (`append-markdown`/`merge-json`/`merge-toml`) that
  exists; uninstall would remove only the managed block/keys and keep the file,
  because user-authored content may coexist there.
- `already-absent` — recorded managed destination no longer exists; nothing to do.

Recorded `skip` operations and operations without a destination are not managed
files and are excluded.

The install-state provenance file is reported separately as a `stateFile`
teardown target (`would-delete` if present, `already-absent` otherwise), keeping
the per-operation `items` list homogeneous with real operation kinds.

## Safety model

The `copy-file` vs merge/append split is the safety boundary that implements
"managed files only / never delete user-created files": we created `copy-file`
destinations outright, but merge/append destinations are user-owned files we only
contributed to. Conservatively reverting the latter (rather than deleting) avoids
data loss.

## Risks

- A `copy-file` destination the user later edited is still reported as
  `would-delete`; existence-based dry-run cannot see content drift. The actual
  delete write will add user-modified safety (fail-closed / explicit policy,
  mirroring update's `--on-user-modified`) — out of scope for this dry-run slice.
- `would-revert` reversion (block/key removal) and empty-directory cleanup are
  write-step concerns; the dry-run only reports intent.
