# Install Repair Dry-Run Design

## Approach

Implement repair as a new usecase/helper module, mirroring update. CLI parses
user intent; `src/repair.js` reads state, classifies recorded managed operations
by on-disk existence, and produces a dry-run report.

Repair differs from update in its source of truth: update rebuilds the next plan
from the current asset bundle and diffs it; repair reads the recorded
install-state operations and checks whether their destinations still exist. The
dry-run slice therefore needs no `buildPlan` call — install-state alone is
sufficient to detect missing managed files.

## Component / module design

```text
src/state.js
  readState(statePath) validates existing install-state (reused)

src/repair.js
  analyzeRepair(request)   reads state, classifies managed ops as present/missing
  buildRepairDryRun(request)  shapes the dry-run report

src/cli.js
  adds repair command
  requires --dry-run for now (non-dry-run fails closed)
  prints human or JSON report
```

The repair helper is an application/usecase layer. It depends on state and the
target registry only to locate the state path; it does not know target-specific
adapter internals beyond the recorded operations.

## Diff model

Each managed operation recorded in install-state (`dest` set, `kind` not `skip`)
is classified as one of:

- `present` — destination exists on disk
- `missing` — destination is absent and would be restored by repair

Recorded `skip` operations and operations without a destination are not managed
files and are excluded from the repair report.

## Restore signal

Existence is a conservative, unambiguous signal: a missing managed destination
clearly should be restored. Content/hash drift (a present-but-modified file) is
out of scope here and intentionally deferred — it overlaps with update's
`possible-user-modified` detection and needs historical hashes to be authoritative.

## Risks

- A present file may still be corrupt or partially written; existence-based
  detection will not catch that. Acceptable for this slice; hash-based detection
  is a documented follow-up.
- Pack-sourced or merge/append destinations that are missing will be reported as
  `missing`, but restoring them needs operation content that install-state does
  not store. The write-repair follow-up will re-derive content (e.g. by rebuilding
  the plan), so the dry-run only reports intent here.
