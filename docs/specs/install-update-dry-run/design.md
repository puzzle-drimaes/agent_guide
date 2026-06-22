# Install Update Dry-Run Design

## Approach

Implement update as a new usecase/helper module rather than adding more work to CLI. CLI parses user intent; `src/update.js` reads state, derives the update request, builds the next plan, and produces a dry-run report.

## Component / module design

```text
src/state.js
  readState(statePath) validates existing install-state

src/update.js
  reads current install-state
  derives profile/modules/pack roots from state unless overridden
  builds next plan
  compares current operations with next operations
  computes dry-run report

src/cli.js
  adds update command
  requires --dry-run for now
  prints human or JSON report
```

The update helper is an application/usecase layer. It depends on planner/state and small content projection helpers, but it does not know target-specific adapter internals beyond plan operations.

## Diff model

Each next operation is classified as one of:

- `unchanged`
- `would-update`
- `missing-would-create`
- `new-would-apply`
- `possible-user-modified`
- `skip-record`

Existing operations absent from the next plan are reported as `removed-from-plan`.

## User-modification signal

Without historical hashes, update cannot prove whether a difference came from a user edit or an asset update. The first slice flags file differences as `possible-user-modified` when the destination belongs to the previous install-state and current content differs from the expected output of the next operation.

## Risks

- Conservative drift detection may over-report user modifications after bundled asset changes. This is acceptable for dry-run and should be refined with hashes in a future update implementation.
- Pack roots recorded in install-state may no longer exist. The next plan build will fail clearly; pack migration is out of scope.
