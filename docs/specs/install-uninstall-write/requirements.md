# Install Uninstall Write Requirements

## Context

`agent-deploy uninstall --dry-run` already reverse-replays install-state and
classifies managed destinations. The next lifecycle slice is the actual write
path: remove fully managed files, revert managed contributions in shared files,
and delete the install-state record without touching user-created content.

Related plan: `TODO.md` section 6.4 uninstall.

## SDD mode

SDD-full, because uninstall writes are destructive lifecycle operations that
consume trusted install-state, mutate user project files, and must preserve
path-safety, symlink guard, and user-modified fail-closed behavior.

## Scope

In scope:

- Enable non-dry-run `agent-deploy uninstall`.
- Delete fully managed `copy-file` destinations when they still match
  install-state managed content.
- Revert shared `append-markdown`, `merge-json`, and `merge-toml` contributions
  in place while keeping the containing file.
- Refuse likely user-modified managed content by default, with explicit
  `--on-user-modified skip|force` options.
- Optionally backup changed/deleted files and install-state with `--backup`.
- Delete the install-state file after successful teardown.
- Remove empty directories created by managed file deletion, stopping at the
  target safety root.

Out of scope:

- Restoring from backup archives.
- Deleting backup archives.
- Removing files that were never recorded in install-state.

## Requirements

### R1. State-driven write

`uninstall` reads and validates the current target install-state, then uses the
recorded operations as the source of truth. It must not rebuild a fresh plan or
remove unrecorded files.

### R2. Managed-only teardown

`copy-file` destinations are deleted. `append-markdown`, `merge-json`, and
`merge-toml` destinations are reverted in place and preserved as files.

### R3. User-modified fail-closed

If managed content appears modified or missing from a still-existing destination,
`uninstall` fails by default. `--on-user-modified skip` preserves those files and
continues with safe items. `--on-user-modified force` removes/reverts the managed
portion despite drift.

### R4. Safety guards

Every touched destination and the install-state path must stay inside the target
safety root and pass the symlink escape guard before any write/delete occurs.

### R5. Backup support

When `--backup` is supplied, uninstall copies all existing files it will modify
or delete, plus install-state, into a timestamped backup root before mutation.

### R6. Empty directory cleanup

After deleting managed files and install-state, uninstall removes empty parent
directories up to, but not including, the target safety root.

## Acceptance criteria

- `agent-deploy uninstall` removes managed copy-file destinations and install-state.
- Shared files such as `AGENTS.md` remain present after managed block removal.
- User-modified copy-file destinations fail by default.
- `--on-user-modified skip` preserves user-modified destinations while removing
  other managed files.
- `--backup` captures deleted/reverted files and install-state.
- Empty managed directories are cleaned up when no files remain.
- `uninstall --dry-run --json` remains valid JSON and non-writing.
- `npm test`, `npm run validate`, and `git diff --check` pass.
