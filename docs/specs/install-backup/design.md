# Install Backup Design

## Approach

Implement backup as an apply-stage safety feature, not as a target adapter concern. Target adapters already produce concrete destination paths; apply can inspect those paths, collect existing files, validate the resulting install-state, then copy backups before mutating destinations.

## Component / module design

```text
src/cli.js
  parses --backup and passes it to applyPlan

src/apply.js
  collects backup entries before writes
  validates install-state including backup metadata
  copies backup entries before destination writes

src/backup.js
  owns backup-root selection, entry collection, and backup file copying

src/state.js
  includes backup metadata in buildState()
  keeps schema validation as the write gate

schemas/install-state.schema.json
  allows top-level backup metadata
```

`backup.js` is a file-system adapter/helper. It depends only on paths, fs, and path-safety helpers. It does not know target-specific harness semantics.

## File / install layout

Project scope:

```text
project/.agent-deploy/backups/<timestamp>/<relative-destination-path>
```

Home scope:

```text
<target-config-root>/backups/<timestamp>/<relative-destination-path-from-home>
```

For example, project Codex `AGENTS.md` is backed up as:

```text
.agent-deploy/backups/2026-01-01T00-00-00.000Z/AGENTS.md
```

## Alternatives considered

- Always backup without an option → rejected because it changes apply side effects and disk usage by default.
- Adapter-specific backup paths → rejected because backup is a lifecycle concern common to all targets.
- Store backups next to each overwritten file → rejected because centralized backup roots are easier for future restore/uninstall flows.

## Risks

- Partial apply after backup copy could still fail later → mitigated by copying backups before writes and recording entries in state; full transaction/restore is a future command.
- Backup directory collision on repeated timestamp in tests → mitigated by preserving relative destination paths and using install timestamp as the run identifier.
