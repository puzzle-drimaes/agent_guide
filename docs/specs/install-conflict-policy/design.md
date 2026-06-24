# Install Conflict Policy Design

## Approach

Implement conflict policy as an apply-stage policy helper. Target adapters still produce desired operations. Apply then resolves those operations against the current filesystem and selected policy before backup, validation, and writes.

## Component / module design

```text
src/cli.js
  parses --conflict-policy and passes it to applyPlan

src/conflict-policy.js
  validates policy names
  resolves planned operations into effective operations
  returns conflict provenance decisions

src/apply.js
  resolves conflict policy before backup/state construction
  backs up and writes only effective operations

src/state.js
  records conflictPolicy metadata

schemas/install-state.schema.json
  validates conflictPolicy metadata
```

The helper is a domain/policy boundary for apply-time file conflicts. It avoids target-specific branching and keeps adapters focused on mapping canonical assets to harness layouts.

## Policy details

`managed-overwrite` is the compatibility default. It does not imply destructive overwrite for all operation kinds; merge and append operations keep their current non-destructive semantics.

`preserve-existing` is the recommended first-adoption policy for projects that already use an agent. It keeps
project-owned destination files authoritative, but still permits operation kinds that are non-destructive by design:
managed Markdown block append/upsert, JSON deep merge, and TOML add-only merge. Existing `copy-file` destinations are
converted to visible skips so the project can adopt non-conflicting company assets without silently replacing local
rules, skills, or prompts.

`skip` transforms existing-destination operations into `skip` operations with a reason. This makes install-state reflect the actual write decision.

`append`, `merge-json`, and `merge-toml` are allow-list policies for matching operation kinds. They fail closed when an existing destination would require a different strategy.

`conflict-error` fails on any existing destination before backup or apply writes.

## Alternatives considered

- Put conflict policy in target adapters → rejected because conflict behavior is common apply policy.
- Implement only `skip` and `conflict-error` → rejected because TODO explicitly lists append/json/toml policy modes.
- Record policy only in CLI output → rejected because update/repair/uninstall need install-state provenance.

## Risks

- Existing generated install-state files lack conflictPolicy → acceptable because runtime validation applies to newly written state; migration can be handled during update/repair design.
- `skip` policy may skip root instruction updates and leave old instructions → mitigated by explicit skip reason in install-state.
