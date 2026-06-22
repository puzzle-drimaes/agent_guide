# External / Shared Asset Packs — Review

## Spec coverage review

| Requirement | Covered by design |
|---|---|
| Pack structure | `design.md` section 3 |
| Manifest/catalog/profile merge | `design.md` section 4 |
| External Markdown proposals | `design.md` section 3.1 |
| User-driven conflict resolution | `design.md` section 4.4 |
| Dry-run/apply flow | `design.md` section 5 |
| Validation before apply | `design.md` section 6 |
| Security restrictions | `design.md` section 7 |
| Install-state provenance | `design.md` section 8 |
| Architecture boundary | `design.md` section 9 |

## Risk review

### R1. Pack silently changes company defaults

Mitigation: pack-local profiles only by default. Builtin profile extension requires `shared-approved` and explicit `--enable-pack-extensions`.

### R2. Sensitive shared documents leak into default installs

Mitigation: `confidential` assets are forbidden in default profile extensions. Candidate packs cannot extend builtin profiles.

### R3. Path escape or symlink attack

Mitigation: pack validation reuses path-safety/symlink guard and rejects absolute/`..` paths before planning.

### R4. Destination collisions across packs

Mitigation: composition and target planning fail on module id, asset id, and destination collisions.

### R5. Pack applies executable behavior

Mitigation: v1 packs are declarative only; install-time hooks/scripts/postinstall/network fetch are denied.

### R6. Drop-in files overwrite existing rules or docs

Mitigation: `.agent-packs/externals/` is a candidate area only. Proposed files install under target-specific
`shared/<pack-id>/` by default. Canonical rule replacement is blocked unless a separate approved rule-change
workflow is used.

### R7. Agent chooses conflict behavior without user intent

Mitigation: conflict resolution requires an explicit user decision. The decision and reason are recorded in
pack provenance/install-state.

## Open decisions for implementation

- Whether pack profiles should be addressed as `<pack-id>:<profile>` or plain profile ids in the CLI.
- Whether `templates/` should become a first-class target path or remain under `prompts/` for v1.
- Whether conflict resolution records should live only in install-state or also in a pack-side decision log.
- Whether `shared-approved` pack approval lives in GitHub review, Notion registry, or both.

## Review conclusion

The design is suitable as a safe v1 direction because it preserves the existing bundled flow,
keeps external packs read-only and declarative, and blocks automatic default-profile mutation unless a pack is explicitly approved.

## Phase 1 implementation review

- `schemas/asset-pack.schema.json` now captures the required `pack.json` shape, including `packType`, `id`, `version`, `owner`, and `reviewStatus`.
- `src/packs/pack-validator.js` validates pack structure, module/profile references, path safety, reused asset metadata checks, catalog parity, and base-bundle conflicts.
- `src/packs/externals-scanner.js` treats `.agent-packs/externals/` style folders as read-only candidate metadata sources.
- `src/packs/conflicts.js` detects module/profile/asset/destination collisions and exposes the required user decision choices.
- Smoke fixtures cover a valid pack, missing `pack.json`, path escape, id collision, and externals Markdown scanning.

Remaining Phase 2 risk: planner integration must keep pack logic out of target adapters by passing a composed manifest object into planning.

## Phase 2 implementation review

- CLI `plan`/`apply` accepts `--pack DIR[,DIR]` and prints composed pack metadata in human-readable plans.
- `src/packs/pack-composer.js` validates packs, sorts them by trust layer, and composes modules/profiles with the base bundle.
- Target adapters now honor a module-level `assetRoot`, keeping pack file reads separate from bundled assets.
- Applied pack plans write `source.packs` provenance to install-state.
- Smoke tests cover explicit pack module planning, pack-local profile apply, install-state pack provenance, and CLI dry-run output.

Remaining risk: conflict resolution is still fail-closed only. Interactive `keep-existing` / `add-namespaced` /
`rename-proposed` / `replace-existing` provenance remains a follow-up task.

## Phase 3 provenance implementation review

- `src/packs/digest.js` computes deterministic `sha256:<64-hex>` pack digests from sorted normalized entries.
- The digest includes pack files, manifests, assets, catalog, and other non-ignored pack contents while excluding VCS/OS/editor temporary files.
- `pack-validator` exposes the digest, `pack-composer` carries it into composed pack metadata, and apply writes it under `source.packs[].digest`.
- `install-state.schema.json` now models `source.packs[]` with `id`, `version`, `packType`, `digest`, `source`, and `root`.
- Smoke tests cover digest shape, ignored temp files, and install-state provenance recording.

Remaining Phase 3 risk: builtin profile extension is still explicit profile/module only. `--enable-pack-extensions`
for `shared-approved` packs remains a follow-up task.
