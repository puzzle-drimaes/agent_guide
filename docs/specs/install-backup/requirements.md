# Install Backup Requirements

## Context

`agent-deploy apply` currently writes managed files and install-state, but it does not preserve pre-existing files before overwriting or merging. Backup is a prerequisite for safer update/repair/uninstall work because later lifecycle commands must be able to trust install-state and recover from failed or unwanted apply runs.

Related plan: `TODO.md` section 6.1 backup/conflict policy.

## SDD mode

SDD-full, because backup affects installer lifecycle safety, rollback foundations, and install-state schema/provenance.

## Scope

In scope:

- Add an explicit `--backup` apply option.
- Copy existing destination files to a backup directory before apply writes.
- Record backup metadata in install-state and validate it with the runtime schema.
- Keep dry-run behavior non-writing.

Out of scope:

- Full conflict policy (`managed-overwrite`, `conflict-error`, etc.).
- Restore command, repair command, update diff, or uninstall implementation.
- Content hashing of backups.

## Requirements

### R1. Explicit backup option

`agent-deploy apply --backup` enables backup behavior. Apply without `--backup` keeps the existing behavior except install-state records backup as disabled.

### R2. Backup location

Project-scope backups are stored under `project/.agent-deploy/backups/<timestamp>/`. Home-scope backups are stored under the target config root's `backups/<timestamp>/` directory.

### R3. Existing file preservation

When backup is enabled, every existing file destination that apply will write is copied before the write. Existing install-state is also backed up before it is replaced. Non-existing destinations are not backed up.

### R4. Install-state provenance

Install-state records whether backup was enabled, the backup root, and each copied source/backup path pair. Runtime install-state validation must reject malformed backup metadata before writes.

## Acceptance criteria

- `apply --backup` creates backup copies for existing managed files and previous install-state.
- Backup metadata validates against `schemas/install-state.schema.json`.
- `apply --dry-run --backup` writes nothing.
- `npm test` passes.
- `npm run validate` passes.
