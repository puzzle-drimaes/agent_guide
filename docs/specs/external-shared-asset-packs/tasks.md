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
- [x] Add `.agents/externals/` Markdown scanner for drop-in skill/doc proposals.
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

- [x] Add `--pack <path>` parsing to CLI.
- [x] Refactor manifest loading so planner can receive composed manifests.
- [x] Add pack manifest composition with collision detection.
- [x] Add conflict resolution provenance for `keep-existing`, `add-namespaced`, `rename-proposed`, and `replace-existing`.
- [x] Add explicit pack module/profile selection to plan/apply.
- [x] Extend smoke tests for pack dry-run and apply.

Implementation notes:

- `plan`/`apply` now accept `--pack DIR[,DIR]`.
- Pack manifests are composed after validation; base bundle remains the base layer.
- Pack modules retain their own `assetRoot`, so target adapters can copy from pack assets without mixing files into bundled `assets/`.
- `source.packs` is recorded in install-state for applied pack plans.
- `--conflict-resolution <json-file>` records reviewed decisions in install-state; `add-namespaced` can transform colliding copy-file destinations to `shared/<pack-id>/...`; unresolved conflicts still fail closed.

## Phase 3 — Provenance and governance

- [x] Extend `install-state.schema.json` with `source.packs`.
- [x] Compute deterministic pack digest.
- [x] Record pack id/version/source/digest/root in install-state.
- [x] Add `shared-approved` profile extension opt-in.
- [x] Document approval workflow for shared packs.

Implementation notes:

- `src/packs/digest.js` computes `sha256:<64-hex>` from sorted normalized pack entries.
- Text line endings are normalized to LF, and the absolute pack root path is excluded from the digest.
- `.git/`, other VCS metadata, OS metadata files, and editor temp/backup files are excluded.
- `source.packs[]` now records `id`, `version`, `packType`, `digest`, `source`, and `root`.
- CLI `--enable-pack-extensions` applies `defaultProfileExtensions` only from `shared-approved` packs.
- Extension targets must be bundled base profiles; `project-local` and `candidate` packs cannot mutate builtin profiles.
- Shared-approved approval criteria now cover source/license, validation, metadata, security, conflict decisions, reviewers, and pack digest.
- Candidate promotion and conflict-resolution record policies are documented; runtime conflict-decision capture now records reviewed decisions in install-state, and `add-namespaced` transforms copy-file destination collisions under `shared/<pack-id>/...`.

## Phase 4 — Production hardening

- [ ] Add secret scan and unicode safety scan to pack validation.
- [ ] Add allowlist for MCP assets from packs.
- [ ] Add release checklist for shared-approved packs.
- [ ] Add rollback/uninstall implications once uninstall exists.
