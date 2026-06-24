# Install Conflict Policy Requirements

## Context

`agent-deploy apply` now supports `--backup`, but write behavior is still implicit. Before update/repair/uninstall can safely rely on install-state, apply needs an explicit conflict policy that decides what to do when a destination already exists.

Related plan: `TODO.md` section 6.1 backup/conflict policy.

## SDD mode

SDD-full, because conflict policy affects installer lifecycle safety, apply write behavior, and install-state provenance.

## Scope

In scope:

- Add `--conflict-policy <policy>` for apply.
- Support a first complete policy set for current operation kinds:
  - `managed-overwrite`
  - `preserve-existing`
  - `skip`
  - `append`
  - `merge-json`
  - `merge-toml`
  - `conflict-error`
- Record the selected policy and runtime decisions in install-state.
- Keep dry-run non-writing.

Out of scope:

- Interactive conflict review.
- Per-file policy configuration.
- Restore/update/repair/uninstall commands.
- Hash-based managed-file drift detection.

## Requirements

### R1. Explicit policy option

`agent-deploy apply --conflict-policy <policy>` selects the apply conflict policy. If omitted, `managed-overwrite` preserves existing behavior.

### R2. Policy semantics

- `managed-overwrite`: apply all planned operations using their native strategies.
- `preserve-existing`: existing project-owned files take priority; non-destructive operations
  (`append-markdown`, `merge-json`, `merge-toml`) are allowed, while conflicting `copy-file`
  operations are skipped and recorded.
- `skip`: when a destination exists, skip that write and record a skip reason.
- `append`: allow only `append-markdown` conflicts; conflicting non-append operations fail.
- `merge-json`: allow only `merge-json` conflicts; conflicting non-json operations fail.
- `merge-toml`: allow only `merge-toml` conflicts; conflicting non-toml operations fail.
- `conflict-error`: any existing destination causes apply to fail before writes.

Non-existing destinations are always allowed.

### R3. Fail closed before writes

Invalid policy values and disallowed conflicts must fail before any destination or backup write occurs.

### R4. Install-state provenance

Install-state records the selected policy and per-conflict decisions (`write`, `skip`, or `error`) so future lifecycle commands can reason about what happened.

## Acceptance criteria

- CLI help documents `--conflict-policy`.
- `skip` policy skips existing destinations and writes install-state with skip operations.
- `preserve-existing` appends/merges existing root or MCP config files but skips existing
  copied files, and records both write and skip decisions.
- `conflict-error` fails before writes and does not create backup/state artifacts.
- `append`, `merge-json`, and `merge-toml` allow only matching operation-kind conflicts.
- `npm test` passes.
- `npm run validate` passes.
