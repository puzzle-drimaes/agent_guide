# Install Uninstall Write Design

## Approach

Extend `src/uninstall.js` from dry-run analysis into a lifecycle usecase with a
write entry point. The CLI remains thin: parse `--dry-run`, `--backup`, and
`--on-user-modified`, then delegate to the usecase.

The usecase continues to treat install-state as the source of truth. It
reverse-replays recorded managed operations so teardown order mirrors install
order in reverse.

## Component design

```text
src/uninstall.js
  analyzeUninstall(request)
  buildUninstallDryRun(request)
  applyUninstall(request, options)

src/cli.js
  uninstall --dry-run: existing report path
  uninstall: actual write path
```

`applyUninstall()` belongs to the application/usecase layer. It depends on state,
path-safety, backup, and target registry helpers, not on target-specific adapter
internals beyond base root and state path resolution.

## Revert behavior

- `copy-file`: delete the destination when the file hash still matches the
  recorded `contentHash`; otherwise classify as likely user-modified.
- `append-markdown`: remove the recorded managed marker block and keep the file.
- `merge-json`: recursively remove keys from the recorded merge payload and keep
  unrelated user keys.
- `merge-toml`: remove recorded scalar keys from generated table sections and
  keep unrelated user lines/tables.

Shared files are never deleted by uninstall, even if the managed contribution was
the only content.

## User-modified policy

Default policy is `fail`. The explicit policies are:

- `fail`: abort before any mutation if any managed destination looks modified.
- `skip`: preserve modified destinations and continue with safe teardown items.
- `force`: delete/revert the recorded managed destination or keys despite drift.

## Empty directory cleanup

After successful mutation, collect parents of deleted files and install-state,
then remove only directories that are empty and still inside the target safety
root. Cleanup stops at the safety root.

## Risks

- JSON/TOML reverse merge cannot know whether an empty parent object/table
  pre-existed before install. The implementation removes recorded keys and prunes
  empty generated table/object containers conservatively, while preserving any
  unrelated user content.
- `force` can remove user-edited managed content. It is opt-in and should be
  paired with `--backup` for safer operation.
