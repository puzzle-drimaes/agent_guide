# External / Shared Asset Packs — Tasks

## Phase 0 — Design baseline

- [x] Define pack categories and trust model.
- [x] Define pack directory layout and `pack.json` fields.
- [x] Define manifest/profile/catalog merge policy.
- [x] Define validation and security policy.
- [x] Define install-state provenance extension.

## Phase 1 — Validation only

- [x] Add `schemas/asset-pack.schema.json`.
- [x] Add `scripts/check-pack.js` for a single pack root.
- [x] Add `.agent-packs/externals/` Markdown scanner for drop-in skill/doc proposals.
- [x] Generate candidate pack metadata from externals Markdown files without modifying source files.
- [x] Detect conflicts with existing docs/rules/assets and present user decision options.
- [x] Reuse asset frontmatter and catalog parity validators for pack asset roots.
- [x] Add symlink/path escape checks for pack root.
- [x] Add fixture packs under `agent-deploy/test/fixtures/packs/`.

Implementation notes:

- `scripts/check-pack.js --pack <pack-root>` validates a declarative pack root and fails on conflicts by default.
- `scripts/check-pack.js --externals <externals-root>` scans `skills/`, `docs/`, and `prompts/` Markdown into read-only candidate pack metadata.
- Conflict reports expose the explicit decision set: `keep-existing`, `add-namespaced`, `rename-proposed`, `replace-existing`.
- Phase 1 remains validation-only; planner/apply integration is still Phase 2.

## Phase 2 — Planner integration

- [ ] Add `--pack <path>` parsing to CLI.
- [ ] Refactor manifest loading so planner can receive composed manifests.
- [ ] Add pack manifest composition with collision detection.
- [ ] Add conflict resolution provenance for `keep-existing`, `add-namespaced`, `rename-proposed`, and `replace-existing`.
- [ ] Add explicit pack module/profile selection to plan/apply.
- [ ] Extend smoke tests for pack dry-run and apply.

## Phase 3 — Provenance and governance

- [ ] Extend `install-state.schema.json` with `source.packs`.
- [ ] Compute deterministic pack digest.
- [ ] Record pack id/version/source/digest/root in install-state.
- [ ] Add `shared-approved` profile extension opt-in.
- [ ] Document approval workflow for shared packs.

## Phase 4 — Production hardening

- [ ] Add secret scan and unicode safety scan to pack validation.
- [ ] Add allowlist for MCP assets from packs.
- [ ] Add release checklist for shared-approved packs.
- [ ] Add rollback/uninstall implications once uninstall exists.
